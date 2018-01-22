sap.ui.define([
   'sap/ui/core/Control',
   'sap/ui/core/ResizeHandler'
], function (Control, ResizeHandler) {
   "use strict";

   var SVGSample = Control.extend("sap.ui.jsroot.SVGSample", {
      metadata: {
         properties: {
            mycolor : {type : "string", group : "Misc", defaultValue : null}
         },
         defaultAggregation: null
      },

      init: function() {

         console.log('init');

         // svg images are always loaded without @2
         this.addEventDelegate({
            onAfterRendering: function() { this._setSVG(); }
         }, this);

         // ResizeHandler.register(this.getView(), this.onResize.bind(this));
      },

      renderer: function(oRm,oControl){
         //first up, render a div for the ShadowBox
         oRm.write("<div");

         //next, render the control information, this handles your sId (you must do this for your control to be properly tracked by ui5).
         oRm.writeControlData(oControl);


         oRm.addClass("sapUiSizeCompact");
         oRm.addClass("sapMSlt");

         oRm.writeClasses();

         oRm.addStyle("width","50%");
         // oRm.addStyle("height","100%");

         oRm.writeStyles();

         oRm.write(">");

         //next, iterate over the content aggregation, and call the renderer for each control
         //$(oControl.getContent()).each(function(){
         //    oRm.renderControl(this);
         //});

         //and obviously, close off our div
         oRm.write("</div>")
     },
   });

   SVGSample.prototype._setSVG = function() {
      var dom = this.$();

      dom.append("p").text("SVG").css('background-color', 'yellow');
      console.log('create SVG', dom.width(), dom.parent().height());
   }

   SVGSample.prototype.onResize = function() {
      var dom = this.$();
      console.log('resize SVG', dom.width(), dom.parent().height());
   }

   return SVGSample;

});
