/// more ROOT classes

import { gStyle, BIT, settings, create, isBatchMode } from '../core.mjs';

import { scaleLinear, rgb as d3_rgb, select as d3_select, pointer as d3_pointer } from '../d3.mjs';

import { getColor } from '../base/colors.mjs';

import { BasePainter } from '../base/BasePainter.mjs';

import { ObjectPainter } from '../base/ObjectPainter.mjs';

import { TH1Painter } from '../hist/TH1Painter.mjs';

import { TAttMarkerHandler } from '../base/TAttMarkerHandler.mjs';

import { TAttLineHandler } from '../base/TAttLineHandler.mjs';

import { addMoveHandler, DrawOptions, floatToString, buildSvgPath, getElementMainPainter } from '../painter.mjs';

import { ensureTCanvas } from '../gpad/TCanvasPainter.mjs';

import { TooltipHandler } from '../gpad/TFramePainter.mjs';


/** @summary Draw TText
  * @private */
function drawText() {
   let text = this.getObject(),
       pp = this.getPadPainter(),
       w = pp.getPadWidth(),
       h = pp.getPadHeight(),
       pos_x = text.fX, pos_y = text.fY,
       tcolor = this.getColor(text.fTextColor),
       use_frame = false,
       fact = 1., textsize = text.fTextSize || 0.05,
       main = this.getFramePainter();

   if (text.TestBit(BIT(14))) {
      // NDC coordinates
      this.isndc = true;
   } else if (main && !main.mode3d) {
      // frame coordiantes
      w = main.getFrameWidth();
      h = main.getFrameHeight();
      use_frame = "upper_layer";
   } else if (pp.getRootPad(true)) {
      // force pad coordiantes
   } else {
      // place in the middle
      this.isndc = true;
      pos_x = pos_y = 0.5;
      text.fTextAlign = 22;
      if (!tcolor) tcolor = 'black';
   }

   this.createG(use_frame);

   this.draw_g.attr("transform", null); // remove transofrm from interactive changes

   this.pos_x = this.axisToSvg("x", pos_x, this.isndc);
   this.pos_y = this.axisToSvg("y", pos_y, this.isndc);

   let arg = { align: text.fTextAlign, x: this.pos_x, y: this.pos_y, text: text.fTitle, color: tcolor, latex: 0 };

   if (text.fTextAngle) arg.rotate = -text.fTextAngle;

   if (text._typename == 'TLatex') { arg.latex = 1; fact = 0.9; } else
   if (text._typename == 'TMathText') { arg.latex = 2; fact = 0.8; }

   this.startTextDrawing(text.fTextFont, Math.round((textsize>1) ? textsize : textsize*Math.min(w,h)*fact));

   this.drawText(arg);

   return this.finishTextDrawing().then(() => {
      if (isBatchMode()) return this;

      this.pos_dx = this.pos_dy = 0;

      if (!this.moveDrag)
         this.moveDrag = function(dx,dy) {
            this.pos_dx += dx;
            this.pos_dy += dy;
            this.draw_g.attr("transform", `translate(${this.pos_dx},${this.pos_dy})`);
        }

      if (!this.moveEnd)
         this.moveEnd = function(not_changed) {
            if (not_changed) return;
            let text = this.getObject();
            text.fX = this.svgToAxis("x", this.pos_x + this.pos_dx, this.isndc),
            text.fY = this.svgToAxis("y", this.pos_y + this.pos_dy, this.isndc);
            this.submitCanvExec(`SetX(${text.fX});;SetY(${text.fY});;`);
         }

      addMoveHandler(this);

      return this;
   });
}

/** @summary Draw TLine
  * @private */
function drawTLine(dom, obj) {

   let painter = new ObjectPainter(dom, obj);

   painter.redraw = function() {
      const kLineNDC = BIT(14),
            line = this.getObject(),
            lineatt = new TAttLineHandler(line),
            isndc = line.TestBit(kLineNDC);

      // create svg:g container for line drawing
      this.createG();

      this.draw_g
          .append("svg:path")
          .attr("d", `M${this.axisToSvg("x", line.fX1, isndc)},${this.axisToSvg("y", line.fY1, isndc)}L${this.axisToSvg("x", line.fX2, isndc)},${this.axisToSvg("y", line.fY2, isndc)}`)
          .call(lineatt.func);

      return this;
   }

   return ensureTCanvas(painter, false).then(() => painter.redraw());
}

/** @summary Draw TPolyLine
  * @private */
function drawPolyLine() {

   // create svg:g container for polyline drawing
   this.createG();

   let polyline = this.getObject(),
       lineatt = new TAttLineHandler(polyline),
       fillatt = this.createAttFill(polyline),
       kPolyLineNDC = BIT(14),
       isndc = polyline.TestBit(kPolyLineNDC),
       cmd = "", func = this.getAxisToSvgFunc(isndc);

   for (let n = 0; n <= polyline.fLastPoint; ++n)
      cmd += ((n > 0) ? "L" : "M") + func.x(polyline.fX[n]) + "," + func.y(polyline.fY[n]);

   if (polyline._typename != "TPolyLine") fillatt.setSolidColor("none");

   if (!fillatt.empty()) cmd+="Z";

   this.draw_g
       .append("svg:path")
       .attr("d", cmd)
       .call(lineatt.func)
       .call(fillatt.func);
}

/** @summary Draw TEllipse
  * @private */
function drawEllipse() {

   let ellipse = this.getObject();

   this.createAttLine({ attr: ellipse });
   this.createAttFill({ attr: ellipse });

   // create svg:g container for ellipse drawing
   this.createG();

   let funcs = this.getAxisToSvgFunc(),
       x = funcs.x(ellipse.fX1),
       y = funcs.y(ellipse.fY1),
       rx = funcs.x(ellipse.fX1 + ellipse.fR1) - x,
       ry = y - funcs.y(ellipse.fY1 + ellipse.fR2),
       path = "", closed_ellipse = (ellipse.fPhimin == 0) && (ellipse.fPhimax == 360);

   // handle same as ellipse with equal radius
   if ((ellipse._typename == "TCrown") && (ellipse.fR1 <= 0))
      rx = funcs.x(ellipse.fX1 + ellipse.fR2) - x;

   if ((ellipse._typename == "TCrown") && (ellipse.fR1 > 0)) {
      let rx1 = rx, ry2 = ry,
          ry1 = y - funcs.y(ellipse.fY1 + ellipse.fR1),
          rx2 = funcs.x(ellipse.fX1 + ellipse.fR2) - x;

      if (closed_ellipse) {
         path = `M${-rx1},0A${rx1},${ry1},0,1,0,${rx1},0A${rx1},${ry1},0,1,0,${-rx1},0` +
                `M${-rx2},0A${rx2},${ry2},0,1,0,${rx2},0A${rx2},${ry2},0,1,0,${-rx2},0`;
      } else {
         let large_arc = (ellipse.fPhimax-ellipse.fPhimin>=180) ? 1 : 0,
             a1 = ellipse.fPhimin*Math.PI/180, a2 = ellipse.fPhimax*Math.PI/180,
             dx1 = Math.round(rx1*Math.cos(a1)), dy1 = Math.round(ry1*Math.sin(a1)),
             dx2 = Math.round(rx1*Math.cos(a2)), dy2 = Math.round(ry1*Math.sin(a2)),
             dx3 = Math.round(rx2*Math.cos(a1)), dy3 = Math.round(ry2*Math.sin(a1)),
             dx4 = Math.round(rx2*Math.cos(a2)), dy4 = Math.round(ry2*Math.sin(a2));

         path = `M${dx2},${dy2}A${rx1},${ry1},0,${large_arc},0,${dx1},${dy1}` +
                `L${dx3},${dy3}A${rx2},${ry2},0,${large_arc},1,${dx4},${dy4}Z`;
      }
   } else if (ellipse.fTheta == 0) {
      if (closed_ellipse) {
         path = `M${-rx},0A${rx},${ry},0,1,0,${rx},0A${rx},${ry},0,1,0,${-rx},0Z`;
      } else {
         let x1 = Math.round(rx * Math.cos(ellipse.fPhimin*Math.PI/180)),
             y1 = Math.round(ry * Math.sin(ellipse.fPhimin*Math.PI/180)),
             x2 = Math.round(rx * Math.cos(ellipse.fPhimax*Math.PI/180)),
             y2 = Math.round(ry * Math.sin(ellipse.fPhimax*Math.PI/180));
         path = `M0,0L${x1},${y1}A${rx},${ry},0,1,1,${x2},${y2}Z`;
      }
   } else {
     let ct = Math.cos(ellipse.fTheta*Math.PI/180),
         st = Math.sin(ellipse.fTheta*Math.PI/180),
         phi1 = ellipse.fPhimin*Math.PI/180,
         phi2 = ellipse.fPhimax*Math.PI/180,
         np = 200,
         dphi = (phi2-phi1) / (np - (closed_ellipse ? 0 : 1)),
         lastx = 0, lasty = 0;
     if (!closed_ellipse) path = "M0,0";
     for (let n = 0; n < np; ++n) {
         let angle = phi1 + n*dphi,
             dx = ellipse.fR1 * Math.cos(angle),
             dy = ellipse.fR2 * Math.sin(angle),
             px = funcs.x(ellipse.fX1 + dx*ct - dy*st) - x,
             py = funcs.y(ellipse.fY1 + dx*st + dy*ct) - y;
         if (!path)
            path = `M${px},${py}`;
         else if (lastx == px)
            path += `v${py-lasty}`;
         else if (lasty == py)
            path += `h${px-lastx}`;
         else
            path += `l${px-lastx},${py-lasty}`;
         lastx = px; lasty = py;
     }
     path += "Z";
   }

   this.draw_g
      .append("svg:path")
      .attr("transform",`translate(${x},${y})`)
      .attr("d", path)
      .call(this.lineatt.func).call(this.fillatt.func);
}

