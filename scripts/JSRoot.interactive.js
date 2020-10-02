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

      startRectSel: function(evnt) {
         // ignore when touch selection is activated

         if (this.zoom_kind > 100) return;

         // ignore all events from non-left button
         if ((evnt.which || evnt.button) !== 1) return;

         evnt.preventDefault();

         let frame = this.svg_frame();

         let pos = d3.pointer(evnt, frame.node());

         this.clearInteractiveElements();
         this.zoom_origin = pos;

         let w = this.frame_width(), h = this.frame_height();

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

         frame.on("mousemove.zoomRect", this.moveRectSel.bind(this))
              .on("mouseup.zoomRect", this.endRectSel.bind(this), true);

         this.zoom_rect = null;

         // disable tooltips in frame painter
         this.SwitchTooltip(false);

         evnt.stopPropagation();
      },

      moveRectSel: function(evnt) {

         if ((this.zoom_kind == 0) || (this.zoom_kind > 100)) return;

         evnt.preventDefault();
         let m = d3.pointer(evnt);

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
      },

      endRectSel: function(evnt) {
         if ((this.zoom_kind == 0) || (this.zoom_kind > 100)) return;

         evnt.preventDefault();

         this.svg_frame().on("mousemove.zoomRect", null)
                         .on("mouseup.zoomRect", null);

         let m = d3.pointer(evnt), changed = [true, true];
         m[0] = Math.max(0, Math.min(this.frame_width(), m[0]));
         m[1] = Math.max(0, Math.min(this.frame_height(), m[1]));

         switch (this.zoom_kind) {
            case 1: this.zoom_curr[0] = m[0]; this.zoom_curr[1] = m[1]; break;
            case 2: this.zoom_curr[0] = m[0]; changed[1] = false; break; // only X
            case 3: this.zoom_curr[1] = m[1]; changed[0] = false; break; // only Y
         }

         let xmin, xmax, ymin, ymax, isany = false,
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

         let kind = this.zoom_kind, pnt = (kind===1) ? { x: this.zoom_origin[0], y: this.zoom_origin[1] } : null;

         this.clearInteractiveElements();

         if (isany) {
            this.zoom_changed_interactive = 2;
            this.Zoom(xmin, xmax, ymin, ymax);
         } else {
            switch (kind) {
               case 1:
                  this.ProcessFrameClick(pnt);
                  break;
               case 2: {
                  let pp = this.pad_painter();
                  if (pp) pp.SelectObjectPainter(this.x_handle);
                  break;
               }
               case 3: {
                  let pp = this.pad_painter();
                  if (pp) pp.SelectObjectPainter(this.y_handle);
                  break;
               }
            }
         }

         this.zoom_kind = 0;
      },

      mouseDoubleClick: function(evnt) {
         evnt.preventDefault();
         let m = d3.pointer(evnt, this.svg_frame().node());
         this.clearInteractiveElements();

         let valid_x = (m[0] >= 0) && (m[0] <= this.frame_width()),
             valid_y = (m[1] >= 0) && (m[1] <= this.frame_height());

         if (valid_x && valid_y && this._dblclick_handler)
            if (this.ProcessFrameClick({ x: m[0], y: m[1] }, true)) return;

         let kind = "xyz";
         if (!valid_x) kind = this.swap_xy ? "x" : "y"; else
         if (!valid_y) kind = this.swap_xy ? "y" : "x";
         if (this.Unzoom(kind)) return;

         let pp = this.pad_painter();
         if (pp) pp.SelectObjectPainter(pp, { x: m[0]+this.frame_x(), y: m[1]+this.frame_y(), dbl: true });
      },

      startTouchZoom: function(evnt) {
         // in case when zooming was started, block any other kind of events
         if (this.zoom_kind != 0) {
            evnt.preventDefault();
            evnt.stopPropagation();
            return;
         }

         let arr = d3.pointers(evnt, this.svg_frame().node());
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
               this.Unzoom("xyz");

               this.last_touch = new Date(0);

               this.svg_frame().on("touchcancel", null)
                               .on("touchend", null, true);
            } else if (JSROOT.gStyle.ContextMenu) {
               this.zoom_curr = arr[0];
               this.svg_frame().on("touchcancel", this.endTouchSel.bind(this))
                               .on("touchend", this.endTouchSel.bind(this));
               evnt.preventDefault();
               evnt.stopPropagation();
            }
         }

         if ((arr.length != 2) || !JSROOT.gStyle.Zooming || !JSROOT.gStyle.ZoomTouch) return;

         evnt.preventDefault();
         evnt.stopPropagation();

         this.clearInteractiveElements();

         this.svg_frame().on("touchcancel", null)
                         .on("touchend", null);

         let pnt1 = arr[0], pnt2 = arr[1], w = this.frame_width(), h = this.frame_height();

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
      },

      moveTouchSel: function(evnt) {
         if (this.zoom_kind < 100) return;

         evnt.preventDefault();

         let arr = d3.pointers(evnt, this.svg_frame().node());

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
            this.SwitchTooltip(false);

         evnt.stopPropagation();
      },

      endTouchSel: function(evnt) {

         this.svg_frame().on("touchcancel", null)
                         .on("touchend", null);

         if (this.zoom_kind === 0) {
            // special case - single touch can ends up with context menu

            evnt.preventDefault();

            let now = new Date();

            let diff = now.getTime() - this.last_touch.getTime();

            if ((diff > 500) && (diff < 2000) && !this.IsTooltipShown()) {
               this.ShowContextMenu('main', { clientX: this.zoom_curr[0], clientY: this.zoom_curr[1] });
               this.last_touch = new Date(0);
            } else {
               this.clearInteractiveElements();
            }
         }

         if (this.zoom_kind < 100) return;

         evnt.preventDefault();
         d3.select(window).on("touchmove.zoomRect", null)
                          .on("touchend.zoomRect", null)
                          .on("touchcancel.zoomRect", null);

         let xmin, xmax, ymin, ymax, isany = false,
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

         evnt.stopPropagation();
      },

       /** Analyze zooming with mouse wheel */
      AnalyzeMouseWheelEvent: function(event, item, dmin, ignore) {

         item.min = item.max = undefined;
         item.changed = false;
         if (ignore && item.ignore) return;

         let delta = 0, delta_left = 1, delta_right = 1;

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

         let lmin = item.min = this["scale_"+item.name+"min"],
             lmax = item.max = this["scale_"+item.name+"max"],
             gmin = this[item.name+"min"],
             gmax = this[item.name+"max"];

         if ((item.min === item.max) && (delta<0)) {
            item.min = gmin;
            item.max = gmax;
         }

         if (item.min >= item.max) return;

         if (item.reverse) dmin = 1 - dmin;

         if ((dmin>0) && (dmin<1)) {
            if (this['log'+item.name]) {
               let factor = (item.min>0) ? Math.log10(item.max/item.min) : 2;
               if (factor>10) factor = 10; else if (factor<0.01) factor = 0.01;
               item.min = item.min / Math.pow(10, factor*delta_left*dmin);
               item.max = item.max * Math.pow(10, factor*delta_right*(1-dmin));
            } else {
               let rx_left = (item.max - item.min), rx_right = rx_left;
               if (delta_left>0) rx_left = 1.001 * rx_left / (1-delta_left);
               item.min += -delta_left*dmin*rx_left;

               if (delta_right>0) rx_right = 1.001 * rx_right / (1-delta_right);

               item.max -= -delta_right*(1-dmin)*rx_right;
            }
            if (item.min >= item.max)
               item.min = item.max = undefined;
            else if (delta_left !== delta_right) {
               // extra check case when moving left or right
               if (((item.min < gmin) && (lmin===gmin)) ||
                   ((item.max > gmax) && (lmax==gmax)))
                      item.min = item.max = undefined;
            }

         } else {
            item.min = item.max = undefined;
         }

         item.changed = ((item.min !== undefined) && (item.max !== undefined));
      },

      AllowDefaultYZooming: function() {
         // return true if default Y zooming should be enabled
         // it is typically for 2-Dim histograms or
         // when histogram not draw, defined by other painters

         let pad_painter = this.pad_painter();
         if (pad_painter && pad_painter.painters)
            for (let k = 0; k < pad_painter.painters.length; ++k) {
               let subpainter = pad_painter.painters[k];
               if (subpainter && (subpainter.wheel_zoomy !== undefined))
                  return subpainter.wheel_zoomy;
            }

         return false;
      },

      mouseWheel: function(evnt) {
         evnt.stopPropagation();

         evnt.preventDefault();
         this.clearInteractiveElements();

         let itemx = { name: "x", reverse: this.reverse_x, ignore: false },
             itemy = { name: "y", reverse: this.reverse_y, ignore: !this.AllowDefaultYZooming() },
             cur = d3.pointer(evnt, this.svg_frame().node()),
             w = this.frame_width(), h = this.frame_height();

         this.AnalyzeMouseWheelEvent(evnt, this.swap_xy ? itemy : itemx, cur[0] / w, (cur[1] >=0) && (cur[1] <= h));

         this.AnalyzeMouseWheelEvent(evnt, this.swap_xy ? itemx : itemy, 1 - cur[1] / h, (cur[0] >= 0) && (cur[0] <= w));

         this.Zoom(itemx.min, itemx.max, itemy.min, itemy.max);

         if (itemx.changed || itemy.changed) this.zoom_changed_interactive = 2;
      },

      /** Assign frame interactive methods */
      assign: function(painter) {
         painter.AddInteractive = this.AddInteractive;
         painter.AddKeysHandler = this.AddKeysHandler;
         painter.ProcessKeyPress = this.ProcessKeyPress;
         painter.startRectSel = this.startRectSel;
         painter.moveRectSel = this.moveRectSel;
         painter.endRectSel = this.endRectSel;
         painter.mouseDoubleClick = this.mouseDoubleClick;
         painter.startTouchZoom = this.startTouchZoom;
         painter.moveTouchSel = this.moveTouchSel;
         painter.endTouchSel = this.endTouchSel;
         painter.AnalyzeMouseWheelEvent = this.AnalyzeMouseWheelEvent;
         painter.AllowDefaultYZooming = this.AllowDefaultYZooming;
         painter.mouseWheel = this.mouseWheel;
      }

   } // FrameInterative



   JSROOT.TooltipHandler = TooltipHandler;
   JSROOT.DragMoveHandler = DragMoveHandler;
   JSROOT.FrameInteractive = FrameInteractive;

})
