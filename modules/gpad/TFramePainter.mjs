/// TCanvas painting

import { gStyle, settings, extend, isBatchMode } from '../core.mjs';

import { pointer as d3_pointer } from '../d3.mjs';

import { ObjectPainter } from '../base/ObjectPainter.mjs';

import { getSvgLineStyle } from '../base/TAttLineHandler.mjs';

import { EAxisBits, TAxisPainter } from './TAxisPainter.mjs';

/**
 * @summary Painter class for TFrame, main handler for interactivity
 */

class TFramePainter extends ObjectPainter {

   /** @summary constructor
     * @param {object|string} dom - DOM element for drawing or element id
     * @param {object} tframe - TFrame object */

   constructor(dom, tframe) {
      super(dom, (tframe && tframe.$dummy) ? null : tframe);
      this.zoom_kind = 0;
      this.mode3d = false;
      this.shrink_frame_left = 0.;
      this.xmin = this.xmax = 0; // no scale specified, wait for objects drawing
      this.ymin = this.ymax = 0; // no scale specified, wait for objects drawing
      this.ranges_set = false;
      this.axes_drawn = false;
      this.keys_handler = null;
      this.projection = 0; // different projections
   }

   /** @summary Returns frame painter - object itself */
   getFramePainter() { return this; }

   /** @summary Returns true if it is ROOT6 frame
     * @private */
   is_root6() { return true; }

   /** @summary Returns frame or sub-objects, used in GED editor */
   getObject(place) {
      if (place === "xaxis") return this.xaxis;
      if (place === "yaxis") return this.yaxis;
      return super.getObject();
   }

   /** @summary Set active flag for frame - can block some events
     * @private */
   setFrameActive(on) {
      this.enabledKeys = on && settings.HandleKeys ? true : false;
      // used only in 3D mode where control is used
      if (this.control)
         this.control.enableKeys = this.enabledKeys;
   }

   /** @summary Shrink frame size
     * @private */
   shrinkFrame(shrink_left, shrink_right) {
      this.fX1NDC += shrink_left;
      this.fX2NDC -= shrink_right;
   }

   /** @summary Set position of last context menu event */
   setLastEventPos(pnt) {
      this.fLastEventPnt = pnt;
   }

   /** @summary Return position of last event
     * @private */
   getLastEventPos() { return this.fLastEventPnt; }

   /** @summary Returns coordinates transformation func */
   getProjectionFunc() {
      switch (this.projection) {
         // Aitoff2xy
         case 1: return (l, b) => {
            const DegToRad = Math.PI/180,
                  alpha2 = (l/2)*DegToRad,
                  delta  = b*DegToRad,
                  r2     = Math.sqrt(2),
                  f      = 2*r2/Math.PI,
                  cdec   = Math.cos(delta),
                  denom  = Math.sqrt(1. + cdec*Math.cos(alpha2));
            return {
               x: cdec*Math.sin(alpha2)*2.*r2/denom/f/DegToRad,
               y: Math.sin(delta)*r2/denom/f/DegToRad
            };
         };
         // mercator
         case 2: return (l, b) => { return { x: l, y: Math.log(Math.tan((Math.PI/2 + b/180*Math.PI)/2)) }; };
         // sinusoidal
         case 3: return (l, b) => { return { x: l*Math.cos(b/180*Math.PI), y: b } };
         // parabolic
         case 4: return (l, b) => { return { x: l*(2.*Math.cos(2*b/180*Math.PI/3) - 1), y: 180*Math.sin(b/180*Math.PI/3) }; };
      }
   }

   /** @summary Rcalculate frame ranges using specified projection functions */
   recalculateRange(Proj) {
      this.projection = Proj || 0;

      if ((this.projection == 2) && ((this.scale_ymin <= -90 || this.scale_ymax >=90))) {
         console.warn("Mercator Projection", "Latitude out of range", this.scale_ymin, this.scale_ymax);
         this.projection = 0;
      }

      let func = this.getProjectionFunc();
      if (!func) return;

      let pnts = [ func(this.scale_xmin, this.scale_ymin),
                   func(this.scale_xmin, this.scale_ymax),
                   func(this.scale_xmax, this.scale_ymax),
                   func(this.scale_xmax, this.scale_ymin) ];
      if (this.scale_xmin<0 && this.scale_xmax>0) {
         pnts.push(func(0, this.scale_ymin));
         pnts.push(func(0, this.scale_ymax));
      }
      if (this.scale_ymin<0 && this.scale_ymax>0) {
         pnts.push(func(this.scale_xmin, 0));
         pnts.push(func(this.scale_xmax, 0));
      }

      this.original_xmin = this.scale_xmin;
      this.original_xmax = this.scale_xmax;
      this.original_ymin = this.scale_ymin;
      this.original_ymax = this.scale_ymax;

      this.scale_xmin = this.scale_xmax = pnts[0].x;
      this.scale_ymin = this.scale_ymax = pnts[0].y;

      for (let n = 1; n < pnts.length; ++n) {
         this.scale_xmin = Math.min(this.scale_xmin, pnts[n].x);
         this.scale_xmax = Math.max(this.scale_xmax, pnts[n].x);
         this.scale_ymin = Math.min(this.scale_ymin, pnts[n].y);
         this.scale_ymax = Math.max(this.scale_ymax, pnts[n].y);
      }
   }

   /** @summary Configure frame axes ranges */
   setAxesRanges(xaxis, xmin, xmax, yaxis, ymin, ymax, zaxis, zmin, zmax) {
      this.ranges_set = true;

      this.xaxis = xaxis;
      this.xmin = xmin;
      this.xmax = xmax;

      this.yaxis = yaxis;
      this.ymin = ymin;
      this.ymax = ymax;

      this.zaxis = zaxis;
      this.zmin = zmin;
      this.zmax = zmax;
   }

   /** @summary Configure secondary frame axes ranges */
   setAxes2Ranges(second_x, xaxis, xmin, xmax, second_y, yaxis, ymin, ymax) {
      if (second_x) {
         this.x2axis = xaxis;
         this.x2min = xmin;
         this.x2max = xmax;
      }
      if (second_y) {
         this.y2axis = yaxis;
         this.y2min = ymin;
         this.y2max = ymax;
      }
   }

   /** @summary Retuns associated axis object */
   getAxis(name) {
      switch(name) {
         case "x": return this.xaxis;
         case "y": return this.yaxis;
         case "z": return this.zaxis;
         case "x2": return this.x2axis;
         case "y2": return this.y2axis;
      }
      return null;
   }

