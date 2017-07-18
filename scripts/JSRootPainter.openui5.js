/// @file JSRootPainter.openui5.js
/// Part of JavaScript ROOT graphics, dependent from openui5 functionality
/// Openui5 loaded directly in the script

(function( factory ) {
   if ( typeof define === "function" && define.amd ) {
      define( ['jquery', 'jquery-ui', 'd3', 'JSRootPainter', 'JSRootPainter.hierarchy', 'JSRootPainter.jquery' ], factory );
   } else {

      if (typeof jQuery == 'undefined')
         throw new Error('jQuery not defined', 'JSRootPainter.openui5.js');

      if (typeof jQuery.ui == 'undefined')
         throw new Error('jQuery-ui not defined','JSRootPainter.openui5.js');

      if (typeof d3 != 'object')
         throw new Error('This extension requires d3.v3.js', 'JSRootPainter.openui5.js');

      if (typeof JSROOT == 'undefined')
         throw new Error('JSROOT is not defined', 'JSRootPainter.openui5.js');

      if (typeof JSROOT.Painter != 'object')
         throw new Error('JSROOT.Painter not defined', 'JSRootPainter.openui5.js');

      factory(jQuery, jQuery.ui, d3, JSROOT);
   }
} (function($, myui, d3, JSROOT) {

   JSROOT.sources.push("openui5");

   var load_callback = JSROOT.complete_script_load;
   JSROOT.complete_script_load = null; // normal callback is intercepted - we need to instantiate openui5

   JSROOT.completeUI5Loading = function() {
      console.log('complete ui5 loading', typeof sap);
      JSROOT.CallBack(load_callback);
      load_callback = null;
   }

   console.log('start ui5 loading ', typeof jQuery);

   var element = document.createElement("script");

   element.setAttribute('type', "text/javascript");
   element.setAttribute('id', "sap-ui-bootstrap");
   element.setAttribute('src', "https://openui5.hana.ondemand.com/resources/sap-ui-core-nojQuery.js");
//   element.setAttribute('data-sap-ui-trace', "true");
   element.setAttribute('data-sap-ui-libs', "sap.m,sap.ui.table,sap.ui.commons,sap.tnt");
//   element.setAttribute('data-sap-ui-areas', "uiArea1");

   element.setAttribute('data-sap-ui-theme', 'sap_belize');
   element.setAttribute('data-sap-ui-compatVersion', 'edge');
   element.setAttribute('data-sap-ui-preload', 'async');

   element.setAttribute('data-sap-ui-evt-oninit', "JSROOT.completeUI5Loading()");

   var doc = (typeof document === 'undefined') ? JSROOT.nodejs_document : document;
   doc.getElementsByTagName("head")[0].appendChild(element);

   return JSROOT;

}));

