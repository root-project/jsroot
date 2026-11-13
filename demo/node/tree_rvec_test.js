import { version, openFile } from 'jsroot';
import { TSelector, treeProcess, treeDraw } from 'jsroot/tree';

// test reading of RVec branches written by RDataFrame::Snapshot, file created with tree_rvec_test.cxx

console.log(`JSROOT version ${version}`);

const nentries = 100;

let filename = './tree_rvec_test.root',
    any_error = false,
    err_cnt = 0;

if (process?.argv && process.argv[2])
   filename = process.argv[2];

function failure(msg) {
   any_error = true;
   if (err_cnt++ < 10)
      console.error(`FAILURE: ${msg}`);
}

function check(i, name, arr, n, fexpected) {
   if (arr?.length !== n) {
      failure(`entry ${i} branch ${name} length ${arr?.length} expected ${n}`);
      return;
   }
   for (let k = 0; k < n; ++k) {
      if (arr[k] !== fexpected(k)) {
         failure(`entry ${i} branch ${name} element ${k} value ${arr[k]} expected ${fexpected(k)}`);
         return;
      }
   }
}

const file = await openFile(filename),
      tree = await file.readObject('t'),
      selector = new TSelector();

let cnt = 0;

['n', 'vf', 'vd', 'vi', 'vl', 'vb', 'vs'].forEach(name => selector.addBranch(name));

selector.Process = function() {
   const i = cnt++, n = i % 5, { vf, vd, vi, vl, vb, vs } = this.tgtobj;

   if (this.tgtobj.n !== n)
      failure(`entry ${i} wrong n ${this.tgtobj.n}`);

   check(i, 'vf', vf, n, k => i + 0.5 * k);
   check(i, 'vd', vd, n, k => -i - k);
   check(i, 'vi', vi, n, k => i * 10 + k);
   check(i, 'vl', vl ? Array.from(vl, Number) : vl, n, k => -5000000000 * (k + 1) - i);
   check(i, 'vb', vb ? Array.from(vb, Boolean) : vb, n, k => (i + k) % 2 === 1);
   check(i, 'vs', vs, n, k => String.fromCharCode(97 + i % 26).repeat(k + 1));
};

try {
   await treeProcess(tree, selector);
} catch (err) {
   failure(`exception when reading tree: ${err.message}`);
}

if (cnt !== nentries)
   failure(`expected ${nentries} tree entries but got ${cnt}`);

try {
   const hist = await treeDraw(tree, 'vi');
   // 200 values, sum of all vi values is 101200
   if ((hist.fTsumw !== 200) || (hist.fTsumwx !== 101200))
      failure(`wrong histogram for vi, sumw ${hist.fTsumw} sumwx ${hist.fTsumwx}`);
} catch (err) {
   failure(`exception when drawing vi: ${err.message}`);
}

if (any_error) {
   console.error('\nFAILURE when reading RVec branches');
   process.exit(1);
} else
   console.log(`OK: tree with ${cnt} entries\n\nTest OK`);
