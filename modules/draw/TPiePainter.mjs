import { makeTranslate, DrawOptions } from '../base/BasePainter.mjs';
import { ObjectPainter } from '../base/ObjectPainter.mjs';
import { ensureTCanvas } from '../gpad/TCanvasPainter.mjs';
import { addMoveHandler } from '../gui/utils.mjs';
import { assignContextMenu } from '../gui/menu.mjs';

/**
 * @summary Painter for TBox class
 * @private
 */

class TPiePainter extends ObjectPainter {

   #is3d; // if 3d mode enabled

   /** @summary Decode options */
   decodeOptions(opt) {
      const d = new DrawOptions(opt);
      this.#is3d = d.check('3D');
   }


   /** @summary start of drag handler
     * @private */
   moveStart(x, y) {
   }

   /** @summary drag handler
     * @private */
   moveDrag(dx, dy) {
   }

   /** @summary end of drag handler
     * @private */
   moveEnd(not_changed) {
      if (not_changed)
         return;
   }

   /** @summary Update TPie object */
   updateObject(obj, opt) {
      if (!this.matchObjectType(obj))
         return false;

      this.decodeOptions(opt);

      Object.assign(this.getObject(), obj);

      return true;
   }

   /** @summary Redraw pie */
   redraw() {
      const g = this.createG(),
            pie = this.getObject(),
            nb = pie.fPieSlices.length,
            xc = this.axisToSvg('x', pie.fX),
            yc = this.axisToSvg('y', pie.fY);

      let radX = pie.fRadius, radY = pie.fRadius, radXY = 1, pixelHeight = 1;

      if (this.#is3d) {
         radXY = Math.sin(pie.fAngle3D/180.*Math.PI);
         radY *= radXY;
         pixelHeight = this.axisToSvg('y', pie.fY - pie.fHeight) - yc;
      }

      const rx = this.axisToSvg('x', pie.fX + radX) - xc,
            ry = this.axisToSvg('y', pie.fY - radY) - yc,
            dist_to_15pi = a => {
               while (a < 0.5*Math.PI)
                  a += 2*Math.PI;
               while (a >= 2.5*Math.PI)
                  a -= 2*Math.PI;
               return Math.abs(a - 1.5 * Math.PI)
            };

      makeTranslate(g, xc, yc);

      let total = 0, af = pie.fAngularOffset / 180 * Math.PI;
      for (let n = 0; n < nb; n++)
         total += pie.fPieSlices[n].fValue;

      const angles = [af], order = [], p2 = 2 * Math.PI, p15 = 1.5 * Math.PI;
      for (let n = 0; n < nb; n++) {
         const prev = af;
         af += pie.fPieSlices[n].fValue / total * p2;
         angles.push(af);
         order.push({ n, a: dist_to_15pi((prev + af)/2) });
      }

      // sort in increasing order from Pi/2 angle
      order.sort((v1,v2) => { return v1.a - v2.a; });

      for (let o = 0; o < Math.min(5, nb); o++) {
         const n = order[o].n,
               slice = pie.fPieSlices[n];

         // Draw the slices
         const a1 = angles[n], a2 = angles[n+1],
               x1 = Math.round(rx * Math.cos(a1)),
               y1 = Math.round(ry * Math.sin(a1)),
               x2 = Math.round(rx * Math.cos(a2)),
               y2 = Math.round(ry * Math.sin(a2));

         this.createAttLine({ attr: slice });
         this.createAttFill({ attr: slice });

         // paint pseudo-3d object
         if (this.#is3d) {
            // bottom
            g.append('svg:path')
             .attr('d', `M0,${pixelHeight}L${x1},${y1+pixelHeight}A${rx},${ry},0,0,1,${x2},${y2+pixelHeight}Z`)
             .call(this.lineatt.func)
             .call(this.fillatt.func);

            const add_curved_side = (aa1, aa2) => {
               if (dist_to_15pi((aa1 + aa2)/ 2) < 0.5*Math.PI)
                  return;
               const xx1 = Math.round(rx * Math.cos(aa1)),
                     yy1 = Math.round(ry * Math.sin(aa1)),
                     xx2 = Math.round(rx * Math.cos(aa2)),
                     yy2 = Math.round(ry * Math.sin(aa2));
               g.append('svg:path')
                .attr('d', `M${xx1},${yy1}A${rx},${ry},0,0,1,${xx2},${yy2}L${xx2},${yy2+pixelHeight}A${rx},${ry},0,0,0,${xx1},${yy1+pixelHeight}Z`)
                .call(this.lineatt.func)
                .call(this.fillatt.func);
            }, add_planar_side = (x,y) => {
               g.append('svg:path')
                .attr('d', `M0,${pixelHeight}L${x},${y+pixelHeight}L${x},${y}L0,0Z`)
                .call(this.lineatt.func)
                .call(this.fillatt.func);
            }

            if (dist_to_15pi(a1) > dist_to_15pi(a2)) {
               add_planar_side(x2, y2);
               add_planar_side(x1, y1);
            } else {
               add_planar_side(x1, y1);
               add_planar_side(x2, y2);
            }

            let a = a1, border = -p2;
            while (border <= a)
               border += Math.PI;

            // fill curve sides, while it can cross Pi and 2*Pi several times, add as segments
            while (a < a2) {
               if (border > a2) {
                  add_curved_side(a, a2);
                  a = a2;
               } else {
                  add_curved_side(a, border);
                  a = border;
                  border += Math.PI;
               }
            }
         }

         g.append('svg:path')
          .attr('d', `M0,0L${x1},${y1}A${rx},${ry},0,0,1,${x2},${y2}z`)
          .call(this.lineatt.func)
          .call(this.fillatt.func);
      }

      assignContextMenu(this);

      addMoveHandler(this);

      return this;
   }

   /** @summary Draw TPie object */
   static async draw(dom, obj, opt) {
      const painter = new TPiePainter(dom, obj, opt);
      painter.decodeOptions(opt);
      return ensureTCanvas(painter, false).then(() => painter.redraw());
   }

} // class TPiePainter


export { TPiePainter };
