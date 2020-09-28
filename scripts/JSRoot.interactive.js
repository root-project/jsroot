/// @file JSRoot.interactive.js
/// Basic interactive functionality

JSROOT.require(['d3', 'JSRootPainter'], function(d3) {

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

   JSROOT.TooltipHandler = TooltipHandler;

})
