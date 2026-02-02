/**
 * Debug script to test actual FR4 board geometry generation
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Wait for OpenCASCADE to initialize
console.log('Loading OpenCASCADE.js...');

// Import the builder
const { default: initOpenCascade } = await import('opencascade.js');
const { setOC } = await import('replicad');
const oc = await initOpenCascade();
setOC(oc);
console.log('OpenCASCADE.js loaded successfully.\n');

// Import our builder
const { ReplicadBuilder } = await import('../src/replicadBuilder.js');

// Load the test data
const testDataPath = path.join(__dirname, '../testData/bug_planar_missing_fr4.json');
const data = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));

const magnetic = data.magnetic;
const coil = magnetic?.coil;

console.log('=== Testing FR4 Board Generation ===\n');

const builder = new ReplicadBuilder();

const groupDesc = coil.groupsDescription[0];
const bobbinProcessed = coil.bobbin.processedDescription;

console.log('Calling getFR4Board with:');
console.log('  groupDesc.type:', groupDesc.type);
console.log('  groupDesc.dimensions:', groupDesc.dimensions);
console.log('  groupDesc.coordinates:', groupDesc.coordinates);
console.log('  bobbinProcessed.columnWidth:', bobbinProcessed.columnWidth);
console.log('  bobbinProcessed.columnDepth:', bobbinProcessed.columnDepth);
console.log('  bobbinProcessed.columnShape:', bobbinProcessed.columnShape);

try {
  const fr4Board = builder.getFR4Board(groupDesc, bobbinProcessed, null);
  
  if (fr4Board) {
    console.log('\n✅ FR4 Board generated successfully!');
    console.log('  Shape type:', fr4Board.constructor.name);
    
    // Try to export as STL
    const blob = fr4Board.blobSTL({ tolerance: 0.5, angularTolerance: 0.5, binary: true });
    const buffer = await blob.arrayBuffer();
    console.log('  STL buffer size:', buffer.byteLength, 'bytes');
    
    // Save to file for inspection
    const outputPath = path.join(__dirname, '../testData/debug_fr4_board.stl');
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    console.log('  Saved to:', outputPath);
  } else {
    console.log('\n❌ getFR4Board returned null');
  }
} catch (error) {
  console.error('\n❌ Error generating FR4 board:', error.message);
  console.error(error.stack);
}

console.log('\n=== Test Complete ===');
