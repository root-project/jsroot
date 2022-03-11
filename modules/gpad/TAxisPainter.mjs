/// TCanvas painting

import { gStyle, BIT, settings, constants, internals,
         require, create, extend, parse, toJSON, isBatchMode, loadScript, isPromise } from '../core.mjs';

import { select as d3_select, color as d3_color,
         pointer as d3_pointer, drag as d3_drag, timeFormat as d3_timeFormat,
         scaleTime as d3_scaleTime, scaleSymlog as d3_scaleSymlog,
         scaleLog as d3_scaleLog, scaleLinear as d3_scaleLinear } from '../d3.mjs';

import { closeCurrentWindow, showProgress } from '../utils.mjs';

import { ColorPalette, adoptRootColors, extendRootColors, getRGBfromTColor } from '../base/colors.mjs';

import { getElementRect } from '../base/BasePainter.mjs';

import { ObjectPainter } from '../base/ObjectPainter.mjs';

import { TAttLineHandler, getSvgLineStyle } from '../base/TAttLineHandler.mjs';

import { FontHandler } from '../base/FontHandler.mjs';

import { DrawOptions, AxisPainterMethods,
         createMenu, closeMenu, registerForResize,
         chooseTimeFormat, selectActivePad, getActivePad, getAbsPosInCanvas,
         compressSVG, cleanup, resize } from '../painter.mjs';

import { draw } from '../draw.mjs';

const EAxisBits = {
   kDecimals: BIT(7),
   kTickPlus: BIT(9),
   kTickMinus: BIT(10),
   kAxisRange: BIT(11),
   kCenterTitle: BIT(12),
   kCenterLabels: BIT(14),
   kRotateTitle: BIT(15),
   kPalette: BIT(16),
   kNoExponent: BIT(17),
   kLabelsHori: BIT(18),
   kLabelsVert: BIT(19),
   kLabelsDown: BIT(20),
   kLabelsUp: BIT(21),
   kIsInteger: BIT(22),
   kMoreLogLabels: BIT(23),
   kOppositeTitle: BIT(32) // atrificial bit, not possible to set in ROOT
};

/** @summary Return time offset value for given TAxis object
  * @private */
function getTimeOffset(axis) {
   let dflt_time_offset = 788918400000;
   if (!axis) return dflt_time_offset;
   let idF = axis.fTimeFormat.indexOf('%F');
   if (idF < 0) return gStyle.fTimeOffset * 1000;
   let sof = axis.fTimeFormat.substr(idF + 2);
   // default string in axis offset
   if (sof.indexOf('1995-01-01 00:00:00s0') == 0) return dflt_time_offset;
   // special case, used from DABC painters
   if ((sof == "0") || (sof == "")) return 0;

   // decode time from ROOT string
   const next = (separ, min, max) => {
      let pos = sof.indexOf(separ);
      if (pos < 0) return min;
      let val = parseInt(sof.substr(0, pos));
      sof = sof.substr(pos + 1);
      if (!Number.isInteger(val) || (val < min) || (val > max)) return min;
      return val;
   }, year = next("-", 1970, 2300),
      month = next("-", 1, 12) - 1,
      day = next(" ", 1, 31),
      hour = next(":", 0, 23),
      min = next(":", 0, 59),
      sec = next("s", 0, 59),
      msec = next(" ", 0, 999),
      dt = new Date(Date.UTC(year, month, day, hour, min, sec, msec));

   let offset = dt.getTime();

   // now also handle suffix like GMT or GMT -0600
   sof = sof.toUpperCase();

   if (sof.indexOf('GMT') == 0) {
      offset += dt.getTimezoneOffset() * 60000;
      sof = sof.substr(4).trim();
      if (sof.length > 3) {
         let p = 0, sign = 1000;
         if (sof[0] == '-') { p = 1; sign = -1000; }
         offset -= sign * (parseInt(sof.substr(p, 2)) * 3600 + parseInt(sof.substr(p + 2, 2)) * 60);
      }
   }

   return offset;
}


/**
 * @summary Painter for TAxis/TGaxis objects
 *
 * @private
 */

class TAxisPainter extends ObjectPainter {

   /** @summary constructor
     * @param {object|string} dom - identifier or dom element
     * @param {object} axis - object to draw
     * @param {boolean} embedded - if true, painter used in other objects painters */
   constructor(dom, axis, embedded) {
      super(dom, axis);

      Object.assign(this, AxisPainterMethods);
      this.initAxisPainter();

      this.embedded = embedded; // indicate that painter embedded into the histo painter
      this.invert_side = false;
      this.lbls_both_sides = false; // draw labels on both sides
   }

   /** @summary cleanup painter */
   cleanup() {
      this.cleanupAxisPainter();
      super.cleanup();
   }

   /** @summary Use in GED to identify kind of axis */
   getAxisType() { return "TAxis"; }


