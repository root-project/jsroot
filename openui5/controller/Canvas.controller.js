sap.ui.define([
	'jquery.sap.global',
	'sap/ui/core/Fragment',
   'sap/ui/core/HTML',
	'sap/ui/core/mvc/Controller',
	'sap/ui/model/json/JSONModel',
	'sap/m/Popover',
	'sap/m/Button'
], function (jQuery, Fragment, sapHTML, Controller, JSONModel, Popover, Button) {
	"use strict";

	var CController = Controller.extend("sap.ui.jsroot.controller.Canvas", {
		model : new sap.ui.model.json.JSONModel(),
		data : {
			navigation: [{
				title: 'Root Item',
				icon: 'sap-icon://employee',
				expanded: true,
				key: 'root1',
				items: [{
					title: 'Child Item 1',
					key: 'page1'
				}, {
					title: 'Child Item 2',
					key: 'page2'
				}]
			}, {
				title: 'Root Item',
				icon: 'sap-icon://building',
				key: 'root2'
			}, {
				title: 'Root Item',
				icon: 'sap-icon://card',
				expanded: false,
				items: [{
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}, {
					title: 'Child Item'
				}]
			}, {
				title: 'Root Item',
				icon: 'sap-icon://action',
				expanded: false,
				items: [{
					title: 'Child Item 1'
				}, {
					title: 'Child Item 2'
				}, {
					title: 'Child Item 3'
				}]
			}, {
				title: 'Root Item',
				icon: 'sap-icon://action-settings',
				expanded: false,
				items: [{
					title: 'Child Item 1'
				}, {
					title: 'Child Item 2'
				}, {
					title: 'Child Item 3'
				}]
			}, {
				title: 'Root Item',
				icon: 'sap-icon://activate',
				expanded: false,
				items: [{
					title: 'Child Item 1'
				}, {
					title: 'Child Item 2'
				}, {
					title: 'Child Item 3'
				}]
			}, {
				title: 'Root Item',
				icon: 'sap-icon://activities',
				expanded: false,
				items: [{
					title: 'Child Item 1'
				}, {
					title: 'Child Item 2'
				}, {
					title: 'Child Item 3'
				}]
			}, {
				title: 'Root Item',
				icon: 'sap-icon://add',
				expanded: false,
				items: [{
					title: 'Child Item 1'
				}, {
					title: 'Child Item 2'
				}, {
					title: 'Child Item 3'
				}]
			}, {
				title: 'Root Item',
				icon: 'sap-icon://arobase',
				expanded: false,
				items: [{
					title: 'Child Item 1'
				}, {
					title: 'Child Item 2'
				}, {
					title: 'Child Item 3'
				}]
			}, {
				title: 'Root Item',
				icon: 'sap-icon://attachment',
				expanded: false,
				items: [{
					title: 'Child Item 1'
				}, {
					title: 'Child Item 2'
				}, {
					title: 'Child Item 3'
				}]
			}, {
				title: 'Root Item',
				icon: 'sap-icon://badge',
				expanded: false,
				items: [{
					title: 'Child Item 1'
				}, {
					title: 'Child Item 2'
				}, {
					title: 'Child Item 3'
				}]
			}, {
				title: 'Root Item',
				icon: 'sap-icon://basket',
				expanded: false,
				items: [{
					title: 'Child Item 1'
				}, {
					title: 'Child Item 2'
				}, {
					title: 'Child Item 3'
				}]
			}, {
				title: 'Root Item',
				icon: 'sap-icon://bed',
				expanded: false,
				items: [{
					title: 'Child Item 1'
				}, {
					title: 'Child Item 2'
				}, {
					title: 'Child Item 3'
				}]
			}, {
				title: 'Root Item',
				icon: 'sap-icon://bookmark',
				expanded: false,
				items: [{
					title: 'Child Item 1'
				}, {
					title: 'Child Item 2'
				}, {
					title: 'Child Item 3'
				}]
			}
			],
			fixedNavigation: [{
				title: 'Fixed Item 1',
				icon: 'sap-icon://employee'
			}, {
				title: 'Fixed Item 2',
				icon: 'sap-icon://building'
			}, {
				title: 'Fixed Item 3',
				icon: 'sap-icon://card'
			}],
			headerItems: [
			{
				text: "File"
			}, {
				text: "Edit"
			}, {
				text: "View"
			}, {
				text: "Settings"
			}, {
				text: "Help"
			}]
		},
		onInit : function() {
			this.model.setData(this.data);
			this.getView().setModel(this.model);

			this._setToggleButtonTooltip(!sap.ui.Device.system.desktop);

			/*
			// add HTML content
			var oHtml = new sapHTML({
			   content: "<h3>Creating JSROOT graphics</h3>",
			   onInit: function() {
			      console.log('Init HTML control');
			   },
		       afterRendering: function() {
		          if (sapHTML.prototype.afterRendering) {
		             sapHTML.prototype.afterRendering.apply(this, arguments);
		          }
		          console.log('after rendering');
	        }

			});
		   // oHtml.setContent("<h1>This is the simple</h1>",true);
		   this.getView().byId("root1").addContent(oHtml);
		   */
		},

		onItemSelect : function(oEvent) {
			var item = oEvent.getParameter('item');
			var viewId = this.getView().getId();
			sap.ui.getCore().byId(viewId + "--pageContainer").to(viewId + "--" + item.getKey());
		},

		handleUserNamePress: function (event) {
			var popover = new Popover({
				showHeader: false,
				placement: sap.m.PlacementType.Bottom,
				content:[
					new Button({
						text: 'Feedback',
						type: sap.m.ButtonType.Transparent
					}),
					new Button({
						text: 'Help',
						type: sap.m.ButtonType.Transparent
					}),
					new Button({
						text: 'Logout',
						type: sap.m.ButtonType.Transparent
					})
				]
			}).addStyleClass('sapMOTAPopover sapTntToolHeaderPopover');

			popover.openBy(event.getSource());
		},

		onSideNavButtonPress : function() {
			var viewId = this.getView().getId();
			var toolPage = sap.ui.getCore().byId(viewId + "--toolPage");
			var sideExpanded = toolPage.getSideExpanded();

			this._setToggleButtonTooltip(sideExpanded);

			toolPage.setSideExpanded(!toolPage.getSideExpanded());
		},

		_setToggleButtonTooltip : function(bLarge) {
			var toggleButton = this.getView().byId('sideNavigationToggleButton');
			if (bLarge) {
				toggleButton.setTooltip('Large Size Navigation');
			} else {
				toggleButton.setTooltip('Small Size Navigation');
			}
		}

	});


	return CController;

});