/** @summary Draw TPie
  * @private */
function drawPie() {
   let pie = this.getObject();

   // create svg:g container for ellipse drawing
   this.createG();

   let xc = this.axisToSvg("x", pie.fX),
       yc = this.axisToSvg("y", pie.fY),
       rx = this.axisToSvg("x", pie.fX + pie.fRadius) - xc,
       ry = this.axisToSvg("y", pie.fY + pie.fRadius) - yc;

   this.draw_g.attr("transform",`translate(${xc},${yc})`);

   // Draw the slices
   let nb = pie.fPieSlices.length, total = 0,
       af = (pie.fAngularOffset*Math.PI)/180,
       x1 = Math.round(rx*Math.cos(af)), y1 = Math.round(ry*Math.sin(af));

   for (let n = 0; n < nb; n++)
      total += pie.fPieSlices[n].fValue;

   for (let n = 0; n < nb; n++) {
      let slice = pie.fPieSlices[n],
          lineatt = new TAttLineHandler({attr: slice}),
          fillatt = this.createAttFill(slice);

      af += slice.fValue/total*2*Math.PI;
      let x2 = Math.round(rx*Math.cos(af)), y2 = Math.round(ry*Math.sin(af));

      this.draw_g
          .append("svg:path")
          .attr("d", `M0,0L${x1},${y1}A${rx},${ry},0,0,0,${x2},${y2}z`)
          .call(lineatt.func)
          .call(fillatt.func);
      x1 = x2; y1 = y2;
   }
}

/** @summary Draw TBox
  * @private */
function drawBox() {

   let box = this.getObject(),
       opt = this.getDrawOpt(),
       draw_line = (opt.toUpperCase().indexOf("L")>=0),
       lineatt = this.createAttLine(box),
       fillatt = this.createAttFill(box);

   // create svg:g container for box drawing
   this.createG();

   let x1 = this.axisToSvg("x", box.fX1),
       x2 = this.axisToSvg("x", box.fX2),
       y1 = this.axisToSvg("y", box.fY1),
       y2 = this.axisToSvg("y", box.fY2),
       xx = Math.min(x1,x2), yy = Math.min(y1,y2),
       ww = Math.abs(x2-x1), hh = Math.abs(y1-y2);

   // if box filled, contour line drawn only with "L" draw option:
   if (!fillatt.empty() && !draw_line) lineatt.color = "none";

   this.draw_g
       .append("svg:path")
       .attr("d", `M${xx},${yy}h${ww}v${hh}h${-ww}z`)
       .call(lineatt.func)
       .call(fillatt.func);

   if (box.fBorderMode && box.fBorderSize && fillatt.hasColor()) {
      let pww = box.fBorderSize, phh = box.fBorderSize,
          side1 = `M${xx},${yy}h${ww}l${-pww},${phh}h${2*pww-ww}v${hh-2*phh}l${-pww},${phh}z`,
          side2 = `M${xx+ww},${yy+hh}v${-hh}l${-pww},${phh}v${hh-2*phh}h${2*pww-ww}l${-pww},${phh}z`;

      if (box.fBorderMode < 0) { let s = side1; side1 = side2; side2 = s; }

      this.draw_g.append("svg:path")
                 .attr("d", side1)
                 .call(fillatt.func)
                 .style("fill", d3_rgb(fillatt.color).brighter(0.5).formatHex());

      this.draw_g.append("svg:path")
          .attr("d", side2)
          .call(fillatt.func)
          .style("fill", d3_rgb(fillatt.color).darker(0.5).formatHex());
   }
}

/** @summary Draw TMarker
  * @private */
function drawMarker() {
   let marker = this.getObject(),
       att = new TAttMarkerHandler(marker),
       kMarkerNDC = BIT(14),
       isndc = marker.TestBit(kMarkerNDC);

   // create svg:g container for box drawing
   this.createG();

   let x = this.axisToSvg("x", marker.fX, isndc),
       y = this.axisToSvg("y", marker.fY, isndc),
       path = att.create(x,y);

   if (path)
      this.draw_g.append("svg:path")
          .attr("d", path)
          .call(att.func);
}

/** @summary Draw TPolyMarker
  * @private */
function drawPolyMarker() {

   // create svg:g container for box drawing
   this.createG();

   let poly = this.getObject(),
       att = new TAttMarkerHandler(poly),
       path = "",
       func = this.getAxisToSvgFunc();

   for (let n = 0; n < poly.fN; ++n)
      path += att.create(func.x(poly.fX[n]), func.y(poly.fY[n]));

   if (path)
      this.draw_g.append("svg:path")
          .attr("d", path)
          .call(att.func);
}

/** @summary Draw TArrow
  * @private */
