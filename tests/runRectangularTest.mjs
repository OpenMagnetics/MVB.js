import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectDir = join(__dirname, '..');

const PORT = 5201;

function startViteServer() {
  return new Promise((resolve, reject) => {
    console.log('Starting Vite server...');
    const vite = spawn('npx', ['vite', '--port', String(PORT)], {
      cwd: projectDir,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let started = false;
    vite.stdout.on('data', (data) => {
      const text = data.toString();
      if (text.includes('ready') && !started) {
        started = true;
        console.log(`Vite server running on port ${PORT}`);
        resolve(vite);
      }
    });

    vite.stderr.on('data', (data) => {
      // Ignore warning stderr
    });

    vite.on('error', reject);
    
    setTimeout(() => {
      if (!started) reject(new Error('Vite server did not start in time'));
    }, 30000);
  });
}

const vite = await startViteServer();

try {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => {
    const text = msg.text();
    // Skip JSHandle logs
    if (!text.startsWith('JSHandle@')) {
      console.log(text);
    }
  });
  page.on('pageerror', err => console.error('Page error:', err.message));

  await page.goto(`http://localhost:${PORT}/test_bug_rectangular.html`, { waitUntil: 'networkidle0', timeout: 120000 });

  // Wait for tests to complete
  await page.waitForFunction(() => {
    const output = document.getElementById('output');
    return output && output.textContent.includes('Tests Complete');
  }, { timeout: 120000 });

  // Get the full output text
  const outputText = await page.evaluate(() => {
    return document.getElementById('output').innerText;
  });
  console.log('\n=== Full Test Output ===');
  console.log(outputText);

  await browser.close();
} finally {
  vite.kill();
}
