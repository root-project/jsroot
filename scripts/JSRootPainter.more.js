/// @file JSRootPainter.more.js
/// Part of JavaScript ROOT graphics with more classes like TEllipse, TLine, ...
/// Such classes are rarely used and therefore loaded only on demand

(function( factory ) {
   if ( typeof define === "function" && define.amd ) {
      // AMD. Register as an anonymous module.
      define( ['d3', 'JSRootPainter'], factory );
   } else {

      if (typeof d3 != 'object')
         throw new Error('This extension requires d3.v3.js', 'JSRootPainter.more.js');

      if (typeof JSROOT == 'undefined')
         throw new Error('JSROOT is not defined', 'JSRootPainter.more.js');

      if (typeof JSROOT.Painter != 'object')
         throw new Error('JSROOT.Painter not defined', 'JSRootPainter.more.js');

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

   // =============================================================================

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

   // ======================================================================================

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
         var fillatt = this.createAttFill(this.arrow);

         var wsize = Math.max(this.pad_width(), this.pad_height()) * this.arrow.fArrowSize;
         if (wsize<3) wsize = 3;
         var hsize = wsize * Math.tan(this.arrow.fAngle/2 * (Math.PI/180));

         // create svg:g container for line drawing
         this.RecreateDrawG(this.main_painter() == null);

         var x1 = this.AxisToSvg("x", this.arrow.fX1);
         var y1 = this.AxisToSvg("y", this.arrow.fY1);
         var x2 = this.AxisToSvg("x", this.arrow.fX2);
         var y2 = this.AxisToSvg("y", this.arrow.fY2);

         var right_arrow = "M0,0" + " L"+wsize.toFixed(1) +","+hsize.toFixed(1) + " L0," + (hsize*2).toFixed(1);
         var left_arrow =  "M" + wsize.toFixed(1) + ", 0" + " L 0," + hsize.toFixed(1) + " L " + wsize.toFixed(1) + "," + (hsize*2).toFixed(1);

         var m_start = null, m_mid = null, m_end = null, defs = null;

         var oo = this.arrow.fOption;
         var len = oo.length;

         if (oo.indexOf("<")==0) {
            var closed = (oo.indexOf("<|") == 0);
            if (!defs) defs = this.draw_g.append("defs");
            m_start = "jsroot_arrowmarker_" +  JSROOT.Painter['arrowcnt']++;
            var beg = defs.append("svg:marker")
                .attr("id", m_start)
                .attr("markerWidth", wsize.toFixed(1))
                .attr("markerHeight", (hsize*2).toFixed(1))
                .attr("refX", "0")
                .attr("refY", hsize.toFixed(1))
                .attr("orient", "auto")
                .attr("markerUnits", "userSpaceOnUse")
                .append("svg:path")
                .style("fill","none")
                .attr("d", left_arrow + (closed ? " Z" : ""))
                .call(lineatt.func);
            if (closed) beg.call(fillatt.func);
         }

         var midkind = 0;
         if (oo.indexOf("->-")>=0)  midkind = 1; else
         if (oo.indexOf("-|>-")>=0) midkind = 11; else
         if (oo.indexOf("-<-")>=0) midkind = 2; else
         if (oo.indexOf("-<|-")>=0) midkind = 12;

         if (midkind > 0) {
            var closed = midkind > 10;
            if (!defs) defs = this.draw_g.append("defs");
            m_mid = "jsroot_arrowmarker_" +  JSROOT.Painter['arrowcnt']++;

            var mid = defs.append("svg:marker")
              .attr("id", m_mid)
              .attr("markerWidth", wsize.toFixed(1))
              .attr("markerHeight", (hsize*2).toFixed(1))
              .attr("refX", (wsize*0.5).toFixed(1))
              .attr("refY", hsize.toFixed(1))
              .attr("orient", "auto")
              .attr("markerUnits", "userSpaceOnUse")
              .append("svg:path")
              .style("fill","none")
              .attr("d", ((midkind % 10 == 1) ? right_arrow : left_arrow) +
                         ((midkind > 10) ? " Z" : ""))
              .call(lineatt.func);
            if (midkind > 10) mid.call(fillatt.func);
         }

         if (oo.lastIndexOf(">") == len-1) {
            var closed = (oo.lastIndexOf("|>") == len-2) && (len>1);
            if (!defs) defs = this.draw_g.append("defs");
            m_end = "jsroot_arrowmarker_" +  JSROOT.Painter['arrowcnt']++;
            var end = defs.append("svg:marker")
              .attr("id", m_end)
              .attr("markerWidth", wsize.toFixed(1))
              .attr("markerHeight", (hsize*2).toFixed(1))
              .attr("refX", wsize.toFixed(1))
              .attr("refY", hsize.toFixed(1))
              .attr("orient", "auto")
              .attr("markerUnits", "userSpaceOnUse")
              .append("svg:path")
              .style("fill","none")
              .attr("d", right_arrow + (closed ? " Z" : ""))
              .call(lineatt.func);
            if (closed) end.call(fillatt.func);
         }

         var path = this.draw_g
             .append("svg:path")
             .attr("d",  "M" + x1.toFixed(1) + "," + y1.toFixed(1) +
                      ((m_mid == null) ? "" : "L" + (x1/2+x2/2).toFixed(1) + "," + (y1/2+y2/2).toFixed(1)) +
                        " L" + x2.toFixed(1) + "," + y2.toFixed(1))
             .call(lineatt.func);

         if (m_start!=null) path.style("marker-start","url(#" + m_start + ")");
         if (m_mid!=null) path.style("marker-mid","url(#" + m_mid + ")");
         if (m_end!=null) path.style("marker-end","url(#" + m_end + ")");
      }

      if (!('arrowcnt' in JSROOT.Painter)) JSROOT.Painter['arrowcnt'] = 0;

      painter.Redraw(); // actual drawing
      return painter.DrawingReady();
   }

   // ===================================================================================

   JSROOT.Painter.drawFunction = function(divid, tf1, opt, painter) {

      painter['tf1'] = tf1;
      painter['bins'] = null;

      painter['GetObject'] = function() {
         return this.tf1;
      }

      painter['Redraw'] = function() {
         this.DrawBins();
      }

      painter['Eval'] = function(x) {
         return this.tf1.evalPar(x);
      }

      painter['CreateDummyHisto'] = function() {
         var xmin = 0, xmax = 0, ymin = 0, ymax = 0;
         if (this.tf1['fSave'].length > 0) {
            // in the case where the points have been saved, useful for example
            // if we don't have the user's function
            var nb_points = this.tf1['fNpx'];
            for (var i = 0; i < nb_points; ++i) {
               var h = this.tf1['fSave'][i];
               if ((i == 0) || (h > ymax))
                  ymax = h;
               if ((i == 0) || (h < ymin))
                  ymin = h;
            }
            xmin = this.tf1['fSave'][nb_points + 1];
            xmax = this.tf1['fSave'][nb_points + 2];
         } else {
            // we don't have the points, so let's try to interpret the function
            // use fNpfits instead of fNpx if possible (to use more points)
            if (this.tf1['fNpfits'] <= 103)
               this.tf1['fNpfits'] = 103;
            xmin = this.tf1['fXmin'];
            xmax = this.tf1['fXmax'];
            var nb_points = Math.max(this.tf1['fNpx'], this.tf1['fNpfits']);

            var binwidthx = (xmax - xmin) / nb_points;
            var left = -1, right = -1;
            for (var i = 0; i < nb_points; ++i) {
               var h = this.Eval(xmin + (i * binwidthx));
               if (isNaN(h)) continue;

               if (left < 0) {
                  left = i;
                  ymax = h;
                  ymin = h;
               }
               if ((right < 0) || (right == i - 1))
                  right = i;

               if (h > ymax) ymax = h;
               if (h < ymin) ymin = h;
            }

            if (left < right) {
               xmax = xmin + right * binwidthx;
               xmin = xmin + left * binwidthx;
            }
         }

         if (ymax > 0.0) ymax *= 1.05;
         if (ymin < 0.0) ymin *= 1.05;

         var histo = JSROOT.Create("TH1I");

         histo['fName'] = this.tf1['fName'] + "_hist";
         histo['fTitle'] = this.tf1['fTitle'];

         histo['fXaxis']['fXmin'] = xmin;
         histo['fXaxis']['fXmax'] = xmax;
         histo['fYaxis']['fXmin'] = ymin;
         histo['fYaxis']['fXmax'] = ymax;

         return histo;
      }

      painter['CreateBins'] = function() {

         var pthis = this;

         if (this.tf1['fSave'].length > 0) {
            // in the case where the points have been saved, useful for example
            // if we don't have the user's function
            var nb_points = this.tf1['fNpx'];

            var xmin = this.tf1['fSave'][nb_points + 1];
            var xmax = this.tf1['fSave'][nb_points + 2];
            var binwidthx = (xmax - xmin) / nb_points;

            this['bins'] = d3.range(nb_points).map(function(p) {
               return {
                  x : xmin + (p * binwidthx),
                  y : pthis.tf1['fSave'][p]
               };
            });
            this['interpolate_method'] = 'monotone';
         } else {
            var main = this.main_painter();

            if (this.tf1['fNpfits'] <= 103)
               this.tf1['fNpfits'] = 333;
            var xmin = this.tf1['fXmin'], xmax = this.tf1['fXmax'], logx = false;

            if (main['zoom_xmin'] != main['zoom_xmax']) {
               if (main['zoom_xmin'] > xmin) xmin = main['zoom_xmin'];
               if (main['zoom_xmax'] < xmax) xmax = main['zoom_xmax'];
            }

            if (main.options.Logx && (xmin>0) && (xmax>0)) {
               logx = true;
               xmin = Math.log(xmin);
               xmax = Math.log(xmax);
            }

            var nb_points = Math.max(this.tf1['fNpx'], this.tf1['fNpfits']);
            var binwidthx = (xmax - xmin) / nb_points;
            this['bins'] = d3.range(nb_points).map(function(p) {
               var xx = xmin + (p * binwidthx);
               if (logx) xx = Math.exp(xx);
               var yy = pthis.Eval(xx);
               if (isNaN(yy)) yy = 0;
               return { x : xx, y : yy };
            });

            this['interpolate_method'] = 'monotone';
         }
      }

      painter['DrawBins'] = function() {
         var w = this.frame_width(), h = this.frame_height();

         this.RecreateDrawG(false, ".main_layer", false);

         // recalculate drawing bins when necessary
         if ((this['bins']==null) || (this.tf1['fSave'].length==0)) this.CreateBins();

         var pthis = this;
         var pmain = this.main_painter();

         var name = this.GetItemName();
         if ((name==null) || (name=="")) name = this.tf1.fName;
         if (name.length > 0) name += "\n";

         var attline = JSROOT.Painter.createAttLine(this.tf1);
         var fill = this.createAttFill(this.tf1);
         if (fill.color == 'white') fill.color = 'none';

         var line = d3.svg.line()
                      .x(function(d) { return pmain.grx(d.x).toFixed(1); })
                      .y(function(d) { return pmain.gry(d.y).toFixed(1); })
                      .interpolate(this.interpolate_method);

         var area = d3.svg.area()
                     .x(function(d) { return pmain.grx(d.x).toFixed(1); })
                     .y1(h)
                     .y0(function(d) { return pmain.gry(d.y).toFixed(1); });

         if (attline.color != "none")
            this.draw_g.append("svg:path")
               .attr("class", "line")
               .attr("d",line(pthis.bins))
               .style("fill", "none")
               .call(attline.func);

         if (fill.color != "none")
            this.draw_g.append("svg:path")
                   .attr("class", "area")
                   .attr("d",area(pthis.bins))
                   .style("stroke", "none")
                   .style("pointer-events", "none")
                   .call(fill.func);

         // add tooltips
         if (JSROOT.gStyle.Tooltip)
            this.draw_g.selectAll()
                      .data(this.bins).enter()
                      .append("svg:circle")
                      .attr("cx", function(d) { return pmain.grx(d.x).toFixed(1); })
                      .attr("cy", function(d) { return pmain.gry(d.y).toFixed(1); })
                      .attr("r", 4)
                      .style("opacity", 0)
                      .append("svg:title")
                      .text( function(d) { return name + "x = " + pmain.AxisAsText("x",d.x) + " \ny = " + pmain.AxisAsText("y", d.y); });
      }

      painter['UpdateObject'] = function(obj) {
         if (obj['_typename'] != this.tf1['_typename']) return false;
         // TODO: realy update object content
         this.tf1 = obj;
         return true;
      }

      painter['CanZoomIn'] = function(axis,min,max) {
         if (axis!="x") return false;

         if (this.tf1['fSave'].length > 0) {
            // in the case where the points have been saved, useful for example
            // if we don't have the user's function
            var nb_points = this.tf1['fNpx'];

            var xmin = this.tf1['fSave'][nb_points + 1];
            var xmax = this.tf1['fSave'][nb_points + 2];

            return Math.abs(xmin - xmax) / nb_points < Math.abs(min - max);
         }

         // if function calculated, one always could zoom inside
         return true;
      }

      painter.SetDivId(divid, -1);
      if (painter.main_painter() == null) {
         var histo = painter.CreateDummyHisto();
         JSROOT.Painter.drawHistogram1D(divid, histo);
      }
      painter.SetDivId(divid);
      painter.DrawBins();
      return painter.DrawingReady();
   }


   // ====================================================================

   JSROOT.THStackPainter = function(stack) {
      JSROOT.TObjectPainter.call(this, stack);
   }

   JSROOT.THStackPainter.prototype = Object.create(JSROOT.TObjectPainter.prototype);



   JSROOT.Painter.drawHStack = function(divid, stack, opt) {
      // paint the list of histograms
      // By default, histograms are shown stacked.
      // -the first histogram is paint
      // -then the sum of the first and second, etc

      // this pointer set to created painter instance
      this.stack = stack;
      this.nostack = false;
      this.firstpainter = null;
      this.painters = new Array; // keep painters to be able update objects

      this.SetDivId(divid);

      if (!('fHists' in stack) || (stack['fHists'].arr.length == 0)) return this.DrawingReady();

      this['GetObject'] = function() {
         return this.stack;
      }

      this['drawStack'] = function(opt) {
         var pad = this.root_pad();
         var histos = this.stack['fHists'];
         var nhists = histos.arr.length;

         if (opt == null) opt = "";
                     else opt = opt.toLowerCase();
         var lsame = false;
         if (opt.indexOf("same") != -1) {
            lsame = true;
            opt.replace("same", "");
         }
         // compute the min/max of each axis
         var i, h, xmin = 0, xmax = 0, ymin = 0, ymax = 0;
         for (var i = 0; i < nhists; ++i) {
            h = histos.arr[i];
            if (i == 0 || h['fXaxis']['fXmin'] < xmin)
               xmin = h['fXaxis']['fXmin'];
            if (i == 0 || h['fXaxis']['fXmax'] > xmax)
               xmax = h['fXaxis']['fXmax'];
            if (i == 0 || h['fYaxis']['fXmin'] < ymin)
               ymin = h['fYaxis']['fXmin'];
            if (i == 0 || h['fYaxis']['fXmax'] > ymax)
               ymax = h['fYaxis']['fXmax'];
         }
         this.nostack = opt.indexOf("nostack") == -1 ? false : true;
         if (!this.nostack)
            this.stack.buildStack();

         var themin, themax;
         if (this.stack['fMaximum'] == -1111) themax = this.stack.getMaximum(opt);
                                         else themax = this.stack['fMaximum'];
         if (this.stack['fMinimum'] == -1111) {
            themin = this.stack.getMinimum(opt);
            if (pad && pad['fLogy']) {
               if (themin > 0)
                  themin *= .9;
               else
                  themin = themax * 1.e-3;
            } else if (themin > 0)
               themin = 0;
         } else
            themin = this.stack['fMinimum'];
         if (!('fHistogram' in this.stack)) {
            h = this.stack['fHists'].arr[0];
            this.stack['fHistogram'] = JSROOT.Create("TH1I");
            this.stack['fHistogram']['fName'] = "unnamed";
            this.stack['fHistogram']['fXaxis'] = JSROOT.clone(h['fXaxis']);
            this.stack['fHistogram']['fYaxis'] = JSROOT.clone(h['fYaxis']);
            this.stack['fHistogram']['fXaxis']['fXmin'] = xmin;
            this.stack['fHistogram']['fXaxis']['fXmax'] = xmax;
            this.stack['fHistogram']['fYaxis']['fXmin'] = ymin;
            this.stack['fHistogram']['fYaxis']['fXmax'] = ymax;
         }
         this.stack['fHistogram']['fTitle'] = this.stack['fTitle'];
         // var histo = JSROOT.clone(stack['fHistogram']);
         var histo = this.stack['fHistogram'];
         if (!histo.TestBit(JSROOT.TH1StatusBits.kIsZoomed)) {
            if (this.nostack && this.stack['fMaximum'] != -1111)
               histo['fMaximum'] = this.stack['fMaximum'];
            else {
               if (pad && pad['fLogy'])
                  histo['fMaximum'] = themax * (1 + 0.2 * JSROOT.log10(themax / themin));
               else
                  histo['fMaximum'] = 1.05 * themax;
            }
            if (this.nostack && this.stack['fMinimum'] != -1111)
               histo['fMinimum'] = this.stack['fMinimum'];
            else {
               if (pad && pad['fLogy'])
                  histo['fMinimum'] = themin / (1 + 0.5 * JSROOT.log10(themax / themin));
               else
                  histo['fMinimum'] = themin;
            }
         }
         if (!lsame) {

            var hopt = histo['fOption'];
            if ((opt != "") && (hopt.indexOf(opt) == -1))
               hopt += opt;

            if (histo['_typename'].match(/^TH1/))
               this.firstpainter = JSROOT.Painter.drawHistogram1D(this.divid, histo, hopt);
            else
            if (histo['_typename'].match(/^TH2/))
               this.firstpainter = JSROOT.Painter.drawHistogram2D(this.divid, histo, hopt);

         }
         for (var i = 0; i < nhists; ++i) {
            if (this.nostack)
               h = histos.arr[i];
            else
               h = this.stack['fStack'].arr[nhists - i - 1];

            var hopt = h['fOption'];
            if ((opt != "") && (hopt.indexOf(opt) == -1)) hopt += opt;
            hopt += "same";

            if (h['_typename'].match(/^TH1/)) {
               var subpainter = JSROOT.Painter.drawHistogram1D(this.divid, h, hopt);
               this.painters.push(subpainter);
            }
         }
      }

      this['UpdateObject'] = function(obj) {
         var isany = false;
         if (this.firstpainter)
            if (this.firstpainter.UpdateObject(obj['fHistogram'])) isany = true;

         var histos = obj['fHists'];
         var nhists = histos.arr.length;

         for (var i = 0; i < nhists; ++i) {
            var h = null;

            if (this.nostack)
               h = histos.arr[i];
            else
               h = obj['fStack'].arr[nhists - i - 1];

            if (this.painters[i].UpdateObject(h)) isany = true;
         }

         return isany;
      }

      this.drawStack(opt);

      return this.DrawingReady();
   }

   // =============================================================

   JSROOT.Painter.drawMultiGraph = function(divid, mgraph, opt) {
      // function call with bind(painter)
      this.mgraph = mgraph;
      this.firstpainter = null;
      this.painters = new Array; // keep painters to be able update objects

      this.SetDivId(divid);

      this['GetObject'] = function() {
         return this.mgraph;
      }

      this['UpdateObject'] = function(obj) {

         if ((obj==null) || (obj['_typename'] != 'TMultiGraph')) return false;

         var histo = obj['fHistogram'];
         var graphs = obj['fGraphs'];

         var isany = false;
         if (this.firstpainter && histo)
            if (this.firstpainter.UpdateObject(histo)) isany = true;

         for (var i in graphs.arr) {
            if (i>=this.painters.length) break;
            if (this.painters[i].UpdateObject(graphs.arr[i])) isany = true;
         }

         return isany;
      }

      this['Draw'] = function(opt) {
         if (opt == null) opt = "";
         opt = opt.toUpperCase().replace("3D","").replace("FB",""); // no 3D supported, FB not clear
         var graphs = this.mgraph['fGraphs'];

         console.log('draw multigraph opt = '+opt + " histo = " + histo);

         if (this.mgraph.fFunctions)
            console.log('func length = ' + this.mgraph.fFunctions.arr.length);
         else
            console.log('no functions in multigraph');

         if (opt.indexOf("A")<0) {
            if (this.main_painter()==null)
               console.log('Most probably, drawing of multigraph will fail')
         } else {

            opt = opt.replace("A","");

            var maximum, minimum, rwxmin = 0, rwxmax = 0, rwymin = 0, rwymax = 0, uxmin = 0, uxmax = 0, dx, dy;
            var histo = this.mgraph['fHistogram'];
            var scalex = 1, scaley = 1, logx = false, logy = false;

            var pad = this.root_pad();

            if (pad!=null) {
               rwxmin = pad.fUxmin;
               rwxmax = pad.fUxmax;
               rwymin = pad.fUymin;
               rwymax = pad.fUymax;
               logx = pad['fLogx'];
               logy = pad['fLogy'];
            }
            if (histo!=null) {
               minimum = histo['fYaxis']['fXmin'];
               maximum = histo['fYaxis']['fXmax'];
               if (pad) {
                  uxmin = JSROOT.Painter.padtoX(pad, rwxmin);
                  uxmax = JSROOT.Painter.padtoX(pad, rwxmax);
               }
            } else {
               for (var i = 0; i < graphs.arr.length; ++i) {
                  var r = graphs.arr[i].ComputeRange();
                  if ((i==0) || (r.xmin < rwxmin)) rwxmin = r.xmin;
                  if ((i==0) || (r.ymin < rwymin)) rwymin = r.ymin;
                  if ((i==0) || (r.xmax > rwxmax)) rwxmax = r.xmax;
                  if ((i==0) || (r.ymax > rwymax)) rwymax = r.ymax;
               }
               if (rwxmin == rwxmax)
                  rwxmax += 1.;
               if (rwymin == rwymax)
                  rwymax += 1.;
               dx = 0.05 * (rwxmax - rwxmin);
               dy = 0.05 * (rwymax - rwymin);
               uxmin = rwxmin - dx;
               uxmax = rwxmax + dx;
               if (logy) {
                  if (rwymin <= 0) rwymin = 0.001 * rwymax;
                  minimum = rwymin / (1 + 0.5 * JSROOT.log10(rwymax / rwymin));
                  maximum = rwymax * (1 + 0.2 * JSROOT.log10(rwymax / rwymin));
               } else {
                  minimum = rwymin - dy;
                  maximum = rwymax + dy;
               }
               if (minimum < 0 && rwymin >= 0)
                  minimum = 0;
               if (maximum > 0 && rwymax <= 0)
                  maximum = 0;
            }
            if (this.mgraph['fMinimum'] != -1111)
               rwymin = minimum = this.mgraph['fMinimum'];
            if (this.mgraph['fMaximum'] != -1111)
               rwymax = maximum = this.mgraph['fMaximum'];
            if (uxmin < 0 && rwxmin >= 0) {
               if (logx) uxmin = 0.9 * rwxmin;
               // else uxmin = 0;
            }
            if (uxmax > 0 && rwxmax <= 0) {
               if (logx) uxmax = 1.1 * rwxmax;
            }
            if (minimum < 0 && rwymin >= 0) {
               if (logy) minimum = 0.9 * rwymin;
            }
            if (maximum > 0 && rwymax <= 0) {
               if (logy) maximum = 1.1 * rwymax;
            }
            if (minimum <= 0 && logy)
               minimum = 0.001 * maximum;
            if (uxmin <= 0 && logx) {
               if (uxmax > 1000)
                  uxmin = 1;
               else
                  uxmin = 0.001 * uxmax;
            }
            rwymin = minimum;
            rwymax = maximum;
            if (histo!=null) {
               histo['fYaxis']['fXmin'] = rwymin;
               histo['fYaxis']['fXmax'] = rwymax;
            }

            // Create a temporary histogram to draw the axis (if necessary)
            if (!histo) {
               console.log('Create histogram for multigraph');
               histo = JSROOT.Create("TH1I");
               histo['fXaxis']['fXmin'] = rwxmin;
               histo['fXaxis']['fXmax'] = rwxmax;
               histo['fYaxis']['fXmin'] = rwymin;
               histo['fYaxis']['fXmax'] = rwymax;
            }

            // histogram painter will be first in the pad, will define axis and
            // interactive actions
            this.firstpainter = JSROOT.Painter.drawHistogram1D(this.divid, histo);
         }

         for (var i in graphs.arr) {
            var drawopt = graphs.opt[i];
            if ((drawopt==null) || (drawopt == "")) drawopt = opt;
            var subpainter = JSROOT.Painter.drawGraph(this.divid, graphs.arr[i], drawopt);
            this.painters.push(subpainter);
         }
      }

      this.Draw(opt);

      return this.DrawingReady();
   }




   return JSROOT.Painter;

}));
