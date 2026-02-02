/**
 * Test rectangular wire rendering
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runTest() {
  console.log('=== Testing Rectangular Wire Rendering ===\n');

  // Load test data
  const testDataPath = join(__dirname, 'testData', 'toroidal_one_turn_rectangular_wire.json');
  const testData = JSON.parse(readFileSync(testDataPath, 'utf-8'));
  
  // Extract data
  const wire = testData.magnetic.coil.functionalDescription[0].wire;
  const turnsDescription = testData.magnetic.coil.turnsDescription;

  console.log('Wire data from functionalDescription:');
  console.log('  type:', wire.type);
  console.log('  outerWidth:', wire.outerWidth?.nominal);
  console.log('  outerHeight:', wire.outerHeight?.nominal);
  console.log();

  console.log('Turn data:');
  const turn0 = turnsDescription[0];
  console.log('  crossSectionalShape:', turn0.crossSectionalShape);
  console.log('  dimensions:', turn0.dimensions);
  console.log();

  // Test WireDescription
  console.log('Testing WireDescription...\n');
  
  const { WireType, WireDescription, TurnDescription } = await import('../src/types.js');
  
  // Test 1: fromDict with wire data
  const wireDesc1 = WireDescription.fromDict(wire);
  console.log('WireDescription.fromDict(wire):');
  console.log('  type:', wireDesc1.type);
  console.log('  wireType:', wireDesc1.wireType);
  console.log('  expected: rectangular');
  console.log('  PASS:', wireDesc1.type === 'rectangular' ? 'YES' : 'NO - BUG!');
  console.log();
  
  // Test 2: constructor with wireType (legacy)
  const wireDesc2 = new WireDescription({ wireType: WireType.RECTANGULAR });
  console.log('new WireDescription({ wireType: RECTANGULAR }):');
  console.log('  type:', wireDesc2.type);
  console.log('  wireType:', wireDesc2.wireType);
  console.log('  expected: rectangular');
  console.log('  PASS:', wireDesc2.type === 'rectangular' ? 'YES' : 'NO - BUG!');
  console.log();
  
  // Test 3: constructor with type (MAS standard)
  const wireDesc3 = new WireDescription({ type: WireType.RECTANGULAR });
  console.log('new WireDescription({ type: RECTANGULAR }):');
  console.log('  type:', wireDesc3.type);
  console.log('  wireType:', wireDesc3.wireType);
  console.log('  expected: rectangular');
  console.log('  PASS:', wireDesc3.type === 'rectangular' ? 'YES' : 'NO - BUG!');
  console.log();

  // Test 4: isRectangularWire comparison
  const isRect = wireDesc2.wireType === WireType.RECTANGULAR;
  console.log('wireDescription.wireType === WireType.RECTANGULAR:');
  console.log('  result:', isRect);
  console.log('  expected: true');
  console.log('  PASS:', isRect ? 'YES' : 'NO - BUG!');
  console.log();
  
  // Test turn cross-sectional shape handling
  console.log('Testing turn crossSectionalShape handling...');
  const turnDesc = TurnDescription.fromDict(turn0);
  console.log('  turnDesc.crossSectionalShape:', turnDesc.crossSectionalShape);
  console.log('  expected: rectangular');
  console.log('  PASS:', turnDesc.crossSectionalShape === 'rectangular' ? 'YES' : 'NO - BUG!');

  console.log('\n=== All Tests Complete ===');
}

runTest().catch(console.error);
