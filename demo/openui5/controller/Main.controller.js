sap.ui.define([
   'sap/ui/core/mvc/Controller',
   'sap/m/MessageToast'
],  function(Controller, MessageToast) {
   "use strict";

   let CController = Controller.extend("NavExample.controller.Main", {

      handleNav: function(evt) {
         let navCon = this.getView().byId("navCon"),
            target = evt.getSource().data("target");
         if (target) {
            let animation = this.getView().byId("animationSelect").getSelectedKey();
            navCon.to(this.getView().byId(target), animation);
         } else {
            navCon.back();
         }
      },

      handlePainter: function() {
         let navCon = this.getView().byId("navCon"),
             page = navCon.getCurrentPage(),
             panel = page.getContent()[0],
             painter = panel.getPainter();

         if (painter)
            MessageToast.show(`Access painter for ${painter.getClassName()} on page ${page.getId()}`);

      }
   });


   return CController;

});
