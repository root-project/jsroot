import { version, openFile } from 'jsroot';

import { readHeaderFooter } from 'jsroot/rntuple';


console.log(`JSROOT version ${version}`);
// let file = await openFile('https://jsroot.gsi.de/files/tmp/ntpl001_staff.root');

let file = await openFile('./simple.root');

let rntuple = await file.readObject('myNtuple');

await readHeaderFooter(rntuple);

console.log('Performing Validations and debugging info');

if (rntuple.builder?.name !== 'Staff')
  console.error('FAILURE: name differs from expected');
else
  console.log('OK: name is', rntuple.builder?.name);


if (rntuple.builder?.description !== '')
  console.error('FAILURE: description should be the empty string');
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
    if (i === 0) {
      if (field.fieldName !== 'Category' || field.typeName !== 'std::int32_t') 
        console.error(`FAILURE: First field should be 'Category (std::int32_t)' but got '${field.fieldName} (${field.typeName})'`);     
    } else if (i === rntuple.builder.fieldDescriptors.length - 1){
      if (field.fieldName !== 'Nation' || field.typeName !== 'std::string')
        console.error(`FAILURE: Last field should be 'Nation (std::string)' but got '${field.fieldName} (${field.typeName})'`);      
    }
  }
}

// Column Check

if (!rntuple.builder?.columnDescriptors?.length)
  console.error('FAILURE: No columns deserialized');
else {
  console.log(`OK: ${rntuple.builder.columnDescriptors.length} column(s) deserialized`);
  for (let i = 0; i < rntuple.builder.columnDescriptors.length; ++i) {
    const column = rntuple.builder.columnDescriptors[i];
    if (column.fieldId === undefined || column.fieldId === null)
      console.error(`FAILURE: Column ${i} is missing fieldId`);
    else
      console.log(`OK: Column ${i} fieldId: ${column.fieldId} `);
    if (i === 0) {
      if (column.fieldId !== 0)
        console.error('FAILURE: First column should be for fieldId 0 (Category)');
    } else if (i === rntuple.builder.columnDescriptors.length - 1){
      if (column.fieldId !== 10)
        console.error('FAILURE: Last column should be for fieldId 10 (Nation)');
    }
  }
}