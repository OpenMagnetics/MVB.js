import puppeteer from 'puppeteer';

const PORT = process.env.PORT || 5204;

async function runTest() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  page.on('console', msg => {
    console.log('[PAGE]', msg.text());
  });

  page.on('pageerror', err => {
    console.error('[PAGE ERROR]', err.message);
  });

  console.log('Navigating to test page...');
  try {
    await page.goto('http://localhost:' + PORT + '/test_toroidal_simple.html', {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    console.log('Waiting for tests to complete...');
    await page.waitForFunction(() => {
      const output = document.getElementById('output');
      return output && output.textContent.includes('Tests Complete');
    }, { timeout: 60000 });

    const outputText = await page.evaluate(() => {
      return document.getElementById('output').innerText;
    });

    console.log('\n=== Test Output ===');
    console.log(outputText);
  } catch (err) {
    console.error('Test failed:', err.message);
    const bodyText = await page.evaluate(() => document.body?.innerText || 'no content');
    console.log('\nPage content:');
    console.log(bodyText);
  }

  await browser.close();
  console.log('\nDone.');
}

runTest().catch(console.error);
