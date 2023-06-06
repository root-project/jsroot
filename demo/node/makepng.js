import { version, openFile, makeSVG, makeImage, svgToImage } from 'jsroot';

import { writeFileSync } from 'fs';

console.log(`JSROOT version ${version}`);

let file = await openFile('https://root.cern/js/files/hsimple.root');
let hpxpy = await file.readObject('hpxpy;1');

// testing 2D graphics
let svg1 = await makeSVG({ object: hpxpy, option: 'col', width: 1200, height: 800 });
let png1 = await makeImage({ format: 'png', object: hpxpy, option: 'col', width: 1200, height: 800 });
let jpeg1 = await makeImage({ format: 'jpeg', object: hpxpy, option: 'col', width: 1200, height: 800 });
let jpeg1buf = await makeImage({ format: 'jpeg', as_buffer: true, object: hpxpy, option: 'col', width: 1200, height: 800 });

console.log(`Create test1.jpeg size ${jpeg1buf.byteLength}`);

writeFileSync('test1.jpeg', jpeg1buf);


//console.log(`create PNG image test.png size ${buf.byteLength}`);

// testing 3D graphics
let svg2 = await makeSVG({ object: hpxpy, option: 'lego2', width: 1200, height: 800 });
let png2 = await makeImage({ format: 'png', object: hpxpy, option: 'lego2', width: 1200, height: 800 });
let jpeg2 = await makeImage({ format: 'jpeg', object: hpxpy, option: 'lego2', width: 1200, height: 800 });
let jpeg2buf = await makeImage({ format: 'jpeg', as_buffer: true, object: hpxpy, option: 'lego2', width: 1200, height: 800 });

console.log(`Create test2.jpeg size ${jpeg2buf.byteLength}`);

writeFileSync('test2.jpeg', jpeg2buf);

