import { makeTranslate } from '../base/BasePainter.mjs';
import { EAxisBits, TAxisPainter } from '../gpad/TAxisPainter.mjs';
import { ensureTCanvas } from '../gpad/TCanvasPainter.mjs';
import { addMoveHandler } from '../gui/utils.mjs';
import { assignContextMenu } from '../gui/menu.mjs';

/** @summary Drawing TGaxis
  * @private */
class TGaxisPainter extends TAxisPainter {

   /** @summary Convert TGaxis position into NDC to fix it when frame zoomed */
   convertTo(opt) {
      let gaxis = this.getObject(),
          x1 = this.axisToSvg('x', gaxis.fX1),
          y1 = this.axisToSvg('y', gaxis.fY1),
          x2 = this.axisToSvg('x', gaxis.fX2),
          y2 = this.axisToSvg('y', gaxis.fY2);

      if (opt == 'ndc') {
          let pw = this.getPadPainter().getPadWidth(),
              ph = this.getPadPainter().getPadHeight();

          gaxis.fX1 = x1 / pw;
          gaxis.fX2 = x2 / pw;
          gaxis.fY1 = (ph - y1) / ph;
          gaxis.fY2 = (ph - y2)/ ph;
          this.use_ndc = true;
      } else if (opt == 'frame') {
         let rect = this.getFramePainter().getFrameRect();
         gaxis.fX1 = (x1 - rect.x) / rect.width;
         gaxis.fX2 = (x2 - rect.x) / rect.width;
         gaxis.fY1 = (y1 - rect.y) / rect.height;
         gaxis.fY2 = (y2 - rect.y) / rect.height;
         this.bind_frame = true;
      }
   }

   /** @summary Drag moving handle */
   moveDrag(dx, dy) {
      this.gaxis_x += dx;
      this.gaxis_y += dy;
      this.getG().attr('transform', makeTranslate(this.gaxis_x, this.gaxis_y));
   }

   /** @summary Drag end handle */
   moveEnd(not_changed) {
      if (not_changed) return;

      let fx, fy, gaxis = this.getObject();
      if (this.bind_frame) {
         let rect = this.getFramePainter().getFrameRect();
         fx = (this.gaxis_x - rect.x) / rect.width;
         fy = (this.gaxis_y - rect.y) / rect.height;
      } else {
         fx = this.svgToAxis('x', this.gaxis_x, this.use_ndc);
         fy = this.svgToAxis('y', this.gaxis_y, this.use_ndc);
      }

      if (this.vertical) {
         gaxis.fX1 = gaxis.fX2 = fx;
         if (this.reverse) {
            gaxis.fY2 = fy + (gaxis.fY2 - gaxis.fY1);
            gaxis.fY1 = fy;
         } else {
            gaxis.fY1 = fy + (gaxis.fY1 - gaxis.fY2);
            gaxis.fY2 = fy;
         }
      } else {
         if (this.reverse) {
            gaxis.fX1 = fx + (gaxis.fX1 - gaxis.fX2);
            gaxis.fX2 = fx;
         } else {
            gaxis.fX2 = fx + (gaxis.fX2 - gaxis.fX1);
            gaxis.fX1 = fx;
         }
         gaxis.fY1 = gaxis.fY2 = fy;
      }

      this.submitAxisExec(`SetX1(${gaxis.fX1});;SetX2(${gaxis.fX2});;SetY1(${gaxis.fY1});;SetY2(${gaxis.fY2})`);
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
         x1 = this.axisToSvg('x', gaxis.fX1, this.use_ndc);
         y1 = this.axisToSvg('y', gaxis.fY1, this.use_ndc);
         x2 = this.axisToSvg('x', gaxis.fX2, this.use_ndc);
         y2 = this.axisToSvg('y', gaxis.fY2, this.use_ndc);
      }
      let w = x2 - x1, h = y1 - y2,
          vertical = Math.abs(w) < Math.abs(h),
          sz = vertical ? h : w,
          reverse = false,
          min = gaxis.fWmin, max = gaxis.fWmax;

      if (sz < 0) {
         reverse = true;
         sz = -sz;
         if (vertical)
            y2 = y1;
         else
            x1 = x2;
      }

      this.configureAxis(vertical ? 'yaxis' : 'xaxis', min, max, min, max, vertical, [0, sz], {
         time_scale: gaxis.fChopt.indexOf('t') >= 0,
         log: (gaxis.fChopt.indexOf('G') >= 0) ? 1 : 0,
         reverse,
         swap_side: reverse
      });

      this.createG();

      this.gaxis_x = x1;
      this.gaxis_y = y2;

      return this.drawAxis(this.getG(), Math.abs(w), Math.abs(h), makeTranslate(this.gaxis_x, this.gaxis_y) || '').then(() => {

         addMoveHandler(this);

         assignContextMenu(this);

         return this;
      });
   }


   /** @summary Fill TGaxis context */
   fillContextMenu(menu) {
      menu.addTAxisMenu(EAxisBits, this, this.getObject(), '');
   }

   /** @summary Draw TGaxis object */
   static async draw(dom, obj, opt) {
      let painter = new TGaxisPainter(dom, obj, false);

      return ensureTCanvas(painter, false).then(() => {
         if (opt) painter.convertTo(opt);
         return painter.redraw();
      });
   }

} // class TGaxisPainter

export { TGaxisPainter };
