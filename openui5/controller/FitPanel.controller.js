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
         var v1 = this.getView().byId("FitData");
         if (v1) console.log('data', v1.getValue());
         var v2 = this.getView().byId("FitModel");
         if (v2) console.log('model', v2.getValue());

         if (this.websocket)
            this.websocket.Send('DOFIT:"' + v1.getValue() + '","' + v2.getValue() + '"');
      }

   });

});
