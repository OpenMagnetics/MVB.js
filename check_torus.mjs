import opencascade from 'replicad-opencascadejs';

const oc = await opencascade();

// List all MakeTorus functions
const keys = Object.keys(oc).filter(k => k.includes('MakeTorus'));
console.log('MakeTorus functions:');
keys.forEach(k => console.log(' ', k));
