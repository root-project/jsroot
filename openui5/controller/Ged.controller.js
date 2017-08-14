sap.ui.define([
   'sap/ui/core/mvc/Controller',
   'sap/ui/model/json/JSONModel'
], function (Controller, JSONModel) {
   "use strict";

   console.log('READ Ged.controller.js');

   var gedCtrl = Controller.extend("sap.ui.jsroot.controller.Ged", {

      currentPainter: null,

      gedFragments : [],

      onInit : function() {
         console.log('init GED editor');
         //var model = new JSONModel({ fLineWidth: 1, fLineStyle: 2, fLineColor: 3, fFillStyle: 4, fFillColor: 5});
         //this.getView().setModel(model);
      },

      onExit : function() {
         console.log('exit GED editor');
         this.currentPainter = null; // remove cross ref
      },

      getFragment : function(kind) {
          var fragm = this.gedFragments[kind];
          if (!fragm)
             fragm = this.gedFragments[kind] = sap.ui.xmlfragment(this.getView().getId(), "sap.ui.jsroot.view." + kind);
          return fragm;
      },

      modelPropertyChange : function(evnt, data) {
         var pars = evnt.getParameters();
         console.log('Model property changes', pars.path, pars.value, data);
      },

      onObjectSelect : function(painter, obj) {

         if (this.currentPainter === painter) return;

         this.currentPainter = painter;

         var obj = painter.GetObject();

         console.log('Select painter', obj ? obj._typename : painter.GetTipName());

         var oPage = this.getView().byId("ged_page");
         oPage.removeAllContent();

         var model = new JSONModel({ fLineWidth: 1, fLineStyle: 2, fLineColor: 3, fFillStyle: 4, fFillColor: 5});
         model.attachPropertyChange("TLineAtt", this.modelPropertyChange, this);
         // model.attachPropertyChange({}, function() { console.log('change here');});

         this.getView().setModel(model);

         var fragm = this.getFragment("TAttLine");
         fragm.setModel(model);
         oPage.addContent(fragm);

         // console.log(this.getView().getModel());
         // console.log('fragm', fragm.getModel());
         // console.log('line model', this.getView().byId("TAttLine").getModel());

         fragm = this.getFragment("TAttFill");
         fragm.setModel(model);
         oPage.addContent(fragm);
         //this.getView().byId("TAttFill").setModel(model);
      }
   });

   return gedCtrl;

});
