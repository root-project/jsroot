// demo how HierarchyPainter can be used without direct display
// in batch display one just able to create images


import { version, HierarchyPainter, draw } from 'jsroot';


console.log(`JSROOT version ${version}`);


const hp = new HierarchyPainter('hpainter');

// configure batch display to properly handle DOM in the node.js
hp.setDisplay('batch');

// catch draw function calls
hp.setDrawFunc((dom, obj, opt) => {
   console.log(`trying to draw ${obj._typename}`);
   return draw(dom, obj, opt);
});

await hp.openRootFile('https://root.cern/js/files/hsimple.root');

// display of TH2 histogram
await hp.display('hpxpy');

await hp.expandItem('ntuple');

// invoking TTree::Draw
await hp.display('ntuple/pz');


// should be BatchDisplay
const disp = hp.getDisplay();

for (let id = 0; id < disp.numFrames(); ++id) {
   const svg = await disp.makeSVG(id);
   console.log(`Frame ${id} create svg size ${svg.length}`);

   // one can save svg plain file
   // writeFileSync(`frame${id}.svg`, svg);
}