function drawArrow() {
   let arrow = this.getObject(), kLineNDC = BIT(14),
       oo = arrow.fOption, rect = this.getPadPainter().getPadRect();

   this.wsize = Math.max(3, Math.round(Math.max(rect.width, rect.height) * arrow.fArrowSize*0.8));
   this.isndc = arrow.TestBit(kLineNDC);
   this.angle2 = arrow.fAngle/2/180 * Math.PI;
   this.beg = this.mid = this.end = 0;

   if (oo.indexOf("<")==0)
      this.beg = (oo.indexOf("<|") == 0) ? 12 : 2;
   if (oo.indexOf("->-")>=0)
      this.mid = 1;
   else if (oo.indexOf("-|>-")>=0)
      this.mid = 11;
   else if (oo.indexOf("-<-")>=0)
      this.mid = 2;
   else if (oo.indexOf("-<|-")>=0)
      this.mid = 12;

   let p1 = oo.lastIndexOf(">"), p2 = oo.lastIndexOf("|>"), len = oo.length;
   if ((p1 >= 0) && (p1 == len-1))
      this.end = ((p2 >= 0) && (p2 == len-2)) ? 11 : 1;

   this.createAttLine({ attr: arrow });

   this.createG();

   this.x1 = this.axisToSvg("x", arrow.fX1, this.isndc, true);
   this.y1 = this.axisToSvg("y", arrow.fY1, this.isndc, true);
   this.x2 = this.axisToSvg("x", arrow.fX2, this.isndc, true);
   this.y2 = this.axisToSvg("y", arrow.fY2, this.isndc, true);

   this.rotate = function(angle, x0, y0) {
      let dx = this.wsize * Math.cos(angle), dy = this.wsize * Math.sin(angle), res = "";
      if ((x0 !== undefined) && (y0 !== undefined)) {
         res =  `M${Math.round(x0-dx)},${Math.round(y0-dy)}`;
      } else {
         dx = -dx; dy = -dy;
      }
      res += `l${Math.round(dx)},${Math.round(dy)}`;
      if (x0 && (y0===undefined)) res+="z";
      return res;
   };

   this.createPath = function() {
      let angle = Math.atan2(this.y2 - this.y1, this.x2 - this.x1),
          dlen = this.wsize * Math.cos(this.angle2),
          dx = dlen*Math.cos(angle), dy = dlen*Math.sin(angle),
          path = "";

      if (this.beg)
         path += this.rotate(angle - Math.PI - this.angle2, this.x1, this.y1) +
                 this.rotate(angle - Math.PI + this.angle2, this.beg > 10);

      if (this.mid % 10 == 2)
         path += this.rotate(angle - Math.PI - this.angle2, (this.x1+this.x2-dx)/2, (this.y1+this.y2-dy)/2) +
                 this.rotate(angle - Math.PI + this.angle2, this.mid > 10);

      if (this.mid % 10 == 1)
         path += this.rotate(angle - this.angle2, (this.x1+this.x2+dx)/2, (this.y1+this.y2+dy)/2) +
                 this.rotate(angle + this.angle2, this.mid > 10);

      if (this.end)
         path += this.rotate(angle - this.angle2, this.x2, this.y2) +
                 this.rotate(angle + this.angle2, this.end > 10);

      return `M${Math.round(this.x1 + (this.beg > 10 ? dx : 0))},${Math.round(this.y1 + (this.beg > 10 ? dy : 0))}` +
             `L${Math.round(this.x2 - (this.end > 10 ? dx : 0))},${Math.round(this.y2 - (this.end > 10 ? dy : 0))}` +
              path;
   };

   let elem = this.draw_g.append("svg:path")
                  .attr("d", this.createPath())
                  .call(this.lineatt.func);

   if ((this.beg > 10) || (this.end > 10)) {
      this.createAttFill({ attr: arrow });
      elem.call(this.fillatt.func);
   } else {
      elem.style('fill','none');
   }

   if (!isBatchMode()) return;

   if (!this.moveStart)
      this.moveStart = function(x,y) {
         let fullsize = Math.sqrt(Math.pow(this.x1-this.x2,2) + Math.pow(this.y1-this.y2,2)),
             sz1 = Math.sqrt(Math.pow(x-this.x1,2) + Math.pow(y-this.y1,2))/fullsize,
             sz2 = Math.sqrt(Math.pow(x-this.x2,2) + Math.pow(y-this.y2,2))/fullsize;
         if (sz1>0.9) this.side = 1; else if (sz2>0.9) this.side = -1; else this.side = 0;
      };

   if (!this.moveDrag)
      this.moveDrag = function(dx,dy) {
         if (this.side != 1) { this.x1 += dx; this.y1 += dy; }
         if (this.side != -1) { this.x2 += dx; this.y2 += dy; }
         this.draw_g.select('path').attr("d", this.createPath());
      };

   if (!this.moveEnd)
      this.moveEnd = function(not_changed) {
         if (not_changed) return;
         let arrow = this.getObject(), exec = "";
         arrow.fX1 = this.svgToAxis("x", this.x1, this.isndc);
         arrow.fX2 = this.svgToAxis("x", this.x2, this.isndc);
         arrow.fY1 = this.svgToAxis("y", this.y1, this.isndc);
         arrow.fY2 = this.svgToAxis("y", this.y2, this.isndc);
         if (this.side != 1) exec += `SetX1(${arrow.fX1});;SetY1(${arrow.fY1});;`;
         if (this.side != -1) exec += `SetX2(${arrow.fX2});;SetY2(${arrow.fY2});;`;
         this.submitCanvExec(exec + "Notify();;");
      };

   addMoveHandler(this);
}


/**
 * @summary Painter for TGraphPolargram objects.
 *
 * @private */

class TGraphPolargramPainter extends ObjectPainter {

   /** @summary Create painter
     * @param {object|string} dom - DOM element for drawing or element id
     * @param {object} polargram - object to draw */
   constructor(dom, polargram) {
      super(dom, polargram);
      this.$polargram = true; // indicate that this is polargram
      this.zoom_rmin = this.zoom_rmax = 0;
   }

   /** @summary Translate coordinates */
   translate(angle, radius, keep_float) {
      let _rx = this.r(radius), _ry = _rx/this.szx*this.szy,
          pos = {
            x: _rx * Math.cos(-angle - this.angle),
            y: _ry * Math.sin(-angle - this.angle),
            rx: _rx,
            ry: _ry
         };

      if (!keep_float) {
         pos.x = Math.round(pos.x);
         pos.y = Math.round(pos.y);
         pos.rx =  Math.round(pos.rx);
         pos.ry =  Math.round(pos.ry);
      }
      return pos;
   }

   /** @summary format label for radius ticks */
   format(radius) {

      if (radius === Math.round(radius)) return radius.toString();
      if (this.ndig>10) return radius.toExponential(4);

      return radius.toFixed((this.ndig > 0) ? this.ndig : 0);
   }

   /** @summary Convert axis values to text */
   axisAsText(axis, value) {

      if (axis == "r") {
         if (value === Math.round(value)) return value.toString();
         if (this.ndig>10) return value.toExponential(4);
         return value.toFixed(this.ndig+2);
      }

      value *= 180/Math.PI;
      return (value === Math.round(value)) ? value.toString() : value.toFixed(1);
   }

   /** @summary Returns coordinate of frame - without using frame itself */
   getFrameRect() {
      let pp = this.getPadPainter(),
          pad = pp.getRootPad(true),
          w = pp.getPadWidth(),
          h = pp.getPadHeight(),
          rect = {};

      if (pad) {
         rect.szx = Math.round(Math.max(0.1, 0.5 - Math.max(pad.fLeftMargin, pad.fRightMargin))*w);
         rect.szy = Math.round(Math.max(0.1, 0.5 - Math.max(pad.fBottomMargin, pad.fTopMargin))*h);
      } else {
         rect.szx = Math.round(0.5*w);
         rect.szy = Math.round(0.5*h);
      }

      rect.width = 2*rect.szx;
      rect.height = 2*rect.szy;
      rect.x = Math.round(w/2 - rect.szx);
      rect.y = Math.round(h/2 - rect.szy);

      rect.hint_delta_x = rect.szx;
      rect.hint_delta_y = rect.szy;

      rect.transform = `translate(${rect.x},${rect.y})`;

      return rect;
   }

