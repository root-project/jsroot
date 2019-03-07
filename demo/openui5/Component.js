sap.ui.define(['sap/ui/core/UIComponent'],
   function(UIComponent) {

   "use strict";

   var Component = UIComponent.extend("NavExample.Component", {
      metadata : {
         rootView : "NavExample.view.Main",
         dependencies : {
            libs : [
               "sap.m",
               "sap.ui.layout"
            ]
         },
         includes : [ "css/style.css" ],
         config : {
            sample : {
               files : [
                  "view/Main.view.xml",
                  "view/Panel.view.xml",
                  "controller/Main.controller.js",
                  "controller/Panel.controller.js",
                  "css/style.css"
               ]
            }
         }
      }
   });

   return Component;

});
