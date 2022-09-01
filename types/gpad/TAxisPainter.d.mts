export namespace EAxisBits {
    const kDecimals: number;
    const kTickPlus: number;
    const kTickMinus: number;
    const kAxisRange: number;
    const kCenterTitle: number;
    const kCenterLabels: number;
    const kRotateTitle: number;
    const kPalette: number;
    const kNoExponent: number;
    const kLabelsHori: number;
    const kLabelsVert: number;
    const kLabelsDown: number;
    const kLabelsUp: number;
    const kIsInteger: number;
    const kMoreLogLabels: number;
    const kOppositeTitle: number;
}
/** @summary Tries to choose time format for provided time interval
  * @private */
export function chooseTimeFormat(awidth: any, ticks: any): "%S.%L" | "%H:%M:%S.%L" | "%Mm%S" | "%H:%M:%S" | "%Hh%M" | "%d/%m %H:%M" | "%d-%Hh" | "%d/%m/%y %Hh" | "%d/%m" | "%d/%m/%y" | "%m/%y" | "%Y";
export namespace AxisPainterMethods {
    function initAxisPainter(): void;
    function initAxisPainter(): void;
    /** @summary Cleanup axis painter */
    function cleanupAxisPainter(): void;
    /** @summary Cleanup axis painter */
    function cleanupAxisPainter(): void;
    /** @summary Assign often used members of frame painter */
    function assignFrameMembers(fp: any, axis: any): void;
    /** @summary Assign often used members of frame painter */
    function assignFrameMembers(fp: any, axis: any): void;
    /** @summary Convert axis value into the Date object */
    function convertDate(v: any): Date;
    /** @summary Convert axis value into the Date object */
    function convertDate(v: any): Date;
    /** @summary Convert graphical point back into axis value */
    function revertPoint(pnt: any): any;
    /** @summary Convert graphical point back into axis value */
    function revertPoint(pnt: any): any;
    /** @summary Provide label for time axis */
    function formatTime(d: any, asticks: any): any;
    /** @summary Provide label for time axis */
    function formatTime(d: any, asticks: any): any;
    /** @summary Provide label for log axis */
    function formatLog(d: any, asticks: any, fmt: any): string | any[];
    /** @summary Provide label for log axis */
    function formatLog(d: any, asticks: any, fmt: any): string | any[];
    /** @summary Provide label for normal axis */
    function formatNormal(d: any, asticks: any, fmt: any): string | any[];
    /** @summary Provide label for normal axis */
    function formatNormal(d: any, asticks: any, fmt: any): string | any[];
    /** @summary Provide label for exponential form */
    function formatExp(base: any, order: any, value: any): string;
    /** @summary Provide label for exponential form */
    function formatExp(base: any, order: any, value: any): string;
    /** @summary Convert "raw" axis value into text */
    function axisAsText(value: any, fmt: any): any;
    /** @summary Convert "raw" axis value into text */
    function axisAsText(value: any, fmt: any): any;
    /** @summary Produce ticks for d3.scaleLog
      * @desc Fixing following problem, described [here]{@link https://stackoverflow.com/questions/64649793} */
    function poduceLogTicks(func: any, number: any): any;
    /** @summary Produce ticks for d3.scaleLog
      * @desc Fixing following problem, described [here]{@link https://stackoverflow.com/questions/64649793} */
    function poduceLogTicks(func: any, number: any): any;
    /** @summary Produce axis ticks */
    function produceTicks(ndiv: any, ndiv2: any): any;
    /** @summary Produce axis ticks */
    function produceTicks(ndiv: any, ndiv2: any): any;
    /** @summary Method analyze mouse wheel event and returns item with suggested zooming range */
    function analyzeWheelEvent(evnt: any, dmin: any, item: any, test_ignore: any): any;
    /** @summary Method analyze mouse wheel event and returns item with suggested zooming range */
    function analyzeWheelEvent(evnt: any, dmin: any, item: any, test_ignore: any): any;
}
/**
 * @summary Painter for TAxis/TGaxis objects
 *
 * @private
 */
