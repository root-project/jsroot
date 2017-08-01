sap.ui.define([
	'sap/ui/core/mvc/Controller'
], function (Controller) {
	"use strict";

	var CController = Controller.extend("sap.ui.jsroot.controller.Canvas", {
		onInit : function() {
		   console.log('On Canvas controller init')
		}

	});


	return CController;

});
