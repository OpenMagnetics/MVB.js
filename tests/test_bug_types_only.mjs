/**
 * Test bug_rectangular_wires.json - types only (no OpenCASCADE needed)
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { WireType, WireDescription, TurnDescription, BobbinProcessedDescription } from '../src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('=== Testing bug_rectangular_wires.json Types ===\n');

// Load test data
const testDataPath = join(__dirname, 'testData', 'bug_rectangular_wires.json');
const testData = JSON.parse(readFileSync(testDataPath, 'utf-8'));

// Extract coil data
const coilData = testData.magnetic.coil;
const turnsDescription = coilData.turnsDescription;
const functionalDesc = coilData.functionalDescription || [];

console.log('Number of turns:', turnsDescription.length);
console.log();

// Check first turn
const turnData = turnsDescription[0];
console.log('Turn 0 raw data:');
console.log('  crossSectionalShape:', turnData.crossSectionalShape);
console.log('  dimensions:', turnData.dimensions);
console.log();

// Simulate what getMagnetic does
console.log('Simulating getMagnetic logic...\n');

// Step 1: Get wire info from functionalDescription
let wireDesc = new WireDescription({ type: WireType.ROUND });
if (functionalDesc.length > 0) {
  const wireData = functionalDesc[0].wire || {};
  if (Object.keys(wireData).length > 0) {
    wireDesc = WireDescription.fromDict(wireData);
    console.log('After WireDescription.fromDict(wireData):');
    console.log('  wireDesc.type:', wireDesc.type);
    console.log('  wireDesc.wireType:', wireDesc.wireType);
  }
}
console.log();

// Step 2: Override with turn data if dimensions exist
if (turnData.dimensions) {
  const dims = turnData.dimensions;
  if (dims.length >= 2) {
    const crossShape = (turnData.crossSectionalShape || '').toLowerCase();
    const isRectangular = crossShape === 'rectangular' || crossShape === 'foil' || crossShape === 'planar';
    
    console.log('Processing turn dimensions:');
    console.log('  crossShape:', crossShape);
    console.log('  isRectangular:', isRectangular);
    
    wireDesc = new WireDescription({
      type: isRectangular ? WireType.RECTANGULAR : WireType.ROUND,
      outerDiameter: dims[0],
      conductingDiameter: dims[0],
      outerWidth: dims[0],
      outerHeight: dims[1]
    });
    
    console.log('  wireDesc.type:', wireDesc.type);
    console.log('  wireDesc.wireType:', wireDesc.wireType);
  }
}
console.log();

// Step 3: Check comparison in _createConcentricTurn
console.log('Comparison in _createConcentricTurn:');
console.log('  WireType.RECTANGULAR =', WireType.RECTANGULAR);
console.log('  wireDesc.wireType =', wireDesc.wireType);
console.log('  wireDesc.type =', wireDesc.type);
console.log();

const isRectangularWire = wireDesc.wireType === WireType.RECTANGULAR || 
                           wireDesc.type === WireType.RECTANGULAR ||
                           wireDesc.type === 'rectangular' ||
                           wireDesc.wireType === 'rectangular';

console.log('isRectangularWire =', isRectangularWire);
console.log();

if (isRectangularWire) {
  console.log('✅ SUCCESS: Wire should be rendered as RECTANGULAR');
} else {
  console.log('❌ FAILURE: Wire would be rendered as ROUND');
  console.log();
  console.log('Debug comparison:');
  console.log('  wireDesc.wireType === WireType.RECTANGULAR:', wireDesc.wireType === WireType.RECTANGULAR);
  console.log('  wireDesc.type === WireType.RECTANGULAR:', wireDesc.type === WireType.RECTANGULAR);
  console.log('  wireDesc.type === "rectangular":', wireDesc.type === 'rectangular');
  console.log('  wireDesc.wireType === "rectangular":', wireDesc.wireType === 'rectangular');
  console.log('  typeof wireDesc.type:', typeof wireDesc.type);
  console.log('  typeof WireType.RECTANGULAR:', typeof WireType.RECTANGULAR);
}
