/**
 * @summary Painter for TSpline objects.
 *
 * @private
 */
export class TSplinePainter extends ObjectPainter {
    /** @summary Draw TSpline */
    static draw(dom: any, spline: any, opt: any): Promise<TSplinePainter>;
    /** @summary Update TSpline object
      * @private */
    private updateObject;
    /** @summary Evaluate spline at given position
      * @private */
    private eval;
    /** @summary Find idex for x value
      * @private */
    private findX;
    /** @summary Create histogram for axes drawing
      * @private */
    private createDummyHisto;
    /** @summary Process tooltip event
      * @private */
    private processTooltipEvent;
    knot_size: any;
    /** @summary Checks if it makes sense to zoom inside specified axis range */
    canZoomInside(axis: any): boolean;
    /** @summary Decode options for TSpline drawing */
    decodeOptions(opt: any): void;
}
import { ObjectPainter } from "../base/ObjectPainter.mjs";
