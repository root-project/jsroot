import { TTextPainter } from './TTextPainter.mjs';
import { build3dlatex } from '../hist/hist3d.mjs';

class TAnnotation3DPainter extends TTextPainter {

   async redraw() {
      const fp = this.getFramePainter();

      if (!fp?.mode3d || this.use_2d)
         return super.redraw();

      const text = this.getObject(),
            mesh = build3dlatex(text);

      console.log('align', text.fTextAlign);

      mesh.traverse(o => o.geometry?.rotateX(Math.PI / 2));
      mesh.position.x = fp.grx(text.fX);
      mesh.position.y = fp.gry(text.fY);
      mesh.position.z = fp.grz(text.fZ);

      console.log('text coordinates', text.fX, text.fY, text.fZ, text.fTitle)

      fp.add3DMesh(mesh);
      return this;
   }

   /** @summary draw TAnnotation3D object */
   static async draw(dom, obj, opt) {
      const painter = new TAnnotation3DPainter(dom, obj, opt);
      painter.use_2d = (opt === '2d') || (opt === '2D');
      return painter.redraw();
   }

} // class TAnnotation3DPainter


export { TAnnotation3DPainter };
