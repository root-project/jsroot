sap.ui.define([
   'sap/ui/core/Control',
   'sap/ui/core/ResizeHandler'
], function (Control, ResizeHandler) {

   "use strict";

   return Control.extend("NavExample.Drawing", {

      metadata : {
         // setter and getter are created behind the scenes, incl. data binding and type validation
         properties : {
            "file" : { type: "sap.ui.model.type.String", defaultValue: "" },
            "item" : { type: "sap.ui.model.type.String", defaultValue: "" },
            "drawopt" : { type: "sap.ui.model.type.String", defaultValue: "" },
            "jsonfile" : { type: "sap.ui.model.type.String", defaultValue: "" }
         }
      },

      // the part creating the HTML:
      renderer: function(oRm, oControl) { // static function, so use the given "oControl" instance instead of "this" in the renderer function
         oRm.write("<div");
         oRm.writeControlData(oControl);  // writes the Control ID and enables event handling - important!
         // oRm.addStyle("background-color", oControl.getColor());  // write the color property; UI5 has validated it to be a valid CSS color
         oRm.addStyle("width", "100%");
         oRm.addStyle("height", "100%");
         oRm.addStyle("overflow", "hidden");
         oRm.writeStyles();
         oRm.writeClasses();              // this call writes the above class plus enables support for Square.addStyleClass(...)
         oRm.write(">");
         oRm.write("</div>"); // no text content to render; close the tag
      },

      onBeforeRendering: function() {
         if (this.resizeid) {
            ResizeHandler.deregister(this.resizeid);
            delete this.resizeid;
         }
         if (this.object_painter) {
            this.object_painter.cleanup();
            delete this.object_painter;
         }
      },

      drawObject: function(obj, options, call_back) {
         this.object = obj;
         this.options = options;
         return JSROOT.draw(this.getDomRef(), obj, options).then(painter => {
            this.object_painter = painter;
            this.resizeid = ResizeHandler.register(this, () => painter.checkResize());
         });
      },

      onAfterRendering: function() {
         let fname = this.getFile();
         let jsonfile = this.getJsonfile();

         if (this.object) {
            // object was already loaded
            this.drawObject(this.object, this.options);
         } else if (jsonfile) {
            JSROOT.httpRequest(jsonfile, 'object')
                  .then(obj => this.drawObject(obj, this.getDrawopt()));
         } else if (fname) {
            JSROOT.openFile(fname)
                  .then(file => file.readObject(this.getItem()))
                  .then(obj => this.drawObject(obj, this.getDrawopt()));
         }
      },

      getPainter: function() {
         return this.object_painter;
      }

   });

});
