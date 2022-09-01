/**
 * @summary Painter for TGraph2D classes
 * @private
 */
export class TGraph2DPainter extends ObjectPainter {
    /** @summary draw TGraph2D object */
    static draw(dom: any, gr: any, opt: any): Promise<any>;
    /** @summary Decode options string  */
    decodeOptions(opt: any, gr: any): void;
    /** @summary Create histogram for axes drawing */
    createHistogram(): any;
    /** @summary Function handles tooltips in the mesh */
    graph2DTooltip(intersect: any): {
        x1: number;
        x2: any;
        y1: number;
        y2: any;
        z1: number;
        z2: any;
        color: any;
        lines: any[];
    };
    /** @summary Actual drawing of TGraph2D object
      * @returns {Promise} for drawing ready */
    redraw(): Promise<any>;
}
import { ObjectPainter } from "../base/ObjectPainter.mjs";
