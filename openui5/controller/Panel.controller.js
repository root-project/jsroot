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
         if (this.after_render_callback) {
            JSROOT.CallBack(this.after_render_callback);
            delete this.after_render_callback;
         }

         if (this.canvas_painter && this.canvas_painter._configured_socket_kind) {
            this.canvas_painter.SetDivId(this.getView().getDomRef(), -1);
            this.canvas_painter.OpenWebsocket(this.canvas_painter._configured_socket_kind);
            delete this.canvas_painter._configured_socket_kind;
         }

         if (this.panel_data) {
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
         }
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

         this.get_callbacks = []; // list of callbacks

         console.log("Initialization of JSROOT Panel", this.getView().getId());

         var oModel = sap.ui.getCore().getModel(this.getView().getId());
         if (oModel) {
            var oData = oModel.getData();

            if (oData.canvas_painter) {
               this.canvas_painter = oData.canvas_painter;
               delete oData.canvas_painter;
            } else {
               this.panel_data = oData;
               // console.log("data", oData);
            }
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
