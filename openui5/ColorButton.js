sap.ui.define([
   'sap/ui/core/mvc/Controller',
   'sap/m/Button',
   'sap/m/ButtonRenderer',
   'sap/m/Dialog',
   'sap/ui/commons/ColorPicker'
], function (Controller, Button, ButtonRenderer, Dialog, ColorPicker) {
   "use strict";

   console.log('Load ColorButton');

   var ColorButton = Button.extend("sap.ui.jsroot.ColorButton", {
      metadata: {
         properties: {
            mycolor : {type : "string", group : "Misc", defaultValue : null}
         }
      },
      renderer: ButtonRenderer.render,
      init: function() {
         // svg images are always loaded without @2
         this.addEventDelegate({
            onAfterRendering: function() { this._setColor(); }
         }, this);
      }



   });

   ColorButton.prototype._setColor = function() {
      console.log('set color', this.getProperty("mycolor"));
      var dom = this.$();

      dom.children().css('background-color', this.getProperty("mycolor"));
   }

   ColorButton.prototype.firePress = function(args) {
      console.log('COLOR BUTTON - FIRE PRESS', this.getProperty("mycolor"));

      // if (Button.prototype.firePress)
      //   Button.prototype.firePress.call(this, args);

      var that = this;

      if (!this.colorPicker)
         this.colorPicker = new ColorPicker("colorPicker");

      if (!this.colorDialog) {
         this.colorDialog = new Dialog({
            title: 'Select color',
            content: this.colorPicker,
            beginButton: new Button({
               text: 'Apply',
               press: function () {
                  if (that.colorPicker) {
                     var col = that.colorPicker.getColorString();
                      that.setProperty("mycolor", col);
                  }
                  that.colorDialog.close();
               }
            }),
            endButton: new Button({
               text: 'Cancel',
               press: function () {
                  that.colorDialog.close();
               }
            })
         });
      }

      var col = this.getProperty("mycolor");

      this.colorPicker.setColorString(col);
      this.colorDialog.open();
   }

   return ColorButton;

});