   /** @summary Configure axis painter
     * @desc Axis can be drawn inside frame <g> group with offset to 0 point for the frame
     * Therefore one should distinguish when caclulated coordinates used for axis drawing itself or for calculation of frame coordinates
     * @private */
   configureAxis(name, min, max, smin, smax, vertical, range, opts) {
      this.name = name;
      this.full_min = min;
      this.full_max = max;
      this.kind = "normal";
      this.vertical = vertical;
      this.log = opts.log || 0;
      this.symlog = opts.symlog || false;
      this.reverse = opts.reverse || false;
      this.swap_side = opts.swap_side || false;
      this.fixed_ticks = opts.fixed_ticks || null;
      this.max_tick_size = opts.max_tick_size || 0;

      let axis = this.getObject();

      if (opts.time_scale || axis.fTimeDisplay) {
         this.kind = 'time';
         this.timeoffset = getTimeOffset(axis);
      } else {
         this.kind = !axis.fLabels ? 'normal' : 'labels';
      }

      if (this.kind == 'time') {
         this.func = d3_scaleTime().domain([this.convertDate(smin), this.convertDate(smax)]);
      } else if (this.log) {
         this.logbase = this.log === 2 ? 2 : 10;
         if (smax <= 0) smax = 1;

         if ((smin <= 0) && axis && !opts.logcheckmin)
            for (let i = 0; i < axis.fNbins; ++i) {
               smin = Math.max(smin, axis.GetBinLowEdge(i+1));
               if (smin > 0) break;
            }

         if ((smin <= 0) && opts.log_min_nz)
            smin = opts.log_min_nz;

         if ((smin <= 0) || (smin >= smax))
            smin = smax * (opts.logminfactor || 1e-4);

         this.func = d3_scaleLog().base((this.log == 2) ? 2 : 10).domain([smin,smax]);
      } else if (this.symlog) {
         let v = Math.max(Math.abs(smin), Math.abs(smax));
         if (Number.isInteger(this.symlog) && (this.symlog > 0))
            v *= Math.pow(10,-1*this.symlog);
         else
            v *= 0.01;
         this.func = d3_scaleSymlog().constant(v).domain([smin,smax]);
      } else {
         this.func = d3_scaleLinear().domain([smin,smax]);
      }

      if (this.vertical ^ this.reverse) {
         let d = range[0]; range[0] = range[1]; range[1] = d;
      }

      this.func.range(range);

      this.scale_min = smin;
      this.scale_max = smax;

      if (this.kind == 'time')
         this.gr = val => this.func(this.convertDate(val));
      else if (this.log)
         this.gr = val => (val < this.scale_min) ? (this.vertical ? this.func.range()[0]+5 : -5) : this.func(val);
      else
         this.gr = this.func;

      let is_gaxis = (axis && axis._typename === 'TGaxis');

      delete this.format;// remove formatting func

      let ndiv = 508;
      if (is_gaxis)
         ndiv = axis.fNdiv;
       else if (axis)
          ndiv = Math.max(axis.fNdivisions, 4);

      this.nticks = ndiv % 100;
      this.nticks2 = (ndiv % 10000 - this.nticks) / 100;
      this.nticks3 = Math.floor(ndiv/10000);

      if (axis && !is_gaxis && (this.nticks > 20)) this.nticks = 20;

      let gr_range = Math.abs(this.func.range()[1] - this.func.range()[0]);
      if (gr_range<=0) gr_range = 100;

      if (this.kind == 'time') {
         if (this.nticks > 8) this.nticks = 8;

         let scale_range = this.scale_max - this.scale_min,
             idF = axis.fTimeFormat.indexOf('%F'),
             tf1 = (idF >= 0) ? axis.fTimeFormat.substr(0, idF) : axis.fTimeFormat,
             tf2 = chooseTimeFormat(scale_range / gr_range, false);

         if ((tf1.length == 0) || (scale_range < 0.1 * (this.full_max - this.full_min)))
            tf1 = chooseTimeFormat(scale_range / this.nticks, true);

         this.tfunc1 = this.tfunc2 = d3_timeFormat(tf1);
         if (tf2!==tf1)
            this.tfunc2 = d3_timeFormat(tf2);

         this.format = this.formatTime;

      } else if (this.log) {
         if (this.nticks2 > 1) {
            this.nticks *= this.nticks2; // all log ticks (major or minor) created centrally
            this.nticks2 = 1;
         }
         this.noexp = axis ? axis.TestBit(EAxisBits.kNoExponent) : false;
         if ((this.scale_max < 300) && (this.scale_min > 0.3)) this.noexp = true;
         this.moreloglabels = axis ? axis.TestBit(EAxisBits.kMoreLogLabels) : false;

         this.format = this.formatLog;

      } else if (this.kind == 'labels') {
         this.nticks = 50; // for text output allow max 50 names
         let scale_range = this.scale_max - this.scale_min;
         if (this.nticks > scale_range)
            this.nticks = Math.round(scale_range);

         this.regular_labels = true;

         if (axis && axis.fNbins && axis.fLabels) {
            if ((axis.fNbins != Math.round(axis.fXmax - axis.fXmin)) ||
                (axis.fXmin != 0) || (axis.fXmax != axis.fNbins)) {
               this.regular_labels = false;
            }
         }

         this.nticks2 = 1;

         this.format = this.formatLabels;
      } else {
         this.order = 0;
         this.ndig = 0;
         this.format = this.formatNormal;
      }
   }

   /** @summary Return scale min */
   getScaleMin() {
      return this.func ? this.func.domain()[0] : 0;
   }

   /** @summary Return scale max */
   getScaleMax() {
      return this.func ? this.func.domain()[1] : 0;
   }

