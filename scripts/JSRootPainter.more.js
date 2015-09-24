/// @file JSRootPainter.more.js
/// Part of JavaScript ROOT graphics with more classes like TEllipse, TLine, ...
/// Such classes are rarely used and therefore loaded only on demand

(function( factory ) {
   if ( typeof define === "function" && define.amd ) {
      // AMD. Register as an anonymous module.
      define( ['d3', 'JSRootPainter'], factory );
   } else {

      if (typeof d3 != 'object') {
         var e1 = new Error('This extension requires d3.v3.js');
         e1.source = 'JSRootPainter.jquery.js';
         throw e1;
      }

      if (typeof JSROOT == 'undefined') {
         var e1 = new Error('JSROOT is not defined');
         e1.source = 'JSRootPainter.jquery.js';
         throw e1;
      }

      if (typeof JSROOT.Painter != 'object') {
         var e1 = new Error('JSROOT.Painter not defined');
         e1.source = 'JSRootPainter.jquery.js';
         throw e1;
      }

      // Browser globals
      factory(d3, JSROOT);
   }
} (function(d3, JSROOT) {


   JSROOT.Painter.drawEllipse = function(divid, obj, opt, painter) {

      painter.ellipse = obj;
      painter.SetDivId(divid);

      // function used for live update of object
      painter['UpdateObject'] = function(obj) {
         // copy all fields
         JSROOT.extend(this.ellipse, obj);
      }

      painter['Redraw'] = function() {
         var lineatt = JSROOT.Painter.createAttLine(this.ellipse);
         var fillatt = this.createAttFill(this.ellipse);

         // create svg:g container for ellipse drawing
         this.RecreateDrawG(this.main_painter() == null);

         var x = this.AxisToSvg("x", this.ellipse.fX1);
         var y = this.AxisToSvg("y", this.ellipse.fY1);
         var rx = this.AxisToSvg("x", this.ellipse.fX1 + this.ellipse.fR1) - x;
         var ry = y - this.AxisToSvg("y", this.ellipse.fY1 + this.ellipse.fR2);

         if ((this.ellipse.fPhimin == 0) && (this.ellipse.fPhimax == 360) && (this.ellipse.fTheta == 0)) {
            // this is simple case, which could be drawn with svg:ellipse
            this.draw_g
                .append("svg:ellipse")
                .attr("cx", x.toFixed(1)).attr("cy", y.toFixed(1))
                .attr("rx", rx.toFixed(1)).attr("ry", ry.toFixed(1))
                .call(lineatt.func).call(fillatt.func);
            return;
         }

         // here svg:path is used to draw more complex figure

         var ct = Math.cos(Math.PI*this.ellipse.fTheta/180.);
         var st = Math.sin(Math.PI*this.ellipse.fTheta/180.);

         var dx1 =  rx * Math.cos(this.ellipse.fPhimin*Math.PI/180.);
         var dy1 =  ry * Math.sin(this.ellipse.fPhimin*Math.PI/180.);
         var x1 =  dx1*ct - dy1*st;
         var y1 = -dx1*st - dy1*ct;

         var dx2 = rx * Math.cos(this.ellipse.fPhimax*Math.PI/180.);
         var dy2 = ry * Math.sin(this.ellipse.fPhimax*Math.PI/180.);
         var x2 =  dx2*ct - dy2*st;
         var y2 = -dx2*st - dy2*ct;

         this.draw_g
            .attr("transform","translate("+x.toFixed(1)+","+y.toFixed(1)+")")
            .append("svg:path")
            .attr("d", "M 0,0" +
                       " L " + x1.toFixed(1) + "," + y1.toFixed(1) +
                       " A " + rx.toFixed(1) + " " + ry.toFixed(1) + " " + -this.ellipse.fTheta.toFixed(1) + " 1 0 " + x2.toFixed(1) + "," + y2.toFixed(1) +
                       " L 0,0 Z")
            .call(lineatt.func).call(fillatt.func);
      }

      painter.Redraw(); // actual drawing
      return painter.DrawingReady();
   }

   JSROOT.Painter.drawLine = function(divid, obj, opt, painter) {

      painter.line = obj;
      painter.SetDivId(divid);

      // function used for live update of object
      painter['UpdateObject'] = function(obj) {
         // copy all fields
         JSROOT.extend(this.line, obj);
      }

      painter['Redraw'] = function() {
         var lineatt = JSROOT.Painter.createAttLine(this.line);

         // create svg:g container for line drawing
         this.RecreateDrawG(this.main_painter() == null);

         var x1 = this.AxisToSvg("x", this.line.fX1);
         var y1 = this.AxisToSvg("y", this.line.fY1);
         var x2 = this.AxisToSvg("x", this.line.fX2);
         var y2 = this.AxisToSvg("y", this.line.fY2);

         this.draw_g
             .append("svg:line")
             .attr("x1", x1.toFixed(1))
             .attr("y1", y1.toFixed(1))
             .attr("x2", x2.toFixed(1))
             .attr("y2", y2.toFixed(1))
             .call(lineatt.func);
      }

      painter.Redraw(); // actual drawing
      return painter.DrawingReady();
   }

   JSROOT.Painter.drawArrow = function(divid, obj, opt, painter) {

      painter.arrow = obj;
      painter.SetDivId(divid);

      // function used for live update of object
      painter['UpdateObject'] = function(obj) {
         // copy all fields
         JSROOT.extend(this.arrow, obj);
      }

      painter['Redraw'] = function() {
         var lineatt = JSROOT.Painter.createAttLine(this.arrow);

         // create svg:g container for line drawing
         this.RecreateDrawG(this.main_painter() == null);

         var x1 = this.AxisToSvg("x", this.arrow.fX1);
         var y1 = this.AxisToSvg("y", this.arrow.fY1);
         var x2 = this.AxisToSvg("x", this.arrow.fX2);
         var y2 = this.AxisToSvg("y", this.arrow.fY2);

         this.draw_g
             .append("svg:line")
             .attr("x1", x1.toFixed(1))
             .attr("y1", y1.toFixed(1))
             .attr("x2", x2.toFixed(1))
             .attr("y2", y2.toFixed(1))
             .call(lineatt.func);
      }

      painter.Redraw(); // actual drawing
      return painter.DrawingReady();
   }


   return JSROOT.Painter;

}));
