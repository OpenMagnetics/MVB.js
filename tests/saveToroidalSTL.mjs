import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const PORT = process.env.PORT || 5204;

async function runTest() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  let stlData = null;

  page.on('console', msg => {
    const text = msg.text();
    console.log('[PAGE]', text);
  });

  console.log('Navigating to test page...');
  try {
    await page.goto('http://localhost:' + PORT + '/test_toroidal_simple.html', {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    await page.waitForFunction(() => {
      const output = document.getElementById('output');
      return output && output.textContent.includes('Tests Complete');
    }, { timeout: 60000 });

    // Get the STL data from window
    stlData = await page.evaluate(() => window.stlAllTurns);
    const stlWithCore = await page.evaluate(() => window.stlWithCore);

    if (stlData) {
      const outputPath = path.join(process.cwd(), 'output', 'toroidal_rectangular_turns.stl');
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, stlData);
      console.log('\nSaved STL to:', outputPath);
      console.log('Facets:', (stlData.match(/facet normal/g) || []).length);
    } else {
      console.log('No STL data found in window.stlAllTurns');
    }
    
    if (stlWithCore) {
      const outputPathCore = path.join(process.cwd(), 'output', 'toroidal_with_core.stl');
      fs.writeFileSync(outputPathCore, stlWithCore);
      console.log('Saved combined STL to:', outputPathCore);
      console.log('Combined facets:', (stlWithCore.match(/facet normal/g) || []).length);
    } else {
      console.log('No combined STL data found in window.stlWithCore');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }

  await browser.close();
}

runTest().catch(console.error);
