#!/usr/bin/env node
/**
 * Test spacer centering - just test the coordinate logic, no OpenCASCADE
 */

import { convertAxis } from '../src/types.js';

// Simulate spacer data from MKF
const spacerData = {
  type: 'spacer',
  coordinates: [0.01825, 0, 0],  // [radial, height, depth] = X lateral, Y=0 center, Z=0
  dimensions: [0.009125, 0.001, 0.02],  // [width, height/thickness, depth]
};

console.log('=== SPACER COORDINATE ANALYSIS ===\n');

console.log('MKF spacer data:');
console.log('  coordinates [radial, height, depth]:', spacerData.coordinates);
console.log('  dimensions [width, height, depth]:', spacerData.dimensions);

const replicadCoords = convertAxis(spacerData.coordinates);
console.log('\nConverted to replicad coordinates [X, Y, Z]:');
console.log('  ', replicadCoords);

console.log('\nmakeBaseBox dimensions:');
console.log('  xLength (dim[0]):', spacerData.dimensions[0], '(width)');
console.log('  yLength (dim[2]):', spacerData.dimensions[2], '(depth)');
console.log('  zLength (dim[1]):', spacerData.dimensions[1], '(height)');

console.log('\nExpected box after makeBaseBox (centered at origin):');
console.log('  X: from', -spacerData.dimensions[0]/2, 'to', spacerData.dimensions[0]/2);
console.log('  Y: from', -spacerData.dimensions[2]/2, 'to', spacerData.dimensions[2]/2);
console.log('  Z: from', -spacerData.dimensions[1]/2, 'to', spacerData.dimensions[1]/2);

console.log('\nAfter translate to', replicadCoords, ':');
const xMin = replicadCoords[0] - spacerData.dimensions[0]/2;
const xMax = replicadCoords[0] + spacerData.dimensions[0]/2;
const yMin = replicadCoords[1] - spacerData.dimensions[2]/2;
const yMax = replicadCoords[1] + spacerData.dimensions[2]/2;
const zMin = replicadCoords[2] - spacerData.dimensions[1]/2;
const zMax = replicadCoords[2] + spacerData.dimensions[1]/2;

console.log('  X: from', xMin, 'to', xMax, '(center:', (xMin+xMax)/2, ')');
console.log('  Y: from', yMin, 'to', yMax, '(center:', (yMin+yMax)/2, ')');
console.log('  Z: from', zMin, 'to', zMax, '(center:', (zMin+zMax)/2, ')');

console.log('\n=== EXPECTED CORE POSITIONS ===');
// For a spacer gap with 1mm thickness:
// - Top half: Y (height) = +0.0005m = +0.5mm
// - Bottom half: Y (height) = -0.0005m = -0.5mm
// - Spacer: centered at Y=0

const halfSetTop = { coordinates: [0, 0.0005, 0] };  // [radial, height, depth]
const halfSetBottom = { coordinates: [0, -0.0005, 0] };

const topCoords = convertAxis(halfSetTop.coordinates);
const bottomCoords = convertAxis(halfSetBottom.coordinates);

console.log('Top half-set replicad position [X, Y, Z]:', topCoords);
console.log('Bottom half-set replicad position [X, Y, Z]:', bottomCoords);
console.log('Spacer center replicad position [X, Y, Z]:', replicadCoords);

console.log('\nIn the Z axis (vertical):');
console.log('  Top piece at Z =', topCoords[2]);
console.log('  Spacer spans Z =', zMin, 'to', zMax);
console.log('  Bottom piece at Z =', bottomCoords[2]);

if (topCoords[2] >= zMax && bottomCoords[2] <= zMin) {
  console.log('\n✓ Spacer is correctly positioned between the half sets');
} else {
  console.log('\n✗ PROBLEM: Spacer positioning may be incorrect!');
}

