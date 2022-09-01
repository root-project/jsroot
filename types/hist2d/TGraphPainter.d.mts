/**
 * @summary Painter for TGraph object.
 *
 * @private
 */
export class TGraphPainter extends ObjectPainter {
    /** @summary Draw TGraph
      * @private */
    private static _drawGraph;
    static draw(dom: any, graph: any, opt: any): Promise<any>;
    constructor(dom: any, graph: any);
    axes_draw: boolean;
    bins: any[];
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
    wheel_zoomy: boolean;
    is_bent: boolean;
    has_errors: any;
    /** @summary Redraw graph
      * @desc may redraw histogram which was used to draw axes
      * @returns {Promise} for ready */
    redraw(): Promise<any>;
    /** @summary Returns object if this drawing TGraphMultiErrors object */
    get_gme(): any;
    /** @summary Decode options */
    decodeOptions(opt: any, first_time: any): void;
    /** @summary Extract errors for TGraphMultiErrors */
    extractGmeErrors(nblock: any): void;
    /** @summary Create bins for TF1 drawing */
    createBins(): void;
    /** @summary Create histogram for graph
      * @desc graph bins should be created when calling this function
      * @param {object} histo - existing histogram instance
      * @param {boolean} [set_x] - set X axis range
      * @param {boolean} [set_y] - set Y axis range */
    createHistogram(histo: object, set_x?: boolean, set_y?: boolean): any;
    _own_histogram: boolean;
    /** @summary Check if user range can be unzommed
      * @desc Used when graph points covers larger range than provided histogram */
    unzoomUserRange(dox: any, doy: any): boolean;
    /** @summary Returns true if graph drawing can be optimize */
    canOptimize(): boolean;
    /** @summary Returns optimized bins - if optimization enabled */
    optimizeBins(maxpnt: any, filter_func: any): any[];
    /** @summary Returns tooltip for specified bin */
    getTooltips(d: any): string[];
    /** @summary Provide frame painter for graph
      * @desc If not exists, emulate its behaviour */
    get_main(): any;
    /** @summary append exclusion area to created path */
    appendExclusion(is_curve: any, path: any, drawbins: any, excl_width: any): void;
    /** @summary draw TGraph bins with specified options
      * @desc Can be called several times */
    drawBins(funcs: any, options: any, draw_g: any, w: any, h: any, lineatt: any, fillatt: any, main_block: any): void;
    draw_kind: string;
    error_size: any;
    marker_size: any;
    /** @summary append TGraphQQ part */
    appendQQ(funcs: any, graph: any): void;
    drawBins3D(): void;
    /** @summary draw TGraph */
    drawGraph(): void;
    /** @summary Provide tooltip at specified point */
    extractTooltip(pnt: any): {
        name: any;
        title: any;
        x: any;
        y: any;
        color1: any;
        lines: string[];
        usepath: boolean;
    } | {
        name: any;
        title: any;
        x: any;
        y: any;
        color1: any;
        lines: string[];
        rect: any;
        d3bin: any;
    };
    /** @summary Show tooltip */
    showTooltip(hint: any): void;
    /** @summary Process tooltip event */
    processTooltipEvent(pnt: any): {
        name: any;
        title: any;
        x: any;
        y: any;
        color1: any;
        lines: string[];
        usepath: boolean;
    } | {
        name: any;
        title: any;
        x: any;
        y: any;
        color1: any;
        lines: string[];
        rect: any;
        d3bin: any;
    };
    /** @summary Find best bin index for specified point */
    findBestBin(pnt: any): {
        bin: any;
        indx: number;
        dist: number;
        radius: number;
    };
    /** @summary Check editable flag for TGraph
      * @desc if arg specified changes or toggles editable flag */
    testEditable(arg: any): boolean;
    /** @summary Provide tooltip at specified point for path-based drawing */
    extractTooltipForPath(pnt: any): {
        name: any;
        title: any;
        x: any;
        y: any;
        color1: any;
        lines: string[];
        usepath: boolean;
    };
    /** @summary Show tooltip for path drawing */
    showTooltipForPath(hint: any): void;
    /** @summary Check if graph moving is enabled */
    moveEnabled(): boolean;
    /** @summary Start moving of TGraph */
    moveStart(x: any, y: any): void;
    pos_dx: number;
    pos_dy: number;
    move_binindx: any;
    move_bin: any;
    move_x0: any;
    move_y0: any;
    /** @summary Perform moving */
    moveDrag(dx: any, dy: any): void;
    /** @summary Complete moving */
    moveEnd(not_changed: any): void;
    /** @summary Execute menu command
      * @private */
    private executeMenuCommand;
    /** @summary Update TGraph object */
    updateObject(obj: any, opt: any): boolean;
    $redraw_hist: boolean;
    /** @summary Checks if it makes sense to zoom inside specified axis range
      * @desc allow to zoom TGraph only when at least one point in the range */
    canZoomInside(axis: any, min: any, max: any): boolean;
    /** @summary Process click on graph-defined buttons */
    clickButton(funcname: any): boolean;
    /** @summary Find TF1/TF2 in TGraph list of functions */
    findFunc(): any;
    /** @summary Find stat box in TGraph list of functions */
    findStat(): any;
    /** @summary Create stat box */
    createStat(): any;
    create_stats: boolean;
    /** @summary Fill statistic */
    fillStatistic(stat: any, dostat: any, dofit: any): boolean;
    /** @summary method draws next function from the functions list
      * @returns {Promise} */
    drawNextFunction(indx: any): Promise<any>;
    /** @summary Draw axis histogram
      * @private */
    private drawAxisHisto;
}
import { ObjectPainter } from "../base/ObjectPainter.mjs";