   /** @summary Provide label for axis value */
   formatLabels(d) {
      let indx = parseFloat(d), a = this.getObject();
      if (!this.regular_labels)
         indx = (indx - a.fXmin)/(a.fXmax - a.fXmin) * a.fNbins;
      indx = Math.floor(indx);
      if ((indx < 0) || (indx >= a.fNbins)) return null;
      for (let i = 0; i < a.fLabels.arr.length; ++i) {
         let tstr = a.fLabels.arr[i];
         if (tstr.fUniqueID === indx+1) return tstr.fString;
      }
      return null;
   }

   /** @summary Creates array with minor/middle/major ticks */
   createTicks(only_major_as_array, optionNoexp, optionNoopt, optionInt) {

      if (optionNoopt && this.nticks && (this.kind == "normal")) this.noticksopt = true;

      let handle = { nminor: 0, nmiddle: 0, nmajor: 0, func: this.func }, ticks;

      if (this.fixed_ticks) {
         ticks = [];
         this.fixed_ticks.forEach(v => {
            if ((v >= this.scale_min) && (v <= this.scale_max)) ticks.push(v);
         });
      } else if ((this.kind == 'labels') && !this.regular_labels) {
         ticks = [];
         handle.lbl_pos = [];
         let axis = this.getObject();
         for (let n = 0; n < axis.fNbins; ++n) {
            let x = axis.fXmin + n / axis.fNbins * (axis.fXmax - axis.fXmin);
            if ((x >= this.scale_min) && (x < this.scale_max)) {
               handle.lbl_pos.push(x);
               if (x > this.scale_min) ticks.push(x);
            }
         }
      } else {
         ticks = this.produceTicks(this.nticks);
      }

      handle.minor = handle.middle = handle.major = ticks;

      if (only_major_as_array) {
         let res = handle.major, delta = (this.scale_max - this.scale_min)*1e-5;
         if (res[0] > this.scale_min + delta) res.unshift(this.scale_min);
         if (res[res.length-1] < this.scale_max - delta) res.push(this.scale_max);
         return res;
      }

      if ((this.nticks2 > 1) && (!this.log || (this.logbase === 10)) && !this.fixed_ticks) {
         handle.minor = handle.middle = this.produceTicks(handle.major.length, this.nticks2);

         let gr_range = Math.abs(this.func.range()[1] - this.func.range()[0]);

         // avoid black filling by middle-size
         if ((handle.middle.length <= handle.major.length) || (handle.middle.length > gr_range/3.5)) {
            handle.minor = handle.middle = handle.major;
         } else if ((this.nticks3 > 1) && !this.log)  {
            handle.minor = this.produceTicks(handle.middle.length, this.nticks3);
            if ((handle.minor.length <= handle.middle.length) || (handle.minor.length > gr_range/1.7)) handle.minor = handle.middle;
         }
      }

      handle.reset = function() {
         this.nminor = this.nmiddle = this.nmajor = 0;
      };

      handle.next = function(doround) {
         if (this.nminor >= this.minor.length) return false;

         this.tick = this.minor[this.nminor++];
         this.grpos = this.func(this.tick);
         if (doround) this.grpos = Math.round(this.grpos);
         this.kind = 3;

         if ((this.nmiddle < this.middle.length) && (Math.abs(this.grpos - this.func(this.middle[this.nmiddle])) < 1)) {
            this.nmiddle++;
            this.kind = 2;
         }

         if ((this.nmajor < this.major.length) && (Math.abs(this.grpos - this.func(this.major[this.nmajor])) < 1) ) {
            this.nmajor++;
            this.kind = 1;
         }
         return true;
      };

      handle.last_major = function() {
         return (this.kind !== 1) ? false : this.nmajor == this.major.length;
      };

      handle.next_major_grpos = function() {
         if (this.nmajor >= this.major.length) return null;
         return this.func(this.major[this.nmajor]);
      };

      this.order = 0;
      this.ndig = 0;

      // at the moment when drawing labels, we can try to find most optimal text representation for them

      if ((this.kind == "normal") && !this.log && (handle.major.length > 0)) {

         let maxorder = 0, minorder = 0, exclorder3 = false;

         if (!optionNoexp) {
            let maxtick = Math.max(Math.abs(handle.major[0]),Math.abs(handle.major[handle.major.length-1])),
                mintick = Math.min(Math.abs(handle.major[0]),Math.abs(handle.major[handle.major.length-1])),
                ord1 = (maxtick > 0) ? Math.round(Math.log10(maxtick)/3)*3 : 0,
                ord2 = (mintick > 0) ? Math.round(Math.log10(mintick)/3)*3 : 0;

             exclorder3 = (maxtick < 2e4); // do not show 10^3 for values below 20000

             if (maxtick || mintick) {
                maxorder = Math.max(ord1,ord2) + 3;
                minorder = Math.min(ord1,ord2) - 3;
             }
         }

         // now try to find best combination of order and ndig for labels

         let bestorder = 0, bestndig = this.ndig, bestlen = 1e10;

         for (let order = minorder; order <= maxorder; order+=3) {
            if (exclorder3 && (order===3)) continue;
            this.order = order;
            this.ndig = 0;
            let lbls = [], indx = 0, totallen = 0;
            while (indx < handle.major.length) {
               let lbl = this.format(handle.major[indx], true);
               if (lbls.indexOf(lbl) < 0) {
                  lbls.push(lbl);
                  totallen += lbl.length;
                  indx++;
                  continue;
               }
               if (++this.ndig > 15) break; // not too many digits, anyway it will be exponential
               lbls = []; indx = 0; totallen = 0;
            }

            // for order==0 we should virtually remove "0." and extra label on top
            if (!order && (this.ndig<4)) totallen-=(handle.major.length*2+3);

            if (totallen < bestlen) {
               bestlen = totallen;
               bestorder = this.order;
               bestndig = this.ndig;
            }
         }

         this.order = bestorder;
         this.ndig = bestndig;

         if (optionInt) {
            if (this.order) console.warn('Axis painter - integer labels are configured, but axis order ' + this.order + ' is preferable');
            if (this.ndig) console.warn('Axis painter - integer labels are configured, but ' + this.ndig + ' decimal digits are required');
            this.ndig = 0;
            this.order = 0;
         }
      }

      return handle;
   }

