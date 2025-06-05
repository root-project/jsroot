import { version, openFile } from 'jsroot';

import { readHeaderFooter } from 'jsroot/rntuple';


console.log(`JSROOT version ${version}`);


let file = await openFile('https://jsroot.gsi.de/files/tmp/ntpl001_staff.root');
let rntuple = await file.readObject('Staff');

await readHeaderFooter(rntuple);

console.log('some debug info', rntuple.builder?.name);
console.log('JSROOT version', version);
console.log('RNTuple name:', rntuple.builder.name);
console.log('RNTuple description:', rntuple.builder.description);
console.log('Header version:', rntuple.builder.version);

