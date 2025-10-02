import { TTextPainter } from './TTextPainter.mjs';
import { build3dlatex } from '../hist/hist3d.mjs';
import { ensureTCanvas } from '../gpad/TCanvasPainter.mjs';

class TAnnotation3DPainter extends TTextPainter {

   async redraw() {
      const fp = this.getFramePainter();

      if (!fp?.mode3d || this.use_2d)
         return super.redraw();

      const text = this.getObject(),
            mesh = build3dlatex(text, '', this);

      mesh.traverse(o => o.geometry?.rotateX(Math.PI / 2));
      mesh.position.x = fp.grx(text.fX);
      mesh.position.y = fp.gry(text.fY);
      mesh.position.z = fp.grz(text.fZ);

      fp.add3DMesh(mesh, this, true);
      fp.render3D(100);
      return this;
   }

   /** @summary draw TAnnotation3D object */
   static async draw(dom, obj, opt) {
      const painter = new TAnnotation3DPainter(dom, obj, opt);
      painter.use_2d = (opt === '2d') || (opt === '2D');
      return ensureTCanvas(painter, painter.use_2d ? true : '3d').then(() => painter.redraw());
   }

} // class TAnnotation3DPainter


export { TAnnotation3DPainter };
