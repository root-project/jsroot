sap.ui.define([
   "sap/ui/core/UIComponent"
], function (UIComponent, JSONModel, ResourceModel) {
   "use strict";
   return UIComponent.extend("sap.ui.jsroot.Component", {
       metadata : {
         rootView: "sap.ui.jsroot.view.Canvas"
       },
       init : function () {
         // call the init function of the parent
         UIComponent.prototype.init.apply(this, arguments);
      }
   });
});