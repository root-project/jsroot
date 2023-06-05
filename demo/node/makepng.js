import { version, openFile, makeSVG, svgToImage } from 'jsroot';

import { writeFileSync } from 'fs';

console.log(`JSROOT version ${version}`);

let file = await openFile('https://root.cern/js/files/hsimple.root');
let obj = await file.readObject('hpxpy;1');
let svg = await makeSVG({ object: obj, option: 'lego2', width: 1200, height: 800 });
let buf = await svgToImage(svg, 'png', true);

writeFileSync('test.png', buf);
