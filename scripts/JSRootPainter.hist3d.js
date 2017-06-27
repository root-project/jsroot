/// @file JSRootPainter.hist3d.js
/// 3D histogram graphics

(function( factory ) {
   if ( typeof define === "function" && define.amd ) {
      // AMD. Register as an anonymous module.
      define( ['JSRootPainter', 'd3', 'JSRootPainter.hist', 'JSRoot3DPainter',], factory );
   } else
   if (typeof exports === 'object' && typeof module !== 'undefined') {
       factory(require("./JSRootCore.js"), require("./d3.min.js"));
   } else {

      if (typeof d3 != 'object')
         throw new Error('This extension requires d3.js', 'JSRootPainter.hist3d.js');

      if (typeof JSROOT == 'undefined')
         throw new Error('JSROOT is not defined', 'JSRootPainter.hist3d.js');

      if (typeof JSROOT.Painter != 'object')
         throw new Error('JSROOT.Painter not defined', 'JSRootPainter.hist3d.js');

      // Browser globals
      factory(JSROOT, d3);
   }
} (function(JSROOT, d3) {

   JSROOT.sources.push("hist3d");

   return JSROOT.Painter;

}));
