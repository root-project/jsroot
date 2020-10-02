/// @file JSRoot.interactive.js
/// Basic interactive functionality

JSROOT.require(['d3', 'JSRootPainter'], (d3) => {

   "use strict";

   let TooltipHandler = {

      /** @desc only canvas info_layer can be used while other pads can overlay
        * @returns layer where frame tooltips are shown */
      hints_layer: function() {
         let pp = this.canv_painter();
         return pp ? pp.svg_layer("info_layer") : d3.select(null);
      },

      /** @returns true if tooltip is shown, use to prevent some other action */
      IsTooltipShown: function() {
         if (!this.tooltip_enabled || !this.IsTooltipAllowed()) return false;
         let hintsg = this.hints_layer().select(".objects_hints");
         return hintsg.empty() ? false : hintsg.property("hints_pad") == this.pad_name;
      },

      SetTooltipEnabled: function(enabled) {
         if (enabled !== undefined) this.tooltip_enabled = enabled;
      },

      ProcessTooltipEvent: function(pnt, evnt) {
         // make central function which let show selected hints for the object

         if (pnt && pnt.handler) {
            // special use of interactive handler in the frame painter
            let rect = this.draw_g ? this.draw_g.select(".main_layer") : null;
            if (!rect || rect.empty()) {
               pnt = null; // disable
            } else if (pnt.touch && evnt) {
               let pos = d3.pointers(evnt, rect.node());
               pnt = (pos && pos.length == 1) ? { touch: true, x: pos[0][0], y: pos[0][1] } : null;
            } else if (evnt) {
               let pos = d3.pointer(evnt, rect.node());
               pnt = { touch: false, x: pos[0], y: pos[1] };
            }
         }

         let hints = [], nhints = 0, maxlen = 0, lastcolor1 = 0, usecolor1 = false,
            textheight = 11, hmargin = 3, wmargin = 3, hstep = 1.2,
            frame_rect = this.GetFrameRect(),
            pad_width = this.pad_width(),
            pp = this.pad_painter(),
            font = new JSROOT.FontHandler(160, textheight),
            status_func = this.GetShowStatusFunc(),
            disable_tootlips = !this.IsTooltipAllowed() || !this.tooltip_enabled;

         if ((pnt === undefined) || (disable_tootlips && !status_func)) pnt = null;
         if (pnt && disable_tootlips) pnt.disabled = true; // indicate that highlighting is not required
         if (pnt) pnt.painters = true; // get also painter

         // collect tooltips from pad painter - it has list of all drawn objects
         if (pp) hints = pp.GetTooltips(pnt);

         if (pnt && pnt.touch) textheight = 15;

         for (let n = 0; n < hints.length; ++n) {
            let hint = hints[n];
            if (!hint) continue;

            if (hint.painter && (hint.user_info !== undefined))
               if (hint.painter.ProvideUserTooltip(hint.user_info)) { };

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

            for (let l = 0; l < hint.lines.length; ++l)
               maxlen = Math.max(maxlen, hint.lines[l].length);

            hint.height = Math.round(hint.lines.length * textheight * hstep + 2 * hmargin - textheight * (hstep - 1));

            if ((hint.color1 !== undefined) && (hint.color1 !== 'none')) {
               if ((lastcolor1 !== 0) && (lastcolor1 !== hint.color1)) usecolor1 = true;
               lastcolor1 = hint.color1;
            }
         }

         let layer = this.hints_layer(),
            hintsg = layer.select(".objects_hints"); // group with all tooltips

         if (status_func) {
            let title = "", name = "", info = "",
               hint = null, best_dist2 = 1e10, best_hint = null,
               coordinates = pnt ? Math.round(pnt.x) + "," + Math.round(pnt.y) : "";
            // try to select hint with exact match of the position when several hints available
            for (let k = 0; k < (hints ? hints.length : 0); ++k) {
               if (!hints[k]) continue;
               if (!hint) hint = hints[k];
               if (hints[k].exact && (!hint || !hint.exact)) { hint = hints[k]; break; }

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

            status_func(name, title, info, coordinates);
         }

         // end of closing tooltips
         if (!pnt || disable_tootlips || (hints.length === 0) || (maxlen === 0) || (nhints > 15)) {
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
            pp.CalcAbsolutePosition(this.svg_pad(), frame_shift);
            trans = "translate(" + frame_shift.x + "," + frame_shift.y + ") " + trans;
         }

         // copy transform attributes from frame itself
         hintsg.attr("transform", trans)
            .property("last_point", pnt)
            .property("hints_pad", this.pad_name);

         let viewmode = hintsg.property('viewmode') || "",
            actualw = 0, posx = pnt.x + frame_rect.hint_delta_x;

         if (nhints > 1) {
            // if there are many hints, place them left or right

            let bleft = 0.5, bright = 0.5;

            if (viewmode == "left") bright = 0.7; else
               if (viewmode == "right") bleft = 0.3;

            if (posx <= bleft * frame_rect.width) {
               viewmode = "left";
               posx = 20;
            } else if (posx >= bright * frame_rect.width) {
               viewmode = "right";
               posx = frame_rect.width - 60;
            } else {
               posx = hintsg.property('startx');
            }
         } else {
            viewmode = "single";
            posx += 15;
         }

         if (viewmode !== hintsg.property('viewmode')) {
            hintsg.property('viewmode', viewmode);
            hintsg.selectAll("*").remove();
         }

         let curry = 10, // normal y coordinate
            gapy = 10,  // y coordinate, taking into account all gaps
            gapminx = -1111, gapmaxx = -1111,
            minhinty = -frame_shift.y,
            maxhinty = this.pad_height("") - frame_rect.y - frame_shift.y;

         function FindPosInGap(y) {
            for (let n = 0; (n < hints.length) && (y < maxhinty); ++n) {
               let hint = hints[n];
               if (!hint) continue;
               if ((hint.y >= y - 5) && (hint.y <= y + hint.height + 5)) {
                  y = hint.y + 10;
                  n = -1;
               }
            }
            return y;
         }

         for (let n = 0; n < hints.length; ++n) {
            let hint = hints[n],
               group = hintsg.select(".painter_hint_" + n);
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
               .attr("fill", "lightgrey")
               .style("pointer-events", "none");

            if (nhints > 1) {
               let col = usecolor1 ? hint.color1 : hint.color2;
               if ((col !== undefined) && (col !== 'none'))
                  r.attr("stroke", col).attr("stroke-width", hint.exact ? 3 : 1);
            }

            for (let l = 0; l < (hint.lines ? hint.lines.length : 0); l++)
               if (hint.lines[l] !== null) {
                  let txt = group.append("svg:text")
                     .attr("text-anchor", "start")
                     .attr("x", wmargin)
                     .attr("y", hmargin + l * textheight * hstep)
                     .attr("dy", ".8em")
                     .attr("fill", "black")
                     .style("pointer-events", "none")
                     .call(font.func)
                     .text(hint.lines[l]);

                  let box = this.GetBoundarySizes(txt.node());

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
               if (JSROOT.gStyle.TooltipAnimation > 0)
                  group.transition().duration(JSROOT.gStyle.TooltipAnimation).attrTween("opacity", translateFn());
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
               svgs.attr("y", function() { return d3.select(this).property('gapy'); });
         } else if ((viewmode !== 'single') && (curry > maxhinty)) {
            let shift = Math.max((maxhinty - curry - 10), minhinty);
            if (shift < 0)
               svgs.attr("y", function() { return d3.select(this).property('curry') + shift; });
         }

         if (actualw > 10)
            svgs.attr("width", actualw)
               .select('rect').attr("width", actualw);

         hintsg.property('startx', posx);
      },

      /** Assigns tooltip methods */
      assign: function(painter) {
         painter.tooltip_enabled = true;
         painter.hints_layer = this.hints_layer;
         painter.IsTooltipShown = this.IsTooltipShown;
         painter.SetTooltipEnabled = this.SetTooltipEnabled;
         painter.ProcessTooltipEvent = this.ProcessTooltipEvent;
      }

   } // TooltipHandler

   let DragMoveHandler = {
       /** @summary Add drag for interactive rectangular elements for painter */
      AddDrag: function(painter, callback) {
         if (!JSROOT.gStyle.MoveResize || JSROOT.BatchMode) return;

         let pthis = painter, drag_rect = null, pp = pthis.pad_painter();
         if (pp && pp._fast_drawing) return;

         function detectRightButton(event) {
            if ('buttons' in event) return event.buttons === 2;
            else if ('which' in event) return event.which === 3;
            else if ('button' in event) return event.button === 2;
            return false;
         }

         function rect_width() { return Number(pthis.draw_g.attr("width")); }
         function rect_height() { return Number(pthis.draw_g.attr("height")); }

         function MakeResizeElements(group, width, height, handler) {
            function make(cursor, d) {
               let clname = "js_" + cursor.replace('-', '_'),
                  elem = group.select('.' + clname);
               if (elem.empty()) elem = group.append('path').classed(clname, true);
               elem.style('opacity', 0).style('cursor', cursor).attr('d', d);
               if (handler) elem.call(handler);
            }

            make("nw-resize", "M2,2h15v-5h-20v20h5Z");
            make("ne-resize", "M" + (width - 2) + ",2h-15v-5h20v20h-5 Z");
            make("sw-resize", "M2," + (height - 2) + "h15v5h-20v-20h5Z");
            make("se-resize", "M" + (width - 2) + "," + (height - 2) + "h-15v5h20v-20h-5Z");

            if (!callback.no_change_x) {
               make("w-resize", "M-3,18h5v" + Math.max(0, height - 2 * 18) + "h-5Z");
               make("e-resize", "M" + (width + 3) + ",18h-5v" + Math.max(0, height - 2 * 18) + "h5Z");
            }
            if (!callback.no_change_y) {
               make("n-resize", "M18,-3v5h" + Math.max(0, width - 2 * 18) + "v-5Z");
               make("s-resize", "M18," + (height + 3) + "v-5h" + Math.max(0, width - 2 * 18) + "v5Z");
            }
         }

         function complete_drag() {
            drag_rect.style("cursor", "auto");

            if (!pthis.draw_g) {
               drag_rect.remove();
               drag_rect = null;
               return false;
            }

            let oldx = Number(pthis.draw_g.attr("x")),
               oldy = Number(pthis.draw_g.attr("y")),
               newx = Number(drag_rect.attr("x")),
               newy = Number(drag_rect.attr("y")),
               newwidth = Number(drag_rect.attr("width")),
               newheight = Number(drag_rect.attr("height"));

            if (callback.minwidth && newwidth < callback.minwidth) newwidth = callback.minwidth;
            if (callback.minheight && newheight < callback.minheight) newheight = callback.minheight;

            let change_size = (newwidth !== rect_width()) || (newheight !== rect_height()),
               change_pos = (newx !== oldx) || (newy !== oldy);

            pthis.draw_g.attr('x', newx).attr('y', newy)
               .attr("transform", "translate(" + newx + "," + newy + ")")
               .attr('width', newwidth).attr('height', newheight);

            drag_rect.remove();
            drag_rect = null;

            pthis.SwitchTooltip(true);

            MakeResizeElements(pthis.draw_g, newwidth, newheight);

            if (change_size || change_pos) {
               if (change_size && ('resize' in callback)) callback.resize(newwidth, newheight);
               if (change_pos && ('move' in callback)) callback.move(newx, newy, newx - oldxx, newy - oldy);

               if (change_size || change_pos) {
                  if ('obj' in callback) {
                     callback.obj.fX1NDC = newx / pthis.pad_width();
                     callback.obj.fX2NDC = (newx + newwidth) / pthis.pad_width();
                     callback.obj.fY1NDC = 1 - (newy + newheight) / pthis.pad_height();
                     callback.obj.fY2NDC = 1 - newy / pthis.pad_height();
                     callback.obj.modified_NDC = true; // indicate that NDC was interactively changed, block in updated
                  }
                  if ('redraw' in callback) callback.redraw();
               }
            }

            return change_size || change_pos;
         }

         let drag_move = d3.drag().subject(Object),
            drag_resize = d3.drag().subject(Object);

         drag_move
            .on("start", function(evnt) {
               if (detectRightButton(evnt.sourceEvent)) return;

               JSROOT.Painter.closeMenu(); // close menu

               pthis.SwitchTooltip(false); // disable tooltip

               evnt.sourceEvent.preventDefault();
               evnt.sourceEvent.stopPropagation();

               let handle = {
                  acc_x1: Number(pthis.draw_g.attr("x")),
                  acc_y1: Number(pthis.draw_g.attr("y")),
                  pad_w: pthis.pad_width() - rect_width(),
                  pad_h: pthis.pad_height() - rect_height(),
                  drag_tm: new Date()
               };

               drag_rect = d3.select(pthis.draw_g.node().parentNode).append("rect")
                  .classed("zoom", true)
                  .attr("x", handle.acc_x1)
                  .attr("y", handle.acc_y1)
                  .attr("width", rect_width())
                  .attr("height", rect_height())
                  .style("cursor", "move")
                  .style("pointer-events", "none") // let forward double click to underlying elements
                  .property('drag_handle', handle);


            }).on("drag", function(evnt) {
               if (!drag_rect) return;

               evnt.sourceEvent.preventDefault();
               evnt.sourceEvent.stopPropagation();

               let handle = drag_rect.property('drag_handle');

               if (!callback.no_change_x)
                  handle.acc_x1 += evnt.dx;
               if (!callback.no_change_y)
                  handle.acc_y1 += evnt.dy;

               drag_rect.attr("x", Math.min(Math.max(handle.acc_x1, 0), handle.pad_w))
                  .attr("y", Math.min(Math.max(handle.acc_y1, 0), handle.pad_h));

            }).on("end", function(evnt) {
               if (!drag_rect) return;

               evnt.sourceEvent.preventDefault();

               let handle = drag_rect.property('drag_handle');

               if (complete_drag() === false) {
                  let spent = (new Date()).getTime() - handle.drag_tm.getTime();
                  if (callback.ctxmenu && (spent > 600) && pthis.ShowContextMenu) {
                     let rrr = resize_se.node().getBoundingClientRect();
                     pthis.ShowContextMenu('main', { clientX: rrr.left, clientY: rrr.top });
                  } else if (callback.canselect && (spent <= 600)) {
                     pthis.canv_painter().SelectObjectPainter(pthis);
                  }
               }
            });

         drag_resize
            .on("start", function(evnt) {
               if (detectRightButton(evnt.sourceEvent)) return;

               evnt.sourceEvent.stopPropagation();
               evnt.sourceEvent.preventDefault();

               pthis.SwitchTooltip(false); // disable tooltip

               let handle = {
                  acc_x1: Number(pthis.draw_g.attr("x")),
                  acc_y1: Number(pthis.draw_g.attr("y")),
                  pad_w: pthis.pad_width(),
                  pad_h: pthis.pad_height()
               };

               handle.acc_x2 = handle.acc_x1 + rect_width();
               handle.acc_y2 = handle.acc_y1 + rect_height();

               drag_rect = d3.select(pthis.draw_g.node().parentNode)
                  .append("rect")
                  .classed("zoom", true)
                  .style("cursor", d3.select(this).style("cursor"))
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
                  dx = evnt.dx, dy = evnt.dy, elem = d3.select(this);

               if (callback.no_change_x) dx = 0;
               if (callback.no_change_y) dy = 0;

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

               drag_rect.attr("x", x1).attr("y", y1).attr("width", Math.max(0, x2 - x1)).attr("height", Math.max(0, y2 - y1));

            }).on("end", function(evnt) {
               if (!drag_rect) return;

               evnt.sourceEvent.preventDefault();

               complete_drag();
            });

         if (!callback.only_resize)
            pthis.draw_g.style("cursor", "move").call(drag_move);

         MakeResizeElements(pthis.draw_g, rect_width(), rect_height(), drag_resize);
      },

      /** @summary Add move handlers for drawn element @private */
      AddMove: function(painter) {

         if (!JSROOT.gStyle.MoveResize || JSROOT.BatchMode ||
            !painter.draw_g || painter.draw_g.property("assigned_move")) return;

         function detectRightButton(event) {
            if ('buttons' in event) return event.buttons === 2;
            else if ('which' in event) return event.which === 3;
            else if ('button' in event) return event.button === 2;
            return false;
         }

         let drag_move = d3.drag().subject(Object),
            not_changed = true;

         drag_move
            .on("start", function(evnt) {
               if (detectRightButton(evnt.sourceEvent)) return;
               evnt.sourceEvent.preventDefault();
               evnt.sourceEvent.stopPropagation();
               let pos = d3.pointer(evnt, this.draw_g.node());
               not_changed = true;
               if (this.moveStart)
                  this.moveStart(pos[0], pos[1]);
            }.bind(painter)).on("drag", function(evnt) {
               evnt.sourceEvent.preventDefault();
               evnt.sourceEvent.stopPropagation();
               not_changed = false;
               if (this.moveDrag)
                  this.moveDrag(evnt.dx, evnt.dy);
            }.bind(painter)).on("end", function(evnt) {
               evnt.sourceEvent.preventDefault();
               evnt.sourceEvent.stopPropagation();
               if (this.moveEnd)
                  this.moveEnd(not_changed);
               let cp = this.canv_painter();
               if (cp) cp.SelectObjectPainter(this);
            }.bind(painter));

         painter.draw_g
                .style("cursor", "move")
                .property("assigned_move", true)
                .call(drag_move);
      }

   } // DragMoveHandler

   let FrameInteractive = {

      AddInteractive: function() {

         let pp = this.pad_painter();
         if (pp && pp._fast_drawing) return;

         let svg = this.svg_frame();

         if (svg.empty()) return;

         let svg_x = svg.selectAll(".xaxis_container"),
             svg_y = svg.selectAll(".yaxis_container");

         if (!svg.property('interactive_set')) {
            this.AddKeysHandler();

            this.last_touch = new Date(0);
            this.zoom_kind = 0; // 0 - none, 1 - XY, 2 - only X, 3 - only Y, (+100 for touches)
            this.zoom_rect = null;
            this.zoom_origin = null;  // original point where zooming started
            this.zoom_curr = null;    // current point for zooming
            this.touch_cnt = 0;
         }

         if (JSROOT.gStyle.Zooming && !this.projection) {
            if (JSROOT.gStyle.ZoomMouse) {
               svg.on("mousedown", this.startRectSel.bind(this));
               svg.on("dblclick", this.mouseDoubleClick.bind(this));
            }
            if (JSROOT.gStyle.ZoomWheel)
               svg.on("wheel", this.mouseWheel.bind(this));
         }

         if (JSROOT.touches && ((JSROOT.gStyle.Zooming && JSROOT.gStyle.ZoomTouch && !this.projection) || JSROOT.gStyle.ContextMenu))
            svg.on("touchstart", this.startTouchZoom.bind(this));

         if (JSROOT.gStyle.ContextMenu) {
            if (JSROOT.touches) {
               svg_x.on("touchstart", this.startTouchMenu.bind(this,"x"));
               svg_y.on("touchstart", this.startTouchMenu.bind(this,"y"));
            }
            svg.on("contextmenu", this.ShowContextMenu.bind(this,""));
            svg_x.on("contextmenu", this.ShowContextMenu.bind(this,"x"));
            svg_y.on("contextmenu", this.ShowContextMenu.bind(this,"y"));
         }

         svg_x.on("mousemove", this.ShowAxisStatus.bind(this,"x"));
         svg_y.on("mousemove", this.ShowAxisStatus.bind(this,"y"));

         svg.property('interactive_set', true);
      },

      AddKeysHandler: function() {
         if (this.keys_handler || (typeof window == 'undefined')) return;

         this.keys_handler = this.ProcessKeyPress.bind(this);

         window.addEventListener('keydown', this.keys_handler, false);
      },

      ProcessKeyPress: function(evnt) {
         let main = this.select_main();
         if (!JSROOT.key_handling || main.empty()) return;

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

         let pp = this.pad_painter();
         if (JSROOT.Painter.GetActivePad() !== pp) return;

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
            if (!JSROOT.gStyle.Zooming) return false;
            // in 3dmode with orbit control ignore simple arrows
            if (this.mode3d && (key.indexOf("Ctrl")!==0)) return false;
            this.AnalyzeMouseWheelEvent(null, zoom, 0.5);
            this.Zoom(zoom.name, zoom.min, zoom.max);
            if (zoom.changed) this.zoom_changed_interactive = 2;
            evnt.stopPropagation();
            evnt.preventDefault();
         } else {
            let func = pp ? pp.FindButton(key) : "";
            if (func) {
               pp.PadButtonClick(func);
               evnt.stopPropagation();
               evnt.preventDefault();
            }
         }

         return true; // just process any key press
      },

      /** Assign frame interactive methods */
      assign: function(painter) {
         painter.AddInteractive = this.AddInteractive;
         painter.AddKeysHandler = this.AddKeysHandler;
         painter.ProcessKeyPress = this.ProcessKeyPress;
      }

   } // FrameInterative



   JSROOT.TooltipHandler = TooltipHandler;
   JSROOT.DragMoveHandler = DragMoveHandler;
   JSROOT.FrameInteractive = FrameInteractive;

})
