import { version, openFile } from 'jsroot';

import { readHeaderFooter } from 'jsroot/rntuple';


console.log(`JSROOT version ${version}`);

let file = await openFile('https://jsroot.gsi.de/files/tmp/ntpl001_staff.root');

let rntuple = await file.readObject('Staff');

await readHeaderFooter(rntuple);

console.log('Performing Validations and debugging info');

if (rntuple.builder?.name !== 'Staff')
  console.error('FAILURE: name differs from expected');
else
  console.log('OK: name is', rntuple.builder?.name);

if (!rntuple.builder?.description)
  console.error('FAILURE: description is missing');
else
  console.log('OK: description is', rntuple.builder.description);

if (rntuple.builder?.xxhash3 === undefined || rntuple.builder.xxhash3 === null)
  console.warn('WARNING: xxhash3 is missing');
else
  console.log('OK: xxhash3 is', '0x' + rntuple.builder.xxhash3.toString(16).padStart(16, '0'));

// Fields Check

if (!rntuple.builder?.fieldDescriptors?.length)
  console.error('FAILURE: No fields deserialized');
else {
  console.log(`OK: ${rntuple.builder.fieldDescriptors.length} field(s) deserialized`);
  for (let i = 0; i < rntuple.builder.fieldDescriptors.length; ++i) {
    const field = rntuple.builder.fieldDescriptors[i];
    if (!field.fieldName || !field.typeName)
      console.error(`FAILURE: Field ${i} is missing name or type`);
    else
      console.log(`OK: Field ${i}: ${field.fieldName} (${field.typeName})`);
  }
}

