import { settings, gStyle, kNoZoom } from '../core.mjs';
import { RH2Painter as RH2Painter2D } from '../hist2d/RH2Painter.mjs';
import { RAxisPainter } from '../gpad/RAxisPainter.mjs';
import { assignFrame3DMethods, drawBinsLego, drawBinsError3D, drawBinsContour3D, drawBinsSurf3D } from './hist3d.mjs';


class RH2Painter extends RH2Painter2D {

   /** Draw histogram bins in 3D, using provided draw options */
   draw3DBins() {
      if (!this.draw_content) return;

      if (this.options.Surf)
         return drawBinsSurf3D(this, true);

      if (this.options.Error)
         return drawBinsError3D(this, true);

      if (this.options.Contour)
         return drawBinsContour3D(this, true, true);

      drawBinsLego(this, true);
      this.updatePaletteDraw();
   }

   draw3D(reason) {
      this.mode3d = true;

      const fp = this.getFramePainter(), // who makes axis drawing
            is_main = this.isMainPainter(); // is main histogram
      let pr = Promise.resolve(this);

      if (reason === 'resize') {
         if (is_main && fp.resize3D())
            fp.render3D();
         return pr;
      }

      let zmult = 1 + 2*gStyle.fHistTopMargin;

      this.zmin = fp.logz ? this.gminposbin * 0.3 : this.gminbin;
      this.zmax = this.gmaxbin;
      if (this.options.minimum !== kNoZoom) this.zmin = this.options.minimum;
      if (this.options.maximum !== kNoZoom) { this.zmax = this.options.maximum; zmult = 1; }
      if (fp.logz && (this.zmin <= 0)) this.zmin = this.zmax * 1e-5;

      this.deleteAttr();

      if (is_main) {
         assignFrame3DMethods(fp);
         pr = fp.create3DScene(this.options.Render3D).then(() => {
            fp.setAxesRanges(this.getAxis('x'), this.xmin, this.xmax, this.getAxis('y'), this.ymin, this.ymax, null, this.zmin, this.zmax);
            fp.set3DOptions(this.options);
            fp.drawXYZ(fp.toplevel, RAxisPainter, { zmult, zoom: settings.Zooming, ndim: 2, draw: true, v7: true });
         });
      }

      if (!fp.mode3d)
         return pr;

      return pr.then(() => this.drawingBins(reason)).then(() => {
         // called when bins received from server, must be reentrant

         this.draw3DBins();
         fp.render3D();
         fp.addKeysHandler();

         return this;
      });
   }

      /** @summary draw RH2 object */
   static async draw(dom, obj, opt) {
      // create painter and add it to canvas
      return RH2Painter._draw(new RH2Painter(dom, obj), opt);
   }

} // class RH2Painter

export { RH2Painter };
