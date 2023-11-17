// Example for makeImage
// Create svg, pdf, png, jpeg images for different kinds of data

import { version, openFile, makeSVG, makeImage } from 'jsroot';

import { writeFileSync } from 'fs';

console.log(`JSROOT version ${version}`);

const width = 1200, height = 800;

// loading data
const file = await openFile('https://root.cern/js/files/hsimple.root'),
      hpxpy = await file.readObject('hpxpy;1'),
      file2 = await openFile('https://root.cern/js/files/geom/rootgeom.root'),
      geom = await file2.readObject('simple1;1');


// testing 2D graphics
const svg1 = await makeSVG({ object: hpxpy, option: 'col', width, height }),
      pdf1buf = await makeImage({ format: 'pdf', as_buffer: true, object: hpxpy, option: 'col', width, height }),
      png1buf = await makeImage({ format: 'png', as_buffer: true, object: hpxpy, option: 'col', width, height }),
      jpeg1buf = await makeImage({ format: 'jpeg', as_buffer: true, object: hpxpy, option: 'col', width, height });

writeFileSync('test1.svg', svg1);
writeFileSync('test1.pdf', pdf1buf);
writeFileSync('test1.png', png1buf);
writeFileSync('test1.jpeg', jpeg1buf);

console.log(`histogram col drawing test1.svg ${svg1.length} test1.pdf ${pdf1buf.byteLength} test1.png ${png1buf.byteLength} test1.jpeg ${jpeg1buf.byteLength}`);

// testing 3D graphics
const svg2 = await makeSVG({ object: hpxpy, option: 'lego2', width, height }),
      pdf2buf = await makeImage({ format: 'pdf', as_buffer: true, object: hpxpy, option: 'lego2', width, height }),
      png2buf = await makeImage({ format: 'png', as_buffer: true, object: hpxpy, option: 'lego2', width, height }),
      jpeg2buf = await makeImage({ format: 'jpeg', as_buffer: true, object: hpxpy, option: 'lego2', width, height });

writeFileSync('test2.svg', svg2);
writeFileSync('test2.pdf', pdf2buf);
writeFileSync('test2.png', png2buf);
writeFileSync('test2.jpeg', jpeg2buf);

console.log(`histogram lego drawing test2.svg ${svg2.length} test2.pdf ${pdf2buf.byteLength} test2.png ${png2buf.byteLength} test2.jpeg ${jpeg2buf.byteLength}`);


// testing geometry
const svg3 = await makeSVG({ object: geom, option: '', width, height }),
      pdf3buf = await makeImage({ format: 'pdf', as_buffer: true, object: geom, option: '', width, height }),
      png3buf = await makeImage({ format: 'png', as_buffer: true, object: geom, option: '', width, height }),
      jpeg3buf = await makeImage({ format: 'jpeg', as_buffer: true, object: geom, option: '', width, height });

writeFileSync('test3.svg', svg3);
writeFileSync('test3.pdf', pdf3buf);
writeFileSync('test3.png', png3buf);
writeFileSync('test3.jpeg', jpeg3buf);

console.log(`geometry test3.svg ${svg3.length} test3.pdf ${pdf3buf.byteLength} test3.png ${png3buf.byteLength} test3.jpeg ${jpeg3buf.byteLength}`);
