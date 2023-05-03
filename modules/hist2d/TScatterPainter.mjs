import { TGraphPainter } from './TGraphPainter.mjs';
import { TH2Painter } from './TH2Painter.mjs';

class TScatterPainter extends TGraphPainter {

   constructor(dom, obj) {
      super(dom, obj);
   }

   /** @summary Return drawn graph object */
   getGraph() { return this.getObject()?.fGraph; }

   decodeOptions(opt) {
      this.options = { Axis: 'AXISZ', original: opt || '' };
   }

  /** @summary Draw axis histogram
    * @private */
   async drawAxisHisto() {
      let histo = this.createHistogram();
      return TH2Painter.draw(this.getDom(), histo, this.options.Axis);
   }

   /** @summary Actual drawing of TScatter */
   async drawScatter() {
      return this;
   }

   /** @summary Draw TGraph
     * @private */
   static async _drawScatter(painter, opt) {
      painter.decodeOptions(opt);
      painter.createBins();

      let promise = Promise.resolve();

      if (!painter.getMainPainter() && painter.options.Axis)
         promise = painter.drawAxisHisto().then(hist_painter => {
            if (hist_painter) {
               painter.axes_draw = true;
               if (!painter._own_histogram) painter.$primary = true;
               hist_painter.$secondary = 'hist';
            }
         });

      return promise.then(() => {
         painter.addToPadPrimitives();
         return painter.drawScatter();
      });
   }

   static async draw(dom, obj, opt) {
      return TScatterPainter._drawScatter(new TScatterPainter(dom, obj), opt);
   }

} // class TScatterPainter

export { TScatterPainter };