   /** @summary Process mouse event */
   mouseEvent(kind, evnt) {
      let layer = this.getLayerSvg("primitives_layer"),
          interactive = layer.select(".interactive_ellipse");
      if (interactive.empty()) return;

      let pnt = null;

      if (kind !== 'leave') {
         let pos = d3_pointer(evnt, interactive.node());
         pnt = { x: pos[0], y: pos[1], touch: false };
      }

      this.processFrameTooltipEvent(pnt);
   }

   /** @summary Process mouse wheel event */
   mouseWheel(evnt) {
      evnt.stopPropagation();
      evnt.preventDefault();

      this.processFrameTooltipEvent(null); // remove all tooltips

      let polar = this.getObject();

      if (!polar) return;

      let delta = evnt.wheelDelta ? -evnt.wheelDelta : (evnt.deltaY || evnt.detail);
      if (!delta) return;

      delta = (delta<0) ? -0.2 : 0.2;

      let rmin = this.scale_rmin, rmax = this.scale_rmax, range = rmax - rmin;

      // rmin -= delta*range;
      rmax += delta*range;

      if ((rmin<polar.fRwrmin) || (rmax>polar.fRwrmax)) rmin = rmax = 0;

      if ((this.zoom_rmin != rmin) || (this.zoom_rmax != rmax)) {
         this.zoom_rmin = rmin;
         this.zoom_rmax = rmax;
         this.redrawPad();
      }
   }

   /** @summary Redraw polargram */
   redraw() {
      if (!this.isMainPainter()) return;

      let polar = this.getObject(),
          rect = this.getPadPainter().getFrameRect();

      this.createG();

      this.draw_g.attr("transform", `translate(${Math.round(rect.x + rect.width/2)},${Math.round(rect.y + rect.height/2)})`);
      this.szx = rect.szx;
      this.szy = rect.szy;

      this.scale_rmin = polar.fRwrmin;
      this.scale_rmax = polar.fRwrmax;
      if (this.zoom_rmin != this.zoom_rmax) {
         this.scale_rmin = this.zoom_rmin;
         this.scale_rmax = this.zoom_rmax;
      }

      this.r = scaleLinear().domain([this.scale_rmin, this.scale_rmax]).range([ 0, this.szx ]);
      this.angle = polar.fAxisAngle || 0;

      let ticks = this.r.ticks(5),
          nminor = Math.floor((polar.fNdivRad % 10000) / 100);

      this.createAttLine({ attr: polar });
      if (!this.gridatt) this.gridatt = new TAttLineHandler({ color: polar.fLineColor, style: 2, width: 1 });

      let range = Math.abs(polar.fRwrmax - polar.fRwrmin);
      this.ndig = (range <= 0) ? -3 : Math.round(Math.log10(ticks.length / range));

      // verify that all radius labels are unique
      let lbls = [], indx = 0;
      while (indx<ticks.length) {
         let lbl = this.format(ticks[indx]);
         if (lbls.indexOf(lbl)>=0) {
            if (++this.ndig>10) break;
            lbls = []; indx = 0; continue;
          }
         lbls.push(lbl);
         indx++;
      }

      let exclude_last = false;

      if ((ticks[ticks.length-1] < polar.fRwrmax) && (this.zoom_rmin == this.zoom_rmax)) {
         ticks.push(polar.fRwrmax);
         exclude_last = true;
      }

      this.startTextDrawing(polar.fRadialLabelFont, Math.round(polar.fRadialTextSize * this.szy * 2));

      for (let n = 0; n < ticks.length; ++n) {
         let rx = this.r(ticks[n]), ry = rx/this.szx*this.szy;
         this.draw_g.append("ellipse")
             .attr("cx",0)
             .attr("cy",0)
             .attr("rx",Math.round(rx))
             .attr("ry",Math.round(ry))
             .style("fill", "none")
             .call(this.lineatt.func);

         if ((n < ticks.length-1) || !exclude_last)
            this.drawText({ align: 23, x: Math.round(rx), y: Math.round(polar.fRadialTextSize * this.szy * 0.5),
                            text: this.format(ticks[n]), color: this.getColor(polar.fRadialLabelColor), latex: 0 });

         if ((nminor>1) && ((n < ticks.length-1) || !exclude_last)) {
            let dr = (ticks[1] - ticks[0]) / nminor;
            for (let nn = 1; nn < nminor; ++nn) {
               let gridr = ticks[n] + dr*nn;
               if (gridr > this.scale_rmax) break;
               rx = this.r(gridr); ry = rx/this.szx*this.szy;
               this.draw_g.append("ellipse")
                   .attr("cx",0)
                   .attr("cy",0)
                   .attr("rx",Math.round(rx))
                   .attr("ry",Math.round(ry))
                   .style("fill", "none")
                   .call(this.gridatt.func);
            }
         }
      }

      let nmajor = polar.fNdivPol % 100;
      if ((nmajor !== 8) && (nmajor !== 3)) nmajor = 8;

      return this.finishTextDrawing().then(() => {

         let fontsize = Math.round(polar.fPolarTextSize * this.szy * 2);
         this.startTextDrawing(polar.fPolarLabelFont, fontsize);

         lbls = (nmajor==8) ? ["0", "#frac{#pi}{4}", "#frac{#pi}{2}", "#frac{3#pi}{4}", "#pi", "#frac{5#pi}{4}", "#frac{3#pi}{2}", "#frac{7#pi}{4}"] : ["0", "#frac{2#pi}{3}", "#frac{4#pi}{3}"];
         let aligns = [12, 11, 21, 31, 32, 33, 23, 13];

         for (let n = 0; n < nmajor; ++n) {
            let angle = -n*2*Math.PI/nmajor - this.angle;
            this.draw_g.append("svg:path")
                .attr("d",`M0,0L${Math.round(this.szx*Math.cos(angle))},${Math.round(this.szy*Math.sin(angle))}`)
                .call(this.lineatt.func);

            let aindx = Math.round(16 -angle/Math.PI*4) % 8; // index in align table, here absolute angle is important

            this.drawText({ align: aligns[aindx],
                            x: Math.round((this.szx+fontsize)*Math.cos(angle)),
                            y: Math.round((this.szy + fontsize/this.szx*this.szy)*(Math.sin(angle))),
                            text: lbls[n],
                            color: this.getColor(polar.fPolarLabelColor), latex: 1 });
         }

         return this.finishTextDrawing();
      }).then(() => {

         nminor = Math.floor((polar.fNdivPol % 10000) / 100);

         if (nminor > 1)
            for (let n = 0; n < nmajor*nminor; ++n) {
               if (n % nminor === 0) continue;
               let angle = -n*2*Math.PI/nmajor/nminor - this.angle;
               this.draw_g.append("svg:path")
                   .attr("d",`M0,0L${Math.round(this.szx*Math.cos(angle))},${Math.round(this.szy*Math.sin(angle))}`)
                   .call(this.gridatt.func);
            }

         if (isBatchMode()) return;

         TooltipHandler.assign(this);

         let layer = this.getLayerSvg("primitives_layer"),
             interactive = layer.select(".interactive_ellipse");

         if (interactive.empty())
            interactive = layer.append("g")
                               .classed("most_upper_primitives", true)
                               .append("ellipse")
                               .classed("interactive_ellipse", true)
                               .attr("cx",0)
                               .attr("cy",0)
                               .style("fill", "none")
                               .style("pointer-events","visibleFill")
                               .on('mouseenter', evnt => this.mouseEvent('enter', evnt))
                               .on('mousemove', evnt => this.mouseEvent('move', evnt))
                               .on('mouseleave', evnt => this.mouseEvent('leave', evnt));

         interactive.attr("rx", this.szx).attr("ry", this.szy);

         d3_select(interactive.node().parentNode).attr("transform", this.draw_g.attr("transform"));

         if (settings.Zooming && settings.ZoomWheel)
            interactive.on("wheel", evnt => this.mouseWheel(evnt));
      });
   }

