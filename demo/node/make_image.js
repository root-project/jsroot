// Example for makeImage
// Create svg, pdf, png, jpeg images for different kinds of data

import { writeFileSync } from 'fs';
import { version, openFile, makeSVG, makeImage } from 'jsroot';


const width = 1200, height = 800;

console.log(`JSROOT version ${version}`);


function processResults(name, title, svg, pdf, png, jpeg) {
   console.log(`${title} ${name}.svg ${svg.length} ${name}.pdf ${pdf.byteLength} ${name}.png ${png.byteLength} ${name}.jpeg ${jpeg.byteLength}`);

   if (svg.length)
      writeFileSync(`${name}.svg`, svg);
   else
      console.error(`Fail to create SVG for ${title}`);

   if (pdf.byteLength)
      writeFileSync(`${name}.pdf`, pdf);
   else
      console.error(`Fail to create PDF for ${title}`);

   if (png.byteLength)
      writeFileSync(`${name}.png`, png);
   else
      console.error(`Fail to create PNG for ${title}`);

   if (jpeg.byteLength)
      writeFileSync(`${name}.jpeg`, jpeg);
   else
      console.error(`Fail to create JPEG for ${title}`);
}


// loading data
const file = await openFile('https://root.cern/js/files/hsimple.root'),
      hpxpy = await file.readObject('hpxpy;1'),
      file2 = await openFile('https://root.cern/js/files/geom/rootgeom.root'),
      geom = await file2.readObject('simple1;1'),
      file3 = await openFile('https://root.cern/js/files/latex.root'),
      latex = await file3.readObject('ex1;1');

console.log('Read all data');

// testing 2D graphics
const svg1 = await makeSVG({ object: hpxpy, option: 'col', width, height }),
      pdf1buf = await makeImage({ format: 'pdf', as_buffer: true, object: hpxpy, option: 'col', width, height }),
      png1buf = await makeImage({ format: 'png', as_buffer: true, object: hpxpy, option: 'col', width, height }),
      jpeg1buf = await makeImage({ format: 'jpeg', as_buffer: true, object: hpxpy, option: 'col', width, height });

processResults('hist2d', 'histogram col drawing', svg1, pdf1buf, png1buf, jpeg1buf);

// testing 3D graphics
const svg2 = await makeSVG({ object: hpxpy, option: 'lego2', width, height }),
      pdf2buf = await makeImage({ format: 'pdf', as_buffer: true, object: hpxpy, option: 'lego2', width, height }),
      png2buf = await makeImage({ format: 'png', as_buffer: true, object: hpxpy, option: 'lego2', width, height }),
      jpeg2buf = await makeImage({ format: 'jpeg', as_buffer: true, object: hpxpy, option: 'lego2', width, height });

processResults('lego', 'histogram lego drawing', svg2, pdf2buf, png2buf, jpeg2buf);

// testing geometry
const svg3 = await makeSVG({ object: geom, option: '', width, height }),
      pdf3buf = await makeImage({ format: 'pdf', as_buffer: true, object: geom, option: '', width, height }),
      png3buf = await makeImage({ format: 'png', as_buffer: true, object: geom, option: '', width, height }),
      jpeg3buf = await makeImage({ format: 'jpeg', as_buffer: true, object: geom, option: '', width, height });

processResults('geom', 'geometry drawing', svg3, pdf3buf, png3buf, jpeg3buf);

// testing latex with special symbols
const svg4 = await makeSVG({ object: latex, option: '', width, height }),
      pdf4buf = await makeImage({ format: 'pdf', as_buffer: true, object: latex, option: '', width, height }),
      png4buf = await makeImage({ format: 'png', as_buffer: true, object: latex, option: '', width, height }),
      jpeg4buf = await makeImage({ format: 'jpeg', as_buffer: true, object: latex, option: '', width, height });

processResults('latex', 'Canvas with latex and symbols.ttf', svg4, pdf4buf, png4buf, jpeg4buf);

