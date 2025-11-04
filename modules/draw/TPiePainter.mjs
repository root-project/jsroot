import { makeTranslate } from '../base/BasePainter.mjs';
import { ObjectPainter } from '../base/ObjectPainter.mjs';
import { ensureTCanvas } from '../gpad/TCanvasPainter.mjs';
import { addMoveHandler } from '../gui/utils.mjs';
import { assignContextMenu } from '../gui/menu.mjs';

/**
 * @summary Painter for TBox class
 * @private
 */

class TPiePainter extends ObjectPainter {

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

   /** @summary Redraw pie */
   redraw() {
      const g = this.createG(),
            pie = this.getObject(),
            nb = pie.fPieSlices.length,
            xc = this.axisToSvg('x', pie.fX),
            yc = this.axisToSvg('y', pie.fY),
            rx = this.axisToSvg('x', pie.fX + pie.fRadius) - xc,
            ry = this.axisToSvg('y', pie.fY + pie.fRadius) - yc;

      makeTranslate(g, xc, yc);

      // Draw the slices
      let total = 0,
          af = (pie.fAngularOffset * Math.PI) / 180,
          x1 = Math.round(rx * Math.cos(af)),
          y1 = Math.round(ry * Math.sin(af));

      for (let n = 0; n < nb; n++)
         total += pie.fPieSlices[n].fValue;

      for (let n = 0; n < nb; n++) {
         const slice = pie.fPieSlices[n];

         this.createAttLine({ attr: slice });
         this.createAttFill({ attr: slice });

         af += slice.fValue / total * 2 * Math.PI;
         const x2 = Math.round(rx * Math.cos(af)),
               y2 = Math.round(ry * Math.sin(af));

         g.append('svg:path')
          .attr('d', `M0,0L${x1},${y1}A${rx},${ry},0,0,0,${x2},${y2}z`)
          .call(this.lineatt.func)
          .call(this.fillatt.func);
         x1 = x2;
         y1 = y2;
      }

      assignContextMenu(this);

      addMoveHandler(this);

      return this;
   }

   /** @summary Draw TPie object */
   static async draw(dom, obj, opt) {
      const painter = new TPiePainter(dom, obj, opt);
      return ensureTCanvas(painter, false).then(() => painter.redraw());
   }

} // class TPiePainter


export { TPiePainter };
