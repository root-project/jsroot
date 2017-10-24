sap.ui.define([
   'sap/ui/jsroot/GuiPanelController',
   'sap/ui/model/json/JSONModel'
], function (GuiPanelController, JSONModel) {
   "use strict";

   return GuiPanelController.extend("sap.ui.jsroot.controller.FitPanel", {

      // function called from GuiPanelController
      onPanelInit : function() {

         var id = this.getView().getId();
         console.log("Initialization FitPanel id = " + id);

         var model = new JSONModel({ SelectedClass: "none" });
         this.getView().setModel(model);
      },

      // function called from GuiPanelController
      onPanelExit : function() {
      },

      handleFitPress : function() {
      },

      handleClosePress : function() {
         var main = sap.ui.getCore().byId("TopCanvasId");
         if (main) main.getController().showLeftArea("");
         else if (window) window.close();
      }

   });

});
