import { version, openFile } from 'jsroot';
import { TSelector, treeProcess } from 'jsroot/tree';

// test reading of objects with custom streamers, file created with tree_tobject_test.cxx

console.log(`JSROOT version ${version}`);

const nentries = 100;

let filename = './tree_tobject_test.root',
    any_error = false,
    err_cnt = 0;

if (process?.argv && process.argv[2])
   filename = process.argv[2];

function failure(msg) {
   any_error = true;
   if (err_cnt++ < 10)
      console.error(`FAILURE: ${msg}`);
}

const file = await openFile(filename),
      tree = await file.readObject('t'),
      selector = new TSelector();

let cnt = 0;

selector.addBranch('lv');
selector.addBranch('v3');
selector.addBranch('gr');
selector.addBranch('dt');

selector.Process = function() {
   const i = cnt++, { lv, v3, gr, dt } = this.tgtobj;

   if ((lv?.fP?.fX !== i) || (lv.fP.fY !== 2 * i) || (lv.fP.fZ !== 3 * i) || (lv.fE !== 4 * i + 1))
      failure(`entry ${i} wrong TLorentzVector ${JSON.stringify(lv)}`);

   if ((v3?.fX !== i) || (v3.fY !== -i) || (v3.fZ !== 0.5 * i))
      failure(`entry ${i} wrong TVector3 ${JSON.stringify(v3)}`);

   if ((gr?.fNpoints !== 3) || (gr.fX?.[2] !== 2) || (gr.fY?.[2] !== i + 2))
      failure(`entry ${i} wrong TGraph npoints ${gr?.fNpoints} x ${gr?.fX?.[2]} y ${gr?.fY?.[2]}`);

   // TDatime has no version header, seconds are stored in lower 6 bits
   const sec = Number.isInteger(dt?.fDatime) ? dt.fDatime & 0x3f : -1;
   if (sec !== i % 60)
      failure(`entry ${i} wrong TDatime seconds ${sec}`);
};

try {
   await treeProcess(tree, selector);
} catch (err) {
   failure(`exception when reading tree: ${err.message}`);
}

if (cnt !== nentries)
   failure(`expected ${nentries} tree entries but got ${cnt}`);

if (any_error) {
   console.error('\nFAILURE when reading objects with custom streamers');
   process.exit(1);
} else
   console.log(`OK: tree with ${cnt} entries\n\nTest OK`);
