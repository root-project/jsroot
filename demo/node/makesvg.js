let jsroot = require("jsroot");
let fs = require("fs");

console.log('JSROOT version', jsroot.version);

// For histogram object one could specify rendering engine via options
// r3d_img is normal webgl, create svg:image (default)
// r3d_svg uses SVGRenderer, can produce large output

jsroot.openFile("https://root.cern/js/files/hsimple.root")
      .then(file => file.readObject("hpxpy;1"))
      .then(obj => jsroot.makeSVG( { object: obj, option: "lego2,pal50", width: 1200, height: 800 }))
      .then(svg => { fs.writeFileSync("lego2.svg", svg); console.log(`Create lego2.svg size ${svg.length}`); });
