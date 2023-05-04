import { TGraphPainter } from './TGraphPainter.mjs';
import { TH2Painter } from './TH2Painter.mjs';

class TScatterPainter extends TGraphPainter {

   constructor(dom, obj) {
      super(dom, obj);
      this._need_2dhist = true;
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

   drawNextFunction() { return this; }

   /** @summary Actual drawing of TScatter */
   async drawGraph() {
      let fpainter = this.get_main(),
          hpainter = this.getMainPainter(),
          scatter = this.getObject();
      if (!fpainter || !hpainter || !scatter) return;

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

          let col = hpainter.fContour.getPaletteColor(hpainter.fPalette, fcol);

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