   /** @summary Apply axis zooming from pad user range
     * @private */
   applyPadUserRange(pad, name) {
      if (!pad) return;

      // seems to be, not allways user range calculated
      let umin = pad['fU' + name + 'min'],
          umax = pad['fU' + name + 'max'],
          eps = 1e-7;

      if (name == "x") {
         if ((Math.abs(pad.fX1) > eps) || (Math.abs(pad.fX2-1) > eps)) {
            let dx = pad.fX2 - pad.fX1;
            umin = pad.fX1 + dx*pad.fLeftMargin;
            umax = pad.fX2 - dx*pad.fRightMargin;
         }
      } else {
         if ((Math.abs(pad.fY1) > eps) || (Math.abs(pad.fY2-1) > eps)) {
            let dy = pad.fY2 - pad.fY1;
            umin = pad.fY1 + dy*pad.fBottomMargin;
            umax = pad.fY2 - dy*pad.fTopMargin;
         }
      }

      if ((umin >= umax) || (Math.abs(umin) < eps && Math.abs(umax-1) < eps)) return;

      if (pad['fLog' + name] > 0) {
         umin = Math.exp(umin * Math.log(10));
         umax = Math.exp(umax * Math.log(10));
      }

      let aname = name;
      if (this.swap_xy) aname = (name=="x") ? "y" : "x";
      let smin = 'scale_' + aname + 'min',
          smax = 'scale_' + aname + 'max';

      eps = (this[smax] - this[smin]) * 1e-7;

      if ((Math.abs(umin - this[smin]) > eps) || (Math.abs(umax - this[smax]) > eps)) {
         this["zoom_" + aname + "min"] = umin;
         this["zoom_" + aname + "max"] = umax;
      }
   }

   /** @summary Create x,y objects which maps user coordinates into pixels
     * @desc While only first painter really need such object, all others just reuse it
     * following functions are introduced
     *    this.GetBin[X/Y]  return bin coordinate
     *    this.[x,y]  these are d3.scale objects
     *    this.gr[x,y]  converts root scale into graphical value
     * @private */
   createXY(opts) {

      this.cleanXY(); // remove all previous configurations

      if (!opts) opts = { ndim: 1 };

      this.swap_xy = opts.swap_xy || false;
      this.reverse_x = opts.reverse_x || false;
      this.reverse_y = opts.reverse_y || false;

      this.logx = this.logy = 0;

      let w = this.getFrameWidth(), h = this.getFrameHeight(),
          pp = this.getPadPainter(),
          pad = pp.getRootPad();

      this.scale_xmin = this.xmin;
      this.scale_xmax = this.xmax;

      this.scale_ymin = this.ymin;
      this.scale_ymax = this.ymax;

      if (opts.extra_y_space) {
         let log_scale = this.swap_xy ? pad.fLogx : pad.fLogy;
         if (log_scale && (this.scale_ymax > 0))
            this.scale_ymax = Math.exp(Math.log(this.scale_ymax)*1.1);
         else
            this.scale_ymax += (this.scale_ymax - this.scale_ymin)*0.1;
      }

      if (opts.check_pad_range) {
         // take zooming out of pad or axis attributes

         const applyAxisZoom = name => {
            if (this.zoomChangedInteractive(name)) return;
            this[`zoom_${name}min`] = this[`zoom_${name}max`] = 0;

            const axis = this.getAxis(name);

            if (axis && axis.TestBit(EAxisBits.kAxisRange)) {
               if ((axis.fFirst !== axis.fLast) && ((axis.fFirst > 1) || (axis.fLast < axis.fNbins))) {
                  this[`zoom_${name}min`] = axis.fFirst > 1 ? axis.GetBinLowEdge(axis.fFirst) : axis.fXmin;
                  this[`zoom_${name}max`] = axis.fLast < axis.fNbins ? axis.GetBinLowEdge(axis.fLast + 1) : axis.fXmax;
                  // reset user range for main painter
                  axis.InvertBit(EAxisBits.kAxisRange);
                  axis.fFirst = 1; axis.fLast = axis.fNbins;
               }
            }
         };

         applyAxisZoom('x');
         if (opts.ndim > 1) applyAxisZoom('y');
         if (opts.ndim > 2) applyAxisZoom('z');

         if (opts.check_pad_range === "pad_range") {
            let canp = this.getCanvPainter();
            // ignore range set in the online canvas
            if (!canp || !canp.online_canvas) {
               this.applyPadUserRange(pad, 'x');
               this.applyPadUserRange(pad, 'y');
            }
         }
      }

      if ((opts.zoom_ymin != opts.zoom_ymax) && (this.zoom_ymin == this.zoom_ymax) && !this.zoomChangedInteractive("y")) {
         this.zoom_ymin = opts.zoom_ymin;
         this.zoom_ymax = opts.zoom_ymax;
      }

      if (this.zoom_xmin != this.zoom_xmax) {
         this.scale_xmin = this.zoom_xmin;
         this.scale_xmax = this.zoom_xmax;
      }

      if (this.zoom_ymin != this.zoom_ymax) {
         this.scale_ymin = this.zoom_ymin;
         this.scale_ymax = this.zoom_ymax;
      }

      // projection should be assigned
      this.recalculateRange(opts.Proj);

      this.x_handle = new TAxisPainter(this.getDom(), this.xaxis, true);
      this.x_handle.setPadName(this.getPadName());

      this.x_handle.configureAxis("xaxis", this.xmin, this.xmax, this.scale_xmin, this.scale_xmax, this.swap_xy, this.swap_xy ? [0,h] : [0,w],
                                      { reverse: this.reverse_x,
                                        log: this.swap_xy ? pad.fLogy : pad.fLogx,
                                        symlog: this.swap_xy ? opts.symlog_y : opts.symlog_x,
                                        logcheckmin: this.swap_xy,
                                        logminfactor: 0.0001 });

      this.x_handle.assignFrameMembers(this, "x");

      this.y_handle = new TAxisPainter(this.getDom(), this.yaxis, true);
      this.y_handle.setPadName(this.getPadName());

      this.y_handle.configureAxis("yaxis", this.ymin, this.ymax, this.scale_ymin, this.scale_ymax, !this.swap_xy, this.swap_xy ? [0,w] : [0,h],
                                      { reverse: this.reverse_y,
                                        log: this.swap_xy ? pad.fLogx : pad.fLogy,
                                        symlog: this.swap_xy ? opts.symlog_x : opts.symlog_y,
                                        logcheckmin: (opts.ndim < 2) || this.swap_xy,
                                        log_min_nz: opts.ymin_nz && (opts.ymin_nz < 0.01*this.ymax) ? 0.3 * opts.ymin_nz : 0,
                                        logminfactor: 3e-4 });

      this.y_handle.assignFrameMembers(this, "y");

      this.setRootPadRange(pad);
   }

