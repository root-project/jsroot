/// @file JSRootPainter.v6.js
/// JavaScript ROOT graphics for main ROOT6 classes

(function( factory ) {
   if ( typeof define === "function" && define.amd ) {
      define( ['JSRootPainter', 'd3'], factory );
   } else
   if (typeof exports === 'object' && typeof module !== 'undefined') {
       factory(require("./JSRootCore.js"), require("./d3.min.js"));
   } else {

      if (typeof d3 != 'object')
         throw new Error('This extension requires d3.js', 'JSRootPainter.v6.js');

      if (typeof JSROOT == 'undefined')
         throw new Error('JSROOT is not defined', 'JSRootPainter.v6.js');

      if (typeof JSROOT.Painter != 'object')
         throw new Error('JSROOT.Painter not defined', 'JSRootPainter.v6.js');

      factory(JSROOT, d3);
   }
} (function(JSROOT, d3) {

   "use strict";

   JSROOT.sources.push("v6");

   // ===============================================

   function TFramePainter(tframe) {
      JSROOT.TooltipHandler.call(this, tframe);
      this.zoom_kind = 0;

      this.mode3d = false;
      this.shrink_frame_left = 0.;
      this.x_kind = 'normal'; // 'normal', 'log', 'time', 'labels'
      this.y_kind = 'normal'; // 'normal', 'log', 'time', 'labels'
      this.xmin = this.xmax = 0; // no scale specified, wait for objects drawing
      this.ymin = this.ymax = 0; // no scale specified, wait for objects drawing
      this.axes_drawn = false;
      this.keys_handler = null;
   }

   TFramePainter.prototype = Object.create(JSROOT.TooltipHandler.prototype);

   TFramePainter.prototype.GetTipName = function(append) {
      var res = JSROOT.TooltipHandler.prototype.GetTipName.call(this) || "TFrame";
      if (append) res+=append;
      return res;
   }

   TFramePainter.prototype.Shrink = function(shrink_left, shrink_right) {
      this.fX1NDC += shrink_left;
      this.fX2NDC -= shrink_right;
   }

   TFramePainter.prototype.SetLastEventPos = function(pnt) {
      // set position of last context menu event, can be
      this.fLastEventPnt = pnt;
   }

   TFramePainter.prototype.GetLastEventPos = function() {
      // return position of last event
      return this.fLastEventPnt;
   }

   TFramePainter.prototype.ProjectAitoff2xy = function(l, b) {
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

   TFramePainter.prototype.ProjectMercator2xy = function(l, b) {
      var aid = Math.tan((Math.PI/2 + b/180*Math.PI)/2);
      return { x: l, y: Math.log(aid) };
   }

   TFramePainter.prototype.ProjectSinusoidal2xy = function(l, b) {
      return { x: l*Math.cos(b/180*Math.PI), y: b };
   }

   TFramePainter.prototype.ProjectParabolic2xy = function(l, b) {
      return {
         x: l*(2.*Math.cos(2*b/180*Math.PI/3) - 1),
         y: 180*Math.sin(b/180*Math.PI/3)
      };
   }

   TFramePainter.prototype.RecalculateRange = function(Proj) {
      // not yet used, could be useful in the future

      if (!Proj) return;

      var pnts = []; // all extremes which used to find
      if (Proj == 1) {
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
      } else if (Proj == 2) {
         if (this.scale_ymin <= -90 || this.scale_ymax >=90) {
            console.warn("Mercator Projection", "Latitude out of range", this.scale_ymin, this.scale_ymax);
            this.options.Proj = 0;
            return;
         }
         pnts.push(this.ProjectMercator2xy(this.scale_xmin, this.scale_ymin));
         pnts.push(this.ProjectMercator2xy(this.scale_xmax, this.scale_ymax));

      } else if (Proj == 3) {
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
      } else if (Proj == 4) {
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

   TFramePainter.prototype.DrawGrids = function() {
      // grid can only be drawn by first painter

      var layer = this.svg_frame().select(".grid_layer");

      layer.selectAll(".xgrid").remove();
      layer.selectAll(".ygrid").remove();

      var h = this.frame_height(),
          w = this.frame_width(),
          grid, grid_style = JSROOT.gStyle.fGridStyle,
          grid_color = (JSROOT.gStyle.fGridColor > 0) ? this.get_color(JSROOT.gStyle.fGridColor) : "black";

      if ((grid_style < 0) || (grid_style >= JSROOT.Painter.root_line_styles.length)) grid_style = 11;

      // add a grid on x axis, if the option is set
      if (this.x_handle) {
         grid = "";
         for (var n=0;n<this.x_handle.ticks.length;++n)
            if (this.swap_xy)
               grid += "M0,"+this.x_handle.ticks[n]+"h"+w;
            else
               grid += "M"+this.x_handle.ticks[n]+",0v"+h;

         if (grid.length > 0)
          layer.append("svg:path")
               .attr("class", "xgrid")
               .attr("d", grid)
               .style('stroke',grid_color).style("stroke-width",JSROOT.gStyle.fGridWidth)
               .style("stroke-dasharray", JSROOT.Painter.root_line_styles[grid_style]);
      }

      // add a grid on y axis, if the option is set
      if (this.y_handle) {
         grid = "";
         for (var n=0;n<this.y_handle.ticks.length;++n)
            if (this.swap_xy)
               grid += "M"+this.y_handle.ticks[n]+",0v"+h;
            else
               grid += "M0,"+this.y_handle.ticks[n]+"h"+w;

         if (grid.length > 0)
          layer.append("svg:path")
               .attr("class", "ygrid")
               .attr("d", grid)
               .style('stroke',grid_color).style("stroke-width",JSROOT.gStyle.fGridWidth)
               .style("stroke-dasharray", JSROOT.Painter.root_line_styles[grid_style]);
      }
   }

   TFramePainter.prototype.AxisAsText = function(axis, value) {
      if (axis == "x") {
         if (this.x_kind == 'time')
            value = this.ConvertX(value);
         if (this.x_handle && ('format' in this.x_handle))
            return this.x_handle.format(value);
      } else if (axis == "y") {
         if (this.y_kind == 'time')
            value = this.ConvertY(value);
         if (this.y_handle && ('format' in this.y_handle))
            return this.y_handle.format(value);
      } else {
         if (this.z_handle && ('format' in this.z_handle))
            return this.z_handle.format(value);
      }

      return value.toPrecision(4);
   }

   TFramePainter.prototype.SetAxesRanges = function(xmin, xmax, ymin, ymax, histo, swap_xy) {
      if (this.axes_drawn) return;

      if ((this.xmin == this.xmax) && (xmin!==xmax)) {
         this.xmin = xmin;
         this.xmax = xmax;
      }
      if ((this.ymin == this.ymax) && (ymin!==ymax)) {
         this.ymin = ymin;
         this.ymax = ymax;
      }
   }

   TFramePainter.prototype.DrawAxes = function(shrink_forbidden) {
      // axes can be drawn only for main histogram

      if (this.axes_drawn) return true;

      if ((this.xmin==this.xmax) || (this.ymin==this.ymax)) return false;

      this.CreateXY();

      var layer = this.svg_frame().select(".axis_layer"),
          w = this.frame_width(),
          h = this.frame_height(),
          axisx = JSROOT.Create("TAxis"), // temporary object for different attributes
          axisy = JSROOT.Create("TAxis");

      this.x_handle = new JSROOT.TAxisPainter(axisx, true);
      this.x_handle.SetDivId(this.divid, -1);
      this.x_handle.pad_name = this.pad_name;

      this.x_handle.SetAxisConfig("xaxis",
                                  (this.logx && (this.x_kind !== "time")) ? "log" : this.x_kind,
                                  this.x, this.xmin, this.xmax, this.scale_xmin, this.scale_xmax);
      this.x_handle.invert_side = false;
      this.x_handle.lbls_both_sides = false;
      this.x_handle.has_obstacle = false; // (this.options.Zscale > 0);

      this.y_handle = new JSROOT.TAxisPainter(axisy, true);
      this.y_handle.SetDivId(this.divid, -1);
      this.y_handle.pad_name = this.pad_name;

      this.y_handle.SetAxisConfig("yaxis",
                                  (this.logy && this.y_kind !== "time") ? "log" : this.y_kind,
                                  this.y, this.ymin, this.ymax, this.scale_ymin, this.scale_ymax);
      this.y_handle.invert_side = false; // ((this.options.AxisPos % 10) === 1) || (pad.fTicky > 1);
      this.y_handle.lbls_both_sides = false;

      var draw_horiz = this.swap_xy ? this.y_handle : this.x_handle,
          draw_vertical = this.swap_xy ? this.x_handle : this.y_handle,
          disable_axis_draw = false, show_second_ticks = false;

      draw_horiz.DrawAxis(false, layer, w, h,
                          draw_horiz.invert_side ? undefined : "translate(0," + h + ")",
                          false, show_second_ticks ? -h : 0, disable_axis_draw);

      draw_vertical.DrawAxis(true, layer, w, h,
                             draw_vertical.invert_side ? "translate(" + w + ",0)" : undefined,
                             false, show_second_ticks ? w : 0, disable_axis_draw,
                             draw_vertical.invert_side ? 0 : this.frame_x());

      this.DrawGrids();

      if (!shrink_forbidden && JSROOT.gStyle.CanAdjustFrame) {

         var shrink = 0., ypos = draw_vertical.position;

         if ((-0.2*w < ypos) && (ypos < 0)) {
            shrink = -ypos/w + 0.001;
            this.shrink_frame_left += shrink;
         } else if ((ypos>0) && (ypos<0.3*w) && (this.shrink_frame_left > 0) && (ypos/w > this.shrink_frame_left)) {
            shrink = -this.shrink_frame_left;
            this.shrink_frame_left = 0.;
         }

         if (shrink != 0) {
            this.Shrink(shrink, 0);
            this.Redraw();
            this.DrawAxes(true);
         }
      }

      this.axes_drawn = true;

      return true;
   }

   TFramePainter.prototype.UpdateAttributes = function(force) {
      var pad = this.root_pad(),
          tframe = this.GetObject();

      if ((this.fX1NDC === undefined) || (force && !this.modified_NDC)) {
         if (!pad) {
            JSROOT.extend(this, JSROOT.gStyle.FrameNDC);
         } else {
            JSROOT.extend(this, {
               fX1NDC: pad.fLeftMargin,
               fX2NDC: 1 - pad.fRightMargin,
               fY1NDC: pad.fBottomMargin,
               fY2NDC: 1 - pad.fTopMargin
            });
         }
      }

      if (this.fillatt === undefined) {
         if (tframe) this.fillatt = this.createAttFill(tframe);
         else if (pad) this.fillatt = pad.fFrameFillColor ? this.createAttFill(null, pad.fFrameFillStyle, pad.fFrameFillColor) : this.createAttFill(pad);
         else this.fillatt = this.createAttFill(null, 1001, 0);

         // force white color for the frame
         if (!tframe && (this.fillatt.color == 'none') && this.pad_painter(true) && this.pad_painter(true).iscan) {
            this.fillatt.color = 'white';
         }
      }

      if (this.lineatt === undefined)
         if (pad) this.lineatt = new JSROOT.TAttLineHandler({ fLineColor: pad.fFrameLineColor, fLineWidth: pad.fFrameLineWidth, fLineStyle: pad.fFrameLineStyle });
             else this.lineatt = new JSROOT.TAttLineHandler(tframe ? tframe : 'black');
   }

   TFramePainter.prototype.SizeChanged = function() {
      // function called at the end of resize of frame
      // One should apply changes to the pad

      var pad = this.root_pad(),
          main = this.main_painter();

      if (pad) {
         pad.fLeftMargin = this.fX1NDC;
         pad.fRightMargin = 1 - this.fX2NDC;
         pad.fBottomMargin = this.fY1NDC;
         pad.fTopMargin = 1 - this.fY2NDC;
         if (main) main.SetRootPadRange(pad);
      }

      this.RedrawPad();
   }

   TFramePainter.prototype.CleanupAxes = function() {
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
      if (this.draw_g) {
         this.draw_g.select(".grid_layer").selectAll("*").remove();
         this.draw_g.select(".axis_layer").selectAll("*").remove();
      }
      this.axes_drawn = false;
   }

   TFramePainter.prototype.Cleanup = function() {
      if (this.draw_g) {
         this.CleanupAxes();
         this.draw_g.selectAll("*").remove();
         this.draw_g.on("mousedown", null)
                    .on("dblclick", null)
                    .on("wheel", null)
                    .on("contextmenu", null)
                    .property('interactive_set', null);
      }
      this.draw_g = null;
      JSROOT.TooltipHandler.prototype.Cleanup.call(this);
   }

   TFramePainter.prototype.Redraw = function() {

      // first update all attributes from objects
      this.UpdateAttributes();

      var width = this.pad_width(),
          height = this.pad_height(),
          lm = Math.round(width * this.fX1NDC),
          w = Math.round(width * (this.fX2NDC - this.fX1NDC)),
          tm = Math.round(height * (1 - this.fY2NDC)),
          h = Math.round(height * (this.fY2NDC - this.fY1NDC)),
          rotate = false, fixpos = false, pp = this.pad_painter();

      if (pp && pp.options) {
         if (pp.options.RotateFrame) rotate = true;
         if (pp.options.FixFrame) fixpos = true;
      }

      // this is svg:g object - container for every other items belonging to frame
      this.draw_g = this.svg_layer("primitives_layer").select(".root_frame");

      var top_rect, main_svg;

      if (this.draw_g.empty()) {

         var layer = this.svg_layer("primitives_layer");

         this.draw_g = layer.append("svg:g").attr("class", "root_frame");

         this.draw_g.append("svg:title").text("");

         top_rect = this.draw_g.append("svg:rect");

         // append for the moment three layers - for drawing and axis
         this.draw_g.append('svg:g').attr('class','grid_layer');

         main_svg = this.draw_g.append('svg:svg')
                           .attr('class','main_layer')
                           .attr("x", 0)
                           .attr("y", 0)
                           .attr('overflow', 'hidden');

         this.draw_g.append('svg:g').attr('class','axis_layer');
         this.draw_g.append('svg:g').attr('class','upper_layer');
      } else {
         top_rect = this.draw_g.select("rect");
         main_svg = this.draw_g.select(".main_layer");
         this.CleanupAxes();
      }

      this.axes_drawn = false;

      var trans = "translate(" + lm + "," + tm + ")";
      if (rotate) {
         trans += " rotate(-90) " + "translate(" + -h + ",0)";
         var d = w; w = h; h = d;
      }

      this.draw_g.property('frame_painter', this) // simple way to access painter via frame container
                 .property('draw_x', lm)
                 .property('draw_y', tm)
                 .property('draw_width', w)
                 .property('draw_height', h)
                 .attr("transform", trans);

      top_rect.attr("x", 0)
              .attr("y", 0)
              .attr("width", w)
              .attr("height", h)
              .call(this.fillatt.func)
              .call(this.lineatt.func);

      main_svg.attr("width", w)
              .attr("height", h)
              .attr("viewBox", "0 0 " + w + " " + h);

      var tooltip_rect = this.draw_g.select(".interactive_rect");

      if (JSROOT.BatchMode) return tooltip_rect.remove();

      this.draw_g.attr("x", lm)
                 .attr("y", tm)
                 .attr("width", w)
                 .attr("height", h);

      if (!rotate && !fixpos)
         this.AddDrag({ obj: this, only_resize: true, minwidth: 20, minheight: 20,
                        redraw: this.SizeChanged.bind(this) });

      var painter = this;

      function MouseMoveEvent() {
         var pnt = d3.mouse(tooltip_rect.node());
         painter.ProcessTooltipEvent({ x: pnt[0], y: pnt[1], touch: false });
      }

      function MouseCloseEvent() {
         painter.ProcessTooltipEvent(null);
      }

      function TouchMoveEvent() {
         var pnt = d3.touches(tooltip_rect.node());
         if (!pnt || pnt.length !== 1) return painter.ProcessTooltipEvent(null);
         painter.ProcessTooltipEvent({ x: pnt[0][0], y: pnt[0][1], touch: true });
      }

      function TouchCloseEvent() {
         painter.ProcessTooltipEvent(null);
      }

      if (tooltip_rect.empty()) {
         tooltip_rect =
            this.draw_g
                .append("rect")
                .attr("class","interactive_rect")
                .style('opacity',0)
                .style('fill',"none")
                .style("pointer-events","visibleFill")
                .on('mouseenter', MouseMoveEvent)
                .on('mousemove', MouseMoveEvent)
                .on('mouseleave', MouseCloseEvent);

         if (JSROOT.touches)
            tooltip_rect.on("touchstart", TouchMoveEvent)
                        .on("touchmove", TouchMoveEvent)
                        .on("touchend", TouchCloseEvent)
                        .on("touchcancel", TouchCloseEvent);
      }

      tooltip_rect.attr("x", 0)
                  .attr("y", 0)
                  .attr("width", w)
                  .attr("height", h);

      var hintsg = this.hints_layer().select(".objects_hints");
      // if tooltips were visible before, try to reconstruct them after short timeout
      if (!hintsg.empty() && this.tooltip_allowed)
         setTimeout(this.ProcessTooltipEvent.bind(this, hintsg.property('last_point')), 10);
   }

   TFramePainter.prototype.FillContextMenu = function(menu) {
      // fill context menu for the frame
      // it could be appended to the histogram menus

      var main = this.main_painter(), alone = menu.size()==0, pad = this.root_pad();

      if (alone)
         menu.add("header:Frame");
      else
         menu.add("separator");

      if (main) {
         if (main.zoom_xmin !== main.zoom_xmax)
            menu.add("Unzoom X", main.Unzoom.bind(main,"x"));
         if (main.zoom_ymin !== main.zoom_ymax)
            menu.add("Unzoom Y", main.Unzoom.bind(main,"y"));
         if (main.zoom_zmin !== main.zoom_zmax)
            menu.add("Unzoom Z", main.Unzoom.bind(main,"z"));
         menu.add("Unzoom all", main.Unzoom.bind(main,"xyz"));

         if (pad) {
            menu.addchk(pad.fLogx, "SetLogx", main.ToggleLog.bind(main,"x"));

            menu.addchk(pad.fLogy, "SetLogy", main.ToggleLog.bind(main,"y"));

            if (main.Dimension() == 2)
               menu.addchk(pad.fLogz, "SetLogz", main.ToggleLog.bind(main,"z"));
         }
         menu.add("separator");
      }

      menu.addchk(this.tooltip_allowed, "Show tooltips", function() {
         var fp = this.frame_painter();
         if (fp) fp.tooltip_allowed = !fp.tooltip_allowed;
      });
      this.FillAttContextMenu(menu,alone ? "" : "Frame ");
      menu.add("separator");
      menu.add("Save as frame.png", function(arg) {
         var top = this.svg_frame();
         if (!top.empty())
            JSROOT.saveSvgAsPng(top.node(), { name: "frame.png" } );
      });

      return true;
   }

   TFramePainter.prototype.GetFrameRect = function() {
      // returns frame rectangle plus extra info for hint display

      return {
         x: this.frame_x(),
         y: this.frame_y(),
         width: this.frame_width(),
         height: this.frame_height(),
         transform: this.draw_g ? this.draw_g.attr("transform") : "",
         hint_delta_x: 0,
         hint_delta_y: 0
      }
   }

   TFramePainter.prototype.ProcessFrameClick = function(pnt) {
      // function called when frame is clicked and object selection can be performed
      // such event can be used to select

      var pp = this.pad_painter(true);
      if (!pp) return;

      pnt.painters = true; // provide painters reference in the hints
      pnt.disabled = true; // do not invoke graphics

      // collect tooltips from pad painter - it has list of all drawn objects
      var hints = pp.GetTooltips(pnt), exact = null;
      for (var k=0; (k<hints.length) && !exact; ++k)
         if (hints[k] && hints[k].exact) exact = hints[k];
      //if (exact) console.log('Click exact', pnt, exact.painter.GetTipName());
      //      else console.log('Click frame', pnt);

      pp.SelectObjectPainter(exact ? exact.painter : this, pnt);
   }

   TFramePainter.prototype.AddKeysHandler = function() {
      if (this.keys_handler || JSROOT.BatchMode || (typeof window == 'undefined')) return;

      this.keys_handler = this.ProcessKeyPress.bind(this);

      window.addEventListener('keydown', this.keys_handler, false);
   }

   TFramePainter.prototype.ProcessKeyPress = function(evnt) {
      var main = this.select_main();
      if (main.empty()) return;
      var isactive = main.attr('frame_active');
      if (isactive && isactive!=='true') return;

      var key = "";
      switch (evnt.keyCode) {
         case 33: key = "PageUp"; break;
         case 34: key = "PageDown"; break;
         case 37: key = "ArrowLeft"; break;
         case 38: key = "ArrowUp"; break;
         case 39: key = "ArrowRight"; break;
         case 40: key = "ArrowDown"; break;
         case 42: key = "PrintScreen"; break;
         case 106: key = "*"; break;
         default: return false;
      }

      if (evnt.shiftKey) key = "Shift " + key;
      if (evnt.altKey) key = "Alt " + key;
      if (evnt.ctrlKey) key = "Ctrl " + key;

      var zoom = { name: "x", dleft: 0, dright: 0 };

      switch (key) {
         case "ArrowLeft":  zoom.dleft = -1; zoom.dright = 1; break;
         case "ArrowRight":  zoom.dleft = 1; zoom.dright = -1; break;
         case "Ctrl ArrowLeft": zoom.dleft = zoom.dright = -1; break;
         case "Ctrl ArrowRight": zoom.dleft = zoom.dright = 1; break;
         case "ArrowUp":  zoom.name = "y"; zoom.dleft = 1; zoom.dright = -1; break;
         case "ArrowDown":  zoom.name = "y"; zoom.dleft = -1; zoom.dright = 1; break;
         case "Ctrl ArrowUp": zoom.name = "y"; zoom.dleft = zoom.dright = 1; break;
         case "Ctrl ArrowDown": zoom.name = "y"; zoom.dleft = zoom.dright = -1; break;
      }

      if (zoom.dleft || zoom.dright) {
         if (!JSROOT.gStyle.Zooming) return false;
         // in 3dmode with orbit control ignore simple arrows
         if (this.mode3d && (key.indexOf("Ctrl")!==0)) return false;
         this.AnalyzeMouseWheelEvent(null, zoom, 0.5);
         this.Zoom(zoom.name, zoom.min, zoom.max);
         if (zoom.changed) this.zoom_changed_interactive = 2;
         evnt.stopPropagation();
         evnt.preventDefault();
      } else {
         var pp = this.pad_painter(true),
             func = pp ? pp.FindButton(key) : "";
         if (func) {
            pp.PadButtonClick(func);
            evnt.stopPropagation();
            evnt.preventDefault();
         }
      }

      return true; // just process any key press
   }

   TFramePainter.prototype.FindAlternativeClickHandler = function(pos) {
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

   TFramePainter.prototype.clearInteractiveElements = function() {
      JSROOT.Painter.closeMenu();
      if (this.zoom_rect != null) { this.zoom_rect.remove(); this.zoom_rect = null; }
      this.zoom_kind = 0;

      // enable tooltip in frame painter
      this.SwitchTooltip(true);
   }

   TFramePainter.prototype.startRectSel = function() {
      // ignore when touch selection is activated

      if (this.zoom_kind > 100) return;

      // ignore all events from non-left button
      if ((d3.event.which || d3.event.button) !== 1) return;

      d3.event.preventDefault();

      var pos = d3.mouse(this.svg_frame().node());

      if (this.FindAlternativeClickHandler(pos)) return;

      this.clearInteractiveElements();
      this.zoom_origin = pos;

      var w = this.frame_width(), h = this.frame_height();

      this.zoom_curr = [ Math.max(0, Math.min(w, this.zoom_origin[0])),
                         Math.max(0, Math.min(h, this.zoom_origin[1])) ];

      if ((this.zoom_origin[0] < 0) || (this.zoom_origin[0] > w)) {
         this.zoom_kind = 3; // only y
         this.zoom_origin[0] = 0;
         this.zoom_origin[1] = this.zoom_curr[1];
         this.zoom_curr[0] = w;
         this.zoom_curr[1] += 1;
      } else if ((this.zoom_origin[1] < 0) || (this.zoom_origin[1] > h)) {
         this.zoom_kind = 2; // only x
         this.zoom_origin[0] = this.zoom_curr[0];
         this.zoom_origin[1] = 0;
         this.zoom_curr[0] += 1;
         this.zoom_curr[1] = h;
      } else {
         this.zoom_kind = 1; // x and y
         this.zoom_origin[0] = this.zoom_curr[0];
         this.zoom_origin[1] = this.zoom_curr[1];
      }

      d3.select(window).on("mousemove.zoomRect", this.moveRectSel.bind(this))
                       .on("mouseup.zoomRect", this.endRectSel.bind(this), true);

      this.zoom_rect = null;

      // disable tooltips in frame painter
      this.SwitchTooltip(false);

      d3.event.stopPropagation();
   }

   TFramePainter.prototype.moveRectSel = function() {

      if ((this.zoom_kind == 0) || (this.zoom_kind > 100)) return;

      d3.event.preventDefault();
      var m = d3.mouse(this.svg_frame().node());

      m[0] = Math.max(0, Math.min(this.frame_width(), m[0]));
      m[1] = Math.max(0, Math.min(this.frame_height(), m[1]));

      switch (this.zoom_kind) {
         case 1: this.zoom_curr[0] = m[0]; this.zoom_curr[1] = m[1]; break;
         case 2: this.zoom_curr[0] = m[0]; break;
         case 3: this.zoom_curr[1] = m[1]; break;
      }

      if (this.zoom_rect===null)
         this.zoom_rect = this.svg_frame()
                              .append("rect")
                              .attr("class", "zoom")
                              .attr("pointer-events","none");

      this.zoom_rect.attr("x", Math.min(this.zoom_origin[0], this.zoom_curr[0]))
                    .attr("y", Math.min(this.zoom_origin[1], this.zoom_curr[1]))
                    .attr("width", Math.abs(this.zoom_curr[0] - this.zoom_origin[0]))
                    .attr("height", Math.abs(this.zoom_curr[1] - this.zoom_origin[1]));
   }

   TFramePainter.prototype.endRectSel = function() {
      if ((this.zoom_kind == 0) || (this.zoom_kind > 100)) return;

      d3.event.preventDefault();

      d3.select(window).on("mousemove.zoomRect", null)
                       .on("mouseup.zoomRect", null);

      var m = d3.mouse(this.svg_frame().node()), changed = [true, true];
      m[0] = Math.max(0, Math.min(this.frame_width(), m[0]));
      m[1] = Math.max(0, Math.min(this.frame_height(), m[1]));

      switch (this.zoom_kind) {
         case 1: this.zoom_curr[0] = m[0]; this.zoom_curr[1] = m[1]; break;
         case 2: this.zoom_curr[0] = m[0]; changed[1] = false; break; // only X
         case 3: this.zoom_curr[1] = m[1]; changed[0] = false; break; // only Y
      }

      var xmin, xmax, ymin, ymax, isany = false,
          idx = this.swap_xy ? 1 : 0, idy = 1 - idx;

      if (changed[idx] && (Math.abs(this.zoom_curr[idx] - this.zoom_origin[idx]) > 10)) {
         xmin = Math.min(this.RevertX(this.zoom_origin[idx]), this.RevertX(this.zoom_curr[idx]));
         xmax = Math.max(this.RevertX(this.zoom_origin[idx]), this.RevertX(this.zoom_curr[idx]));
         isany = true;
      }

      if (changed[idy] && (Math.abs(this.zoom_curr[idy] - this.zoom_origin[idy]) > 10)) {
         ymin = Math.min(this.RevertY(this.zoom_origin[idy]), this.RevertY(this.zoom_curr[idy]));
         ymax = Math.max(this.RevertY(this.zoom_origin[idy]), this.RevertY(this.zoom_curr[idy]));
         isany = true;
      }

      var kind = this.zoom_kind, pnt = (kind===1) ? { x: this.zoom_origin[0], y: this.zoom_origin[1] } : null;

      this.clearInteractiveElements();

      if (isany) {
         this.zoom_changed_interactive = 2;
         this.Zoom(xmin, xmax, ymin, ymax);
      } else {
         switch (kind) {
            case 1:
               var fp = this.frame_painter();
               if (fp) fp.ProcessFrameClick(pnt);
               break;
            case 2:
               this.pad_painter().SelectObjectPainter(this.x_handle);
               break;
            case 3:
               this.pad_painter().SelectObjectPainter(this.y_handle);
               break;
         }
      }

      this.zoom_kind = 0;
   }

   TFramePainter.prototype.mouseDoubleClick = function() {
      d3.event.preventDefault();
      var m = d3.mouse(this.svg_frame().node());
      this.clearInteractiveElements();
      var kind = "xyz";
      if ((m[0] < 0) || (m[0] > this.frame_width())) kind = this.swap_xy ? "x" : "y"; else
      if ((m[1] < 0) || (m[1] > this.frame_height())) kind = this.swap_xy ? "y" : "x";
      this.Unzoom(kind);
   }

   TFramePainter.prototype.AllowDefaultYZooming = function() {
      // return true if default Y zooming should be enabled
      // it is typically for 2-Dim histograms or
      // when histogram not draw, defined by other painters

      var pad_painter = this.pad_painter(true);
      if (pad_painter &&  pad_painter.painters)
         for (var k = 0; k < pad_painter.painters.length; ++k) {
            var subpainter = pad_painter.painters[k];
            if ((subpainter!==this) && subpainter.wheel_zoomy!==undefined)
               return subpainter.wheel_zoomy;
         }

      return false;
   }

   TFramePainter.prototype.AnalyzeMouseWheelEvent = function(event, item, dmin, ignore) {

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

   TFramePainter.prototype.mouseWheel = function() {
      d3.event.stopPropagation();

      d3.event.preventDefault();
      this.clearInteractiveElements();

      var itemx = { name: "x", ignore: false },
          itemy = { name: "y", ignore: !this.AllowDefaultYZooming() },
          cur = d3.mouse(this.svg_frame().node()),
          w = this.frame_width(), h = this.frame_height();

      this.AnalyzeMouseWheelEvent(d3.event, this.swap_xy ? itemy : itemx, cur[0] / w, (cur[1] >=0) && (cur[1] <= h));

      this.AnalyzeMouseWheelEvent(d3.event, this.swap_xy ? itemx : itemy, 1 - cur[1] / h, (cur[0] >= 0) && (cur[0] <= w));

      this.Zoom(itemx.min, itemx.max, itemy.min, itemy.max);

      if (itemx.changed || itemy.changed) this.zoom_changed_interactive = 2;
   }

   TFramePainter.prototype.startTouchZoom = function() {
      // in case when zooming was started, block any other kind of events
      if (this.zoom_kind != 0) {
         d3.event.preventDefault();
         d3.event.stopPropagation();
         return;
      }

      var arr = d3.touches(this.svg_frame().node());
      this.touch_cnt+=1;

      // normally double-touch will be handled
      // touch with single click used for context menu
      if (arr.length == 1) {
         // this is touch with single element

         var now = new Date();
         var diff = now.getTime() - this.last_touch.getTime();
         this.last_touch = now;

         if ((diff < 300) && (this.zoom_curr != null)
               && (Math.abs(this.zoom_curr[0] - arr[0][0]) < 30)
               && (Math.abs(this.zoom_curr[1] - arr[0][1]) < 30)) {

            d3.event.preventDefault();
            d3.event.stopPropagation();

            this.clearInteractiveElements();
            this.Unzoom("xyz");

            this.last_touch = new Date(0);

            this.svg_frame().on("touchcancel", null)
                            .on("touchend", null, true);
         } else
         if (JSROOT.gStyle.ContextMenu) {
            this.zoom_curr = arr[0];
            this.svg_frame().on("touchcancel", this.endTouchSel.bind(this))
                            .on("touchend", this.endTouchSel.bind(this));
            d3.event.preventDefault();
            d3.event.stopPropagation();
         }
      }

      if ((arr.length != 2) || !JSROOT.gStyle.Zooming || !JSROOT.gStyle.ZoomTouch) return;

      d3.event.preventDefault();
      d3.event.stopPropagation();

      this.clearInteractiveElements();

      this.svg_frame().on("touchcancel", null)
                      .on("touchend", null);

      var pnt1 = arr[0], pnt2 = arr[1], w = this.frame_width(), h = this.frame_height();

      this.zoom_curr = [ Math.min(pnt1[0], pnt2[0]), Math.min(pnt1[1], pnt2[1]) ];
      this.zoom_origin = [ Math.max(pnt1[0], pnt2[0]), Math.max(pnt1[1], pnt2[1]) ];

      if ((this.zoom_curr[0] < 0) || (this.zoom_curr[0] > w)) {
         this.zoom_kind = 103; // only y
         this.zoom_curr[0] = 0;
         this.zoom_origin[0] = w;
      } else if ((this.zoom_origin[1] > h) || (this.zoom_origin[1] < 0)) {
         this.zoom_kind = 102; // only x
         this.zoom_curr[1] = 0;
         this.zoom_origin[1] = h;
      } else {
         this.zoom_kind = 101; // x and y
      }

      this.SwitchTooltip(false);

      this.zoom_rect = this.svg_frame().append("rect")
            .attr("class", "zoom")
            .attr("id", "zoomRect")
            .attr("x", this.zoom_curr[0])
            .attr("y", this.zoom_curr[1])
            .attr("width", this.zoom_origin[0] - this.zoom_curr[0])
            .attr("height", this.zoom_origin[1] - this.zoom_curr[1]);

      d3.select(window).on("touchmove.zoomRect", this.moveTouchSel.bind(this))
                       .on("touchcancel.zoomRect", this.endTouchSel.bind(this))
                       .on("touchend.zoomRect", this.endTouchSel.bind(this));
   }

   TFramePainter.prototype.moveTouchSel = function() {
      if (this.zoom_kind < 100) return;

      d3.event.preventDefault();

      var arr = d3.touches(this.svg_frame().node());

      if (arr.length != 2)
         return this.clearInteractiveElements();

      var pnt1 = arr[0], pnt2 = arr[1];

      if (this.zoom_kind != 103) {
         this.zoom_curr[0] = Math.min(pnt1[0], pnt2[0]);
         this.zoom_origin[0] = Math.max(pnt1[0], pnt2[0]);
      }
      if (this.zoom_kind != 102) {
         this.zoom_curr[1] = Math.min(pnt1[1], pnt2[1]);
         this.zoom_origin[1] = Math.max(pnt1[1], pnt2[1]);
      }

      this.zoom_rect.attr("x", this.zoom_curr[0])
                     .attr("y", this.zoom_curr[1])
                     .attr("width", this.zoom_origin[0] - this.zoom_curr[0])
                     .attr("height", this.zoom_origin[1] - this.zoom_curr[1]);

      if ((this.zoom_origin[0] - this.zoom_curr[0] > 10)
           || (this.zoom_origin[1] - this.zoom_curr[1] > 10))
         this.SwitchTooltip(false);

      d3.event.stopPropagation();
   }

   TFramePainter.prototype.endTouchSel = function() {

      this.svg_frame().on("touchcancel", null)
                      .on("touchend", null);

      if (this.zoom_kind === 0) {
         // special case - single touch can ends up with context menu

         d3.event.preventDefault();

         var now = new Date();

         var diff = now.getTime() - this.last_touch.getTime();

         if ((diff > 500) && (diff<2000) && !this.frame_painter().IsTooltipShown()) {
            this.ShowContextMenu('main', { clientX: this.zoom_curr[0], clientY: this.zoom_curr[1] });
            this.last_touch = new Date(0);
         } else {
            this.clearInteractiveElements();
         }
      }

      if (this.zoom_kind < 100) return;

      d3.event.preventDefault();
      d3.select(window).on("touchmove.zoomRect", null)
                       .on("touchend.zoomRect", null)
                       .on("touchcancel.zoomRect", null);

      var xmin, xmax, ymin, ymax, isany = false,
          xid = this.swap_xy ? 1 : 0, yid = 1 - xid,
          changed = [true, true];
      if (this.zoom_kind === 102) changed[1] = false;
      if (this.zoom_kind === 103) changed[0] = false;

      if (changed[xid] && (Math.abs(this.zoom_curr[xid] - this.zoom_origin[xid]) > 10)) {
         xmin = Math.min(this.RevertX(this.zoom_origin[xid]), this.RevertX(this.zoom_curr[xid]));
         xmax = Math.max(this.RevertX(this.zoom_origin[xid]), this.RevertX(this.zoom_curr[xid]));
         isany = true;
      }

      if (changed[yid] && (Math.abs(this.zoom_curr[yid] - this.zoom_origin[yid]) > 10)) {
         ymin = Math.min(this.RevertY(this.zoom_origin[yid]), this.RevertY(this.zoom_curr[yid]));
         ymax = Math.max(this.RevertY(this.zoom_origin[yid]), this.RevertY(this.zoom_curr[yid]));
         isany = true;
      }

      this.clearInteractiveElements();
      this.last_touch = new Date(0);

      if (isany) {
         this.zoom_changed_interactive = 2;
         this.Zoom(xmin, xmax, ymin, ymax);
      }

      d3.event.stopPropagation();
   }

   TFramePainter.prototype.ShowContextMenu = function(kind, evnt, obj) {
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

   TFramePainter.prototype.ShowAxisStatus = function(axis_name) {
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

   TFramePainter.prototype.AddInteractive = function(forbid_zooming) {

      if (!JSROOT.gStyle.Zooming && !JSROOT.gStyle.ContextMenu) return;

      var svg = this.svg_frame();

      if (svg.empty() || svg.property('interactive_set')) return;

      this.AddKeysHandler();

      this.last_touch = new Date(0);
      this.zoom_kind = 0; // 0 - none, 1 - XY, 2 - only X, 3 - only Y, (+100 for touches)
      this.zoom_rect = null;
      this.zoom_origin = null;  // original point where zooming started
      this.zoom_curr = null;    // current point for zooming
      this.touch_cnt = 0;

      if (JSROOT.gStyle.Zooming && !forbid_zooming) {
         if (JSROOT.gStyle.ZoomMouse) {
            svg.on("mousedown", this.startRectSel.bind(this));
            svg.on("dblclick", this.mouseDoubleClick.bind(this));
         }
         if (JSROOT.gStyle.ZoomWheel) {
            svg.on("wheel", this.mouseWheel.bind(this));
         }
      }

      if (JSROOT.touches && ((JSROOT.gStyle.Zooming && JSROOT.gStyle.ZoomTouch && !forbid_zooming) || JSROOT.gStyle.ContextMenu))
         svg.on("touchstart", this.startTouchZoom.bind(this));

      if (JSROOT.gStyle.ContextMenu) {
         if (JSROOT.touches) {
            svg.selectAll(".xaxis_container")
               .on("touchstart", this.startTouchMenu.bind(this,"x"));
            svg.selectAll(".yaxis_container")
                .on("touchstart", this.startTouchMenu.bind(this,"y"));
         }
         svg.on("contextmenu", this.ShowContextMenu.bind(this));
         svg.selectAll(".xaxis_container")
             .on("contextmenu", this.ShowContextMenu.bind(this,"x"));
         svg.selectAll(".yaxis_container")
             .on("contextmenu", this.ShowContextMenu.bind(this,"y"));
      }

      svg.selectAll(".xaxis_container")
         .on("mousemove", this.ShowAxisStatus.bind(this,"x"));
      svg.selectAll(".yaxis_container")
         .on("mousemove", this.ShowAxisStatus.bind(this,"y"));

      svg.property('interactive_set', true);
   }

   function drawFrame(divid, obj) {
      var p = new TFramePainter(obj);
      p.SetDivId(divid, 2);
      p.Redraw();
      return p.DrawingReady();
   }

   // ===========================================================================

   function TPadPainter(pad, iscan) {
      JSROOT.TObjectPainter.call(this, pad);
      this.pad = pad;
      this.iscan = iscan; // indicate if working with canvas
      this.this_pad_name = "";
      if (!this.iscan && (pad !== null) && ('fName' in pad)) {
         this.this_pad_name = pad.fName.replace(" ", "_"); // avoid empty symbol in pad name
         var regexp = new RegExp("^[A-Za-z][A-Za-z0-9_]*$");
         if (!regexp.test(this.this_pad_name)) this.this_pad_name = 'jsroot_pad_' + JSROOT.id_counter++;
      }
      this.painters = []; // complete list of all painters in the pad
      this.has_canvas = true;
   }

   TPadPainter.prototype = Object.create(JSROOT.TObjectPainter.prototype);

   TPadPainter.prototype.Cleanup = function() {
      // cleanup only pad itself, all child elements will be collected and cleanup separately

      for (var k=0;k<this.painters.length;++k)
         this.painters[k].Cleanup();

      var svg_p = this.svg_pad(this.this_pad_name);
      if (!svg_p.empty()) {
         svg_p.property('pad_painter', null);
         svg_p.property('mainpainter', null);
         if (!this.iscan) svg_p.remove();
      }

      this.painters = [];
      this.pad = null;
      this.this_pad_name = "";
      this.has_canvas = false;

      JSROOT.TObjectPainter.prototype.Cleanup.call(this);
   }

   TPadPainter.prototype.CleanPrimitives = function(selector) {
      if (!selector || (typeof selector !== 'function')) return;

      for (var k=this.painters.length-1;k>=0;--k) {
         var p = this.painters[k];
         if (selector(p)) {
            p.Cleanup();
            this.painters.splice(k--, 1);
         }
      }
   }

   TPadPainter.prototype.GetCurrentPrimitiveIndx = function() {
      return this._current_primitive_indx || 0;
   }

   TPadPainter.prototype.GetNumPrimitives = function() {
      return this._num_primitives || 1;
   }

   TPadPainter.prototype.ForEachPainterInPad = function(userfunc, onlypadpainters) {
      userfunc(this);
      for (var k = 0; k < this.painters.length; ++k) {
         var sub = this.painters[k];
         if (typeof sub.ForEachPainterInPad === 'function')
            sub.ForEachPainterInPad(userfunc, onlypadpainters);
         else if (!onlypadpainters) userfunc(sub);
      }
   }

   TPadPainter.prototype.ButtonSize = function(fact) {
      return Math.round((!fact ? 1 : fact) * (this.iscan || !this.has_canvas ? 16 : 12));
   }

   TPadPainter.prototype.IsTooltipAllowed = function() {
      var res = undefined;
      this.ForEachPainterInPad(function(fp) {
         if ((res===undefined) && (fp.tooltip_allowed!==undefined)) res = fp.tooltip_allowed;
      });
      return res !== undefined ? res : false;
   }

   TPadPainter.prototype.SetTooltipAllowed = function(on) {
      this.ForEachPainterInPad(function(fp) {
         if (fp.tooltip_allowed!==undefined) fp.tooltip_allowed = on;
      });
   }

   TPadPainter.prototype.SelectObjectPainter = function(painter) {
      // dummy function, redefined in the TCanvasPainter
   }

   TPadPainter.prototype.CreateCanvasSvg = function(check_resize, new_size) {

      var factor = null, svg = null, lmt = 5, rect = null;

      if (check_resize > 0) {

         if (this._fixed_size) return (check_resize > 1); // flag used to force re-drawing of all subpads

         svg = this.svg_canvas();

         if (svg.empty()) return false;

         factor = svg.property('height_factor');

         rect = this.check_main_resize(check_resize, null, factor);

         if (!rect.changed) return false;

      } else {

         var render_to = this.select_main();

         if (render_to.style('position')=='static')
            render_to.style('position','relative');

         svg = render_to.append("svg")
             .attr("class", "jsroot root_canvas")
             .property('pad_painter', this) // this is custom property
             .property('mainpainter', null) // this is custom property
             .property('current_pad', "") // this is custom property
             .property('redraw_by_resize', false); // could be enabled to force redraw by each resize

         svg.append("svg:title").text("ROOT canvas");
         var frect = svg.append("svg:rect").attr("class","canvas_fillrect")
                               .attr("x",0).attr("y",0);
         if (!JSROOT.BatchMode)
            frect.style("pointer-events", "visibleFill")
                 .on("dblclick", this.EnlargePad.bind(this))
                 .on("click", this.SelectObjectPainter.bind(this, this))
                 .on("mouseenter", this.ShowObjectStatus.bind(this));

         svg.append("svg:g").attr("class","primitives_layer");
         svg.append("svg:g").attr("class","info_layer");
         svg.append("svg:g").attr("class","btns_layer");

         if (JSROOT.gStyle.ContextMenu)
            svg.select(".canvas_fillrect").on("contextmenu", this.ShowContextMenu.bind(this));

         factor = 0.66;
         if (this.pad && this.pad.fCw && this.pad.fCh && (this.pad.fCw > 0)) {
            factor = this.pad.fCh / this.pad.fCw;
            if ((factor < 0.1) || (factor > 10)) factor = 0.66;
         }

         if (this._fixed_size) {
            render_to.style("overflow","auto");
            rect = { width: this.pad.fCw, height: this.pad.fCh };
         } else {
            rect = this.check_main_resize(2, new_size, factor);
         }
      }

      if (!this.fillatt || !this.fillatt.changed)
         this.fillatt = this.createAttFill(this.pad);

      if ((rect.width<=lmt) || (rect.height<=lmt)) {
         svg.style("display", "none");
         console.warn("Hide canvas while geometry too small w=",rect.width," h=",rect.height);
         rect.width = 200; rect.height = 100; // just to complete drawing
      } else {
         svg.style("display", null);
      }

      if (this._fixed_size) {
         svg.attr("x", 0)
            .attr("y", 0)
            .attr("width", rect.width)
            .attr("height", rect.height)
            .style("position", "absolute");
      } else {
        svg.attr("x", 0)
           .attr("y", 0)
           .style("width", "100%")
           .style("height", "100%")
           .style("position", "absolute")
           .style("left", 0)
           .style("top", 0)
           .style("right", 0)
           .style("bottom", 0);
      }

      // console.log('CANVAS SVG width = ' + rect.width + " height = " + rect.height);

      svg.attr("viewBox", "0 0 " + rect.width + " " + rect.height)
         .attr("preserveAspectRatio", "none")  // we do not preserve relative ratio
         .property('height_factor', factor)
         .property('draw_x', 0)
         .property('draw_y', 0)
         .property('draw_width', rect.width)
         .property('draw_height', rect.height);

      svg.select(".canvas_fillrect")
         .attr("width", rect.width)
         .attr("height", rect.height)
         .call(this.fillatt.func);

      this.svg_layer("btns_layer")
          .attr("transform","translate(2," + (rect.height - this.ButtonSize(1.25)) + ")")
          .attr("display", svg.property("pad_enlarged") ? "none" : null); // hide buttons when sub-pad is enlarged

      return true;
   }

   TPadPainter.prototype.EnlargePad = function() {

      if (d3.event) {
         d3.event.preventDefault();
         d3.event.stopPropagation();
      }

      var svg_can = this.svg_canvas(),
          pad_enlarged = svg_can.property("pad_enlarged");

      if (this.iscan || !this.has_canvas || (!pad_enlarged && !this.HasObjectsToDraw() && !this.painters)) {
         if (this._fixed_size) return; // canvas cannot be enlarged in such mode
         if (!this.enlarge_main('toggle')) return;
         if (this.enlarge_main('state')=='off') svg_can.property("pad_enlarged", null);
      } else {
         if (!pad_enlarged) {
            this.enlarge_main(true);
            svg_can.property("pad_enlarged", this.pad);
         } else
         if (pad_enlarged === this.pad) {
            this.enlarge_main(false);
            svg_can.property("pad_enlarged", null);
         } else {
            console.error('missmatch with pad double click events');
         }
      }

      this.CheckResize({ force: true });
   }

   TPadPainter.prototype.CreatePadSvg = function(only_resize) {
      // returns true when pad is displayed and all its items should be redrawn

      if (!this.has_canvas) {
         this.CreateCanvasSvg(only_resize ? 2 : 0);
         return true;
      }

      var svg_can = this.svg_canvas(),
          width = svg_can.property("draw_width"),
          height = svg_can.property("draw_height"),
          pad_enlarged = svg_can.property("pad_enlarged"),
          pad_visible = !pad_enlarged || (pad_enlarged === this.pad),
          w = Math.round(this.pad.fAbsWNDC * width),
          h = Math.round(this.pad.fAbsHNDC * height),
          x = Math.round(this.pad.fAbsXlowNDC * width),
          y = Math.round(height * (1 - this.pad.fAbsYlowNDC)) - h,
          svg_pad = null, svg_rect = null, btns = null;

      if (pad_enlarged === this.pad) { w = width; h = height; x = y = 0; }

      if (only_resize) {
         svg_pad = this.svg_pad(this.this_pad_name);
         svg_rect = svg_pad.select(".root_pad_border");
         btns = this.svg_layer("btns_layer", this.this_pad_name);
      } else {
         svg_pad = svg_can.select(".primitives_layer")
             .append("svg:svg") // here was g before, svg used to blend all drawin outside
             .attr("class", "root_pad")
             .attr("pad", this.this_pad_name) // set extra attribute  to mark pad name
             .property('pad_painter', this) // this is custom property
             .property('mainpainter', null); // this is custom property
         svg_rect = svg_pad.append("svg:rect").attr("class", "root_pad_border");

         svg_pad.append("svg:g").attr("class","primitives_layer");
         btns = svg_pad.append("svg:g").attr("class","btns_layer");

         if (JSROOT.gStyle.ContextMenu)
            svg_rect.on("contextmenu", this.ShowContextMenu.bind(this));

         if (!JSROOT.BatchMode)
            svg_rect.attr("pointer-events", "visibleFill") // get events also for not visible rect
                    .on("dblclick", this.EnlargePad.bind(this))
                    .on("click", this.SelectObjectPainter.bind(this, this))
                    .on("mouseenter", this.ShowObjectStatus.bind(this));
      }

      if (!this.fillatt || !this.fillatt.changed)
         this.fillatt = this.createAttFill(this.pad);
      if (!this.lineatt || !this.lineatt.changed) {
         this.lineatt = new JSROOT.TAttLineHandler(this.pad);
         if (this.pad.fBorderMode == 0) this.lineatt.color = 'none';
      }

      svg_pad
              //.attr("transform", "translate(" + x + "," + y + ")") // is not handled for SVG
             .attr("display", pad_visible ? null : "none")
             .attr("viewBox", "0 0 " + w + " " + h) // due to svg
             .attr("preserveAspectRatio", "none")   // due to svg, we do not preserve relative ratio
             .attr("x", x)    // due to svg
             .attr("y", y)   // due to svg
             .attr("width", w)    // due to svg
             .attr("height", h)   // due to svg
             .property('draw_x', x) // this is to make similar with canvas
             .property('draw_y', y)
             .property('draw_width', w)
             .property('draw_height', h);

      svg_rect.attr("x", 0)
              .attr("y", 0)
              .attr("width", w)
              .attr("height", h)
              .call(this.fillatt.func)
              .call(this.lineatt.func);

      if (svg_pad.property('can3d') === 1)
         // special case of 3D canvas overlay
          this.select_main()
              .select(".draw3d_" + this.this_pad_name)
              .style('display', pad_visible ? '' : 'none');

      btns.attr("transform","translate("+ (w - (btns.property('nextx') || 0) - this.ButtonSize(1.25)) + "," + (h - this.ButtonSize(1.25)) + ")");

      return pad_visible;
   }

   TPadPainter.prototype.CheckSpecial = function(obj) {

      if (!obj || (obj._typename!=="TObjArray")) return false;

      if (obj.name == "ListOfColors") {
         if (!this.options || this.options.GlobalColors) // set global list of colors
            JSROOT.Painter.adoptRootColors(obj);
         if (this.options && this.options.LocalColors) {
            // copy existing colors and extend with new values
            this.root_colors = [];
            for (var n=0;n<JSROOT.Painter.root_colors.length;++n)
               this.root_colors[n] = JSROOT.Painter.root_colors[n];
            JSROOT.Painter.extendRootColors(this.root_colors, obj);
         }
         return true;
      }

      if (obj.name == "CurrentColorPalette") {
         var arr = [], missing = false;
         for (var n = 0; n < obj.arr.length; ++n) {
            var col = obj.arr[n];
            if (col && (col._typename == 'TColor')) {
               arr[n] = JSROOT.Painter.MakeColorRGB(col);
            } else {
               console.log('Missing color with index ' + n); missing = true;
            }
         }
         if (!this.options || (!missing && !this.options.IgnorePalette)) this.CanvasPalette = new JSROOT.ColorPalette(arr);
         return true;
      }

      return false;
   }

   TPadPainter.prototype.CheckSpecialsInPrimitives = function(can) {
      var lst = can ? can.fPrimitives : null;
      if (!lst) return;
      for (var i = 0; i < lst.arr.length; ++i) {
         if (this.CheckSpecial(lst.arr[i])) {
            lst.arr.splice(i,1);
            lst.opt.splice(i,1);
            i--;
         }
      }
   }

   TPadPainter.prototype.RemovePrimitive = function(obj) {
      if (!this.pad || !this.pad.fPrimitives) return;
      var indx = this.pad.fPrimitives.arr.indexOf(obj);
      if (indx>=0) this.pad.fPrimitives.RemoveAt(indx);
   }

   TPadPainter.prototype.FindPrimitive = function(exact_obj, classname, name) {
      if (!this.pad || !this.pad.fPrimitives) return null;

      for (var i=0; i < this.pad.fPrimitives.arr.length; i++) {
         var obj = this.pad.fPrimitives.arr[i];

         if ((exact_obj!==null) && (obj !== exact_obj)) continue;

         if ((classname !== undefined) && (classname !== null))
            if (obj._typename !== classname) continue;

         if ((name !== undefined) && (name !== null))
            if (obj.fName !== name) continue;

         return obj;
      }

      return null;
   }

   TPadPainter.prototype.HasObjectsToDraw = function() {
      // return true if any objects beside sub-pads exists in the pad

      if (!this.pad || !this.pad.fPrimitives) return false;

      for (var n=0;n<this.pad.fPrimitives.arr.length;++n)
         if (this.pad.fPrimitives.arr[n] && this.pad.fPrimitives.arr[n]._typename != "TPad") return true;

      return false;
   }

   TPadPainter.prototype.DrawPrimitives = function(indx, callback, ppainter) {

      if (indx===0) {
         // flag used to prevent immediate pad redraw during normal drawing sequence
         this._doing_pad_draw = true;

         // set number of primitves
         this._num_primitives = this.pad && this.pad.fPrimitives ? this.pad.fPrimitives.arr.length : 0;
      }

      while (true) {
         if (ppainter) ppainter._primitive = true; // mark painter as belonging to primitives

         if (!this.pad || (indx >= this.pad.fPrimitives.arr.length)) {
            delete this._doing_pad_draw;
            return JSROOT.CallBack(callback);
         }

         // handle use to invoke callback only when necessary
         var handle = { func: this.DrawPrimitives.bind(this, indx+1, callback) };

         // set current index
         this._current_primitive_indx = indx;

         ppainter = JSROOT.draw(this.divid, this.pad.fPrimitives.arr[indx], this.pad.fPrimitives.opt[indx], handle);

         if (!handle.completed) return;
         indx++;
      }
   }

   TPadPainter.prototype.GetTooltips = function(pnt) {
      var painters = [], hints = [];

      // first count - how many processors are there
      if (this.painters !== null)
         this.painters.forEach(function(obj) {
            if ('ProcessTooltip' in obj) painters.push(obj);
         });

      if (pnt) pnt.nproc = painters.length;

      painters.forEach(function(obj) {
         var hint = obj.ProcessTooltip(pnt);
         hints.push(hint);
         if (hint && pnt && pnt.painters) hint.painter = obj;
      });

      return hints;
   }

   TPadPainter.prototype.FillContextMenu = function(menu) {

      if (this.pad)
         menu.add("header: " + this.pad._typename + "::" + this.pad.fName);
      else
         menu.add("header: Canvas");

      var tooltipon = this.IsTooltipAllowed();
      menu.addchk(tooltipon, "Show tooltips", this.SetTooltipAllowed.bind(this, !tooltipon));

      if (!this._websocket) {

         function ToggleGridField(arg) {
            this.pad[arg] = this.pad[arg] ? 0 : 1;
            var main = this.svg_pad(this.this_pad_name).property('mainpainter');
            if (main && (typeof main.DrawGrids == 'function')) main.DrawGrids();
         }

         function SetTickField(arg) {
            this.pad[arg.substr(1)] = parseInt(arg[0]);

            var main = this.svg_pad(this.this_pad_name).property('mainpainter');
            if (main && (typeof main.DrawAxes == 'function')) main.DrawAxes();
         }

         menu.addchk(this.pad.fGridx, 'Grid x', 'fGridx', ToggleGridField);
         menu.addchk(this.pad.fGridy, 'Grid y', 'fGridy', ToggleGridField);
         menu.add("sub:Ticks x");
         menu.addchk(this.pad.fTickx == 0, "normal", "0fTickx", SetTickField);
         menu.addchk(this.pad.fTickx == 1, "ticks on both sides", "1fTickx", SetTickField);
         menu.addchk(this.pad.fTickx == 2, "labels on both sides", "2fTickx", SetTickField);
         menu.add("endsub:");
         menu.add("sub:Ticks y");
         menu.addchk(this.pad.fTicky == 0, "normal", "0fTicky", SetTickField);
         menu.addchk(this.pad.fTicky == 1, "ticks on both sides", "1fTicky", SetTickField);
         menu.addchk(this.pad.fTicky == 2, "labels on both sides", "2fTicky", SetTickField);
         menu.add("endsub:");

         //menu.addchk(this.pad.fTickx, 'Tick x', 'fTickx', ToggleField);
         //menu.addchk(this.pad.fTicky, 'Tick y', 'fTicky', ToggleField);

         this.FillAttContextMenu(menu);
      }

      menu.add("separator");

      if (this.ToggleEventStatus)
         menu.addchk(this.HasEventStatus(), "Event status", this.ToggleEventStatus.bind(this));

      if (this.enlarge_main() || (this.has_canvas && this.HasObjectsToDraw()))
         menu.addchk((this.enlarge_main('state')=='on'), "Enlarge " + (this.iscan ? "canvas" : "pad"), this.EnlargePad.bind(this));

      var fname = this.this_pad_name;
      if (fname.length===0) fname = this.iscan ? "canvas" : "pad";
      fname += ".png";

      menu.add("Save as "+fname, fname, this.SaveAsPng.bind(this, false));

      return true;
   }

   TPadPainter.prototype.ShowContextMenu = function(evnt) {
      if (!evnt) {
         // for debug purposes keep original context menu for small region in top-left corner
         var pos = d3.mouse(this.svg_pad(this.this_pad_name).node());

         if (pos && (pos.length==2) && (pos[0]>0) && (pos[0]<10) && (pos[1]>0) && pos[1]<10) return;

         d3.event.stopPropagation(); // disable main context menu
         d3.event.preventDefault();  // disable browser context menu

         // one need to copy event, while after call back event may be changed
         evnt = d3.event;

         var fp = this.frame_painter();
         if (fp) fp.SetLastEventPos();
      }

      JSROOT.Painter.createMenu(this, function(menu) {

         menu.painter.FillContextMenu(menu);

         menu.painter.FillObjectExecMenu(menu, "", function() { menu.show(evnt); });
      }); // end menu creation
   }

   TPadPainter.prototype.Redraw = function(resize) {

      // prevent redrawing
      if (this._doing_pad_draw) return console.log('Prevent redrawing', this.pad.fName);

      var showsubitems = true;

      if (this.iscan) {
         this.CreateCanvasSvg(2);
      } else {
         showsubitems = this.CreatePadSvg(true);
      }

      // even sub-pad is not visible, we should redraw sub-sub-pads to hide them as well
      for (var i = 0; i < this.painters.length; ++i) {
         var sub = this.painters[i];
         if (showsubitems || sub.this_pad_name) sub.Redraw(resize);
      }
   }

   TPadPainter.prototype.NumDrawnSubpads = function() {
      if (this.painters === undefined) return 0;

      var num = 0;

      for (var i = 0; i < this.painters.length; ++i) {
         var obj = this.painters[i].GetObject();
         if (obj && (obj._typename === "TPad")) num++;
      }

      return num;
   }

   TPadPainter.prototype.RedrawByResize = function() {
      if (this.access_3d_kind() === 1) return true;

      for (var i = 0; i < this.painters.length; ++i)
         if (typeof this.painters[i].RedrawByResize === 'function')
            if (this.painters[i].RedrawByResize()) return true;

      return false;
   }

   TPadPainter.prototype.CheckCanvasResize = function(size, force) {

      if (!this.iscan && this.has_canvas) return false;

      if (size && (typeof size === 'object') && size.force) force = true;

      if (!force) force = this.RedrawByResize();

      var changed = this.CreateCanvasSvg(force ? 2 : 1, size);

      // if canvas changed, redraw all its subitems.
      // If redrawing was forced for canvas, same applied for sub-elements
      if (changed)
         for (var i = 0; i < this.painters.length; ++i)
            this.painters[i].Redraw(force ? false : true);

      return changed;
   }

   TPadPainter.prototype.UpdateObject = function(obj) {
      if (!obj) return false;

      this.pad.fBits = obj.fBits;
      this.pad.fTitle = obj.fTitle;

      this.pad.fGridx = obj.fGridx;
      this.pad.fGridy = obj.fGridy;
      this.pad.fTickx = obj.fTickx;
      this.pad.fTicky = obj.fTicky;
      this.pad.fLogx  = obj.fLogx;
      this.pad.fLogy  = obj.fLogy;
      this.pad.fLogz  = obj.fLogz;

      this.pad.fUxmin = obj.fUxmin;
      this.pad.fUxmax = obj.fUxmax;
      this.pad.fUymin = obj.fUymin;
      this.pad.fUymax = obj.fUymax;

      this.pad.fLeftMargin   = obj.fLeftMargin;
      this.pad.fRightMargin  = obj.fRightMargin;
      this.pad.fBottomMargin = obj.fBottomMargin
      this.pad.fTopMargin    = obj.fTopMargin;

      this.pad.fFillColor = obj.fFillColor;
      this.pad.fFillStyle = obj.fFillStyle;
      this.pad.fLineColor = obj.fLineColor;
      this.pad.fLineStyle = obj.fLineStyle;
      this.pad.fLineWidth = obj.fLineWidth;

      if (this.iscan) this.CheckSpecialsInPrimitives(obj);

      var fp = this.frame_painter();
      if (fp) fp.UpdateAttributes(!fp.modified_NDC);

      if (!obj.fPrimitives) return false;

      var isany = false, p = 0;
      for (var n = 0; n < obj.fPrimitives.arr.length; ++n) {
         while (p < this.painters.length) {
            var pp = this.painters[p++];
            if (!pp._primitive) continue;
            if (pp.UpdateObject(obj.fPrimitives.arr[n])) isany = true;
            break;
         }
      }

      return isany;
   }

   TPadPainter.prototype.DrawNextSnap = function(lst, indx, call_back, objpainter) {
      // function called when drawing next snapshot from the list
      // it is also used as callback for drawing of previous snap

      if (indx===0) {
         // flag used to prevent immediate pad redraw during first draw
         this._doing_pad_draw = true;
         this._snaps_map = {}; // to control how much snaps are drawn
         this._num_primitives = lst ? lst.length : 0;
      }

      while (true) {

         if (objpainter && lst && lst[indx] && objpainter.snapid === undefined) {
            // keep snap id in painter, will be used for the
            if (this.painters.indexOf(objpainter)<0) this.painters.push(objpainter);
            objpainter.snapid = lst[indx].fObjectID;
         }

         objpainter = null;

         ++indx; // change to the next snap

         if (!lst || indx >= lst.length) {
            delete this._doing_pad_draw;
            delete this._snaps_map;
            return JSROOT.CallBack(call_back, this);
         }

         var snap = lst[indx],
             snapid = snap.fObjectID,
             cnt = this._snaps_map[snapid];

         if (cnt) cnt++; else cnt=1;
         this._snaps_map[snapid] = cnt; // check how many objects with same snapid drawn, use them again

         this._current_primitive_indx = indx;

         // first appropriate painter for the object
         // if same object drawn twice, two painters will exists
         for (var k=0; k<this.painters.length; ++k) {
            if (this.painters[k].snapid === snapid)
               if (--cnt === 0) { objpainter = this.painters[k]; break;  }
         }

         // function which should be called when drawing of next item finished
         var draw_callback = this.DrawNextSnap.bind(this, lst, indx, call_back);

         if (objpainter) {

            if (snap.fKind === 1) { // object itself
               if (objpainter.UpdateObject(snap.fSnapshot, snap.fOption)) objpainter.Redraw();
               continue; // call next
            }

            if (snap.fKind === 2) { // update SVG
               if (objpainter.UpdateObject(snap.fSnapshot)) objpainter.Redraw();
               continue; // call next
            }

            if (snap.fKind === 3) { // subpad
               return objpainter.RedrawPadSnap(snap, draw_callback);
            }

            continue; // call next
         }

         if (snap.fKind === 4) { // specials like list of colors
            this.CheckSpecial(snap.fSnapshot);
            continue;
         }

         if (snap.fKind === 3) { // subpad

            if (snap.fPrimitives._typename) {
               alert("Problem in JSON I/O with primitves for sub-pad");
               snap.fPrimitives = [ snap.fPrimitives ];
            }

            var subpad = snap.fPrimitives[0].fSnapshot;

            subpad.fPrimitives = null; // clear primitives, they just because of I/O

            var padpainter = new TPadPainter(subpad, false);
            padpainter.DecodeOptions(snap.fPrimitives[0].fOption);
            padpainter.SetDivId(this.divid); // pad painter will be registered in the canvas painters list
            padpainter.snapid = snap.fObjectID;

            padpainter.CreatePadSvg();

            if (padpainter.MatchObjectType("TPad") && snap.fPrimitives.length > 1) {
               padpainter.AddButton(JSROOT.ToolbarIcons.camera, "Create PNG", "PadSnapShot");
               padpainter.AddButton(JSROOT.ToolbarIcons.circle, "Enlarge pad", "EnlargePad");

               if (JSROOT.gStyle.ContextMenu)
                  padpainter.AddButton(JSROOT.ToolbarIcons.question, "Access context menus", "PadContextMenus");
            }

            // we select current pad, where all drawing is performed
            var prev_name = padpainter.CurrentPadName(padpainter.this_pad_name);
            padpainter.DrawNextSnap(snap.fPrimitives, 0, function() {
               padpainter.CurrentPadName(prev_name);
               draw_callback(padpainter);
            });
            return;
         }

         var handle = { func: draw_callback };

         // here the case of normal drawing, can be improved
         if (snap.fKind === 1)
            objpainter = JSROOT.draw(this.divid, snap.fSnapshot, snap.fOption, handle);

         if (snap.fKind === 2)
            objpainter = JSROOT.draw(this.divid, snap.fSnapshot, snap.fOption, handle);

         if (!handle.completed) return; // if callback will be invoked, break while loop
      }
   }

   TPadPainter.prototype.FindSnap = function(snapid) {

      if (this.snapid === snapid) return this;

      if (!this.painters) return null;

      for (var k=0;k<this.painters.length;++k) {
         var sub = this.painters[k];

         if (typeof sub.FindSnap === 'function') sub = sub.FindSnap(snapid);
         else if (sub.snapid !== snapid) sub = null;

         if (sub) return sub;
      }

      return null;
   }

   TPadPainter.prototype.RedrawPadSnap = function(snap, call_back) {
      // for the canvas snapshot contains list of objects
      // as first entry, graphical properties of canvas itself is provided
      // in ROOT6 it also includes primitives, but we ignore them

      if (!snap || !snap.fPrimitives) return;

      // VERY BAD, NEED TO BE FIXED IN TBufferJSON - should be fixed now in master
      // Should be fixed now in ROOT
      // if (snap.fPrimitives._typename) snap.fPrimitives = [ snap.fPrimitives ];

      var first = snap.fPrimitives[0].fSnapshot;
      first.fPrimitives = null; // primitives are not interesting, just cannot disable it in IO

      if (this.snapid === undefined) {
         // first time getting snap, create all gui elements first

         this.snapid = snap.fPrimitives[0].fObjectID;

         this.draw_object = first;
         this.pad = first;
         // this._fixed_size = true;

         // if canvas size not specified in batch mode, temporary use 900x700 size
         if (this.batch_mode && (!first.fCw || !first.fCh)) { first.fCw = 900; first.fCh = 700; }

         // case of ROOT7 with always dummy TPad as first entry
         if (!first.fCw || !first.fCh) this._fixed_size = false;

         this.CreateCanvasSvg(0);
         this.SetDivId(this.divid);  // now add to painters list

         this.AddButton(JSROOT.ToolbarIcons.camera, "Create PNG", "CanvasSnapShot", "Ctrl PrintScreen");
         if (JSROOT.gStyle.ContextMenu)
            this.AddButton(JSROOT.ToolbarIcons.question, "Access context menus", "PadContextMenus");

         if (this.enlarge_main('verify'))
            this.AddButton(JSROOT.ToolbarIcons.circle, "Enlarge canvas", "EnlargePad");

         this.DrawNextSnap(snap.fPrimitives, 0, call_back);

         return;
      }

      this.UpdateObject(first); // update only object attributes

      // apply all changes in the object (pad or canvas)
      if (this.iscan) {
         this.CreateCanvasSvg(2);
      } else {
         this.CreatePadSvg(true);
      }

      var isanyfound = false;

      // find and remove painters which no longer exists in the list
      for (var k=0;k<this.painters.length;++k) {
         var sub = this.painters[k];
         if (sub.snapid===undefined) continue; // look only for painters with snapid

         for (var i=1;i<snap.fPrimitives.length;++i)
            if (snap.fPrimitives[i].fObjectID === sub.snapid) { sub = null; isanyfound = true; break; }

         if (sub) {
            // remove painter which does not found in the list of snaps
            this.painters.splice(k--,1);
            sub.Cleanup(); // cleanup such painter
         }
      }

      if (!isanyfound) {
         var svg_p = this.svg_pad(this.this_pad_name);
         if (svg_p && !svg_p.empty())
            svg_p.property('mainpainter', null);
         for (var k=0;k<this.painters.length;++k)
            this.painters[k].Cleanup();
         this.painters = [];
      }

      var padpainter = this,
          prev_name = padpainter.CurrentPadName(padpainter.this_pad_name);

      padpainter.DrawNextSnap(snap.fPrimitives, 0, function() {
         padpainter.CurrentPadName(prev_name);
         call_back(padpainter);
      });
   }

   TPadPainter.prototype.CreateImage = function(format, call_back) {
      if (format=="svg") {
         JSROOT.CallBack(call_back, btoa(this.CreateSvg()));
      } else if ((format=="png") || (format=="jpeg")) {
         this.ProduceImage(true, 'any.' + format, function(can) {
            var res = can.toDataURL('image/' + format),
                separ = res.indexOf("base64,");
            JSROOT.CallBack(call_back, (separ>0) ? res.substr(separ+7) : "");
         });
      } else {
         JSROOT.CallBack(call_back, "");
      }
   }

   TPadPainter.prototype.GetAllRanges = function() {
      var res = "";

      if (this.snapid) {
         res = this.GetPadRanges();
         if (res) res = "id=" + this.snapid + ":" + res + ";";
      }

      for (var k=0;k<this.painters.length;++k)
         if (typeof this.painters[k].GetAllRanges == "function")
            res += this.painters[k].GetAllRanges();

      return res;
   }

   TPadPainter.prototype.GetPadRanges = function() {
      // function returns actual ranges in the pad, which can be applied to the server
      var main = this.main_painter(true, this.this_pad_name),
          p = this.svg_pad(this.this_pad_name),
          f = this.svg_frame(this.this_pad_name);

      if (!main) return "";

      var res1 = main.scale_xmin + ":" +
                 main.scale_xmax + ":" +
                 main.scale_ymin + ":" +
                 main.scale_ymax;

      if (f.empty() || p.empty()) return res1 + ":" + res1;

      var res2 = "";

      // calculate user range for full pad
      var same = function(x) { return x; },
          exp10 = function(x) { return Math.pow(10, x); };

      var func = main.logx ? JSROOT.log10 : same,
          func2 = main.logx ? exp10 : same;

      var k = (func(main.scale_xmax) - func(main.scale_xmin))/f.property("draw_width");
      var x1 = func(main.scale_xmin) - k*f.property("draw_x");
      var x2 = x1 + k*p.property("draw_width");
      res2 += func2(x1) + ":" + func2(x2);

      func = main.logy ? JSROOT.log10 : same;
      func2 = main.logy ? exp10 : same;

      var k = (func(main.scale_ymax) - func(main.scale_ymin))/f.property("draw_height");
      var y2 = func(main.scale_ymax) + k*f.property("draw_y");
      var y1 = y2 - k*p.property("draw_height");
      res2 += ":" + func2(y1) + ":" + func2(y2);

      return res1 + ":" + res2;
   }

   TPadPainter.prototype.ItemContextMenu = function(name) {
       var rrr = this.svg_pad(this.this_pad_name).node().getBoundingClientRect();
       var evnt = { clientX: rrr.left+10, clientY: rrr.top + 10 };

       // use timeout to avoid conflict with mouse click and automatic menu close
       if (name=="pad")
          return setTimeout(this.ShowContextMenu.bind(this, evnt), 50);

       var selp = null, selkind;

       switch(name) {
          case "xaxis":
          case "yaxis":
          case "zaxis":
             selp = this.main_painter();
             selkind = name[0];
             break;
          case "frame":
             selp = this.frame_painter();
             break;
          default: {
             var indx = parseInt(name);
             if (!isNaN(indx)) selp = this.painters[indx];
          }
       }

       if (!selp || (typeof selp.FillContextMenu !== 'function')) return;

       JSROOT.Painter.createMenu(selp, function(menu) {
          if (selp.FillContextMenu(menu,selkind))
             setTimeout(menu.show.bind(menu, evnt), 50);
       });
   }

   TPadPainter.prototype.CreateSvg = function() {
      var main = this.svg_canvas(),
          svg = main.html();

      svg = svg.replace(/url\(\&quot\;\#(\w+)\&quot\;\)/g,"url(#$1)")        // decode all URL
               .replace(/ class=\"\w*\"/g,"")                                // remove all classes
               .replace(/<g transform=\"translate\(\d+\,\d+\)\"><\/g>/g,"")  // remove all empty groups with transform
               .replace(/<g><\/g>/g,"");                                     // remove all empty groups

      svg = '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"' +
            ' viewBox="0 0 ' + main.property('draw_width') + ' ' + main.property('draw_height') + '"' +
            ' width="' + main.property('draw_width') + '"' +
            ' height="' + main.property('draw_height') + '">' + svg + '</svg>';

       return svg;
   }

   TPadPainter.prototype.SaveAsPng = function(full_canvas, filename) {
      if (!filename) {
         filename = this.this_pad_name;
         if (filename.length === 0) filename = this.iscan ? "canvas" : "pad";
         filename += ".png";
      }
      this.ProduceImage(full_canvas, filename)
   }

   TPadPainter.prototype.ProduceImage = function(full_canvas, filename, call_back) {

      var elem = full_canvas ? this.svg_canvas() : this.svg_pad(this.this_pad_name);

      if (elem.empty()) return;

      var painter = full_canvas ? this.pad_painter() : this;

      document.body.style.cursor = 'wait';

      painter.ForEachPainterInPad(function(pp) {

         var main = pp.main_painter(true, pp.this_pad_name);
         if (!main || (typeof main.Render3D !== 'function')) return;

         var can3d = main.access_3d_kind();
         if ((can3d !== 1) && (can3d !== 2)) return;

         var sz = main.size_for_3d(3); // get size for SVG canvas

         var svg3d = main.Render3D(-1111); // render SVG

         //var rrr = new THREE.SVGRenderer({precision:0});
         //rrr.setSize(sz.width, sz.height);
         //rrr.render(main.scene, main.camera);

          main
              .insert("g",".primitives_layer")             // create special group
              .attr("class","temp_saveaspng")
              .attr("transform", "translate(" + sz.x + "," + sz.y + ")")
              .node().appendChild(svg3d);      // add code
      }, true);

//      if (((can3d === 1) || (can3d === 2)) && main && main.Render3D) {
           // this was saving of image buffer from 3D render
//         var canvas = main.renderer.domElement;
//         main.Render3D(0); // WebGL clears buffers, therefore we should render scene and convert immediately
//         var dataUrl = canvas.toDataURL("image/png");
//         dataUrl.replace("image/png", "image/octet-stream");
//         var link = document.createElement('a');
//         if (typeof link.download === 'string') {
//            document.body.appendChild(link); //Firefox requires the link to be in the body
//            link.download = filename;
//            link.href = dataUrl;
//            link.click();
//            document.body.removeChild(link); //remove the link when done
//         }
//      } else


      var options = { name: filename, removeClass: "btns_layer" };
      if (call_back) options.result = "canvas";

      JSROOT.saveSvgAsPng(elem.node(), options, function(res) {

         if (res===null) console.warn('problem when produce image');

         elem.selectAll(".temp_saveaspng").remove();

         document.body.style.cursor = 'auto';

         if (call_back) JSROOT.CallBack(call_back, res);
      });

   }

   TPadPainter.prototype.PadButtonClick = function(funcname) {

      if (funcname == "CanvasSnapShot") return this.SaveAsPng(true);

      if (funcname == "EnlargePad") return this.EnlargePad();

      if (funcname == "PadSnapShot") return this.SaveAsPng(false);

      if (funcname == "PadContextMenus") {

         d3.event.preventDefault();
         d3.event.stopPropagation();

         if (JSROOT.Painter.closeMenu()) return;

         var pthis = this, evnt = d3.event;

         JSROOT.Painter.createMenu(pthis, function(menu) {
            menu.add("header:Menus");

            if (pthis.iscan)
               menu.add("Canvas", "pad", pthis.ItemContextMenu);
            else
               menu.add("Pad", "pad", pthis.ItemContextMenu);

            if (pthis.frame_painter())
               menu.add("Frame", "frame", pthis.ItemContextMenu);

            var main = pthis.main_painter();

            if (main) {
               menu.add("X axis", "xaxis", pthis.ItemContextMenu);
               menu.add("Y axis", "yaxis", pthis.ItemContextMenu);
               if ((typeof main.Dimension === 'function') && (main.Dimension() > 1))
                  menu.add("Z axis", "zaxis", pthis.ItemContextMenu);
            }

            if (pthis.painters && (pthis.painters.length>0)) {
               menu.add("separator");
               var shown = [];
               for (var n=0;n<pthis.painters.length;++n) {
                  var pp = pthis.painters[n];
                  var obj = pp ? pp.GetObject() : null;
                  if (!obj || (shown.indexOf(obj)>=0)) continue;

                  var name = ('_typename' in obj) ? (obj._typename + "::") : "";
                  if ('fName' in obj) name += obj.fName;
                  if (name.length==0) name = "item" + n;
                  menu.add(name, n, pthis.ItemContextMenu);
               }
            }

            menu.show(evnt);
         });

         return;
      }

      // click automatically goes to all sub-pads
      // if any painter indicates that processing completed, it returns true
      var done = false;

      for (var i = 0; i < this.painters.length; ++i) {
         var pp = this.painters[i];

         if (typeof pp.PadButtonClick == 'function')
            pp.PadButtonClick(funcname);

         if (!done && (typeof pp.ButtonClick == 'function'))
            done = pp.ButtonClick(funcname);
      }
   }

   TPadPainter.prototype.FindButton = function(keyname) {
      var group = this.svg_layer("btns_layer", this.this_pad_name);
      if (group.empty()) return;

      var found_func = "";

      group.selectAll("svg").each(function() {
         if (d3.select(this).attr("key") === keyname)
            found_func = d3.select(this).attr("name");
      });

      return found_func;

   }

   TPadPainter.prototype.toggleButtonsVisibility = function(action) {
      var group = this.svg_layer("btns_layer", this.this_pad_name),
          btn = group.select("[name='Toggle']");

      if (btn.empty()) return;

      var state = btn.property('buttons_state');

      if (btn.property('timout_handler')) {
         if (action!=='timeout') clearTimeout(btn.property('timout_handler'));
         btn.property('timout_handler', null);
      }

      var is_visible = false;
      switch(action) {
         case 'enable': is_visible = true; break;
         case 'enterbtn': return; // do nothing, just cleanup timeout
         case 'timeout': is_visible = false; break;
         case 'toggle':
            state = !state;
            btn.property('buttons_state', state);
            is_visible = state;
            break;
         case 'disable':
         case 'leavebtn':
            if (!state) btn.property('timout_handler', setTimeout(this.toggleButtonsVisibility.bind(this,'timeout'), 500));
            return;
      }

      group.selectAll('svg').each(function() {
         if (this===btn.node()) return;
         d3.select(this).style('display', is_visible ? "" : "none");
      });
   }

   TPadPainter.prototype.AddButton = function(btn, tooltip, funcname, keyname) {

      // do not add buttons when not allowed
      if (!JSROOT.gStyle.ToolBar) return;

      var group = this.svg_layer("btns_layer", this.this_pad_name);
      if (group.empty()) return;

      // avoid buttons with duplicate names
      if (!group.select("[name='" + funcname + "']").empty()) return;

      var iscan = this.iscan || !this.has_canvas, ctrl;

      var x = group.property("nextx");
      if (!x) {
         ctrl = JSROOT.ToolbarIcons.CreateSVG(group, JSROOT.ToolbarIcons.rect, this.ButtonSize(), "Toggle tool buttons");

         ctrl.attr("name", "Toggle").attr("x", 0).attr("y", 0).attr("normalx",0)
             .property("buttons_state", (JSROOT.gStyle.ToolBar!=='popup'))
             .on("click", this.toggleButtonsVisibility.bind(this, 'toggle'))
             .on("mouseenter", this.toggleButtonsVisibility.bind(this, 'enable'))
             .on("mouseleave", this.toggleButtonsVisibility.bind(this, 'disable'));

         x = iscan ? this.ButtonSize(1.25) : 0;
      } else {
         ctrl = group.select("[name='Toggle']");
      }

      var svg = JSROOT.ToolbarIcons.CreateSVG(group, btn, this.ButtonSize(),
            tooltip + (iscan ? "" : (" on pad " + this.this_pad_name)) + (keyname ? " (keyshortcut " + keyname + ")" : ""));

      svg.attr("name", funcname).attr("x", x).attr("y", 0).attr("normalx",x)
         .style('display', (ctrl.property("buttons_state") ? '' : 'none'))
         .on("mouseenter", this.toggleButtonsVisibility.bind(this, 'enterbtn'))
         .on("mouseleave", this.toggleButtonsVisibility.bind(this, 'leavebtn'));

      if (keyname) svg.attr("key", keyname);

      svg.on("click", this.PadButtonClick.bind(this, funcname));

      group.property("nextx", x + this.ButtonSize(1.25));

      if (!iscan) {
         group.attr("transform","translate("+ (this.pad_width(this.this_pad_name) - group.property('nextx') - this.ButtonSize(1.25)) + "," + (this.pad_height(this.this_pad_name)-this.ButtonSize(1.25)) + ")");
         ctrl.attr("x", group.property('nextx'));
      }

      if (!iscan && (funcname.indexOf("Pad")!=0) && (this.pad_painter()!==this) && (funcname !== "EnlargePad"))
         this.pad_painter().AddButton(btn, tooltip, funcname);
   }

   TPadPainter.prototype.DrawingReady = function(res_painter) {

      var main = this.main_painter();

      if (main && main.mode3d && typeof main.Render3D == 'function') main.Render3D(-2222);

      JSROOT.TObjectPainter.prototype.DrawingReady.call(this, res_painter);
   }

   TPadPainter.prototype.DecodeOptions = function(opt) {
      var pad = this.GetObject();
      if (!pad) return;

      var d = new JSROOT.DrawOptions(opt);

      if (d.check('WEBSOCKET')) this.OpenWebsocket();

      this.options = { GlobalColors: true, LocalColors: false, IgnorePalette: false, RotateFrame: false, FixFrame: false };

      if (d.check('NOCOLORS') || d.check('NOCOL')) this.options.GlobalColors = this.options.LocalColors = false;
      if (d.check('LCOLORS') || d.check('LCOL')) { this.options.GlobalColors = false; this.options.LocalColors = true; }
      if (d.check('NOPALETTE') || d.check('NOPAL')) this.options.IgnorePalette = true;
      if (d.check('ROTATE')) this.options.RotateFrame = true;
      if (d.check('FIXFRAME')) this.options.FixFrame = true;

      if (d.check('WHITE')) pad.fFillColor = 0;
      if (d.check('LOGX')) pad.fLogx = 1;
      if (d.check('LOGY')) pad.fLogy = 1;
      if (d.check('LOGZ')) pad.fLogz = 1;
      if (d.check('LOG')) pad.fLogx = pad.fLogy = pad.fLogz = 1;
      if (d.check('GRIDX')) pad.fGridx = 1;
      if (d.check('GRIDY')) pad.fGridy = 1;
      if (d.check('GRID')) pad.fGridx = pad.fGridy = 1;
      if (d.check('TICKX')) pad.fTickx = 1;
      if (d.check('TICKY')) pad.fTicky = 1;
      if (d.check('TICK')) pad.fTickx = pad.fTicky = 1;
   }

   function drawPad(divid, pad, opt) {
      var painter = new TPadPainter(pad, false);
      painter.DecodeOptions(opt);

      painter.SetDivId(divid); // pad painter will be registered in the canvas painters list

      if (painter.svg_canvas().empty()) {
         painter.has_canvas = false;
         painter.this_pad_name = "";
      }

      painter.CreatePadSvg();

      if (painter.MatchObjectType("TPad") && (!painter.has_canvas || painter.HasObjectsToDraw())) {
         painter.AddButton(JSROOT.ToolbarIcons.camera, "Create PNG", "PadSnapShot");

         if ((painter.has_canvas && painter.HasObjectsToDraw()) || painter.enlarge_main('verify'))
            painter.AddButton(JSROOT.ToolbarIcons.circle, "Enlarge pad", "EnlargePad");

         if (JSROOT.gStyle.ContextMenu)
            painter.AddButton(JSROOT.ToolbarIcons.question, "Access context menus", "PadContextMenus");
      }

      // we select current pad, where all drawing is performed
      var prev_name = painter.has_canvas ? painter.CurrentPadName(painter.this_pad_name) : undefined;

      // flag used to prevent immediate pad redraw during first draw
      painter.DrawPrimitives(0, function() {
         // we restore previous pad name
         painter.CurrentPadName(prev_name);
         painter.DrawingReady();
      });

      return painter;
   }

   // ==========================================================================================

   function TCanvasPainter(canvas) {
      // used for online canvas painter
      TPadPainter.call(this, canvas, true);
      this._websocket = null;
   }

   TCanvasPainter.prototype = Object.create(TPadPainter.prototype);

   TCanvasPainter.prototype.ChangeLayout = function(layout_kind, call_back) {
      var current = this.get_layout_kind();
      if (current == layout_kind) return JSROOT.CallBack(call_back, true);

      var origin = this.select_main('origin'),
          sidebar = origin.select('.side_panel'),
          main = this.select_main(), lst = [];

      while (main.node().firstChild)
         lst.push(main.node().removeChild(main.node().firstChild));

      if (!sidebar.empty()) JSROOT.cleanup(sidebar.node());

      this.set_layout_kind("simple"); // restore defaults
      origin.html(""); // cleanup origin

      if (layout_kind == 'simple') {
         main = origin;
         for (var k=0;k<lst.length;++k)
            main.node().appendChild(lst[k]);
         this.set_layout_kind(layout_kind);
         // JSROOT.resize(main.node());
         return JSROOT.CallBack(call_back, true);
      }

      var pthis = this;

      JSROOT.AssertPrerequisites("jq2d", function() {

         var grid = new JSROOT.GridDisplay(origin.node(), layout_kind);

         if (layout_kind.indexOf("vert")==0) {
            main = d3.select(grid.GetFrame(0));
            sidebar = d3.select(grid.GetFrame(1));
         } else {
            main = d3.select(grid.GetFrame(1));
            sidebar = d3.select(grid.GetFrame(0));
         }

         main.classed("central_panel", true).style('position','relative');
         sidebar.classed("side_panel", true).style('position','relative');

         // now append all childs to the new main
         for (var k=0;k<lst.length;++k)
            main.node().appendChild(lst[k]);

         pthis.set_layout_kind(layout_kind, ".central_panel");

         JSROOT.CallBack(call_back, true);
      });
   }

   TCanvasPainter.prototype.ToggleProjection = function(kind, call_back) {
      delete this.proj_painter;

      if (kind) this.proj_painter = 1; // just indicator that drawing can be preformed

      if (this.use_openui && this.ShowUI5ProjectionArea)
         return this.ShowUI5ProjectionArea(kind, call_back);

      var layout = 'simple';

      if (kind == "X") layout = 'vert2_31'; else
      if (kind == "Y") layout = 'horiz2_13';

      this.ChangeLayout(layout, call_back);
   }

   TCanvasPainter.prototype.DrawProjection = function(kind,hist) {
      if (!this.proj_painter) return; // ignore drawing if projection not configured

      if (this.proj_painter === 1) {

         var canv = JSROOT.Create("TCanvas"), pthis = this, pad = this.root_pad(), main = this.main_painter(), drawopt;

         if (kind == "X") {
            canv.fLeftMargin = pad.fLeftMargin;
            canv.fRightMargin = pad.fRightMargin;
            canv.fLogx = main.logx ? 1 : 0;
            canv.fUxmin = main.logx ? JSROOT.log10(main.scale_xmin) : main.scale_xmin;
            canv.fUxmax = main.logx ? JSROOT.log10(main.scale_xmax) : main.scale_xmax;
            drawopt = "fixframe";
         } else {
            canv.fBottomMargin = pad.fBottomMargin;
            canv.fTopMargin = pad.fTopMargin;
            canv.fLogx = main.logy ? 1 : 0;
            canv.fUxmin = main.logy ? JSROOT.log10(main.scale_ymin) : main.scale_ymin;
            canv.fUxmax = main.logy ? JSROOT.log10(main.scale_ymax) : main.scale_ymax;
            drawopt = "rotate";
         }

         canv.fPrimitives.Add(hist, "hist");

         if (this.use_openui && this.DrawInUI5ProjectionArea ) {
            // copy frame attributes
            this.DrawInUI5ProjectionArea(canv, drawopt, function(painter) { pthis.proj_painter = painter; })
         } else {
            this.DrawInSidePanel(canv, drawopt, function(painter) { pthis.proj_painter = painter; })
         }
      } else {
         var hp = this.proj_painter.main_painter();
         if (hp) hp.UpdateObject(hist, "hist");
         this.proj_painter.RedrawPad();
      }
   }


   TCanvasPainter.prototype.DrawInSidePanel = function(canv, opt, call_back) {
      var side = this.select_main('origin').select(".side_panel");
      if (side.empty()) return JSROOT.CallBack(call_back, null);
      JSROOT.draw(side.node(), canv, opt, call_back);
   }


   TCanvasPainter.prototype.ShowMessage = function(msg) {
      JSROOT.progress(msg, 7000);
   }

   /// function called when canvas menu item Save is called
   TCanvasPainter.prototype.SaveCanvasAsFile = function(fname) {
      var pthis = this, pnt = fname.indexOf(".");
      this.CreateImage(fname.substr(pnt+1), function(res) {
         pthis.SendWebsocket("SAVE:" + fname + ":" + res);
      })
   }

   TCanvasPainter.prototype.WindowBeforeUnloadHanlder = function() {
      // when window closed, close socket
      this.CloseWebsocket(true);
   }

   TCanvasPainter.prototype.SendWebsocket = function(msg, chid) {
      if (this._websocket)
         this._websocket.Send(msg, chid);
   }

   TCanvasPainter.prototype.CloseWebsocket = function(force) {
      if (this._websocket) {
         this._websocket.Close(force);
         this._websocket.Cleanup();
         delete this._websocket;
      }
   }

   TCanvasPainter.prototype.OpenWebsocket = function(socket_kind) {
      // create websocket for current object (canvas)
      // via websocket one recieved many extra information

      this.CloseWebsocket();

      this._websocket = new JSROOT.WebWindowHandle(socket_kind);
      this._websocket.SetReceiver(this);
      this._websocket.Connect();
   }

   TCanvasPainter.prototype.OnWebsocketOpened = function(handle) {
      // indicate that we are ready to recieve any following commands
   }

   TCanvasPainter.prototype.OnWebsocketClosed = function(handle) {
      if (window) window.close(); // close window when socket disapper
   }

   TCanvasPainter.prototype.OnWebsocketMsg = function(handle, msg) {

      if (msg == "CLOSE") {
         this.OnWebsocketClosed();
         this.CloseWebsocket(true);
      } else if (msg.substr(0,5)=='SNAP:') {
         msg = msg.substr(5);
         var p1 = msg.indexOf(":"),
             snapid = msg.substr(0,p1),
             snap = JSROOT.parse(msg.substr(p1+1));
         this.RedrawPadSnap(snap, function() {
            handle.Send("SNAPDONE:" + snapid); // send ready message back when drawing completed
         });
      } else if (msg.substr(0,6)=='SNAP6:') {
         // This is snapshot, produced with ROOT6, handled slighly different

         this.root6_canvas = true; // indicate that drawing of root6 canvas is peformed
         // if (!this.snap_cnt) this.snap_cnt = 1; else this.snap_cnt++;

         msg = msg.substr(6);
         var p1 = msg.indexOf(":"),
             snapid = msg.substr(0,p1),
             snap = JSROOT.parse(msg.substr(p1+1)),
             pthis = this;

         // console.log('Get SNAP6', this.snap_cnt);

         this.RedrawPadSnap(snap, function() {
            // console.log('Complete SNAP6', pthis.snap_cnt);
            pthis.CompeteCanvasSnapDrawing();
            var ranges = pthis.GetAllRanges();
            if (ranges) ranges = ":" + ranges;
            // if (ranges) console.log("ranges: " + ranges);
            handle.Send("RREADY:" + snapid + ranges); // send ready message back when drawing completed
         });

      } else if (msg.substr(0,4)=='JSON') {
         var obj = JSROOT.parse(msg.substr(4));
         // console.log("get JSON ", msg.length-4, obj._typename);
         this.RedrawObject(obj);

      } else if (msg.substr(0,5)=='MENU:') {
         // this is menu with exact identifier for object
         msg = msg.substr(5);
         var p1 = msg.indexOf(":"),
             menuid = msg.substr(0,p1),
             lst = JSROOT.parse(msg.substr(p1+1));
         // console.log("get MENUS ", typeof lst, 'nitems', lst.length, msg.length-4);
         if (typeof this._getmenu_callback == 'function')
            this._getmenu_callback(lst, menuid);
      } else if (msg.substr(0,4)=='CMD:') {
         msg = msg.substr(4);
         var p1 = msg.indexOf(":"),
             cmdid = msg.substr(0,p1),
             cmd = msg.substr(p1+1),
             reply = "REPLY:" + cmdid + ":";
         if ((cmd == "SVG") || (cmd == "PNG") || (cmd == "JPEG")) {
            this.CreateImage(cmd.toLowerCase(), function(res) {
               handle.Send(reply + res);
            });
         } else {
            console.log('Unrecognized command ' + cmd);
            handle.Send(reply);
         }
      } else if ((msg.substr(0,7)=='DXPROJ:') || (msg.substr(0,7)=='DYPROJ:')) {
         var kind = msg[1],
             hist = JSROOT.parse(msg.substr(7));
         this.DrawProjection(kind, hist);
      } else if (msg.substr(0,5)=='SHOW:') {
         var that = msg.substr(5),
             on = that[that.length-1] == '1';
         this.ShowSection(that.substr(0,that.length-2), on);
      } else {
         console.log("unrecognized msg " + msg);
      }
   }

   TCanvasPainter.prototype.ShowSection = function(that, on) {
      switch(that) {
         case "Menu": break;
         case "StatusBar": break;
         case "Editor": break;
         case "ToolBar": break;
         case "ToolTips": this.SetTooltipAllowed(on); break;
      }
   }

   TCanvasPainter.prototype.CompeteCanvasSnapDrawing = function() {
      if (!this.pad) return;

      if (document) document.title = this.pad.fTitle;

      if (this._all_sections_showed) return;
      this._all_sections_showed = true;
      this.ShowSection("Menu", this.pad.TestBit(JSROOT.TCanvasStatusBits.kMenuBar));
      this.ShowSection("StatusBar", this.pad.TestBit(JSROOT.TCanvasStatusBits.kShowEventStatus));
      this.ShowSection("ToolBar", this.pad.TestBit(JSROOT.TCanvasStatusBits.kShowToolBar));
      this.ShowSection("Editor", this.pad.TestBit(JSROOT.TCanvasStatusBits.kShowEditor));
      this.ShowSection("ToolTips", this.pad.TestBit(JSROOT.TCanvasStatusBits.kShowToolTips));
   }

   TCanvasPainter.prototype.HasEventStatus = function() {
      return this.has_event_status;
   }

   function drawCanvas(divid, can, opt) {
      var nocanvas = (can===null);
      if (nocanvas) can = JSROOT.Create("TCanvas");

      var painter = new TCanvasPainter(can);
      painter.DecodeOptions(opt);
      painter.normal_canvas = !nocanvas;

      painter.SetDivId(divid, -1); // just assign id
      painter.CheckSpecialsInPrimitives(can);
      painter.CreateCanvasSvg(0);
      painter.SetDivId(divid);  // now add to painters list

      painter.AddButton(JSROOT.ToolbarIcons.camera, "Create PNG", "CanvasSnapShot", "Ctrl PrintScreen");
      if (JSROOT.gStyle.ContextMenu)
         painter.AddButton(JSROOT.ToolbarIcons.question, "Access context menus", "PadContextMenus");

      if (painter.enlarge_main('verify'))
         painter.AddButton(JSROOT.ToolbarIcons.circle, "Enlarge canvas", "EnlargePad");

      if (nocanvas && opt.indexOf("noframe") < 0)
         JSROOT.Painter.drawFrame(divid, null);

      painter.DrawPrimitives(0, function() { painter.DrawingReady(); });
      return painter;
   }

   function drawPadSnapshot(divid, snap, opt) {
      // just for debugging without running web canvas

      var can = JSROOT.Create("TCanvas");

      var painter = new TCanvasPainter(can);
      painter.normal_canvas = false;

      painter.SetDivId(divid, -1); // just assign id

      painter.AddButton(JSROOT.ToolbarIcons.camera, "Create PNG", "CanvasSnapShot", "Ctrl PrintScreen");
      if (JSROOT.gStyle.ContextMenu)
         painter.AddButton(JSROOT.ToolbarIcons.question, "Access context menus", "PadContextMenus");

      if (painter.enlarge_main('verify'))
         painter.AddButton(JSROOT.ToolbarIcons.circle, "Enlarge canvas", "EnlargePad");

      // JSROOT.Painter.drawFrame(divid, null);

      painter.RedrawPadSnap(snap, function() { painter.DrawingReady(); });

      return painter;
   }

   JSROOT.TFramePainter = TFramePainter;
   JSROOT.TPadPainter = TPadPainter;
   JSROOT.TCanvasPainter = TCanvasPainter;

   JSROOT.Painter.drawFrame = drawFrame;
   JSROOT.Painter.drawPad = drawPad;
   JSROOT.Painter.drawCanvas = drawCanvas;
   JSROOT.Painter.drawPadSnapshot = drawPadSnapshot;

   return JSROOT;

}));