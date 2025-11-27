// demo how HierarchyPainter can be used without direct display
// in batch display one just able to create images


import { version, HierarchyPainter, draw, addDrawFunc } from 'jsroot';
// import { writeFileSync } from 'fs';

console.log(`JSROOT version ${version}`);


const hp = new HierarchyPainter('hpainter');

// configure batch display to properly handle DOM in the node.js
hp.setDisplay('batch');

// catch draw function calls
addDrawFunc({
   name: '*',
   func: (dom, obj, opt) => {
      console.log(`Actual draw of ${obj._typename}`);
      // if function return true no normal drawing will be performed
      // do not try to call `draw` function from here !!!
      // return true;
   }
});

await hp.openRootFile('https://root.cern/js/files/hsimple.root');

// display of TH2 histogram
console.log('Invoke histogram drawing');
await hp.display('hpxpy');

await hp.expandItem('ntuple');

// invoking TTree::Draw
console.log('Invoke TBranch drawing');
await hp.display('ntuple/pz');

// should be BatchDisplay
const disp = hp.getDisplay();

for (let id = 0; id < disp.numFrames(); ++id) {
   const svg = await disp.makeSVG(id);

   console.log(`Frame ${id} create svg size ${svg.length}`);

   // one can save svg plain file
   // writeFileSync(`frame${id}.svg`, svg);
}