   /** @summary Create x,y objects for drawing of second axes
     * @private */
   createXY2(opts) {

      if (!opts) opts = {};

      this.reverse_x2 = opts.reverse_x || false;
      this.reverse_y2 = opts.reverse_y || false;

      this.logx2 = this.logy2 = 0;

      let w = this.getFrameWidth(), h = this.getFrameHeight(),
          pp = this.getPadPainter(),
          pad = pp.getRootPad();

      if (opts.second_x) {
         this.scale_x2min = this.x2min;
         this.scale_x2max = this.x2max;
      }

      if (opts.second_y) {
         this.scale_y2min = this.y2min;
         this.scale_y2max = this.y2max;
      }

      if (opts.extra_y_space && opts.second_y) {
         let log_scale = this.swap_xy ? pad.fLogx : pad.fLogy;
         if (log_scale && (this.scale_y2max > 0))
            this.scale_y2max = Math.exp(Math.log(this.scale_y2max)*1.1);
         else
            this.scale_y2max += (this.scale_y2max - this.scale_y2min)*0.1;
      }

      if ((this.zoom_x2min != this.zoom_x2max) && opts.second_x) {
         this.scale_x2min = this.zoom_x2min;
         this.scale_x2max = this.zoom_x2max;
      }

      if ((this.zoom_y2min != this.zoom_y2max) && opts.second_y) {
         this.scale_y2min = this.zoom_y2min;
         this.scale_y2max = this.zoom_y2max;
      }

      if (opts.second_x) {
         this.x2_handle = new TAxisPainter(this.getDom(), this.x2axis, true);
         this.x2_handle.setPadName(this.getPadName());

         this.x2_handle.configureAxis("x2axis", this.x2min, this.x2max, this.scale_x2min, this.scale_x2max, this.swap_xy, this.swap_xy ? [0,h] : [0,w],
                                         { reverse: this.reverse_x2,
                                           log: this.swap_xy ? pad.fLogy : pad.fLogx,
                                           logcheckmin: this.swap_xy,
                                           logminfactor: 0.0001 });
         this.x2_handle.assignFrameMembers(this,"x2");
      }

      if (opts.second_y) {
         this.y2_handle = new TAxisPainter(this.getDom(), this.y2axis, true);
         this.y2_handle.setPadName(this.getPadName());

         this.y2_handle.configureAxis("y2axis", this.y2min, this.y2max, this.scale_y2min, this.scale_y2max, !this.swap_xy, this.swap_xy ? [0,w] : [0,h],
                                         { reverse: this.reverse_y2,
                                           log: this.swap_xy ? pad.fLogx : pad.fLogy,
                                           logcheckmin: (opts.ndim < 2) || this.swap_xy,
                                           log_min_nz: opts.ymin_nz && (opts.ymin_nz < 0.01*this.y2max) ? 0.3 * opts.ymin_nz : 0,
                                           logminfactor: 3e-4 });

         this.y2_handle.assignFrameMembers(this,"y2");
      }
   }

   /** @summary Return functions to create x/y points based on coordinates
     * @desc In default case returns frame painter itself
     * @private */
   getGrFuncs(second_x, second_y) {
      let use_x2 = second_x && this.grx2,
          use_y2 = second_y && this.gry2;
      if (!use_x2 && !use_y2) return this;

      return {
         use_x2: use_x2,
         grx: use_x2 ? this.grx2 : this.grx,
         logx: this.logx,
         x_handle: use_x2 ? this.x2_handle : this.x_handle,
         scale_xmin: use_x2 ? this.scale_x2min : this.scale_xmin,
         scale_xmax: use_x2 ? this.scale_x2max : this.scale_xmax,
         use_y2: use_y2,
         gry: use_y2 ? this.gry2 : this.gry,
         logy: this.logy,
         y_handle: use_y2 ? this.y2_handle : this.y_handle,
         scale_ymin: use_y2 ? this.scale_y2min : this.scale_ymin,
         scale_ymax: use_y2 ? this.scale_y2max : this.scale_ymax,
         swap_xy: this.swap_xy,
         fp: this,
         revertAxis: function(name, v) {
            if ((name == "x") && this.use_x2) name = "x2";
            if ((name == "y") && this.use_y2) name = "y2";
            return this.fp.revertAxis(name, v);
         },
         axisAsText: function(name, v) {
            if ((name == "x") && this.use_x2) name = "x2";
            if ((name == "y") && this.use_y2) name = "y2";
            return this.fp.axisAsText(name, v);
         }
      };
   }

   /** @summary Set selected range back to TPad object
     * @private */
   setRootPadRange(pad, is3d) {
      if (!pad || !this.ranges_set) return;

      if (is3d) {
         // this is fake values, algorithm should be copied from TView3D class of ROOT
         // pad.fLogx = pad.fLogy = 0;
         pad.fUxmin = pad.fUymin = -0.9;
         pad.fUxmax = pad.fUymax = 0.9;
      } else {
         pad.fLogx = this.swap_xy ? this.logy : this.logx;
         pad.fUxmin = pad.fLogx ? Math.log10(this.scale_xmin) : this.scale_xmin;
         pad.fUxmax = pad.fLogx ? Math.log10(this.scale_xmax) : this.scale_xmax;
         pad.fLogy = this.swap_xy ? this.logx : this.logy;
         pad.fUymin = pad.fLogy ? Math.log10(this.scale_ymin) : this.scale_ymin;
         pad.fUymax = pad.fLogy ? Math.log10(this.scale_ymax) : this.scale_ymax;
      }

      let rx = pad.fUxmax - pad.fUxmin,
          mx = 1 - pad.fLeftMargin - pad.fRightMargin,
          ry = pad.fUymax - pad.fUymin,
          my = 1 - pad.fBottomMargin - pad.fTopMargin;

      if (mx <= 0) mx = 0.01; // to prevent overflow
      if (my <= 0) my = 0.01;

      pad.fX1 = pad.fUxmin - rx/mx*pad.fLeftMargin;
      pad.fX2 = pad.fUxmax + rx/mx*pad.fRightMargin;
      pad.fY1 = pad.fUymin - ry/my*pad.fBottomMargin;
      pad.fY2 = pad.fUymax + ry/my*pad.fTopMargin;
   }


