sap.ui.define([
   'sap/ui/core/mvc/Controller',
   'sap/ui/core/ResizeHandler'
], function (Controller, ResizeHandler) {
   "use strict";

   return Controller.extend("sap.ui.jsroot.controller.Panel", {

      onBeforeRendering: function() {
         console.log("Cleanup Panel", this.getView().getId());
         if (this.object_painter) {
            this.object_painter.Cleanup();
            delete this.object_painter;
         }
      },

      drawObject: function(obj, opt) {
         var oController = this;
         oController.object = obj;
         d3.select(oController.getView().getDomRef()).style('overflow','hidden');

         JSROOT.draw(oController.getView().getDomRef(), oController.object, opt, function(painter) {
            console.log("object painting finished");
            oController.object_painter = painter;
            oController.get_callbacks.forEach(function(cb) { JSROOT.CallBack(cb,painter); });
            oController.get_callbacks = [];
         });
      },

      /** method to access object painter
         if object already painted and exists, it will be returned as result
         but it may take time to complete object drawing, therefore callback function should be used like
            var panel = sap.ui.getCore().byId("YourPanelId");
            var object_painter = null;
            panel.getController().getPainter(funciton(painter) {
               object_painter = painter;
            });
      */
      getPainter: function(call_back) {

         if (this.object_painter) {
            JSROOT.CallBack(call_back, this.object_painter);
         } else if (call_back) {
            this.get_callbacks.push(call_back);
         }
         return this.object_painter;
      },

      onAfterRendering: function() {

         if (!this.panel_data) return;

         var oController = this;

         if (oController.panel_data.object) {
            oController.drawObject(oController.panel_data.object, oController.panel_data.opt);
         } else if (oController.panel_data.jsonfilename) {
            JSROOT.NewHttpRequest(oController.panel_data.jsonfilename, 'object', function(obj) {
               oController.drawObject(obj, oController.panel_data.opt);
            }).send();
         } else if (oController.panel_data.filename) {
            JSROOT.OpenFile(oController.panel_data.filename, function(file) {
               file.ReadObject(oController.panel_data.itemname, function(obj) {
                  oController.drawObject(obj, oController.panel_data.opt);
               });
            });
         }
      },

      onResize: function(event) {
         // use timeout
         if (this.resize_tmout) clearTimeout(this.resize_tmout);
         this.resize_tmout = setTimeout(this.onResizeTimeout.bind(this), 300); // minimal latency
      },

      onResizeTimeout: function() {
         delete this.resize_tmout;
         if (this.object_painter)
            this.object_painter.CheckResize();
      },

      onInit: function() {

         this.get_callbacks = []; // list of callbacks

         console.log("Initialization of JSROOT Panel", this.getView().getId());

         var oModel = sap.ui.getCore().getModel(this.getView().getId());
         if (oModel)
            this.panel_data = oModel.getData();

         ResizeHandler.register(this.getView(), this.onResize.bind(this));
      },

      onExit: function() {
         if (this.object_painter) {
            this.object_painter.Cleanup();
            delete this.object_painter;
         }
      }
   });

});