   /** @summary Is labels should be centered */
   isCenteredLabels() {
      if (this.kind === 'labels') return true;
      if (this.log) return false;
      let axis = this.getObject();
      return axis && axis.TestBit(EAxisBits.kCenterLabels);
   }

   /** @summary Add interactive elements to draw axes title */
   addTitleDrag(title_g, vertical, offset_k, reverse, axis_length) {
      if (!settings.MoveResize || isBatchMode()) return;

      let drag_rect = null,
          acc_x, acc_y, new_x, new_y, sign_0, alt_pos, curr_indx,
          drag_move = d3_drag().subject(Object);

      drag_move
         .on("start", evnt => {

            evnt.sourceEvent.preventDefault();
            evnt.sourceEvent.stopPropagation();

            let box = title_g.node().getBBox(), // check that elements visible, request precise value
                axis = this.getObject(),
                title_length = vertical ? box.height : box.width,
                opposite = axis.TestBit(EAxisBits.kOppositeTitle);

            new_x = acc_x = title_g.property('shift_x');
            new_y = acc_y = title_g.property('shift_y');

            sign_0 = vertical ? (acc_x > 0) : (acc_y > 0); // sign should remain

            alt_pos = vertical ? [axis_length, axis_length/2, 0] : [0, axis_length/2, axis_length]; // possible positions
            let off = vertical ? -title_length/2 : title_length/2;
            if (this.title_align == "middle") {
               alt_pos[0] +=  off;
               alt_pos[2] -=  off;
            } else if (this.title_align == "begin") {
               alt_pos[1] -= off;
               alt_pos[2] -= 2*off;
            } else { // end
               alt_pos[0] += 2*off;
               alt_pos[1] += off;
            }

            if (axis.TestBit(EAxisBits.kCenterTitle))
               curr_indx = 1;
            else if (reverse ^ opposite)
               curr_indx = 0;
            else
               curr_indx = 2;

            alt_pos[curr_indx] = vertical ? acc_y : acc_x;

            drag_rect = title_g.append("rect")
                 .classed("zoom", true)
                 .attr("x", box.x)
                 .attr("y", box.y)
                 .attr("width", box.width)
                 .attr("height", box.height)
                 .style("cursor", "move");
//                 .style("pointer-events","none"); // let forward double click to underlying elements
          }).on("drag", evnt => {
               if (!drag_rect) return;

               evnt.sourceEvent.preventDefault();
               evnt.sourceEvent.stopPropagation();

               acc_x += evnt.dx;
               acc_y += evnt.dy;

               let set_x, set_y,
                   p = vertical ? acc_y : acc_x, besti = 0;

               for (let i=1; i<3; ++i)
                  if (Math.abs(p - alt_pos[i]) < Math.abs(p - alt_pos[besti])) besti = i;

               if (vertical) {
                  set_x = acc_x;
                  set_y = alt_pos[besti];
               } else {
                  set_y = acc_y;
                  set_x = alt_pos[besti];
               }

               if (sign_0 === (vertical ? (set_x > 0) : (set_y > 0))) {
                  new_x = set_x; new_y = set_y; curr_indx = besti;
                  title_g.attr('transform', 'translate(' + new_x + ',' + new_y +  ')');
               }

          }).on("end", evnt => {
               if (!drag_rect) return;

               evnt.sourceEvent.preventDefault();
               evnt.sourceEvent.stopPropagation();

               title_g.property('shift_x', new_x)
                      .property('shift_y', new_y);

               let axis = this.getObject(), abits = EAxisBits;

               const set_bit = (bit, on) => { if (axis.TestBit(bit) != on) axis.InvertBit(bit); };

               axis.fTitleOffset = (vertical ? new_x : new_y) / offset_k;
               if (curr_indx == 1) {
                  set_bit(abits.kCenterTitle, true);
                  set_bit(abits.kOppositeTitle, false);
               } else if (curr_indx == 0) {
                  set_bit(abits.kCenterTitle, false);
                  set_bit(abits.kOppositeTitle, true);
               } else {
                  set_bit(abits.kCenterTitle, false);
                  set_bit(abits.kOppositeTitle, false);
               }

               drag_rect.remove();
               drag_rect = null;
            });

      title_g.style("cursor", "move").call(drag_move);
   }

