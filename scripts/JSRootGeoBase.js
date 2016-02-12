/// @file JSRootGeoBase.js
/// JavaScript ROOT 3D geometry base routines


/// @file JSRootGeoPainter.js
/// JavaScript ROOT 3D geometry painter

(function( factory ) {
   if ( typeof define === "function" && define.amd ) {
      // AMD. Register as an anonymous module.
      define( ['JSRootCore', 'THREE_ALL'], factory );
   } else {

      if (typeof JSROOT == 'undefined')
         throw new Error('JSROOT is not defined', 'JSRootGeoBase.js');

      if (typeof THREE == 'undefined')
         throw new Error('THREE is not defined', 'JSRootGeoBase.js');

      factory(JSROOT);
   }
} (function(JSROOT) {


   return JSROOT.GEO;

}));
