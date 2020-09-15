var jsroot = require("jsroot");
var fs = require("fs");

console.log('JSROOT version', jsroot.version);

//Use embed into SVG images for drawing
//Required "npm install canvas" package
//
jsroot.settings.Render3DBatch = jsroot.constants.Render3D.SVG; // use SVG for 3D rendering

jsroot.OpenFile("https://root.cern/js/files/hsimple.root").then(file => {
   file.ReadObject("hpx;1").then(obj => {
      jsroot.MakeSVG( { object: obj, option: "lego2,pal50", width: 1200, height: 800 }).then(svg => {
         fs.writeFileSync("lego2.svg", svg);
         console.log('Create lego2.svg size', svg.length);
      });
   });
});
