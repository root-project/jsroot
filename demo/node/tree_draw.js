let jsroot = require("jsroot");
let fs = require("fs");

console.log('JSROOT version', jsroot.version);

let read_promise, url = "https://root.cern/js/files/hsimple.root";

if (process.argv && (process.argv[2] == "buf"))
   // read complete file as binary buffer and work with it fully locally
   read_promise = jsroot.httpRequest(url, "buf")
                        .then(buf => jsroot.openFile(buf));
else
   // normal file open, only required data will be read
   read_promise = jsroot.openFile(url);

// now read ntuple, perform Draw operation, create SVG file and sve to the disk
read_promise.then(file => file.readObject("ntuple"))
            .then(ntuple => ntuple.Draw("px:py::pz>5"))
            .then(hist => jsroot.makeSVG({ object: hist, width: 1200, height: 800 }))
            .then(svg => { fs.writeFileSync("tree_draw.svg", svg); console.log(`Create tree_draw.svg size ${svg.length}`); });
