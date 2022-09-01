/**
 * @summary Painter for TEfficiency object
 *
 * @private
 */
export class TEfficiencyPainter extends ObjectPainter {
    /** @summary Draw TEfficiency object */
    static draw(dom: any, eff: any, opt: any): Promise<any>;
    /** @summary Caluclate efficiency */
    getEfficiency(obj: any, bin: any): number;
    /** @summary Caluclate efficiency error low */
    getEfficiencyErrorLow(obj: any, bin: any, value: any): number;
    /** @summary Caluclate efficiency error low up */
    getEfficiencyErrorUp(obj: any, bin: any, value: any): number;
    /** @summary Copy drawning attributes */
    copyAttributes(obj: any, eff: any): void;
    /** @summary Create graph for the drawing of 1-dim TEfficiency */
    createGraph(): any;
    /** @summary Create histogram for the drawing of 2-dim TEfficiency */
    createHisto(eff: any): any;
    /** @summary Fill graph with points from efficiency object */
    fillGraph(gr: any, opt: any): void;
    /** @summary Fill graph with points from efficiency object */
    fillHisto(hist: any): void;
    /** @summary Draw function */
    drawFunction(indx: any): any;
}
import { ObjectPainter } from "../base/ObjectPainter.mjs";
