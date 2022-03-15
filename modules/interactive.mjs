/// interactive functionality for different classes

import { browser, settings, isBatchMode } from './core.mjs';

import { select as d3_select, drag as d3_drag,
         pointer as d3_pointer, pointers as d3_pointers } from './d3.mjs';

import { getElementRect } from './base/BasePainter.mjs';

import { FontHandler } from './base/FontHandler.mjs';

import { createMenu, closeMenu, getActivePad, getAbsPosInCanvas } from './painter.mjs';

import { ToolbarIcons } from './utils.mjs';

let TooltipHandler = {

   /** @desc only canvas info_layer can be used while other pads can overlay
     * @returns layer where frame tooltips are shown */
   hints_layer() {
      let pp = this.getCanvPainter();
      return pp ? pp.getLayerSvg("info_layer") : d3_select(null);
   },

   /** @returns true if tooltip is shown, use to prevent some other action */
   isTooltipShown() {
      if (!this.tooltip_enabled || !this.isTooltipAllowed()) return false;
      let hintsg = this.hints_layer().select(".objects_hints");
      return hintsg.empty() ? false : hintsg.property("hints_pad") == this.getPadName();
   },

   setTooltipEnabled(enabled) {
      if (enabled !== undefined) this.tooltip_enabled = enabled;
   },

   /** @summary central function which let show selected hints for the object */
   processFrameTooltipEvent(pnt, evnt) {
      if (pnt && pnt.handler) {
         // special use of interactive handler in the frame painter
         let rect = this.draw_g ? this.draw_g.select(".main_layer") : null;
         if (!rect || rect.empty()) {
            pnt = null; // disable
         } else if (pnt.touch && evnt) {
            let pos = d3_pointers(evnt, rect.node());
            pnt = (pos && pos.length == 1) ? { touch: true, x: pos[0][0], y: pos[0][1] } : null;
         } else if (evnt) {
            let pos = d3_pointer(evnt, rect.node());
            pnt = { touch: false, x: pos[0], y: pos[1] };
         }
      }

      let hints = [], nhints = 0, nexact = 0, maxlen = 0, lastcolor1 = 0, usecolor1 = false,
         textheight = 11, hmargin = 3, wmargin = 3, hstep = 1.2,
         frame_rect = this.getFrameRect(),
         pp = this.getPadPainter(),
         pad_width = pp.getPadWidth(),
         font = new FontHandler(160, textheight),
         disable_tootlips = !this.isTooltipAllowed() || !this.tooltip_enabled;

      if (pnt && disable_tootlips) pnt.disabled = true; // indicate that highlighting is not required
      if (pnt) pnt.painters = true; // get also painter

      // collect tooltips from pad painter - it has list of all drawn objects
      if (pp) hints = pp.processPadTooltipEvent(pnt);

      if (pnt && pnt.touch) textheight = 15;

      for (let n = 0; n < hints.length; ++n) {
         let hint = hints[n];
         if (!hint) continue;

         if (hint.painter && (hint.user_info !== undefined))
            hint.painter.provideUserTooltip(hint.user_info);

         if (!hint.lines || (hint.lines.length === 0)) {
            hints[n] = null; continue;
         }

         // check if fully duplicated hint already exists
         for (let k = 0; k < n; ++k) {
            let hprev = hints[k], diff = false;
            if (!hprev || (hprev.lines.length !== hint.lines.length)) continue;
            for (let l = 0; l < hint.lines.length && !diff; ++l)
               if (hprev.lines[l] !== hint.lines[l]) diff = true;
            if (!diff) { hints[n] = null; break; }
         }
         if (!hints[n]) continue;

         nhints++;

         if (hint.exact) nexact++;

         for (let l = 0; l < hint.lines.length; ++l)
            maxlen = Math.max(maxlen, hint.lines[l].length);

         hint.height = Math.round(hint.lines.length * textheight * hstep + 2 * hmargin - textheight * (hstep - 1));

         if ((hint.color1 !== undefined) && (hint.color1 !== 'none')) {
            if ((lastcolor1 !== 0) && (lastcolor1 !== hint.color1)) usecolor1 = true;
            lastcolor1 = hint.color1;
         }
      }

      let layer = this.hints_layer(),
          hintsg = layer.select(".objects_hints"), // group with all tooltips
          title = "", name = "", info = "",
          hint = null, best_dist2 = 1e10, best_hint = null, show_only_best = nhints > 15,
          coordinates = pnt ? Math.round(pnt.x) + "," + Math.round(pnt.y) : "";

      // try to select hint with exact match of the position when several hints available
      for (let k = 0; k < (hints ? hints.length : 0); ++k) {
         if (!hints[k]) continue;
         if (!hint) hint = hints[k];

         // select exact hint if this is the only one
         if (hints[k].exact && (nexact < 2) && (!hint || !hint.exact)) { hint = hints[k]; break; }

         if (!pnt || (hints[k].x === undefined) || (hints[k].y === undefined)) continue;

         let dist2 = (pnt.x - hints[k].x) * (pnt.x - hints[k].x) + (pnt.y - hints[k].y) * (pnt.y - hints[k].y);
         if (dist2 < best_dist2) { best_dist2 = dist2; best_hint = hints[k]; }
      }

      if ((!hint || !hint.exact) && (best_dist2 < 400)) hint = best_hint;

      if (hint) {
         name = (hint.lines && hint.lines.length > 1) ? hint.lines[0] : hint.name;
         title = hint.title || "";
         info = hint.line;
         if (!info && hint.lines) info = hint.lines.slice(1).join(' ');
      }

      this.showObjectStatus(name, title, info, coordinates);


      // end of closing tooltips
      if (!pnt || disable_tootlips || (hints.length === 0) || (maxlen === 0) || (show_only_best && !best_hint)) {
         hintsg.remove();
         return;
      }

      // we need to set pointer-events=none for all elements while hints
      // placed in front of so-called interactive rect in frame, used to catch mouse events

      if (hintsg.empty())
         hintsg = layer.append("svg:g")
            .attr("class", "objects_hints")
            .style("pointer-events", "none");

      let frame_shift = { x: 0, y: 0 }, trans = frame_rect.transform || "";
      if (!pp.iscan) {
         frame_shift = getAbsPosInCanvas(this.getPadSvg(), frame_shift);
         trans = "translate(" + frame_shift.x + "," + frame_shift.y + ") " + trans;
      }

      // copy transform attributes from frame itself
      hintsg.attr("transform", trans)
         .property("last_point", pnt)
         .property("hints_pad", this.getPadName());

      let viewmode = hintsg.property('viewmode') || "",
         actualw = 0, posx = pnt.x + frame_rect.hint_delta_x;

      if (show_only_best || (nhints == 1)) {
         viewmode = "single";
         posx += 15;
      } else {
         // if there are many hints, place them left or right

         let bleft = 0.5, bright = 0.5;

         if (viewmode == "left")
            bright = 0.7;
         else if (viewmode == "right")
            bleft = 0.3;

         if (posx <= bleft * frame_rect.width) {
            viewmode = "left";
            posx = 20;
         } else if (posx >= bright * frame_rect.width) {
            viewmode = "right";
            posx = frame_rect.width - 60;
         } else {
            posx = hintsg.property('startx');
         }
      }

      if (viewmode !== hintsg.property('viewmode')) {
         hintsg.property('viewmode', viewmode);
         hintsg.selectAll("*").remove();
      }

      let curry = 10, // normal y coordinate
          gapy = 10,  // y coordinate, taking into account all gaps
          gapminx = -1111, gapmaxx = -1111,
          minhinty = -frame_shift.y,
          cp = this.getCanvPainter(),
          maxhinty = cp.getPadHeight() - frame_rect.y - frame_shift.y;

      const FindPosInGap = y => {
         for (let n = 0; (n < hints.length) && (y < maxhinty); ++n) {
            let hint = hints[n];
            if (!hint) continue;
            if ((hint.y >= y - 5) && (hint.y <= y + hint.height + 5)) {
               y = hint.y + 10;
               n = -1;
            }
         }
         return y;
      };

      for (let n = 0; n < hints.length; ++n) {
         let hint = hints[n],
            group = hintsg.select(".painter_hint_" + n);

         if (show_only_best && (hint !== best_hint)) hint = null;

         if (hint === null) {
            group.remove();
            continue;
         }

         let was_empty = group.empty();

         if (was_empty)
            group = hintsg.append("svg:svg")
               .attr("class", "painter_hint_" + n)
               .attr('opacity', 0) // use attribute, not style to make animation with d3.transition()
               .style('overflow', 'hidden')
               .style("pointer-events", "none");

         if (viewmode == "single") {
            curry = pnt.touch ? (pnt.y - hint.height - 5) : Math.min(pnt.y + 15, maxhinty - hint.height - 3) + frame_rect.hint_delta_y;
         } else {
            gapy = FindPosInGap(gapy);
            if ((gapminx === -1111) && (gapmaxx === -1111)) gapminx = gapmaxx = hint.x;
            gapminx = Math.min(gapminx, hint.x);
            gapmaxx = Math.min(gapmaxx, hint.x);
         }

         group.attr("x", posx)
            .attr("y", curry)
            .property("curry", curry)
            .property("gapy", gapy);

         curry += hint.height + 5;
         gapy += hint.height + 5;

         if (!was_empty)
            group.selectAll("*").remove();

         group.attr("width", 60)
            .attr("height", hint.height);

         let r = group.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 60)
            .attr("height", hint.height)
            .style("fill", "lightgrey")
            .style("pointer-events", "none");

         if (nhints > 1) {
            let col = usecolor1 ? hint.color1 : hint.color2;
            if (col && (col !== 'none'))
               r.style("stroke", col);
         }
         r.attr("stroke-width", hint.exact ? 3 : 1);

         for (let l = 0; l < (hint.lines ? hint.lines.length : 0); l++)
            if (hint.lines[l] !== null) {
               let txt = group.append("svg:text")
                  .attr("text-anchor", "start")
                  .attr("x", wmargin)
                  .attr("y", hmargin + l * textheight * hstep)
                  .attr("dy", ".8em")
                  .style("fill", "black")
                  .style("pointer-events", "none")
                  .call(font.func)
                  .text(hint.lines[l]);

               let box = getElementRect(txt, 'bbox');

               actualw = Math.max(actualw, box.width);
            }

         function translateFn() {
            // We only use 'd', but list d,i,a as params just to show can have them as params.
            // Code only really uses d and t.
            return function(/*d, i, a*/) {
               return function(t) {
                  return t < 0.8 ? "0" : (t - 0.8) * 5;
               };
            };
         }

         if (was_empty)
            if (settings.TooltipAnimation > 0)
               group.transition().duration(settings.TooltipAnimation).attrTween("opacity", translateFn());
            else
               group.attr('opacity', 1);
      }

      actualw += 2 * wmargin;

      let svgs = hintsg.selectAll("svg");

      if ((viewmode == "right") && (posx + actualw > frame_rect.width - 20)) {
         posx = frame_rect.width - actualw - 20;
         svgs.attr("x", posx);
      }

      if ((viewmode == "single") && (posx + actualw > pad_width - frame_rect.x) && (posx > actualw + 20)) {
         posx -= (actualw + 20);
         svgs.attr("x", posx);
      }

      // if gap not very big, apply gapy coordinate to open view on the histogram
      if ((viewmode !== "single") && (gapy < maxhinty) && (gapy !== curry)) {
         if ((gapminx <= posx + actualw + 5) && (gapmaxx >= posx - 5))
            svgs.attr("y", function() { return d3_select(this).property('gapy'); });
      } else if ((viewmode !== 'single') && (curry > maxhinty)) {
         let shift = Math.max((maxhinty - curry - 10), minhinty);
         if (shift < 0)
            svgs.attr("y", function() { return d3_select(this).property('curry') + shift; });
      }

      if (actualw > 10)
         svgs.attr("width", actualw)
            .select('rect').attr("width", actualw);

      hintsg.property('startx', posx);

      if (cp._highlight_connect && (typeof cp.processHighlightConnect == 'function'))
         cp.processHighlightConnect(hints);
   },

   /** @summary Assigns tooltip methods */
   assign(painter) {
      painter.tooltip_enabled = true;
      painter.hints_layer = this.hints_layer;
      painter.isTooltipShown = this.isTooltipShown;
      painter.setTooltipEnabled = this.setTooltipEnabled;
      painter.processFrameTooltipEvent = this.processFrameTooltipEvent;
   }

} // TooltipHandler

