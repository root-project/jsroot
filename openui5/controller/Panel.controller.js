sap.ui.define([
   'sap/ui/core/mvc/Controller'
], function (Controller) {
   "use strict";

   console.log('READ Panel.controller.js', typeof sapHTML);

   var res = Controller.extend("sap.ui.jsroot.controller.Panel", {

       // preferDOM: true,

       onAfterRendering: function() {
         //if (sap.HTML.prototype.onAfterRendering) {
         //   sapHTML.prototype.onAfterRendering.apply(this, arguments);
         //}
         var view = this.getView();
         console.log('On after rendering', view.getWidth(), view.getHeight());
         var dom = view.getDomRef();
         console.log('DOM ', dom);
       },

       onBeforeRendering: function() {
          //if (sap.HTML.prototype.onAfterRendering) {
          //   sapHTML.prototype.onAfterRendering.apply(this, arguments);
          //}
          var view = this.getView();
          console.log('On before rendering', view.getWidth(), view.getHeight());
          var dom = view.getDomRef();
          console.log('DOM ', dom);
        },

       onInit : function() {
          console.log('INIT PANEL DONE');
      }
   });


   return res;

});