   /** @summary Produce svg path for axis ticks */
   produceTicksPath(handle, side, tickSize, ticksPlusMinus, secondShift, real_draw) {
      let res = "", res2 = "", lastpos = 0, lasth = 0;
      this.ticks = [];

      while (handle.next(true)) {

         let h1 = Math.round(tickSize/4), h2 = 0;

         if (handle.kind < 3)
            h1 = Math.round(tickSize/2);

         if (handle.kind == 1) {
            // if not showing labels, not show large tick
            // FIXME: for labels last tick is smaller,
            if (/*(this.kind == "labels") || */ (this.format(handle.tick,true) !== null)) h1 = tickSize;
            this.ticks.push(handle.grpos); // keep graphical positions of major ticks
         }

         if (ticksPlusMinus > 0) {
            h2 = -h1;
         } else if (side < 0) {
            h2 = -h1; h1 = 0;
         }

         if (res.length == 0) {
            res = this.vertical ? `M${h1},${handle.grpos}` : `M${handle.grpos},${-h1}`;
            res2 = this.vertical ? `M${secondShift-h1},${handle.grpos}` : `M${handle.grpos},${secondShift+h1}`;
         } else {
            res += this.vertical ? `m${h1-lasth},${handle.grpos-lastpos}` : `m${handle.grpos-lastpos},${lasth-h1}`;
            res2 += this.vertical ? `m${lasth-h1},${handle.grpos-lastpos}` : `m${handle.grpos-lastpos},${h1-lasth}`;
         }

         res += this.vertical ? `h${h2-h1}` : `v${h1-h2}`;
         res2 += this.vertical ? `h${h1-h2}` : `v${h2-h1}`;

         lastpos = handle.grpos;
         lasth = h2;
      }

      if (secondShift !== 0) res += res2;

      return real_draw ? res  : "";
   }

   /** @summary Returns modifier for axis label */
   findLabelModifier(axis, nlabel, num_labels) {
      if (!axis.fModLabs) return null;
      for (let n = 0; n < axis.fModLabs.arr.length; ++n) {
         let mod = axis.fModLabs.arr[n];
         if (mod.fLabNum === nlabel + 1) return mod;
         if ((mod.fLabNum < 0) && (nlabel === num_labels + mod.fLabNum)) return mod;
      }
      return null;
   }

