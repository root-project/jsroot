import { version, openFile, makeSVG, makeImage } from 'jsroot';

import { writeFileSync } from 'fs';

console.log(`JSROOT version ${version}`);

const width = 1200, height = 800;

// loading data
let file = await openFile('https://root.cern/js/files/hsimple.root');
let hpxpy = await file.readObject('hpxpy;1');
let file2 = await openFile('https://root.cern/js/files/geom/rootgeom.root');
let geom = await file2.readObject('simple1;1');

// testing 2D graphics
let svg1 = await makeSVG({ object: hpxpy, option: 'col', width, height });
let png1buf = await makeImage({ format: 'png', as_buffer: true, object: hpxpy, option: 'col', width, height });
let jpeg1buf = await makeImage({ format: 'jpeg', as_buffer: true, object: hpxpy, option: 'col', width, height });

writeFileSync('test1.svg', svg1);
writeFileSync('test1.png', png1buf);
writeFileSync('test1.jpeg', jpeg1buf);

console.log(`histogram col drawing test1.svg ${svg1.length} test1.png ${png1buf.byteLength} test1.jpeg ${jpeg1buf.byteLength}`);

// testing 3D graphics
let svg2 = await makeSVG({ object: hpxpy, option: 'lego2', width, height });
let png2buf = await makeImage({ format: 'png', as_buffer: true, object: hpxpy, option: 'lego2', width, height });
let jpeg2buf = await makeImage({ format: 'jpeg', as_buffer: true, object: hpxpy, option: 'lego2', width, height });

writeFileSync('test2.svg', svg2);
writeFileSync('test2.png', png2buf);
writeFileSync('test2.jpeg', jpeg2buf);

console.log(`histogram lego drawing test2.svg ${svg2.length} test2.png ${png2buf.byteLength} test2.jpeg ${jpeg2buf.byteLength}`);


// testing geometry
let svg3 = await makeSVG({ object: geom, option: '', width, height });
let png3buf = await makeImage({ format: 'png', as_buffer: true, object: geom, option: '', width, height });
let jpeg3buf = await makeImage({ format: 'jpeg', as_buffer: true, object: geom, option: '', width, height });

writeFileSync('test3.svg', svg3);
writeFileSync('test3.png', png3buf);
writeFileSync('test3.jpeg', jpeg3buf);

console.log(`geometry test3.svg ${svg3.length} test3.png ${png3buf.byteLength} test3.jpeg ${jpeg3buf.byteLength}`);
