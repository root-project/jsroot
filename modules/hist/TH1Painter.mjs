/// 3D TH1 drawing

import { settings } from '../core.mjs';

import { assignFrame3DMethods, drawBinsLego } from './draw3d.mjs';

import { ensureTCanvas } from '../gpad/TCanvasPainter.mjs';

import { TH1Painter as TH1Painter2D  } from '../hist2d/TH1Painter.mjs';

/** @summary Draw 1-D histogram in 3D
  * @private */
class TH1Painter extends TH1Painter2D {

   async draw3D(reason) {

      this.mode3d = true;

      let main = this.getFramePainter(), // who makes axis drawing
          is_main = this.isMainPainter(), // is main histogram
          histo = this.getHisto();

      if (reason == "resize")  {

         if (is_main && main.resize3D()) main.render3D();

      } else {

         this.deleteAttr();

         this.scanContent(true); // may be required for axis drawings

         if (is_main) {
            assignFrame3DMethods(main);
            await main.create3DScene(this.options.Render3D, this.options.x3dscale, this.options.y3dscale);
            main.setAxesRanges(histo.fXaxis, this.xmin, this.xmax, histo.fYaxis, this.ymin, this.ymax, histo.fZaxis, 0, 0);
            main.set3DOptions(this.options);
            main.drawXYZ(main.toplevel, { use_y_for_z: true, zmult: 1.1, zoom: settings.Zooming, ndim: 1, draw: this.options.Axis !== -1 });
         }

         if (main.mode3d) {
            drawBinsLego(this);
            main.render3D();
            this.updateStatWebCanvas();
            main.addKeysHandler();
         }
      }

      if (is_main) {
         // (re)draw palette by resize while canvas may change dimension
         await this.drawColorPalette(this.options.Zscale && ((this.options.Lego===12) || (this.options.Lego===14)));
         await this.drawHistTitle();
      }

      return this;
   }

   /** @summary draw TH1 object */
   static async draw(dom, histo, opt) {
      let painter = new TH1Painter(dom, histo);

      await ensureTCanvas(painter);
      painter.setAsMainPainter();

      painter.decodeOptions(opt);

      painter.checkPadRange(!painter.options.Mode3D);

      painter.scanContent();

      painter.createStat();

      await painter.callDrawFunc();

      await painter.drawNextFunction(0);

      if (!painter.options.Mode3D && painter.options.AutoZoom)
         painter.autoZoom();
      painter.fillToolbar();

      return painter;
   }

} // class TH1Painter

export { TH1Painter };
