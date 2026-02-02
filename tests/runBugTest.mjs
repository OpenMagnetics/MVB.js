import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectDir = join(__dirname, '..');

const PORT = 5199;

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
      console.error('Vite stderr:', data.toString());
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
  page.on('console', msg => console.log(msg.text()));
  page.on('pageerror', err => console.error('Page error:', err.message));

  await page.goto(`http://localhost:${PORT}/test_bug_web_0.html`, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, 10000));

  const text = await page.evaluate(() => document.getElementById('output').innerText);
  console.log('\n=== Test Output ===');
  console.log(text);

  await browser.close();
} finally {
  vite.kill();
}
