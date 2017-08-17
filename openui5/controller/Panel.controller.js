sap.ui.define([
   'sap/ui/core/mvc/Controller',
   'sap/ui/core/ResizeHandler',
   'sap/m/Dialog',
   'sap/m/Button'
], function (Controller, ResizeHandler, Dialog, Button) {
   "use strict";

   return Controller.extend("sap.ui.jsroot.controller.Panel", {

       onAfterRendering: function() {
          if (this.canvas_painter && this.canvas_painter._configured_socket_kind) {
             this.canvas_painter.SetDivId(this.getView().getDomRef(), -1);
             this.canvas_painter.OpenWebsocket(this.canvas_painter._configured_socket_kind);
             delete this.canvas_painter._configured_socket_kind;
          }
       },

       onBeforeRendering: function() {
       },

       onResize : function(event) {
          // use timeout
          if (this.resize_tmout) clearTimeout(this.resize_tmout);
          this.resize_tmout = setTimeout(this.onResizeTimeout.bind(this), 300); // minimal latency
       },

       onResizeTimeout : function() {
          delete this.resize_tmout;
          if (this.canvas_painter)
             this.canvas_painter.CheckCanvasResize();
       },

       showInspector : function(obj) {

          if (!obj || !obj._typename) return;

          var iview = new JSROOT.sap.ui.xmlview({ viewName: "sap.ui.jsroot.view.Inspector" });

          iview.getController().setObject(obj);

          var dlg = new Dialog({
             title: 'Inspect: ' + obj._typename,
             content: iview,
             stretch: false,
             contentWidth: "75%",
             endButton: new Button({
                text: 'Close',
                press: function () {
                   dlg.close();
                   dlg.destroy();
                }
             })
          });

          dlg.open();
       },

       onInit : function() {
          this.canvas_painter = JSROOT.openui5_canvas_painter;
          delete JSROOT.openui5_canvas_painter;

          ResizeHandler.register(this.getView(), this.onResize.bind(this));

          this.canvas_painter.ShowObjectInspector = this.showInspector.bind(this);
      },

      onExit : function() {
         if (this.canvas_painter)
            this.canvas_painter.Cleanup();

         delete this.canvas_painter;
      }
   });

});
