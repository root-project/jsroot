let jsroot = require("jsroot");
let fs = require("fs");

console.log('JSROOT version', jsroot.version);

let file, url = "https://root.cern/js/files/hsimple.root";

if (process.argv && (process.argv[2] == "buf")) {
   // read complete file as binary buffer and work with it fully locally
   let buf = await jsroot.httpRequest(url, "buf");
   file = await jsroot.openFile(buf);
} else {
   // normal file open, only required data will be read
   file = await jsroot.openFile(url);
}

// now read ntuple, perform Draw operation, create SVG file and sve to the disk
let ntuple = await file.readObject("ntuple");
let hist = await ntuple.Draw("px:py::pz>5");
let svg = await jsroot.makeSVG({ object: hist, width: 1200, height: 800 });
fs.writeFileSync("tree_draw.svg", svg);
console.log(`Create tree_draw.svg size ${svg.length}`);
