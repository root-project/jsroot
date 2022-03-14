import { version, httpRequest, openFile, makeSVG } from "jsroot";

import { writeFileSync } from "fs";

console.log('JSROOT version', version);

let arg = "https://root.cern/js/files/hsimple.root";

// read complete file as binary buffer and work with it fully locally
if (process.argv && (process.argv[2] == "buf"))
   arg = await httpRequest(arg, "buf");

let file = await openFile(arg);

// now read ntuple, perform Draw operation, create SVG file and sve to the disk
let ntuple = await file.readObject("ntuple");
let hist = await ntuple.Draw("px:py::pz>5");
let svg = await makeSVG({ object: hist, width: 1200, height: 800 });
writeFileSync("tree_draw.svg", svg);
console.log(`Create tree_draw.svg size ${svg.length}`);
