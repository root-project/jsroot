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


   JSROOT.Painter.drawEllipse = function(divid, obj, opt) {

      this.ellipse = obj;
      this.SetDivId(divid);

      // function used for live update of object
      this['UpdateObject'] = function(obj) {
         // copy all fields
         JSROOT.extend(this.ellipse, obj);
      }

      this['Redraw'] = function() {
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

      this.Redraw(); // actual drawing
      return this.DrawingReady();
   }

   // =============================================================================

   JSROOT.Painter.drawLine = function(divid, obj, opt) {

      this.line = obj;
      this.SetDivId(divid);

      // function used for live update of object
      this['UpdateObject'] = function(obj) {
         // copy all fields
         JSROOT.extend(this.line, obj);
      }

      this['Redraw'] = function() {
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

      this.Redraw(); // actual drawing
      return this.DrawingReady();
   }

   // ======================================================================================

   JSROOT.Painter.drawArrow = function(divid, obj, opt) {

      this.arrow = obj;
      this.SetDivId(divid);

      // function used for live update of object
      this['UpdateObject'] = function(obj) {
         // copy all fields
         JSROOT.extend(this.arrow, obj);
      }

      this['Redraw'] = function() {
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

      this.Redraw(); // actual drawing
      return this.DrawingReady();
   }

   // ===================================================================================

   JSROOT.Painter.drawFunction = function(divid, tf1, opt) {

      this['tf1'] = tf1;
      this['bins'] = null;

      this['GetObject'] = function() {
         return this.tf1;
      }

      this['Redraw'] = function() {
         this.DrawBins();
      }

      this['Eval'] = function(x) {
         return this.tf1.evalPar(x);
      }

      this['CreateDummyHisto'] = function() {
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

      this['CreateBins'] = function() {

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

      this['DrawBins'] = function() {
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

      this['UpdateObject'] = function(obj) {
         if (obj['_typename'] != this.tf1['_typename']) return false;
         // TODO: realy update object content
         this.tf1 = obj;
         return true;
      }

      this['CanZoomIn'] = function(axis,min,max) {
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

      this.SetDivId(divid, -1);
      if (this.main_painter() == null) {
         var histo = this.CreateDummyHisto();
         JSROOT.Painter.drawHistogram1D(divid, histo, "AXIS");
      }
      this.SetDivId(divid);
      this.DrawBins();
      return this.DrawingReady();
   }

   // ====================================================================

   JSROOT.Painter.drawHStack = function(divid, stack, opt) {
      // paint the list of histograms
      // By default, histograms are shown stacked.
      // -the first histogram is paint
      // -then the sum of the first and second, etc

      // 'this' pointer set to created painter instance
      this.stack = stack;
      this.nostack = false;
      this.firstpainter = null;
      this.painters = new Array; // keep painters to be able update objects

      this.SetDivId(divid);

      if (!('fHists' in stack) || (stack['fHists'].arr.length == 0)) return this.DrawingReady();

      this['GetObject'] = function() {
         return this.stack;
      }

      this['BuildStack'] = function() {
         //  build sum of all histograms
         //  Build a separate list fStack containing the running sum of all histograms

         if (!('fHists' in this.stack)) return false;
         var nhists = this.stack['fHists'].arr.length;
         if (nhists <= 0) return false;
         var lst = JSROOT.Create("TList");
         lst.Add(JSROOT.clone(this.stack['fHists'].arr[0]));
         for (var i=1;i<nhists;i++) {
            var hnext = JSROOT.clone(this.stack['fHists'].arr[i]);
            var hprev = lst.arr[i-1];

            if ((hnext.fNbins != hprev.fNbins) ||
                (hnext['fXaxis']['fXmin'] != hprev['fXaxis']['fXmin']) ||
                (hnext['fXaxis']['fXmax'] != hprev['fXaxis']['fXmax'])) {
               JSROOT.console("When drawing THStack, cannot sum-up histograms " + hnext.fName + " and " + hprev.fName);
               delete hnext;
               delete lst;
               return false;
            }

            //hnext.add(hprev);
            // trivial sum of histograms
            for (var n in hnext.fArray)
               hnext.fArray[n] += hprev.fArray[n];

            lst.Add(hnext);
         }
         this.stack['fStack'] = lst;
         return true;
      }

      this['GetHistMinMax'] = function(hist, witherr) {
         var res = { min : 0, max : 0 };
         var domin = false, domax = false;
         if (hist['fMinimum'] != -1111)
            res.min = hist['fMinimum'];
         else
            domin = true;
         if (hist['fMaximum'] != -1111)
            res.max = hist['fMaximum'];
         else
            domax = true;

         if (domin || domax) {
            var left = 1, right = hist.fXaxis.fNbins;

            if (hist.fXaxis.TestBit(JSROOT.EAxisBits.kAxisRange)) {
               left = hist.fXaxis.fFirst;
               right = hist.fXaxis.fLast;
            }
            for (var bin = left; bin<=right; bin++) {
               var val = hist.getBinContent(bin);
               var err = witherr ? hist.getBinError(bin) : 0;
               if (domin && ((bin==left) || (val-err < res.min))) res.min = val-err;
               if (domax && ((bin==left) || (val+err > res.max))) res.max = val+err;
            }
         }

         return res;
      }

      this['GetMinMax'] = function(opt) {
         var res = { min : 0, max : 0 };
         var iserr = opt.indexOf('e')>=0;

         if (this.nostack) {
            for (var i in this.stack['fHists'].arr) {
               var resh = this.GetHistMinMax(this.stack['fHists'].arr[i], iserr);
               if (i==0) res = resh; else {
                  if (resh.min < res.min) res.min = resh.min;
                  if (resh.max > res.max) res.max = resh.max;
               }
            }

            if (this.stack['fMaximum'] != -1111)
               res.max = this.stack['fMaximum'];
            else
               res.max = res.max * 1.05;

            if (this.stack['fMinimum'] != -1111) res.min = this.stack['fMinimum'];
         } else {
            res.min = this.GetHistMinMax(this.stack['fStack'].arr[0], iserr).min;
            res.max = this.GetHistMinMax(this.stack['fStack'].arr[this.stack['fStack'].arr.length-1], iserr).max * 1.05;
         }

         var pad = this.root_pad();
         if ((pad!=null) && (pad['fLogy']>0)) {
            if (res.min<0) res.min = res.max * 1e-4;
         }

         return res;
      }

      this['DrawNextHisto'] = function(indx, opt) {
         var nhists = this.stack['fHists'].arr.length;
         if (indx>=nhists) return this.DrawingReady();

         var hist = null;
         if (indx<0) hist = this.stack['fHistogram']; else
         if (this.nostack) hist = this.stack['fHists'].arr[indx];
                     else  hist = this.stack['fStack'].arr[nhists - indx - 1];

         var hopt = hist['fOption'];
         if ((opt != "") && (hopt.indexOf(opt) == -1)) hopt += opt;
         if (indx>=0) hopt += "same";
         var subp = JSROOT.draw(this.divid, hist, hopt);
         if (indx<0) this.firstpainter = subp;
                else this.painters.push(subp);
         subp.WhenReady(this.DrawNextHisto.bind(this, indx+1, opt));
      }

      this['drawStack'] = function(opt) {
         var pad = this.root_pad();
         var histos = this.stack['fHists'];
         var nhists = histos.arr.length;
         var pad = this.root_pad();

         if (opt == null) opt = "";
                     else opt = opt.toLowerCase();

         var lsame = false;
         if (opt.indexOf("same") != -1) {
            lsame = true;
            opt.replace("same", "");
         }
         this.nostack = opt.indexOf("nostack") < 0 ? false : true;

         // when building stack, one could fail to sum up histograms
         if (!this.nostack)
            this.nostack = ! this.BuildStack();

         var mm = this.GetMinMax(opt);

         if (this.stack['fHistogram'] == null) {
            // compute the min/max of each axis
            var xmin = 0, xmax = 0, ymin = 0, ymax = 0;
            for (var i = 0; i < nhists; ++i) {
               var h = histos.arr[i];
               if (i == 0 || h['fXaxis']['fXmin'] < xmin)
                  xmin = h['fXaxis']['fXmin'];
               if (i == 0 || h['fXaxis']['fXmax'] > xmax)
                  xmax = h['fXaxis']['fXmax'];
               if (i == 0 || h['fYaxis']['fXmin'] < ymin)
                  ymin = h['fYaxis']['fXmin'];
               if (i == 0 || h['fYaxis']['fXmax'] > ymax)
                  ymax = h['fYaxis']['fXmax'];
            }

            var h = this.stack['fHists'].arr[0];
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
            if (pad && pad['fLogy'])
                histo['fMaximum'] = mm.max * (1 + 0.2 * JSROOT.log10(mm.max / mm.min));
             else
                histo['fMaximum'] = mm.max;
            if (pad && pad['fLogy'])
               histo['fMinimum'] = mm.min / (1 + 0.5 * JSROOT.log10(mm.max / mm.min));
            else
               histo['fMinimum'] = mm.min;
         }

         this.DrawNextHisto(!lsame ? -1 : 0, opt);
         return this;
      }

      this['UpdateObject'] = function(obj) {
         var isany = false;
         if (this.firstpainter)
            if (this.firstpainter.UpdateObject(obj['fHistogram'])) isany = true;

         var nhists = obj['fHists'].arr.length;
         for (var i = 0; i < nhists; ++i) {
            var hist = this.nostack ? obj['fHists'].arr[i] : obj['fStack'].arr[nhists - i - 1];
            if (this.painters[i].UpdateObject(hist)) isany = true;
         }

         return isany;
      }

      return this.drawStack(opt);
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

      this['ComputeGraphRange'] = function(res, gr) {
         // Compute the x/y range of the points in this graph
         if (gr.fNpoints == 0) return;
         if (res.first) {
            res.xmin = res.xmax = gr.fX[0];
            res.ymin = res.ymax = gr.fY[0];
            res.first = false;
         }
         for (var i=0; i < gr.fNpoints; i++) {
            if (gr.fX[i] < res.xmin) res.xmin = gr.fX[i];
            if (gr.fX[i] > res.xmax) res.xmax = gr.fX[i];
            if (gr.fY[i] < res.ymin) res.ymin = gr.fY[i];
            if (gr.fY[i] > res.ymax) res.ymax = gr.fY[i];
         }
         return res;
      }

      this['DrawAxis'] = function() {
         // draw special histogram
         var maximum, minimum, dx, dy;

         var rw = {  xmin: 0, xmax: 0, ymin: 0, ymax: 0, first: true };
         var uxmin = 0, uxmax = 0;
         var scalex = 1, scaley = 1, logx = false, logy = false;
         var histo = this.mgraph['fHistogram'];
         var graphs = this.mgraph['fGraphs'];

         var pad = this.root_pad();

         if (pad!=null) {
            rw.xmin = pad.fUxmin;
            rw.xmax = pad.fUxmax;
            rw.ymin = pad.fUymin;
            rw.ymax = pad.fUymax;
            rw.first = false;
            logx = pad['fLogx'];
            logy = pad['fLogy'];
         }
         if (histo!=null) {
            minimum = histo['fYaxis']['fXmin'];
            maximum = histo['fYaxis']['fXmax'];
            if (pad!=null) {
               uxmin = JSROOT.Painter.padtoX(pad, rw.xmin);
               uxmax = JSROOT.Painter.padtoX(pad, rw.xmax);
            }
         } else {
            for (var i in graphs.arr)
               this.ComputeGraphRange(rw, graphs.arr[i]);

            if (rw.xmin == rw.xmax) rw.xmax += 1.;
            if (rw.ymin == rw.ymax) rw.ymax += 1.;
            dx = 0.05 * (rw.xmax - rw.xmin);
            dy = 0.05 * (rw.ymax - rw.ymin);
            uxmin = rw.xmin - dx;
            uxmax = rw.xmax + dx;
            if (logy) {
               if (rw.ymin <= 0) rw.ymin = 0.001 * rw.ymax;
               minimum = rw.ymin / (1 + 0.5 * JSROOT.log10(rw.ymax / rw.ymin));
               maximum = rw.ymax * (1 + 0.2 * JSROOT.log10(rw.ymax / rw.ymin));
            } else {
               minimum = rw.ymin - dy;
               maximum = rw.ymax + dy;
            }
            if (minimum < 0 && rw.ymin >= 0)
               minimum = 0;
            if (maximum > 0 && rw.ymax <= 0)
               maximum = 0;
         }
         if (this.mgraph['fMinimum'] != -1111)
            rw.ymin = minimum = this.mgraph['fMinimum'];
         if (this.mgraph['fMaximum'] != -1111)
            rw.ymax = maximum = this.mgraph['fMaximum'];
         if (uxmin < 0 && rw.xmin >= 0) {
            if (logx) uxmin = 0.9 * rw.xmin;
            // else uxmin = 0;
         }
         if (uxmax > 0 && rw.xmax <= 0) {
            if (logx) uxmax = 1.1 * rw.xmax;
         }
         if (minimum < 0 && rw.ymin >= 0) {
            if (logy) minimum = 0.9 * rw.ymin;
         }
         if (maximum > 0 && rw.ymax <= 0) {
            if (logy) maximum = 1.1 * rw.ymax;
         }
         if (minimum <= 0 && logy)
            minimum = 0.001 * maximum;
         if (uxmin <= 0 && logx) {
            if (uxmax > 1000)
               uxmin = 1;
            else
               uxmin = 0.001 * uxmax;
         }
         rw.ymin = minimum;
         rw.ymax = maximum;
         if (histo!=null) {
            histo['fYaxis']['fXmin'] = rw.ymin;
            histo['fYaxis']['fXmax'] = rw.ymax;
         }

         // Create a temporary histogram to draw the axis (if necessary)
         if (!histo) {
            histo = JSROOT.Create("TH1I");
            histo['fXaxis']['fXmin'] = rw.xmin;
            histo['fXaxis']['fXmax'] = rw.xmax;
            histo['fYaxis']['fXmin'] = rw.ymin;
            histo['fYaxis']['fXmax'] = rw.ymax;
         }

         // histogram painter will be first in the pad, will define axis and
         // interactive actions
         this.firstpainter = JSROOT.Painter.drawHistogram1D(this.divid, histo, "AXIS");
      }

      this['DrawNextFunction'] = function(indx, callback) {
         // method draws next function from the functions list

         if ((this.mgraph['fFunctions'] == null) || (indx >= this.mgraph.fFunctions.arr.length))
            return JSROOT.CallBack(callback);

         var func = this.mgraph.fFunctions.arr[indx];
         var opt = this.mgraph.fFunctions.opt[indx];

         var painter = JSROOT.draw(this.divid, func, opt);
         if (painter) return painter.WhenReady(this.DrawNextFunction.bind(this, indx+1, callback));

         this.DrawNextFunction(indx+1, callback);
      }

      this['DrawNextGraph'] = function(indx, opt) {
         var graphs = this.mgraph['fGraphs'];
         // at the end of graphs drawing draw functions (if any)
         if (indx >= graphs.arr.length)
            return this.DrawNextFunction(0, this.DrawingReady.bind(this));

         var drawopt = graphs.opt[indx];
         if ((drawopt==null) || (drawopt == "")) drawopt = opt;
         var subp = JSROOT.Painter.drawGraph(this.divid, graphs.arr[indx], drawopt);
         this.painters.push(subp);
         subp.WhenReady(this.DrawNextGraph.bind(this, indx+1, opt));
      }

      if (opt == null) opt = "";
      opt = opt.toUpperCase().replace("3D","").replace("FB",""); // no 3D supported, FB not clear

      if (opt.indexOf("A") < 0) {
         if (this.main_painter()==null)
            console.log('Most probably, drawing of multigraph will fail')
      } else {
         opt = opt.replace("A","");
         this.DrawAxis();
      }

      this.DrawNextGraph(0, opt);

      return this;
   }

   // ==============================================================================

   JSROOT.Painter.drawLegend = function(divid, obj, opt) {

      this.legend = obj;
      this.SetDivId(divid);

      this['GetObject'] = function() {
         return this.legend;
      }

      this['Redraw'] = function() {
         this.RecreateDrawG(true, ".text_layer");

         var svg = this.svg_pad();
         var pave = this.legend;

         var x = 0, y = 0, w = 0, h = 0;

         if (pave['fInit'] == 0) {
            x = pave['fX1'] * Number(svg.attr("width"));
            y = Number(svg.attr("height")) - pave['fY1']
                  * Number(svg.attr("height"));
            w = (pave['fX2'] - pave['fX1']) * Number(svg.attr("width"));
            h = (pave['fY2'] - pave['fY1']) * Number(svg.attr("height"));
         } else {
            x = pave['fX1NDC'] * Number(svg.attr("width"));
            y = Number(svg.attr("height")) - pave['fY1NDC']
                  * Number(svg.attr("height"));
            w = (pave['fX2NDC'] - pave['fX1NDC']) * Number(svg.attr("width"));
            h = (pave['fY2NDC'] - pave['fY1NDC']) * Number(svg.attr("height"));
         }
         y -= h;
         var lwidth = pave['fBorderSize'] ? pave['fBorderSize'] : 0;
         var boxfill = this.createAttFill(pave);
         var lineatt = JSROOT.Painter.createAttLine(pave, lwidth);
         var ncols = pave.fNColumns, nlines = pave.fPrimitives.arr.length;
         var nrows = nlines;
         if (ncols>1) { while ((nrows-1)*ncols>=nlines) nrows--; } else ncols = 1;

         this.draw_g.attr("x", x.toFixed(1))
                    .attr("y", y.toFixed(1))
                    .attr("width", w.toFixed(1))
                    .attr("height", h.toFixed(1))
                    .attr("transform", "translate(" + x.toFixed(1) + "," + y.toFixed(1) + ")");

         this.StartTextDrawing(pave['fTextFont'], h / (nlines * 1.2));

         this.draw_g
              .append("svg:rect")
              .attr("x", 0)
              .attr("y", 0)
              .attr("width", w.toFixed(1))
              .attr("height", h.toFixed(1))
              .call(boxfill.func)
              .style("stroke-width", lwidth ? 1 : 0)
              .style("stroke", lineatt.color);

         var tcolor = JSROOT.Painter.root_colors[pave['fTextColor']];
         var column_width = Math.round(w/ncols);
         var padding_x = Math.round(0.03 * w/ncols);
         var padding_y = Math.round(0.03 * h);

         var leg_painter = this;
         var step_y = (h - 2*padding_y)/nrows;
         var any_opt = false;

         for (var i = 0; i < nlines; ++i) {
            var leg = pave.fPrimitives.arr[i];
            var lopt = leg['fOption'].toLowerCase();

            var icol = i % ncols, irow = (i - icol) / ncols;

            var x0 = icol * column_width;
            var tpos_x = x0 + Math.round(pave['fMargin']*column_width);

            var pos_y = Math.round(padding_y + irow*step_y); // top corner
            var mid_y = Math.round(padding_y + (irow+0.5)*step_y); // center line

            var attfill = leg;
            var attmarker = leg;
            var attline = leg;

            var mo = leg['fObject'];

            if ((mo != null) && (typeof mo == 'object')) {
               if ('fLineColor' in mo) attline = mo;
               if ('fFillColor' in mo) attfill = mo;
               if ('fMarkerColor' in mo) attmarker = mo;
            }

            var fill = this.createAttFill(attfill);
            var llll = JSROOT.Painter.createAttLine(attline);

            // Draw fill pattern (in a box)
            if (lopt.indexOf('f') != -1) {
               // box total height is yspace*0.7
               // define x,y as the center of the symbol for this entry
               this.draw_g.append("svg:rect")
                      .attr("x", x0 + padding_x)
                      .attr("y", Math.round(pos_y+step_y*0.1))
                      .attr("width", tpos_x - 2*padding_x - x0)
                      .attr("height", Math.round(step_y*0.8))
                      .call(fill.func);
            }

            // Draw line
            if (lopt.indexOf('l') != -1) {
               this.draw_g.append("svg:line")
                  .attr("x1", x0 + padding_x)
                  .attr("y1", mid_y)
                  .attr("x2", tpos_x - padding_x)
                  .attr("y2", mid_y)
                  .call(llll.func);
            }
            // Draw error only
            if (lopt.indexOf('e') != -1  && (lopt.indexOf('l') == -1 || lopt.indexOf('f') != -1)) {
            }
            // Draw Polymarker
            if (lopt.indexOf('p') != -1) {
               var marker = JSROOT.Painter.createAttMarker(attmarker);
               this.draw_g.append("svg:path")
                   .attr("transform", function(d) { return "translate(" + (x0 + tpos_x)/2 + "," + mid_y + ")"; })
                   .call(marker.func);
            }

            var pos_x = tpos_x;
            if (lopt.length>0) any_opt = true;
                          else if (!any_opt) pos_x = x0 + padding_x;

            this.DrawText("start", pos_x, pos_y, x0+column_width-pos_x-padding_x, step_y, leg['fLabel'], tcolor);
         }

         // rescale after all entries are shown
         this.FinishTextDrawing();

         if (lwidth && lwidth > 1) {
            this.draw_g.append("svg:line")
               .attr("x1", w + (lwidth / 2))
               .attr("y1", lwidth + 1)
               .attr("x2", w + (lwidth / 2))
               .attr("y2",  h + lwidth - 1)
               .call(lineatt.func);
            this.draw_g.append("svg:line")
               .attr("x1", lwidth + 1)
               .attr("y1", h + (lwidth / 2))
               .attr("x2", w + lwidth - 1)
               .attr("y2", h + (lwidth / 2))
               .call(lineatt.func);
         }

         this.AddDrag({ obj:pave, redraw: this.Redraw.bind(this) });
      }

      this.Redraw();

      return this.DrawingReady();
   }

   // ===========================================================================

   JSROOT.Painter.drawPaletteAxis = function(divid, palette) {

      this.palette = palette;
      this.SetDivId(divid);

      this['GetObject'] = function() {
         return this.palette;
      }

      this['DrawPalette'] = function() {
         var palette = this.palette;
         var axis = palette['fAxis'];

         var nbr1 = axis['fNdiv'] % 100;
         if (nbr1<=0) nbr1 = 8;

         var width = this.pad_width(), height = this.pad_height();

         var s_height = Math.round(Math.abs(palette['fY2NDC'] - palette['fY1NDC']) * height);

         var axisOffset = axis['fLabelOffset'] * width;
         var tickSize = axis['fTickSize'] * width;

         // force creation of contour array if missing
         if (this.main_painter().fContour == null)
            this.main_painter().getValueColor(this.main_painter().minbin);

         var contour = this.main_painter().fContour;
         var zmin = contour[0], zmax = contour[contour.length-1];

         var z = null;

         if (this.main_painter().options.Logz) {
            z = d3.scale.log();
            this['noexpz'] = ((zmax < 300) && (zmin > 0.3));

            this['formatz'] = function(d) {
               var val = parseFloat(d);
               var vlog = JSROOT.log10(val);
               if (Math.abs(vlog - Math.round(vlog))<0.001) {
                  if (!this['noexpz'])
                     return JSROOT.Painter.formatExp(val.toExponential(0));
                  else
                  if (vlog<0)
                     return val.toFixed(Math.round(-vlog+0.5));
                  else
                     return val.toFixed(0);
               }
               return null;
            }

         } else {
            z = d3.scale.linear();
            this['formatz'] = function(d) {
               if ((Math.abs(d) < 1e-14) && (Math.abs(zmax - zmin) > 1e-5)) d = 0;
               return parseFloat(d.toPrecision(12));
            }
         }
         z.domain([zmin, zmax]).range([s_height,0]);

         var labelfont = JSROOT.Painter.getFontDetails(axis['fLabelFont'], axis['fLabelSize'] * height);

         var pos_x = Math.round(palette['fX1NDC'] * width);
         var pos_y = Math.round(height*(1 - palette['fY1NDC']));

         var s_width = Math.round(Math.abs(palette['fX2NDC'] - palette['fX1NDC']) * width);
         pos_y -= s_height;
         if (tickSize > s_width*0.8) tickSize = s_width*0.8;

         // Draw palette pad
         this.RecreateDrawG(true, ".text_layer");

         this.draw_g
                .attr("x", pos_x).attr("y", pos_y)               // position required only for drag functions
                .attr("width", s_width).attr("height", s_height) // dimension required only for drag functions
                .attr("transform", "translate(" + pos_x + ", " + pos_y + ")");

         for (var i=0;i<contour.length-1;i++) {
            var z0 = z(contour[i]);
            var z1 = z(contour[i+1]);
            var col = this.main_painter().getValueColor(contour[i]);
            var r = this.draw_g
               .append("svg:rect")
               .attr("x", 0)
               .attr("y",  z1.toFixed(1))
               .attr("width", s_width)
               .attr("height", (z0-z1).toFixed(1))
               .attr("fill", col)
               .property("fill0", col)
               .attr("stroke", col);

            if (JSROOT.gStyle.Tooltip)
               r.on('mouseover', function() {
                  if (JSROOT.gStyle.Tooltip)
                     d3.select(this).transition().duration(100).style("fill", 'grey');
               }).on('mouseout', function() {
                  d3.select(this).transition().duration(100).style("fill", this['fill0']);
               }).append("svg:title").text(contour[i].toFixed(2) + " - " + contour[i+1].toFixed(2));
         }

         // Build and draw axes
         var z_axis = d3.svg.axis().scale(z)
                       .orient("right")
                       .tickPadding(axisOffset)
                       .tickSize(-tickSize, -tickSize / 2, 0)
                       .ticks(nbr1)
                       .tickFormat(this.formatz.bind(this));

         var zax = this.draw_g.append("svg:g")
                      .attr("class", "zaxis")
                      .attr("transform", "translate(" + s_width + ", 0)")
                      .call(z_axis);

         zax.selectAll("text")
                 .call(labelfont.func)
                 .attr("fill", JSROOT.Painter.root_colors[axis['fLabelColor']]);

         /** Add palette axis title */
         if ((axis['fTitle'] != "") && (typeof axis['fTextFont'] != 'undefined')) {
            // offest in width of colz drawings
            var xoffset = axis['fTitleOffset'] * s_width;
            if ('getBoundingClientRect' in this.draw_g.node()) {
               var rect1 = this.draw_g.node().getBoundingClientRect();
               // offset in portion of real text width produced by axis
               xoffset = axis['fTitleOffset'] * (rect1.width-s_width);
            }
            // add font size
            xoffset += s_width + axis['fTitleSize'] * height * 1.3;
            if (pos_x + xoffset > width-3) xoffset = width - 3 - pos_x;
            var tcolor = JSROOT.Painter.root_colors[axis['fTextColor']];
            this.StartTextDrawing(axis['fTextFont'], axis['fTitleSize'] * height);
            this.DrawText(33, 0, xoffset, 0, -270, axis['fTitle'], tcolor);
            this.FinishTextDrawing();
         }

         this.AddDrag({ obj: palette, redraw: this.DrawPalette.bind(this), ctxmenu : JSROOT.touches && JSROOT.gStyle.ContextMenu });

         if (JSROOT.gStyle.ContextMenu && !JSROOT.touches)
            this.draw_g.on("contextmenu", this.ShowContextMenu.bind(this) );

         if (!JSROOT.gStyle.Zooming) return;

         var pthis = this, evnt = null, doing_zoom = false, sel1 = 0, sel2 = 0, zoom_rect = null;

         function moveRectSel() {

            if (!doing_zoom) return;

            d3.event.preventDefault();
            var m = d3.mouse(evnt);

            if (m[1] < sel1) sel1 = m[1]; else sel2 = m[1];

            zoom_rect.attr("y", sel1)
                     .attr("height", Math.abs(sel2-sel1));
         }

         function endRectSel() {
            if (!doing_zoom) return;

            d3.event.preventDefault();
            // d3.select(window).on("touchmove.zoomRect",
            // null).on("touchend.zoomRect", null);
            d3.select(window).on("mousemove.colzoomRect", null)
                             .on("mouseup.colzoomRect", null);
            // d3.select("body").classed("noselect", false);
            // d3.select("body").style("-webkit-user-select", "auto");
            zoom_rect.remove();
            zoom_rect = null;
            doing_zoom = false;

            var zmin = Math.min(z.invert(sel1), z.invert(sel2));
            var zmax = Math.max(z.invert(sel1), z.invert(sel2));

            pthis.main_painter().Zoom(0, 0, 0, 0, zmin, zmax);
         }

         function startRectSel() {

            // ignore when touch selection is actiavated
            if (doing_zoom) return;
            doing_zoom = true;

            d3.event.preventDefault();

            evnt = this;
            var origin = d3.mouse(evnt);

            sel1 = sel2 = origin[1];

            zoom_rect = pthis.draw_g
                   .append("svg:rect")
                   .attr("class", "zoom")
                   .attr("id", "colzoomRect")
                   .attr("x", "0")
                   .attr("width", s_width)
                   .attr("y", sel1)
                   .attr("height", 5);

            d3.select(window).on("mousemove.colzoomRect", moveRectSel)
                             .on("mouseup.colzoomRect", endRectSel, true);

            d3.event.stopPropagation();
         }

         this.draw_g.append("svg:rect")
                    .attr("x", s_width)
                    .attr("y", 0)
                    .attr("width", 20)
                    .attr("height", s_height)
                    .style("cursor", "crosshair")
                    .style("opacity", "0")
                    .on("mousedown", startRectSel);
      }

      this['ShowContextMenu'] = function(kind, evnt) {
         this.main_painter().ShowContextMenu("z", evnt);
      }

      this['Redraw'] = function() {
         var enabled = true;
         if ('options' in this.main_painter())
            enabled = (this.main_painter().options.Zscale > 0) && (this.main_painter().options.Color > 0);

         if (enabled)
            this.DrawPalette();
         else
            this.RemoveDrawG(); // if palette artificially disabled, do not redraw it
      }

      this.DrawPalette();

      return this.DrawingReady();
   }

   return JSROOT.Painter;

}));
