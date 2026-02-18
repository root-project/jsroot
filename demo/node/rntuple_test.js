import { version, openFile, TSelector } from 'jsroot';

import { readHeaderFooter, rntupleProcess } from 'jsroot/rntuple';

console.log(`JSROOT version ${version}`);


let filename = './rntuple_test.root';
if (process?.argv && process.argv[2])
   filename = process.argv[2];

const file = await openFile(filename),
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
      } else if (i === rntuple.builder.fieldDescriptors.length - 1) {
         if (field.fieldName !== '_1' || field.typeName !== 'bool')
            console.error(`FAILURE: Last field should be '_1 (bool)' but got '${field.fieldName} (${field.typeName})'`);
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
            console.error('FAILURE: First column should be for fieldId 0');
      } else if (i === rntuple.builder.columnDescriptors.length - 1) {
         if (column.fieldId !== 38)
            console.error('FAILURE: Last column should be for fieldId 38');
      }
   }
}

// Setup selector to process all fields (so cluster gets loaded)
const selector = new TSelector(),
      fields = ['IntField', 'FloatField', 'DoubleField',
                'Float16Field',
                'StringField', 'BoolField',
                'ArrayInt', 'VariantField', 'TupleField',
                'VectString', 'VectInt', 'VectBool', 'Vect2Float', 'Vect2Bool', 'MultisetField',
                'MapStringFloat', 'MapIntDouble', 'MapStringBool'];
for (const f of fields)
   selector.addBranch(f);

selector.Begin = () => {
   console.log('\nBegin processing to load cluster data...');
};

// Now validate entry data
const EPSILON = 1e-7;

let any_error = false;

function compare(expected, value) {
   if (typeof expected === 'number')
      return Math.abs(value - expected) < EPSILON;
   if (typeof expected === 'object') {
      if (expected.length !== undefined) {
         if (expected.length !== value.length)
            return false;
         for (let j = 0; j < expected.length; ++j) {
            if (!compare(expected[j], value[j]))
               return false;
         }
      } else {
         for (const key in expected) {
            if (!compare(expected[key], value[key]))
               return false;
         }
      }
      return true;
   }
   return expected === value;
}

selector.Process = function(entryIndex) {
   console.log(`\nChecking entry ${entryIndex}:`);

   const expectedValues = {
      IntField: entryIndex,
      FloatField: entryIndex * entryIndex,
      DoubleField: entryIndex * 0.5,
      Float16Field: entryIndex * 0.1987333,
      StringField: `entry_${entryIndex}`,
      BoolField: entryIndex % 3 === 1,
      ArrayInt: [entryIndex + 1, entryIndex + 2, entryIndex + 3, entryIndex + 4, entryIndex + 5],
      VariantField: null,
      TupleField: { _0: `tuple_${entryIndex}`, _1: entryIndex*3, _2: (entryIndex % 3 === 1) },
      VectString: [],
      VectInt: [],
      VectBool: [],
      Vect2Float: [],
      Vect2Bool: [],
      MultisetField: [],
      MapStringFloat: [],
      MapIntDouble: [],
      MapStringBool: []
   }, npx = (entryIndex + 5) % 7;

   switch (entryIndex % 3) {
      case 0: expectedValues.VariantField = `varint_${entryIndex}`; break;
      case 1: expectedValues.VariantField = entryIndex; break;
      case 2: expectedValues.VariantField = (entryIndex % 2 === 0); break;
   }

   for (let j = 0; j < npx; ++j) {
      expectedValues.VectString.push(`str_${j}`);
      expectedValues.VectInt.push(-j);
      expectedValues.VectBool.push(j % 2 === 1);

      expectedValues.MultisetField.push(`multiset_${j % 3}`);

      expectedValues.MapStringFloat.push({ first: `key_${j}`, second: j * 7 });
      expectedValues.MapIntDouble.push({ first: j * 11, second: j * 0.2 });
      expectedValues.MapStringBool.push({ first: `bool_${j}`, second: j % 3 === 0 });

      const npy = 1 + entryIndex % 3, vf = [], vb = [];
      for (let k = 0; k < npy; ++k) {
         vf.push(k * 1.1);
         vb.push(k % 2 === 0);
      }
      expectedValues.Vect2Float.push(vf);
      expectedValues.Vect2Bool.push(vb);
   }

   expectedValues.MultisetField.sort();

   for (const field of fields) {
      try {
         const value = this.tgtobj[field],
               expected = expectedValues[field];

         if (!compare(expected, value)) {
            console.error(`FAILURE: ${field} at entry ${entryIndex} expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`);
            any_error = true;
         } else
            console.log(`OK: ${field} at entry ${entryIndex} = ${JSON.stringify(value)}`);
      } catch (err) {
         console.error(`ERROR: Failed to read ${field} at entry ${entryIndex}: ${err.message}`);
         any_error = true;
      }
   }
};

selector.Terminate = () => {
   console.log('Finished processing');
};

// Run rntupleProcess to ensure cluster is loaded
await rntupleProcess(rntuple, selector);

// run again, but select only two entries
await rntupleProcess(rntuple, selector, { elist: [3, 7] });

if (any_error)
   console.error('\nFAILURE when verifying file content');
else
   console.log('\nTest OK');