   /** @summary Draw axes grids
     * @desc Called immediately after axes drawing */
   drawGrids() {

      let layer = this.getFrameSvg().select(".grid_layer");

      layer.selectAll(".xgrid").remove();
      layer.selectAll(".ygrid").remove();

      let pp = this.getPadPainter(),
          pad = pp ? pp.getRootPad(true) : null,
          h = this.getFrameHeight(),
          w = this.getFrameWidth(),
          grid_style = gStyle.fGridStyle;

      // add a grid on x axis, if the option is set
      if (pad && pad.fGridx && this.x_handle) {
         let gridx = "";
         for (let n = 0; n < this.x_handle.ticks.length; ++n)
            if (this.swap_xy)
               gridx += `M0,${this.x_handle.ticks[n]}h${w}`;
            else
               gridx += `M${this.x_handle.ticks[n]},0v${h}`;

         let colid = (gStyle.fGridColor > 0) ? gStyle.fGridColor : (this.getAxis("x") ? this.getAxis("x").fAxisColor : 1),
             grid_color = this.getColor(colid) || "black";

         if (gridx.length > 0)
           layer.append("svg:path")
                .attr("class", "xgrid")
                .attr("d", gridx)
                .style("stroke", grid_color)
                .style("stroke-width", gStyle.fGridWidth)
                .style("stroke-dasharray", getSvgLineStyle(grid_style));
      }

      // add a grid on y axis, if the option is set
      if (pad && pad.fGridy && this.y_handle) {
         let gridy = "";
         for (let n = 0; n < this.y_handle.ticks.length; ++n)
            if (this.swap_xy)
               gridy += `M${this.y_handle.ticks[n]},0v${h}`;
            else
               gridy += `M0,${this.y_handle.ticks[n]}h${w}`;

         let colid = (gStyle.fGridColor > 0) ? gStyle.fGridColor : (this.getAxis("y") ? this.getAxis("y").fAxisColor : 1),
             grid_color = this.getColor(colid) || "black";

         if (gridy.length > 0)
           layer.append("svg:path")
                .attr("class", "ygrid")
                .attr("d", gridy)
                .style("stroke", grid_color)
                .style("stroke-width",gStyle.fGridWidth)
                .style("stroke-dasharray", getSvgLineStyle(grid_style));
      }
   }

   /** @summary Converts "raw" axis value into text */
   axisAsText(axis, value) {
      let handle = this[axis+"_handle"];

      if (handle)
         return handle.axisAsText(value, settings[axis.toUpperCase() + "ValuesFormat"]);

      return value.toPrecision(4);
   }

   /** @summary Identify if requested axes are drawn
     * @desc Checks if x/y axes are drawn. Also if second side is already there */
   hasDrawnAxes(second_x, second_y) {
      return !second_x && !second_y ? this.axes_drawn : false;
   }

   /** @summary draw axes, return Promise which ready when drawing is completed  */
   async drawAxes(shrink_forbidden, disable_x_draw, disable_y_draw,
                  AxisPos, has_x_obstacle, has_y_obstacle) {

      this.cleanAxesDrawings();

      if ((this.xmin == this.xmax) || (this.ymin == this.ymax))
         return false;

      if (AxisPos === undefined) AxisPos = 0;

      let layer = this.getFrameSvg().select(".axis_layer"),
          w = this.getFrameWidth(),
          h = this.getFrameHeight(),
          pp = this.getPadPainter(),
          pad = pp.getRootPad(true);

      this.x_handle.invert_side = (AxisPos >= 10);
      this.x_handle.lbls_both_sides = !this.x_handle.invert_side && pad && (pad.fTickx > 1); // labels on both sides
      this.x_handle.has_obstacle = has_x_obstacle;

      this.y_handle.invert_side = ((AxisPos % 10) === 1);
      this.y_handle.lbls_both_sides = !this.y_handle.invert_side && pad && (pad.fTicky > 1); // labels on both sides
      this.y_handle.has_obstacle = has_y_obstacle;

      let draw_horiz = this.swap_xy ? this.y_handle : this.x_handle,
          draw_vertical = this.swap_xy ? this.x_handle : this.y_handle;

      if (!disable_x_draw || !disable_y_draw) {
         let pp = this.getPadPainter();
         if (pp && pp._fast_drawing) disable_x_draw = disable_y_draw = true;
      }

      if (!disable_x_draw || !disable_y_draw) {

         let can_adjust_frame = !shrink_forbidden && settings.CanAdjustFrame;

         await draw_horiz.drawAxis(layer, w, h,
                                   draw_horiz.invert_side ? undefined : `translate(0,${h})`,
                                   pad && pad.fTickx ? -h : 0, disable_x_draw,
                                   undefined, false);

         await draw_vertical.drawAxis(layer, w, h,
                                      draw_vertical.invert_side ? `translate(${w})` : undefined,
                                      pad && pad.fTicky ? w : 0, disable_y_draw,
                                      draw_vertical.invert_side ? 0 : this._frame_x, can_adjust_frame);

         this.drawGrids();

         if (can_adjust_frame) {
            let shrink = 0., ypos = draw_vertical.position;

            if ((-0.2 * w < ypos) && (ypos < 0)) {
               shrink = -ypos / w + 0.001;
               this.shrink_frame_left += shrink;
            } else if ((ypos > 0) && (ypos < 0.3 * w) && (this.shrink_frame_left > 0) && (ypos / w > this.shrink_frame_left)) {
               shrink = -this.shrink_frame_left;
               this.shrink_frame_left = 0.;
            }

            if (shrink != 0) {
               this.shrinkFrame(shrink, 0);
               await this.redraw();
               await this.drawAxes(true);
            }
         }
      }

     if (!shrink_forbidden)
        this.axes_drawn = true;

     return true;
   }

