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
         var model = new JSONModel();
         // such data can be produced on the server, convert to JSON with TBufferJSON and transferred via socket
         model.setData({
            dataNames:[
               { Id:"1", Name: "Data1" },
               { Id:"2", Name: "Data2" },
               { Id:"3", Name: "Data3" }
            ],
            modelNames: [
               { Id:"1", Name: "Model1" },
               { Id:"2", Name: "Model2" },
               { Id:"3", Name: "Model3" }
            ]

         });
         this.getView().setModel(model);
      },

      // function called from GuiPanelController
      onPanelExit : function() {
      },

      handleFitPress : function() {
         console.log('Press fit');
         // To now with very simple logic
         // One can bind some parameters direct to the model and use values from model
         var v1 = this.getView().byId("FitData"),
             v2 = this.getView().byId("FitModel");

         if (this.websocket && v1 && v2)
            this.websocket.Send('DOFIT:"' + v1.getValue() + '","' + v2.getValue() + '"');
      }

   });

});
