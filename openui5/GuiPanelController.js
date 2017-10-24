sap.ui.define([
   'sap/ui/core/mvc/Controller',
   'sap/ui/model/json/JSONModel'
], function (Controller, JSONModel) {
   "use strict";

   return Controller.extend("sap.ui.jsroot.GuiPanelController", {

      onInit : function() {

         var id = this.getView().getId();
         console.log("Initialization GuiPanel id = " + id);
         if (this.onPanelInit) this.onPanelInit();
      },

      onExit : function() {
         if (this.onPanelExit) this.onPanelExit();
         console.log("Closing GuiPanel id = " + this.getView().getId());
      }

   });

});
