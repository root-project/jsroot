let jsroot = require("jsroot");
let fs = require("fs");

console.log('JSROOT version', jsroot.version);

// one could specify rendering engine via options
// r3d_img is normal webgl, create svg:image (default)
// r3d_svg uses SVGRenderer, can produce large output

jsroot.httpRequest("https://root.cern/js/files/geom/simple_alice.json.gz", 'object')
      .then(obj => jsroot.makeSVG({ object: obj, width: 1200, height: 800 /*, option: "r3d_svg" */ }))
      .then(svg => { fs.writeFileSync("alice_geom.svg", svg); console.log(`Create alice_geom.svg size ${svg.length}`); });
