/**
 * Test script for bug_web_0.json - bobbin and turns issues
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runTest() {
  console.log('=== Testing bug_web_0.json ===\n');

  // Load test data
  const testDataPath = join(__dirname, 'testData', 'bug_web_0.json');
  const testData = JSON.parse(readFileSync(testDataPath, 'utf-8'));
  
  // Extract bobbin and turns data
  const bobbin = testData.magnetic.coil.bobbin.processedDescription;
  const turnsDescription = testData.magnetic.coil.turnsDescription;
  const wire = testData.magnetic.coil.functionalDescription[0].wire;

  console.log('Bobbin data:');
  console.log('  columnShape:', bobbin.columnShape);
  console.log('  columnDepth:', bobbin.columnDepth);
  console.log('  columnWidth:', bobbin.columnWidth);
  console.log('  columnThickness:', bobbin.columnThickness);
  console.log('  wallThickness:', bobbin.wallThickness);
  console.log('  windingWindows:', bobbin.windingWindows ? 'present' : 'missing');
  if (bobbin.windingWindows && bobbin.windingWindows.length > 0) {
    console.log('    [0].height:', bobbin.windingWindows[0].height);
    console.log('    [0].width:', bobbin.windingWindows[0].width);
  }
  console.log('  windingWindowHeight:', bobbin.windingWindowHeight);
  console.log('  windingWindowWidth:', bobbin.windingWindowWidth);
  console.log();

  console.log('Wire data:');
  console.log('  type:', wire.type);
  console.log('  outerDiameter:', wire.outerDiameter?.nominal);
  console.log('  conductingDiameter:', wire.conductingDiameter?.nominal);
  console.log();

  console.log(`Turns: ${turnsDescription.length} turns`);
  if (turnsDescription.length > 0) {
    const turn0 = turnsDescription[0];
    console.log('  Turn 0:');
    console.log('    coordinates:', turn0.coordinates);
    console.log('    dimensions:', turn0.dimensions);
    console.log('    crossSectionalShape:', turn0.crossSectionalShape);
  }
  console.log();

  // Load MVB.js modules
  console.log('Loading OpenCASCADE...');
  
  try {
    const opencascadeModule = await import('replicad-opencascadejs/src/replicad_single.js');
    const wasmUrl = new URL('replicad-opencascadejs/src/replicad_single.wasm', import.meta.url);
    
    const OC = await opencascadeModule.default({
      locateFile: () => wasmUrl.pathname
    });
    
    const replicad = await import('replicad');
    replicad.setOC(OC);
    
    console.log('OpenCASCADE loaded successfully\n');

    // Import builder
    const { ReplicadBuilder } = await import('../src/replicadBuilder.js');
    const builder = new ReplicadBuilder(replicad);

    // Test getBobbin
    console.log('Testing getBobbin...');
    try {
      const bobbinShape = builder.getBobbin(bobbin);
      if (bobbinShape) {
        console.log('  ✓ Bobbin created successfully');
        
        // Export to STL
        const stlOptions = { tolerance: 0.5, angularTolerance: 0.5, binary: false };
        const stl = bobbinShape.blobSTL(stlOptions);
        const stlText = await stl.text();
        writeFileSync(join(__dirname, '..', 'output', 'bug_web_0_bobbin.stl'), stlText);
        console.log('  ✓ Bobbin STL exported to output/bug_web_0_bobbin.stl');
      } else {
        console.log('  ✗ Bobbin returned null');
      }
    } catch (err) {
      console.log('  ✗ Bobbin error:', err.message);
    }
    console.log();

    // Test getTurn
    console.log('Testing getTurn for turn 0...');
    try {
      // Create wire description from MAS format
      const wireDesc = {
        wireType: wire.type || 'round',
        outerDiameter: wire.outerDiameter?.nominal,
        conductingDiameter: wire.conductingDiameter?.nominal
      };
      
      const turn0 = turnsDescription[0];
      const isToroidal = false;
      
      const turnShape = builder.getTurn(turn0, wireDesc, bobbin, isToroidal);
      if (turnShape) {
        console.log('  ✓ Turn 0 created successfully');
        
        // Export to STL
        const stlOptions = { tolerance: 0.5, angularTolerance: 0.5, binary: false };
        const stl = turnShape.blobSTL(stlOptions);
        const stlText = await stl.text();
        writeFileSync(join(__dirname, '..', 'output', 'bug_web_0_turn0.stl'), stlText);
        console.log('  ✓ Turn 0 STL exported to output/bug_web_0_turn0.stl');
      } else {
        console.log('  ✗ Turn 0 returned null');
      }
    } catch (err) {
      console.log('  ✗ Turn 0 error:', err.message);
      console.log('    Stack:', err.stack?.split('\n').slice(0, 5).join('\n'));
    }

    console.log('\n=== Test complete ===');
  } catch (err) {
    console.error('Failed to load OpenCASCADE:', err.message);
  }
}

runTest().catch(console.error);
