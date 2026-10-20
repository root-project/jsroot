import { version, openFile, TSelector } from 'jsroot';
import { rntupleProcess } from 'jsroot/rntuple';

// check reading of std::bitset fields with more than 31 bits, file created with rntuple_bitset_test.cxx

console.log(`JSROOT version ${version}`);

let filename = './rntuple_bitset_test.root',
    any_error = false;

if (process?.argv && process.argv[2])
   filename = process.argv[2];

const file = await openFile(filename),
      rntuple = await file.readObject('Data'),
      selector = new TSelector();

let nentries = 0;

selector.addBranch('Bitset32');
selector.addBranch('Bitset48');

selector.Process = function(entry) {
   nentries++;
   const expected = {
      Bitset32: 2 ** entry + 2 ** (31 - entry),
      Bitset48: 2 ** entry + 2 ** (30 + entry) + 2 ** 47
   };
   for (const name in expected) {
      const value = this.tgtobj[name];
      if (value !== expected[name]) {
         any_error = true;
         console.error(`FAILURE: ${name} at entry ${entry} expected ${expected[name]} but got ${value}`);
      } else
         console.log(`OK: ${name} at entry ${entry} = ${value}`);
   }
};

await rntupleProcess(rntuple, selector);

if (nentries !== 10) {
   any_error = true;
   console.error(`FAILURE: expected 10 entries but got ${nentries}`);
}

if (any_error) {
   console.error('\nFAILURE when reading std::bitset values');
   process.exit(1);
} else
   console.log('\nTest OK');
