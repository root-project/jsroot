/**
 * @summary Painter class for TRatioPlot
 *
 * @private
 */
export class TRatioPlotPainter extends ObjectPainter {
    /** @summary Draw TRatioPlot */
    static draw(dom: any, ratio: any, opt: any): Promise<TRatioPlotPainter>;
    /** @summary Set grids range */
    setGridsRange(xmin: any, xmax: any): void;
    /** @summary Redraw TRatioPlot */
    redraw(): Promise<TRatioPlotPainter>;
}
import { ObjectPainter } from "../base/ObjectPainter.mjs";
