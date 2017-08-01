sap.ui.define([
   'jquery.sap.global',
	'sap/ui/core/mvc/Controller',
   'sap/m/MessageToast'

], function (jQuery, Controller, MessageToast) {
	"use strict";

	var CController = Controller.extend("sap.ui.jsroot.controller.Canvas", {
		onInit : function() {
		   console.log('On Canvas controller init');
		   this._Page = this.getView().byId("CanvasMainPage");
		},

		getCanvasPainter : function(also_without_websocket) {
         var elem = this.getView().byId("jsroot_canvas");

         // console.log('typeof ', typeof elem, typeof elem.oController);

         if (!elem || !elem.oController || !elem.oController.canvas_painter) return null;

         var p = elem.oController.canvas_painter;

         if (!also_without_websocket && !p._websocket) return null;

         return p;

		},

		onFileMenuAction : function (oEvent) {
         //var oItem = oEvent.getParameter("item"),
         //    sItemPath = "";
         //while (oItem instanceof sap.m.MenuItem) {
         //   sItemPath = oItem.getText() + " > " + sItemPath;
         //   oItem = oItem.getParent();
         //}
         //sItemPath = sItemPath.substr(0, sItemPath.lastIndexOf(" > "));

		   var p = this.getCanvasPainter();
		   if (!p) return;

		   var name = oEvent.getParameter("item").getText();

         switch (name) {
            case "Close canvas": p.OnWebsocketClosed(); p.CloseWebsocket(true); break;
            case "Interrupt": p._websocket.send("GEXE:gROOT->SetInterrupt()"); break;
            case "Quit ROOT": p._websocket.send("GEXE:gApplication->Terminate(0)"); break;
         }

         MessageToast.show("Action triggered on item: " + name);
		},

		onCloseCanvasPress : function() {
		   var p = this.getCanvasPainter();
         if (p) {
            p.OnWebsocketClosed();
            p.CloseWebsocket(true);
         }
		},

		onInterruptPress : function() {
		   var p = this.getCanvasPainter();
         if (p) p._websocket.send("GEXE:gROOT->SetInterrupt()");
		},

		onQuitRootPress : function() {
		   var p = this.getCanvasPainter();
         if (p) p._websocket.send("GEXE:gApplication->Terminate(0)");
		},


		ShowCanvasStatus : function (text1,text2,text3,text4) {
		   this.getView().byId("FooterLbl1").setText(text1);
		   this.getView().byId("FooterLbl2").setText(text2);
		   this.getView().byId("FooterLbl3").setText(text3);
		   this.getView().byId("FooterLbl4").setText(text4);
		},

		onViewMenuAction : function (oEvent) {
         var p = this.getCanvasPainter(true);
         if (!p) return;

         var item = oEvent.getParameter("item"),
             name = item.getText();

         var new_state = !item.getIcon();

         switch (name) {
            case "Editor":  break;
            case "Toolbar":
               this._Page.setShowSubHeader(new_state)
               break;
            case "Event statusbar":
               this._Page.setShowFooter(new_state);
               if (new_state) {
                  p.ShowStatus = this.ShowCanvasStatus.bind(this);
               } else {
                  delete p.ShowStatus;
               }
               break;
            case "Tooltip info": p.SetTooltipAllowed(new_state); break;
            default: return;
         }

         item.setIcon(new_state ? "sap-icon://accept" : "");

         // MessageToast.show("Action triggered on item: " + name);
		}

	});


	return CController;

});
