sap.ui.define([
   'sap/ui/core/mvc/Controller'
], function (Controller) {
   "use strict";

   console.log('READ Panel.controller.js');

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

         if (this.canvas_painter && this.canvas_painter._configured_socket_kind) {
            this.canvas_painter.SetDivId(dom, -1);
            this.canvas_painter.OpenWebsocket(this.canvas_painter._configured_socket_kind);
            delete this.canvas_painter._configured_socket_kind;
         }

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

          this.canvas_painter = JSROOT.openui5_canvas_painter;
          delete JSROOT.openui5_canvas_painter;
          console.log('INIT PANEL DONE', typeof this.canvas_painter);
      }
   });


   return res;

});
