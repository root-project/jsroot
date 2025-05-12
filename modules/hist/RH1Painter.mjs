import { settings, gStyle } from '../core.mjs';
import { RH1Painter as RH1Painter2D } from '../hist2d/RH1Painter.mjs';
import { RAxisPainter } from '../gpad/RAxisPainter.mjs';
import { assignFrame3DMethods, drawBinsLego } from './hist3d.mjs';


class RH1Painter extends RH1Painter2D {

   /** @summary Draw 1-D histogram in 3D mode */
   draw3D(reason) {
      this.mode3d = true;

      const fp = this.getFramePainter(), // who makes axis drawing
            is_main = this.isMainPainter(), // is main histogram
            zmult = 1 + 2*gStyle.fHistTopMargin;
      let pr = Promise.resolve(this);

      if (reason === 'resize') {
         if (is_main && fp.resize3D())
            fp.render3D();
         return pr;
      }

      this.deleteAttr();

      this.scanContent(true); // may be required for axis drawings

      if (is_main) {
         assignFrame3DMethods(fp);
         pr = fp.create3DScene(this.options.Render3D).then(() => {
            fp.setAxesRanges(this.getAxis('x'), this.xmin, this.xmax, null, this.ymin, this.ymax, null, 0, 0);
            fp.set3DOptions(this.options);
            fp.drawXYZ(fp.toplevel, RAxisPainter, { use_y_for_z: true, zmult, zoom: settings.Zooming, ndim: 1, draw: true, v7: true });
         });
      }

      if (!fp.mode3d)
         return pr;

      return pr.then(() => this.drawingBins(reason)).then(() => {
         // called when bins received from server, must be reentrant

         drawBinsLego(this, true);
         this.updatePaletteDraw();
         fp.render3D();
         fp.addKeysHandler();
         return this;
      });
   }

      /** @summary draw RH1 object */
   static async draw(dom, histo, opt) {
      return RH1Painter._draw(new RH1Painter(dom, histo), opt);
   }

} // class RH1Painter

export { RH1Painter };
