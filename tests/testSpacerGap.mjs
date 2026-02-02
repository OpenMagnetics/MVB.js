#!/usr/bin/env node
/**
 * Test spacer gap coordinate logic (no OpenCASCADE needed)
 */

import { flattenDimensions, convertAxis } from '../src/types.js';

// Mock geometrical description with spacer gap (from E_55_21 additive)
const geometricalDescriptionWithSpacer = [
  {
    type: 'half set',
    coordinates: [0, 0.0005, 0],  // Y = spacerThickness/2 = 0.5mm
    rotation: [Math.PI, Math.PI, 0],  // Top piece, rotated 180
    shape: {
      family: 'e',
      name: 'E 55/21',
      dimensions: {
        A: { nominal: 0.055 },
        B: { nominal: 0.021 },
        C: { nominal: 0.02 }
      }
    },
    machining: null  // No machining for spacer gaps!
  },
  {
    type: 'half set',
    coordinates: [0, -0.0005, 0],  // Y = -spacerThickness/2
    rotation: [0, 0, 0],  // Bottom piece, not rotated
    shape: {
      family: 'e',
      name: 'E 55/21',
      dimensions: {
        A: { nominal: 0.055 },
        B: { nominal: 0.021 },
        C: { nominal: 0.02 }
      }
    },
    machining: null  // No machining for spacer gaps!
  },
  {
    type: 'spacer',
    coordinates: [0.01825, 0, 0],  // At lateral column
    dimensions: [0.009125, 0.001, 0.02],  // [width, height/thickness, depth]
    material: 'plastic'
  }
];

console.log('Testing spacer gap coordinate conversion...\n');

for (const part of geometricalDescriptionWithSpacer) {
  console.log(`=== ${part.type.toUpperCase()} ===`);
  
  if (part.type === 'spacer') {
    console.log('Dimensions (MAS): [width, height, depth] =', part.dimensions);
    console.log('Coordinates (MAS): [radial, height, depth] =', part.coordinates);
    console.log('Converted coords (Replicad): [X, Y, Z] =', convertAxis(part.coordinates));
    console.log('Box creation: makeBaseBox(dim[0], dim[2], dim[1]) = makeBaseBox(', 
      part.dimensions[0], ',', part.dimensions[2], ',', part.dimensions[1], ')');
    console.log('  -> Box with X=width, Y=depth, Z=height');
  } else {
    console.log('Coordinates (MAS): [radial, height, depth] =', part.coordinates);
    console.log('Converted coords (Replicad): [X, Y, Z] =', convertAxis(part.coordinates));
    console.log('Rotation (radians): [rotX, rotZ, rotY] =', part.rotation);
    console.log('  -> Rotation degrees:', part.rotation.map(r => (r / Math.PI) * 180));
    console.log('Has machining:', part.machining ? 'YES' : 'NO');
    
    // Trace through transformation
    const B = part.shape.dimensions.B.nominal;  // Height of E shape
    console.log('\nPiece height (B):', B);
    console.log('After getShapeExtras: piece spans Z=-B to Z=0 = Z=', -B, 'to Z=0');
    
    if (part.rotation[0] !== 0) {
      console.log('After 180° X rotation: piece spans Z=0 to Z=B = Z=0 to Z=', B);
      console.log('  Mating surface (was at Z=0, stays at Z=0): Z=0');
    } else {
      console.log('No rotation: piece spans Z=-B to Z=0');
      console.log('  Mating surface (top surface): Z=0');
    }
    
    const zTranslation = convertAxis(part.coordinates)[2];
    console.log('After Z translation by', zTranslation + ':');
    if (part.rotation[0] !== 0) {
      console.log('  Piece spans Z=', zTranslation, 'to Z=', B + zTranslation);
      console.log('  Mating surface at Z=', zTranslation);
    } else {
      console.log('  Piece spans Z=', -B + zTranslation, 'to Z=', zTranslation);
      console.log('  Mating surface at Z=', zTranslation);
    }
  }
  console.log();
}

console.log('=== ANALYSIS ===');
const topPart = geometricalDescriptionWithSpacer[0];
const bottomPart = geometricalDescriptionWithSpacer[1];
const B = topPart.shape.dimensions.B.nominal;
const topZ = convertAxis(topPart.coordinates)[2];
const bottomZ = convertAxis(bottomPart.coordinates)[2];

console.log('Top piece mating surface: Z=', topZ);
console.log('Bottom piece mating surface: Z=', bottomZ);
console.log('Gap between mating surfaces:', topZ - bottomZ);
console.log('Expected gap (spacerThickness):', 0.001);
console.log('Match:', Math.abs((topZ - bottomZ) - 0.001) < 0.0001 ? 'YES' : 'NO');

