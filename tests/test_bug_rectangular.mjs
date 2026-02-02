/**
 * Test bug_rectangular_wires.json - rectangular wires should be rectangular, not round
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runTest() {
  console.log('=== Testing bug_rectangular_wires.json ===\n');

  // Load test data
  const testDataPath = join(__dirname, 'testData', 'bug_rectangular_wires.json');
  const testData = JSON.parse(readFileSync(testDataPath, 'utf-8'));
  
  // Extract coil data
  const coilData = testData.magnetic.coil;
  const turnsDescription = coilData.turnsDescription;
  const functionalDesc = coilData.functionalDescription || [];
  
  console.log('Coil data:');
  console.log('  Number of turns:', turnsDescription.length);
  console.log();

  // Check first few turns
  for (let i = 0; i < Math.min(3, turnsDescription.length); i++) {
    const turn = turnsDescription[i];
    console.log(`Turn ${i}:`);
    console.log('  crossSectionalShape:', turn.crossSectionalShape);
    console.log('  dimensions:', turn.dimensions);
    console.log('  coordinates:', turn.coordinates);
  }
  console.log();

  // Check wire from functionalDescription
  if (functionalDesc.length > 0) {
    const wireData = functionalDesc[0].wire;
    console.log('Wire from functionalDescription:');
    console.log('  type:', wireData?.type);
    console.log('  outerWidth:', wireData?.outerWidth);
    console.log('  outerHeight:', wireData?.outerHeight);
    console.log();
  }

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

    // Import builder and types
    const { ReplicadBuilder } = await import('../src/replicadBuilder.js');
    const { WireType, WireDescription, TurnDescription, BobbinProcessedDescription } = await import('../src/types.js');
    
    const builder = new ReplicadBuilder(replicad);

    // Test creating a single turn
    console.log('Testing single turn creation...\n');
    
    const turnData = turnsDescription[0];
    const turnDesc = TurnDescription.fromDict(turnData);
    
    // Create wire description from turn data
    const crossShape = (turnData.crossSectionalShape || '').toLowerCase();
    const isRectangular = crossShape === 'rectangular';
    
    console.log('Turn data analysis:');
    console.log('  crossShape:', crossShape);
    console.log('  isRectangular:', isRectangular);
    console.log();
    
    const wireDesc = new WireDescription({
      type: isRectangular ? WireType.RECTANGULAR : WireType.ROUND,
      outerWidth: turnData.dimensions[0],
      outerHeight: turnData.dimensions[1]
    });
    
    console.log('Created WireDescription:');
    console.log('  type:', wireDesc.type);
    console.log('  wireType:', wireDesc.wireType);
    console.log('  outerWidth:', wireDesc.outerWidth);
    console.log('  outerHeight:', wireDesc.outerHeight);
    console.log();
    
    // Check the comparison
    console.log('Wire type comparison:');
    console.log('  wireDesc.type === WireType.RECTANGULAR:', wireDesc.type === WireType.RECTANGULAR);
    console.log('  wireDesc.wireType === WireType.RECTANGULAR:', wireDesc.wireType === WireType.RECTANGULAR);
    console.log('  wireDesc.type === "rectangular":', wireDesc.type === 'rectangular');
    console.log('  WireType.RECTANGULAR value:', WireType.RECTANGULAR);
    console.log();
    
    // Get bobbin data
    const bobbinData = coilData.bobbin?.processedDescription;
    if (!bobbinData) {
      console.log('No bobbin processedDescription found, using defaults');
    }
    const bobbinProcessed = bobbinData ? BobbinProcessedDescription.fromDict(bobbinData) : new BobbinProcessedDescription({
      columnWidth: 0.005,
      columnDepth: 0.005,
      columnShape: 'rectangular'
    });
    
    console.log('Bobbin:');
    console.log('  columnShape:', bobbinProcessed.columnShape);
    console.log('  columnWidth:', bobbinProcessed.columnWidth);
    console.log('  columnDepth:', bobbinProcessed.columnDepth);
    console.log();

    // Create the turn
    console.log('Creating turn geometry...');
    const turnGeom = builder.getTurn(turnDesc, wireDesc, bobbinProcessed, false);
    
    if (turnGeom) {
      console.log('Turn geometry created successfully!');
      
      // Export to STEP for inspection
      const outputPath = join(__dirname, '..', 'output', 'bug_rectangular_wire_turn.step');
      try {
        const stepData = turnGeom.exporterSTEP ? turnGeom.exporterSTEP() : null;
        if (stepData) {
          writeFileSync(outputPath, stepData);
          console.log('Exported to:', outputPath);
        }
      } catch (e) {
        console.log('Could not export STEP:', e.message);
      }
    } else {
      console.log('Turn geometry is null');
    }

    console.log('\n=== Test Complete ===');
    
  } catch (error) {
    console.error('Error:', error);
    console.error(error.stack);
  }
}

runTest();