   /** @summary draw second axes (if any)  */
   async drawAxes2(second_x, second_y) {

      let layer = this.getFrameSvg().select(".axis_layer"),
          w = this.getFrameWidth(),
          h = this.getFrameHeight(),
          pp = this.getPadPainter(),
          pad = pp.getRootPad(true);

      if (second_x) {
         this.x2_handle.invert_side = true;
         this.x2_handle.lbls_both_sides = false;
         this.x2_handle.has_obstacle = false;
      }

      if (second_y) {
         this.y2_handle.invert_side = true;
         this.y2_handle.lbls_both_sides = false;
      }

      let draw_horiz = this.swap_xy ? this.y2_handle : this.x2_handle,
          draw_vertical = this.swap_xy ? this.x2_handle : this.y2_handle;

      if (draw_horiz || draw_vertical) {
         let pp = this.getPadPainter();
         if (pp && pp._fast_drawing) draw_horiz = draw_vertical = null;
      }

      if (draw_horiz)
         await draw_horiz.drawAxis(layer, w, h,
                                   draw_horiz.invert_side ? undefined : `translate(0,${h})`,
                                   pad && pad.fTickx ? -h : 0, false,
                                   undefined, false);

      if (draw_vertical)
         await draw_vertical.drawAxis(layer, w, h,
                                      draw_vertical.invert_side ? `translate(${w})` : undefined,
                                      pad && pad.fTicky ? w : 0, false,
                                      draw_vertical.invert_side ? 0 : this._frame_x, false);
   }


   /** @summary Update frame attributes
     * @private */
   updateAttributes(force) {
      let pp = this.getPadPainter(),
          pad = pp ? pp.getRootPad(true) : null,
          tframe = this.getObject();

      if ((this.fX1NDC === undefined) || (force && !this.modified_NDC)) {
         if (!pad) {
            extend(this, settings.FrameNDC);
         } else {
            extend(this, {
               fX1NDC: pad.fLeftMargin,
               fX2NDC: 1 - pad.fRightMargin,
               fY1NDC: pad.fBottomMargin,
               fY2NDC: 1 - pad.fTopMargin
            });
         }
      }

      if (this.fillatt === undefined) {
         if (tframe)
            this.createAttFill({ attr: tframe });
         else if (pad && pad.fFrameFillColor)
            this.createAttFill({ pattern: pad.fFrameFillStyle, color: pad.fFrameFillColor });
         else if (pad)
            this.createAttFill({ attr: pad });
         else
            this.createAttFill({ pattern: 1001, color: 0 });

         // force white color for the canvas frame
         if (!tframe && this.fillatt.empty() && pp && pp.iscan)
            this.fillatt.setSolidColor('white');
      }

      if (!tframe && pad && (pad.fFrameLineColor !== undefined))
         this.createAttLine({ color: pad.fFrameLineColor, width: pad.fFrameLineWidth, style: pad.fFrameLineStyle });
      else
         this.createAttLine({ attr: tframe, color: 'black' });
   }

   /** @summary Function called at the end of resize of frame
     * @desc One should apply changes to the pad
     * @private */
   sizeChanged() {

      let pp = this.getPadPainter(),
          pad = pp ? pp.getRootPad(true) : null;

      if (pad) {
         pad.fLeftMargin = this.fX1NDC;
         pad.fRightMargin = 1 - this.fX2NDC;
         pad.fBottomMargin = this.fY1NDC;
         pad.fTopMargin = 1 - this.fY2NDC;
         this.setRootPadRange(pad);
      }

      this.interactiveRedraw("pad", "frame");
   }

    /** @summary Remove all kinds of X/Y function for axes transformation */
   cleanXY() {
      delete this.grx;
      delete this.gry;
      delete this.grz;

      if (this.x_handle) {
         this.x_handle.cleanup();
         delete this.x_handle;
      }

      if (this.y_handle) {
         this.y_handle.cleanup();
         delete this.y_handle;
      }

      if (this.z_handle) {
         this.z_handle.cleanup();
         delete this.z_handle;
      }

      // these are drawing of second axes
      delete this.grx2;
      delete this.gry2;

      if (this.x2_handle) {
         this.x2_handle.cleanup();
         delete this.x2_handle;
      }

      if (this.y2_handle) {
         this.y2_handle.cleanup();
         delete this.y2_handle;
      }

   }

   /** @summary remove all axes drawings */
   cleanAxesDrawings() {
      if (this.x_handle) this.x_handle.removeG();
      if (this.y_handle) this.y_handle.removeG();
      if (this.z_handle) this.z_handle.removeG();
      if (this.x2_handle) this.x2_handle.removeG();
      if (this.y2_handle) this.y2_handle.removeG();

      let g = this.getG();
      if (g) {
         g.select(".grid_layer").selectAll("*").remove();
         g.select(".axis_layer").selectAll("*").remove();
      }
      this.axes_drawn = false;
   }

   /** @summary Returns frame rectangle plus extra info for hint display */
   cleanFrameDrawings() {

      // cleanup all 3D drawings if any
      if (typeof this.create3DScene === 'function')
         this.create3DScene(-1);

      this.cleanAxesDrawings();
      this.cleanXY();

      this.ranges_set = false;

      this.xmin = this.xmax = 0;
      this.ymin = this.ymax = 0;
      this.zmin = this.zmax = 0;

      this.zoom_xmin = this.zoom_xmax = 0;
      this.zoom_ymin = this.zoom_ymax = 0;
      this.zoom_zmin = this.zoom_zmax = 0;

      this.scale_xmin = this.scale_xmax = 0;
      this.scale_ymin = this.scale_ymax = 0;
      this.scale_zmin = this.scale_zmax = 0;

      if (this.draw_g) {
         this.draw_g.select(".main_layer").selectAll("*").remove();
         this.draw_g.select(".upper_layer").selectAll("*").remove();
      }

      this.xaxis = null;
      this.yaxis = null;
      this.zaxis = null;

      if (this.draw_g) {
         this.draw_g.selectAll("*").remove();
         this.draw_g.on("mousedown", null)
                    .on("dblclick", null)
                    .on("wheel", null)
                    .on("contextmenu", null)
                    .property('interactive_set', null);
         this.draw_g.remove();
      }

      delete this.draw_g; // frame <g> element managet by the pad

      if (this.keys_handler) {
         window.removeEventListener('keydown', this.keys_handler, false);
         this.keys_handler = null;
      }
   }

   /** @summary Cleanup frame */
   cleanup() {
      this.cleanFrameDrawings();
      delete this._click_handler;
      delete this._dblclick_handler;
      delete this.enabledKeys;

      let pp = this.getPadPainter();
      if (pp && (pp.frame_painter_ref === this))
         delete pp.frame_painter_ref;

      super.cleanup();
   }

