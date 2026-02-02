import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('Loading modules...');
  
  // Dynamically import replicad
  const replicad = await import('../node_modules/replicad/dist/replicad.js');
  const opencascade = await import('../node_modules/replicad-opencascadejs/src/replicad_single.js');
  
  // Initialize OpenCASCADE
  const oc = await opencascade.default({
    locateFile: (file) => path.join(__dirname, '../node_modules/replicad-opencascadejs/src/', file)
  });
  
  replicad.setOC(oc);
  console.log('OpenCASCADE loaded');
  
  // Import builder
  const { ReplicadBuilder } = await import('../src/index.js');
  const builder = new ReplicadBuilder(replicad);
  console.log('Builder loaded');
  
  // Parameters from toroidal_one_turn_rectangular_wire.json
  const turnDescription = {
    coordinates: [-0.0040075, 4.907772047583017E-19],
    additionalCoordinates: [[-0.0169375, 2.0742455160558295E-18]],
    rotation: 180,
    dimensions: [0.006085, 0.001085],
    crossSectionalShape: 'rectangular',
    name: 'test_turn'
  };
  
  const wireDescription = {
    wireType: 'rectangular',
    outerWidth: 0.006085,
    outerHeight: 0.001085
  };
  
  const bobbinDescription = {
    columnDepth: 0.006,
    windingWindowRadialHeight: 0.00685,
    windingWindows: [{ radialHeight: 0.00685 }]
  };
  
  console.log('');
  console.log('Wire dimensions: ' + (turnDescription.dimensions[0]*1000).toFixed(3) + 'mm x ' + (turnDescription.dimensions[1]*1000).toFixed(3) + 'mm');
  console.log('');
  console.log('Creating turn...');
  
  const turn = builder._createToroidalTurn(turnDescription, wireDescription, bobbinDescription);
  
  if (turn) {
    const bb = turn.boundingBox.bounds;
    console.log('');
    console.log('Turn-only bounding box:');
    console.log('  X: ' + bb[0][0].toFixed(2) + ' to ' + bb[1][0].toFixed(2) + ' (size: ' + (bb[1][0]-bb[0][0]).toFixed(2) + ' mm)');
    console.log('  Y: ' + bb[0][1].toFixed(2) + ' to ' + bb[1][1].toFixed(2) + ' (size: ' + (bb[1][1]-bb[0][1]).toFixed(2) + ' mm)');
    console.log('  Z: ' + bb[0][2].toFixed(2) + ' to ' + bb[1][2].toFixed(2) + ' (size: ' + (bb[1][2]-bb[0][2]).toFixed(2) + ' mm)');
    console.log('');
    console.log('Expected Z size: wireHeight = 1.085 mm');
    
    // Export to STL
    const stlOptions = { tolerance: 0.1, angularTolerance: 0.1, binary: true };
    const stlBlob = turn.blobSTL(stlOptions);
    const stlData = await stlBlob.arrayBuffer();
    const outPath = path.join(__dirname, '../output/turn_only.stl');
    fs.writeFileSync(outPath, Buffer.from(stlData));
    console.log('');
    console.log('Saved to: ' + outPath);
  } else {
    console.log('Turn creation returned null');
  }
}

main().catch(e => {
  console.error('Error:', e.message);
  console.error(e.stack);
  process.exit(1);
});
