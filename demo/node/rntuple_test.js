import { version, openFile, TSelector } from 'jsroot';

import { readHeaderFooter, readEntry, rntupleProcess } from 'jsroot/rntuple';

console.log(`JSROOT version ${version}`);
// const file = await openFile('https://jsroot.gsi.de/files/tmp/ntpl001_staff.root'),
// rntuple = await file.readObject('Staff');
const file = await openFile('./rntuple_test.root'),
rntuple = await file.readObject('Data');

await readHeaderFooter(rntuple);

console.log('Performing Validations and debugging info');

if (rntuple.builder?.name !== 'Data')
  console.error('FAILURE: name differs from expected');
else
  console.log('OK: name is', rntuple.builder?.name);


if (rntuple.builder?.description !== '')
  console.error('FAILURE: description should be the empty string');
else
  console.log('OK: description is empty string');

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
      if (field.fieldName !== 'IntField' || field.typeName !== 'std::int32_t') 
        console.error(`FAILURE: First field should be 'IntField (std::int32_t)' but got '${field.fieldName} (${field.typeName})'`);     
    } else if (i === rntuple.builder.fieldDescriptors.length - 1){
      if (field.fieldName !== 'StringField' || field.typeName !== 'std::string')
        console.error(`FAILURE: Last field should be 'StringField (std::string)' but got '${field.fieldName} (${field.typeName})'`);      
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
        console.error('FAILURE: First column should be for fieldId 0 (IntField)');
    } else if (i === rntuple.builder.columnDescriptors.length - 1){
      if (column.fieldId !== 3)
        console.error('FAILURE: Last column should be for fieldId 3 (StringField)');
    }
  }
}

// Setup selector to process all fields (so cluster gets loaded)
const selector = new TSelector(),
      fields = ['IntField', 'FloatField', 'DoubleField', 'StringField'];
for (const f of fields) selector.addBranch(f);

selector.Begin = () => {
  console.log('\nBegin processing to load cluster data...');
};
selector.Process = function() {};
selector.Terminate = () => {
  console.log('Finished dummy processing');
};

// Run rntupleProcess to ensure cluster is loaded
await rntupleProcess(rntuple, selector);

// Now validate entry data
const EPSILON = 1e-10;

for (let entryIndex = 0; entryIndex < 10; ++entryIndex) {
  console.log(`\nChecking entry ${entryIndex}:`);
  
  const expected = {
    IntField: entryIndex,
    FloatField: entryIndex * entryIndex,
    DoubleField: entryIndex * 0.5,
    StringField: `entry_${entryIndex}`
  };

  for (const field of fields) {
    try {
      const value = readEntry(rntuple, field, entryIndex),
            expectedValue = expected[field],

      pass = typeof value === 'number'
        ? Math.abs(value - expectedValue) < EPSILON
        : value === expectedValue;

      if (!pass)
        console.error(`FAILURE: ${field} at entry ${entryIndex} expected ${expectedValue}, got ${value}`);
      else
        console.log(`OK: ${field} at entry ${entryIndex} = ${value}`);
    } catch (err) {
      console.error(`ERROR: Failed to read ${field} at entry ${entryIndex}: ${err.message}`);
    }
  }
}