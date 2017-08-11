sap.ui.define([
   'sap/ui/core/mvc/Controller'
], function (Controller) {
   "use strict";

   console.log('READ Ged.controller.js');

   var gedCtrl = Controller.extend("sap.ui.jsroot.controller.Ged", {

      currentPainter: null,

      gedFragments : [],

      onInit : function() {
         console.log('init GED editor');
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

      onObjectSelect : function(painter, obj) {

         if (this.currentPainter === painter) return;

         this.currentPainter = painter;

         var obj = painter.GetObject();

         console.log('Select painter', obj ? obj._typename : painter.GetTipName());

         var oPage = this.getView().byId("ged_page");
         oPage.removeAllContent();

         var fragm = this.getFragment("TAttLine");
         oPage.addContent(fragm);

         fragm = this.getFragment("TAttFill");
         oPage.addContent(fragm);
      }
   });

   return gedCtrl;

});
