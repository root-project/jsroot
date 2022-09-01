/**
 * @summary Painter for TMultiGraph object.
 *
 * @private
 */
export class TMultiGraphPainter extends ObjectPainter {
    /** @private */
    private static _drawMG;
    /** @summary Draw TMultiGraph object */
    static draw(dom: any, mgraph: any, opt: any): Promise<any>;
    /** @summary Create painter
      * @param {object|string} dom - DOM element for drawing or element id
      * @param {object} obj - TMultiGraph object to draw */
    constructor(dom: object | string, mgraph: any);
    firstpainter: any;
    autorange: boolean;
    painters: any[];
    /** @summary Update multigraph object */
    updateObject(obj: any): boolean;
    /** @summary Scan graphs range
      * @returns {object} histogram for axes drawing */
    scanGraphsRange(graphs: any, histo: any, pad: any): object;
    /** @summary draw speical histogram for axis
      * @returns {Promise} when ready */
    drawAxisHist(histo: any, hopt: any): Promise<any>;
    /** @summary method draws next function from the functions list  */
    drawNextFunction(indx: any): any;
    drawGraph(gr: any, opt: any): Promise<any>;
    /** @summary method draws next graph  */
    drawNextGraph(indx: any, opt: any): any;
    _pfc: boolean;
    _plc: boolean;
    _pmc: boolean;
}
import { ObjectPainter } from "../base/ObjectPainter.mjs";