   /** @summary Draw TGraphPolargram */
   static draw(dom, polargram /*, opt*/) {

      let main = getElementMainPainter(dom);
      if (main) {
         if (main.getObject() === polargram)
            return main;
         throw Error("Cannot superimpose TGraphPolargram with any other drawings");
      }

      let painter = new TGraphPolargramPainter(dom, polargram);
      return ensureTCanvas(painter, false).then(() => {
         painter.setAsMainPainter();
         return painter.redraw();
      }).then(() => painter);
   }

} // class TGraphPolargramPainter


/**
 * @summary Painter for TGraphPolar objects.
 *
 * @private
 */

class TGraphPolarPainter extends ObjectPainter {

   /** @summary Redraw TGraphPolar */
   redraw() {
      this.drawGraphPolar();
   }

   /** @summary Decode options for drawing TGraphPolar */
   decodeOptions(opt) {

      let d = new DrawOptions(opt || "L");

      if (!this.options) this.options = {};

      Object.assign(this.options, {
          mark: d.check("P"),
          err: d.check("E"),
          fill: d.check("F"),
          line: d.check("L"),
          curve: d.check("C")
      });

      this.storeDrawOpt(opt);
   }

   /** @summary Drawing TGraphPolar */
   drawGraphPolar() {
      let graph = this.getObject(),
          main = this.getMainPainter();

      if (!graph || !main || !main.$polargram) return;

      if (this.options.mark) this.createAttMarker({ attr: graph });
      if (this.options.err || this.options.line || this.options.curve) this.createAttLine({ attr: graph });
      if (this.options.fill) this.createAttFill({ attr: graph });

      this.createG();

      this.draw_g.attr("transform", main.draw_g.attr("transform"));

      let mpath = "", epath = "", lpath = "", bins = [];

      for (let n = 0; n < graph.fNpoints; ++n) {

         if (graph.fY[n] > main.scale_rmax) continue;

         if (this.options.err) {
            let pos1 = main.translate(graph.fX[n], graph.fY[n] - graph.fEY[n]),
                pos2 = main.translate(graph.fX[n], graph.fY[n] + graph.fEY[n]);
            epath += `M${pos1.x},${pos1.y}L${pos2.x},${pos2.y}`;

            pos1 = main.translate(graph.fX[n] + graph.fEX[n], graph.fY[n]);
            pos2 = main.translate(graph.fX[n] - graph.fEX[n], graph.fY[n]);

            epath += `M${pos1.x},${pos1.y}A${pos2.rx},${pos2.ry},0,0,1,${pos2.x},${pos2.y}`;
         }

         let pos = main.translate(graph.fX[n], graph.fY[n]);

         if (this.options.mark) {
            mpath += this.markeratt.create(pos.x, pos.y);
         }

         if (this.options.line || this.options.fill) {
            lpath += (lpath ? "L" : "M") + pos.x + "," + pos.y;
         }

         if (this.options.curve) {
            pos.grx = pos.x;
            pos.gry = pos.y;
            bins.push(pos);
         }
      }

      if (this.options.fill && lpath)
         this.draw_g.append("svg:path")
             .attr("d", lpath + "Z")
             .call(this.fillatt.func);

      if (this.options.line && lpath)
         this.draw_g.append("svg:path")
             .attr("d", lpath)
             .style("fill", "none")
             .call(this.lineatt.func);

      if (this.options.curve && bins.length)
         this.draw_g.append("svg:path")
                 .attr("d", buildSvgPath("bezier", bins).path)
                 .style("fill", "none")
                 .call(this.lineatt.func);

      if (epath)
         this.draw_g.append("svg:path")
             .attr("d", epath)
             .style("fill","none")
             .call(this.lineatt.func);

      if (mpath)
         this.draw_g.append("svg:path")
               .attr("d", mpath)
               .call(this.markeratt.func);
   }

   /** @summary Create polargram object */
   createPolargram() {
      let polargram = create("TGraphPolargram"),
          gr = this.getObject();

      let rmin = gr.fY[0] || 0, rmax = rmin;
      for (let n = 0; n < gr.fNpoints; ++n) {
         rmin = Math.min(rmin, gr.fY[n] - gr.fEY[n]);
         rmax = Math.max(rmax, gr.fY[n] + gr.fEY[n]);
      }

      polargram.fRwrmin = rmin - (rmax-rmin)*0.1;
      polargram.fRwrmax = rmax + (rmax-rmin)*0.1;

      return polargram;
   }

   /** @summary Provide tooltip at specified point */
   extractTooltip(pnt) {
      if (!pnt) return null;

      let graph = this.getObject(),
          main = this.getMainPainter(),
          best_dist2 = 1e10, bestindx = -1, bestpos = null;

      for (let n = 0; n < graph.fNpoints; ++n) {
         let pos = main.translate(graph.fX[n], graph.fY[n]),
             dist2 = (pos.x-pnt.x)*(pos.x-pnt.x) + (pos.y-pnt.y)*(pos.y-pnt.y);
         if (dist2 < best_dist2) { best_dist2 = dist2; bestindx = n; bestpos = pos; }
      }

      let match_distance = 5;
      if (this.markeratt && this.markeratt.used) match_distance = this.markeratt.getFullSize();

      if (Math.sqrt(best_dist2) > match_distance) return null;

      let res = { name: this.getObject().fName, title: this.getObject().fTitle,
                  x: bestpos.x, y: bestpos.y,
                  color1: this.markeratt && this.markeratt.used ? this.markeratt.color : this.lineatt.color,
                  exact: Math.sqrt(best_dist2) < 4,
                  lines: [ this.getObjectHint() ],
                  binindx: bestindx,
                  menu_dist: match_distance,
                  radius: match_distance
                };

      res.lines.push("r = " + main.axisAsText("r", graph.fY[bestindx]));
      res.lines.push("phi = " + main.axisAsText("phi",graph.fX[bestindx]));

      if (graph.fEY && graph.fEY[bestindx])
         res.lines.push("error r = " + main.axisAsText("r", graph.fEY[bestindx]));

      if (graph.fEX && graph.fEX[bestindx])
         res.lines.push("error phi = " + main.axisAsText("phi", graph.fEX[bestindx]));

      return res;
   }

   /** @summary Show tooltip */
   showTooltip(hint) {

      if (!this.draw_g) return;

      let ttcircle = this.draw_g.select(".tooltip_bin");

      if (!hint) {
         ttcircle.remove();
         return;
      }

      if (ttcircle.empty())
         ttcircle = this.draw_g.append("svg:ellipse")
                             .attr("class","tooltip_bin")
                             .style("pointer-events","none");

      hint.changed = ttcircle.property("current_bin") !== hint.binindx;

      if (hint.changed)
         ttcircle.attr("cx", hint.x)
               .attr("cy", hint.y)
               .attr("rx", Math.round(hint.radius))
               .attr("ry", Math.round(hint.radius))
               .style("fill", "none")
               .style("stroke", hint.color1)
               .property("current_bin", hint.binindx);
   }

   /** @summary Process tooltip event */
   processTooltipEvent(pnt) {
      let hint = this.extractTooltip(pnt);
      if (!pnt || !pnt.disabled) this.showTooltip(hint);
      return hint;
   }

