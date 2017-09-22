sap.ui.define([
   'sap/ui/core/mvc/Controller',
   'sap/ui/core/ResizeHandler'
], function (Controller, ResizeHandler) {
   "use strict";

   return Controller.extend("sap.ui.jsroot.controller.Panel", {

      onAfterRendering: function() {
         if (this.after_render_callback) {
            JSROOT.CallBack(this.after_render_callback);
            delete this.after_render_callback;
         }

         if (this.canvas_painter && this.canvas_painter._configured_socket_kind) {
            this.canvas_painter.SetDivId(this.getView().getDomRef(), -1);
            this.canvas_painter.OpenWebsocket(this.canvas_painter._configured_socket_kind);
            delete this.canvas_painter._configured_socket_kind;
         }
      },

      onBeforeRendering: function() {
      },

      onResize: function(event) {
         // use timeout
         if (this.resize_tmout) clearTimeout(this.resize_tmout);
         this.resize_tmout = setTimeout(this.onResizeTimeout.bind(this), 300); // minimal latency
      },

      drawCanvas : function(can, opt, call_back) {
         if (this.canvas_painter) {
            this.canvas_painter.Cleanup();
            delete this.canvas_painter;
         }

         if (!this.getView().getDomRef()) return JSROOT.CallBack(call_back, null);


         var pthis = this;
         JSROOT.draw(this.getView().getDomRef(), can, opt, function(painter) {
            pthis.canvas_painter = painter;
            JSROOT.CallBack(call_back, painter);
         });
      },

      onResizeTimeout: function() {
         delete this.resize_tmout;
         if (this.canvas_painter)
            this.canvas_painter.CheckCanvasResize();
      },

      onInit: function() {
         // this.canvas_painter = JSROOT.openui5_canvas_painter;
         // delete JSROOT.openui5_canvas_painter;

         var oModel = sap.ui.getCore().getModel(this.getView().getId());
         if (oModel) {
            var oData = oModel.getData();
            console.log("Found Panel data for ", this.getView().getId());
            
            if (oData.canvas_painter) {
               this.canvas_painter = oData.canvas_painter;
               delete oData.canvas_painter;
            }
         } else {
            console.log("found no model for", this.getView().getId());
         }
         
         ResizeHandler.register(this.getView(), this.onResize.bind(this));
      },

      onExit: function() {
         if (this.canvas_painter) {
            this.canvas_painter.Cleanup();
            delete this.canvas_painter;
         }
      }
   });

});