function setPainterTooltipEnabled(painter, on) {
   if (!painter) return;

   let fp = painter.getFramePainter();
   if (fp && typeof fp.setTooltipEnabled == 'function') {
      fp.setTooltipEnabled(on);
      fp.processFrameTooltipEvent(null);
   }
   // this is 3D control object
   if (painter.control && (typeof painter.control.setTooltipEnabled == 'function'))
      painter.control.setTooltipEnabled(on);
}

function detectRightButton(event) {
   if ('buttons' in event) return event.buttons === 2;
   if ('which' in event) return event.which === 3;
   if ('button' in event) return event.button === 2;
   return false;
}

/** @summary Add drag for interactive rectangular elements for painter */
function addDragHandler(_painter, arg) {
   if (!settings.MoveResize || isBatchMode()) return;

   let painter = _painter, drag_rect = null, pp = painter.getPadPainter();
   if (pp && pp._fast_drawing) return;

   const makeResizeElements = (group, handler) => {
      const addElement = (cursor, d) => {
         let clname = "js_" + cursor.replace(/[-]/g, '_'),
             elem = group.select('.' + clname);
         if (elem.empty()) elem = group.append('path').classed(clname, true);
         elem.style('opacity', 0).style('cursor', cursor).attr('d', d);
         if (handler) elem.call(handler);
      };

      addElement("nw-resize", "M2,2h15v-5h-20v20h5Z");
      addElement("ne-resize", `M${arg.width-2},2h-15v-5h20v20h-5 Z`);
      addElement("sw-resize", `M2,${arg.height-2}h15v5h-20v-20h5Z`);
      addElement("se-resize", `M${arg.width-2},${arg.height-2}h-15v5h20v-20h-5Z`);

      if (!arg.no_change_x) {
         addElement("w-resize", `M-3,18h5v${Math.max(0,arg.height-2*18)}h-5Z`);
         addElement("e-resize", `M${arg.width+3},18h-5v${Math.max(0,arg.height-2*18)}h5Z`);
      }
      if (!arg.no_change_y) {
         addElement("n-resize", `M18,-3v5h${Math.max(0,arg.width-2*18)}v-5Z`);
         addElement("s-resize", `M18,${arg.height+3}v-5h${Math.max(0,arg.width-2*18)}v5Z`);
      }
   };

   const complete_drag = (newx, newy, newwidth, newheight) => {
      drag_rect.style("cursor", "auto");

      if (!painter.draw_g) {
         drag_rect.remove();
         drag_rect = null;
         return false;
      }

      let oldx = arg.x, oldy = arg.y;

      if (arg.minwidth && newwidth < arg.minwidth) newwidth = arg.minwidth;
      if (arg.minheight && newheight < arg.minheight) newheight = arg.minheight;

      let change_size = (newwidth !== arg.width) || (newheight !== arg.height),
          change_pos = (newx !== oldx) || (newy !== oldy);

      arg.x = newx; arg.y = newy; arg.width = newwidth; arg.height = newheight;

      painter.draw_g.attr("transform", `translate(${newx},${newy})`);

      drag_rect.remove();
      drag_rect = null;

      setPainterTooltipEnabled(painter, true);

      makeResizeElements(painter.draw_g);

      if (change_size || change_pos) {
         if (change_size && ('resize' in arg)) arg.resize(newwidth, newheight);
         if (change_pos && ('move' in arg)) arg.move(newx, newy, newx - oldxx, newy - oldy);

         if (change_size || change_pos) {
            if ('obj' in arg) {
               let rect = pp.getPadRect();
               arg.obj.fX1NDC = newx / rect.width;
               arg.obj.fX2NDC = (newx + newwidth) / rect.width;
               arg.obj.fY1NDC = 1 - (newy + newheight) / rect.height;
               arg.obj.fY2NDC = 1 - newy / rect.height;
               arg.obj.modified_NDC = true; // indicate that NDC was interactively changed, block in updated
            }
            if ('redraw' in arg) arg.redraw(arg);
         }
      }

      return change_size || change_pos;
   };

   let drag_move = d3_drag().subject(Object);

   drag_move
      .on("start", function(evnt) {
         if (detectRightButton(evnt.sourceEvent)) return;

         closeMenu(); // close menu

         setPainterTooltipEnabled(painter, false); // disable tooltip

         evnt.sourceEvent.preventDefault();
         evnt.sourceEvent.stopPropagation();

         let pad_rect = pp.getPadRect();

         let handle = {
            x: arg.x, y: arg.y, width: arg.width, height: arg.height,
            acc_x1: arg.x, acc_y1: arg.y,
            pad_w: pad_rect.width - arg.width,
            pad_h: pad_rect.height - arg.height,
            drag_tm: new Date(),
            path: `v${arg.height}h${arg.width}v${-arg.height}z`
         };

         drag_rect = d3_select(painter.draw_g.node().parentNode).append("path")
            .classed("zoom", true)
            .attr("d", `M${handle.acc_x1},${handle.acc_y1}${handle.path}`)
            .style("cursor", "move")
            .style("pointer-events", "none") // let forward double click to underlying elements
            .property('drag_handle', handle);


      }).on("drag", function(evnt) {
         if (!drag_rect) return;

         evnt.sourceEvent.preventDefault();
         evnt.sourceEvent.stopPropagation();

         let handle = drag_rect.property('drag_handle');

         if (!arg.no_change_x)
            handle.acc_x1 += evnt.dx;
         if (!arg.no_change_y)
            handle.acc_y1 += evnt.dy;

         handle.x = Math.min(Math.max(handle.acc_x1, 0), handle.pad_w);
         handle.y = Math.min(Math.max(handle.acc_y1, 0), handle.pad_h);

         drag_rect.attr("d", `M${handle.x},${handle.y}${handle.path}`);

      }).on("end", function(evnt) {
         if (!drag_rect) return;

         evnt.sourceEvent.preventDefault();

         let handle = drag_rect.property('drag_handle');

         if (complete_drag(handle.x, handle.y, arg.width, arg.height) === false) {
            let spent = (new Date()).getTime() - handle.drag_tm.getTime();
            if (arg.ctxmenu && (spent > 600) && painter.showContextMenu) {
               let rrr = resize_se.node().getBoundingClientRect();
               painter.showContextMenu('main', { clientX: rrr.left, clientY: rrr.top });
            } else if (arg.canselect && (spent <= 600)) {
               let pp = painter.getPadPainter();
               if (pp) pp.selectObjectPainter(painter);
            }
         }
      });

   let drag_resize = d3_drag().subject(Object);

   drag_resize
      .on("start", function(evnt) {
         if (detectRightButton(evnt.sourceEvent)) return;

         evnt.sourceEvent.stopPropagation();
         evnt.sourceEvent.preventDefault();

         setPainterTooltipEnabled(painter, false); // disable tooltip

         let pad_rect = pp.getPadRect();

         let handle = {
            x: arg.x, y: arg.y, width: arg.width, height: arg.height,
            acc_x1: arg.x, acc_y1: arg.y,
            pad_w: pad_rect.width,
            pad_h: pad_rect.height
         };

         handle.acc_x2 = handle.acc_x1 + arg.width;
         handle.acc_y2 = handle.acc_y1 + arg.height;

         drag_rect = d3_select(painter.draw_g.node().parentNode)
            .append("rect")
            .classed("zoom", true)
            .style("cursor", d3_select(this).style("cursor"))
            .attr("x", handle.acc_x1)
            .attr("y", handle.acc_y1)
            .attr("width", handle.acc_x2 - handle.acc_x1)
            .attr("height", handle.acc_y2 - handle.acc_y1)
            .property('drag_handle', handle);

      }).on("drag", function(evnt) {
         if (!drag_rect) return;

         evnt.sourceEvent.preventDefault();
         evnt.sourceEvent.stopPropagation();

         let handle = drag_rect.property('drag_handle'),
            dx = evnt.dx, dy = evnt.dy, elem = d3_select(this);

         if (arg.no_change_x) dx = 0;
         if (arg.no_change_y) dy = 0;

         if (elem.classed('js_nw_resize')) { handle.acc_x1 += dx; handle.acc_y1 += dy; }
         else if (elem.classed('js_ne_resize')) { handle.acc_x2 += dx; handle.acc_y1 += dy; }
         else if (elem.classed('js_sw_resize')) { handle.acc_x1 += dx; handle.acc_y2 += dy; }
         else if (elem.classed('js_se_resize')) { handle.acc_x2 += dx; handle.acc_y2 += dy; }
         else if (elem.classed('js_w_resize')) { handle.acc_x1 += dx; }
         else if (elem.classed('js_n_resize')) { handle.acc_y1 += dy; }
         else if (elem.classed('js_e_resize')) { handle.acc_x2 += dx; }
         else if (elem.classed('js_s_resize')) { handle.acc_y2 += dy; }

         let x1 = Math.max(0, handle.acc_x1), x2 = Math.min(handle.acc_x2, handle.pad_w),
             y1 = Math.max(0, handle.acc_y1), y2 = Math.min(handle.acc_y2, handle.pad_h);

         handle.x = Math.min(x1, x2);
         handle.y = Math.min(y1, y2);
         handle.width = Math.abs(x2 - x1);
         handle.height = Math.abs(y2 - y1);

         drag_rect.attr("x", handle.x).attr("y", handle.y).attr("width", handle.width).attr("height", handle.height);

      }).on("end", function(evnt) {
         if (!drag_rect) return;
         evnt.sourceEvent.preventDefault();

         let handle = drag_rect.property('drag_handle');

         complete_drag(handle.x, handle.y, handle.width, handle.height);
      });

   if (!arg.only_resize)
      painter.draw_g.style("cursor", "move").call(drag_move);

   if (!arg.only_move)
      makeResizeElements(painter.draw_g, drag_resize);
}

