var jsroot = require("jsroot");
var fs = require("fs");

console.log('JSROOT version', jsroot.version);

// Use embed into SVG images for drawing
// Required "npm install canvas" package
//
// jsroot.settings.Render3DBatch = jsroot.constants.Render3D.SVG; // use SVG for 3D rendering

jsroot.HttpRequest("https://root.cern/js/files/geom/simple_alice.json.gz", 'object').then(obj => {
   jsroot.MakeSVG({ object: obj, width: 1200, height: 800 }).then(svg => {
      console.log('Creating alice_geom.svg size', svg.length);
      fs.writeFileSync("alice_geom.svg", svg);
   });
});