   /** @summary Draw axis labels
     * @returns {Promise} with array label size and max width */
   async drawLabels(axis_g, axis, w, h, handle, side, labelSize, labeloffset, tickSize, ticksPlusMinus, max_text_width) {
      let label_color = this.getColor(axis.fLabelColor),
          center_lbls = this.isCenteredLabels(),
          rotate_lbls = axis.TestBit(EAxisBits.kLabelsVert),
          textscale = 1, maxtextlen = 0, applied_scale = 0,
          label_g = [ axis_g.append("svg:g").attr("class","axis_labels") ],
          lbl_pos = handle.lbl_pos || handle.major, lbl_tilt = false, max_textwidth = 0;

      if (this.lbls_both_sides)
         label_g.push(axis_g.append("svg:g").attr("class","axis_labels").attr("transform", this.vertical ? `translate(${w})` : `translate(0,${-h})`));

      // function called when text is drawn to analyze width, required to correctly scale all labels
      // must be function to correctly handle 'this' argument
      function process_drawtext_ready(painter) {
         let textwidth = this.result_width;
         max_textwidth = Math.max(max_textwidth, textwidth);

         if (textwidth && ((!painter.vertical && !rotate_lbls) || (painter.vertical && rotate_lbls)) && !painter.log) {
            let maxwidth = this.gap_before*0.45 + this.gap_after*0.45;
            if (!this.gap_before) maxwidth = 0.9*this.gap_after; else
            if (!this.gap_after) maxwidth = 0.9*this.gap_before;
            textscale = Math.min(textscale, maxwidth / textwidth);
         } else if (painter.vertical && max_text_width && this.normal_side && (max_text_width - labeloffset > 20) && (textwidth > max_text_width - labeloffset)) {
            textscale = Math.min(textscale, (max_text_width - labeloffset) / textwidth);
         }

         if ((textscale > 0.01) && (textscale < 0.7) && !painter.vertical && !rotate_lbls && (maxtextlen > 5) && (label_g.length == 1))
            lbl_tilt = true;

         let scale = textscale * (lbl_tilt ? 3 : 1);

         if ((scale > 0.01) && (scale < 1)) {
            applied_scale = 1/scale;
            painter.scaleTextDrawing(applied_scale, label_g[0]);
         }
      }

      const labelfont = new FontHandler(axis.fLabelFont, labelSize);

      for (let lcnt = 0; lcnt < label_g.length; ++lcnt) {

         if (lcnt > 0) side = -side;

         let lastpos = 0, fix_coord = this.vertical ? -labeloffset*side : (labeloffset+2)*side + ticksPlusMinus*tickSize;

         this.startTextDrawing(labelfont, 'font', label_g[lcnt]);

         for (let nmajor = 0; nmajor < lbl_pos.length; ++nmajor) {

            let lbl = this.format(lbl_pos[nmajor], true);
            if (lbl === null) continue;

            let mod = this.findLabelModifier(axis, nmajor, lbl_pos.length);
            if (mod && (mod.fTextSize == 0)) continue;

            if (mod && mod.fLabText) lbl = mod.fLabText;

            let arg = { text: lbl, color: label_color, latex: 1, draw_g: label_g[lcnt], normal_side: (lcnt == 0) };

            let pos = Math.round(this.func(lbl_pos[nmajor]));

            if (mod && mod.fTextColor > 0) arg.color = this.getColor(mod.fTextColor);

            arg.gap_before = (nmajor > 0) ? Math.abs(Math.round(pos - this.func(lbl_pos[nmajor-1]))) : 0;

            arg.gap_after = (nmajor < lbl_pos.length-1) ? Math.abs(Math.round(this.func(lbl_pos[nmajor+1])-pos)) : 0;

            if (center_lbls) {
               let gap = arg.gap_after || arg.gap_before;
               pos = Math.round(pos - (this.vertical ? 0.5*gap : -0.5*gap));
               if ((pos < -5) || (pos > (this.vertical ? h : w) + 5)) continue;
            }

            maxtextlen = Math.max(maxtextlen, lbl.length);

            if (this.vertical) {
               arg.x = fix_coord;
               arg.y = pos;
               arg.align = rotate_lbls ? ((side<0) ? 23 : 20) : ((side<0) ? 12 : 32);
            } else {
               arg.x = pos;
               arg.y = fix_coord;
               arg.align = rotate_lbls ? ((side<0) ? 12 : 32) : ((side<0) ? 20 : 23);
            }

            if (rotate_lbls)
               arg.rotate = 270;

            // only for major text drawing scale factor need to be checked
            if (lcnt == 0) arg.post_process = process_drawtext_ready;

            this.drawText(arg);

            if (lastpos && (pos!=lastpos) && ((this.vertical && !rotate_lbls) || (!this.vertical && rotate_lbls))) {
               let axis_step = Math.abs(pos-lastpos);
               textscale = Math.min(textscale, 0.9*axis_step/labelSize);
            }

            lastpos = pos;
         }

         if (this.order)
            this.drawText({ color: label_color,
                            x: this.vertical ? side*5 : w+5,
                            y: this.has_obstacle ? fix_coord : (this.vertical ? -3 : -3*side),
                            align: this.vertical ? ((side < 0) ? 30 : 10) : ( (this.has_obstacle ^ (side < 0)) ? 13 : 10 ),
                            latex: 1,
                            text: '#times' + this.formatExp(10, this.order),
                            draw_g: label_g[lcnt]
            });
      }

      // first complete major labels drawing
      await this.finishTextDrawing(label_g[0], true);
      if (label_g.length > 1) {
         // now complete drawing of second half with scaling if necessary
         if (applied_scale)
            this.scaleTextDrawing(applied_scale, label_g[1]);
         await this.finishTextDrawing(label_g[1], true);
      }

      if (lbl_tilt)
         label_g[0].selectAll("text").each(function() {
            let txt = d3_select(this), tr = txt.attr("transform");
            txt.attr("transform", tr + " rotate(25)").style("text-anchor", "start");
         });

      if (labelfont) labelSize = labelfont.size; // use real font size

      return [ labelSize, max_textwidth ];
   }

