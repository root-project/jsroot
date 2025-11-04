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
   #lblor; // how to draw labels
   #sort; // sorting order of pies

   /** @summary Decode options */
   decodeOptions(opt) {
      const d = new DrawOptions(opt);
      this.#is3d = d.check('3D');
      this.#lblor = 0;
      this.#sort = 0;
      if (d.check('T'))
         this.#lblor = 2; // around
      if (d.check('R'))
         this.#lblor = 1; // along the radius
      if (d.check('>'))
         this.#sort = 1;
      if (d.check('<'))
         this.#sort = -1;
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

      const arr = [];
      let total = 0, af = -pie.fAngularOffset / 180 * Math.PI;
      for (let n = 0; n < pie.fPieSlices.length; n++) {
         const value = pie.fPieSlices[n].fValue;
         total += value;
         arr.push({n, value});
      }
      // sort in increase/decrease order
      if (this.#sort !== 0)
         arr.sort((v1,v2) => { return this.#sort*(v1.value - v2.value); });

      // now assign angles for each slice
      for (let n = 0; n < arr.length; n++) {
         const entry = arr[n];
         entry.a2 = af;
         af -= entry.value / total * 2 * Math.PI;
         entry.a1 = af;
         entry.a = dist_to_15pi((entry.a1 + entry.a2)/2);
      }

      // sort for visualization in increasing order from Pi/2 angle
      arr.sort((v1,v2) => { return v1.a - v2.a; });

      for (let o = 0; o < arr.length; o++) {
         const entry = arr[o],
               slice = pie.fPieSlices[entry.n];

         // Draw the slices
         const a1 = entry.a1, a2 = entry.a2,
               x1 = Math.round(rx * Math.cos(a1)),
               y1 = Math.round(ry * Math.sin(a1)),
               x2 = Math.round(rx * Math.cos(a2)),
               y2 = Math.round(ry * Math.sin(a2));

         this.createAttLine({ attr: slice });
         this.createAttFill({ attr: slice });

         // paint pseudo-3d object
         if (this.#is3d) {
            const add_curved_side = (aa1, aa2) => {
               if (dist_to_15pi((aa1 + aa2)/ 2) < 0.5*Math.PI)
                  return;
               const xx1 = Math.round(rx * Math.cos(aa1)),
                     yy1 = Math.round(ry * Math.sin(aa1)),
                     xx2 = Math.round(rx * Math.cos(aa2)),
                     yy2 = Math.round(ry * Math.sin(aa2));
               g.append('svg:path')
                .attr('d', `M${xx1},${yy1}a${rx},${ry},0,0,1,${xx2-xx1},${yy2-yy1}v${pixelHeight}a${rx},${ry},0,0,0,${xx1-xx2},${yy1-yy2}z`)
                .call(this.lineatt.func)
                .call(this.fillatt.func);
            }, add_planar_side = (x,y) => {
               g.append('svg:path')
                .attr('d', `M0,0v${pixelHeight}l${x},${y}v${-pixelHeight}z`)
                .call(this.lineatt.func)
                .call(this.fillatt.func);
            }, build_pie = (aa1, aa2, func) => {
               // use same segments for side and top/bottom curves
               let a = aa1, border = -6*Math.PI;
               while (border <= aa1)
                  border += Math.PI;
               while (a < aa2) {
                  if (border >= aa2) {
                     func(a, aa2);
                     a = aa2;
                  } else {
                     func(a, border);
                     a = border;
                     border += Math.PI;
                  }
               }
            };

            let pie = '';
            build_pie(a1, a2, (aa1,aa2) => {
               const xx1 = Math.round(rx * Math.cos(aa1)),
                     yy1 = Math.round(ry * Math.sin(aa1)),
                     xx2 = Math.round(rx * Math.cos(aa2)),
                     yy2 = Math.round(ry * Math.sin(aa2));
               pie += `a${rx},${ry},0,0,1,${xx2-xx1},${yy2-yy1}`;
            });

            // bottom
            g.append('svg:path')
             .attr('d', `M0,${pixelHeight}l${x1},${y1}${pie}z`)
             .call(this.lineatt.func)
             .call(this.fillatt.func);


            // planar
            if (dist_to_15pi(a1) > dist_to_15pi(a2)) {
               add_planar_side(x2, y2);
               add_planar_side(x1, y1);
            } else {
               add_planar_side(x1, y1);
               add_planar_side(x2, y2);
            }

            // curved
            build_pie(a1, a2, add_curved_side);

            // upper
            g.append('svg:path')
             .attr('d', `M0,0l${x1},${y1}${pie}z`)
             .call(this.lineatt.func)
             .call(this.fillatt.func);

         } else {
            g.append('svg:path')
             .attr('d', `M0,0l${x1},${y1}a${rx},${ry},0,0,1,${x2-x1},${y2-y1}z`)
             .call(this.lineatt.func)
             .call(this.fillatt.func);
         }
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
