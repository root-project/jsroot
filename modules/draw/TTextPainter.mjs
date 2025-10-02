import { clTAnnotation, clTLink, clTLatex, clTMathText, BIT, isFunc } from '../core.mjs';
import { ObjectPainter } from '../base/ObjectPainter.mjs';
import { makeTranslate, DrawOptions } from '../base/BasePainter.mjs';
import { addMoveHandler } from '../gui/utils.mjs';
import { ensureTCanvas } from '../gpad/TCanvasPainter.mjs';
import { assignContextMenu } from '../gui/menu.mjs';


class TTextPainter extends ObjectPainter {

   constructor(dom, obj, opt) {
      super(dom, obj, opt);
      const d = new DrawOptions(opt);
      this.use_frame = d.check('FRAME');
      this.use_3d = d.check('3D'); // used for annotation
   }

   async redraw() {
      const text = this.getObject(),
            pp = this.getPadPainter(),
            fp = this.getFramePainter(),
            is_url = text.fName.startsWith('http://') || text.fName.startsWith('https://');
      let pos_x = text.fX, pos_y = text.fY,
          fact = 1,
          annot = this.matchObjectType(clTAnnotation);

      this.createAttText({ attr: text });

      if (annot && fp?.mode3d && isFunc(fp?.convert3DtoPadNDC)) {
         const pos = fp.convert3DtoPadNDC(text.fX, text.fY, text.fZ);
         pos_x = pos.x;
         pos_y = pos.y;
         this.isndc = true;
         annot = '3d';
      } else if (text.TestBit(BIT(14))) {
         // NDC coordinates
         this.isndc = true;
      } else if (pp.getRootPad(true)) {
         // force pad coordinates
         // const d = new DrawOptions(this.getDrawOpt());
         // use_frame = d.check('FRAME');
      } else {
         // place in the middle
         this.isndc = true;
         pos_x = pos_y = 0.5;
         text.fTextAlign = 22;
      }

      const g = this.createG(this.use_frame ? 'frame2d' : undefined, is_url);

      g.attr('transform', null); // remove transform from interactive changes

      this.pos_x = this.axisToSvg('x', pos_x, this.isndc);
      this.pos_y = this.axisToSvg('y', pos_y, this.isndc);
      this.swap_xy = this.use_frame && fp?.swap_xy();

      if (this.swap_xy)
         [this.pos_x, this.pos_y] = [this.pos_y, this.pos_x];

      const arg = this.textatt.createArg({ x: this.pos_x, y: this.pos_y, text: text.fTitle, latex: 0 });

      if ((text._typename === clTLatex) || annot)
         arg.latex = 1;
      else if (text._typename === clTMathText) {
         arg.latex = 2;
         fact = 0.8;
      }

      if (is_url) {
         g.attr('href', text.fName);
         if (!this.isBatchMode())
            g.append('svg:title').text(`link on ${text.fName}`);
      }

      return this.startTextDrawingAsync(this.textatt.font, this.textatt.getSize(pp, fact))
               .then(() => this.drawText(arg))
               .then(() => this.finishTextDrawing())
               .then(() => {
         if (this.isBatchMode())
            return this;

         if (pp.isButton() && !pp.isEditable()) {
            g.on('click', () => this.getCanvPainter().selectActivePad(pp));
            return this;
         }

         this.pos_dx = this.pos_dy = 0;

         if (annot !== '3d')
            addMoveHandler(this, true, is_url);
         else
            fp.processRender3D = true;

         assignContextMenu(this);

         if (this.matchObjectType(clTLink))
            g.style('cursor', 'pointer').on('click', () => this.submitCanvExec('ExecuteEvent(kButton1Up, 0, 0);;'));

         return this;
      });
   }

   moveDrag(dx, dy) {
      this.pos_dx += dx;
      this.pos_dy += dy;
      makeTranslate(this.getG(), this.pos_dx, this.pos_dy);
   }

   moveEnd(not_changed) {
      if (not_changed)
         return;
      const txt = this.getObject();
      let fx = this.svgToAxis('x', this.pos_x + this.pos_dx, this.isndc),
            fy = this.svgToAxis('y', this.pos_y + this.pos_dy, this.isndc);
      if (this.swap_xy)
         [fx, fy] = [fy, fx];

      txt.fX = fx;
      txt.fY = fy;
      this.submitCanvExec(`SetX(${fx});;SetY(${fy});;`);
   }

   fillContextMenuItems(menu) {
      const text = this.getObject();
      menu.add('Change text', () => menu.input('Enter new text', text.fTitle).then(t => {
         text.fTitle = t;
         this.interactiveRedraw('pad', `exec:SetTitle("${t}")`);
      }));
   }

   handleRender3D() {
      const text = this.getObject(),
            pos = this.getFramePainter().convert3DtoPadNDC(text.fX, text.fY, text.fZ),
            new_x = this.axisToSvg('x', pos.x, true),
            new_y = this.axisToSvg('y', pos.y, true);
      makeTranslate(this.getG(), new_x - this.pos_x, new_y - this.pos_y);
   }

   /** @summary draw TText-derived object */
   static async draw(dom, obj, opt) {
      const painter = new TTextPainter(dom, obj, opt);
      return ensureTCanvas(painter, false).then(() => painter.redraw());
   }

} // class TTextPainter


export { TTextPainter };
