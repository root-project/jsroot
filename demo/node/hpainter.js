import { version, HierarchyPainter } from 'jsroot';


console.log(`JSROOT version ${version}`);


const hp = new HierarchyPainter('batch', null);

hp.setDrawFunc((dom, obj, opt) => {
   console.log(`trying to draw ${obj._typename}`);
   return null;
});

await hp.openRootFile('https://root.cern/js/files/hsimple.root');

// display of TH2 histogram
await hp.display('hpxpy');

await hp.expandItem('ntuple');

// invoking TTree::Draw
await hp.display('ntuple/pz');