   /** @summary Redraw TFrame */
   redraw(/* reason */) {
      let pp = this.getPadPainter();
      if (pp) pp.frame_painter_ref = this; // keep direct reference to the frame painter

      // first update all attributes from objects
      this.updateAttributes();

      let rect = pp ? pp.getPadRect() : { width: 10, height: 10},
          lm = Math.round(rect.width * this.fX1NDC),
          w = Math.round(rect.width * (this.fX2NDC - this.fX1NDC)),
          tm = Math.round(rect.height * (1 - this.fY2NDC)),
          h = Math.round(rect.height * (this.fY2NDC - this.fY1NDC)),
          rotate = false, fixpos = false, trans;

      if (pp && pp.options) {
         if (pp.options.RotateFrame) rotate = true;
         if (pp.options.FixFrame) fixpos = true;
      }

      if (rotate) {
         trans = `rotate(-90,${lm},${tm}) translate(${lm-h},${tm})`;
         let d = w; w = h; h = d;
      } else {
         trans = `translate(${lm},${tm})`;
      }

      this._frame_x = lm;
      this._frame_y = tm;
      this._frame_width = w;
      this._frame_height = h;
      this._frame_rotate = rotate;
      this._frame_fixpos = fixpos;

      if (this.mode3d) return; // no need to create any elements in 3d mode

      // this is svg:g object - container for every other items belonging to frame
      this.draw_g = this.getFrameSvg();

      let top_rect, main_svg;

      if (this.draw_g.empty()) {

         this.draw_g = this.getLayerSvg("primitives_layer").append("svg:g").attr("class", "root_frame");

         // empty title on the frame required to suppress title of the canvas
         if (!isBatchMode())
            this.draw_g.append("svg:title").text("");

         top_rect = this.draw_g.append("svg:path");

         // append for the moment three layers - for drawing and axis
         this.draw_g.append('svg:g').attr('class','grid_layer');

         main_svg = this.draw_g.append('svg:svg')
                           .attr('class','main_layer')
                           .attr("x", 0)
                           .attr("y", 0)
                           .attr('overflow', 'hidden');

         this.draw_g.append('svg:g').attr('class', 'axis_layer');
         this.draw_g.append('svg:g').attr('class', 'upper_layer');
      } else {
         top_rect = this.draw_g.select("path");
         main_svg = this.draw_g.select(".main_layer");
      }

      this.axes_drawn = false;

      this.draw_g.attr("transform", trans);

      top_rect.attr("d", `M0,0H${w}V${h}H0Z`)
              .call(this.fillatt.func)
              .call(this.lineatt.func);

      main_svg.attr("width", w)
              .attr("height", h)
              .attr("viewBox", `0 0 ${w} ${h}`);

      if (isBatchMode()) return;

      top_rect.style("pointer-events", "visibleFill"); // let process mouse events inside frame

      import('../interactive.mjs').then(inter => {
         inter.FrameInteractive.assign(this);
         this.addBasicInteractivity();
      });
   }

   /** @summary Change log state of specified axis
     * @param {number} value - 0 (linear), 1 (log) or 2 (log2) */
   changeAxisLog(axis, value) {
      let pp = this.getPadPainter(),
          pad = pp ? pp.getRootPad(true) : null;
      if (!pad) return;

      pp._interactively_changed = true;

      let name = "fLog" + axis;

      // do not allow log scale for labels
      if (!pad[name]) {
         if (this.swap_xy && axis==="x") axis = "y"; else
         if (this.swap_xy && axis==="y") axis = "x";
         let handle = this[axis + "_handle"];
         if (handle && (handle.kind === "labels")) return;
      }

      if ((value == "toggle") || (value === undefined))
         value = pad[name] ? 0 : 1;

      // directly change attribute in the pad
      pad[name] = value;

      this.interactiveRedraw("pad", "log"+axis);
   }

   /** @summary Toggle log state on the specified axis */
   toggleAxisLog(axis) {
      this.changeAxisLog(axis, "toggle");
   }

   /** @summary Fill context menu for the frame
     * @desc It could be appended to the histogram menus */
   fillContextMenu(menu, kind, obj) {
      let main = this.getMainPainter(),
          pp = this.getPadPainter(),
          pad = pp ? pp.getRootPad(true) : null;

      if ((kind=="x") || (kind=="y") || (kind=="z") || (kind == "x2") || (kind == "y2")) {
         let faxis = obj || this[kind+'axis'];
         menu.add("header: " + kind.toUpperCase() + " axis");
         menu.add("Unzoom", () => this.unzoom(kind));
         if (pad) {
            menu.add("sub:SetLog "+kind[0]);
            menu.addchk(pad["fLog" + kind[0]] == 0, "linear", () => this.changeAxisLog(kind[0], 0));
            menu.addchk(pad["fLog" + kind[0]] == 1, "log", () => this.changeAxisLog(kind[0], 1));
            menu.addchk(pad["fLog" + kind[0]] == 2, "log2", () => this.changeAxisLog(kind[0], 2));
            menu.add("endsub:");
         }
         menu.addchk(faxis.TestBit(EAxisBits.kMoreLogLabels), "More log",
               () => { faxis.InvertBit(EAxisBits.kMoreLogLabels); this.redrawPad(); });
         menu.addchk(faxis.TestBit(EAxisBits.kNoExponent), "No exponent",
               () => { faxis.InvertBit(EAxisBits.kNoExponent); this.redrawPad(); });

         if ((kind === "z") && main && main.options && main.options.Zscale)
            if (typeof main.fillPaletteMenu == 'function')
               main.fillPaletteMenu(menu);

         if (faxis) {
            let handle = this[kind+"_handle"];

            if (handle && (handle.kind == "labels") && (faxis.fNbins > 20))
               menu.add("Find label", () => menu.input("Label id").then(id => {
                  if (!id) return;
                  for (let bin = 0; bin < faxis.fNbins; ++bin) {
                     let lbl = handle.formatLabels(bin);
                     if (lbl == id)
                        return this.zoom(kind, Math.max(0, bin - 4), Math.min(faxis.fNbins, bin+5));
                   }
               }));

            menu.addTAxisMenu(EAxisBits, main || this, faxis, kind);
         }
         return true;
      }

      const alone = menu.size() == 0;

      if (alone)
         menu.add("header:Frame");
      else
         menu.add("separator");

      if (this.zoom_xmin !== this.zoom_xmax)
         menu.add("Unzoom X", () => this.unzoom("x"));
      if (this.zoom_ymin !== this.zoom_ymax)
         menu.add("Unzoom Y", () => this.unzoom("y"));
      if (this.zoom_zmin !== this.zoom_zmax)
         menu.add("Unzoom Z", () => this.unzoom("z"));
      if (this.zoom_x2min !== this.zoom_x2max)
         menu.add("Unzoom X2", () => this.unzoom("x2"));
      if (this.zoom_y2min !== this.zoom_y2max)
         menu.add("Unzoom Y2", () => this.unzoom("y2"));
      menu.add("Unzoom all", () => this.unzoom("all"));

      if (pad) {
         menu.addchk(pad.fLogx, "SetLogx", () => this.toggleAxisLog("x"));
         menu.addchk(pad.fLogy, "SetLogy", () => this.toggleAxisLog("y"));

         if (main && (typeof main.getDimension === 'function') && (main.getDimension() > 1))
            menu.addchk(pad.fLogz, "SetLogz", () => this.toggleAxisLog("z"));
         menu.add("separator");
      }

      menu.addchk(this.isTooltipAllowed(), "Show tooltips", () => this.setTooltipAllowed("toggle"));
      menu.addAttributesMenu(this, alone ? "" : "Frame ");
      menu.add("separator");
      menu.add("Save as frame.png", () => pp.saveAs("png", 'frame', 'frame.png'));
      menu.add("Save as frame.svg", () => pp.saveAs("svg", 'frame', 'frame.svg'));

      return true;
   }

