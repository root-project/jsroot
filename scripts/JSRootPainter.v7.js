/// @file JSRootPainter.v7.js
/// JavaScript ROOT graphics for ROOT v7 classes

(function( factory ) {
   if ( typeof define === "function" && define.amd ) {
      define( ['JSRootPainter', 'd3'], factory );
   } else
   if (typeof exports === 'object' && typeof module !== 'undefined') {
       factory(require("./JSRootCore.js"), require("./d3.min.js"));
   } else {

      if (typeof d3 != 'object')
         throw new Error('This extension requires d3.js', 'JSRootPainter.v7.js');

      if (typeof JSROOT == 'undefined')
         throw new Error('JSROOT is not defined', 'JSRootPainter.v7.js');

      if (typeof JSROOT.Painter != 'object')
         throw new Error('JSROOT.Painter not defined', 'JSRootPainter.v7.js');

      factory(JSROOT, d3);
   }
} (function(JSROOT, d3) {

   "use strict";

   JSROOT.sources.push("v7");
   
   JSROOT.v7 = {}; // placeholer for all v7-relevant code

   return JSROOT;

}));