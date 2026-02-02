#!/usr/bin/env node
/**
 * Direct STL generation for toroidal rectangular wire turns
 * Runs without browser using replicad's Node.js WASM interface
 */

import opencascade from 'replicad-opencascadejs/src/replicad_single.js';
import * as replicad from 'replicad';
import { ReplicadBuilder } from '../src/replicadBuilder.js';
import { getCore } from '../src/coreShapes.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('Loading OpenCASCADE...');
  const OC = await opencascade();
  replicad.setOC(OC);
  console.log('OpenCASCADE loaded');
  
  // Load test data
  const testDataPath = path.join(__dirname, 'testData', 'bug_rectangular_wires_toroidal_2.json');
  console.log('Loading test data:', testDataPath);
  const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'));
  
  const bobbin = testData.magnetic.coil.bobbin.processedDescription;
  const turnsDescription = testData.magnetic.coil.turnsDescription;
  const wire = testData.magnetic.coil.functionalDescription[0].wire;
  const coreGeometry = testData.magnetic.core.geometricalDescription;
  
  console.log(`Turns: ${turnsDescription.length}`);
  console.log(`Wire: ${wire.type}, ${wire.outerWidth?.nominal}x${wire.outerHeight?.nominal}`);
  
  const builder = new ReplicadBuilder(replicad);
  
  // Create turns
  const turnShapes = [];
  for (let i = 0; i < turnsDescription.length; i++) {
    const turn = turnsDescription[i];
    console.log(`Creating turn ${i} (rotation=${turn.rotation.toFixed(1)})...`);
    const turnShape = builder.getTurn(turn, wire, bobbin);
    turnShapes.push(turnShape);
  }
  console.log(`Created ${turnShapes.length} turns`);
  
  // Create core
  console.log('Creating core...');
  const coreShape = getCore(replicad, coreGeometry);
  console.log('Core created');
  
  // Export combined STL
  const { makeCompound } = replicad;
  const combined = makeCompound([...turnShapes, coreShape]);
  const stlOptions = { tolerance: 0.1, angularTolerance: 0.1, binary: false };
  
  console.log('Exporting STL...');
  const stlBlob = combined.blobSTL(stlOptions);
  const stlText = await stlBlob.text();
  
  const outputPath = path.join(__dirname, '..', 'output', 'toroidal_with_core.stl');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, stlText);
  console.log('Saved:', outputPath);
  console.log('Facets:', (stlText.match(/facet normal/g) || []).length);
  
  // Also export turns only
  const turnsCompound = makeCompound(turnShapes);
  const turnsStl = turnsCompound.blobSTL(stlOptions);
  const turnsText = await turnsStl.text();
  const turnsPath = path.join(__dirname, '..', 'output', 'toroidal_rectangular_turns.stl');
  fs.writeFileSync(turnsPath, turnsText);
  console.log('Saved turns only:', turnsPath);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
