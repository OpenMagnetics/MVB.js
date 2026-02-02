const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

(async () => {
  // Start vite
  const vite = spawn('npx', ['vite', '--port', '5300'], { 
    cwd: '/home/alfonso/OpenMagnetics/MVB.js',
    stdio: ['ignore', 'pipe', 'pipe'] 
  });
  
  await new Promise(r => setTimeout(r, 5000));
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(msg.text()));
  
  try {
    await page.goto('http://localhost:5300/debug_rect_turn.html', { 
      waitUntil: 'domcontentloaded', 
      timeout: 90000 
    });
    
    await page.waitForFunction(() => window.testsDone === true, { timeout: 90000 });
  } catch(e) {
    console.error('Error:', e.message);
  }
  
  await browser.close();
  vite.kill();
  process.exit(0);
})();
