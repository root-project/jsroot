sap.ui.define([
   'sap/ui/core/mvc/Controller',
   'sap/ui/model/json/JSONModel',
   'sap/m/Dialog',
   'sap/m/Button',
   'sap/ui/commons/ColorPicker'
], function (Controller, JSONModel, Dialog, Button, ColorPicker) {
   "use strict";

   console.log('READ Ged.controller.js');

   var gedCtrl = Controller.extend("sap.ui.jsroot.controller.Ged", {

      currentPainter: null,

      gedFragments : [],

      onInit : function() {
         console.log('init GED editor');

         var model = new JSONModel({ SelectedClass: "any" });

         //var model = new JSONModel({ fLineWidth: 1, fLineStyle: 2, fLineColor: 3, fFillStyle: 4, fFillColor: 5});
         this.getView().setModel(model);
      },

      onExit : function() {
         console.log('exit GED editor');
         this.currentPainter = null; // remove cross ref
      },

      getFragment : function(kind, force) {
          var fragm = this.gedFragments[kind];
          if (!fragm && force)
             fragm = this.gedFragments[kind] = sap.ui.xmlfragment(this.getView().getId(), "sap.ui.jsroot.view." + kind, this);
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

         this.getView().getModel().setProperty("/SelectedClass", obj ? obj._typename : painter.GetTipName());

         var oPage = this.getView().byId("ged_page");
         oPage.removeAllContent();

         // this.getView().getModel().setProperty("TLineAtt", { fLineWidth: 1, fLineStyle: 2, fLineColor: 'blue' });
         // this.getView().getModel().setProperty("TFillAtt", { fFillStyle: 4, fFillColor: 'red' });

         // model.attachPropertyChange("TLineAtt", this.modelPropertyChange, this);
         // console.log('prop', model.getProperty('/fLineColor'));

         // this.getView().setModel(model);

         var model = new JSONModel({ fLineWidth: 1, fLineStyle: 2, fLineColor: 'blue' });
         var fragm = this.getFragment("TAttLine", true);
         model.attachPropertyChange("TAttLine", this.modelPropertyChange, this);
         fragm.setModel(model);
         oPage.addContent(fragm);

         // console.log(this.getView().getModel());
         // console.log('fragm', fragm.getModel());
         // console.log('line model', this.getView().byId("TAttLine").getModel());

         model = new JSONModel({ fFillStyle: 4, fFillColor: 'red' });
         fragm = this.getFragment("TAttFill", true);
         model.attachPropertyChange("TAttFill", this.modelPropertyChange, this);
         fragm.setModel(model);
         oPage.addContent(fragm);
         //this.getView().byId("TAttFill").setModel(model);
      },

      // TODO: special controller for each fragment
      // this is TAttLine buttons handling

      makeColorDialog : function(fragment, property) {

         var that = this, fragm = this.getFragment(fragment);

         if (!fragm) return null;

         if (!this.colorPicker)
            this.colorPicker = new ColorPicker("colorPicker");

         if (!this.colorDialog) {
            this.colorDialog = new Dialog({
               title: 'Select color',
               content: this.colorPicker,
               beginButton: new Button({
                  text: 'Apply',
                  press: function () {
                     if (that.colorPicker) {
                        var fragm = that.getFragment(that.colorFragment);
                        var col = that.colorPicker.getColorString();
                        fragm.getModel().setProperty(that.colorProperty, col);
                        fragm.getModel().firePropertyChange({ path: that.colorProperty, value: col });
                     }
                     that.colorDialog.close();
                  }
               }),
               endButton: new Button({
                  text: 'Cancel',
                  press: function () {
                     that.colorDialog.close();
                  }
               })
            });
         }

         this.colorFragment = fragment;
         this.colorProperty = property;

         var col = fragm.getModel().getProperty(property);

         that.colorPicker.setColorString(col);
         return this.colorDialog;
      },

      processTAttLine_Style : function() {
      },

      processTAttLine_Color : function() {
         this.makeColorDialog('TAttLine', '/fLineColor').open();
      },

      processTAttFill_Color : function() {
         this.makeColorDialog('TAttFill', '/fFillColor').open();
      }


   });

   return gedCtrl;

});
