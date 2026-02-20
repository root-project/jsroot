// Example for creation of use of custom palette

import { writeFileSync } from 'fs';
import { version, openFile, makeSVG, setColorPalette } from 'jsroot';

const width = 1200, height = 800;

console.log(`JSROOT version ${version}`);

// loading data
const file = await openFile('https://root.cern/js/files/hsimple.root'),
      hpxpy = await file.readObject('hpxpy;1'),
      colors = [
         'rgb(24, 29, 29)', 'rgb(30, 37, 37)',
         'rgb(35, 45, 45)', 'rgb(42, 55, 55)',
         'rgb(52, 69, 70)', 'rgb(62, 84, 85)',
         'rgb(71, 97, 99)', 'rgb(78, 108, 112)',
         'rgb(85, 120, 124)', 'rgb(92, 130, 136)',
         'rgb(97, 138, 146)', 'rgb(101, 146, 156)',
         'rgb(106, 152, 165)', 'rgb(109, 156, 172)',
         'rgb(112, 160, 178)', 'rgb(115, 161, 182)',
         'rgb(117, 160, 183)', 'rgb(119, 159, 184)',
         'rgb(123, 157, 184)', 'rgb(127, 155, 185)',
         'rgb(131, 152, 186)', 'rgb(125, 139, 172)',
         'rgb(115, 121, 153)', 'rgb(105, 104, 134)'
      ];

// configure custom color palette
setColorPalette(11, colors);

// produce svg with 2D graphics
const svg = await makeSVG({ object: hpxpy, option: 'col,pal11', width, height });

writeFileSync('custom_palette.svg', svg);

const ref_size = 13180;

if (Math.abs(svg.length - ref_size) > 200)
   console.error(`FAIL: custom_palette.svg length ${svg.length} differs too much from reference ${ref_size}`);
else
   console.log(`OK: custom_palette.svg length ${svg.length}`);
