import { version, openFile, treeDraw, treeProcess, TSelector } from 'jsroot';

console.log(`JSROOT version ${version}`);

// Macro demonstrates three different methods to produce entries list which match
// specific cut condition. It is:
// 1. Use of string draw expression for treeDraw function
// 2. Use object as option for treeDraw operation
// 3. Direct use of TSelector to process tree and select entries

function compareArrays(arr1, arr2) {
   if (arr1.length !== arr2.length)
      return false;
   for (let i = 0; i < arr1.length; ++i) {
      if (arr1[i] !== arr2[i])
         return false;
   }
   return true;
}

// open file
const file = await openFile('https://root.cern/js/files/hsimple.root');

// read ntuple
const ntuple = await file.readObject('ntuple');

// use treeDraw to extract array of entries which match condition 'pz>5'
const entries1 = await treeDraw(ntuple, '::pz>5>>elist');
console.log('entries1', entries1.length);

// same can be achieved when specify draw expression as args
const entries2 = await treeDraw(ntuple, { cut: 'pz>5', dump_entries: true });
console.log('entries2', entries2.length);

const selector = new TSelector, entries3 = [];
selector.addBranch('pz');
selector.Process = function(entry) {
   if (this.tgtobj.pz > 5)
      entries3.push(entry);
}
await treeProcess(ntuple, selector);
console.log('entries3', entries3.length);

if (!compareArrays(entries1, entries2))
   console.error('Entries 1 and 2 differs');

if (!compareArrays(entries1, entries3))
   console.error('Entries 1 and 3 differs');

if (!compareArrays(entries2, entries3))
   console.error('Entries 2 and 3 differs');


// And in the second stage extract values of 'px' branch only for
// selected entries. Again three different approaches are used:
// 1. Use string expression for treeDraw
// 2. Use object as argument for treeDraw
// 3. Use selector with treeProcess and elist options

// now use these selected entries to dump values of px branch
const pxarr1 = await treeDraw(ntuple, `px;dump;elist:[${entries1}]`);
console.log('pxarr1', pxarr1.length);

// same expression, but provided as object
const pxarr2 = await treeDraw(ntuple, { expr: 'px', dump: true, elist: entries2});
console.log('pxarr2', pxarr2.length);

// and use entries list as argument for treeProcess
const selector2 = new TSelector, pxarr3 = [];
selector2.addBranch('px');
selector2.Process = function() {
   pxarr3.push(this.tgtobj.px);
}
await treeProcess(ntuple, selector2, { elist: entries3 });
console.log('pxarr3', pxarr3.length);

if (!compareArrays(pxarr1, pxarr2))
   console.error('px arrays 1 and 2 differs');

if (!compareArrays(pxarr1, pxarr3))
   console.error('px arrays 1 and 3 differs');

if (!compareArrays(pxarr2, pxarr3))
   console.error('px arrays 2 and 3 differs');
