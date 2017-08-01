sap.ui.define([
   'jquery.sap.global',
	'sap/ui/core/mvc/Controller',
   'sap/m/MessageToast'

], function (jQuery, Controller, MessageToast) {
	"use strict";

	var CController = Controller.extend("sap.ui.jsroot.controller.Canvas", {
		onInit : function() {
		   console.log('On Canvas controller init')
		},
		onMenuAction : function (oEvent) {
         //var oItem = oEvent.getParameter("item"),
         //    sItemPath = "";
         //while (oItem instanceof sap.m.MenuItem) {
         //   sItemPath = oItem.getText() + " > " + sItemPath;
         //   oItem = oItem.getParent();
         //}
         //sItemPath = sItemPath.substr(0, sItemPath.lastIndexOf(" > "));

		   var name = oEvent.getParameter("item").getText();

         var elem = this.byId("jsroot_canvas");

         //console.log('typeof ', typeof elem, typeof elem.oController);

         if (!elem || !elem.oController || !elem.oController.canvas_painter) return;

         var p = elem.oController.canvas_painter;

         if (!p._websocket) return;

         console.log('Execute ' + name);

         switch (name) {
            case "Close canvas": p.OnWebsocketClosed(); p.CloseWebsocket(true); break;
            case "Interrupt": p._websocket.send("GEXE:gROOT->SetInterrupt()"); break;
            case "Quit ROOT": p._websocket.send("GEXE:gApplication->Terminate(0)"); break;
         }

         MessageToast.show("Action triggered on item: " + name);

         //var obj = jQuery("#jsroot_canvas").control();
         //console.log('typeof ', typeof obj, obj);
         //if (obj) console.log('typeof painter', typeof obj.canvas_painter);
		}

	});


	return CController;

});
