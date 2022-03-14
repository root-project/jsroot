import { version, openFile, makeSVG } from "jsroot";

import { writeFileSync } from "fs";

console.log('JSROOT version', version);

// For histogram object one could specify rendering engine via options
// r3d_img is normal webgl, create svg:image (default)
// r3d_svg uses SVGRenderer, can produce large output

let file = await openFile("https://root.cern/js/files/hsimple.root");
let obj = await file.readObject("hpxpy;1");
let svg = await makeSVG({ object: obj, option: "lego2,pal50", width: 1200, height: 800 });
writeFileSync("lego2.svg", svg);
console.log(`Create lego2.svg size ${svg.length}`);
