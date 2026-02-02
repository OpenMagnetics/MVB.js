/**
 * Debug script to test FR4 board generation with the bug_planar_missing_fr4.json file
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the test data
const testDataPath = path.join(__dirname, '../testData/bug_planar_missing_fr4.json');
const data = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));

const magnetic = data.magnetic;
const coil = magnetic?.coil;

console.log('=== Debugging FR4 Board Generation ===\n');

console.log('1. Checking data structure:');
console.log('   Has magnetic:', magnetic != null);
console.log('   Has coil:', coil != null);

console.log('\n2. Checking groupsDescription:');
console.log('   Has groupsDescription:', coil?.groupsDescription != null);
console.log('   groupsDescription length:', coil?.groupsDescription?.length);

if (coil?.groupsDescription?.length > 0) {
  for (let i = 0; i < coil.groupsDescription.length; i++) {
    const group = coil.groupsDescription[i];
    console.log(`\n   Group ${i}:`);
    console.log(`     type: "${group.type}"`);
    console.log(`     name: "${group.name}"`);
    console.log(`     dimensions: [${group.dimensions?.join(', ')}]`);
    console.log(`     coordinates: [${group.coordinates?.join(', ')}]`);
    console.log(`     Is type === "Printed": ${group.type === "Printed"}`);
  }
}

console.log('\n3. Checking bobbin processedDescription:');
console.log('   Has bobbin:', coil?.bobbin != null);
console.log('   Has processedDescription:', coil?.bobbin?.processedDescription != null);

if (coil?.bobbin?.processedDescription) {
  const bp = coil.bobbin.processedDescription;
  console.log(`   columnWidth: ${bp.columnWidth}`);
  console.log(`   columnDepth: ${bp.columnDepth}`);
  console.log(`   columnShape: "${bp.columnShape}"`);
}

console.log('\n4. Checking hasValidBobbinForTurns condition:');
const hasValidBobbinForTurns = coil?.bobbin?.processedDescription && 
  coil.bobbin.processedDescription.columnDepth !== undefined &&
  coil.bobbin.processedDescription.columnWidth !== undefined;
console.log(`   hasValidBobbinForTurns: ${hasValidBobbinForTurns}`);

console.log('\n5. Checking hasGroupsDescription condition:');
const hasGroupsDescription = coil?.groupsDescription != null && coil?.groupsDescription.length > 0;
console.log(`   hasGroupsDescription: ${hasGroupsDescription}`);

console.log('\n6. Would FR4 board be built?');
if (hasGroupsDescription && hasValidBobbinForTurns) {
  for (let i = 0; i < coil.groupsDescription.length; i++) {
    const groupDesc = coil.groupsDescription[i];
    if (groupDesc.type === "Printed") {
      console.log(`   YES - Group ${i} (${groupDesc.name}) has type "Printed"`);
    } else {
      console.log(`   NO - Group ${i} (${groupDesc.name}) has type "${groupDesc.type}" (not "Printed")`);
    }
  }
} else {
  console.log('   NO - Missing groupsDescription or valid bobbin');
}

console.log('\n=== Debug Complete ===');