   /** @summary Fill option object used in TWebCanvas
     * @private */
   fillWebObjectOptions(res) {
      if (!res) {
         if (!this.snapid) return null;
         res = { _typename: "TWebObjectOptions", snapid: this.snapid.toString(), opt: this.getDrawOpt(), fcust: "", fopt: [] };
       }

      res.fcust = "frame";
      res.fopt = [this.scale_xmin || 0, this.scale_ymin || 0, this.scale_xmax || 0, this.scale_ymax || 0];
      return res;
   }

   /** @summary Returns frame width */
   getFrameWidth() { return this._frame_width || 0; }

   /** @summary Returns frame height */
   getFrameHeight() { return this._frame_height || 0; }

   /** @summary Returns frame rectangle plus extra info for hint display */
   getFrameRect() {
      return {
         x: this._frame_x || 0,
         y: this._frame_y || 0,
         width: this.getFrameWidth(),
         height: this.getFrameHeight(),
         transform: this.draw_g ? this.draw_g.attr("transform") : "",
         hint_delta_x: 0,
         hint_delta_y: 0
      }
   }

   /** @summary Configure user-defined click handler
     * @desc Function will be called every time when frame click was perfromed
     * As argument, tooltip object with selected bins will be provided
     * If handler function returns true, default handling of click will be disabled */
   configureUserClickHandler(handler) {
      this._click_handler = handler && (typeof handler == 'function') ? handler : null;
   }

   /** @summary Configure user-defined dblclick handler
     * @desc Function will be called every time when double click was called
     * As argument, tooltip object with selected bins will be provided
     * If handler function returns true, default handling of dblclick (unzoom) will be disabled */
   configureUserDblclickHandler(handler) {
      this._dblclick_handler = handler && (typeof handler == 'function') ? handler : null;
   }

    /** @summary Function can be used for zooming into specified range
      * @desc if both limits for each axis 0 (like xmin==xmax==0), axis will be unzoomed
      * @param {number} xmin
      * @param {number} xmax
      * @param {number} [ymin]
      * @param {number} [ymax]
      * @param {number} [zmin]
      * @param {number} [zmax]
      * @returns {Promise} with boolean flag if zoom operation was performed */
   zoom(xmin, xmax, ymin, ymax, zmin, zmax) {

      // disable zooming when axis conversion is enabled
      if (this.projection) return Promise.resolve(false);

      if (xmin==="x") { xmin = xmax; xmax = ymin; ymin = undefined; } else
      if (xmin==="y") { ymax = ymin; ymin = xmax; xmin = xmax = undefined; } else
      if (xmin==="z") { zmin = xmax; zmax = ymin; xmin = xmax = ymin = undefined; }

      let zoom_x = (xmin !== xmax), zoom_y = (ymin !== ymax), zoom_z = (zmin !== zmax),
          unzoom_x = false, unzoom_y = false, unzoom_z = false;

      if (zoom_x) {
         let cnt = 0;
         if (xmin <= this.xmin) { xmin = this.xmin; cnt++; }
         if (xmax >= this.xmax) { xmax = this.xmax; cnt++; }
         if (cnt === 2) { zoom_x = false; unzoom_x = true; }
      } else {
         unzoom_x = (xmin === xmax) && (xmin === 0);
      }

      if (zoom_y) {
         let cnt = 0;
         if (ymin <= this.ymin) { ymin = this.ymin; cnt++; }
         if (ymax >= this.ymax) { ymax = this.ymax; cnt++; }
         if (cnt === 2) { zoom_y = false; unzoom_y = true; }
      } else {
         unzoom_y = (ymin === ymax) && (ymin === 0);
      }

      if (zoom_z) {
         let cnt = 0;
         if (zmin <= this.zmin) { zmin = this.zmin; cnt++; }
         if (zmax >= this.zmax) { zmax = this.zmax; cnt++; }
         if (cnt === 2) { zoom_z = false; unzoom_z = true; }
      } else {
         unzoom_z = (zmin === zmax) && (zmin === 0);
      }

      let changed = false;

      // first process zooming (if any)
      if (zoom_x || zoom_y || zoom_z)
         this.forEachPainter(obj => {
            if (typeof obj.canZoomInside != 'function') return;
            if (zoom_x && obj.canZoomInside("x", xmin, xmax)) {
               this.zoom_xmin = xmin;
               this.zoom_xmax = xmax;
               changed = true;
               zoom_x = false;
            }
            if (zoom_y && obj.canZoomInside("y", ymin, ymax)) {
               this.zoom_ymin = ymin;
               this.zoom_ymax = ymax;
               changed = true;
               zoom_y = false;
            }
            if (zoom_z && obj.canZoomInside("z", zmin, zmax)) {
               this.zoom_zmin = zmin;
               this.zoom_zmax = zmax;
               changed = true;
               zoom_z = false;
            }
         });

      // and process unzoom, if any
      if (unzoom_x || unzoom_y || unzoom_z) {
         if (unzoom_x) {
            if (this.zoom_xmin !== this.zoom_xmax) changed = true;
            this.zoom_xmin = this.zoom_xmax = 0;
         }
         if (unzoom_y) {
            if (this.zoom_ymin !== this.zoom_ymax) changed = true;
            this.zoom_ymin = this.zoom_ymax = 0;
         }
         if (unzoom_z) {
            if (this.zoom_zmin !== this.zoom_zmax) changed = true;
            this.zoom_zmin = this.zoom_zmax = 0;
         }

         // than try to unzoom all overlapped objects
         if (!changed) {
            let pp = this.getPadPainter();
            if (pp && pp.painters)
               pp.painters.forEach(painter => {
                  if (painter && (typeof painter.unzoomUserRange == 'function'))
                     if (painter.unzoomUserRange(unzoom_x, unzoom_y, unzoom_z)) changed = true;
            });
         }
      }

      if (!changed) return Promise.resolve(false);

      return this.interactiveRedraw("pad", "zoom").then(() => true);
   }