   /** @summary function draws TAxis or TGaxis object
     * @returns {Promise} for drawing ready */
   async drawAxis(layer, w, h, transform, secondShift, disable_axis_drawing, max_text_width, calculate_position) {

      let axis = this.getObject(), chOpt = "",
          is_gaxis = (axis && axis._typename === 'TGaxis'),
          axis_g = layer, tickSize = 0.03,
          scaling_size, draw_lines = true,
          pp = this.getPadPainter(),
          pad_w = pp ? pp.getPadWidth() : 10,
          pad_h = pp ? pp.getPadHeight() : 10,
          vertical = this.vertical,
          swap_side = this.swap_side || false;

      // shift for second ticks set (if any)
      if (!secondShift) secondShift = 0; else
      if (this.invert_side) secondShift = -secondShift;

      if (is_gaxis) {
         this.createAttLine({ attr: axis });
         draw_lines = (axis.fLineColor != 0);
         chOpt = axis.fChopt;
         tickSize = axis.fTickSize;
         scaling_size = vertical ? 1.7*h : 0.6*w;
      } else {
         this.createAttLine({ color: axis.fAxisColor, width: 1, style: 1 });
         chOpt = (vertical ^ this.invert_side) ? "-S" : "+S";
         tickSize = axis.fTickLength;
         scaling_size = vertical ? pad_w : pad_h;
      }

      // indicate that attributes created not for TAttLine, therefore cannot be updated as TAttLine in GED
      this.lineatt.not_standard = true;

      if (!is_gaxis || (this.name === "zaxis")) {
         axis_g = layer.select("." + this.name + "_container");
         if (axis_g.empty())
            axis_g = layer.append("svg:g").attr("class",this.name + "_container");
         else
            axis_g.selectAll("*").remove();
      }

      let axis_lines = "";
      if (draw_lines) {
         axis_lines = "M0,0" + (vertical ? `v${h}` : `h${w}`);
         if (secondShift !== 0)
            axis_lines += vertical ? `M${secondShift},0v${h}` : `M0,${secondShift}h${w}`;
      }

      axis_g.attr("transform", transform || null);

      let side = 1, ticksPlusMinus = 0,
          text_scaling_size = Math.min(pad_w, pad_h),
          optionPlus = (chOpt.indexOf("+")>=0),
          optionMinus = (chOpt.indexOf("-")>=0),
          optionSize = (chOpt.indexOf("S")>=0),
          // optionY = (chOpt.indexOf("Y")>=0),
          // optionUp = (chOpt.indexOf("0")>=0),
          // optionDown = (chOpt.indexOf("O")>=0),
          optionUnlab = (chOpt.indexOf("U")>=0) || this.optionUnlab,  // no labels
          optionNoopt = (chOpt.indexOf("N")>=0),  // no ticks position optimization
          optionInt = (chOpt.indexOf("I")>=0),    // integer labels
          optionNoexp = axis.TestBit(EAxisBits.kNoExponent);

      if (text_scaling_size <= 0) text_scaling_size = 0.0001;

      if (is_gaxis && axis.TestBit(EAxisBits.kTickPlus)) optionPlus = true;
      if (is_gaxis && axis.TestBit(EAxisBits.kTickMinus)) optionMinus = true;

      if (optionPlus && optionMinus) { side = 1; ticksPlusMinus = 1; } else
      if (optionMinus) { side = (swap_side ^ vertical) ? 1 : -1; } else
      if (optionPlus) { side = (swap_side ^ vertical) ? -1 : 1; }

      tickSize = Math.round((optionSize ? tickSize : 0.03) * scaling_size);
      if (this.max_tick_size && (tickSize > this.max_tick_size)) tickSize = this.max_tick_size;

      // first draw ticks

      const handle = this.createTicks(false, optionNoexp, optionNoopt, optionInt);

      axis_lines += this.produceTicksPath(handle, side, tickSize, ticksPlusMinus, secondShift, draw_lines && !disable_axis_drawing && !this.disable_ticks);

      if (!disable_axis_drawing && axis_lines && !this.lineatt.empty())
         axis_g.append("svg:path").attr("d", axis_lines)
               .call(this.lineatt.func);

      let labelSize0 = Math.round( (axis.fLabelSize < 1) ? axis.fLabelSize * text_scaling_size : axis.fLabelSize),
          labeloffset = Math.round(Math.abs(axis.fLabelOffset)*text_scaling_size);

      if ((labelSize0 <= 0) || (Math.abs(axis.fLabelOffset) > 1.1)) optionUnlab = true; // disable labels when size not specified

      let title_shift_x = 0, title_shift_y = 0, title_g = null, axis_rect = null,
          title_fontsize = 0, arr = [labelSize0, 0];

      // draw labels (sometime on both sides)
      if (!disable_axis_drawing && !optionUnlab)
         arr = await this.drawLabels(axis_g, axis, w, h, handle, side, labelSize0, labeloffset, tickSize, ticksPlusMinus, max_text_width);

      let labelMaxWidth = arr[1];

      if (settings.Zooming && !this.disable_zooming && !isBatchMode()) {
         let labelSize = arr[0],
             r = axis_g.append("svg:rect")
                       .attr("class", "axis_zoom")
                       .style("opacity", "0")
                       .style("cursor", "crosshair");

         if (vertical) {
            let rw = (labelMaxWidth || 2*labelSize) + 3;
            r.attr("x", (side > 0) ? -rw : 0)
             .attr("y", 0)
             .attr("width", rw)
             .attr("height", h);
         } else {
            r.attr("x", 0).attr("y", (side > 0) ? 0 : -labelSize - 3)
             .attr("width", w).attr("height", labelSize + 3);
         }
      }

      this.position = 0;

      if (calculate_position) {
         let node1 = axis_g.node(), node2 = this.getPadSvg().node();
         if (node1 && node2 && node1.getBoundingClientRect && node2.getBoundingClientRect) {
            let rect1 = node1.getBoundingClientRect(),
                rect2 = node2.getBoundingClientRect();

            this.position = rect1.left - rect2.left; // use to control left position of Y scale
         }
         if (node1 && !node2)
            console.warn("Why PAD element missing when search for position");
      }

      if (!axis.fTitle || disable_axis_drawing) return true;

      title_g = axis_g.append("svg:g").attr("class", "axis_title");
      title_fontsize = (axis.fTitleSize >= 1) ? axis.fTitleSize : Math.round(axis.fTitleSize * text_scaling_size);

      let title_offest_k = 1.6*((axis.fTitleSize < 1) ? axis.fTitleSize : axis.fTitleSize/(text_scaling_size || 10)),
          center = axis.TestBit(EAxisBits.kCenterTitle),
          opposite = axis.TestBit(EAxisBits.kOppositeTitle),
          rotate = axis.TestBit(EAxisBits.kRotateTitle) ? -1 : 1,
          title_color = this.getColor(is_gaxis ? axis.fTextColor : axis.fTitleColor);

      this.startTextDrawing(axis.fTitleFont, title_fontsize, title_g);

      let xor_reverse = swap_side ^ opposite, myxor = (rotate < 0) ^ xor_reverse;

      this.title_align = center ? "middle" : (myxor ? "begin" : "end");

      if (vertical) {
         title_offest_k *= -side*pad_w;

         title_shift_x = Math.round(title_offest_k*axis.fTitleOffset);

         if ((this.name == "zaxis") && is_gaxis && ('getBoundingClientRect' in axis_g.node())) {
            // special handling for color palette labels - draw them always on right side
            let rect = axis_g.node().getBoundingClientRect();
            if (title_shift_x < rect.width - tickSize) title_shift_x = Math.round(rect.width - tickSize);
         }

         title_shift_y = Math.round(center ? h/2 : (xor_reverse ? h : 0));

         this.drawText({ align: this.title_align+";middle",
                         rotate: (rotate<0) ? 90 : 270,
                         text: axis.fTitle, color: title_color, draw_g: title_g });
      } else {
         title_offest_k *= side*pad_h;

         title_shift_x = Math.round(center ? w/2 : (xor_reverse ? 0 : w));
         title_shift_y = Math.round(title_offest_k*axis.fTitleOffset);
         this.drawText({ align: this.title_align+";middle",
                         rotate: (rotate<0) ? 180 : 0,
                         text: axis.fTitle, color: title_color, draw_g: title_g });
      }

      if (vertical && (axis.fTitleOffset == 0) && ('getBoundingClientRect' in axis_g.node()))
         axis_rect = axis_g.node().getBoundingClientRect();

      this.addTitleDrag(title_g, vertical, title_offest_k, swap_side, vertical ? h : w);

      await this.finishTextDrawing(title_g);

      if (title_g) {
         // fine-tuning of title position when possible
         if (axis_rect) {
            let title_rect = title_g.node().getBoundingClientRect();
            if ((axis_rect.left != axis_rect.right) && (title_rect.left != title_rect.right))
               title_shift_x = (side > 0) ? Math.round(axis_rect.left - title_rect.right - title_fontsize*0.3) :
                                            Math.round(axis_rect.right - title_rect.left + title_fontsize*0.3);
            else
               title_shift_x = -1 * Math.round(((side > 0) ? (labeloffset + labelMaxWidth) : 0) + title_fontsize*0.7);
         }

         title_g.attr('transform', `translate(${title_shift_x},${title_shift_y})`)
                .property('shift_x', title_shift_x)
                .property('shift_y', title_shift_y);
      }

      return this;
   }

