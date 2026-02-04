// Example for makeImage
// Create svg, pdf, png, jpeg images for different kinds of data

import { writeFileSync } from 'fs';
import { version, openFile, makeSVG, makeImage } from 'jsroot';


const width = 1200, height = 800;

console.log(`JSROOT version ${version}`);

let outdir = '';
if (process?.argv && process.argv[2])
  outdir = process.argv[2];

function processResults(name, title, svg, svg_ref, svg_diff,
                                     pdf, pdf_ref, pdf_diff,
                                     png, png_ref, png_diff) {
   console.log(`${title} ${name}.svg ${svg.length} ${name}.pdf ${pdf.byteLength} ${name}.png ${png.byteLength}`);

   if (svg.length)
      writeFileSync(`${outdir+name}.svg`, svg);
   else
      console.error(`Fail to create SVG for ${title}`);

   if (Math.abs(svg.length - svg_ref) > svg_diff)
      console.error(`${name}.svg length ${svg.length} differs too much from reference ${svg_ref}`);

   if (pdf.byteLength)
      writeFileSync(`${outdir+name}.pdf`, pdf);
   else
      console.error(`Fail to create PDF for ${title}`);

   if (Math.abs(pdf.byteLength - pdf_ref) > pdf_diff)
      console.error(`${name}.pdf length ${pdf.byteLength} differs too much from reference ${pdf_ref}`);

   if (png.byteLength)
      writeFileSync(`${outdir+name}.png`, png);
   else
      console.error(`Fail to create PNG for ${title}`);

   if (Math.abs(png.byteLength - png_ref) > png_diff)
      console.error(`${name}.png length ${png.byteLength} differs too much from reference ${png_ref}`);
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
      png1buf = await makeImage({ format: 'png', as_buffer: true, object: hpxpy, option: 'col', width, height });

processResults('hist2d', 'histogram col drawing', svg1, 13179, 100, pdf1buf, 33456, 500, png1buf, 56707, 20000);

// testing 3D graphics
const svg2 = await makeSVG({ object: hpxpy, option: 'lego2', width, height }),
      pdf2buf = await makeImage({ format: 'pdf', as_buffer: true, object: hpxpy, option: 'lego2', width, height }),
      png2buf = await makeImage({ format: 'png', as_buffer: true, object: hpxpy, option: 'lego2', width, height });

processResults('lego', 'histogram lego drawing', svg2, 57225, 20000, pdf2buf, 3086057, 1000000, png2buf, 88824, 30000);

// testing geometry
const svg3 = await makeSVG({ object: geom, option: '', width, height }),
      pdf3buf = await makeImage({ format: 'pdf', as_buffer: true, object: geom, option: '', width, height }),
      png3buf = await makeImage({ format: 'png', as_buffer: true, object: geom, option: '', width, height });

processResults('geom', 'geometry drawing', svg3, 92099, 20000, pdf3buf, 68967, 20000, png3buf, 68967, 20000);

// testing latex with special symbols
const svg4 = await makeSVG({ object: latex, option: '', width, height }),
      pdf4buf = await makeImage({ format: 'pdf', as_buffer: true, object: latex, option: '', width, height }),
      png4buf = await makeImage({ format: 'png', as_buffer: true, object: latex, option: '', width, height });

processResults('latex', 'Canvas with latex and symbols.ttf', svg4, 5608, 100, pdf4buf, 9388, 500, png4buf, 41620, 15000);

