sap.ui.define(['sap/ui/core/UIComponent'],
   function(UIComponent) {

   "use strict";

   var Component = UIComponent.extend("NavExample.Component", {
      metadata : {
         rootView : "NavExample.V",
         dependencies : {
            libs : [
               "sap.m",
               "sap.ui.layout"
            ]
         },
         includes : [ "style.css" ],
         config : {
            sample : {
               files : [
                  "V.view.xml",
                  "C.controller.js",
                  "Panel.view.xml",
                  "Panel.controller.js",
                  "style.css"
               ]
            }
         }
      }
   });

   return Component;

});