/** @summary Add move handlers for drawn element
  * @private */
function addMoveHandler(painter, enabled) {

   if (enabled === undefined) enabled = true;

   if (!settings.MoveResize || isBatchMode() || !painter.draw_g) return;

   if (!enabled) {
      if (painter.draw_g.property("assigned_move")) {
         let drag_move = d3_drag().subject(Object);
         drag_move.on("start", null).on("drag", null).on("end", null);
         painter.draw_g
               .style("cursor", null)
               .property("assigned_move", null)
               .call(drag_move);
      }
      return;
   }

   if (painter.draw_g.property("assigned_move")) return;

   let drag_move = d3_drag().subject(Object),
      not_changed = true, move_disabled = false;

   drag_move
      .on("start", function(evnt) {
         move_disabled = this.moveEnabled ? !this.moveEnabled() : false;
         if (move_disabled) return;
         if (detectRightButton(evnt.sourceEvent)) return;
         evnt.sourceEvent.preventDefault();
         evnt.sourceEvent.stopPropagation();
         let pos = d3_pointer(evnt, this.draw_g.node());
         not_changed = true;
         if (this.moveStart)
            this.moveStart(pos[0], pos[1]);
      }.bind(painter)).on("drag", function(evnt) {
         if (move_disabled) return;
         evnt.sourceEvent.preventDefault();
         evnt.sourceEvent.stopPropagation();
         not_changed = false;
         if (this.moveDrag)
            this.moveDrag(evnt.dx, evnt.dy);
      }.bind(painter)).on("end", function(evnt) {
         if (move_disabled) return;
         evnt.sourceEvent.preventDefault();
         evnt.sourceEvent.stopPropagation();
         if (this.moveEnd)
            this.moveEnd(not_changed);
         let pp = this.getPadPainter();
         if (pp) pp.selectObjectPainter(this);
      }.bind(painter));

   painter.draw_g
          .style("cursor", "move")
          .property("assigned_move", true)
          .call(drag_move);
}

