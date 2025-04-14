import { version, httpRequest, openFile, makeSVG, treeDraw } from 'jsroot';

import { writeFileSync } from 'fs';

console.log(`JSROOT version ${version}`);

let arg = 'https://root.cern/js/files/hsimple.root';

// read complete file as binary buffer and work with it fully locally
if (process.argv && (process.argv[2] == 'buf'))
   arg = await httpRequest(arg, 'buf');

const file = await openFile(arg);

// now read ntuple, perform Draw operation, create SVG file and sve to the disk
const ntuple = await file.readObject('ntuple');
const hist = await treeDraw(ntuple, 'px:py::pz>5');
hist.fTitle = 'Example of TTree::Draw';
const svg = await makeSVG({ object: hist, width: 1200, height: 800 });
writeFileSync('tree_draw1.svg', svg);
console.log(`Create tree_draw1.svg size ${svg.length}`);

// extract entries list which corresponds to cut expression
const elist = await treeDraw(ntuple, '::pz>5>>elist');
// apply entries list for draw expression
const hist2 = await treeDraw(ntuple, { expr: 'px:py', elist });
hist2.fTitle = 'Example of TTree::Draw';
const svg2 = await makeSVG({ object: hist2, width: 1200, height: 800 });
writeFileSync('tree_draw2.svg', svg2);
console.log(`Create tree_draw2.svg size ${svg2.length}`);

// check if produced SVG files are the same
if (svg !== svg2)
   console.error('FAILURE: svg and svg2 do not match');


// check that staged drawing also produce same results
const hist3 = await treeDraw(ntuple, 'px:py::pz>5;staged');
hist3.fTitle = 'Example of TTree::Draw';
const svg3 = await makeSVG({ object: hist3, width: 1200, height: 800 });
writeFileSync('tree_draw3.svg', svg3);
console.log(`Create tree_draw3.svg size ${svg3.length}`);

// check if produced SVG files are the same
if (svg !== svg3)
   console.error('FAILURE: svg and svg3 do not match');

if ((svg === svg2) && (svg2 === svg3))
   console.log('OK: all svg files match!')
