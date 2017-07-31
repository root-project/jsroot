sap.ui.define([
   "sap/ui/core/mvc/Controller"
], function (Controller) {
   "use strict";

   return Controller.extend("sap.ui.jsroot.controller.Canvas", {

      onShowHello : function () {
         // show a native JavaScript alert
         /* eslint-disable no-alert */
         alert("Hello World");
         /* eslint-enable no-alert */
      }
   });

});