// ================================================================================

let FrameInteractive = {

   addBasicInteractivity() {

      TooltipHandler.assign(this);

      if (!this._frame_rotate && !this._frame_fixpos)
         addDragHandler(this, { obj: this, x: this._frame_x, y: this._frame_y, width: this.getFrameWidth(), height: this.getFrameHeight(),
                                only_resize: true, minwidth: 20, minheight: 20, redraw: () => this.sizeChanged() });

      let main_svg = this.draw_g.select(".main_layer");

      main_svg.style("pointer-events","visibleFill")
              .property('handlers_set', 0);

      let pp = this.getPadPainter(),
          handlers_set = (pp && pp._fast_drawing) ? 0 : 1;

      if (main_svg.property('handlers_set') != handlers_set) {
         let close_handler = handlers_set ? this.processFrameTooltipEvent.bind(this, null) : null,
             mouse_handler = handlers_set ? this.processFrameTooltipEvent.bind(this, { handler: true, touch: false }) : null;

         main_svg.property('handlers_set', handlers_set)
                 .on('mouseenter', mouse_handler)
                 .on('mousemove', mouse_handler)
                 .on('mouseleave', close_handler);

         if (browser.touches) {
            let touch_handler = handlers_set ? this.processFrameTooltipEvent.bind(this, { handler: true, touch: true }) : null;

            main_svg.on("touchstart", touch_handler)
                    .on("touchmove", touch_handler)
                    .on("touchend", close_handler)
                    .on("touchcancel", close_handler);
         }
      }

      main_svg.attr("x", 0)
              .attr("y", 0)
              .attr("width", this.getFrameWidth())
              .attr("height", this.getFrameHeight());

      let hintsg = this.hints_layer().select(".objects_hints");
      // if tooltips were visible before, try to reconstruct them after short timeout
      if (!hintsg.empty() && this.isTooltipAllowed() && (hintsg.property("hints_pad") == this.getPadName()))
         setTimeout(this.processFrameTooltipEvent.bind(this, hintsg.property('last_point'), null), 10);
   },

   /** @summary Add interactive handlers */
   addFrameInteractivity(for_second_axes) {

      let pp = this.getPadPainter(),
          svg = this.getFrameSvg();
      if ((pp && pp._fast_drawing) || svg.empty())
         return Promise.resolve(this);

      if (for_second_axes) {

         // add extra handlers for second axes
         let svg_x2 = svg.selectAll(".x2axis_container"),
             svg_y2 = svg.selectAll(".y2axis_container");
         if (settings.ContextMenu) {
            svg_x2.on("contextmenu", evnt => this.showContextMenu("x2", evnt));
            svg_y2.on("contextmenu", evnt => this.showContextMenu("y2", evnt));
         }
         svg_x2.on("mousemove", evnt => this.showAxisStatus("x2", evnt));
         svg_y2.on("mousemove", evnt => this.showAxisStatus("y2", evnt));
         return Promise.resolve(this);
      }

      let svg_x = svg.selectAll(".xaxis_container"),
          svg_y = svg.selectAll(".yaxis_container");

      this.can_zoom_x = this.can_zoom_y = settings.Zooming;

      if (pp && pp.options) {
         if (pp.options.NoZoomX) this.can_zoom_x = false;
         if (pp.options.NoZoomY) this.can_zoom_y = false;
      }

      if (!svg.property('interactive_set')) {
         this.addKeysHandler();

         this.last_touch = new Date(0);
         this.zoom_kind = 0; // 0 - none, 1 - XY, 2 - only X, 3 - only Y, (+100 for touches)
         this.zoom_rect = null;
         this.zoom_origin = null;  // original point where zooming started
         this.zoom_curr = null;    // current point for zooming
         this.touch_cnt = 0;
      }

      if (settings.Zooming && !this.projection) {
         if (settings.ZoomMouse) {
            svg.on("mousedown", this.startRectSel.bind(this));
            svg.on("dblclick", this.mouseDoubleClick.bind(this));
         }
         if (settings.ZoomWheel)
            svg.on("wheel", this.mouseWheel.bind(this));
      }

      if (browser.touches && ((settings.Zooming && settings.ZoomTouch && !this.projection) || settings.ContextMenu))
         svg.on("touchstart", this.startTouchZoom.bind(this));

      if (settings.ContextMenu) {
         if (browser.touches) {
            svg_x.on("touchstart", this.startTouchMenu.bind(this,"x"));
            svg_y.on("touchstart", this.startTouchMenu.bind(this,"y"));
         }
         svg.on("contextmenu", evnt => this.showContextMenu("", evnt));
         svg_x.on("contextmenu", evnt => this.showContextMenu("x", evnt));
         svg_y.on("contextmenu", evnt => this.showContextMenu("y", evnt));
      }

      svg_x.on("mousemove", evnt => this.showAxisStatus("x", evnt));
      svg_y.on("mousemove", evnt => this.showAxisStatus("y", evnt));

      svg.property('interactive_set', true);

      return Promise.resolve(this);
   },

   /** @summary Add keys handler */
   addKeysHandler() {
      if (this.keys_handler || (typeof window == 'undefined')) return;

      this.keys_handler = evnt => this.processKeyPress(evnt);

      window.addEventListener('keydown', this.keys_handler, false);
   },

   /** @summary Handle key press */
   processKeyPress(evnt) {
      let main = this.selectDom();
      if (!settings.HandleKeys || main.empty() || (this.enabledKeys === false)) return;

      let key = "";
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

      let pp = this.getPadPainter();
      if (getActivePad() !== pp) return;

      if (evnt.shiftKey) key = "Shift " + key;
      if (evnt.altKey) key = "Alt " + key;
      if (evnt.ctrlKey) key = "Ctrl " + key;

      let zoom = { name: "x", dleft: 0, dright: 0 };

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
         if (!settings.Zooming) return false;
         // in 3dmode with orbit control ignore simple arrows
         if (this.mode3d && (key.indexOf("Ctrl")!==0)) return false;
         this.analyzeMouseWheelEvent(null, zoom, 0.5);
         this.zoom(zoom.name, zoom.min, zoom.max);
         if (zoom.changed) this.zoomChangedInteractive(zoom.name, true);
         evnt.stopPropagation();
         evnt.preventDefault();
      } else {
         let func = pp && pp.findPadButton ? pp.findPadButton(key) : "";
         if (func) {
            pp.clickPadButton(func);
            evnt.stopPropagation();
            evnt.preventDefault();
         }
      }

      return true; // just process any key press
   },

   /** @summary Function called when frame is clicked and object selection can be performed
     * @desc such event can be used to select */
   processFrameClick(pnt, dblckick) {

      let pp = this.getPadPainter();
      if (!pp) return;

      pnt.painters = true; // provide painters reference in the hints
      pnt.disabled = true; // do not invoke graphics

      // collect tooltips from pad painter - it has list of all drawn objects
      let hints = pp.processPadTooltipEvent(pnt), exact = null, res;
      for (let k = 0; (k <hints.length) && !exact; ++k)
         if (hints[k] && hints[k].exact)
            exact = hints[k];

      if (exact) {
         let handler = dblckick ? this._dblclick_handler : this._click_handler;
         if (handler) res = handler(exact.user_info, pnt);
      }

      if (!dblckick)
         pp.selectObjectPainter(exact ? exact.painter : this,
               { x: pnt.x + (this._frame_x || 0),  y: pnt.y + (this._frame_y || 0) });

      return res;
   },

   /** @summary Start mouse rect zooming */
   startRectSel(evnt) {
      // ignore when touch selection is activated

      if (this.zoom_kind > 100) return;

      // ignore all events from non-left button
      if ((evnt.which || evnt.button) !== 1) return;

      evnt.preventDefault();

      let frame = this.getFrameSvg(),
          pos = d3_pointer(evnt, frame.node());

      this.clearInteractiveElements();

      let w = this.getFrameWidth(), h = this.getFrameHeight();

      this.zoom_lastpos = pos;
      this.zoom_curr = [ Math.max(0, Math.min(w, pos[0])),
                         Math.max(0, Math.min(h, pos[1])) ];

      this.zoom_origin = [0,0];
      this.zoom_second = false;

      if ((pos[0] < 0) || (pos[0] > w)) {
         this.zoom_second = (pos[0] > w) && this.y2_handle;
         this.zoom_kind = 3; // only y
         this.zoom_origin[1] = this.zoom_curr[1];
         this.zoom_curr[0] = w;
         this.zoom_curr[1] += 1;
      } else if ((pos[1] < 0) || (pos[1] > h)) {
         this.zoom_second = (pos[1] < 0) && this.x2_handle;
         this.zoom_kind = 2; // only x
         this.zoom_origin[0] = this.zoom_curr[0];
         this.zoom_curr[0] += 1;
         this.zoom_curr[1] = h;
      } else {
         this.zoom_kind = 1; // x and y
         this.zoom_origin[0] = this.zoom_curr[0];
         this.zoom_origin[1] = this.zoom_curr[1];
      }

      d3_select(window).on("mousemove.zoomRect", this.moveRectSel.bind(this))
                       .on("mouseup.zoomRect", this.endRectSel.bind(this), true);

      this.zoom_rect = null;

      // disable tooltips in frame painter
      setPainterTooltipEnabled(this, false);

      evnt.stopPropagation();

      if (this.zoom_kind != 1)
         setTimeout(() => this.startLabelsMove(), 500);
   },

   /** @summary Starts labels move */
   startLabelsMove() {
      if (this.zoom_rect) return;

      let handle = this.zoom_kind == 2 ? this.x_handle : this.y_handle;

      if (!handle || (typeof handle.processLabelsMove != 'function') || !this.zoom_lastpos) return;

      if (handle.processLabelsMove('start', this.zoom_lastpos)) {
         this.zoom_labels = handle;
      }
   },

   /** @summary Process mouse rect zooming */
   moveRectSel(evnt) {

      if ((this.zoom_kind == 0) || (this.zoom_kind > 100)) return;

      evnt.preventDefault();
      let m = d3_pointer(evnt, this.getFrameSvg().node());

      if (this.zoom_labels)
         return this.zoom_labels.processLabelsMove('move', m);

      this.zoom_lastpos[0] = m[0];
      this.zoom_lastpos[1] = m[1];

      m[0] = Math.max(0, Math.min(this.getFrameWidth(), m[0]));
      m[1] = Math.max(0, Math.min(this.getFrameHeight(), m[1]));

      switch (this.zoom_kind) {
         case 1: this.zoom_curr[0] = m[0]; this.zoom_curr[1] = m[1]; break;
         case 2: this.zoom_curr[0] = m[0]; break;
         case 3: this.zoom_curr[1] = m[1]; break;
      }

      let x = Math.min(this.zoom_origin[0], this.zoom_curr[0]),
          y = Math.min(this.zoom_origin[1], this.zoom_curr[1]),
          w = Math.abs(this.zoom_curr[0] - this.zoom_origin[0]),
          h = Math.abs(this.zoom_curr[1] - this.zoom_origin[1]);

      if (!this.zoom_rect) {
         // ignore small changes, can be switching to labels move
         if ((this.zoom_kind != 1) && ((w < 2) || (h < 2))) return;

         this.zoom_rect = this.getFrameSvg()
                              .append("rect")
                              .attr("class", "zoom")
                              .style("pointer-events","none");
      }

      this.zoom_rect.attr("x", x).attr("y", y).attr("width", w).attr("height", h);
   },

   /** @summary Finish mouse rect zooming */
   endRectSel(evnt) {
      if ((this.zoom_kind == 0) || (this.zoom_kind > 100)) return;

      evnt.preventDefault();

      d3_select(window).on("mousemove.zoomRect", null)
                       .on("mouseup.zoomRect", null);

      let m = d3_pointer(evnt, this.getFrameSvg().node()), kind = this.zoom_kind;

      if (this.zoom_labels) {
         this.zoom_labels.processLabelsMove('stop', m);
      } else {
         let changed = [this.can_zoom_x, this.can_zoom_y];
         m[0] = Math.max(0, Math.min(this.getFrameWidth(), m[0]));
         m[1] = Math.max(0, Math.min(this.getFrameHeight(), m[1]));

         switch (this.zoom_kind) {
            case 1: this.zoom_curr[0] = m[0]; this.zoom_curr[1] = m[1]; break;
            case 2: this.zoom_curr[0] = m[0]; changed[1] = false; break; // only X
            case 3: this.zoom_curr[1] = m[1]; changed[0] = false; break; // only Y
         }

         let xmin, xmax, ymin, ymax, isany = false,
             idx = this.swap_xy ? 1 : 0, idy = 1 - idx,
             namex = "x", namey = "y";

         if (changed[idx] && (Math.abs(this.zoom_curr[idx] - this.zoom_origin[idx]) > 10)) {
            if (this.zoom_second && (this.zoom_kind == 2)) namex = "x2";
            xmin = Math.min(this.revertAxis(namex, this.zoom_origin[idx]), this.revertAxis(namex, this.zoom_curr[idx]));
            xmax = Math.max(this.revertAxis(namex, this.zoom_origin[idx]), this.revertAxis(namex, this.zoom_curr[idx]));
            isany = true;
         }

         if (changed[idy] && (Math.abs(this.zoom_curr[idy] - this.zoom_origin[idy]) > 10)) {
            if (this.zoom_second && (this.zoom_kind == 3)) namey = "y2";
            ymin = Math.min(this.revertAxis(namey, this.zoom_origin[idy]), this.revertAxis(namey, this.zoom_curr[idy]));
            ymax = Math.max(this.revertAxis(namey, this.zoom_origin[idy]), this.revertAxis(namey, this.zoom_curr[idy]));
            isany = true;
         }

         if (namex == "x2") {
            this.zoomChangedInteractive(namex, true);
            this.zoomSingle(namex, xmin, xmax);
            kind = 0;
         } else if (namey == "y2") {
            this.zoomChangedInteractive(namey, true);
            this.zoomSingle(namey, ymin, ymax);
            kind = 0;
         } else if (isany) {
            this.zoomChangedInteractive("x", true);
            this.zoomChangedInteractive("y", true);
            this.zoom(xmin, xmax, ymin, ymax);
            kind = 0;
         }
      }

      let pnt = (kind===1) ? { x: this.zoom_origin[0], y: this.zoom_origin[1] } : null;

      this.clearInteractiveElements();

      // if no zooming was done, select active object instead
      switch (kind) {
         case 1:
            this.processFrameClick(pnt);
            break;
         case 2: {
            let pp = this.getPadPainter();
            if (pp) pp.selectObjectPainter(this, null, "xaxis");
            break;
         }
         case 3: {
            let pp = this.getPadPainter();
            if (pp) pp.selectObjectPainter(this, null, "yaxis");
            break;
         }
      }

   },

   /** @summary Handle mouse double click on frame */
   mouseDoubleClick(evnt) {
      evnt.preventDefault();
      let m = d3_pointer(evnt, this.getFrameSvg().node()),
          fw = this.getFrameWidth(), fh = this.getFrameHeight();
      this.clearInteractiveElements();

      let valid_x = (m[0] >= 0) && (m[0] <= fw),
          valid_y = (m[1] >= 0) && (m[1] <= fh);

      if (valid_x && valid_y && this._dblclick_handler)
         if (this.processFrameClick({ x: m[0], y: m[1] }, true)) return;

      let kind = (this.can_zoom_x ? "x" : "") + (this.can_zoom_y ? "y" : "") + "z";
      if (!valid_x) {
         if (!this.can_zoom_y) return;
         kind = this.swap_xy ? "x" : "y";
         if ((m[0] > fw) && this[kind+"2_handle"]) kind += "2"; // let unzoom second axis
      } else if (!valid_y) {
         if (!this.can_zoom_x) return;
         kind = this.swap_xy ? "y" : "x";
         if ((m[1] < 0) && this[kind+"2_handle"]) kind += "2"; // let unzoom second axis
      }
      this.unzoom(kind).then(changed => {
         if (changed) return;
         let pp = this.getPadPainter(), rect = this.getFrameRect();
         if (pp) pp.selectObjectPainter(pp, { x: m[0] + rect.x, y: m[1] + rect.y, dbl: true });
      });
   },

   /** @summary Start touch zoom */
   startTouchZoom(evnt) {
      // in case when zooming was started, block any other kind of events
      if (this.zoom_kind != 0) {
         evnt.preventDefault();
         evnt.stopPropagation();
         return;
      }

      let arr = d3_pointers(evnt, this.getFrameSvg().node());
      this.touch_cnt+=1;

      // normally double-touch will be handled
      // touch with single click used for context menu
      if (arr.length == 1) {
         // this is touch with single element

         let now = new Date(), diff = now.getTime() - this.last_touch.getTime();
         this.last_touch = now;

         if ((diff < 300) && this.zoom_curr
             && (Math.abs(this.zoom_curr[0] - arr[0][0]) < 30)
             && (Math.abs(this.zoom_curr[1] - arr[0][1]) < 30)) {

            evnt.preventDefault();
            evnt.stopPropagation();

            this.clearInteractiveElements();
            this.unzoom("xyz");

            this.last_touch = new Date(0);

            this.getFrameSvg().on("touchcancel", null)
                            .on("touchend", null, true);
         } else if (settings.ContextMenu) {
            this.zoom_curr = arr[0];
            this.getFrameSvg().on("touchcancel", this.endTouchSel.bind(this))
                            .on("touchend", this.endTouchSel.bind(this));
            evnt.preventDefault();
            evnt.stopPropagation();
         }
      }

      if ((arr.length != 2) || !settings.Zooming || !settings.ZoomTouch) return;

      evnt.preventDefault();
      evnt.stopPropagation();

      this.clearInteractiveElements();

      this.getFrameSvg().on("touchcancel", null)
                      .on("touchend", null);

      let pnt1 = arr[0], pnt2 = arr[1], w = this.getFrameWidth(), h = this.getFrameHeight();

      this.zoom_curr = [ Math.min(pnt1[0], pnt2[0]), Math.min(pnt1[1], pnt2[1]) ];
      this.zoom_origin = [ Math.max(pnt1[0], pnt2[0]), Math.max(pnt1[1], pnt2[1]) ];
      this.zoom_second = false;

      if ((this.zoom_curr[0] < 0) || (this.zoom_curr[0] > w)) {
         this.zoom_second = (this.zoom_curr[0] > w) && this.y2_handle;
         this.zoom_kind = 103; // only y
         this.zoom_curr[0] = 0;
         this.zoom_origin[0] = w;
      } else if ((this.zoom_origin[1] > h) || (this.zoom_origin[1] < 0)) {
         this.zoom_second = (this.zoom_origin[1] < 0) && this.x2_handle;
         this.zoom_kind = 102; // only x
         this.zoom_curr[1] = 0;
         this.zoom_origin[1] = h;
      } else {
         this.zoom_kind = 101; // x and y
      }

      setPainterTooltipEnabled(this, false);

      this.zoom_rect = this.getFrameSvg().append("rect")
            .attr("class", "zoom")
            .attr("id", "zoomRect")
            .attr("x", this.zoom_curr[0])
            .attr("y", this.zoom_curr[1])
            .attr("width", this.zoom_origin[0] - this.zoom_curr[0])
            .attr("height", this.zoom_origin[1] - this.zoom_curr[1]);

      d3_select(window).on("touchmove.zoomRect", this.moveTouchZoom.bind(this))
                       .on("touchcancel.zoomRect", this.endTouchZoom.bind(this))
                       .on("touchend.zoomRect", this.endTouchZoom.bind(this));
   },

   /** @summary Move touch zooming */
   moveTouchZoom(evnt) {
      if (this.zoom_kind < 100) return;

      evnt.preventDefault();

      let arr = d3_pointers(evnt, this.getFrameSvg().node());

      if (arr.length != 2)
         return this.clearInteractiveElements();

      let pnt1 = arr[0], pnt2 = arr[1];

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
         setPainterTooltipEnabled(this, false);

      evnt.stopPropagation();
   },

   /** @summary End touch zooming handler */
   endTouchZoom(evnt) {

      this.getFrameSvg().on("touchcancel", null)
                      .on("touchend", null);

      if (this.zoom_kind === 0) {
         // special case - single touch can ends up with context menu

         evnt.preventDefault();

         let now = new Date();

         let diff = now.getTime() - this.last_touch.getTime();

         if ((diff > 500) && (diff < 2000) && !this.isTooltipShown()) {
            this.showContextMenu('main', { clientX: this.zoom_curr[0], clientY: this.zoom_curr[1] });
            this.last_touch = new Date(0);
         } else {
            this.clearInteractiveElements();
         }
      }

      if (this.zoom_kind < 100) return;

      evnt.preventDefault();
      d3_select(window).on("touchmove.zoomRect", null)
                       .on("touchend.zoomRect", null)
                       .on("touchcancel.zoomRect", null);

      let xmin, xmax, ymin, ymax, isany = false,
          xid = this.swap_xy ? 1 : 0, yid = 1 - xid,
          changed = [true, true], namex = "x", namey = "y";

      if (this.zoom_kind === 102) changed[1] = false;
      if (this.zoom_kind === 103) changed[0] = false;

      if (changed[xid] && (Math.abs(this.zoom_curr[xid] - this.zoom_origin[xid]) > 10)) {
         if (this.zoom_second && (this.zoom_kind == 102)) namex = "x2";
         xmin = Math.min(this.revertAxis(namex, this.zoom_origin[xid]), this.revertAxis(namex, this.zoom_curr[xid]));
         xmax = Math.max(this.revertAxis(namex, this.zoom_origin[xid]), this.revertAxis(namex, this.zoom_curr[xid]));
         isany = true;
      }

      if (changed[yid] && (Math.abs(this.zoom_curr[yid] - this.zoom_origin[yid]) > 10)) {
         if (this.zoom_second && (this.zoom_kind == 103)) namey = "y2";
         ymin = Math.min(this.revertAxis(namey, this.zoom_origin[yid]), this.revertAxis(namey, this.zoom_curr[yid]));
         ymax = Math.max(this.revertAxis(namey, this.zoom_origin[yid]), this.revertAxis(namey, this.zoom_curr[yid]));
         isany = true;
      }

      this.clearInteractiveElements();
      this.last_touch = new Date(0);

      if (namex == "x2") {
         this.zoomChangedInteractive(namex, true);
         this.zoomSingle(namex, xmin, xmax);
      } else if (namey == "y2") {
         this.zoomChangedInteractive(namey, true);
         this.zoomSingle(namey, ymin, ymax);
      } else if (isany) {
         this.zoomChangedInteractive('x', true);
         this.zoomChangedInteractive('y', true);
         this.zoom(xmin, xmax, ymin, ymax);
      }

      evnt.stopPropagation();
   },

   /** @summary Analyze zooming with mouse wheel */
   analyzeMouseWheelEvent(event, item, dmin, test_ignore, second_side) {
      // if there is second handle, use it
      let handle2 = second_side ? this[item.name + "2_handle"] : null;
      if (handle2) {
         item.second = Object.assign({}, item);
         return handle2.analyzeWheelEvent(event, dmin, item.second, test_ignore);
      }
      let handle = this[item.name + "_handle"];
      if (handle) return handle.analyzeWheelEvent(event, dmin, item, test_ignore);
      console.error('Fail to analyze zooming event for ', item.name);
   },

    /** @summary return true if default Y zooming should be enabled
      * @desc it is typically for 2-Dim histograms or
      * when histogram not draw, defined by other painters */
   isAllowedDefaultYZooming() {

      if (this.self_drawaxes) return true;

      let pad_painter = this.getPadPainter();
      if (pad_painter && pad_painter.painters)
         for (let k = 0; k < pad_painter.painters.length; ++k) {
            let subpainter = pad_painter.painters[k];
            if (subpainter && (subpainter.wheel_zoomy !== undefined))
               return subpainter.wheel_zoomy;
         }

      return false;
   },

   /** @summary Handles mouse wheel event */
   mouseWheel(evnt) {
      evnt.stopPropagation();
      evnt.preventDefault();
      this.clearInteractiveElements();

      let itemx = { name: "x", reverse: this.reverse_x },
          itemy = { name: "y", reverse: this.reverse_y, ignore: !this.isAllowedDefaultYZooming() },
          cur = d3_pointer(evnt, this.getFrameSvg().node()),
          w = this.getFrameWidth(), h = this.getFrameHeight();

      if (this.can_zoom_x)
         this.analyzeMouseWheelEvent(evnt, this.swap_xy ? itemy : itemx, cur[0] / w, (cur[1] >=0) && (cur[1] <= h), cur[1] < 0);

      if (this.can_zoom_y)
         this.analyzeMouseWheelEvent(evnt, this.swap_xy ? itemx : itemy, 1 - cur[1] / h, (cur[0] >= 0) && (cur[0] <= w), cur[0] > w);

      this.zoom(itemx.min, itemx.max, itemy.min, itemy.max);

      if (itemx.changed) this.zoomChangedInteractive('x', true);
      if (itemy.changed) this.zoomChangedInteractive('y', true);

      if (itemx.second) {
         this.zoomSingle("x2", itemx.second.min, itemx.second.max);
         if (itemx.second.changed) this.zoomChangedInteractive('x2', true);
      }
      if (itemy.second) {
         this.zoomSingle("y2", itemy.second.min, itemy.second.max);
         if (itemy.second.changed) this.zoomChangedInteractive('y2', true);
      }
   },

   /** @summary Show frame context menu */
   showContextMenu(kind, evnt, obj) {

      // ignore context menu when touches zooming is ongoing
      if (('zoom_kind' in this) && (this.zoom_kind > 100)) return;

      // this is for debug purposes only, when context menu is where, close is and show normal menu
      //if (!evnt && !kind && document.getElementById('root_ctx_menu')) {
      //   let elem = document.getElementById('root_ctx_menu');
      //   elem.parentNode.removeChild(elem);
      //   return;
      //}

      let menu_painter = this, exec_painter = null, frame_corner = false, fp = null; // object used to show context menu

      if (evnt.stopPropagation) {
         evnt.preventDefault();
         evnt.stopPropagation(); // disable main context menu

         if (kind == 'painter' && obj) {
            menu_painter = obj;
            kind = "";
         } else if (!kind) {
            let ms = d3_pointer(evnt, this.getFrameSvg().node()),
                tch = d3_pointers(evnt, this.getFrameSvg().node()),
                pp = this.getPadPainter(),
                pnt = null, sel = null;

            fp = this;

            if (tch.length === 1) pnt = { x: tch[0][0], y: tch[0][1], touch: true }; else
            if (ms.length === 2) pnt = { x: ms[0], y: ms[1], touch: false };

            if ((pnt !== null) && (pp !== null)) {
               pnt.painters = true; // assign painter for every tooltip
               let hints = pp.processPadTooltipEvent(pnt), bestdist = 1000;
               for (let n=0;n<hints.length;++n)
                  if (hints[n] && hints[n].menu) {
                     let dist = ('menu_dist' in hints[n]) ? hints[n].menu_dist : 7;
                     if (dist < bestdist) { sel = hints[n].painter; bestdist = dist; }
                  }
            }

            if (sel) menu_painter = sel; else kind = "frame";

            if (pnt) frame_corner = (pnt.x>0) && (pnt.x<20) && (pnt.y>0) && (pnt.y<20);

            fp.setLastEventPos(pnt);
         } else if (!this.v7_frame && ((kind=="x") || (kind=="y") || (kind=="z"))) {
            exec_painter = this.getMainPainter(); // histogram painter delivers items for axis menu
         }
      } else if (kind == 'painter' && obj) {
         // this is used in 3D context menu to show special painter
         menu_painter = obj;
         kind = "";
      }

      if (!exec_painter) exec_painter = menu_painter;

      if (!menu_painter || !menu_painter.fillContextMenu) return;

      this.clearInteractiveElements();

      createMenu(evnt, menu_painter).then(menu => {
         let domenu = menu.painter.fillContextMenu(menu, kind, obj);

         // fill frame menu by default - or append frame elements when activated in the frame corner
         if (fp && (!domenu || (frame_corner && (kind!=="frame"))))
            domenu = fp.fillContextMenu(menu);

         if (domenu)
            exec_painter.fillObjectExecMenu(menu, kind).then(menu => {
                // suppress any running zooming
                setPainterTooltipEnabled(menu.painter, false);
                menu.show().then(() => setPainterTooltipEnabled(menu.painter, true));
            });
      });
   },

  /** @summary Activate context menu handler via touch events
    * @private */
   startTouchMenu(kind, evnt) {
      // method to let activate context menu via touch handler

      let arr = d3_pointers(evnt, this.getFrameSvg().node());
      if (arr.length != 1) return;

      if (!kind || (kind=="")) kind = "main";
      let fld = "touch_" + kind;

      evnt.sourceEvent.preventDefault();
      evnt.sourceEvent.stopPropagation();

      this[fld] = { dt: new Date(), pos: arr[0] };

      let handler = this.endTouchMenu.bind(this, kind);

      this.getFrameSvg().on("touchcancel", handler)
                      .on("touchend", handler);
   },

   /** @summary Process end-touch event, which can cause content menu to appear
    * @private */
   endTouchMenu(kind, evnt) {
      let fld = "touch_" + kind;

      if (! (fld in this)) return;

      evnt.sourceEvent.preventDefault();
      evnt.sourceEvent.stopPropagation();

      let diff = new Date().getTime() - this[fld].dt.getTime();

      this.getFrameSvg().on("touchcancel", null)
                      .on("touchend", null);

      if (diff > 500) {
         let rect = this.getFrameSvg().node().getBoundingClientRect();
         this.showContextMenu(kind, { clientX: rect.left + this[fld].pos[0],
                                      clientY: rect.top + this[fld].pos[1] } );
      }

      delete this[fld];
   },

   /** @summary Clear frame interactive elements */
   clearInteractiveElements() {
      closeMenu();
      this.zoom_kind = 0;
      if (this.zoom_rect) { this.zoom_rect.remove(); delete this.zoom_rect; }
      delete this.zoom_curr;
      delete this.zoom_origin;
      delete this.zoom_lastpos;
      delete this.zoom_labels;

      // enable tooltip in frame painter
      setPainterTooltipEnabled(this, true);
   },

   /** @summary Assign frame interactive methods */
   assign(painter) {
      Object.assign(painter, this);
   }

} // FrameInterative