   /** @summary Draw TGraphPolar */
   static draw(dom, graph, opt) {
      let painter = new TGraphPolarPainter(dom, graph);
      painter.decodeOptions(opt);

      let main = painter.getMainPainter();
      if (main && !main.$polargram) {
         console.error('Cannot superimpose TGraphPolar with plain histograms');
         return null;
      }

      let pr = Promise.resolve(null);
      if (!main) {
         if (!graph.fPolargram)
            graph.fPolargram = painter.createPolargram();
         pr = TGraphPolargramPainter.draw(dom, graph.fPolargram);
      }

      return pr.then(() => {
         painter.addToPadPrimitives();
         painter.drawGraphPolar();
         return painter;
      });
   }

} // class TGraphPolarPainter


/**
 * @summary Painter for TSpline objects.
 *
 * @private
 */

class TSplinePainter extends ObjectPainter {

   /** @summary Update TSpline object
     * @private */
   updateObject(obj, opt) {
      let spline = this.getObject();

      if (spline._typename != obj._typename) return false;

      if (spline !== obj) Object.assign(spline, obj);

      if (opt !== undefined) this.decodeOptions(opt);

      return true;
   }

   /** @summary Evaluate spline at given position
     * @private */
   eval(knot, x) {
      let dx = x - knot.fX;

      if (knot._typename == "TSplinePoly3")
         return knot.fY + dx*(knot.fB + dx*(knot.fC + dx*knot.fD));

      if (knot._typename == "TSplinePoly5")
         return knot.fY + dx*(knot.fB + dx*(knot.fC + dx*(knot.fD + dx*(knot.fE + dx*knot.fF))));

      return knot.fY + dx;
   }

   /** @summary Find idex for x value
     * @private */
   findX(x) {
      let spline = this.getObject(),
          klow = 0, khig = spline.fNp - 1;

      if (x <= spline.fXmin) return 0;
      if (x >= spline.fXmax) return khig;

      if(spline.fKstep) {
         // Equidistant knots, use histogramming
         klow = Math.round((x - spline.fXmin)/spline.fDelta);
         // Correction for rounding errors
         if (x < spline.fPoly[klow].fX) {
            klow = Math.max(klow-1,0);
         } else if (klow < khig) {
            if (x > spline.fPoly[klow+1].fX) ++klow;
         }
      } else {
         // Non equidistant knots, binary search
         while(khig-klow>1) {
            let khalf = Math.round((klow+khig)/2);
            if(x > spline.fPoly[khalf].fX) klow = khalf;
                                      else khig = khalf;
         }
      }
      return klow;
   }

   /** @summary Create histogram for axes drawing
     * @private */
   createDummyHisto() {

      let xmin = 0, xmax = 1, ymin = 0, ymax = 1,
          spline = this.getObject();

      if (spline && spline.fPoly) {

         xmin = xmax = spline.fPoly[0].fX;
         ymin = ymax = spline.fPoly[0].fY;

         spline.fPoly.forEach(knot => {
            xmin = Math.min(knot.fX, xmin);
            xmax = Math.max(knot.fX, xmax);
            ymin = Math.min(knot.fY, ymin);
            ymax = Math.max(knot.fY, ymax);
         });

         if (ymax > 0.0) ymax *= 1.05;
         if (ymin < 0.0) ymin *= 1.05;
      }

      let histo = create("TH1I");

      histo.fName = spline.fName + "_hist";
      histo.fTitle = spline.fTitle;

      histo.fXaxis.fXmin = xmin;
      histo.fXaxis.fXmax = xmax;
      histo.fYaxis.fXmin = ymin;
      histo.fYaxis.fXmax = ymax;

      return histo;
   }

   /** @summary Process tooltip event
     * @private */
   processTooltipEvent(pnt) {

      let cleanup = false,
          spline = this.getObject(),
          main = this.getFramePainter(),
          funcs = main ? main.getGrFuncs(this.options.second_x, this.options.second_y) : null,
          xx, yy, knot = null, indx = 0;

      if ((pnt === null) || !spline || !funcs) {
         cleanup = true;
      } else {
         xx = funcs.revertAxis("x", pnt.x);
         indx = this.findX(xx);
         knot = spline.fPoly[indx];
         yy = this.eval(knot, xx);

         if ((indx < spline.fN-1) && (Math.abs(spline.fPoly[indx+1].fX-xx) < Math.abs(xx-knot.fX))) knot = spline.fPoly[++indx];

         if (Math.abs(funcs.grx(knot.fX) - pnt.x) < 0.5*this.knot_size) {
            xx = knot.fX; yy = knot.fY;
         } else {
            knot = null;
            if ((xx < spline.fXmin) || (xx > spline.fXmax)) cleanup = true;
         }
      }

      if (cleanup) {
         if (this.draw_g)
            this.draw_g.select(".tooltip_bin").remove();
         return null;
      }

      let gbin = this.draw_g.select(".tooltip_bin"),
          radius = this.lineatt.width + 3;

      if (gbin.empty())
         gbin = this.draw_g.append("svg:circle")
                           .attr("class", "tooltip_bin")
                           .style("pointer-events","none")
                           .attr("r", radius)
                           .style("fill", "none")
                           .call(this.lineatt.func);

      let res = { name: this.getObject().fName,
                  title: this.getObject().fTitle,
                  x: funcs.grx(xx),
                  y: funcs.gry(yy),
                  color1: this.lineatt.color,
                  lines: [],
                  exact: (knot !== null) || (Math.abs(funcs.gry(yy) - pnt.y) < radius) };

      res.changed = gbin.property("current_xx") !== xx;
      res.menu = res.exact;
      res.menu_dist = Math.sqrt((res.x-pnt.x)*(res.x-pnt.x) + (res.y-pnt.y)*(res.y-pnt.y));

      if (res.changed)
         gbin.attr("cx", Math.round(res.x))
             .attr("cy", Math.round(res.y))
             .property("current_xx", xx);

      let name = this.getObjectHint();
      if (name.length > 0) res.lines.push(name);
      res.lines.push("x = " + funcs.axisAsText("x", xx));
      res.lines.push("y = " + funcs.axisAsText("y", yy));
      if (knot !== null) {
         res.lines.push("knot = " + indx);
         res.lines.push("B = " + floatToString(knot.fB, gStyle.fStatFormat));
         res.lines.push("C = " + floatToString(knot.fC, gStyle.fStatFormat));
         res.lines.push("D = " + floatToString(knot.fD, gStyle.fStatFormat));
         if ((knot.fE!==undefined) && (knot.fF!==undefined)) {
            res.lines.push("E = " + floatToString(knot.fE, gStyle.fStatFormat));
            res.lines.push("F = " + floatToString(knot.fF, gStyle.fStatFormat));
         }
      }

      return res;
   }

