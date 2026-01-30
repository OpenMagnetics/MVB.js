import puppeteer from 'puppeteer';

const PORT = 5199;

async function runTest() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ 
    headless: true, 
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(msg.text()));
  
  console.log('Loading scale test page...');
  await page.goto(`http://localhost:${PORT}/scale_test.html`, { 
    waitUntil: 'networkidle0', 
    timeout: 120000 
  });
  
  console.log('Waiting for test to complete...');
  await page.waitForFunction(() => window.testsDone === true, { timeout: 120000 });
  
  // Get results
  const passed = await page.evaluate(() => window.allTestsPassed);
  console.log('Test passed:', passed);
  
  await browser.close();
  process.exit(passed ? 0 : 1);
}

runTest().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