   /** @summary Provide zooming of single axis
     * @desc One can specify names like x/y/z but also second axis x2 or y2 */
   zoomSingle(name, vmin, vmax) {
      // disable zooming when axis conversion is enabled
      if (this.projection || !this[name+"_handle"]) return Promise.resolve(false);

      let zoom_v = (vmin !== vmax), unzoom_v = false;

      if (zoom_v) {
         let cnt = 0;
         if (vmin <= this[name+"min"]) { vmin = this[name+"min"]; cnt++; }
         if (vmax >= this[name+"max"]) { vmax = this[name+"max"]; cnt++; }
         if (cnt === 2) { zoom_v = false; unzoom_v = true; }
      } else {
         unzoom_v = (vmin === vmax) && (vmin === 0);
      }

      let changed = false;

      // first process zooming
      if (zoom_v)
         this.forEachPainter(obj => {
            if (typeof obj.canZoomInside != 'function') return;
            if (zoom_v && obj.canZoomInside(name[0], vmin, vmax)) {
               this["zoom_" + name + "min"] = vmin;
               this["zoom_" + name + "max"] = vmax;
               changed = true;
               zoom_v = false;
            }
         });

      // and process unzoom, if any
      if (unzoom_v) {
         if (this["zoom_" + name + "min"] !== this["zoom_" + name + "max"]) changed = true;
         this["zoom_" + name + "min"] = this["zoom_" + name + "max"] = 0;
      }

      if (!changed) return Promise.resolve(false);

      return this.interactiveRedraw("pad", "zoom").then(() => true);
   }

   /** @summary Checks if specified axis zoomed */
   isAxisZoomed(axis) {
      return this['zoom_'+axis+'min'] !== this['zoom_'+axis+'max'];
   }

   /** @summary Unzoom speicified axes
     * @returns {Promise} with boolean flag if zooming changed */
   unzoom(dox, doy, doz) {
      if (dox == "all")
         return this.unzoom("x2").then(() => this.unzoom("y2")).then(() => this.unzoom("xyz"));

      if ((dox == "x2") || (dox == "y2"))
         return this.zoomSingle(dox, 0, 0).then(changed => {
            if (changed) this.zoomChangedInteractive(dox, "unzoom");
            return changed;
         });

      if (typeof dox === 'undefined') { dox = doy = doz = true; } else
      if (typeof dox === 'string') { doz = dox.indexOf("z") >= 0; doy = dox.indexOf("y") >= 0; dox = dox.indexOf("x") >= 0; }

      return this.zoom(dox ? 0 : undefined, dox ? 0 : undefined,
                       doy ? 0 : undefined, doy ? 0 : undefined,
                       doz ? 0 : undefined, doz ? 0 : undefined).then(changed => {

         if (changed && dox) this.zoomChangedInteractive("x", "unzoom");
         if (changed && doy) this.zoomChangedInteractive("y", "unzoom");
         if (changed && doz) this.zoomChangedInteractive("z", "unzoom");

         return changed;
      });
   }

   /** @summary Mark/check if zoom for specific axis was changed interactively
     * @private */
   zoomChangedInteractive(axis, value) {
      if (axis == 'reset') {
         this.zoom_changed_x = this.zoom_changed_y = this.zoom_changed_z = undefined;
         return;
      }
      if (!axis || axis == 'any')
         return this.zoom_changed_x || this.zoom_changed_y  || this.zoom_changed_z;

      if ((axis !== 'x') && (axis !== 'y') && (axis !== 'z')) return;

      let fld = "zoom_changed_" + axis;
      if (value === undefined) return this[fld];

      if (value === 'unzoom') {
         // special handling of unzoom
         if (this[fld])
            delete this[fld];
         else
            this[fld] = true;
         return;
      }

      if (value) this[fld] = true;
   }

   /** @summary Convert graphical coordinate into axis value */
   revertAxis(axis, pnt) {
      let handle = this[axis+"_handle"];
      return handle ? handle.revertPoint(pnt) : 0;
   }

   /** @summary Show axis status message
    * @desc method called normally when mouse enter main object element
    * @private */
   showAxisStatus(axis_name, evnt) {
      let taxis = this.getAxis(axis_name), hint_name = axis_name, hint_title = "TAxis",
          m = d3_pointer(evnt, this.getFrameSvg().node()), id = (axis_name=="x") ? 0 : 1;

      if (taxis) { hint_name = taxis.fName; hint_title = taxis.fTitle || ("TAxis object for " + axis_name); }
      if (this.swap_xy) id = 1-id;

      let axis_value = this.revertAxis(axis_name, m[id]);

      this.showObjectStatus(hint_name, hint_title, axis_name + " : " + this.axisAsText(axis_name, axis_value), m[0]+","+m[1]);
   }

   /** @summary Add interactive keys handlers
    * @private */
   addKeysHandler() {
      if (isBatchMode()) return;
      import('../interactive.mjs').then(inter => {
         inter.FrameInteractive.assign(this);
         this.addKeysHandler();
      });
   }

   /** @summary Add interactive functionality to the frame
     * @private */
   async addInteractivity(for_second_axes) {
      if (isBatchMode() || (!settings.Zooming && !settings.ContextMenu))
         return false;

      if (!this.addFrameInteractivity) {
         let inter = await import('../interactive.mjs');
         inter.FrameInteractive.assign(this);
      }
      return this.addFrameInteractivity(for_second_axes);
   }

} // class TFramePainter

export { TFramePainter };