export class TAxisPainter extends ObjectPainter {
    /** @summary constructor
      * @param {object|string} dom - identifier or dom element
      * @param {object} axis - object to draw
      * @param {boolean} embedded - if true, painter used in other objects painters */
    constructor(dom: object | string, axis: object, embedded: boolean);
    embedded: boolean;
    invert_side: boolean;
    lbls_both_sides: boolean;
    /** @summary Use in GED to identify kind of axis */
    getAxisType(): string;
    /** @summary Configure axis painter
      * @desc Axis can be drawn inside frame <g> group with offset to 0 point for the frame
      * Therefore one should distinguish when caclulated coordinates used for axis drawing itself or for calculation of frame coordinates
      * @private */
    private configureAxis;
    name: any;
    full_min: any;
    full_max: any;
    kind: string;
    vertical: any;
    log: any;
    symlog: any;
    reverse: any;
    swap_side: any;
    fixed_ticks: any;
    maxTickSize: any;
    timeoffset: number;
    func: any;
    logbase: number;
    scale_min: any;
    scale_max: any;
    gr: any;
    nticks: number;
    nticks2: number;
    nticks3: number;
    tfunc1: any;
    tfunc2: any;
    format: any;
    noexp: any;
    moreloglabels: any;
    regular_labels: boolean;
    order: number;
    ndig: any;
    /** @summary Return scale min */
    getScaleMin(): any;
    /** @summary Return scale max */
    getScaleMax(): any;
    /** @summary Provide label for axis value */
    formatLabels(d: any): any;
    /** @summary Creates array with minor/middle/major ticks */
    createTicks(only_major_as_array: any, optionNoexp: any, optionNoopt: any, optionInt: any): any;
    noticksopt: boolean;
    /** @summary Is labels should be centered */
    isCenteredLabels(): any;
    /** @summary Add interactive elements to draw axes title */
    addTitleDrag(title_g: any, vertical: any, offset_k: any, reverse: any, axis_length: any): void;
    titleOffset: number;
    titleCenter: any;
    titleOpposite: any;
    /** @summary Produce svg path for axis ticks */
    produceTicksPath(handle: any, side: any, tickSize: any, ticksPlusMinus: any, secondShift: any, real_draw: any): string;
    ticks: any[];
    /** @summary Returns modifier for axis label */
    findLabelModifier(axis: any, nlabel: any, num_labels: any): any;
    /** @summary Draw axis labels
      * @returns {Promise} with array label size and max width */
    drawLabels(axis_g: any, axis: any, w: any, h: any, handle: any, side: any, labelsFont: any, labeloffset: any, tickSize: any, ticksPlusMinus: any, max_text_width: any): Promise<any>;
    /** @summary Extract major draw attributes, which are also used in interactive operations
      * @private  */
    private extractDrawAttributes;
    scalingSize: any;
    optionUnlab: boolean;
    optionMinus: any;
    optionPlus: any;
    optionNoopt: boolean;
    optionInt: boolean;
    optionNoexp: any;
    ticksSize: any;
    ticksColor: any;
    ticksWidth: any;
    labelSize: number;
    labelsOffset: number;
    labelsFont: FontHandler;
    fTitle: any;
    titleSize: any;
    titleFont: FontHandler;
    /** @summary function draws TAxis or TGaxis object
      * @returns {Promise} for drawing ready */
    drawAxis(layer: any, w: any, h: any, transform: any, secondShift: any, disable_axis_drawing: any, max_text_width: any, calculate_position: any): Promise<any>;
    position: number;
    title_align: string;
    /** @summary Convert TGaxis position into NDC to fix it when frame zoomed */
    convertTo(opt: any): void;
    use_ndc: boolean;
    bind_frame: boolean;
    /** @summary Redraw axis, used in standalone mode for TGaxis */
    redraw(): Promise<any>;
}
import { ObjectPainter } from "../base/ObjectPainter.mjs";
import { FontHandler } from "../base/FontHandler.mjs";
