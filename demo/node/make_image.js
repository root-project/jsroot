import { version, openFile, makeImage } from 'jsroot';

import { writeFileSync } from 'fs';

console.log(`JSROOT version ${version}`);

// loading data
let file = await openFile('https://root.cern/js/files/hsimple.root');
let hpxpy = await file.readObject('hpxpy;1');
let file2 = await openFile('https://root.cern/js/files/geom/rootgeom.root');
let geom = await file2.readObject('simple1;1');

// testing 2D graphics
let svg1 = await makeSVG({ object: hpxpy, option: 'col', width: 1200, height: 800 });
let png1buf = await makeImage({ format: 'png', as_buffer: true, object: hpxpy, option: 'col', width: 1200, height: 800 });
let jpeg1buf = await makeImage({ format: 'jpeg', as_buffer: true, object: hpxpy, option: 'col', width: 1200, height: 800 });

console.log(`histogram col test1.svg ${svg1.length} test1.png ${png1buf.byteLength} test1.jpeg ${jpeg1buf.byteLength}`);
writeFileSync('test1.svg', svg1);
writeFileSync('test1.png', png1buf);
writeFileSync('test1.jpeg', jpeg1buf);


// testing 3D graphics
let svg2 = await makeSVG({ object: hpxpy, option: 'lego2', width: 1200, height: 800 });
let png2buf = await makeImage({ format: 'png', as_buffer: true, object: hpxpy, option: 'lego2', width: 1200, height: 800 });
let jpeg2buf = await makeImage({ format: 'jpeg', as_buffer: true, object: hpxpy, option: 'lego2', width: 1200, height: 800 });

console.log(`histogram lego2 test2.svg ${svg2.length} test2.png ${png2buf.byteLength} test2.jpeg ${jpeg2buf.byteLength}`);
writeFileSync('test2.svg', svg2);
writeFileSync('test2.png', png2buf);
writeFileSync('test2.jpeg', jpeg2buf);


// testing geometry
let svg3 = await makeSVG({ object: geom, option: '', width: 1200, height: 800 });
let png3buf = await makeImage({ format: 'png', as_buffer: true, object: geom, option: '', width: 1200, height: 800 });
let jpeg3buf = await makeImage({ format: 'jpeg', as_buffer: true, object: geom, option: '', width: 1200, height: 800 });

console.log(`geometry test3.svg ${svg3.length} test3.png ${png3buf.byteLength} test3.jpeg ${jpeg3buf.byteLength}`);
writeFileSync('test3.svg', svg3);
writeFileSync('test3.png', png3buf);
writeFileSync('test3.jpeg', jpeg3buf);
