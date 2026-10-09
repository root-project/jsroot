import { version, openFile } from 'jsroot';
import { TSelector, treeProcess } from 'jsroot/tree';

// check reading of Long64_t branch, file created with tree_int64_test.cxx

console.log(`JSROOT version ${version}`);

const expected = [0n, 1n, -1n, -2n, -2147483648n, -4294967296n, -4294967297n, -5000000000n,
   -9007199254740991n, -9007199254740992n, -9223372036854775808n,
   4294967296n, 9007199254740991n, 9223372036854775807n];

let filename = './tree_int64_test.root',
    any_error = false;

if (process?.argv && process.argv[2])
   filename = process.argv[2];

const file = await openFile(filename),
      tree = await file.readObject('t'),
      values = [],
      selector = new TSelector();

selector.addBranch('v');
selector.Process = function() { values.push(this.tgtobj.v); };

await treeProcess(tree, selector);

if (values.length !== expected.length) {
   any_error = true;
   console.error(`FAILURE: expected ${expected.length} entries but got ${values.length}`);
}

expected.forEach((exp, i) => {
   const val = values[i];
   if (val === undefined || BigInt(val) !== exp) {
      any_error = true;
      console.error(`FAILURE: entry ${i} expected ${exp} but got ${val}`);
   } else
      console.log(`OK: entry ${i} = ${val}`);
});

if (any_error) {
   console.error('\nFAILURE when reading Long64_t values');
   process.exit(1);
} else
   console.log('\nTest OK');
