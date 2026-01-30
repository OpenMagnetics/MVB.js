#!/usr/bin/env node
/**
 * Run the quarter torus debug test
 */

import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

const PORT = 5199;
const OUTPUT_DIR = path.join(projectRoot, 'output');

async function startViteServer() {
    return new Promise((resolve, reject) => {
        const vite = spawn('npx', ['vite', '--port', PORT.toString(), '--strictPort'], {
            cwd: projectRoot,
            stdio: ['ignore', 'pipe', 'pipe'],
            shell: true
        });

        let output = '';
        const timeout = setTimeout(() => {
            reject(new Error('Vite server failed to start within 30 seconds'));
        }, 30000);

        vite.stdout.on('data', (data) => {
            output += data.toString();
            if (output.includes('ready in') || output.includes('Local:')) {
                clearTimeout(timeout);
                setTimeout(() => resolve(vite), 1000);
            }
        });

        vite.stderr.on('data', (data) => {
            const msg = data.toString();
            if (!msg.includes('ExperimentalWarning')) {
                console.error('Vite stderr:', msg);
            }
        });

        vite.on('error', (err) => {
            clearTimeout(timeout);
            reject(err);
        });
    });
}

async function run() {
    console.log('Starting Vite server...');
    const vite = await startViteServer();
    console.log(`Vite server ready on port ${PORT}`);
    
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Expose file saving function
        await page.exposeFunction('saveFile', async (filename, base64Data) => {
            const buffer = Buffer.from(base64Data, 'base64');
            const filePath = path.join(OUTPUT_DIR, filename);
            fs.writeFileSync(filePath, buffer);
            console.log(`  Saved: ${filename} (${buffer.length} bytes)`);
        });
        
        // Forward console logs
        page.on('console', msg => {
            console.log(msg.text());
        });
        
        page.on('pageerror', err => {
            console.error('Page error:', err.message);
        });
        
        console.log(`\nLoading test page...`);
        await page.goto(`http://localhost:${PORT}/test_quarter_torus.html`, {
            timeout: 120000,
            waitUntil: 'domcontentloaded'
        });
        
        // Wait for tests to complete
        await page.waitForFunction('window.testsComplete === true', { timeout: 120000 });
        
        // Check for errors
        const error = await page.evaluate(() => window.testError);
        if (error) {
            console.error('Test error:', error);
        }
        
        console.log('\nDebug test complete!');
        
    } finally {
        if (browser) await browser.close();
        if (vite) vite.kill();
    }
}

run().catch(console.error);
