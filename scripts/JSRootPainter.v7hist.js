/// @file JSRootPainter.v7hist.js
/// JavaScript ROOT v7 graphics for histogram classes

(function( factory ) {
   if ( typeof define === "function" && define.amd ) {
      define( ['JSRootPainter', 'd3'], factory );
   } else
   if (typeof exports === 'object' && typeof module !== 'undefined') {
       factory(require("./JSRootCore.js"), require("./d3.min.js"));
   } else {

      if (typeof d3 != 'object')
         throw new Error('This extension requires d3.js', 'JSRootPainter.v7hist.js');

      if (typeof JSROOT == 'undefined')
         throw new Error('JSROOT is not defined', 'JSRootPainter.v7hist.js');

      if (typeof JSROOT.Painter != 'object')
         throw new Error('JSROOT.Painter not defined', 'JSRootPainter.v7hist.js');

      factory(JSROOT, d3);
   }
} (function(JSROOT, d3) {

   "use strict";

   JSROOT.sources.push("v7hist");
  
      
   // =============================================================

   function THistPainter(histo) {
      JSROOT.TObjectPainter.call(this, histo);
      // this.histo = histo;
      this.draw_content = true;
      this.nbinsx = 0;
      this.nbinsy = 0;
      this.accept_drops = true; // indicate that one can drop other objects like doing Draw("same")
      this.mode3d = false;
      this.zoom_changed_interactive = 0;
      // this.DecomposeTitle();
   }

   THistPainter.prototype = Object.create(JSROOT.TObjectPainter.prototype);
   
   THistPainter.prototype.GetHisto = function() {
      var obj = this.GetObject(),
          histo = obj && obj.fHistImpl ? obj.fHistImpl.fUnique : null; 
      
      if (histo && !histo.getBinContent) {
         histo.getBinContent = function(bin) {
            return this.fStatistics.fBinContent[bin];
         }
         histo.getBinError = function(bin) {
            if (this.fStatistics.fSumWeightsSquared)
               return Math.sqrt(this.fStatistics.fSumWeightsSquared[bin]);
            return Math.sqrt(Math.abs(this.getBinContent(bin)));
         }
      }
      
      return histo;
   }

   THistPainter.prototype.IsTProfile = function() {
      return false;
   }

   THistPainter.prototype.IsTH1K = function() {
      return false;
   }

   THistPainter.prototype.IsTH2Poly = function() {
      return false;
   }

   THistPainter.prototype.Cleanup = function() {
      if (this.keys_handler) {
         window.removeEventListener( 'keydown', this.keys_handler, false );
         this.keys_handler = null;
      }

      // clear all 3D buffers
      if (typeof this.Create3DScene === 'function')
         this.Create3DScene(-1);

      this.histo = null; // cleanup histogram reference
      delete this.x; delete this.grx;
      delete this.ConvertX; delete this.RevertX;
      delete this.y; delete this.gry;
      delete this.ConvertY; delete this.RevertY;
      delete this.z; delete this.grz;

      if (this.x_handle) {
         this.x_handle.Cleanup();
         delete this.x_handle;
      }

      if (this.y_handle) {
         this.y_handle.Cleanup();
         delete this.y_handle;
      }

      if (this.z_handle) {
         this.z_handle.Cleanup();
         delete this.z_handle;
      }

      delete this.fPalette;
      delete this.fContour;
      delete this.options;

      JSROOT.TObjectPainter.prototype.Cleanup.call(this);
   }

   THistPainter.prototype.Dimension = function() {
      return 1;
   }

   THistPainter.prototype.GetAutoColor = function(col) {
      if (this.options.AutoColor<=0) return col;

      var id = this.options.AutoColor;
      this.options.AutoColor = id % 8 + 1;
      return JSROOT.Painter.root_colors[id];
   }

   THistPainter.prototype.ScanContent = function(when_axis_changed) {
      // function will be called once new histogram or
      // new histogram content is assigned
      // one should find min,max,nbins, maxcontent values
      // if when_axis_changed === true specified, content will be scanned after axis zoom changed

      alert("HistPainter.prototype.ScanContent not implemented");
   }
   
   THistPainter.prototype.DrawAxes = function() {
      var main = this.frame_painter();
      if (main && this.draw_content) {
         main.ConfigureDrawRange(this.xmin, this.xmax, this.ymin, this.ymax);
         main.DrawAxes();
      }
   }

   THistPainter.prototype.CheckPadRange = function() {

      if (!this.is_main_painter()) return;

      this.zoom_xmin = this.zoom_xmax = 0;
      this.zoom_ymin = this.zoom_ymax = 0;
      this.zoom_zmin = this.zoom_zmax = 0;

      var ndim = this.Dimension(),
          xaxis = this.histo.fXaxis,
          yaxis = this.histo.fYaxis,
          zaxis = this.histo.fXaxis;

      // apply selected user range from histogram itself
      if (xaxis.TestBit(JSROOT.EAxisBits.kAxisRange)) {
         //xaxis.InvertBit(JSROOT.EAxisBits.kAxisRange); // axis range is not used for main painter
         if ((xaxis.fFirst !== xaxis.fLast) && ((xaxis.fFirst > 1) || (xaxis.fLast < xaxis.fNbins))) {
            this.zoom_xmin = xaxis.fFirst > 1 ? xaxis.GetBinLowEdge(xaxis.fFirst) : xaxis.fXmin;
            this.zoom_xmax = xaxis.fLast < xaxis.fNbins ? xaxis.GetBinLowEdge(xaxis.fLast+1) : xaxis.fXmax;
         }
      }

      if ((ndim>1) && yaxis.TestBit(JSROOT.EAxisBits.kAxisRange)) {
         //yaxis.InvertBit(JSROOT.EAxisBits.kAxisRange); // axis range is not used for main painter
         if ((yaxis.fFirst !== yaxis.fLast) && ((yaxis.fFirst > 1) || (yaxis.fLast < yaxis.fNbins))) {
            this.zoom_ymin = yaxis.fFirst > 1 ? yaxis.GetBinLowEdge(yaxis.fFirst) : yaxis.fXmin;
            this.zoom_ymax = yaxis.fLast < yaxis.fNbins ? yaxis.GetBinLowEdge(yaxis.fLast+1) : yaxis.fXmax;
         }
      }

      if ((ndim>2) && zaxis.TestBit(JSROOT.EAxisBits.kAxisRange)) {
         //zaxis.InvertBit(JSROOT.EAxisBits.kAxisRange); // axis range is not used for main painter
         if ((zaxis.fFirst !== zaxis.fLast) && ((zaxis.fFirst > 1) || (zaxis.fLast < zaxis.fNbins))) {
            this.zoom_zmin = zaxis.fFirst > 1 ? zaxis.GetBinLowEdge(zaxis.fFirst) : zaxis.fXmin;
            this.zoom_zmax = zaxis.fLast < zaxis.fNbins ? zaxis.GetBinLowEdge(zaxis.fLast+1) : zaxis.fXmax;
         }
      }

      var pad = this.root_pad();

      if (!pad || !('fUxmin' in pad) || this.create_canvas) return;

      var min = pad.fUxmin, max = pad.fUxmax;

      // first check that non-default values are there
      if ((ndim < 3) && ((min !== 0) || (max !== 1))) {
         if (pad.fLogx > 0) {
            min = Math.exp(min * Math.log(10));
            max = Math.exp(max * Math.log(10));
         }

         if (min !== xaxis.fXmin || max !== xaxis.fXmax)
            if (min >= xaxis.fXmin && max <= xaxis.fXmax) {
               // set zoom values if only inside range
               this.zoom_xmin = min;
               this.zoom_xmax = max;
            }
      }

      min = pad.fUymin; max = pad.fUymax;

      if ((ndim == 2) && ((min !== 0) || (max !== 1))) {
         if (pad.fLogy > 0) {
            min = Math.exp(min * Math.log(10));
            max = Math.exp(max * Math.log(10));
         }

         if (min !== yaxis.fXmin || max !== yaxis.fXmax)
            if (min >= yaxis.fXmin && max <= yaxis.fXmax) {
               // set zoom values if only inside range
               this.zoom_ymin = min;
               this.zoom_ymax = max;
            }
      }
   }

   THistPainter.prototype.CheckHistDrawAttributes = function() {

/*      if (this.options._pfc || this.options._plc || this.options._pmc) {
         if (!this.pallette && JSROOT.Painter.GetColorPalette)
            this.palette = JSROOT.Painter.GetColorPalette();

         var pp = this.pad_painter(true);
         if (this.palette && pp) {
            var indx = pp.GetCurrentPrimitiveIndx(), num = pp.GetNumPrimitives();

            var color = this.palette.calcColor(indx, num);
            var icolor = this.add_color(color);

            if (this.options._pfc) { this.histo.fFillColor = icolor; delete this.fillatt; }
            if (this.options._plc) { this.histo.fLineColor = icolor; delete this.lineatt; }
            if (this.options._pmc) { this.histo.fMarkerColor = icolor; delete this.markeratt; }
         }

         this.options._pfc = this.options._plc = this.options._pmc = false;
      }
*/
      if (!this.fillatt || !this.fillatt.changed)
         this.fillatt = this.createAttFill(null, 0, 0);

      if (!this.lineatt || !this.lineatt.changed)
         this.lineatt = new JSROOT.TAttLineHandler('black');
   }

   THistPainter.prototype.UpdateObject = function(obj, opt) {

      var histo = this.GetObject();

      if (obj !== histo) {

         if (!this.MatchObjectType(obj)) return false;

         // special tratement for webcanvas - also name can be changed
         // if (this.snapid !== undefined)
         //   histo.fName = obj.fName;

         // histo.fTitle = obj.fTitle;
      }

      this.ScanContent();

      this.histogram_updated = true; // indicate that object updated

      return true;
   }

   THistPainter.prototype.CreateAxisFuncs = function(with_y_axis, with_z_axis) {
      // here functions are defined to convert index to axis value and back
      // introduced to support non-equidistant bins
      
      var histo = this.GetHisto();
      if (!histo) return;
      
      var axis = histo.fAxes._0;
      this.xmin = axis.fLow;
      this.xmax = this.xmin + (axis.fNBins - 2)/axis.fInvBinWidth;
      this.regularx = true;

      if (!this.regularx) {
         this.GetBinX = function(bin) {
            var indx = Math.round(bin);
            if (indx <= 0) return this.xmin;
            if (indx > this.nbinsx) return this.xmax;
            if (indx==bin) return this.histo.fXaxis.fXbins[indx];
            var indx2 = (bin < indx) ? indx - 1 : indx + 1;
            return this.histo.fXaxis.fXbins[indx] * Math.abs(bin-indx2) + this.histo.fXaxis.fXbins[indx2] * Math.abs(bin-indx);
         };
         this.GetIndexX = function(x,add) {
            for (var k = 1; k < this.histo.fXaxis.fXbins.length; ++k)
               if (x < this.histo.fXaxis.fXbins[k]) return Math.floor(k-1+add);
            return this.nbinsx;
         };
      } else {
         this.binwidthx = (this.xmax - this.xmin);
         if (this.nbinsx > 0)
            this.binwidthx = this.binwidthx / this.nbinsx;

         this.GetBinX = function(bin) { return this.xmin + bin*this.binwidthx; };
         this.GetIndexX = function(x,add) { return Math.floor((x - this.xmin) / this.binwidthx + add); };
      }

      if (!with_y_axis || (this.nbinsy==0)) return;

      var axis = histo.fAxes._1;
      this.ymin = axis.fLow;
      this.ymax = this.ymin + (axis.fNBins - 2)/axis.fInvBinWidth;
      this.regulary = true;
      
      if (!this.regulary) {
         this.GetBinY = function(bin) {
            var indx = Math.round(bin);
            if (indx <= 0) return this.ymin;
            if (indx > this.nbinsy) return this.ymax;
            if (indx==bin) return this.histo.fYaxis.fXbins[indx];
            var indx2 = (bin < indx) ? indx - 1 : indx + 1;
            return this.histo.fYaxis.fXbins[indx] * Math.abs(bin-indx2) + this.histo.fYaxis.fXbins[indx2] * Math.abs(bin-indx);
         };
         this.GetIndexY = function(y,add) {
            for (var k = 1; k < this.histo.fYaxis.fXbins.length; ++k)
               if (y < this.histo.fYaxis.fXbins[k]) return Math.floor(k-1+add);
            return this.nbinsy;
         };
      } else {
         this.binwidthy = (this.ymax - this.ymin);
         if (this.nbinsy > 0)
            this.binwidthy = this.binwidthy / this.nbinsy;

         this.GetBinY = function(bin) { return this.ymin+bin*this.binwidthy; };
         this.GetIndexY = function(y,add) { return Math.floor((y - this.ymin) / this.binwidthy + add); };
      }

      if (!with_z_axis || (this.nbinsz==0)) return;

      this.regularz = true;
      
      if (!this.regularz) {
         this.GetBinZ = function(bin) {
            var indx = Math.round(bin);
            if (indx <= 0) return this.zmin;
            if (indx > this.nbinsz) return this.zmax;
            if (indx==bin) return this.histo.fZaxis.fXbins[indx];
            var indx2 = (bin < indx) ? indx - 1 : indx + 1;
            return this.histo.fZaxis.fXbins[indx] * Math.abs(bin-indx2) + this.histo.fZaxis.fXbins[indx2] * Math.abs(bin-indx);
         };
         this.GetIndexZ = function(z,add) {
            for (var k = 1; k < this.histo.fZaxis.fXbins.length; ++k)
               if (z < this.histo.fZaxis.fXbins[k]) return Math.floor(k-1+add);
            return this.nbinsz;
         };
      } else {
         this.binwidthz = (this.zmax - this.zmin);
         if (this.nbinsz > 0)
            this.binwidthz = this.binwidthz / this.nbinsz;

         this.GetBinZ = function(bin) { return this.zmin+bin*this.binwidthz; };
         this.GetIndexZ = function(z,add) { return Math.floor((z - this.zmin) / this.binwidthz + add); };
      }
   }

   
   THistPainter.prototype.DrawBins = function() {
      alert("HistPainter.DrawBins not implemented");
   }
   

   THistPainter.prototype.ToggleTitle = function(arg) {
      if (!this.is_main_painter()) return false;
      if (arg==='only-check') return !this.histo.TestBit(JSROOT.TH1StatusBits.kNoTitle);
      this.histo.InvertBit(JSROOT.TH1StatusBits.kNoTitle);
      this.DrawTitle();
   }

   THistPainter.prototype.DecomposeTitle = function() {
      // if histogram title includes ;, set axis title

      if (!this.histo || !this.histo.fTitle) return;

      var arr = this.histo.fTitle.split(';');
      if (arr.length===3) {
         this.histo.fTitle = arr[0];
         this.histo.fXaxis.fTitle = arr[1];
         this.histo.fYaxis.fTitle = arr[2];
      }
   }

   THistPainter.prototype.DrawTitle = function() {

      // case when histogram drawn over other histogram (same option)
      if (!this.is_main_painter() || this.options.Same) return;

      var tpainter = this.FindPainterFor(null, "title");
      var pavetext = (tpainter !== null) ? tpainter.GetObject() : null;
      if (pavetext === null) pavetext = this.FindInPrimitives("title");
      if ((pavetext !== null) && (pavetext._typename !== "TPaveText")) pavetext = null;

      var draw_title = !this.histo.TestBit(JSROOT.TH1StatusBits.kNoTitle);

      if (pavetext !== null) {
         pavetext.Clear();
         if (draw_title)
            pavetext.AddText(this.histo.fTitle);
         if (tpainter) tpainter.Redraw();
      } else
      if (draw_title && !tpainter && (this.histo.fTitle.length > 0)) {
         pavetext = JSROOT.Create("TPaveText");

         JSROOT.extend(pavetext, { fName: "title", fX1NDC: 0.28, fY1NDC: 0.94, fX2NDC: 0.72, fY2NDC: 0.99 } );
         pavetext.AddText(this.histo.fTitle);

         JSROOT.Painter.drawPave(this.divid, pavetext);
      }
   }

   THistPainter.prototype.UpdateStatWebCanvas = function() {
      if (!this.snapid) return;

      var stat = this.FindStat(),
          statpainter = this.FindPainterFor(stat);

      if (statpainter && !statpainter.snapid) statpainter.Redraw();
   }

   THistPainter.prototype.ToggleStat = function(arg) {

      var stat = this.FindStat(), statpainter = null;

      if (!arg) arg = "";

      if (stat == null) {
         if (arg.indexOf('-check')>0) return false;
         // when statbox created first time, one need to draw it
         stat = this.CreateStat(true);
      } else {
         statpainter = this.FindPainterFor(stat);
      }

      if (arg=='only-check') return statpainter ? statpainter.Enabled : false;

      if (arg=='fitpar-check') return stat ? stat.fOptFit : false;

      if (arg=='fitpar-toggle') {
         if (!stat) return false;
         stat.fOptFit = stat.fOptFit ? 0 : 1111; // for websocket command should be send to server
         if (statpainter) statpainter.Redraw();
         return true;
      }

      if (statpainter) {
         statpainter.Enabled = !statpainter.Enabled;
         // when stat box is drawn, it always can be drawn individually while it
         // should be last for colz RedrawPad is used
         statpainter.Redraw();
         return statpainter.Enabled;
      }

      JSROOT.draw(this.divid, stat, "onpad:" + this.pad_name);

      return true;
   }

   THistPainter.prototype.IsAxisZoomed = function(axis) {
      var obj = this.main_painter() || this;
      return obj['zoom_'+axis+'min'] !== obj['zoom_'+axis+'max'];
   }

   THistPainter.prototype.GetSelectIndex = function(axis, size, add) {
      // be aware - here indexes starts from 0
      var indx = 0, 
          main = this.frame_painter(),
          nbins = this['nbins'+axis] || 0;

      var func = 'GetIndex' + axis.toUpperCase(),
          min = main ? main['zoom_' + axis + 'min'] : 0,
          max = main ? main['zoom_' + axis + 'max'] : 0;

      if ((min !== max) && (func in this)) {
         if (size == "left") {
            indx = this[func](min, add || 0);
         } else {
            indx = this[func](max, (add || 0) + 0.5);
         }
      } else {
         indx = (size == "left") ? 0 : nbins;
      }

      return indx;
   }

   THistPainter.prototype.FindStat = function() {
      if (this.histo.fFunctions !== null)
         for (var i = 0; i < this.histo.fFunctions.arr.length; ++i) {
            var func = this.histo.fFunctions.arr[i];

            if ((func._typename == 'TPaveStats') &&
                (func.fName == 'stats')) return func;
         }

      return null;
   }

   THistPainter.prototype.IgnoreStatsFill = function() {
      return !this.histo || (!this.draw_content && !this.create_stats) || (this.options.Axis>0);
   }

   THistPainter.prototype.CreateStat = function(force) {

      if (!force && !this.options.ForceStat) {
         if (this.options.NoStat || this.histo.TestBit(JSROOT.TH1StatusBits.kNoStats) || !JSROOT.gStyle.AutoStat) return null;

         if (!this.draw_content || !this.is_main_painter()) return null;
      }

      this.create_stats = true;

      var stats = this.FindStat();
      if (stats) return stats;

      var st = JSROOT.gStyle;

      stats = JSROOT.Create('TPaveStats');
      JSROOT.extend(stats, { fName : 'stats',
                             fOptStat: this.histo.$custom_stat || st.fOptStat,
                             fOptFit: st.fOptFit,
                             fBorderSize : 1} );

      stats.fX1NDC = st.fStatX - st.fStatW;
      stats.fY1NDC = st.fStatY - st.fStatH;
      stats.fX2NDC = st.fStatX;
      stats.fY2NDC = st.fStatY;

      stats.fFillColor = st.fStatColor;
      stats.fFillStyle = st.fStatStyle;

      stats.fTextAngle = 0;
      stats.fTextSize = st.fStatFontSize; // 9 ??
      stats.fTextAlign = 12;
      stats.fTextColor = st.fStatTextColor;
      stats.fTextFont = st.fStatFont;

//      st.fStatBorderSize : 1,

      if (this.histo._typename.match(/^TProfile/) || this.histo._typename.match(/^TH2/))
         stats.fY1NDC = 0.67;

      stats.AddText(this.histo.fName);

      this.AddFunction(stats);

      return stats;
   }

   THistPainter.prototype.AddFunction = function(obj, asfirst) {
      var histo = this.GetObject();
      if (!histo || !obj) return;

      if (!histo.fFunctions)
         histo.fFunctions = JSROOT.Create("TList");

      if (asfirst)
         histo.fFunctions.AddFirst(obj);
      else
         histo.fFunctions.Add(obj);
   }

   THistPainter.prototype.FindFunction = function(type_name) {
      var funcs = this.GetObject().fFunctions;
      if (funcs === null) return null;

      for (var i = 0; i < funcs.arr.length; ++i)
         if (funcs.arr[i]._typename === type_name) return funcs.arr[i];

      return null;
   }


   THistPainter.prototype.FindAlternativeClickHandler = function(pos) {
      var pp = this.pad_painter(true);
      if (!pp) return false;

      var pnt = { x: pos[0], y: pos[1], painters: true, disabled: true, click_handler: true };

      var hints = pp.GetTooltips(pnt);
      for (var k=0;k<hints.length;++k)
         if (hints[k] && (typeof hints[k].click_handler == 'function')) {
            hints[k].click_handler(hints[k]);
            return true;
         }

      return false;
   }


   THistPainter.prototype.AllowDefaultYZooming = function() {
      // return true if default Y zooming should be enabled
      // it is typically for 2-Dim histograms or
      // when histogram not draw, defined by other painters

      if (this.Dimension()>1) return true;
      if (this.draw_content) return false;

      var pad_painter = this.pad_painter(true);
      if (pad_painter &&  pad_painter.painters)
         for (var k = 0; k < pad_painter.painters.length; ++k) {
            var subpainter = pad_painter.painters[k];
            if ((subpainter!==this) && subpainter.wheel_zoomy!==undefined)
               return subpainter.wheel_zoomy;
         }

      return false;
   }

   THistPainter.prototype.AnalyzeMouseWheelEvent = function(event, item, dmin, ignore) {

      item.min = item.max = undefined;
      item.changed = false;
      if (ignore && item.ignore) return;

      var delta = 0, delta_left = 1, delta_right = 1;

      if ('dleft' in item) { delta_left = item.dleft; delta = 1; }
      if ('dright' in item) { delta_right = item.dright; delta = 1; }

      if ('delta' in item) {
         delta = item.delta;
      } else if (event && event.wheelDelta !== undefined ) {
         // WebKit / Opera / Explorer 9
         delta = -event.wheelDelta;
      } else if (event && event.deltaY !== undefined ) {
         // Firefox
         delta = event.deltaY;
      } else if (event && event.detail !== undefined) {
         delta = event.detail;
      }

      if (delta===0) return;
      delta = (delta<0) ? -0.2 : 0.2;

      delta_left *= delta
      delta_right *= delta;

      var lmin = item.min = this["scale_"+item.name+"min"],
          lmax = item.max = this["scale_"+item.name+"max"],
          gmin = this[item.name+"min"],
          gmax = this[item.name+"max"];

      if ((item.min === item.max) && (delta<0)) {
         item.min = gmin;
         item.max = gmax;
      }

      if (item.min >= item.max) return;

      if ((dmin>0) && (dmin<1)) {
         if (this['log'+item.name]) {
            var factor = (item.min>0) ? JSROOT.log10(item.max/item.min) : 2;
            if (factor>10) factor = 10; else if (factor<0.01) factor = 0.01;
            item.min = item.min / Math.pow(10, factor*delta_left*dmin);
            item.max = item.max * Math.pow(10, factor*delta_right*(1-dmin));
         } else {
            var rx_left = (item.max - item.min), rx_right = rx_left;
            if (delta_left>0) rx_left = 1.001 * rx_left / (1-delta_left);
            item.min += -delta_left*dmin*rx_left;

            if (delta_right>0) rx_right = 1.001 * rx_right / (1-delta_right);

            item.max -= -delta_right*(1-dmin)*rx_right;
         }
         if (item.min >= item.max)
            item.min = item.max = undefined;
         else
         if (delta_left !== delta_right) {
            // extra check case when moving left or right
            if (((item.min < gmin) && (lmin===gmin)) ||
                ((item.max > gmax) && (lmax==gmax)))
                   item.min = item.max = undefined;
         }

      } else {
         item.min = item.max = undefined;
      }

      item.changed = ((item.min !== undefined) && (item.max !== undefined));
   }

 

   THistPainter.prototype.ShowAxisStatus = function(axis_name) {
      // method called normally when mouse enter main object element

      var status_func = this.GetShowStatusFunc();

      if (!status_func) return;

      var taxis = this.histo ? this.histo['f'+axis_name.toUpperCase()+"axis"] : null;

      var hint_name = axis_name, hint_title = "TAxis";

      if (taxis) { hint_name = taxis.fName; hint_title = taxis.fTitle || "histogram TAxis object"; }

      var m = d3.mouse(this.svg_frame().node());

      var id = (axis_name=="x") ? 0 : 1;
      if (this.swap_xy) id = 1-id;

      var axis_value = (axis_name=="x") ? this.RevertX(m[id]) : this.RevertY(m[id]);

      status_func(hint_name, hint_title, axis_name + " : " + this.AxisAsText(axis_name, axis_value),
                  m[0].toFixed(0)+","+ m[1].toFixed(0));
   }




   THistPainter.prototype.ShowContextMenu = function(kind, evnt, obj) {
      // ignore context menu when touches zooming is ongoing
      if (('zoom_kind' in this) && (this.zoom_kind > 100)) return;

      // this is for debug purposes only, when context menu is where, close is and show normal menu
      //if (!evnt && !kind && document.getElementById('root_ctx_menu')) {
      //   var elem = document.getElementById('root_ctx_menu');
      //   elem.parentNode.removeChild(elem);
      //   return;
      //}

      var menu_painter = this, frame_corner = false, fp = null; // object used to show context menu

      if (!evnt) {
         d3.event.preventDefault();
         d3.event.stopPropagation(); // disable main context menu
         evnt = d3.event;

         if (kind === undefined) {
            var ms = d3.mouse(this.svg_frame().node()),
                tch = d3.touches(this.svg_frame().node()),
                pp = this.pad_painter(true),
                pnt = null, sel = null;

            fp = this.frame_painter();

            if (tch.length === 1) pnt = { x: tch[0][0], y: tch[0][1], touch: true }; else
            if (ms.length === 2) pnt = { x: ms[0], y: ms[1], touch: false };

            if ((pnt !== null) && (pp !== null)) {
               pnt.painters = true; // assign painter for every tooltip
               var hints = pp.GetTooltips(pnt), bestdist = 1000;
               for (var n=0;n<hints.length;++n)
                  if (hints[n] && hints[n].menu) {
                     var dist = ('menu_dist' in hints[n]) ? hints[n].menu_dist : 7;
                     if (dist < bestdist) { sel = hints[n].painter; bestdist = dist; }
                  }
            }

            if (sel!==null) menu_painter = sel; else
            if (fp!==null) kind = "frame";

            if (pnt!==null) frame_corner = (pnt.x>0) && (pnt.x<20) && (pnt.y>0) && (pnt.y<20);

            if (fp) fp.SetLastEventPos(pnt);
         }
      }

      // one need to copy event, while after call back event may be changed
      menu_painter.ctx_menu_evnt = evnt;

      JSROOT.Painter.createMenu(menu_painter, function(menu) {
         var domenu = menu.painter.FillContextMenu(menu, kind, obj);

         // fill frame menu by default - or append frame elements when activated in the frame corner
         if (fp && (!domenu || (frame_corner && (kind!=="frame"))))
            domenu = fp.FillContextMenu(menu);

         if (domenu)
            menu.painter.FillObjectExecMenu(menu, kind, function() {
                // suppress any running zooming
                menu.painter.SwitchTooltip(false);
                menu.show(menu.painter.ctx_menu_evnt, menu.painter.SwitchTooltip.bind(menu.painter, true) );
            });

      });  // end menu creation
   }


   THistPainter.prototype.ChangeUserRange = function(arg) {
      var taxis = this.histo['f'+arg+"axis"];
      if (!taxis) return;

      var curr = "[1," + taxis.fNbins+"]";
      if (taxis.TestBit(JSROOT.EAxisBits.kAxisRange))
          curr = "[" +taxis.fFirst+"," + taxis.fLast+"]";

      var res = prompt("Enter user range for axis " + arg + " like [1," + taxis.fNbins + "]", curr);
      if (res==null) return;
      res = JSON.parse(res);

      if (!res || (res.length!=2) || isNaN(res[0]) || isNaN(res[1])) return;
      taxis.fFirst = parseInt(res[0]);
      taxis.fLast = parseInt(res[1]);

      var newflag = (taxis.fFirst < taxis.fLast) && (taxis.fFirst >= 1) && (taxis.fLast<=taxis.fNbins);
      if (newflag != taxis.TestBit(JSROOT.EAxisBits.kAxisRange))
         taxis.InvertBit(JSROOT.EAxisBits.kAxisRange);

      this.Redraw();
   }

   THistPainter.prototype.FillContextMenu = function(menu, kind, obj) {

      // when fill and show context menu, remove all zooming
      this.clearInteractiveElements();

      if ((kind=="x") || (kind=="y") || (kind=="z")) {
         var faxis = this.histo.fXaxis;
         if (kind=="y") faxis = this.histo.fYaxis;  else
         if (kind=="z") faxis = obj ? obj : this.histo.fZaxis;
         menu.add("header: " + kind.toUpperCase() + " axis");
         menu.add("Unzoom", this.Unzoom.bind(this, kind));
         menu.addchk(this.options["Log" + kind], "SetLog"+kind, this.ToggleLog.bind(this, kind) );
         menu.addchk(faxis.TestBit(JSROOT.EAxisBits.kMoreLogLabels), "More log",
               function() { faxis.InvertBit(JSROOT.EAxisBits.kMoreLogLabels); this.RedrawPad(); });
         menu.addchk(faxis.TestBit(JSROOT.EAxisBits.kNoExponent), "No exponent",
               function() { faxis.InvertBit(JSROOT.EAxisBits.kNoExponent); this.RedrawPad(); });

         if ((kind === "z") && (this.options.Zscale > 0))
            if (this.FillPaletteMenu) this.FillPaletteMenu(menu);

         if (faxis != null) {
            menu.add("sub:Labels");
            menu.addchk(faxis.TestBit(JSROOT.EAxisBits.kCenterLabels), "Center",
                  function() { faxis.InvertBit(JSROOT.EAxisBits.kCenterLabels); this.RedrawPad(); });
            menu.addchk(faxis.TestBit(JSROOT.EAxisBits.kLabelsVert), "Rotate",
                  function() { faxis.InvertBit(JSROOT.EAxisBits.kLabelsVert); this.RedrawPad(); });
            this.AddColorMenuEntry(menu, "Color", faxis.fLabelColor,
                  function(arg) { faxis.fLabelColor = parseInt(arg); this.RedrawPad(); });
            this.AddSizeMenuEntry(menu,"Offset", 0, 0.1, 0.01, faxis.fLabelOffset,
                  function(arg) { faxis.fLabelOffset = parseFloat(arg); this.RedrawPad(); } );
            this.AddSizeMenuEntry(menu,"Size", 0.02, 0.11, 0.01, faxis.fLabelSize,
                  function(arg) { faxis.fLabelSize = parseFloat(arg); this.RedrawPad(); } );
            menu.add("endsub:");
            menu.add("sub:Title");
            menu.add("SetTitle", function() {
               var t = prompt("Enter axis title", faxis.fTitle);
               if (t!==null) { faxis.fTitle = t; this.RedrawPad(); }
            });
            menu.addchk(faxis.TestBit(JSROOT.EAxisBits.kCenterTitle), "Center",
                  function() { faxis.InvertBit(JSROOT.EAxisBits.kCenterTitle); this.RedrawPad(); });
            menu.addchk(faxis.TestBit(JSROOT.EAxisBits.kRotateTitle), "Rotate",
                  function() { faxis.InvertBit(JSROOT.EAxisBits.kRotateTitle); this.RedrawPad(); });
            this.AddColorMenuEntry(menu, "Color", faxis.fTitleColor,
                  function(arg) { faxis.fTitleColor = parseInt(arg); this.RedrawPad(); });
            this.AddSizeMenuEntry(menu,"Offset", 0, 3, 0.2, faxis.fTitleOffset,
                                  function(arg) { faxis.fTitleOffset = parseFloat(arg); this.RedrawPad(); } );
            this.AddSizeMenuEntry(menu,"Size", 0.02, 0.11, 0.01, faxis.fTitleSize,
                  function(arg) { faxis.fTitleSize = parseFloat(arg); this.RedrawPad(); } );
            menu.add("endsub:");
         }
         menu.add("sub:Ticks");
         this.AddColorMenuEntry(menu, "Color", faxis.fLineColor,
                     function(arg) { faxis.fLineColor = parseInt(arg); this.RedrawPad(); });
         this.AddColorMenuEntry(menu, "Color", faxis.fAxisColor,
                     function(arg) { faxis.fAxisColor = parseInt(arg); this.RedrawPad(); });
         this.AddSizeMenuEntry(menu,"Size", -0.05, 0.055, 0.01, faxis.fTickLength,
                   function(arg) { faxis.fTickLength = parseFloat(arg); this.RedrawPad(); } );
         menu.add("endsub:");
         return true;
      }

      if (kind == "frame") {
         var fp = this.frame_painter();
         if (fp) return fp.FillContextMenu(menu);
      }

      menu.add("header:"+ this.histo._typename + "::" + this.histo.fName);

      if (this.draw_content) {
         menu.addchk(this.ToggleStat('only-check'), "Show statbox", function() { this.ToggleStat(); });
         if (this.Dimension() == 1) {
            menu.add("User range X", "X", this.ChangeUserRange);
         } else {
            menu.add("sub:User ranges");
            menu.add("X", "X", this.ChangeUserRange);
            menu.add("Y", "Y", this.ChangeUserRange);
            if (this.Dimension() > 2)
               menu.add("Z", "Z", this.ChangeUserRange);
            menu.add("endsub:")
         }

         if (typeof this.FillHistContextMenu == 'function')
            this.FillHistContextMenu(menu);
      }

      if ((this.options.Lego > 0) || (this.options.Surf > 0) || (this.Dimension() === 3)) {
         // menu for 3D drawings

         if (menu.size() > 0)
            menu.add("separator");

         var main = this.main_painter() || this;

         menu.addchk(main.tooltip_allowed, 'Show tooltips', function() {
            main.tooltip_allowed = !main.tooltip_allowed;
         });

         menu.addchk(main.enable_highlight, 'Highlight bins', function() {
            main.enable_highlight = !main.enable_highlight;
            if (!main.enable_highlight && main.BinHighlight3D && main.mode3d) main.BinHighlight3D(null);
         });

         menu.addchk(main.options.FrontBox, 'Front box', function() {
            main.options.FrontBox = !main.options.FrontBox;
            if (main.Render3D) main.Render3D();
         });
         menu.addchk(main.options.BackBox, 'Back box', function() {
            main.options.BackBox = !main.options.BackBox;
            if (main.Render3D) main.Render3D();
         });

         if (this.draw_content) {
            menu.addchk(!this.options.Zero, 'Suppress zeros', function() {
               this.options.Zero = !this.options.Zero;
               this.RedrawPad();
            });

            if ((this.options.Lego==12) || (this.options.Lego==14)) {
               menu.addchk(this.options.Zscale, "Z scale", function() {
                  this.ToggleColz();
               });
               if (this.FillPaletteMenu) this.FillPaletteMenu(menu);
            }
         }

         if (main.control && typeof main.control.reset === 'function')
            menu.add('Reset camera', function() {
               main.control.reset();
            });
      }

      this.FillAttContextMenu(menu);

      if (this.histogram_updated && this.zoom_changed_interactive)
         menu.add('Let update zoom', function() {
            this.zoom_changed_interactive = 0;
         });

      return true;
   }

   THistPainter.prototype.ButtonClick = function(funcname) {
      if (!this.is_main_painter()) return false;
      switch(funcname) {
         case "ToggleZoom":
            if ((this.zoom_xmin !== this.zoom_xmax) || (this.zoom_ymin !== this.zoom_ymax) || (this.zoom_zmin !== this.zoom_zmax)) {
               this.Unzoom();
               return true;
            }
            if (this.draw_content && (typeof this.AutoZoom === 'function')) {
               this.AutoZoom();
               return true;
            }
            break;
         case "ToggleLogX": this.ToggleLog("x"); break;
         case "ToggleLogY": this.ToggleLog("y"); break;
         case "ToggleLogZ": this.ToggleLog("z"); break;
         case "ToggleStatBox": this.ToggleStat(); return true; break;
      }
      return false;
   }

   THistPainter.prototype.FillToolbar = function() {
      var pp = this.pad_painter(true);
      if (pp===null) return;

      pp.AddButton(JSROOT.ToolbarIcons.auto_zoom, 'Toggle between unzoom and autozoom-in', 'ToggleZoom', "Ctrl *");
      pp.AddButton(JSROOT.ToolbarIcons.arrow_right, "Toggle log x", "ToggleLogX", "PageDown");
      pp.AddButton(JSROOT.ToolbarIcons.arrow_up, "Toggle log y", "ToggleLogY", "PageUp");
      if (this.Dimension() > 1)
         pp.AddButton(JSROOT.ToolbarIcons.arrow_diag, "Toggle log z", "ToggleLogZ");
      if (this.draw_content)
         pp.AddButton(JSROOT.ToolbarIcons.statbox, 'Toggle stat box', "ToggleStatBox");
   }

   THistPainter.prototype.Get3DToolTip = function(indx) {
      var tip = { bin: indx, name: this.GetObject().fName, title: this.GetObject().fTitle };
      switch (this.Dimension()) {
         case 1:
            tip.ix = indx; tip.iy = 1;
            tip.value = this.histo.getBinContent(tip.ix);
            tip.error = this.histo.getBinError(indx);
            tip.lines = this.GetBinTips(indx-1);
            break;
         case 2:
            tip.ix = indx % (this.nbinsx + 2);
            tip.iy = (indx - tip.ix) / (this.nbinsx + 2);
            tip.value = this.histo.getBinContent(tip.ix, tip.iy);
            tip.error = this.histo.getBinError(indx);
            tip.lines = this.GetBinTips(tip.ix-1, tip.iy-1);
            break;
         case 3:
            tip.ix = indx % (this.nbinsx+2);
            tip.iy = ((indx - tip.ix) / (this.nbinsx+2)) % (this.nbinsy+2);
            tip.iz = (indx - tip.ix - tip.iy * (this.nbinsx+2)) / (this.nbinsx+2) / (this.nbinsy+2);
            tip.value = this.GetObject().getBinContent(tip.ix, tip.iy, tip.iz);
            tip.error = this.histo.getBinError(indx);
            tip.lines = this.GetBinTips(tip.ix-1, tip.iy-1, tip.iz-1);
            break;
      }

      return tip;
   }

   THistPainter.prototype.CreateContour = function(nlevels, zmin, zmax, zminpositive) {

      if (nlevels<1) nlevels = JSROOT.gStyle.fNumberContours;
      this.fContour = [];
      this.colzmin = zmin;
      this.colzmax = zmax;

      if (this.root_pad().fLogz) {
         if (this.colzmax <= 0) this.colzmax = 1.;
         if (this.colzmin <= 0)
            if ((zminpositive===undefined) || (zminpositive <= 0))
               this.colzmin = 0.0001*this.colzmax;
            else
               this.colzmin = ((zminpositive < 3) || (zminpositive>100)) ? 0.3*zminpositive : 1;
         if (this.colzmin >= this.colzmax) this.colzmin = 0.0001*this.colzmax;

         var logmin = Math.log(this.colzmin)/Math.log(10),
             logmax = Math.log(this.colzmax)/Math.log(10),
             dz = (logmax-logmin)/nlevels;
         this.fContour.push(this.colzmin);
         for (var level=1; level<nlevels; level++)
            this.fContour.push(Math.exp((logmin + dz*level)*Math.log(10)));
         this.fContour.push(this.colzmax);
         this.fCustomContour = true;
      } else {
         if ((this.colzmin === this.colzmax) && (this.colzmin !== 0)) {
            this.colzmax += 0.01*Math.abs(this.colzmax);
            this.colzmin -= 0.01*Math.abs(this.colzmin);
         }
         var dz = (this.colzmax-this.colzmin)/nlevels;
         for (var level=0; level<=nlevels; level++)
            this.fContour.push(this.colzmin + dz*level);
      }

      if (this.Dimension() < 3) {
         this.zmin = this.colzmin;
         this.zmax = this.colzmax;
      }

      return this.fContour;
   }

   THistPainter.prototype.GetContour = function() {
      if (this.fContour) return this.fContour;

      var main = this.main_painter();
      if ((main !== this) && main.fContour) {
         this.fContour = main.fContour;
         this.fCustomContour = main.fCustomContour;
         this.colzmin = main.colzmin;
         this.colzmax = main.colzmax;
         return this.fContour;
      }

      // if not initialized, first create contour array
      // difference from ROOT - fContour includes also last element with maxbin, which makes easier to build logz
      var histo = this.GetObject(), nlevels = JSROOT.gStyle.fNumberContours,
          zmin = this.minbin, zmax = this.maxbin, zminpos = this.minposbin;
      if (zmin === zmax) { zmin = this.gminbin; zmax = this.gmaxbin; zminpos = this.gminposbin }
      if (histo.fContour) nlevels = histo.fContour.length;
      if ((this.options.minimum !== -1111) && (this.options.maximum != -1111)) {
         zmin = this.options.minimum;
         zmax = this.options.maximum;
      }
      if (this.zoom_zmin != this.zoom_zmax) {
         zmin = this.zoom_zmin;
         zmax = this.zoom_zmax;
      }

      if (histo.fContour && (histo.fContour.length>1) && histo.TestBit(JSROOT.TH1StatusBits.kUserContour)) {
         this.fContour = JSROOT.clone(histo.fContour);
         this.fCustomContour = true;
         this.colzmin = zmin;
         this.colzmax = zmax;
         if (zmax > this.fContour[this.fContour.length-1]) this.fContour.push(zmax);
         if (this.Dimension()<3) {
            this.zmin = this.colzmin;
            this.zmax = this.colzmax;
         }
         return this.fContour;
      }

      this.fCustomContour = false;

      return this.CreateContour(nlevels, zmin, zmax, zminpos);
   }

   /// return index from contours array, which corresponds to the content value **zc**
   THistPainter.prototype.getContourIndex = function(zc) {

      var cntr = this.GetContour();

      if (this.fCustomContour) {
         var l = 0, r = cntr.length-1, mid;
         if (zc < cntr[0]) return -1;
         if (zc >= cntr[r]) return r;
         while (l < r-1) {
            mid = Math.round((l+r)/2);
            if (cntr[mid] > zc) r = mid; else l = mid;
         }
         return l;
      }

      // bins less than zmin not drawn
      if (zc < this.colzmin) return (this.options.Color === 11) ? 0 : -1;

      // if bin content exactly zmin, draw it when col0 specified or when content is positive
      if (zc===this.colzmin) return ((this.colzmin != 0) || (this.options.Color === 11) || this.IsTH2Poly()) ? 0 : -1;

      return Math.floor(0.01+(zc-this.colzmin)*(cntr.length-1)/(this.colzmax-this.colzmin));
   }

   /// return color from the palette, which corresponds given controur value
   /// optionally one can return color index of the palette
   THistPainter.prototype.getContourColor = function(zc, asindx) {
      var zindx = this.getContourIndex(zc);
      if (zindx < 0) return null;

      var cntr = this.GetContour(),
          palette = this.GetPalette(),
          indx = palette.calcColorIndex(zindx, cntr.length);

      return asindx ? indx : palette.getColor(indx);
   }

   THistPainter.prototype.GetPalette = function(force) {
      if (!this.fPalette || force) {
         var pp = this.options.Palette ? null : this.pad_painter();
         this.fPalette = (pp && pp.CanvasPalette) ? pp.CanvasPalette : JSROOT.Painter.GetColorPalette(this.options.Palette);
      }
      return this.fPalette;
   }

   THistPainter.prototype.FillPaletteMenu = function(menu) {

      var curr = this.options.Palette;
      if ((curr===null) || (curr===0)) curr = JSROOT.gStyle.Palette;

      function change(arg) {
         this.options.Palette = parseInt(arg);
         this.GetPalette(true);
         this.Redraw(); // redraw histogram
      };

      function add(id, name, more) {
         menu.addchk((id===curr) || more, '<nobr>' + name + '</nobr>', id, change);
      };

      menu.add("sub:Palette");

      add(50, "ROOT 5", (curr>=10) && (curr<51));
      add(51, "Deep Sea");
      add(52, "Grayscale", (curr>0) && (curr<10));
      add(53, "Dark body radiator");
      add(54, "Two-color hue");
      add(55, "Rainbow");
      add(56, "Inverted dark body radiator");
      add(57, "Bird", (curr>112));
      add(58, "Cubehelix");
      add(59, "Green Red Violet");
      add(60, "Blue Red Yellow");
      add(61, "Ocean");
      add(62, "Color Printable On Grey");
      add(63, "Alpine");
      add(64, "Aquamarine");
      add(65, "Army");
      add(66, "Atlantic");

      menu.add("endsub:");
   }

   THistPainter.prototype.DrawColorPalette = function(enabled, postpone_draw, can_move) {
      // only when create new palette, one could change frame size

      if (!this.is_main_painter()) return null;

      var pal = this.FindFunction('TPaletteAxis'),
          pal_painter = this.FindPainterFor(pal);

      if (this._can_move_colz) { can_move = true; delete this._can_move_colz; }

      if (!pal_painter && !pal) {
         pal_painter = this.FindPainterFor(undefined, undefined, "TPaletteAxis");
         if (pal_painter) {
            pal = pal_painter.GetObject();
            // add to list of functions
            this.AddFunction(pal, true);
         }
      }

      if (!enabled) {
         if (pal_painter) {
            pal_painter.Enabled = false;
            pal_painter.RemoveDrawG(); // completely remove drawing without need to redraw complete pad
         }

         return null;
      }

      if (!pal) {
         pal = JSROOT.Create('TPave');

         JSROOT.extend(pal, { _typename: "TPaletteAxis", fName: "TPave", fH: null, fAxis: JSROOT.Create('TGaxis'),
                               fX1NDC: 0.91, fX2NDC: 0.95, fY1NDC: 0.1, fY2NDC: 0.9, fInit: 1 } );

         JSROOT.extend(pal.fAxis, { fTitle: this.GetObject().fZaxis.fTitle, fChopt: "+",
                                    fLineColor: 1, fLineSyle: 1, fLineWidth: 1,
                                    fTextAngle: 0, fTextSize: 0.04, fTextAlign: 11, fTextColor: 1, fTextFont: 42 });

         // place colz in the beginning, that stat box is always drawn on the top
         this.AddFunction(pal, true);

         can_move = true;
      } else if (pal.fAxis) {
         // check some default values of TGaxis object
         if (!pal.fAxis.fChopt) pal.fAxis.fChopt = "+";
         if (!pal.fAxis.fNdiv) pal.fAxis.fNdiv = 12;
         if (!pal.fAxis.fLabelOffset) pal.fAxis.fLabelOffset = 0.005;
      }

      var frame_painter = this.frame_painter();

      // keep palette width
      if (can_move) {
         pal.fX2NDC = frame_painter.fX2NDC + 0.01 + (pal.fX2NDC - pal.fX1NDC);
         pal.fX1NDC = frame_painter.fX2NDC + 0.01;
         pal.fY1NDC = frame_painter.fY1NDC;
         pal.fY2NDC = frame_painter.fY2NDC;
      }

      var arg = "";
      if (postpone_draw) arg+=";postpone";
      if (can_move && !this.do_redraw_palette) arg+=";canmove"

      if (pal_painter === null) {
         // when histogram drawn on sub pad, let draw new axis object on the same pad
         var prev = this.CurrentPadName(this.pad_name);
         // CAUTION!!! This is very special place where return value of JSROOT.draw is allowed
         // while palette drawing is in same script. Normally callback should be used
         pal_painter = JSROOT.draw(this.divid, pal, arg);
         this.CurrentPadName(prev);
      } else {
         pal_painter.Enabled = true;
         pal_painter.DrawPave(arg);
      }

      // make dummy redraw, palette will be updated only from histogram painter
      pal_painter.Redraw = function() {};

      if ((pal.fX1NDC-0.005 < frame_painter.fX2NDC) && !this.do_redraw_palette && can_move) {

         this.do_redraw_palette = true;

         frame_painter.fX2NDC = pal.fX1NDC - 0.01;
         frame_painter.Redraw();
         // here we should redraw main object
         if (!postpone_draw) this.Redraw();

         delete this.do_redraw_palette;
      }

      return pal_painter;
   }

   THistPainter.prototype.ToggleColz = function() {
      if (this.options.Zscale > 0) {
         this.options.Zscale = 0;
      } else {
         this.options.Zscale = 1;
      }

      this.DrawColorPalette(this.options.Zscale > 0, false, true);
   }

   THistPainter.prototype.PrepareColorDraw = function(args) {

      if (!args) args = { rounding: true, extra: 0, middle: 0 };

      if (args.extra === undefined) args.extra = 0;
      if (args.middle === undefined) args.middle = 0;

      var histo = this.GetObject(),
          pad = this.root_pad(),
          pmain = this.main_painter(),
          hdim = this.Dimension(),
          i, j, x, y, binz, binarea,
          res = {
             i1: this.GetSelectIndex("x", "left", 0 - args.extra),
             i2: this.GetSelectIndex("x", "right", 1 + args.extra),
             j1: (hdim===1) ? 0 : this.GetSelectIndex("y", "left", 0 - args.extra),
             j2: (hdim===1) ? 1 : this.GetSelectIndex("y", "right", 1 + args.extra),
             min: 0, max: 0, sumz: 0
          };
      res.grx = new Float32Array(res.i2+1);
      res.gry = new Float32Array(res.j2+1);
      
      if (args.original) {
         res.original = true;
         res.origx = new Float32Array(res.i2+1);
         res.origy = new Float32Array(res.j2+1);
      }

      if (args.pixel_density) args.rounding = true;

       // calculate graphical coordinates in advance
      for (i = res.i1; i <= res.i2; ++i) {
         x = this.GetBinX(i + args.middle);
         if (pmain.logx && (x <= 0)) { res.i1 = i+1; continue; }
         if (res.origx) res.origx[i] = x;
         res.grx[i] = pmain.grx(x);
         if (args.rounding) res.grx[i] = Math.round(res.grx[i]);

         if (args.use3d) {
            if (res.grx[i] < -pmain.size_xy3d) { res.i1 = i; res.grx[i] = -pmain.size_xy3d; }
            if (res.grx[i] > pmain.size_xy3d) { res.i2 = i; res.grx[i] = pmain.size_xy3d; }
         }
      }

      if (hdim===1) {
         res.gry[0] = pmain.gry(0);
         res.gry[1] = pmain.gry(1);
      } else
      for (j = res.j1; j <= res.j2; ++j) {
         y = this.GetBinY(j + args.middle);
         if (pmain.logy && (y <= 0)) { res.j1 = j+1; continue; }
         if (res.origy) res.origy[j] = y;
         res.gry[j] = pmain.gry(y);
         if (args.rounding) res.gry[j] = Math.round(res.gry[j]);

         if (args.use3d) {
            if (res.gry[j] < -pmain.size_xy3d) { res.j1 = j; res.gry[j] = -pmain.size_xy3d; }
            if (res.gry[j] > pmain.size_xy3d) { res.j2 = j; res.gry[j] = pmain.size_xy3d; }
         }
      }

      //  find min/max values in selected range

      binz = histo.getBinContent(res.i1 + 1, res.j1 + 1);
      this.maxbin = this.minbin = this.minposbin = null;

      for (i = res.i1; i < res.i2; ++i) {
         for (j = res.j1; j < res.j2; ++j) {
            binz = histo.getBinContent(i + 1, j + 1);
            res.sumz += binz;
            if (args.pixel_density) {
               binarea = (res.grx[i+1]-res.grx[i])*(res.gry[j]-res.gry[j+1]);
               if (binarea <= 0) continue;
               res.max = Math.max(res.max, binz);
               if ((binz>0) && ((binz<res.min) || (res.min===0))) res.min = binz;
               binz = binz/binarea;
            }
            if (this.maxbin===null) {
               this.maxbin = this.minbin = binz;
            } else {
               this.maxbin = Math.max(this.maxbin, binz);
               this.minbin = Math.min(this.minbin, binz);
            }
            if (binz > 0)
               if ((this.minposbin===null) || (binz<this.minposbin)) this.minposbin = binz;
         }
      }

      // force recalculation of z levels
      this.fContour = null;
      this.fCustomContour = false;

      return res;
   }

   // ======= TH1 painter================================================

   function TH1Painter(histo) {
      THistPainter.call(this, histo);
   }

   TH1Painter.prototype = Object.create(THistPainter.prototype);

   TH1Painter.prototype.ConvertTH1K = function() {
      var histo = this.GetObject();

      if (histo.fReady) return;

      var arr = histo.fArray; // array of values
      histo.fNcells = histo.fXaxis.fNbins + 2;
      histo.fArray = new Float64Array(histo.fNcells);
      for (var n=0;n<histo.fNcells;++n) histo.fArray[n] = 0;
      for (var n=0;n<histo.fNIn;++n) histo.Fill(arr[n]);
      histo.fReady = true;
   }

   TH1Painter.prototype.ScanContent = function(when_axis_changed) {
      // if when_axis_changed === true specified, content will be scanned after axis zoom changed

      var histo = this.GetHisto();
      if (!histo) return;
      
      if (!this.nbinsx && when_axis_changed) when_axis_changed = false;

      if (!when_axis_changed) {
         this.nbinsx = histo.fAxes._0.fNBins - 2;
         this.nbinsy = 0;
         this.CreateAxisFuncs(false);
      }

      var left = this.GetSelectIndex("x", "left"),
          right = this.GetSelectIndex("x", "right");

      if (when_axis_changed) {
         if ((left === this.scan_xleft) && (right === this.scan_xright)) return;
      }

      this.scan_xleft = left;
      this.scan_xright = right;

      var hmin = 0, hmin_nz = 0, hmax = 0, hsum = 0, first = true, value, err;

      for (var i = 0; i < this.nbinsx; ++i) {
         value = histo.getBinContent(i+1);
         hsum += value;

         if ((i<left) || (i>=right)) continue;

         if (value > 0)
            if ((hmin_nz == 0) || (value<hmin_nz)) hmin_nz = value;
         if (first) {
            hmin = hmax = value;
            first = false;;
         } 

         err =  0;

         hmin = Math.min(hmin, value - err);
         hmax = Math.max(hmax, value + err);
      }

      // account overflow/underflow bins
      hsum += histo.fStatistics.fBinContent[0] + histo.fStatistics.fBinContent[this.nbinsx + 1];

      this.stat_entries = hsum;

      this.hmin = hmin;
      this.hmax = hmax;

      this.ymin_nz = hmin_nz; // value can be used to show optimal log scale

      if ((this.nbinsx == 0) || ((Math.abs(hmin) < 1e-300 && Math.abs(hmax) < 1e-300))) {
         this.draw_content = false;
      } else {
         this.draw_content = true;
      }

      if (this.draw_content) {
         if (hmin >= hmax) {
            if (hmin == 0) { this.ymin = 0; this.ymax = 1; } else
               if (hmin < 0) { this.ymin = 2 * hmin; this.ymax = 0; }
               else { this.ymin = 0; this.ymax = hmin * 2; }
         } else {
            var dy = (hmax - hmin) * 0.05;
            this.ymin = hmin - dy;
            if ((this.ymin < 0) && (hmin >= 0)) this.ymin = 0;
            this.ymax = hmax + dy;
         }
      }
      
      console.log("this.x", this.xmin, this.xmax, this.ymin, this.ymax)
   }

   TH1Painter.prototype.CountStat = function(cond) {
      var profile = this.IsTProfile(),
          left = this.GetSelectIndex("x", "left"),
          right = this.GetSelectIndex("x", "right"),
          stat_sumw = 0, stat_sumwx = 0, stat_sumwx2 = 0, stat_sumwy = 0, stat_sumwy2 = 0,
          i, xx = 0, w = 0, xmax = null, wmax = null,
          res = { meanx: 0, meany: 0, rmsx: 0, rmsy: 0, integral: 0, entries: this.stat_entries, xmax:0, wmax:0 };

      for (i = left; i < right; ++i) {
         xx = this.GetBinX(i+0.5);

         if (cond && !cond(xx)) continue;

         if (profile) {
            w = this.histo.fBinEntries[i + 1];
            stat_sumwy += this.histo.fArray[i + 1];
            stat_sumwy2 += this.histo.fSumw2[i + 1];
         } else {
            w = this.histo.getBinContent(i + 1);
         }

         if ((xmax===null) || (w>wmax)) { xmax = xx; wmax = w; }

         stat_sumw += w;
         stat_sumwx += w * xx;
         stat_sumwx2 += w * xx * xx;
      }

      // when no range selection done, use original statistic from histogram
      if (!this.IsAxisZoomed("x") && (this.histo.fTsumw>0)) {
         stat_sumw = this.histo.fTsumw;
         stat_sumwx = this.histo.fTsumwx;
         stat_sumwx2 = this.histo.fTsumwx2;
      }

      res.integral = stat_sumw;

      if (stat_sumw > 0) {
         res.meanx = stat_sumwx / stat_sumw;
         res.meany = stat_sumwy / stat_sumw;
         res.rmsx = Math.sqrt(Math.abs(stat_sumwx2 / stat_sumw - res.meanx * res.meanx));
         res.rmsy = Math.sqrt(Math.abs(stat_sumwy2 / stat_sumw - res.meany * res.meany));
      }

      if (xmax!==null) {
         res.xmax = xmax;
         res.wmax = wmax;
      }

      return res;
   }

   TH1Painter.prototype.FillStatistic = function(stat, dostat, dofit) {

      // no need to refill statistic if histogram is dummy
      if (this.IgnoreStatsFill()) return false;

      var data = this.CountStat(),
          print_name = dostat % 10,
          print_entries = Math.floor(dostat / 10) % 10,
          print_mean = Math.floor(dostat / 100) % 10,
          print_rms = Math.floor(dostat / 1000) % 10,
          print_under = Math.floor(dostat / 10000) % 10,
          print_over = Math.floor(dostat / 100000) % 10,
          print_integral = Math.floor(dostat / 1000000) % 10,
          print_skew = Math.floor(dostat / 10000000) % 10,
          print_kurt = Math.floor(dostat / 100000000) % 10;

      // make empty at the beginning
      stat.ClearPave();

      if (print_name > 0)
         stat.AddText(this.histo.fName);

      if (this.IsTProfile()) {

         if (print_entries > 0)
            stat.AddText("Entries = " + stat.Format(data.entries,"entries"));

         if (print_mean > 0) {
            stat.AddText("Mean = " + stat.Format(data.meanx));
            stat.AddText("Mean y = " + stat.Format(data.meany));
         }

         if (print_rms > 0) {
            stat.AddText("Std Dev = " + stat.Format(data.rmsx));
            stat.AddText("Std Dev y = " + stat.Format(data.rmsy));
         }

      } else {

         if (print_entries > 0)
            stat.AddText("Entries = " + stat.Format(data.entries,"entries"));

         if (print_mean > 0)
            stat.AddText("Mean = " + stat.Format(data.meanx));

         if (print_rms > 0)
            stat.AddText("Std Dev = " + stat.Format(data.rmsx));

         if (print_under > 0)
            stat.AddText("Underflow = " + stat.Format((this.histo.fArray.length > 0) ? this.histo.fArray[0] : 0,"entries"));

         if (print_over > 0)
            stat.AddText("Overflow = " + stat.Format((this.histo.fArray.length > 0) ? this.histo.fArray[this.histo.fArray.length - 1] : 0,"entries"));

         if (print_integral > 0)
            stat.AddText("Integral = " + stat.Format(data.integral,"entries"));

         if (print_skew > 0)
            stat.AddText("Skew = <not avail>");

         if (print_kurt > 0)
            stat.AddText("Kurt = <not avail>");
      }

      if (dofit) stat.FillFunctionStat(this.FindFunction('TF1'), dofit);

      return true;
   }

   TH1Painter.prototype.DrawBars = function(width, height) {

      this.CreateG(true);

      var left = this.GetSelectIndex("x", "left", -1),
          right = this.GetSelectIndex("x", "right", 1),
          pmain = this.main_painter(),
          pad = this.root_pad(),
          pthis = this,
          i, x1, x2, grx1, grx2, y, gry1, gry2, w,
          bars = "", barsl = "", barsr = "",
          side = (this.options.Bar > 10) ? this.options.Bar % 10 : 0;

      if (side>4) side = 4;
      gry2 = pmain.swap_xy ? 0 : height;
      if ((this.options.BaseLine !== false) && !isNaN(this.options.BaseLine))
         if (this.options.BaseLine >= pmain.scale_ymin)
            gry2 = Math.round(pmain.gry(this.options.BaseLine));

      for (i = left; i < right; ++i) {
         x1 = this.GetBinX(i);
         x2 = this.GetBinX(i+1);

         if (pmain.logx && (x2 <= 0)) continue;

         grx1 = Math.round(pmain.grx(x1));
         grx2 = Math.round(pmain.grx(x2));

         y = this.histo.getBinContent(i+1);
         if (pmain.logy && (y < pmain.scale_ymin)) continue;
         gry1 = Math.round(pmain.gry(y));

         w = grx2 - grx1;
         grx1 += Math.round(this.histo.fBarOffset/1000*w);
         w = Math.round(this.histo.fBarWidth/1000*w);

         if (pmain.swap_xy)
            bars += "M"+gry2+","+grx1 + "h"+(gry1-gry2) + "v"+w + "h"+(gry2-gry1) + "z";
         else
            bars += "M"+grx1+","+gry1 + "h"+w + "v"+(gry2-gry1) + "h"+(-w)+ "z";

         if (side > 0) {
            grx2 = grx1 + w;
            w = Math.round(w * side / 10);
            if (pmain.swap_xy) {
               barsl += "M"+gry2+","+grx1 + "h"+(gry1-gry2) + "v" + w + "h"+(gry2-gry1) + "z";
               barsr += "M"+gry2+","+grx2 + "h"+(gry1-gry2) + "v" + (-w) + "h"+(gry2-gry1) + "z";
            } else {
               barsl += "M"+grx1+","+gry1 + "h"+w + "v"+(gry2-gry1) + "h"+(-w)+ "z";
               barsr += "M"+grx2+","+gry1 + "h"+(-w) + "v"+(gry2-gry1) + "h"+w + "z";
            }
         }
      }

      if (bars.length > 0)
         this.draw_g.append("svg:path")
                    .attr("d", bars)
                    .call(this.fillatt.func);

      if (barsl.length > 0)
         this.draw_g.append("svg:path")
               .attr("d", barsl)
               .call(this.fillatt.func)
               .style("fill", d3.rgb(this.fillatt.color).brighter(0.5).toString());

      if (barsr.length > 0)
         this.draw_g.append("svg:path")
               .attr("d", barsr)
               .call(this.fillatt.func)
               .style("fill", d3.rgb(this.fillatt.color).darker(0.5).toString());
   }

   TH1Painter.prototype.DrawFilledErrors = function(width, height) {
      this.CreateG(true);

      var left = this.GetSelectIndex("x", "left", -1),
          right = this.GetSelectIndex("x", "right", 1),
          pmain = this.main_painter(),
          i, x, grx, y, yerr, gry1, gry2,
          bins1 = [], bins2 = [];

      for (i = left; i < right; ++i) {
         x = this.GetBinX(i+0.5);
         if (pmain.logx && (x <= 0)) continue;
         grx = Math.round(pmain.grx(x));

         y = this.histo.getBinContent(i+1);
         yerr = this.histo.getBinError(i+1);
         if (pmain.logy && (y-yerr < pmain.scale_ymin)) continue;

         gry1 = Math.round(pmain.gry(y + yerr));
         gry2 = Math.round(pmain.gry(y - yerr));

         bins1.push({grx:grx, gry: gry1});
         bins2.unshift({grx:grx, gry: gry2});
      }

      var kind = (this.options.Error == 14) ? "bezier" : "line";

      var path1 = JSROOT.Painter.BuildSvgPath(kind, bins1),
          path2 = JSROOT.Painter.BuildSvgPath("L"+kind, bins2);

      this.draw_g.append("svg:path")
                 .attr("d", path1.path + path2.path + "Z")
                 .style("stroke", "none")
                 .call(this.fillatt.func);
   }

   TH1Painter.prototype.DrawBins = function() {
      // new method, create svg:path expression ourself directly from histogram
      // all points will be used, compress expression when too large

      this.CheckHistDrawAttributes();

      var width = this.frame_width(), height = this.frame_height();

      if (!this.draw_content || (width<=0) || (height<=0))
         return this.RemoveDrawG();
      
      var options = { Hist: 1, Bar: 0, Error: 0, errorX: 0, Zero: 0, Mark: 0, Line: 0, Text: 0 };

      if (options.Bar > 0)
         return this.DrawBars(width, height);

      if ((options.Error == 13) || (options.Error == 14))
         return this.DrawFilledErrors(width, height);

      this.CreateG(true);

      var left = this.GetSelectIndex("x", "left", -1),
          right = this.GetSelectIndex("x", "right", 2),
          pmain = this.frame_painter(),
          pthis = this, histo = this.GetHisto(),
          res = "", lastbin = false,
          startx, currx, curry, x, grx, y, gry, curry_min, curry_max, prevy, prevx, i, besti,
          exclude_zero = !options.Zero,
          show_errors = (options.Error > 0),
          show_markers = (options.Mark > 0),
          show_line = (options.Line > 0),
          show_text = (options.Text > 0),
          path_fill = null, path_err = null, path_marker = null, path_line = null,
          endx = "", endy = "", dend = 0, my, yerr1, yerr2, bincont, binerr, mx1, mx2, midx,
          mpath = "", text_col, text_angle, text_size;

      //if (show_errors && !show_markers && (this.histo.fMarkerStyle > 1))
      //   show_markers = true;

      if (options.Error == 12) {
         if (this.fillatt.color=='none') show_markers = true;
                                    else path_fill = "";
      } else
      if (options.Error > 0) path_err = "";

      if (show_line) path_line = "";

      if (show_markers) {
         // draw markers also when e2 option was specified
         if (!this.markeratt)
            this.markeratt = new JSROOT.TAttMarkerHandler(histo, options.Mark - 20);
         if (this.markeratt.size > 0) {
            // simply use relative move from point, can optimize in the future
            path_marker = "";
            this.markeratt.reset_pos();
         } else {
            show_markers = false;
         }
      }

      if (show_text) {
         text_col = this.get_color(histo.fMarkerColor);
         text_angle = (options.Text>1000) ? -1*(options.Text % 1000) : 0;
         text_size = 20;

         if ((histo.fMarkerSize!==1) && text_angle)
            text_size = 0.02*height*this.histo.fMarkerSize;

         if (!text_angle && (options.Text<1000)) {
             var space = width / (right - left + 1);
             if (space < 3 * text_size) {
                text_angle = 270;
                text_size = Math.round(space*0.7);
             }
         }

         this.StartTextDrawing(42, text_size, this.draw_g, text_size);
      }

      // if there are too many points, exclude many vertical drawings at the same X position
      // instead define min and max value and made min-max drawing
      var use_minmax = ((right-left) > 3*width);

      if (options.Error == 11) {
         var lw = this.lineatt.width + JSROOT.gStyle.fEndErrorSize;
         endx = "m0," + lw + "v-" + 2*lw + "m0," + lw;
         endy = "m" + lw + ",0h-" + 2*lw + "m" + lw + ",0";
         dend = Math.floor((this.lineatt.width-1)/2);
      }

      var draw_markers = show_errors || show_markers;

      if (draw_markers || show_text || show_line) use_minmax = true;

      for (i = left; i <= right; ++i) {

         x = this.GetBinX(i);

         if (pmain.logx && (x <= 0)) continue;

         grx = Math.round(pmain.grx(x));

         lastbin = (i === right);

         if (lastbin && (left<right)) {
            gry = curry;
         } else {
            y = histo.getBinContent(i+1);
            gry = Math.round(pmain.gry(y));
         }

         if (res.length === 0) {
            besti = i;
            prevx = startx = currx = grx;
            prevy = curry_min = curry_max = curry = gry;
            res = "M"+currx+","+curry;
         } else
         if (use_minmax) {
            if ((grx === currx) && !lastbin) {
               if (gry < curry_min) besti = i;
               curry_min = Math.min(curry_min, gry);
               curry_max = Math.max(curry_max, gry);
               curry = gry;
            } else {

               if (draw_markers || show_text || show_line) {
                  bincont = histo.getBinContent(besti+1);
                  if (!exclude_zero || (bincont!==0)) {
                     mx1 = Math.round(pmain.grx(this.GetBinX(besti)));
                     mx2 = Math.round(pmain.grx(this.GetBinX(besti+1)));
                     midx = Math.round((mx1+mx2)/2);
                     my = Math.round(pmain.gry(bincont));
                     yerr1 = yerr2 = 20;
                     if (show_errors) {
                        binerr = histo.getBinError(besti+1);
                        yerr1 = Math.round(my - pmain.gry(bincont + binerr)); // up
                        yerr2 = Math.round(pmain.gry(bincont - binerr) - my); // down
                     }

                     if (show_text) {
                        var cont = bincont;
                        if ((options.Text>=2000) && (options.Text < 3000) && this.IsTProfile() && histo.getBinEntries)
                           cont = histo.getBinEntries(besti+1);

                        var posx = Math.round(mx1 + (mx2-mx1)*0.1),
                            posy = Math.round(my-2-text_size),
                            sizex = Math.round((mx2-mx1)*0.8),
                            sizey = text_size,
                            lbl = (cont === Math.round(cont)) ? cont.toString() : JSROOT.FFormat(cont, JSROOT.gStyle.fPaintTextFormat),
                            talign = 22;

                        if (text_angle) {
                           posx = midx;
                           posy = Math.round(my - 2 - text_size/5);
                           sizex = 0;
                           sizey = 0;
                           talign = 12;
                        }

                        if (cont!==0)
                           this.DrawText({ align: talign, x: posx, y: posy, width: sizex, height: sizey, rotate: text_angle, text: lbl, color: text_col, latex: 0 });
                     }

                     if (show_line && (path_line !== null))
                        path_line += ((path_line.length===0) ? "M" : "L") + midx + "," + my;

                     if (draw_markers) {
                        if ((my >= -yerr1) && (my <= height + yerr2)) {
                           if (path_fill !== null)
                              path_fill += "M" + mx1 +","+(my-yerr1) +
                                           "h" + (mx2-mx1) + "v" + (yerr1+yerr2+1) + "h-" + (mx2-mx1) + "z";
                           if (path_marker !== null)
                              path_marker += this.markeratt.create(midx, my);
                           if (path_err !== null) {
                              if (options.errorX > 0) {
                                 var mmx1 = Math.round(midx - (mx2-mx1)*options.errorX),
                                     mmx2 = Math.round(midx + (mx2-mx1)*options.errorX);
                                 path_err += "M" + (mmx1+dend) +","+ my + endx + "h" + (mmx2-mmx1-2*dend) + endx;
                              }
                              path_err += "M" + midx +"," + (my-yerr1+dend) + endy + "v" + (yerr1+yerr2-2*dend) + endy;
                           }
                        }
                     }
                  }
               }

               // when several points as same X differs, need complete logic
               if (!draw_markers && ((curry_min !== curry_max) || (prevy !== curry_min))) {

                  if (prevx !== currx)
                     res += "h"+(currx-prevx);

                  if (curry === curry_min) {
                     if (curry_max !== prevy)
                        res += "v" + (curry_max - prevy);
                     if (curry_min !== curry_max)
                        res += "v" + (curry_min - curry_max);
                  } else {
                     if (curry_min !== prevy)
                        res += "v" + (curry_min - prevy);
                     if (curry_max !== curry_min)
                        res += "v" + (curry_max - curry_min);
                     if (curry !== curry_max)
                       res += "v" + (curry - curry_max);
                  }

                  prevx = currx;
                  prevy = curry;
               }

               if (lastbin && (prevx !== grx))
                  res += "h"+(grx-prevx);

               besti = i;
               curry_min = curry_max = curry = gry;
               currx = grx;
            }
         } else
         if ((gry !== curry) || lastbin) {
            if (grx !== currx) res += "h"+(grx-currx);
            if (gry !== curry) res += "v"+(gry-curry);
            curry = gry;
            currx = grx;
         }
      }

      var close_path = "";

      if (!this.fillatt.empty()) {
         var h0 = (height+3);
         if ((this.hmin>=0) && (pmain.gry(0) < height)) h0 = Math.round(pmain.gry(0));
         close_path = "L"+currx+","+h0 + "L"+startx+","+h0 + "Z";
         if (res.length>0) res += close_path;
      }

      if (draw_markers || show_line) {
         if ((path_fill !== null) && (path_fill.length > 0))
            this.draw_g.append("svg:path")
                       .attr("d", path_fill)
                       .call(this.fillatt.func);

         if ((path_err !== null) && (path_err.length > 0))
               this.draw_g.append("svg:path")
                   .attr("d", path_err)
                   .call(this.lineatt.func);

         if ((path_line !== null) && (path_line.length > 0)) {
            if (!this.fillatt.empty())
               this.draw_g.append("svg:path")
                     .attr("d", options.Line===2 ? (path_line + close_path) : res)
                     .attr("stroke", "none")
                     .call(this.fillatt.func);

            this.draw_g.append("svg:path")
                   .attr("d", path_line)
                   .attr("fill", "none")
                   .call(this.lineatt.func);
         }

         if ((path_marker !== null) && (path_marker.length > 0))
            this.draw_g.append("svg:path")
                .attr("d", path_marker)
                .call(this.markeratt.func);

      } else
      if (res && options.Hist) {
         this.draw_g.append("svg:path")
                    .attr("d", res)
                    .style("stroke-linejoin","miter")
                    .call(this.lineatt.func)
                    .call(this.fillatt.func);
      }

      if (show_text)
         this.FinishTextDrawing(this.draw_g);

   }

   TH1Painter.prototype.GetBinTips = function(bin) {
      var tips = [],
          name = this.GetTipName(),
          pmain = this.main_painter(),
          histo = this.GetObject(),
          x1 = this.GetBinX(bin),
          x2 = this.GetBinX(bin+1),
          cont = histo.getBinContent(bin+1);

      if (name.length>0) tips.push(name);

      if ((this.options.Error > 0) || (this.options.Mark > 0)) {
         tips.push("x = " + pmain.AxisAsText("x", (x1+x2)/2));
         tips.push("y = " + pmain.AxisAsText("y", cont));
         if (this.options.Error > 0) {
            tips.push("error x = " + ((x2 - x1) / 2).toPrecision(4));
            tips.push("error y = " + this.histo.getBinError(bin + 1).toPrecision(4));
         }
      } else {
         tips.push("bin = " + (bin+1));

         if (pmain.x_kind === 'labels')
            tips.push("x = " + pmain.AxisAsText("x", x1));
         else
         if (pmain.x_kind === 'time')
            tips.push("x = " + pmain.AxisAsText("x", (x1+x2)/2));
         else
            tips.push("x = [" + pmain.AxisAsText("x", x1) + ", " + pmain.AxisAsText("x", x2) + ")");

         if (histo['$baseh']) cont -= histo['$baseh'].getBinContent(bin+1);

         if (cont === Math.round(cont))
            tips.push("entries = " + cont);
         else
            tips.push("entries = " + JSROOT.FFormat(cont, JSROOT.gStyle.fStatFormat));
      }

      return tips;
   }

   TH1Painter.prototype.ProcessTooltip = function(pnt) {
      if ((pnt === null) || !this.draw_content || (this.options.Lego > 0) || (this.options.Surf > 0)) {
         if (this.draw_g !== null)
            this.draw_g.select(".tooltip_bin").remove();
         this.ProvideUserTooltip(null);
         return null;
      }

      var width = this.frame_width(),
          height = this.frame_height(),
          pmain = this.main_painter(),
          pad = this.root_pad(),
          painter = this,
          findbin = null, show_rect = true,
          grx1, midx, grx2, gry1, midy, gry2, gapx = 2,
          left = this.GetSelectIndex("x", "left", -1),
          right = this.GetSelectIndex("x", "right", 2),
          l = left, r = right;

      function GetBinGrX(i) {
         var xx = painter.GetBinX(i);
         return (pmain.logx && (xx<=0)) ? null : pmain.grx(xx);
      }

      function GetBinGrY(i) {
         var yy = painter.histo.getBinContent(i + 1);
         if (pmain.logy && (yy < painter.scale_ymin))
            return pmain.swap_xy ? -1000 : 10*height;
         return Math.round(pmain.gry(yy));
      }

      var pnt_x = pmain.swap_xy ? pnt.y : pnt.x,
          pnt_y = pmain.swap_xy ? pnt.x : pnt.y;

      while (l < r-1) {
         var m = Math.round((l+r)*0.5);

         var xx = GetBinGrX(m);
         if ((xx === null) || (xx < pnt_x - 0.5)) {
            if (pmain.swap_xy) r = m; else l = m;
         } else
         if (xx > pnt_x + 0.5) {
            if (pmain.swap_xy) l = m; else r = m;
         } else { l++; r--; }
      }

      findbin = r = l;
      grx1 = GetBinGrX(findbin);

      if (pmain.swap_xy) {
         while ((l>left) && (GetBinGrX(l-1) < grx1 + 2)) --l;
         while ((r<right) && (GetBinGrX(r+1) > grx1 - 2)) ++r;
      } else {
         while ((l>left) && (GetBinGrX(l-1) > grx1 - 2)) --l;
         while ((r<right) && (GetBinGrX(r+1) < grx1 + 2)) ++r;
      }

      if (l < r) {
         // many points can be assigned with the same cursor position
         // first try point around mouse y
         var best = height;
         for (var m=l;m<=r;m++) {
            var dist = Math.abs(GetBinGrY(m) - pnt_y);
            if (dist < best) { best = dist; findbin = m; }
         }

         // if best distance still too far from mouse position, just take from between
         if (best > height/10)
            findbin = Math.round(l + (r-l) / height * pnt_y);

         grx1 = GetBinGrX(findbin);
      }

      grx1 = Math.round(grx1);
      grx2 = Math.round(GetBinGrX(findbin+1));

      if (this.options.Bar > 0) {
         var w = grx2 - grx1;
         grx1 += Math.round(this.histo.fBarOffset/1000*w);
         grx2 = grx1 + Math.round(this.histo.fBarWidth/1000*w);
      }

      if (grx1 > grx2) { var d = grx1; grx1 = grx2; grx2 = d; }

      midx = Math.round((grx1+grx2)/2);

      midy = gry1 = gry2 = GetBinGrY(findbin);

      if (this.options.Bar > 0) {
         show_rect = true;

         gapx = 0;

         gry1 = Math.round(pmain.gry(((this.options.BaseLine!==false) && (this.options.BaseLine > pmain.scale_ymin)) ? this.options.BaseLine : pmain.scale_ymin));

         if (gry1 > gry2) { var d = gry1; gry1 = gry2; gry2 = d; }

         if (!pnt.touch && (pnt.nproc === 1))
            if ((pnt_y<gry1) || (pnt_y>gry2)) findbin = null;
      } else
      if ((this.options.Error > 0) || (this.options.Mark > 0) || (this.options.Line > 0))  {

         show_rect = true;

         var msize = 3;
         if (this.markeratt) msize = Math.max(msize, this.markeratt.GetFullSize());

         if (this.options.Error > 0) {
            var cont = this.histo.getBinContent(findbin+1),
                binerr = this.histo.getBinError(findbin+1);

            gry1 = Math.round(pmain.gry(cont + binerr)); // up
            gry2 = Math.round(pmain.gry(cont - binerr)); // down

            if ((cont==0) && this.IsTProfile()) findbin = null;

            var dx = (grx2-grx1)*this.options.errorX;
            grx1 = Math.round(midx - dx);
            grx2 = Math.round(midx + dx);
         }

         // show at least 6 pixels as tooltip rect
         if (grx2 - grx1 < 2*msize) { grx1 = midx-msize; grx2 = midx+msize; }

         gry1 = Math.min(gry1, midy - msize);
         gry2 = Math.max(gry2, midy + msize);

         if (!pnt.touch && (pnt.nproc === 1))
            if ((pnt_y<gry1) || (pnt_y>gry2)) findbin = null;

      } else {

         // if histogram alone, use old-style with rects
         // if there are too many points at pixel, use circle
         show_rect = (pnt.nproc === 1) && (right-left < width);

         if (show_rect) {
            // for mouse events mouse pointer should be under the curve
            if ((pnt.y < gry1) && !pnt.touch) findbin = null;

            gry2 = height;

            if ((this.fillatt.color !== 'none') && (this.hmin>=0)) {
               gry2 = Math.round(pmain.gry(0));
               if ((gry2 > height) || (gry2 <= gry1)) gry2 = height;
            }
         }
      }

      if (findbin!==null) {
         // if bin on boundary found, check that x position is ok
         if ((findbin === left) && (grx1 > pnt_x + gapx))  findbin = null; else
         if ((findbin === right-1) && (grx2 < pnt_x - gapx)) findbin = null; else
         // if bars option used check that bar is not match
         if ((pnt_x < grx1 - gapx) || (pnt_x > grx2 + gapx)) findbin = null; else
         // exclude empty bin if empty bins suppressed
         if (!this.options.Zero && (this.histo.getBinContent(findbin+1)===0)) findbin = null;
      }

      var ttrect = this.draw_g.select(".tooltip_bin");

      if ((findbin === null) || ((gry2 <= 0) || (gry1 >= height))) {
         ttrect.remove();
         this.ProvideUserTooltip(null);
         return null;
      }

      var res = { name: this.histo.fName, title: this.histo.fTitle,
                  x: midx, y: midy,
                  color1: this.lineatt ? this.lineatt.color : 'green',
                  color2: this.fillatt ? this.fillatt.color : 'blue',
                  lines: this.GetBinTips(findbin) };

      if (pnt.disabled) {
         // case when tooltip should not highlight bin

         ttrect.remove();
         res.changed = true;
      } else
      if (show_rect) {

         if (ttrect.empty())
            ttrect = this.draw_g.append("svg:rect")
                                .attr("class","tooltip_bin h1bin")
                                .style("pointer-events","none");

         res.changed = ttrect.property("current_bin") !== findbin;

         if (res.changed)
            ttrect.attr("x", pmain.swap_xy ? gry1 : grx1)
                  .attr("width", pmain.swap_xy ? gry2-gry1 : grx2-grx1)
                  .attr("y", pmain.swap_xy ? grx1 : gry1)
                  .attr("height", pmain.swap_xy ? grx2-grx1 : gry2-gry1)
                  .style("opacity", "0.3")
                  .property("current_bin", findbin);

         res.exact = (Math.abs(midy - pnt_y) <= 5) || ((pnt_y>=gry1) && (pnt_y<=gry2));

         res.menu = true; // one could show context menu
         // distance to middle point, use to decide which menu to activate
         res.menu_dist = Math.sqrt((midx-pnt_x)*(midx-pnt_x) + (midy-pnt_y)*(midy-pnt_y));

      } else {
         var radius = this.lineatt.width + 3;

         if (ttrect.empty())
            ttrect = this.draw_g.append("svg:circle")
                                .attr("class","tooltip_bin")
                                .style("pointer-events","none")
                                .attr("r", radius)
                                .call(this.lineatt.func)
                                .call(this.fillatt.func);

         res.exact = (Math.abs(midx - pnt.x) <= radius) && (Math.abs(midy - pnt.y) <= radius);

         res.menu = res.exact; // show menu only when mouse pointer exactly over the histogram
         res.menu_dist = Math.sqrt((midx-pnt.x)*(midx-pnt.x) + (midy-pnt.y)*(midy-pnt.y));

         res.changed = ttrect.property("current_bin") !== findbin;

         if (res.changed)
            ttrect.attr("cx", midx)
                  .attr("cy", midy)
                  .property("current_bin", findbin);
      }

      if (this.IsUserTooltipCallback() && res.changed) {
         this.ProvideUserTooltip({ obj: this.histo,  name: this.histo.fName,
                                   bin: findbin, cont: this.histo.getBinContent(findbin+1),
                                   grx: midx, gry: midy });
      }

      return res;
   }


   TH1Painter.prototype.FillHistContextMenu = function(menu) {

      menu.add("Auto zoom-in", this.AutoZoom);

      var sett = JSROOT.getDrawSettings("ROOT." + this.GetObject()._typename, 'nosame');

      menu.addDrawMenu("Draw with", sett.opts, function(arg) {
         if (arg==='inspect')
            return JSROOT.draw(this.divid, this.GetObject(), arg);

         this.options = this.DecodeOptions(arg, true);

         // redraw all objects
         this.RedrawPad();
      });
   }

   TH1Painter.prototype.AutoZoom = function() {
      var left = this.GetSelectIndex("x", "left", -1),
          right = this.GetSelectIndex("x", "right", 1),
          dist = right - left;

      if (dist == 0) return;

      // first find minimum
      var min = this.histo.getBinContent(left + 1);
      for (var indx = left; indx < right; ++indx)
         min = Math.min(min, this.histo.getBinContent(indx+1));
      if (min > 0) return; // if all points positive, no chance for autoscale

      while ((left < right) && (this.histo.getBinContent(left+1) <= min)) ++left;
      while ((left < right) && (this.histo.getBinContent(right) <= min)) --right;

      // if singular bin
      if ((left === right-1) && (left > 2) && (right < this.nbinsx-2)) {
         --left; ++right;
      }

      if ((right - left < dist) && (left < right))
         this.Zoom(this.GetBinX(left), this.GetBinX(right));
   }

   TH1Painter.prototype.CanZoomIn = function(axis,min,max) {
      if ((axis=="x") && (this.GetIndexX(max,0.5) - this.GetIndexX(min,0) > 1)) return true;

      if ((axis=="y") && (Math.abs(max-min) > Math.abs(this.ymax-this.ymin)*1e-6)) return true;

      // check if it makes sense to zoom inside specified axis range
      return false;
   }

   TH1Painter.prototype.CallDrawFunc = function(callback, resize) {

      var is3d = false, main = this.frame_painter();

      if (main && (main.mode3d !== is3d)) {
         // that to do with that case
         is3d = main.mode3d;
         // this.options.Lego = main.options.Lego;
      }

      var funcname = is3d ? "Draw3D" : "Draw2D";

      this[funcname](callback, resize);
   }

   TH1Painter.prototype.Draw2D = function(call_back) {
      if (typeof this.Create3DScene === 'function')
         this.Create3DScene(-1);

      this.mode3d = false;

      console.log("Draw2D");
      
      this.ScanContent(true);

      if (typeof this.DrawColorPalette === 'function')
         this.DrawColorPalette(false);

      this.DrawAxes();
      //this.DrawGrids();
      
      this.DrawBins();
      // this.DrawTitle();
      // this.UpdateStatWebCanvas();
      // this.AddInteractive();
      JSROOT.CallBack(call_back);
   }

   TH1Painter.prototype.Draw3D = function(call_back, resize) {
      this.mode3d = true;
      JSROOT.AssertPrerequisites('hist3d', function() {
         this.Draw3D(call_back, resize);
      }.bind(this));
   }

   TH1Painter.prototype.Redraw = function(resize) {
      this.CallDrawFunc(null, resize);
   }

   function drawHist1(divid, histo, opt) {
      // create painter and add it to canvas
      var painter = new TH1Painter(histo);

      painter.SetDivId(divid);
      
      // here we deciding how histogram will look like and how will be shown
      // painter.options = painter.DecodeOptions(opt);

      // if (!painter.options.Lego) painter.CheckPadRange();

      painter.ScanContent();

      // painter.CreateStat(); // only when required

      console.log("Draw v7.TH1");
      
      painter.CallDrawFunc(function() {
         // if ((painter.options.Lego === 0) && painter.options.AutoZoom) painter.AutoZoom();
         // painter.FillToolbar();
         painter.DrawingReady();
      });

      return painter;
   }

   // ==================== painter for TH2 histograms ==============================

   function TH2Painter(histo) {
      THistPainter.call(this, histo);
      this.fContour = null; // contour levels
      this.fCustomContour = false; // are this user-defined levels (can be irregular)
      this.fPalette = null;
   }

   TH2Painter.prototype = Object.create(THistPainter.prototype);

   TH2Painter.prototype.Cleanup = function() {
      delete this.fCustomContour;
      delete this.tt_handle;

      THistPainter.prototype.Cleanup.call(this);
   }

   TH2Painter.prototype.ToggleProjection = function(kind, width) {

      if (kind=="Projections") kind = "";

      if ((typeof kind == 'string') && (kind.length>1)) {
          width = parseInt(kind.substr(1));
          kind = kind[0];
      }

      if (!width) width = 1;

      if (kind && (this.is_projection==kind)) {
         if (this.projection_width === width) {
            kind = "";
         } else {
            this.projection_width = width;
            return;
         }
      }

      delete this.proj_hist;

      this.is_projection = (this.is_projection === kind) ? "" : kind;
      this.projection_width = width;

      var canp = this.pad_painter();
      if (canp) canp.ToggleProjection(this.is_projection, this.RedrawProjection.bind(this));
   }

   TH2Painter.prototype.RedrawProjection = function(ii1, ii2, jj1, jj2) {

      if (!this.is_projection) return;

      if (jj2 == undefined) {
         if (!this.tt_handle) return;
         ii1 = Math.round((this.tt_handle.i1 + this.tt_handle.i2)/2); ii2 = ii1+1;
         jj1 = Math.round((this.tt_handle.j1 + this.tt_handle.j2)/2); jj2 = jj1+1;
      }

      var canp = this.pad_painter();

      if (canp && (this.snapid !== undefined)) {
         // this is when projection should be created on the server side
         var exec = "EXECANDSEND:D" + this.is_projection + "PROJ:" + this.snapid + ":";
         if (this.is_projection == "X")
            exec += 'ProjectionX("_projx",' + (jj1+1) + ',' + jj2 + ',"")';
         else
            exec += 'ProjectionY("_projy",' + (ii1+1) + ',' + ii2 + ',"")';
         canp.SendWebsocket(exec);
         return;
      }

      if (!this.proj_hist) {
         if (this.is_projection == "X") {
            this.proj_hist = JSROOT.CreateHistogram("TH1D", this.nbinsx);
            JSROOT.extend(this.proj_hist.fXaxis, this.histo.fXaxis);
            this.proj_hist.fName = "xproj";
            this.proj_hist.fTitle = "X projection";
         } else {
            this.proj_hist = JSROOT.CreateHistogram("TH1D", this.nbinsy);
            JSROOT.extend(this.proj_hist.fXaxis, this.histo.fYaxis);
            this.proj_hist.fName = "yproj";
            this.proj_hist.fTitle = "Y projection";
         }
      }

      if (this.is_projection == "X") {
         for (var i=0;i<this.nbinsx;++i) {
            var sum=0;
            for (var j=jj1;j<jj2;++j) sum+=this.histo.getBinContent(i+1,j+1);
            this.proj_hist.setBinContent(i+1, sum);
         }
      } else {
         for (var j=0;j<this.nbinsy;++j) {
            var sum = 0;
            for (var i=ii1;i<ii2;++i) sum += this.histo.getBinContent(i+1,j+1);
            this.proj_hist.setBinContent(j+1, sum);
         }
      }

      return canp.DrawProjection(this.is_projection, this.proj_hist);
   }

   TH2Painter.prototype.ExecuteMenuCommand = function(method, args) {
      if (THistPainter.prototype.ExecuteMenuCommand.call(this,method, args)) return true;

      if ((method.fName == 'SetShowProjectionX') || (method.fName == 'SetShowProjectionY')) {
         this.ToggleProjection(method.fName[17], args && parseInt(args) ? parseInt(args) : 1);
         return true;
      }

      return false;
   }

   TH2Painter.prototype.FillHistContextMenu = function(menu) {
      // painter automatically bind to menu callbacks

      menu.add("sub:Projections", this.ToggleProjection);
      var kind = this.is_projection || "";
      if (kind) kind += this.projection_width;
      var kinds = ["X1", "X2", "X3", "X5", "X10", "Y1", "Y2", "Y3", "Y5", "Y10"];
      for (var k=0;k<kinds.length;++k)
         menu.addchk(kind==kinds[k], kinds[k], kinds[k], this.ToggleProjection);
      menu.add("endsub:");

      menu.add("Auto zoom-in", this.AutoZoom);

      var sett = JSROOT.getDrawSettings("ROOT." + this.GetObject()._typename, 'nosame');

      menu.addDrawMenu("Draw with", sett.opts, function(arg) {
         if (arg==='inspect')
            return JSROOT.draw(this.divid, this.GetObject(), arg);
         this.options = this.DecodeOptions(arg);
         this.RedrawPad();
      });

      if (this.options.Color > 0)
         this.FillPaletteMenu(menu);
   }

   TH2Painter.prototype.ButtonClick = function(funcname) {
      if (THistPainter.prototype.ButtonClick.call(this, funcname)) return true;

      if (this !== this.main_painter()) return false;

      switch(funcname) {
         case "ToggleColor": this.ToggleColor(); break;
         case "ToggleColorZ":
            if (this.options.Lego === 12 || this.options.Lego === 14 ||
                this.options.Color > 0 || this.options.Contour > 0 ||
                this.options.Surf === 11 || this.options.Surf === 12) this.ToggleColz();
            break;
         case "Toggle3D":
            if (this.options.Surf > 0) {
               this.options.Surf = -this.options.Surf;
            } else
            if (this.options.Lego > 0) {
               this.options.Lego = 0;
            } else
            if (this.options.Surf < 0) {
               this.options.Surf = -this.options.Surf;
            } else {
               if ((this.nbinsx>=50) || (this.nbinsy>=50))
                  this.options.Lego = (this.options.Color > 0) ? 14 : 13;
               else
                  this.options.Lego = (this.options.Color > 0) ? 12 : 1;

               this.options.Zero = 0; // do not show zeros by default
            }

            this.RedrawPad();
            break;
         default: return false;
      }

      // all methods here should not be processed further
      return true;
   }

   TH2Painter.prototype.FillToolbar = function() {
      THistPainter.prototype.FillToolbar.call(this);

      var pp = this.pad_painter(true);
      if (pp===null) return;

      if (!this.IsTH2Poly())
         pp.AddButton(JSROOT.ToolbarIcons.th2color, "Toggle color", "ToggleColor");
      pp.AddButton(JSROOT.ToolbarIcons.th2colorz, "Toggle color palette", "ToggleColorZ");
      pp.AddButton(JSROOT.ToolbarIcons.th2draw3d, "Toggle 3D mode", "Toggle3D");
   }

   TH2Painter.prototype.ToggleColor = function() {

      var toggle = true;

      if (this.options.Lego > 0) { this.options.Lego = 0; toggle = false; } else
      if (this.options.Surf > 0) { this.options.Surf = -this.options.Surf; toggle = false; }

      if (this.options.Color == 0) {
         this.options.Color = ('LastColor' in this.options) ?  this.options.LastColor : 1;
      } else
      if (toggle) {
         this.options.LastColor = this.options.Color;
         this.options.Color = 0;
      }

      this._can_move_colz = true; // indicate that next redraw can move Z scale

      this.Redraw();

      // this.DrawColorPalette((this.options.Color > 0) && (this.options.Zscale > 0));
   }

   TH2Painter.prototype.AutoZoom = function() {
      if (this.IsTH2Poly()) return; // not implemented

      var i1 = this.GetSelectIndex("x", "left", -1),
          i2 = this.GetSelectIndex("x", "right", 1),
          j1 = this.GetSelectIndex("y", "left", -1),
          j2 = this.GetSelectIndex("y", "right", 1),
          i,j, histo = this.GetObject();

      if ((i1 == i2) || (j1 == j2)) return;

      // first find minimum
      var min = histo.getBinContent(i1 + 1, j1 + 1);
      for (i = i1; i < i2; ++i)
         for (j = j1; j < j2; ++j)
            min = Math.min(min, histo.getBinContent(i+1, j+1));
      if (min > 0) return; // if all points positive, no chance for autoscale

      var ileft = i2, iright = i1, jleft = j2, jright = j1;

      for (i = i1; i < i2; ++i)
         for (j = j1; j < j2; ++j)
            if (histo.getBinContent(i + 1, j + 1) > min) {
               if (i < ileft) ileft = i;
               if (i >= iright) iright = i + 1;
               if (j < jleft) jleft = j;
               if (j >= jright) jright = j + 1;
            }

      var xmin, xmax, ymin, ymax, isany = false;

      if ((ileft === iright-1) && (ileft > i1+1) && (iright < i2-1)) { ileft--; iright++; }
      if ((jleft === jright-1) && (jleft > j1+1) && (jright < j2-1)) { jleft--; jright++; }

      if ((ileft > i1 || iright < i2) && (ileft < iright - 1)) {
         xmin = this.GetBinX(ileft);
         xmax = this.GetBinX(iright);
         isany = true;
      }

      if ((jleft > j1 || jright < j2) && (jleft < jright - 1)) {
         ymin = this.GetBinY(jleft);
         ymax = this.GetBinY(jright);
         isany = true;
      }

      if (isany) this.Zoom(xmin, xmax, ymin, ymax);
   }
   
   TH2Painter.prototype.ProjectAitoff2xy = function(l, b) {
      var DegToRad = Math.PI/180,
          alpha2 = (l/2)*DegToRad,
          delta  = b*DegToRad,
          r2     = Math.sqrt(2),
          f      = 2*r2/Math.PI,
          cdec   = Math.cos(delta),
          denom  = Math.sqrt(1. + cdec*Math.cos(alpha2)),
          res = {
             x: cdec*Math.sin(alpha2)*2.*r2/denom/f/DegToRad,
             y: Math.sin(delta)*r2/denom/f/DegToRad
          };
      //  x *= -1.; // for a skymap swap left<->right
      return res;
   }

   TH2Painter.prototype.ProjectMercator2xy = function(l, b) {
      var aid = Math.tan((Math.PI/2 + b/180*Math.PI)/2);
      return { x: l, y: Math.log(aid) };
   }

   TH2Painter.prototype.ProjectSinusoidal2xy = function(l, b) {
      return { x: l*Math.cos(b/180*Math.PI), y: b };
   }

   TH2Painter.prototype.ProjectParabolic2xy = function(l, b) {
      return {
         x: l*(2.*Math.cos(2*b/180*Math.PI/3) - 1),
         y: 180*Math.sin(b/180*Math.PI/3)
      };
   }
   
   TH2Painter.prototype.RecalculateRange = function() {

      if (!this.is_main_painter() || !this.options.Proj) return;

      var pnts = []; // all extrems which used to find 
      if (this.options.Proj == 1) {
         // TODO : check x range not lower than -180 and not higher than 180
         pnts.push(this.ProjectAitoff2xy(this.scale_xmin, this.scale_ymin));
         pnts.push(this.ProjectAitoff2xy(this.scale_xmin, this.scale_ymax));
         pnts.push(this.ProjectAitoff2xy(this.scale_xmax, this.scale_ymax));
         pnts.push(this.ProjectAitoff2xy(this.scale_xmax, this.scale_ymin));
         if (this.scale_ymin<0 && this.scale_ymax>0) {
            // there is an  'equator', check its range in the plot..
            pnts.push(this.ProjectAitoff2xy(this.scale_xmin*0.9999, 0));
            pnts.push(this.ProjectAitoff2xy(this.scale_xmax*0.9999, 0));
         }
         if (this.scale_xmin<0 && this.scale_xmax>0) {
            pnts.push(this.ProjectAitoff2xy(0, this.scale_ymin));
            pnts.push(this.ProjectAitoff2xy(0, this.scale_ymax));
         }
      } else if ( this.options.Proj == 2) {
         if (this.scale_ymin <= -90 || this.scale_ymax >=90) {
            console.warn("Mercator Projection", "Latitude out of range", this.scale_ymin, this.scale_ymax);
            this.options.Proj = 0;
            return;
         } 
         pnts.push(this.ProjectMercator2xy(this.scale_xmin, this.scale_ymin));
         pnts.push(this.ProjectMercator2xy(this.scale_xmax, this.scale_ymax));
         
      } else if (this.options.Proj == 3) {
         pnts.push(this.ProjectSinusoidal2xy(this.scale_xmin, this.scale_ymin));
         pnts.push(this.ProjectSinusoidal2xy(this.scale_xmin, this.scale_ymax));
         pnts.push(this.ProjectSinusoidal2xy(this.scale_xmax, this.scale_ymax));
         pnts.push(this.ProjectSinusoidal2xy(this.scale_xmax, this.scale_ymin));
         if (this.scale_ymin<0 && this.scale_ymax>0) {
            pnts.push(this.ProjectSinusoidal2xy(this.scale_xmin, 0));
            pnts.push(this.ProjectSinusoidal2xy(this.scale_xmax, 0));
         }
         if (this.scale_xmin<0 && this.scale_xmax>0) {
            pnts.push(this.ProjectSinusoidal2xy(0, this.scale_ymin));
            pnts.push(this.ProjectSinusoidal2xy(0, this.scale_ymax));
         }
      } else if (this.options.Proj == 4) {
         pnts.push(this.ProjectParabolic2xy(this.scale_xmin, this.scale_ymin));
         pnts.push(this.ProjectParabolic2xy(this.scale_xmin, this.scale_ymax));
         pnts.push(this.ProjectParabolic2xy(this.scale_xmax, this.scale_ymax));
         pnts.push(this.ProjectParabolic2xy(this.scale_xmax, this.scale_ymin));
         if (this.scale_ymin<0 && this.scale_ymax>0) {
            pnts.push(this.ProjectParabolic2xy(this.scale_xmin, 0));
            pnts.push(this.ProjectParabolic2xy(this.scale_xmax, 0));
         }
         if (this.scale_xmin<0 && this.scale_xmax>0) {
            pnts.push(this.ProjectParabolic2xy(0, this.scale_ymin));
            pnts.push(this.ProjectParabolic2xy(0, this.scale_ymax));
         }
      } else {
         this.options.Proj = 0;
         return;
      }
      
      this.original_xmin = this.scale_xmin;
      this.original_xmax = this.scale_xmax;
      this.original_ymin = this.scale_ymin;
      this.original_ymax = this.scale_ymax;
      
      this.scale_xmin = this.scale_xmax = pnts[0].x;
      this.scale_ymin = this.scale_ymax = pnts[0].y;
      
      for (var n=1;n<pnts.length;++n) { 
         this.scale_xmin = Math.min(this.scale_xmin, pnts[n].x);
         this.scale_xmax = Math.max(this.scale_xmax, pnts[n].x);
         this.scale_ymin = Math.min(this.scale_ymin, pnts[n].y);
         this.scale_ymax = Math.max(this.scale_ymax, pnts[n].y);
      }
   }

   TH2Painter.prototype.ScanContent = function(when_axis_changed) {

      // no need to rescan histogram while result does not depend from axis selection
      if (when_axis_changed && this.nbinsx && this.nbinsy) return;

      var i, j, histo = this.GetObject();

      this.nbinsx = histo.fXaxis.fNbins;
      this.nbinsy = histo.fYaxis.fNbins;

      // used in CreateXY method

      this.CreateAxisFuncs(true);

      if (this.IsTH2Poly()) {
         this.gminposbin = null;
         this.gminbin = this.gmaxbin = 0;

         for (var n=0, len=histo.fBins.arr.length; n<len; ++n) {
            var bin_content = histo.fBins.arr[n].fContent;
            if (n===0) this.gminbin = this.gmaxbin = bin_content;

            if (bin_content < this.gminbin) this.gminbin = bin_content; else
               if (bin_content > this.gmaxbin) this.gmaxbin = bin_content;

            if (bin_content > 0)
               if ((this.gminposbin===null) || (this.gminposbin > bin_content)) this.gminposbin = bin_content;
         }
      } else {
         // global min/max, used at the moment in 3D drawing
         this.gminbin = this.gmaxbin = histo.getBinContent(1, 1);
         this.gminposbin = null;
         for (i = 0; i < this.nbinsx; ++i) {
            for (j = 0; j < this.nbinsy; ++j) {
               var bin_content = histo.getBinContent(i+1, j+1);
               if (bin_content < this.gminbin) this.gminbin = bin_content; else
                  if (bin_content > this.gmaxbin) this.gmaxbin = bin_content;
               if (bin_content > 0)
                  if ((this.gminposbin===null) || (this.gminposbin > bin_content)) this.gminposbin = bin_content;
            }
         }
      }

      // this value used for logz scale drawing
      if (this.gminposbin === null) this.gminposbin = this.gmaxbin*1e-4;

      if (this.options.Axis > 0) { // Paint histogram axis only
         this.draw_content = false;
      } else {
         // used to enable/disable stat box
         this.draw_content = this.gmaxbin > 0;
      }
   }

   TH2Painter.prototype.CountStat = function(cond) {
      var histo = this.GetObject(),
          stat_sum0 = 0, stat_sumx1 = 0, stat_sumy1 = 0,
          stat_sumx2 = 0, stat_sumy2 = 0, stat_sumxy = 0,
          xside, yside, xx, yy, zz,
          res = { entries: 0, integral: 0, meanx: 0, meany: 0, rmsx: 0, rmsy: 0, matrix: [0,0,0,0,0,0,0,0,0], xmax: 0, ymax:0, wmax: null };

      if (this.IsTH2Poly()) {

         var len = histo.fBins.arr.length, i, bin, n, gr, ngr, numgraphs, numpoints,
             pmain = this.main_painter();

         for (i=0;i<len;++i) {
            bin = histo.fBins.arr[i];

            xside = 1; yside = 1;

            if (bin.fXmin > pmain.scale_xmax) xside = 2; else
            if (bin.fXmax < pmain.scale_xmin) xside = 0;
            if (bin.fYmin > pmain.scale_ymax) yside = 2; else
            if (bin.fYmax < pmain.scale_ymin) yside = 0;

            xx = yy = numpoints = 0;
            gr = bin.fPoly; numgraphs = 1;
            if (gr._typename === 'TMultiGraph') { numgraphs = bin.fPoly.fGraphs.arr.length; gr = null; }

            for (ngr=0;ngr<numgraphs;++ngr) {
               if (!gr || (ngr>0)) gr = bin.fPoly.fGraphs.arr[ngr];

               for (n=0;n<gr.fNpoints;++n) {
                  ++numpoints;
                  xx += gr.fX[n];
                  yy += gr.fY[n];
               }
            }

            if (numpoints > 1) {
               xx = xx / numpoints;
               yy = yy / numpoints;
            }

            zz = bin.fContent;

            res.entries += zz;

            res.matrix[yside * 3 + xside] += zz;

            if ((xside != 1) || (yside != 1)) continue;

            if ((cond!=null) && !cond(xx,yy)) continue;

            if ((res.wmax==null) || (zz>res.wmax)) { res.wmax = zz; res.xmax = xx; res.ymax = yy; }

            stat_sum0 += zz;
            stat_sumx1 += xx * zz;
            stat_sumy1 += yy * zz;
            stat_sumx2 += xx * xx * zz;
            stat_sumy2 += yy * yy * zz;
            stat_sumxy += xx * yy * zz;
         }
      } else {
         var xleft = this.GetSelectIndex("x", "left"),
             xright = this.GetSelectIndex("x", "right"),
             yleft = this.GetSelectIndex("y", "left"),
             yright = this.GetSelectIndex("y", "right"),
             xi, yi;

         for (xi = 0; xi <= this.nbinsx + 1; ++xi) {
            xside = (xi <= xleft) ? 0 : (xi > xright ? 2 : 1);
            xx = this.GetBinX(xi - 0.5);

            for (yi = 0; yi <= this.nbinsy + 1; ++yi) {
               yside = (yi <= yleft) ? 0 : (yi > yright ? 2 : 1);
               yy = this.GetBinY(yi - 0.5);

               zz = histo.getBinContent(xi, yi);

               res.entries += zz;

               res.matrix[yside * 3 + xside] += zz;

               if ((xside != 1) || (yside != 1)) continue;

               if ((cond!=null) && !cond(xx,yy)) continue;

               if ((res.wmax==null) || (zz>res.wmax)) { res.wmax = zz; res.xmax = xx; res.ymax = yy; }

               stat_sum0 += zz;
               stat_sumx1 += xx * zz;
               stat_sumy1 += yy * zz;
               stat_sumx2 += xx * xx * zz;
               stat_sumy2 += yy * yy * zz;
               stat_sumxy += xx * yy * zz;
            }
         }
      }

      if (!this.IsAxisZoomed("x") && !this.IsAxisZoomed("y") && (histo.fTsumw > 0)) {
         stat_sum0 = histo.fTsumw;
         stat_sumx1 = histo.fTsumwx;
         stat_sumx2 = histo.fTsumwx2;
         stat_sumy1 = histo.fTsumwy;
         stat_sumy2 = histo.fTsumwy2;
         stat_sumxy = histo.fTsumwxy;
      }

      if (stat_sum0 > 0) {
         res.meanx = stat_sumx1 / stat_sum0;
         res.meany = stat_sumy1 / stat_sum0;
         res.rmsx = Math.sqrt(Math.abs(stat_sumx2 / stat_sum0 - res.meanx * res.meanx));
         res.rmsy = Math.sqrt(Math.abs(stat_sumy2 / stat_sum0 - res.meany * res.meany));
      }

      if (res.wmax===null) res.wmax = 0;
      res.integral = stat_sum0;

      if (histo.fEntries > 1) res.entries = histo.fEntries;

      return res;
   }

   TH2Painter.prototype.FillStatistic = function(stat, dostat, dofit) {

      // no need to refill statistic if histogram is dummy
      if (this.IgnoreStatsFill()) return false;

      var data = this.CountStat(),
          print_name = Math.floor(dostat % 10),
          print_entries = Math.floor(dostat / 10) % 10,
          print_mean = Math.floor(dostat / 100) % 10,
          print_rms = Math.floor(dostat / 1000) % 10,
          print_under = Math.floor(dostat / 10000) % 10,
          print_over = Math.floor(dostat / 100000) % 10,
          print_integral = Math.floor(dostat / 1000000) % 10,
          print_skew = Math.floor(dostat / 10000000) % 10,
          print_kurt = Math.floor(dostat / 100000000) % 10;

      stat.ClearPave();

      if (print_name > 0)
         stat.AddText(this.GetObject().fName);

      if (print_entries > 0)
         stat.AddText("Entries = " + stat.Format(data.entries,"entries"));

      if (print_mean > 0) {
         stat.AddText("Mean x = " + stat.Format(data.meanx));
         stat.AddText("Mean y = " + stat.Format(data.meany));
      }

      if (print_rms > 0) {
         stat.AddText("Std Dev x = " + stat.Format(data.rmsx));
         stat.AddText("Std Dev y = " + stat.Format(data.rmsy));
      }

      if (print_integral > 0)
         stat.AddText("Integral = " + stat.Format(data.matrix[4],"entries"));

      if (print_skew > 0) {
         stat.AddText("Skewness x = <undef>");
         stat.AddText("Skewness y = <undef>");
      }

      if (print_kurt > 0)
         stat.AddText("Kurt = <undef>");

      if ((print_under > 0) || (print_over > 0)) {
         var m = data.matrix;

         stat.AddText("" + m[6].toFixed(0) + " | " + m[7].toFixed(0) + " | "  + m[7].toFixed(0));
         stat.AddText("" + m[3].toFixed(0) + " | " + m[4].toFixed(0) + " | "  + m[5].toFixed(0));
         stat.AddText("" + m[0].toFixed(0) + " | " + m[1].toFixed(0) + " | "  + m[2].toFixed(0));
      }

      if (dofit) stat.FillFunctionStat(this.FindFunction('TF1'), dofit);

      return true;
   }

   TH2Painter.prototype.DrawBinsColor = function(w,h) {
      var histo = this.GetObject(),
          handle = this.PrepareColorDraw(),
          colPaths = [], currx = [], curry = [],
          colindx, cmd1, cmd2, i, j, binz;

      // now start build
      for (i = handle.i1; i < handle.i2; ++i) {
         for (j = handle.j1; j < handle.j2; ++j) {
            binz = histo.getBinContent(i + 1, j + 1);
            colindx = this.getContourColor(binz, true);
            if (binz===0) {
               if (this.options.Color===11) continue;
               if ((colindx === null) && this._show_empty_bins) colindx = 0;
            }
            if (colindx === null) continue;

            cmd1 = "M"+handle.grx[i]+","+handle.gry[j+1];
            if (colPaths[colindx] === undefined) {
               colPaths[colindx] = cmd1;
            } else{
               cmd2 = "m" + (handle.grx[i]-currx[colindx]) + "," + (handle.gry[j+1]-curry[colindx]);
               colPaths[colindx] += (cmd2.length < cmd1.length) ? cmd2 : cmd1;
            }

            currx[colindx] = handle.grx[i];
            curry[colindx] = handle.gry[j+1];

            colPaths[colindx] += "v" + (handle.gry[j] - handle.gry[j+1]) +
                                 "h" + (handle.grx[i+1] - handle.grx[i]) +
                                 "v" + (handle.gry[j+1] - handle.gry[j]) + "z";
         }
      }

      for (colindx=0;colindx<colPaths.length;++colindx)
        if (colPaths[colindx] !== undefined)
           this.draw_g
               .append("svg:path")
               .attr("palette-index", colindx)
               .attr("fill", this.fPalette.getColor(colindx))
               .attr("d", colPaths[colindx]);

      return handle;
   }

   TH2Painter.prototype.BuildContour = function(handle, levels, palette, contour_func) {
      var histo = this.GetObject(), ddd = 0,
          painter = this,
          kMAXCONTOUR = 2004,
          kMAXCOUNT = 2000,
          // arguments used in the PaintContourLine
          xarr = new Float32Array(2*kMAXCONTOUR),
          yarr = new Float32Array(2*kMAXCONTOUR),
          itarr = new Int32Array(2*kMAXCONTOUR),
          lj = 0, ipoly, poly, polys = [], np, npmax = 0,
          x = [0.,0.,0.,0.], y = [0.,0.,0.,0.], zc = [0.,0.,0.,0.], ir = [0,0,0,0],
          i, j, k, n, m, ix, ljfill, count,
          xsave, ysave, itars, ix, jx;

      function BinarySearch(zc) {
         for (var kk=0;kk<levels.length;++kk)
            if (zc<levels[kk]) return kk-1;
         return levels.length-1;
      }

      function PaintContourLine(elev1, icont1, x1, y1,  elev2, icont2, x2, y2) {
         /* Double_t *xarr, Double_t *yarr, Int_t *itarr, Double_t *levels */
         var vert = (x1 === x2),
             tlen = vert ? (y2 - y1) : (x2 - x1),
             n = icont1 +1,
             tdif = elev2 - elev1,
             ii = lj-1,
             maxii = kMAXCONTOUR/2 -3 + lj,
             icount = 0,
             xlen, pdif, diff, elev;

         while (n <= icont2 && ii <= maxii) {
//          elev = fH->GetContourLevel(n);
            elev = levels[n];
            diff = elev - elev1;
            pdif = diff/tdif;
            xlen = tlen*pdif;
            if (vert) {
               xarr[ii] = x1;
               yarr[ii] = y1 + xlen;
            } else {
               xarr[ii] = x1 + xlen;
               yarr[ii] = y1;
            }
            itarr[ii] = n;
            icount++;
            ii +=2;
            n++;
         }
         return icount;
      }
      
      var arrx = handle.original ? handle.origx : handle.grx,
          arry = handle.original ? handle.origy : handle.gry;

      for (j = handle.j1; j < handle.j2-1; ++j) {

         y[1] = y[0] = (arry[j] + arry[j+1])/2;
         y[3] = y[2] = (arry[j+1] + arry[j+2])/2;

         for (i = handle.i1; i < handle.i2-1; ++i) {

            zc[0] = histo.getBinContent(i+1, j+1);
            zc[1] = histo.getBinContent(i+2, j+1);
            zc[2] = histo.getBinContent(i+2, j+2);
            zc[3] = histo.getBinContent(i+1, j+2);

            for (k=0;k<4;k++)
               ir[k] = BinarySearch(zc[k]);

            if ((ir[0] !== ir[1]) || (ir[1] !== ir[2]) || (ir[2] !== ir[3]) || (ir[3] !== ir[0])) {
               x[3] = x[0] = (arrx[i] + arrx[i+1])/2;
               x[2] = x[1] = (arrx[i+1] + arrx[i+2])/2;

               if (zc[0] <= zc[1]) n = 0; else n = 1;
               if (zc[2] <= zc[3]) m = 2; else m = 3;
               if (zc[n] > zc[m]) n = m;
               n++;
               lj=1;
               for (ix=1;ix<=4;ix++) {
                  m = n%4 + 1;
                  ljfill = PaintContourLine(zc[n-1],ir[n-1],x[n-1],y[n-1],
                        zc[m-1],ir[m-1],x[m-1],y[m-1]);
                  lj += 2*ljfill;
                  n = m;
               }

               if (zc[0] <= zc[1]) n = 0; else n = 1;
               if (zc[2] <= zc[3]) m = 2; else m = 3;
               if (zc[n] > zc[m]) n = m;
               n++;
               lj=2;
               for (ix=1;ix<=4;ix++) {
                  if (n == 1) m = 4;
                  else        m = n-1;
                  ljfill = PaintContourLine(zc[n-1],ir[n-1],x[n-1],y[n-1],
                        zc[m-1],ir[m-1],x[m-1],y[m-1]);
                  lj += 2*ljfill;
                  n = m;
               }
               //     Re-order endpoints

               count = 0;
               for (ix=1; ix<=lj-5; ix +=2) {
                  //count = 0;
                  while (itarr[ix-1] != itarr[ix]) {
                     xsave = xarr[ix];
                     ysave = yarr[ix];
                     itars = itarr[ix];
                     for (jx=ix; jx<=lj-5; jx +=2) {
                        xarr[jx]  = xarr[jx+2];
                        yarr[jx]  = yarr[jx+2];
                        itarr[jx] = itarr[jx+2];
                     }
                     xarr[lj-3]  = xsave;
                     yarr[lj-3]  = ysave;
                     itarr[lj-3] = itars;
                     if (count > kMAXCOUNT) break;
                     count++;
                  }
               }

               if (count > kMAXCOUNT) continue;

               for (ix=1; ix<=lj-2; ix +=2) {

                  ipoly = itarr[ix-1];

                  if ((ipoly >= 0) && (ipoly < levels.length)) {
                     poly = polys[ipoly];
                     if (!poly)
                        poly = polys[ipoly] = JSROOT.CreateTPolyLine(kMAXCONTOUR*4, true);

                     np = poly.fLastPoint;
                     if (np < poly.fN-2) {
                        poly.fX[np+1] = Math.round(xarr[ix-1]); poly.fY[np+1] = Math.round(yarr[ix-1]);
                        poly.fX[np+2] = Math.round(xarr[ix]); poly.fY[np+2] = Math.round(yarr[ix]);
                        poly.fLastPoint = np+2;
                        npmax = Math.max(npmax, poly.fLastPoint+1);
                     } else {
                        // console.log('reject point??', poly.fLastPoint);
                     }
                  }
               }
            } // end of if (ir[0]
         } // end of j
      } // end of i

      var polysort = new Int32Array(levels.length), first = 0;
      //find first positive contour
      for (ipoly=0;ipoly<levels.length;ipoly++) {
         if (levels[ipoly] >= 0) { first = ipoly; break; }
      }
      //store negative contours from 0 to minimum, then all positive contours
      k = 0;
      for (ipoly=first-1;ipoly>=0;ipoly--) {polysort[k] = ipoly; k++;}
      for (ipoly=first;ipoly<levels.length;ipoly++) { polysort[k] = ipoly; k++;}

      var xp = new Float32Array(2*npmax),
          yp = new Float32Array(2*npmax);

      for (k=0;k<levels.length;++k) {

         ipoly = polysort[k];
         poly = polys[ipoly];
         if (!poly) continue;

         var colindx = palette.calcColorIndex(ipoly, levels.length),
             xx = poly.fX, yy = poly.fY, np = poly.fLastPoint+1,
             istart = 0, iminus, iplus, xmin = 0, ymin = 0, nadd;

         while (true) {

            iminus = npmax;
            iplus  = iminus+1;
            xp[iminus]= xx[istart];   yp[iminus] = yy[istart];
            xp[iplus] = xx[istart+1]; yp[iplus]  = yy[istart+1];
            xx[istart] = xx[istart+1] = xmin;
            yy[istart] = yy[istart+1] = ymin;
            while (true) {
               nadd = 0;
               for (i=2;i<np;i+=2) {
                  if ((iplus < 2*npmax-1) && (xx[i] === xp[iplus]) && (yy[i] === yp[iplus])) {
                     iplus++;
                     xp[iplus] = xx[i+1]; yp[iplus] = yy[i+1];
                     xx[i] = xx[i+1] = xmin;
                     yy[i] = yy[i+1] = ymin;
                     nadd++;
                  }
                  if ((iminus > 0) && (xx[i+1] === xp[iminus]) && (yy[i+1] === yp[iminus])) {
                     iminus--;
                     xp[iminus] = xx[i]; yp[iminus] = yy[i];
                     xx[i] = xx[i+1] = xmin;
                     yy[i] = yy[i+1] = ymin;
                     nadd++;
                  }
               }
               if (nadd == 0) break;
            }

            if ((iminus+1 < iplus) && (iminus>=0))
               contour_func(colindx, xp, yp, iminus, iplus, ipoly);

            istart = 0;
            for (i=2;i<np;i+=2) {
               if (xx[i] !== xmin && yy[i] !== ymin) {
                  istart = i;
                  break;
               }
            }

            if (istart === 0) break;
         }
      }
   }

   TH2Painter.prototype.DrawBinsContour = function(frame_w,frame_h) {
      var handle = this.PrepareColorDraw({ rounding: false, extra: 100, original: this.options.Proj != 0 });

      // get levels
      var levels = this.GetContour(),
          palette = this.GetPalette(),
          painter = this;
      
      function BuildPath(xp,yp,iminus,iplus) {
         var cmd = "", last = null, pnt = null, i;
         for (i=iminus;i<=iplus;++i) {
            pnt = null;
            switch (painter.options.Proj) {
               case 1: pnt = painter.ProjectAitoff2xy(xp[i], yp[i]); break;
               case 2: pnt = painter.ProjectMercator2xy(xp[i], yp[i]); break;
               case 3: pnt = painter.ProjectSinusoidal2xy(xp[i], yp[i]); break;
               case 4: pnt = painter.ProjectParabolic2xy(xp[i], yp[i]); break;
            }
            if (pnt) {
               pnt.x = painter.grx(pnt.x);
               pnt.y = painter.gry(pnt.y);
            } else {
               pnt = { x: xp[i], y: yp[i] };
            }
            pnt.x = Math.round(pnt.x);
            pnt.y = Math.round(pnt.y);
            if (!cmd) cmd = "M" + pnt.x + "," + pnt.y;
            else if ((pnt.x != last.x) && (pnt.y != last.y)) cmd +=  "l" + (pnt.x - last.x) + "," + (pnt.y - last.y);
            else if (pnt.x != last.x) cmd +=  "h" + (pnt.x - last.x);
            else if (pnt.y != last.y) cmd +=  "v" + (pnt.y - last.y);
            last = pnt;
         }
         return cmd;
      }

      if (this.options.Contour===14) {
         var dd = "M0,0h"+frame_w+"v"+frame_h+"h-"+frame_w;
         if (this.options.Proj) {
            var sz = handle.j2 - handle.j1, xd = new Float32Array(sz*2), yd = new Float32Array(sz*2);
            for (var i=0;i<sz;++i) {
               xd[i] = handle.origx[handle.i1];
               yd[i] = (handle.origy[handle.j1]*(i+0.5) + handle.origy[handle.j2]*(sz-0.5-i))/sz;
               xd[i+sz] = handle.origx[handle.i2];
               yd[i+sz] = (handle.origy[handle.j2]*(i+0.5) + handle.origy[handle.j1]*(sz-0.5-i))/sz;
            }
            dd = BuildPath(xd,yd,0,2*sz-1);
         }
         
         this.draw_g
             .append("svg:path")
             .attr("d", dd + "z")
             .style('stroke','none')
             .style("fill", palette.calcColor(0, levels.length));
      }

      this.BuildContour(handle, levels, palette,
         function(colindx,xp,yp,iminus,iplus) {
            var icol = palette.getColor(colindx),
                fillcolor = icol, lineatt = null;

            switch (painter.options.Contour) {
               case 1: break;
               case 11: fillcolor = 'none'; lineatt = new JSROOT.TAttLineHandler(icol); break;
               case 12: fillcolor = 'none'; lineatt = new JSROOT.TAttLineHandler({fLineColor:1, fLineStyle: (colindx%5 + 1), fLineWidth: 1 }); break;
               case 13: fillcolor = 'none'; lineatt = painter.lineatt; break;
               case 14: break;
            }
            
            var elem = painter.draw_g
                          .append("svg:path")
                          .attr("class","th2_contour")
                          .attr("d", BuildPath(xp,yp,iminus,iplus) + (fillcolor == 'none' ? "" : "z"))
                          .style("fill", fillcolor);

            if (lineatt!==null)
               elem.call(lineatt.func);
            else
               elem.style('stroke','none');
         }
      );

      handle.hide_only_zeros = true; // text drawing suppress only zeros

      return handle;
   }

   TH2Painter.prototype.CreatePolyBin = function(pmain, bin) {
      var cmd = "", ngr, ngraphs = 1, gr = null;

      if (bin.fPoly._typename=='TMultiGraph')
         ngraphs = bin.fPoly.fGraphs.arr.length;
      else
         gr = bin.fPoly;

      for (ngr = 0; ngr < ngraphs; ++ ngr) {
         if (!gr || (ngr>0)) gr = bin.fPoly.fGraphs.arr[ngr];

         var npnts = gr.fNpoints, n,
             x = gr.fX, y = gr.fY,
             grx = Math.round(pmain.grx(x[0])),
             gry = Math.round(pmain.gry(y[0])),
             nextx, nexty;

         if ((npnts>2) && (x[0]==x[npnts-1]) && (y[0]==y[npnts-1])) npnts--;

         cmd += "M"+grx+","+gry;

         for (n=1;n<npnts;++n) {
            nextx = Math.round(pmain.grx(x[n]));
            nexty = Math.round(pmain.gry(y[n]));
            if ((grx!==nextx) || (gry!==nexty)) {
               if (grx===nextx) cmd += "v" + (nexty - gry); else
                  if (gry===nexty) cmd += "h" + (nextx - grx); else
                     cmd += "l" + (nextx - grx) + "," + (nexty - gry);
            }
            grx = nextx; gry = nexty;
         }

         cmd += "z";
      }

      return cmd;
   }

   TH2Painter.prototype.DrawPolyBinsColor = function(w,h) {
      var histo = this.GetObject(),
          pmain = this.main_painter(),
          colPaths = [], textbins = [],
          colindx, cmd, bin, item,
          i, len = histo.fBins.arr.length;

      // force recalculations of contours
      this.fContour = null;
      this.fCustomContour = false;

      // use global coordinates
      this.maxbin = this.gmaxbin;
      this.minbin = this.gminbin;
      this.minposbin = this.gminposbin;

      for (i = 0; i < len; ++ i) {
         bin = histo.fBins.arr[i];
         colindx = this.getContourColor(bin.fContent, true);
         if (colindx === null) continue;
         if ((bin.fContent === 0) && (this.options.Color === 11)) continue;

         // check if bin outside visible range
         if ((bin.fXmin > pmain.scale_xmax) || (bin.fXmax < pmain.scale_xmin) ||
             (bin.fYmin > pmain.scale_ymax) || (bin.fYmax < pmain.scale_ymin)) continue;

         cmd = this.CreatePolyBin(pmain, bin);

         if (colPaths[colindx] === undefined)
            colPaths[colindx] = cmd;
         else
            colPaths[colindx] += cmd;

         if (this.options.Text) textbins.push(bin);
      }

      for (colindx=0;colindx<colPaths.length;++colindx)
         if (colPaths[colindx]) {
            item = this.draw_g
                     .append("svg:path")
                     .attr("palette-index", colindx)
                     .attr("fill", this.fPalette.getColor(colindx))
                     .attr("d", colPaths[colindx]);
            if (this.options.Line)
               item.call(this.lineatt.func);
         }

      if (textbins.length > 0) {
         var text_col = this.get_color(histo.fMarkerColor),
             text_angle = (this.options.Text > 1000) ? -1*(this.options.Text % 1000) : 0,
             text_g = this.draw_g.append("svg:g").attr("class","th2poly_text"),
             text_size = 12;

         if ((histo.fMarkerSize!==1) && text_angle)
             text_size = Math.round(0.02*h*histo.fMarkerSize);

         this.StartTextDrawing(42, text_size, text_g, text_size);

         for (i = 0; i < textbins.length; ++ i) {
            bin = textbins[i];

            var posx = Math.round(pmain.x((bin.fXmin + bin.fXmax)/2)),
                posy = Math.round(pmain.y((bin.fYmin + bin.fYmax)/2)),
                lbl = "";

            if (this.options.Text < 1000) {
               lbl = (Math.round(bin.fContent) === bin.fContent) ? bin.fContent.toString() :
                          JSROOT.FFormat(bin.fContent, JSROOT.gStyle.fPaintTextFormat);
            } else {
               if (bin.fPoly) lbl = bin.fPoly.fName;
               if (lbl === "Graph") lbl = "";
               if (!lbl) lbl = bin.fNumber;
            }

            this.DrawText({ align: 22, x: posx, y: posy, rotate: text_angle, text: lbl, color: text_col, latex: 0, draw_g: text_g });
         }

         this.FinishTextDrawing(text_g, null);
      }

      return { poly: true };
   }

   TH2Painter.prototype.DrawBinsText = function(w, h, handle) {
      var histo = this.GetObject(),
          i,j,binz,colindx,binw,binh,lbl,posx,posy,sizex,sizey;

      if (handle===null) handle = this.PrepareColorDraw({ rounding: false });

      var text_col = this.get_color(histo.fMarkerColor),
          text_angle = (this.options.Text > 1000) ? -1*(this.options.Text % 1000) : 0,
          text_g = this.draw_g.append("svg:g").attr("class","th2_text"),
          text_size = 20, text_offset = 0;

      if ((histo.fMarkerSize!==1) && text_angle)
         text_size = Math.round(0.02*h*histo.fMarkerSize);

      if (histo.fBarOffset!==0) text_offset = histo.fBarOffset*1e-3;

      this.StartTextDrawing(42, text_size, text_g, text_size);

      for (i = handle.i1; i < handle.i2; ++i)
         for (j = handle.j1; j < handle.j2; ++j) {
            binz = histo.getBinContent(i+1, j+1);
            if ((binz === 0) && !this._show_empty_bins) continue;

            binw = handle.grx[i+1] - handle.grx[i];
            binh = handle.gry[j] - handle.gry[j+1];

            if ((this.options.Text >= 2000) && (this.options.Text < 3000) &&
                 this.MatchObjectType('TProfile2D') && (typeof histo.getBinEntries=='function'))
                   binz = histo.getBinEntries(i+1, j+1);

            lbl = (binz === Math.round(binz)) ? binz.toString() :
                      JSROOT.FFormat(binz, JSROOT.gStyle.fPaintTextFormat);

            if (text_angle /*|| (histo.fMarkerSize!==1)*/) {
               posx = Math.round(handle.grx[i] + binw*0.5);
               posy = Math.round(handle.gry[j+1] + binh*(0.5 + text_offset));
               sizex = 0;
               sizey = 0;
            } else {
               posx = Math.round(handle.grx[i] + binw*0.1);
               posy = Math.round(handle.gry[j+1] + binh*(0.1 + text_offset));
               sizex = Math.round(binw*0.8);
               sizey = Math.round(binh*0.8);
            }

            this.DrawText({ align: 22, x: posx, y: posy, width: sizex, height: sizey, rotate: text_angle, text: lbl, color: text_col, latex: 0, draw_g: text_g });
         }

      this.FinishTextDrawing(text_g, null);

      handle.hide_only_zeros = true; // text drawing suppress only zeros

      return handle;
   }

   TH2Painter.prototype.DrawBinsArrow = function(w, h) {
      var histo = this.GetObject(),
          i,j,binz,colindx,binw,binh,lbl, loop, dn = 1e-30, dx, dy, xc,yc,
          dxn,dyn,x1,x2,y1,y2, anr,si,co;

      var handle = this.PrepareColorDraw({ rounding: false });

      var scale_x  = (handle.grx[handle.i2] - handle.grx[handle.i1])/(handle.i2 - handle.i1 + 1-0.03)/2,
          scale_y  = (handle.gry[handle.j2] - handle.gry[handle.j1])/(handle.j2 - handle.j1 + 1-0.03)/2;

      var cmd = "";

      for (var loop=0;loop<2;++loop)
         for (i = handle.i1; i < handle.i2; ++i)
            for (j = handle.j1; j < handle.j2; ++j) {

               if (i === handle.i1) {
                  dx = histo.getBinContent(i+2, j+1) - histo.getBinContent(i+1, j+1);
               } else if (i === handle.i2-1) {
                  dx = histo.getBinContent(i+1, j+1) - histo.getBinContent(i, j+1);
               } else {
                  dx = 0.5*(histo.getBinContent(i+2, j+1) - histo.getBinContent(i, j+1));
               }
               if (j === handle.j1) {
                  dy = histo.getBinContent(i+1, j+2) - histo.getBinContent(i+1, j+1);
               } else if (j === handle.j2-1) {
                  dy = histo.getBinContent(i+1, j+1) - histo.getBinContent(i+1, j);
               } else {
                  dy = 0.5*(histo.getBinContent(i+1, j+2) - histo.getBinContent(i+1, j));
               }

               if (loop===0) {
                  dn = Math.max(dn, Math.abs(dx), Math.abs(dy));
               } else {
                  xc = (handle.grx[i] + handle.grx[i+1])/2;
                  yc = (handle.gry[j] + handle.gry[j+1])/2;
                  dxn = scale_x*dx/dn;
                  dyn = scale_y*dy/dn;
                  x1  = xc - dxn;
                  x2  = xc + dxn;
                  y1  = yc - dyn;
                  y2  = yc + dyn;
                  dx = Math.round(x2-x1);
                  dy = Math.round(y2-y1);

                  if ((dx!==0) || (dy!==0)) {
                     cmd += "M"+Math.round(x1)+","+Math.round(y1)+"l"+dx+","+dy;

                     if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                        anr = Math.sqrt(2/(dx*dx + dy*dy));
                        si  = Math.round(anr*(dx + dy));
                        co  = Math.round(anr*(dx - dy));
                        if ((si!==0) && (co!==0))
                           cmd+="l"+(-si)+","+co + "m"+si+","+(-co) + "l"+(-co)+","+(-si);
                     }
                  }
               }
            }

      this.draw_g
         .append("svg:path")
         .attr("class","th2_arrows")
         .attr("d", cmd)
         .style("fill", "none")
         .call(this.lineatt.func);

      return handle;
   }


   TH2Painter.prototype.DrawBinsBox = function(w,h) {

      var histo = this.GetObject(),
          handle = this.PrepareColorDraw({ rounding: false }),
          main = this.main_painter();

      if (main===this) {
         if (main.maxbin === main.minbin) {
            main.maxbin = main.gmaxbin;
            main.minbin = main.gminbin;
            main.minposbin = main.gminposbin;
         }
         if (main.maxbin === main.minbin)
            main.minbin = Math.min(0, main.maxbin-1);
      }

      var absmax = Math.max(Math.abs(main.maxbin), Math.abs(main.minbin)),
          absmin = Math.max(0, main.minbin),
          i, j, binz, absz, res = "", cross = "", btn1 = "", btn2 = "",
          colindx, zdiff, dgrx, dgry, xx, yy, ww, hh, cmd1, cmd2,
          xyfactor = 1, uselogz = false, logmin = 0, logmax = 1;

      if (this.root_pad().fLogz && (absmax>0)) {
         uselogz = true;
         logmax = Math.log(absmax);
         if (absmin>0) logmin = Math.log(absmin); else
         if ((main.minposbin>=1) && (main.minposbin<100)) logmin = Math.log(0.7); else
            logmin = (main.minposbin > 0) ? Math.log(0.7*main.minposbin) : logmax - 10;
         if (logmin >= logmax) logmin = logmax - 10;
         xyfactor = 1. / (logmax - logmin);
      } else {
         xyfactor = 1. / (absmax - absmin);
      }

      // now start build
      for (i = handle.i1; i < handle.i2; ++i) {
         for (j = handle.j1; j < handle.j2; ++j) {
            binz = histo.getBinContent(i + 1, j + 1);
            absz = Math.abs(binz);
            if ((absz === 0) || (absz < absmin)) continue;

            zdiff = uselogz ? ((absz>0) ? Math.log(absz) - logmin : 0) : (absz - absmin);
            // area of the box should be proportional to absolute bin content
            zdiff = 0.5 * ((zdiff < 0) ? 1 : (1 - Math.sqrt(zdiff * xyfactor)));
            // avoid oversized bins
            if (zdiff < 0) zdiff = 0;

            ww = handle.grx[i+1] - handle.grx[i];
            hh = handle.gry[j] - handle.gry[j+1];

            dgrx = zdiff * ww;
            dgry = zdiff * hh;

            xx = Math.round(handle.grx[i] + dgrx);
            yy = Math.round(handle.gry[j+1] + dgry);

            ww = Math.max(Math.round(ww - 2*dgrx), 1);
            hh = Math.max(Math.round(hh - 2*dgry), 1);

            res += "M"+xx+","+yy + "v"+hh + "h"+ww + "v-"+hh + "z";

            if ((binz<0) && (this.options.Box === 10))
               cross += "M"+xx+","+yy + "l"+ww+","+hh + "M"+(xx+ww)+","+yy + "l-"+ww+","+hh;

            if ((this.options.Box === 11) && (ww>5) && (hh>5)) {
               var pww = Math.round(ww*0.1),
                   phh = Math.round(hh*0.1),
                   side1 = "M"+xx+","+yy + "h"+ww + "l"+(-pww)+","+phh + "h"+(2*pww-ww) +
                           "v"+(hh-2*phh)+ "l"+(-pww)+","+phh + "z",
                   side2 = "M"+(xx+ww)+","+(yy+hh) + "v"+(-hh) + "l"+(-pww)+","+phh + "v"+(hh-2*phh)+
                           "h"+(2*pww-ww) + "l"+(-pww)+","+phh + "z";
               if (binz<0) { btn2+=side1; btn1+=side2; }
                      else { btn1+=side1; btn2+=side2; }
            }
         }
      }

      if (res.length > 0) {
        var elem = this.draw_g.append("svg:path")
                              .attr("d", res)
                              .call(this.fillatt.func);
        if ((this.options.Box === 11) || (this.fillatt.color !== 'none'))
           elem.style('stroke','none');
        else
           elem.call(this.lineatt.func);
      }

      if ((btn1.length>0) && (this.fillatt.color !== 'none'))
         this.draw_g.append("svg:path")
                    .attr("d", btn1)
                    .style("stroke","none")
                    .call(this.fillatt.func)
                    .style("fill", d3.rgb(this.fillatt.color).brighter(0.5).toString());

      if (btn2.length>0)
         this.draw_g.append("svg:path")
                    .attr("d", btn2)
                    .style("stroke","none")
                    .call(this.fillatt.func)
                    .style("fill", this.fillatt.color === 'none' ? 'red' : d3.rgb(this.fillatt.color).darker(0.5).toString());

      if (cross.length > 0) {
         var elem = this.draw_g.append("svg:path")
                               .attr("d", cross)
                               .style("fill", "none");
         if (this.lineatt.color !== 'none')
            elem.call(this.lineatt.func);
         else
            elem.style('stroke','black');
      }

      return handle;
   }

   TH2Painter.prototype.DrawCandle = function(w,h) {
      var histo = this.GetObject(),
          handle = this.PrepareColorDraw(),
          pad = this.root_pad(),
          pmain = this.main_painter(), // used for axis values conversions
          i, j, y, sum0, sum1, sum2, cont, center, counter, integral, w, pnt,
          bars = "", markers = "";

      // create attribute only when necessary
      if (!this.markeratt) {
         if (histo.fMarkerColor === 1) histo.fMarkerColor = histo.fLineColor;
         this.markeratt = new JSROOT.TAttMarkerHandler(histo, 5);
      }

      // reset absolution position for markers
      this.markeratt.reset_pos();

      handle.candle = []; // array of drawn points

      // loop over visible x-bins
      for (i = handle.i1; i < handle.i2; ++i) {
         sum1 = 0;
         //estimate integral
         integral = 0;
         counter = 0;
         for (j = 0; j < this.nbinsy; ++j) {
            integral += histo.getBinContent(i+1,j+1);
         }
         pnt = { bin:i, meany:0, m25y:0, p25y:0, median:0, iqr:0, whiskerp:0, whiskerm:0};
         //estimate quantiles... simple function... not so nice as GetQuantiles
         for (j = 0; j < this.nbinsy; ++j) {
            cont = histo.getBinContent(i+1,j+1);
            if (counter/integral < 0.001 && (counter + cont)/integral >=0.001) pnt.whiskerm = this.GetBinY(j + 0.5); // Lower whisker
            if (counter/integral < 0.25 && (counter + cont)/integral >=0.25) pnt.m25y = this.GetBinY(j + 0.5); // Lower edge of box
            if (counter/integral < 0.5 && (counter + cont)/integral >=0.5) pnt.median = this.GetBinY(j + 0.5); //Median
            if (counter/integral < 0.75 && (counter + cont)/integral >=0.75) pnt.p25y = this.GetBinY(j + 0.5); //Upper edge of box
            if (counter/integral < 0.999 && (counter + cont)/integral >=0.999) pnt.whiskerp = this.GetBinY(j + 0.5); // Upper whisker
            counter += cont;
            y = this.GetBinY(j + 0.5); // center of y bin coordinate
            sum1 += cont*y;
         }
         if (counter > 0) {
            pnt.meany = sum1/counter;
         }
         pnt.iqr = pnt.p25y-pnt.m25y;

         //Whiskers cannot exceed 1.5*iqr from box
         if ((pnt.m25y-1.5*pnt.iqr) > pnt.whsikerm)  {
            pnt.whiskerm = pnt.m25y-1.5*pnt.iqr;
         }
         if ((pnt.p25y+1.5*pnt.iqr) < pnt.whiskerp) {
            pnt.whiskerp = pnt.p25y+1.5*pnt.iqr;
         }

         // exclude points with negative y when log scale is specified
         if (pmain.logy && (pnt.whiskerm<=0)) continue;

         w = handle.grx[i+1] - handle.grx[i];
         w *= 0.66;
         center = (handle.grx[i+1] + handle.grx[i]) / 2 + histo.fBarOffset/1000*w;
         if (histo.fBarWidth>0) w = w * histo.fBarWidth / 1000;

         pnt.x1 = Math.round(center - w/2);
         pnt.x2 = Math.round(center + w/2);
         center = Math.round(center);

         pnt.y0 = Math.round(pmain.gry(pnt.median));
         // mean line
         bars += "M" + pnt.x1 + "," + pnt.y0 + "h" + (pnt.x2-pnt.x1);

         pnt.y1 = Math.round(pmain.gry(pnt.p25y));
         pnt.y2 = Math.round(pmain.gry(pnt.m25y));

         // rectangle
         bars += "M" + pnt.x1 + "," + pnt.y1 +
         "v" + (pnt.y2-pnt.y1) + "h" + (pnt.x2-pnt.x1) + "v-" + (pnt.y2-pnt.y1) + "z";

         pnt.yy1 = Math.round(pmain.gry(pnt.whiskerp));
         pnt.yy2 = Math.round(pmain.gry(pnt.whiskerm));

         // upper part
         bars += "M" + center + "," + pnt.y1 + "v" + (pnt.yy1-pnt.y1);
         bars += "M" + pnt.x1 + "," + pnt.yy1 + "h" + (pnt.x2-pnt.x1);

         // lower part
         bars += "M" + center + "," + pnt.y2 + "v" + (pnt.yy2-pnt.y2);
         bars += "M" + pnt.x1 + "," + pnt.yy2 + "h" + (pnt.x2-pnt.x1);

         //estimate outliers
         for (j = 0; j < this.nbinsy; ++j) {
            cont = histo.getBinContent(i+1,j+1);
            if (cont > 0 && this.GetBinY(j + 0.5) < pnt.whiskerm) markers += this.markeratt.create(center, this.GetBinY(j + 0.5));
            if (cont > 0 && this.GetBinY(j + 0.5) > pnt.whiskerp) markers += this.markeratt.create(center, this.GetBinY(j + 0.5));
         }

         handle.candle.push(pnt); // keep point for the tooltip
      }

      if (bars.length > 0)
         this.draw_g.append("svg:path")
             .attr("d", bars)
             .call(this.lineatt.func)
             .call(this.fillatt.func);

      if (markers.length > 0)
         this.draw_g.append("svg:path")
             .attr("d", markers)
             .call(this.markeratt.func);

      return handle;
   }

   TH2Painter.prototype.DrawBinsScatter = function(w,h) {
      var histo = this.GetObject(),
          handle = this.PrepareColorDraw({ rounding: true, pixel_density: true }),
          colPaths = [], currx = [], curry = [], cell_w = [], cell_h = [],
          colindx, cmd1, cmd2, i, j, binz, cw, ch, factor = 1.,
          scale = this.options.ScatCoef * ((this.gmaxbin) > 2000 ? 2000. / this.gmaxbin : 1.);

      if (scale*handle.sumz < 1e5) {
         // one can use direct drawing of scatter plot without any patterns

         if (!this.markeratt)
            this.markeratt = new JSROOT.TAttMarkerHandler(histo);

         this.markeratt.reset_pos();

         var path = "", k, npix;
         for (i = handle.i1; i < handle.i2; ++i) {
            cw = handle.grx[i+1] - handle.grx[i];
            for (j = handle.j1; j < handle.j2; ++j) {
               ch = handle.gry[j] - handle.gry[j+1];
               binz = histo.getBinContent(i + 1, j + 1);

               npix = Math.round(scale*binz);
               if (npix<=0) continue;

               for (k=0;k<npix;++k)
                  path += this.markeratt.create(
                            Math.round(handle.grx[i] + cw * Math.random()),
                            Math.round(handle.gry[j+1] + ch * Math.random()));
            }
         }

         this.draw_g
              .append("svg:path")
              .attr("d", path)
              .call(this.markeratt.func);

         return handle;
      }

      // limit filling factor, do not try to produce as many points as filled area;
      if (this.maxbin > 0.7) factor = 0.7/this.maxbin;

      var nlevels = Math.round(handle.max - handle.min);
      this.CreateContour((nlevels > 50) ? 50 : nlevels, this.minposbin, this.maxbin, this.minposbin);

      // now start build
      for (i = handle.i1; i < handle.i2; ++i) {
         for (j = handle.j1; j < handle.j2; ++j) {
            binz = histo.getBinContent(i + 1, j + 1);
            if ((binz <= 0) || (binz < this.minbin)) continue;

            cw = handle.grx[i+1] - handle.grx[i];
            ch = handle.gry[j] - handle.gry[j+1];
            if (cw*ch <= 0) continue;

            colindx = this.getContourIndex(binz/cw/ch);
            if (colindx < 0) continue;

            cmd1 = "M"+handle.grx[i]+","+handle.gry[j+1];
            if (colPaths[colindx] === undefined) {
               colPaths[colindx] = cmd1;
               cell_w[colindx] = cw;
               cell_h[colindx] = ch;
            } else{
               cmd2 = "m" + (handle.grx[i]-currx[colindx]) + "," + (handle.gry[j+1] - curry[colindx]);
               colPaths[colindx] += (cmd2.length < cmd1.length) ? cmd2 : cmd1;
               cell_w[colindx] = Math.max(cell_w[colindx], cw);
               cell_h[colindx] = Math.max(cell_h[colindx], ch);
            }

            currx[colindx] = handle.grx[i];
            curry[colindx] = handle.gry[j+1];

            colPaths[colindx] += "v"+ch+"h"+cw+"v-"+ch+"z";
         }
      }

      var layer = this.svg_frame().select('.main_layer'),
          defs = layer.select("defs");
      if (defs.empty() && (colPaths.length>0))
         defs = layer.insert("svg:defs",":first-child");

      if (!this.markeratt)
         this.markeratt = new JSROOT.TAttMarkerHandler(histo);

      for (colindx=0;colindx<colPaths.length;++colindx)
        if ((colPaths[colindx] !== undefined) && (colindx<this.fContour.length)) {
           var pattern_class = "scatter_" + colindx,
               pattern = defs.select('.' + pattern_class);
           if (pattern.empty())
              pattern = defs.append('svg:pattern')
                            .attr("class", pattern_class)
                            .attr("id", "jsroot_scatter_pattern_" + JSROOT.id_counter++)
                            .attr("patternUnits","userSpaceOnUse");
           else
              pattern.selectAll("*").remove();

           var npix = Math.round(factor*this.fContour[colindx]*cell_w[colindx]*cell_h[colindx]);
           if (npix<1) npix = 1;

           var arrx = new Float32Array(npix), arry = new Float32Array(npix);

           if (npix===1) {
              arrx[0] = arry[0] = 0.5;
           } else {
              for (var n=0;n<npix;++n) {
                 arrx[n] = Math.random();
                 arry[n] = Math.random();
              }
           }

           // arrx.sort();

           this.markeratt.reset_pos();

           var path = "";

           for (var n=0;n<npix;++n)
              path += this.markeratt.create(arrx[n] * cell_w[colindx], arry[n] * cell_h[colindx]);

           pattern.attr("width", cell_w[colindx])
                  .attr("height", cell_h[colindx])
                  .append("svg:path")
                  .attr("d",path)
                  .call(this.markeratt.func);

           this.draw_g
               .append("svg:path")
               .attr("scatter-index", colindx)
               .attr("fill", 'url(#' + pattern.attr("id") + ')')
               .attr("d", colPaths[colindx]);
        }

      return handle;
   }

   TH2Painter.prototype.DrawBins = function() {

      this.CheckHistDrawAttributes();

      this.CreateG(true);

      var w = this.frame_width(),
          h = this.frame_height(),
          handle = null;

      // if (this.lineatt.color == 'none') this.lineatt.color = 'cyan';

      if (this.options.Color + this.options.Box + this.options.Scat + this.options.Text +
          this.options.Contour + this.options.Arrow + this.options.Candle.length == 0)
         this.options.Scat = 1;

      if (this.draw_content)
      if (this.IsTH2Poly())
         handle = this.DrawPolyBinsColor(w, h);
      else
      if (this.options.Color > 0)
         handle = this.DrawBinsColor(w, h);
      else
      if (this.options.Scat > 0)
         handle = this.DrawBinsScatter(w, h);
      else
      if (this.options.Box > 0)
         handle = this.DrawBinsBox(w, h);
      else
      if (this.options.Arrow > 0)
         handle = this.DrawBinsArrow(w,h);
      else
      if (this.options.Contour > 0)
         handle = this.DrawBinsContour(w,h);
      else
      if (this.options.Candle.length > 0)
         handle = this.DrawCandle(w, h);

      if (this.options.Text > 0)
         handle = this.DrawBinsText(w, h, handle);

      this.tt_handle = handle;
   }

   TH2Painter.prototype.GetBinTips = function (i, j) {
      var lines = [], pmain = this.main_painter();

      lines.push(this.GetTipName());

      if (pmain.x_kind == 'labels')
         lines.push("x = " + pmain.AxisAsText("x", this.GetBinX(i)));
      else
         lines.push("x = [" + pmain.AxisAsText("x", this.GetBinX(i)) + ", " + pmain.AxisAsText("x", this.GetBinX(i+1)) + ")");

      if (pmain.y_kind == 'labels')
         lines.push("y = " + pmain.AxisAsText("y", this.GetBinY(j)));
      else
         lines.push("y = [" + pmain.AxisAsText("y", this.GetBinY(j)) + ", " + pmain.AxisAsText("y", this.GetBinY(j+1)) + ")");

      lines.push("bin = " + i + ", " + j);

      var histo = this.GetObject(),
          binz = histo.getBinContent(i+1,j+1);
      if (histo.$baseh) binz -= histo.$baseh.getBinContent(i+1,j+1);

      if (binz === Math.round(binz))
         lines.push("entries = " + binz);
      else
         lines.push("entries = " + JSROOT.FFormat(binz, JSROOT.gStyle.fStatFormat));

      return lines;
   }

   TH2Painter.prototype.GetCandleTips = function(p) {
      var lines = [], main = this.main_painter();

      lines.push(this.GetTipName());

      lines.push("x = " + main.AxisAsText("x", this.GetBinX(p.bin)));
      // lines.push("x = [" + main.AxisAsText("x", this.GetBinX(p.bin)) + ", " + main.AxisAsText("x", this.GetBinX(p.bin+1)) + ")");

      lines.push('mean y = ' + JSROOT.FFormat(p.meany, JSROOT.gStyle.fStatFormat))
      lines.push('m25 = ' + JSROOT.FFormat(p.m25y, JSROOT.gStyle.fStatFormat))
      lines.push('p25 = ' + JSROOT.FFormat(p.p25y, JSROOT.gStyle.fStatFormat))

      return lines;
   }

   TH2Painter.prototype.ProvidePolyBinHints = function(binindx, realx, realy) {

      var bin = this.histo.fBins.arr[binindx],
          pmain = this.main_painter(),
          binname = bin.fPoly.fName,
          lines = [], numpoints = 0;

      if (binname === "Graph") binname = "";
      if (binname.length === 0) binname = bin.fNumber;

      if ((realx===undefined) && (realy===undefined)) {
         realx = realy = 0;
         var gr = bin.fPoly, numgraphs = 1;
         if (gr._typename === 'TMultiGraph') { numgraphs = bin.fPoly.fGraphs.arr.length; gr = null; }

         for (var ngr=0;ngr<numgraphs;++ngr) {
            if (!gr || (ngr>0)) gr = bin.fPoly.fGraphs.arr[ngr];

            for (n=0;n<gr.fNpoints;++n) {
               ++numpoints;
               realx += gr.fX[n];
               realy += gr.fY[n];
            }
         }

         if (numpoints > 1) {
            realx = realx / numpoints;
            realy = realy / numpoints;
         }
      }

      lines.push(this.GetTipName());
      lines.push("x = " + pmain.AxisAsText("x", realx));
      lines.push("y = " + pmain.AxisAsText("y", realy));
      if (numpoints > 0) lines.push("npnts = " + numpoints);
      lines.push("bin = " + binname);
      if (bin.fContent === Math.round(bin.fContent))
         lines.push("content = " + bin.fContent);
      else
         lines.push("content = " + JSROOT.FFormat(bin.fContent, JSROOT.gStyle.fStatFormat));
      return lines;
   }

   TH2Painter.prototype.ProcessTooltip = function(pnt) {
      if (!pnt || !this.draw_content || !this.draw_g || !this.tt_handle || this.options.Proj) {
         if (this.draw_g !== null)
            this.draw_g.select(".tooltip_bin").remove();
         this.ProvideUserTooltip(null);
         return null;
      }

      var histo = this.GetObject(),
          h = this.tt_handle, i,
          ttrect = this.draw_g.select(".tooltip_bin");

      if (h.poly) {
         // process tooltips from TH2Poly

         var pmain = this.main_painter(),
             realx, realy, foundindx = -1;

         if (pmain.grx === pmain.x) realx = pmain.x.invert(pnt.x);
         if (pmain.gry === pmain.y) realy = pmain.y.invert(pnt.y);

         if ((realx!==undefined) && (realy!==undefined)) {
            var i, len = histo.fBins.arr.length, bin;

            for (i = 0; (i < len) && (foundindx < 0); ++ i) {
               bin = histo.fBins.arr[i];

               // found potential bins candidate
               if ((realx < bin.fXmin) || (realx > bin.fXmax) ||
                    (realy < bin.fYmin) || (realy > bin.fYmax)) continue;

               // ignore empty bins with col0 option
               if ((bin.fContent === 0) && (this.options.Color === 11)) continue;

               var gr = bin.fPoly, numgraphs = 1;
               if (gr._typename === 'TMultiGraph') { numgraphs = bin.fPoly.fGraphs.arr.length; gr = null; }

               for (var ngr=0;ngr<numgraphs;++ngr) {
                  if (!gr || (ngr>0)) gr = bin.fPoly.fGraphs.arr[ngr];
                  if (gr.IsInside(realx,realy)) {
                     foundindx = i;
                     break;
                  }
               }
            }
         }

         if (foundindx < 0) {
            ttrect.remove();
            this.ProvideUserTooltip(null);
            return null;
         }

         var res = { name: histo.fName, title: histo.fTitle,
                     x: pnt.x, y: pnt.y,
                     color1: this.lineatt ? this.lineatt.color : 'green',
                     color2: this.fillatt ? this.fillatt.color : 'blue',
                     exact: true, menu: true,
                     lines: this.ProvidePolyBinHints(foundindx, realx, realy) };

         if (pnt.disabled) {
            ttrect.remove();
            res.changed = true;
         } else {

            if (ttrect.empty())
               ttrect = this.draw_g.append("svg:path")
                            .attr("class","tooltip_bin h1bin")
                            .style("pointer-events","none");

            res.changed = ttrect.property("current_bin") !== foundindx;

            if (res.changed)
                  ttrect.attr("d", this.CreatePolyBin(pmain, bin))
                        .style("opacity", "0.7")
                        .property("current_bin", foundindx);
         }

         if (this.IsUserTooltipCallback() && res.changed)
            this.ProvideUserTooltip({ obj: histo,  name: histo.fName,
                                      bin: foundindx,
                                      cont: bin.fContent,
                                      grx: pnt.x, gry: pnt.y });

         return res;

      } else

      if (h.candle) {
         // process tooltips for candle

         var p;

         for (i=0;i<h.candle.length;++i) {
            p = h.candle[i];
            if ((p.x1 <= pnt.x) && (pnt.x <= p.x2) && (p.yy1 <= pnt.y) && (pnt.y <= p.yy2)) break;
         }

         if (i>=h.candle.length) {
            ttrect.remove();
            this.ProvideUserTooltip(null);
            return null;
         }

         var res = { name: histo.fName, title: histo.fTitle,
                     x: pnt.x, y: pnt.y,
                     color1: this.lineatt ? this.lineatt.color : 'green',
                     color2: this.fillatt ? this.fillatt.color : 'blue',
                     lines: this.GetCandleTips(p), exact: true, menu: true };

         if (pnt.disabled) {
            ttrect.remove();
            res.changed = true;
         } else {

            if (ttrect.empty())
               ttrect = this.draw_g.append("svg:rect")
                                   .attr("class","tooltip_bin h1bin")
                                   .style("pointer-events","none");

            res.changed = ttrect.property("current_bin") !== i;

            if (res.changed)
               ttrect.attr("x", p.x1)
                     .attr("width", p.x2-p.x1)
                     .attr("y", p.yy1)
                     .attr("height", p.yy2- p.yy1)
                     .style("opacity", "0.7")
                     .property("current_bin", i);
         }

         if (this.IsUserTooltipCallback() && res.changed) {
            this.ProvideUserTooltip({ obj: histo,  name: histo.fName,
                                      bin: i+1, cont: p.median, binx: i+1, biny: 1,
                                      grx: pnt.x, gry: pnt.y });
         }

         return res;
      }

      var i, j, binz = 0, colindx = null;

      // search bins position
      for (i = h.i1; i < h.i2; ++i)
         if ((pnt.x>=h.grx[i]) && (pnt.x<=h.grx[i+1])) break;

      for (j = h.j1; j < h.j2; ++j)
         if ((pnt.y>=h.gry[j+1]) && (pnt.y<=h.gry[j])) break;

      if ((i < h.i2) && (j < h.j2)) {
         binz = histo.getBinContent(i+1,j+1);
         if (this.is_projection) {
            colindx = 0; // just to avoid hide
         } else if (h.hide_only_zeros) {
            colindx = (binz === 0) && !this._show_empty_bins ? null : 0;
         } else {
            colindx = this.getContourColor(binz, true);
            if ((colindx === null) && (binz === 0) && this._show_empty_bins) colindx = 0;
         }
      }

      if (colindx === null) {
         ttrect.remove();
         this.ProvideUserTooltip(null);
         return null;
      }

      var res = { name: histo.fName, title: histo.fTitle,
                  x: pnt.x, y: pnt.y,
                  color1: this.lineatt ? this.lineatt.color : 'green',
                  color2: this.fillatt ? this.fillatt.color : 'blue',
                  lines: this.GetBinTips(i, j), exact: true, menu: true };

      if (this.options.Color > 0) res.color2 = this.GetPalette().getColor(colindx);

      if (pnt.disabled && !this.is_projection) {
         ttrect.remove();
         res.changed = true;
      } else {
         if (ttrect.empty())
            ttrect = this.draw_g.append("svg:rect")
                                .attr("class","tooltip_bin h1bin")
                                .style("pointer-events","none");

         var i1 = i, i2 = i+1,
             j1 = j, j2 = j+1,
             x1 = h.grx[i1], x2 = h.grx[i2],
             y1 = h.gry[j2], y2 = h.gry[j1],
             binid = i*10000 + j;

         if (this.is_projection == "X") {
            x1 = 0; x2 = this.frame_width();
            if (this.projection_width > 1) {
               var dd = (this.projection_width-1)/2;
               if (j2+dd >= h.j2) { j2 = Math.min(Math.round(j2+dd), h.j2); j1 = Math.max(j2 - this.projection_width, h.j1); }
                             else { j1 = Math.max(Math.round(j1-dd), h.j1); j2 = Math.min(j1 + this.projection_width, h.j2); }
            }
            y1 = h.gry[j2]; y2 = h.gry[j1];
            binid = j1*777 + j2*333;
         } else if (this.is_projection == "Y") {
            y1 = 0; y2 = this.frame_height();
            if (this.projection_width > 1) {
               var dd = (this.projection_width-1)/2;
               if (i2+dd >= h.i2) { i2 = Math.min(Math.round(i2+dd), h.i2); i1 = Math.max(i2 - this.projection_width, h.i1); }
                             else { i1 = Math.max(Math.round(i1-dd), h.i1); i2 = Math.min(i1 + this.projection_width, h.i2); }
            }
            x1 = h.grx[i1], x2 = h.grx[i2],
            binid = i1*777 + i2*333;
         }

         res.changed = ttrect.property("current_bin") !== binid;

         if (res.changed)
            ttrect.attr("x", x1)
                  .attr("width", x2 - x1)
                  .attr("y", y1)
                  .attr("height", y2 - y1)
                  .style("opacity", "0.7")
                  .property("current_bin", binid);

         if (this.is_projection && res.changed)
            this.RedrawProjection(i1, i2, j1, j2);
      }

      if (this.IsUserTooltipCallback() && res.changed)
         this.ProvideUserTooltip({ obj: histo, name: histo.fName,
                                   bin: histo.getBin(i+1, j+1), cont: binz, binx: i+1, biny: j+1,
                                   grx: pnt.x, gry: pnt.y });

      return res;
   }

   TH2Painter.prototype.CanZoomIn = function(axis,min,max) {
      // check if it makes sense to zoom inside specified axis range
      if ((axis=="x") && (this.GetIndexX(max,0.5) - this.GetIndexX(min,0) > 1)) return true;

      if ((axis=="y") && (this.GetIndexY(max,0.5) - this.GetIndexY(min,0) > 1)) return true;

      if (axis=="z") return true;

      return false;
   }

   TH2Painter.prototype.Draw2D = function(call_back, resize) {

      this.mode3d = false;

      if (typeof this.Create3DScene == 'function')
         this.Create3DScene(-1);

      this.CreateXY();

      // draw new palette, resize frame if required
      var pp = this.DrawColorPalette((this.options.Zscale > 0) && ((this.options.Color > 0) || (this.options.Contour > 0)), true);

      this.DrawAxes();

      this.DrawGrids();

      this.DrawBins();

      // redraw palette till the end when contours are available
      if (pp) pp.DrawPave();

      this.DrawTitle();

      this.UpdateStatWebCanvas();

      this.AddInteractive();

      JSROOT.CallBack(call_back);
   }

   TH2Painter.prototype.Draw3D = function(call_back, resize) {
      this.mode3d = true;
      JSROOT.AssertPrerequisites('hist3d', function() {
         this.Draw3D(call_back, resize);
      }.bind(this));
   }

   TH2Painter.prototype.CallDrawFunc = function(callback, resize) {

      var main = this.main_painter(), is3d = false;

      if ((this.options.Contour > 0) && (main !== this)) is3d = main.mode3d; else
      if ((this.options.Lego > 0) || (this.options.Surf > 0) || (this.options.Error > 0)) is3d = true;

      if ((main!==this) && (is3d !== main.mode3d)) {
         is3d = main.mode3d;

         this.options.Lego = main.options.Lego;
         this.options.Surf = main.options.Surf;
         this.options.Error = main.options.Error;
      }

      var funcname = is3d ? "Draw3D" : "Draw2D";

      this[funcname](callback, resize);
   }

   TH2Painter.prototype.Redraw = function(resize) {
      this.CallDrawFunc(null, resize);
   }

   function drawHist2(divid, histo, opt) {
      // create painter and add it to canvas
      var painter = new TH2Painter(histo);

      painter.SetDivId(divid, 1);

      // here we deciding how histogram will look like and how will be shown
      // painter.options = painter.DecodeOptions(opt);

      // if (painter.IsTH2Poly()) {
      //   if (painter.options.Lego) painter.options.Lego = 12; else // and lego always 12
      //   if (!painter.options.Color) painter.options.Color = 1; // default color
      // }

      painter._show_empty_bins = false;

      painter._can_move_colz = true;

      // special case for root 3D drawings - user range is wired
      // if ((painter.options.Contour !==14) && !painter.options.Lego && !painter.options.Surf)
      //   painter.CheckPadRange();

      painter.ScanContent();

      painter.CreateStat(); // only when required

      painter.CallDrawFunc(function() {
         //if ((this.options.Lego <= 0) && (this.options.Surf <= 0)) {
         //   if (this.options.AutoZoom) this.AutoZoom();
         //}
         // this.FillToolbar();
         //if (this.options.Project && !this.mode3d)
         //   this.ToggleProjection(this.options.Project);
         painter.DrawingReady();
      });

      return painter;
   }
   
   JSROOT.v7.THistPainter = THistPainter;
   JSROOT.v7.TH1Painter = TH1Painter;
   JSROOT.v7.TH2Painter = TH2Painter;

   JSROOT.v7.drawHist1 = drawHist1;
   JSROOT.v7.drawHist2 = drawHist2;
   
   return JSROOT;

}));
