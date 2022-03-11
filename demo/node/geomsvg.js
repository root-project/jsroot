import { httpRequest, version } from 'jsroot';
import { makeSVG } from 'jsroot/draw';

import { writeFileSync } from 'fs';

console.log('JSROOT version', version);

// one could specify rendering engine via options
// r3d_img is normal webgl, create svg:image (default)
// r3d_svg uses SVGRenderer, can produce large output

let obj = await httpRequest('https://root.cern/js/files/geom/simple_alice.json.gz', 'object');

let svg = await makeSVG({ object: obj, width: 1200, height: 800 /*, option: "r3d_svg" */ });

writeFileSync("alice_geom.svg", svg);
console.log(`Create alice_geom.svg size ${svg.length}`);
