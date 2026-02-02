/**
 * Export rectangular wire turns to STL file for visual inspection.
 * Run with: node tests/exportRectangularTurns.mjs
 */

import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectDir = join(__dirname, '..');

const PORT = 5203;

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

    vite.stderr.on('data', () => {});
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
  
  // Navigate to a minimal page
  await page.goto(`http://localhost:${PORT}/test_bug_rectangular.html`, { 
    waitUntil: 'networkidle0', 
    timeout: 120000 
  });

  // Wait for tests to complete
  await page.waitForFunction(() => {
    const output = document.getElementById('output');
    return output && output.textContent.includes('Tests Complete');
  }, { timeout: 120000 });

  // Extract STL content from the page
  const stlContent = await page.evaluate(() => {
    return new Promise(async (resolve) => {
      // Re-run the STL generation and capture the result
      const { default: opencascade } = await import('replicad-opencascadejs/src/replicad_single.js');
      const { default: wasmUrl } = await import('replicad-opencascadejs/src/replicad_single.wasm?url');
      const replicad = await import('replicad');
      const { ReplicadBuilder } = await import('./src/replicadBuilder.js');
      
      const response = await fetch('./tests/testData/bug_rectangular_wires.json');
      const testData = await response.json();
      
      const bobbin = testData.magnetic.coil.bobbin.processedDescription;
      const turnsDescription = testData.magnetic.coil.turnsDescription;
      const wire = testData.magnetic.coil.functionalDescription[0].wire;
      
      const OC = await opencascade({ locateFile: () => wasmUrl });
      replicad.setOC(OC);
      
      const builder = new ReplicadBuilder(replicad);
      
      const turnShapes = [];
      for (const turn of turnsDescription) {
        const turnShape = builder.getTurn(turn, wire, bobbin);
        turnShapes.push(turnShape);
      }
      
      const { makeCompound } = replicad;
      const allTurns = makeCompound(turnShapes);
      
      const stlOptions = { tolerance: 0.1, angularTolerance: 0.1, binary: false };
      const stl = allTurns.blobSTL(stlOptions);
      const stlText = await stl.text();
      
      resolve(stlText);
    });
  });

  // Save STL to file
  const outputPath = join(projectDir, 'output', 'rectangular_wire_turns.stl');
  fs.writeFileSync(outputPath, stlContent);
  console.log(`STL exported to: ${outputPath}`);

  await browser.close();
} catch (err) {
  console.error('Error:', err);
} finally {
  vite.kill();
}
