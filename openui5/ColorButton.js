sap.ui.define([
   'sap/ui/core/mvc/Controller',
   'sap/m/Button',
   'sap/m/ButtonRenderer',
   'sap/ui/commons/ColorPicker'
], function (Controller, Button, ColorPicker, ButtonRenderer) {
   "use strict";

   console.log('Load ColorButton');

   var ColorButton = Button.extend("sap.ui.jsroot.ColorButton", {
      renderer: ButtonRenderer.render
   });

   return ColorButton;

});