   /** @summary Redraw object
     * @private */
   redraw() {

      let spline = this.getObject(),
          pmain = this.getFramePainter(),
          funcs = pmain ? pmain.getGrFuncs(this.options.second_x, this.options.second_y) : null,
          w = pmain.getFrameWidth(),
          h = pmain.getFrameHeight();

      this.createG(true);

      this.knot_size = 5; // used in tooltip handling

      this.createAttLine({ attr: spline });

      if (this.options.Line || this.options.Curve) {

         let npx = Math.max(10, spline.fNpx),
             xmin = Math.max(pmain.scale_xmin, spline.fXmin),
             xmax = Math.min(pmain.scale_xmax, spline.fXmax),
             indx = this.findX(xmin),
             bins = []; // index of current knot

         if (pmain.logx) {
            xmin = Math.log(xmin);
            xmax = Math.log(xmax);
         }

         for (let n = 0; n < npx; ++n) {
            let xx = xmin + (xmax-xmin)/npx*(n-1);
            if (pmain.logx) xx = Math.exp(xx);

            while ((indx < spline.fNp-1) && (xx > spline.fPoly[indx+1].fX)) ++indx;

            let yy = this.eval(spline.fPoly[indx], xx);

            bins.push({ x: xx, y: yy, grx: funcs.grx(xx), gry: funcs.gry(yy) });
         }

         let h0 = h;  // use maximal frame height for filling
         if ((pmain.hmin!==undefined) && (pmain.hmin >= 0)) {
            h0 = Math.round(funcs.gry(0));
            if ((h0 > h) || (h0 < 0)) h0 = h;
         }

         let path = buildSvgPath("bezier", bins, h0, 2);

         this.draw_g.append("svg:path")
             .attr("class", "line")
             .attr("d", path.path)
             .style("fill", "none")
             .call(this.lineatt.func);
      }

      if (this.options.Mark) {

         // for tooltips use markers only if nodes where not created
         let path = "";

         this.createAttMarker({ attr: spline });

         this.markeratt.resetPos();

         this.knot_size = this.markeratt.getFullSize();

         for (let n=0; n<spline.fPoly.length; n++) {
            let knot = spline.fPoly[n],
                grx = funcs.grx(knot.fX);
            if ((grx > -this.knot_size) && (grx < w + this.knot_size)) {
               let gry = funcs.gry(knot.fY);
               if ((gry > -this.knot_size) && (gry < h + this.knot_size)) {
                  path += this.markeratt.create(grx, gry);
               }
            }
         }

         if (path)
            this.draw_g.append("svg:path")
                       .attr("d", path)
                       .call(this.markeratt.func);
      }
   }

   /** @summary Checks if it makes sense to zoom inside specified axis range */
   canZoomInside(axis/*,min,max*/) {
      if (axis!=="x") return false;

      let spline = this.getObject();
      if (!spline) return false;

      // if function calculated, one always could zoom inside
      return true;
   }

   /** @summary Decode options for TSpline drawing */
   decodeOptions(opt) {
      let d = new DrawOptions(opt);

      if (!this.options) this.options = {};

      let has_main = !!this.getMainPainter();

      Object.assign(this.options, {
         Same: d.check('SAME'),
         Line: d.check('L'),
         Curve: d.check('C'),
         Mark: d.check('P'),
         Hopt: "AXIS",
         second_x: false,
         second_y: false
      });

      if (!this.options.Line && !this.options.Curve && !this.options.Mark)
         this.options.Curve = true;

      if (d.check("X+")) { this.options.Hopt += "X+"; this.options.second_x = has_main; }
      if (d.check("Y+")) { this.options.Hopt += "Y+"; this.options.second_y = has_main; }

      this.storeDrawOpt(opt);
   }

   /** @summary Draw TSpline */
   static draw(dom, spline, opt) {
      let painter = new TSplinePainter(dom, spline);
      painter.decodeOptions(opt);

      let promise = Promise.resolve(), no_main = !painter.getMainPainter();
      if (no_main || painter.options.second_x || painter.options.second_y) {
         if (painter.options.Same && no_main) {
            console.warn('TSpline painter requires histogram to be drawn');
            return null;
         }
         let histo = painter.createDummyHisto();
         promise = TH1Painter.draw(dom, histo, painter.options.Hopt);
      }

      return promise.then(() => {
         painter.addToPadPrimitives();
         painter.redraw();
         return painter;
      });
   }

} // class TSplinePainter


/** @summary Draw direct TVirtualX commands into SVG
  * @private */

class TWebPaintingPainter extends ObjectPainter {

   updateObject(obj) {
      if (!this.matchObjectType(obj)) return false;
      this.assignObject(obj);
      return true;
   }

   async redraw() {

      const obj = this.getObject(), func = this.getAxisToSvgFunc();

      if (!obj || !obj.fOper || !func) return;

      let indx = 0, attr = {}, lastpath = null, lastkind = "none", d = "",
          oper, k, npoints, n, arr = obj.fOper.split(";");

      const check_attributes = kind => {
         if (kind == lastkind) return;

         if (lastpath) {
            lastpath.attr("d", d); // flush previous
            d = ""; lastpath = null; lastkind = "none";
         }

         if (!kind) return;

         lastkind = kind;
         lastpath = this.draw_g.append("svg:path");
         switch (kind) {
            case "f": lastpath.call(this.fillatt.func); break;
            case "l": lastpath.call(this.lineatt.func).style('fill', 'none'); break;
            case "m": lastpath.call(this.markeratt.func); break;
         }
      };

      const read_attr = (str, names) => {
         let lastp = 0, obj = { _typename: "any" };
         for (let k = 0; k < names.length; ++k) {
            let p = str.indexOf(":", lastp+1);
            obj[names[k]] = parseInt(str.substr(lastp+1, (p>lastp) ? p-lastp-1 : undefined));
            lastp = p;
         }
         return obj;
      };

      this.createG();

      for (k = 0; k < arr.length; ++k) {
         oper = arr[k][0];
         switch (oper) {
            case "z":
               this.createAttLine({ attr: read_attr(arr[k], ["fLineColor", "fLineStyle", "fLineWidth"]), force: true });
               check_attributes();
               continue;
            case "y":
               this.createAttFill({ attr: read_attr(arr[k], ["fFillColor", "fFillStyle"]), force: true });
               check_attributes();
               continue;
            case "x":
               this.createAttMarker({ attr: read_attr(arr[k], ["fMarkerColor", "fMarkerStyle", "fMarkerSize"]), force: true });
               check_attributes();
               continue;
            case "o":
               attr = read_attr(arr[k], ["fTextColor", "fTextFont", "fTextSize", "fTextAlign", "fTextAngle"]);
               if (attr.fTextSize < 0) attr.fTextSize *= -0.001;
               check_attributes();
               continue;
            case "r":
            case "b": {

               check_attributes((oper == "b") ? "f" : "l");

               let x1 = func.x(obj.fBuf[indx++]),
                   y1 = func.y(obj.fBuf[indx++]),
                   x2 = func.x(obj.fBuf[indx++]),
                   y2 = func.y(obj.fBuf[indx++]);

               d += `M${x1},${y1}h${x2-x1}v${y2-y1}h${x1-x2}z`;

               continue;
            }
            case "l":
            case "f": {

               check_attributes(oper);

               npoints = parseInt(arr[k].substr(1));

               for (n = 0; n < npoints; ++n)
                  d += ((n > 0) ? "L" : "M") +
                        func.x(obj.fBuf[indx++]) + "," + func.y(obj.fBuf[indx++]);

               if (oper == "f") d+="Z";

               continue;
            }

            case "m": {

               check_attributes(oper);

               npoints = parseInt(arr[k].substr(1));

               this.markeratt.resetPos();
               for (n = 0; n < npoints; ++n)
                  d += this.markeratt.create(func.x(obj.fBuf[indx++]), func.y(obj.fBuf[indx++]));

               continue;
            }

            case "h":
            case "t": {
               if (attr.fTextSize) {

                  check_attributes();

                  let height = (attr.fTextSize > 1) ? attr.fTextSize : this.getPadPainter().getPadHeight() * attr.fTextSize,
                      angle = attr.fTextAngle,
                      txt = arr[k].substr(1),
                      group = this.draw_g.append("svg:g");

                  if (angle >= 360) angle -= Math.floor(angle/360) * 360;

                  this.startTextDrawing(attr.fTextFont, height, group);

                  if (oper == "h") {
                     let res = "";
                     for (n = 0; n < txt.length; n += 2)
                        res += String.fromCharCode(parseInt(txt.substr(n,2), 16));
                     txt = res;
                  }

                  // todo - correct support of angle
                  this.drawText({ align: attr.fTextAlign,
                                  x: func.x(obj.fBuf[indx++]),
                                  y: func.y(obj.fBuf[indx++]),
                                  rotate: -angle,
                                  text: txt,
                                  color: getColor(attr.fTextColor),
                                  latex: 0, draw_g: group });

                  await this.finishTextDrawing(group);
               }
               continue;
            }

            default:
               console.log('unsupported operation ' + oper);
         }
      }

      check_attributes();

      return this;
   }