   /** @summary Convert TGaxis position into NDC to fix it when frame zoomed */
   convertTo(opt) {
      let gaxis = this.getObject(),
          x1 = this.axisToSvg("x", gaxis.fX1),
          y1 = this.axisToSvg("y", gaxis.fY1),
          x2 = this.axisToSvg("x", gaxis.fX2),
          y2 = this.axisToSvg("y", gaxis.fY2);

      if (opt == "ndc") {
          let pw = this.getPadPainter().getPadWidth(),
              ph = this.getPadPainter().getPadHeight();

          gaxis.fX1 = x1 / pw;
          gaxis.fX2 = x2 / pw;
          gaxis.fY1 = (ph - y1) / ph;
          gaxis.fY2 = (ph - y2)/ ph;
          this.use_ndc = true;
      } else if (opt == "frame") {
         let rect = this.getFramePainter().getFrameRect();
         gaxis.fX1 = (x1 - rect.x) / rect.width;
         gaxis.fX2 = (x2 - rect.x) / rect.width;
         gaxis.fY1 = (y1 - rect.y) / rect.height;
         gaxis.fY2 = (y2 - rect.y) / rect.height;
         this.bind_frame = true;
      }
   }

   /** @summary Redraw axis, used in standalone mode for TGaxis */
   redraw() {

      let gaxis = this.getObject(), x1, y1, x2, y2;

      if (this.bind_frame) {
         let rect = this.getFramePainter().getFrameRect();
         x1 = Math.round(rect.x + gaxis.fX1 * rect.width);
         x2 = Math.round(rect.x + gaxis.fX2 * rect.width);
         y1 = Math.round(rect.y + gaxis.fY1 * rect.height);
         y2 = Math.round(rect.y + gaxis.fY2 * rect.height);
      } else {
          x1 = this.axisToSvg("x", gaxis.fX1, this.use_ndc);
          y1 = this.axisToSvg("y", gaxis.fY1, this.use_ndc);
          x2 = this.axisToSvg("x", gaxis.fX2, this.use_ndc);
          y2 = this.axisToSvg("y", gaxis.fY2, this.use_ndc);
      }
      let w = x2 - x1, h = y1 - y2,
          vertical = Math.abs(w) < Math.abs(h),
          sz = vertical ? h : w,
          reverse = false,
          min = gaxis.fWmin, max = gaxis.fWmax;

      if (sz < 0) {
         reverse = true;
         sz = -sz;
         if (vertical) y2 = y1; else x1 = x2;
      }

      this.configureAxis(vertical ? "yaxis" : "xaxis", min, max, min, max, vertical, [0, sz], {
         time_scale: gaxis.fChopt.indexOf("t") >= 0,
         log: (gaxis.fChopt.indexOf("G") >= 0) ? 1 : 0,
         reverse: reverse,
         swap_side: reverse
      });

      this.createG();

      return this.drawAxis(this.getG(), Math.abs(w), Math.abs(h), `translate(${x1},${y2})`);
   }

} // class TAxisPainter

export { EAxisBits, TAxisPainter };
