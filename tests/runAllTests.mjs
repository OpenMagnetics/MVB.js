/**
 * Self-contained Puppeteer test runner
 * Starts its own Vite server and runs tests
 * 
 * Usage:
 *   node tests/runAllTests.mjs           # Run all tests
 *   node tests/runAllTests.mjs simple    # Run simple_test.html only
 *   node tests/runAllTests.mjs magnetic  # Run magnetic_test.html only
 */

import puppeteer from 'puppeteer';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectDir = join(__dirname, '..');
const outputDir = join(projectDir, 'output');

// Parse command line arguments
const args = process.argv.slice(2);
const testFilter = args[0] || 'all';

// Test files to run - mirrors Python test_magnetic.py and test_builder.py
const TEST_FILES = {
  extrude: { file: 'test_extrude.html', name: 'Extrude Position Test' },
  scale: { file: 'scale_test.html', name: 'Scale Test' },
  concentric: { file: 'concentric_test.html', name: 'Concentric Test' },
  magnetic: { file: 'test_magnetic.html', name: 'Magnetic Tests (mirrors test_magnetic.py)' },
  shapes: { file: 'test_shapes.html', name: 'Shape Tests (mirrors test_builder.py)' }
};

// Create output directory
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

const PORT = 5199;

function startViteServer() {
  return new Promise((resolve, reject) => {
    console.log('Starting Vite server...');
    const vite = spawn('npx', ['vite', '--port', String(PORT)], {
      cwd: projectDir,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let started = false;
    const timeout = setTimeout(() => {
      if (!started) {
        reject(new Error('Vite server startup timeout'));
      }
    }, 30000);

    vite.stdout.on('data', (data) => {
      const text = data.toString();
      if (text.includes('ready in') || text.includes(`localhost:${PORT}`)) {
        if (!started) {
          started = true;
          clearTimeout(timeout);
          console.log(`Vite server ready on port ${PORT}`);
          resolve(vite);
        }
      }
    });

    vite.stderr.on('data', (data) => {
      console.error('Vite stderr:', data.toString());
    });

    vite.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function runTestFile(browser, testKey, testInfo) {
  console.log('\n========================================');
  console.log(`Running: ${testInfo.name}`);
  console.log('========================================\n');

  const page = await browser.newPage();

  try {
    // Capture console logs
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        console.log('Browser Error:', text);
      } else if (type === 'warning') {
        console.log('Browser Warning:', text);
      } else {
        // Log all messages to see what's happening
        console.log(text);
      }
    });

    // Capture page errors
    page.on('pageerror', err => {
      console.log('Page Error:', err.message);
    });

    // Set up file saving
    await page.exposeFunction('saveFile', async (filename, base64Data) => {
      const buffer = Buffer.from(base64Data, 'base64');
      const filepath = join(outputDir, filename);
      writeFileSync(filepath, buffer);
      console.log(`  Saved: ${filepath} (${buffer.length} bytes)`);
    });

    // Navigate to test page
    const url = `http://localhost:${PORT}/${testInfo.file}`;
    console.log(`Loading ${url}...`);
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 300000
    });

    console.log('Waiting for tests to complete...');
    
    // Wait for tests to complete (long timeout for complex geometry operations)
    await page.waitForFunction(
      () => window.testsDone === true ||
            document.body.textContent.includes('All basic tests completed') ||
            document.body.textContent.includes('All tests PASSED') ||
            document.body.textContent.includes('FATAL'),
      { timeout: 900000 }
    );

    // Get test results
    const results = await page.evaluate(() => {
      const output = document.getElementById('output') || document.getElementById('log');
      return output ? output.innerText : document.body.innerText;
    });

    console.log('\n--- Test Results ---');
    console.log(results);

    // Check if tests passed
    const passed = (results.includes('All basic tests completed') || 
                   results.includes('All tests PASSED') ||
                   results.includes('✓ All tests PASSED') ||
                   results.includes('✓ Test complete')) && 
                  !results.includes('FAILED') &&
                  !results.includes('FATAL');
    
    // Save STL files
    console.log('\n--- Saving STL Files ---');
    
    const stlCount = await page.evaluate(async () => {
      // Method 1: Check download links
      const links = document.querySelectorAll('a[download]');
      let count = 0;
      for (const link of links) {
        const filename = link.download;
        if (filename.endsWith('.stl')) {
          try {
            const response = await fetch(link.href);
            const blob = await response.blob();
            const reader = new FileReader();
            const base64 = await new Promise((resolve) => {
              reader.onload = () => resolve(reader.result.split(',')[1]);
              reader.readAsDataURL(blob);
            });
            await window.saveFile(filename, base64);
            count++;
          } catch (e) {
            console.error('Failed to save:', filename, e);
          }
        }
      }
      
      // Method 2: Check window.stlFiles (for magnetic tests)
      if (window.stlFiles && window.stlFiles.length > 0) {
        for (const { filename, blob } of window.stlFiles) {
          try {
            const reader = new FileReader();
            const base64 = await new Promise((resolve) => {
              reader.onload = () => resolve(reader.result.split(',')[1]);
              reader.readAsDataURL(blob);
            });
            await window.saveFile(filename, base64);
            count++;
          } catch (e) {
            console.error('Failed to save:', filename, e);
          }
        }
      }
      
      return count;
    });

    console.log(`\nSaved ${stlCount} STL files to: ${outputDir}`);
    return passed;
  } finally {
    await page.close();
  }
}

async function runTests(viteProcess) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let allPassed = true;
  const testsToRun = testFilter === 'all' 
    ? Object.entries(TEST_FILES)
    : [[testFilter, TEST_FILES[testFilter]]].filter(([k, v]) => v);

  if (testsToRun.length === 0) {
    console.error(`Unknown test: ${testFilter}`);
    console.log('Available tests:', Object.keys(TEST_FILES).join(', '));
    await browser.close();
    return false;
  }

  try {
    for (const [key, info] of testsToRun) {
      const passed = await runTestFile(browser, key, info);
      if (!passed) {
        allPassed = false;
      }
    }
    return allPassed;
  } finally {
    await browser.close();
  }
}

async function main() {
  let viteProcess = null;
  
  console.log('========================================');
  console.log('OpenMagnetics Virtual Builder - Tests');
  console.log('========================================');
  console.log(`Running: ${testFilter === 'all' ? 'All tests' : testFilter}`);
  
  try {
    viteProcess = await startViteServer();
    // Give it a moment to stabilize
    await new Promise(r => setTimeout(r, 2000));
    
    const passed = await runTests(viteProcess);
    
    if (passed) {
      console.log('\n✅ All tests PASSED!');
      viteProcess.kill();
      process.exit(0);
    } else {
      console.log('\n❌ Some tests FAILED!');
      viteProcess.kill();
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (viteProcess) viteProcess.kill();
    process.exit(1);
  }
}

main();
