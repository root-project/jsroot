/**
 * @summary Painter class for THStack
 *
 * @private
 */
export class THStackPainter extends ObjectPainter {
    /** @summary draw THStack object */
    static draw(dom: any, stack: any, opt: any): Promise<any>;
    firstpainter: any;
    painters: any[];
    /** @summary Build sum of all histograms
      * @desc Build a separate list fStack containing the running sum of all histograms */
    buildStack(stack: any): boolean;
    /** @summary Returns stack min/max values */
    getMinMax(iserr: any): {
        min: number;
        max: number;
    };
    /** @summary Draw next stack histogram */
    drawNextHisto(indx: any, pad_painter: any): any;
    /** @summary Decode draw options of THStack painter */
    decodeOptions(opt: any): void;
    /** @summary Create main histogram for THStack axis drawing */
    createHistogram(stack: any): any;
    /** @summary Update thstack object */
    updateObject(obj: any): boolean;
    did_update: boolean;
    /** @summary Redraw THStack
      * @desc Do something if previous update had changed number of histograms */
    redraw(): any;
}
import { ObjectPainter } from "../base/ObjectPainter.mjs";
