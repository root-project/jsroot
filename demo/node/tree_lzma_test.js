import { version, openFile } from 'jsroot';
import { TSelector, treeProcess } from 'jsroot/tree';

// test LZMA data bigger than one LZMA2 chunk, file created with tree_lzma_test.cxx

console.log(`JSROOT version ${version}`);

const nentries = 600000,
      nbins = 1000;

let filename = './tree_lzma_test.root',
    any_error = false,
    err_cnt = 0;

if (process?.argv && process.argv[2])
   filename = process.argv[2];

function failure(msg) {
   any_error = true;
   if (err_cnt++ < 10)
      console.error(`FAILURE: ${msg}`);
}

const file = await openFile(filename);

const tree = await file.readObject('t'),
      selector = new TSelector();

let cnt = 0;

selector.addBranch('v');
selector.Process = function() {
   if (this.tgtobj.v !== cnt % 1000)
      failure(`entry ${cnt} expected ${cnt % 1000} but got ${this.tgtobj.v}`);
   cnt++;
};

try {
   await treeProcess(tree, selector);
} catch (err) {
   failure(`exception when reading tree: ${err.message}`);
}

if (cnt !== nentries)
   failure(`expected ${nentries} tree entries but got ${cnt}`);
else
   console.log(`OK: tree with ${cnt} entries`);

const cells = (nbins + 2) * (nbins + 2);

let h2 = null;

try {
   h2 = await file.readObject('h2');
} catch (err) {
   failure(`exception when reading histogram: ${err.message}`);
}

if (!h2?.fArray || (h2.fArray.length !== cells))
   failure(`wrong histogram array size ${h2?.fArray?.length}, expected ${cells}`);
else {
   let sum = 0, nonzero = 0;
   for (let i = 0; i < cells; ++i) {
      sum += h2.fArray[i];
      if (h2.fArray[i] !== 0) nonzero++;
   }
   if (h2.fEntries !== nbins + 1)
      failure(`wrong histogram entries ${h2.fEntries}, expected ${nbins + 1}`);
   if ((sum !== 500503) || (nonzero !== nbins + 1))
      failure(`wrong histogram content sum ${sum} nonzero ${nonzero}, expected 500503 and ${nbins + 1}`);
   for (let k = 0; k < nbins; ++k) {
      const bin = (k + 1) + (nbins + 2) * ((k * 7) % nbins + 1);
      if (h2.fArray[bin] !== k + 1)
         failure(`histogram bin ${bin} expected ${k + 1} but got ${h2.fArray[bin]}`);
   }
   if (h2.fArray[6 * (nbins + 2)] !== 3)
      failure(`histogram underflow bin expected 3 but got ${h2.fArray[6 * (nbins + 2)]}`);
   if (!any_error)
      console.log(`OK: histogram with ${cells} bins, entries ${h2.fEntries}, integral ${sum}`);
}

if (any_error) {
   console.error('\nFAILURE when reading LZMA compressed data');
   process.exit(1);
} else
   console.log('\nTest OK');