function getButtonSize(handler, fact) {
   return Math.round((fact || 1) * (handler.iscan || !handler.has_canvas ? 16 : 12));
}

function toggleButtonsVisibility(handler, action) {
   let group = handler.getLayerSvg("btns_layer", handler.this_pad_name),
       btn = group.select("[name='Toggle']");

   if (btn.empty()) return;

   let state = btn.property('buttons_state');

   if (btn.property('timout_handler')) {
      if (action!=='timeout') clearTimeout(btn.property('timout_handler'));
      btn.property('timout_handler', null);
   }

   let is_visible = false;
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
         if (!state) btn.property('timout_handler', setTimeout(() => toggleButtonsVisibility(handler, 'timeout'), 1200));
         return;
   }

   group.selectAll('svg').each(function() {
      if (this===btn.node()) return;
      d3_select(this).style('display', is_visible ? "" : "none");
   });
}

let PadButtonsHandler = {

   alignButtons(btns, width, height) {
      let sz0 = getButtonSize(this, 1.25), nextx = (btns.property('nextx') || 0) + sz0, btns_x, btns_y;

      if (btns.property('vertical')) {
         btns_x = btns.property('leftside') ? 2 : (width - sz0);
         btns_y = height - nextx;
      } else {
         btns_x = btns.property('leftside') ? 2 : (width - nextx);
         btns_y = height - sz0;
      }

      btns.attr("transform","translate("+btns_x+","+btns_y+")");
   },

   findPadButton(keyname) {
      let group = this.getLayerSvg("btns_layer", this.this_pad_name), found_func = "";
      if (!group.empty())
         group.selectAll("svg").each(function() {
            if (d3_select(this).attr("key") === keyname)
               found_func = d3_select(this).attr("name");
         });

      return found_func;
   },

   removePadButtons() {
      let group = this.getLayerSvg("btns_layer", this.this_pad_name);
      if (!group.empty()) {
         group.selectAll("*").remove();
         group.property("nextx", null);
      }
   },

   showPadButtons() {
      let group = this.getLayerSvg("btns_layer", this.this_pad_name);
      if (group.empty()) return;

      // clean all previous buttons
      group.selectAll("*").remove();
      if (!this._buttons) return;

      let iscan = this.iscan || !this.has_canvas, ctrl,
          x = group.property('leftside') ? getButtonSize(this, 1.25) : 0, y = 0;

      if (this._fast_drawing) {
         ctrl = ToolbarIcons.createSVG(group, ToolbarIcons.circle, getButtonSize(this), "enlargePad");
         ctrl.attr("name", "Enlarge").attr("x", 0).attr("y", 0)
             .on("click", evnt => this.clickPadButton("enlargePad", evnt));
      } else {
         ctrl = ToolbarIcons.createSVG(group, ToolbarIcons.rect, getButtonSize(this), "Toggle tool buttons");

         ctrl.attr("name", "Toggle").attr("x", 0).attr("y", 0)
             .property("buttons_state", (settings.ToolBar!=='popup'))
             .on("click", () => toggleButtonsVisibility(this, 'toggle'))
             .on("mouseenter", () => toggleButtonsVisibility(this, 'enable'))
             .on("mouseleave", () => toggleButtonsVisibility(this, 'disable'));

         for (let k = 0; k < this._buttons.length; ++k) {
            let item = this._buttons[k];

            let btn = item.btn;
            if (typeof btn == 'string') btn = ToolbarIcons[btn];
            if (!btn) btn = ToolbarIcons.circle;

            let svg = ToolbarIcons.createSVG(group, btn, getButtonSize(this),
                        item.tooltip + (iscan ? "" : (" on pad " + this.this_pad_name)) + (item.keyname ? " (keyshortcut " + item.keyname + ")" : ""));

            if (group.property('vertical'))
                svg.attr("x", y).attr("y", x);
            else
               svg.attr("x", x).attr("y", y);

            svg.attr("name", item.funcname)
               .style('display', (ctrl.property("buttons_state") ? '' : 'none'))
               .on("mouseenter", () => toggleButtonsVisibility(this, 'enterbtn'))
               .on("mouseleave", () => toggleButtonsVisibility(this, 'leavebtn'));

            if (item.keyname) svg.attr("key", item.keyname);

            svg.on("click", evnt => this.clickPadButton(item.funcname, evnt));

            x += getButtonSize(this, 1.25);
         }
      }

      group.property("nextx", x);

      this.alignButtons(group, this.getPadWidth(), this.getPadHeight());

      if (group.property('vertical'))
         ctrl.attr("y", x);
      else if (!group.property('leftside'))
         ctrl.attr("x", x);
   },

   assign(painter) {
      painter.alignButtons = this.alignButtons;
      painter.findPadButton = this.findPadButton;
      painter.removePadButtons = this.removePadButtons;
      painter.showPadButtons = this.showPadButtons;

   }
} // class PadButtonsHandler

export { TooltipHandler, addDragHandler, addMoveHandler, FrameInteractive, PadButtonsHandler };