   static draw(dom, obj) {
      let painter = new TWebPaintingPainter(dom, obj);
      painter.addToPadPrimitives();
      return painter.redraw();
   }

}

/** @summary Draw JS image
  * @private */
function drawJSImage(dom, obj, opt) {
   let painter = new BasePainter(dom),
       main = painter.selectDom(),
       img = main.append("img").attr("src", obj.fName).attr("title", obj.fTitle || obj.fName);

   if (opt && opt.indexOf("scale") >= 0) {
      img.style("width","100%").style("height","100%");
   } else if (opt && opt.indexOf("center") >= 0) {
      main.style("position", "relative");
      img.attr("style", "margin: 0; position: absolute;  top: 50%; left: 50%; transform: translate(-50%, -50%);");
   }

   painter.setTopPainter();

   return painter;
}


/**
 * @summary Painter class for TRatioPlot
 *
 * @private
 */

class TRatioPlotPainter extends ObjectPainter {

   /** @summary Set grids range */
   setGridsRange(xmin, xmax) {
      let ratio = this.getObject(),
          pp = this.getPadPainter();
      if (xmin === xmax) {
         let low_p = pp.findPainterFor(ratio.fLowerPad, "lower_pad", "TPad"),
             low_fp = low_p ? low_p.getFramePainter() : null;
         if (!low_fp || !low_fp.x_handle) return;
         xmin = low_fp.x_handle.full_min;
         xmax = low_fp.x_handle.full_max;
      }

      ratio.fGridlines.forEach(line => {
         line.fX1 = xmin;
         line.fX2 = xmax;
      });
   }

   /** @summary Redraw TRatioPlot */
   redraw() {
      let ratio = this.getObject(),
          pp = this.getPadPainter();

      let top_p = pp.findPainterFor(ratio.fTopPad, "top_pad", "TPad");
      if (top_p) top_p.disablePadDrawing();

      let up_p = pp.findPainterFor(ratio.fUpperPad, "upper_pad", "TPad"),
          up_main = up_p ? up_p.getMainPainter() : null,
          up_fp = up_p ? up_p.getFramePainter() : null,
          low_p = pp.findPainterFor(ratio.fLowerPad, "lower_pad", "TPad"),
          low_main = low_p ? low_p.getMainPainter() : null,
          low_fp = low_p ? low_p.getFramePainter() : null,
          lbl_size = 20, promise_up = Promise.resolve(true);

      if (up_p && up_main && up_fp && low_fp && !up_p._ratio_configured) {
         up_p._ratio_configured = true;
         up_main.options.Axis = 0; // draw both axes

         lbl_size = up_main.getHisto().fYaxis.fLabelSize;
         if (lbl_size < 1) lbl_size = Math.round(lbl_size*Math.min(up_p.getPadWidth(), up_p.getPadHeight()));

         let h = up_main.getHisto();
         h.fXaxis.fLabelSize = 0; // do not draw X axis labels
         h.fXaxis.fTitle = ""; // do not draw X axis title
         h.fYaxis.fLabelSize = lbl_size;
         h.fYaxis.fTitleSize = lbl_size;

         up_p.getRootPad().fTicky = 1;

         promise_up = up_p.redrawPad().then(() => {
            up_fp.o_zoom = up_fp.zoom;
            up_fp._ratio_low_fp = low_fp;
            up_fp._ratio_painter = this;

            up_fp.zoom = function(xmin,xmax,ymin,ymax,zmin,zmax) {
               this._ratio_painter.setGridsRange(xmin, xmax);
               this._ratio_low_fp.o_zoom(xmin,xmax);
               return this.o_zoom(xmin,xmax,ymin,ymax,zmin,zmax);
            }

            up_fp.o_sizeChanged = up_fp.sizeChanged;
            up_fp.sizeChanged = function() {
               this.o_sizeChanged();
               this._ratio_low_fp.fX1NDC = this.fX1NDC;
               this._ratio_low_fp.fX2NDC = this.fX2NDC;
               this._ratio_low_fp.o_sizeChanged();
            }
            return true;
         });
      }

      return promise_up.then(() => {

         if (!low_p || !low_main || !low_fp || !up_fp || low_p._ratio_configured)
            return this;

         low_p._ratio_configured = true;
         low_main.options.Axis = 0; // draw both axes
         let h = low_main.getHisto();
         h.fXaxis.fTitle = "x";
         h.fXaxis.fLabelSize = lbl_size;
         h.fXaxis.fTitleSize = lbl_size;
         h.fYaxis.fLabelSize = lbl_size;
         h.fYaxis.fTitleSize = lbl_size;
         low_p.getRootPad().fTicky = 1;

         low_p.forEachPainterInPad(objp => {
            if (typeof objp.testEditable == 'function')
               objp.testEditable(false);
         });

         let arr = [], currpad;

         if ((ratio.fGridlinePositions.length > 0) && (ratio.fGridlines.length < ratio.fGridlinePositions.length)) {
            ratio.fGridlinePositions.forEach(gridy => {
               let found = false;
               ratio.fGridlines.forEach(line => {
                  if ((line.fY1 == line.fY2) && (Math.abs(line.fY1 - gridy) < 1e-6)) found = true;
               });
               if (!found) {
                  let line = create("TLine");
                  line.fX1 = up_fp.scale_xmin;
                  line.fX2 = up_fp.scale_xmax;
                  line.fY1 = line.fY2 = gridy;
                  line.fLineStyle = 2;
                  ratio.fGridlines.push(line);
                  if (currpad === undefined) currpad = this.selectCurrentPad(ratio.fLowerPad.fName);
                  arr.push(drawTLine(this.getDom(), line));
               }
            });
         }

         return Promise.all(arr).then(() => low_fp.zoom(up_fp.scale_xmin,  up_fp.scale_xmax)).then(() => {

            low_fp.o_zoom = low_fp.zoom;
            low_fp._ratio_up_fp = up_fp;
            low_fp._ratio_painter = this;

            low_fp.zoom = function(xmin,xmax,ymin,ymax,zmin,zmax) {
               this._ratio_painter.setGridsRange(xmin, xmax);
               this._ratio_up_fp.o_zoom(xmin,xmax);
               return this.o_zoom(xmin,xmax,ymin,ymax,zmin,zmax);
            }

            low_fp.o_sizeChanged = low_fp.sizeChanged;
            low_fp.sizeChanged = function() {
               this.o_sizeChanged();
               this._ratio_up_fp.fX1NDC = this.fX1NDC;
               this._ratio_up_fp.fX2NDC = this.fX2NDC;
               this._ratio_up_fp.o_sizeChanged();
            }
            return this;
         });
      });
   }

   /** @summary Draw TRatioPlot */
   static draw(dom, ratio, opt) {
      let painter = new TRatioPlotPainter(dom, ratio, opt);

      return ensureTCanvas(painter, false).then(() => painter.redraw());
   }

} // class TRatioPlotPainter


export { TGraphPolargramPainter, TGraphPolarPainter,
         TSplinePainter, TRatioPlotPainter, TWebPaintingPainter,
         drawText, drawTLine, drawPolyLine, drawEllipse, drawPie, drawBox,
         drawMarker, drawPolyMarker, drawArrow, drawJSImage };
