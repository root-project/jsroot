import { clTPaletteAxis, isFunc } from '../core.mjs';
import { getColorPalette } from '../base/colors.mjs';
import { TGraphPainter } from './TGraphPainter.mjs';
import { HistContour } from './THistPainter.mjs';
import { TH2Painter } from './TH2Painter.mjs';

class TScatterPainter extends TGraphPainter {

   constructor(dom, obj) {
      super(dom, obj);
      this._need_2dhist = true;
   }

   /** @summary Return drawn graph object */
   getGraph() { return this.getObject()?.fGraph; }

   decodeOptions(opt) {
      this.options = { Axis: 'AXIS', original: opt || '' };
   }

  /** @summary Draw axis histogram
    * @private */
   async drawAxisHisto() {
      let histo = this.createHistogram();
      return TH2Painter.draw(this.getDom(), histo, this.options.Axis);
   }

   findPalette(force) {
      let gr = this.getGraph(),
          pal = gr?.fFunctions?.arr?.find(func => (func._typename == clTPaletteAxis));
      if (!pal && gr && force) {
      }
      return pal;
   }

   /** @summary Actual drawing of TScatter */
   async drawGraph() {
      let fpainter = this.get_main(),
          hpainter = this.getMainPainter(),
          scatter = this.getObject();
      if (!fpainter || !hpainter || !scatter) return;

      let pal = this.findPalette();
      if (pal)
         pal.$main_painter = this;

      if (!this.fPalette) {
         let pp = this.getPadPainter();
         if (isFunc(pp?.getCustomPalette))
            this.fPalette = pp.getCustomPalette();
      }
      if (!this.fPalette)
         this.fPalette = getColorPalette(this.options.Palette);

      this.fContour = new HistContour(0.5, 250);
      this.fContour.createNormal(30);
      this.fContour.configIndicies(0, 0);

      this.createG(!fpainter.pad_layer);

      // this.createAttLine({ attr: graph });
      // this.createAttFill({ attr: graph });

      let funcs = fpainter.getGrFuncs();

      for (let i = 0; i < this.bins.length; ++i) {
         let pnt = this.bins[i],
             grx = funcs.grx(pnt.x),
             gry = funcs.gry(pnt.y),
             fcol = scatter.fColor[i],
             fsz = scatter.fSize[i];

          let col = this.fContour.getPaletteColor(this.fPalette, fcol);

          this.draw_g.append('svg:circle')
                     .attr('cx', grx)
                     .attr('cy', gry)
                     .attr('r', 20)
                     .style('fill', col);
      }

      return this;
   }

   static async draw(dom, obj, opt) {
      return TGraphPainter._drawGraph(new TScatterPainter(dom, obj), opt);
   }

} // class TScatterPainter

export { TScatterPainter };
