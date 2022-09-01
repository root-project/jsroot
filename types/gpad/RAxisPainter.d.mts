/**
 * @summary Axis painter for v7
 *
 * @private
 */
export class RAxisPainter extends RObjectPainter {
    axis: any;
    embedded: boolean;
    cssprefix: any;
    /** @summary Use in GED to identify kind of axis */
    getAxisType(): string;
    /** @summary Configure only base parameters, later same handle will be used for drawing  */
    configureZAxis(name: any, fp: any): void;
    name: any;
    kind: string;
    log: boolean;
    logbase: number;
    /** @summary Configure axis painter
      * @desc Axis can be drawn inside frame <g> group with offset to 0 point for the frame
      * Therefore one should distinguish when caclulated coordinates used for axis drawing itself or for calculation of frame coordinates
      * @private */
    private configureAxis;
    full_min: any;
    full_max: any;
    vertical: any;
    reverse: any;
    timeoffset: number;
    func: any;
    symlog: any;
    scale_min: any;
    scale_max: any;
    gr_range: any;
    axis_shift: number;
    gr: any;
    nticks: number;
    nticks2: number;
    nticks3: number;
    tfunc1: any;
    tfunc2: any;
    format: any;
    noexp: any;
    moreloglabels: any;
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
    /** @summary Used to move axis labels instead of zooming
      * @private */
    private processLabelsMove;
    drag_pos0: any;
    labelsOffset: any;
    /** @summary Add interactive elements to draw axes title */
    addTitleDrag(title_g: any, side: any): void;
    titleOffset: any;
    titlePos: any;
    /** @summary checks if value inside graphical range, taking into account delta */
    isInsideGrRange(pos: any, delta1: any, delta2: any): boolean;
    /** @summary returns graphical range */
    getGrRange(delta: any): any;
    /** @summary If axis direction is negative coordinates direction */
    isReverseAxis(): boolean;
    /** @summary Draw axis ticks
      * @private */
    private drawMainLine;
    /** @summary Draw axis ticks
      * @returns {Promise} with gaps on left and right side
      * @private */
    private drawTicks;
    ticks: any[];
    /** @summary Performs labels drawing
      * @returns {Promise} wwith gaps in both direction */
    drawLabels(axis_g: any, side: any, gaps: any): Promise<any>;
    /** @summary Add zomming rect to axis drawing */
    addZoomingRect(axis_g: any, side: any, lgaps: any): void;
    /** @summary Returns true if axis title is rotated */
    isTitleRotated(): boolean;
    /** @summary Draw axis title */
    drawTitle(axis_g: any, side: any, lgaps: any): Promise<any>;
    title_align: string;
    /** @summary Extract major draw attributes, which are also used in interactive operations
      * @private  */
    private extractDrawAttributes;
    scalingSize: any;
    optionUnlab: any;
    endingStyle: any;
    endingSize: number;
    startingSize: number;
    ticksSize: any;
    ticksSide: any;
    ticksColor: any;
    ticksWidth: any;
    fTitle: any;
    titleFont: any;
    titleCenter: boolean;
    titleOpposite: boolean;
    labelsFont: any;
    /** @summary Performs axis drawing
      * @returns {Promise} which resolved when drawing is completed */
    drawAxis(layer: any, transform: any, side: any): Promise<any>;
    axis_g: any;
    side: any;
    handle: any;
    /** @summary Assign handler, which is called when axis redraw by interactive changes
      * @desc Used by palette painter to reassign iteractive handlers
      * @private */
    private setAfterDrawHandler;
    _afterDrawAgain: any;
    /** @summary Draw axis with the same settings, used by interactive changes */
    drawAxisAgain(): Promise<void>;
    /** @summary Draw axis again on opposite frame size */
    drawAxisOtherPlace(layer: any, transform: any, side: any, only_ticks: any): Promise<boolean>;
    /** @summary Change zooming in standalone mode */
    zoomStandalone(min: any, max: any): void;
    /** @summary Redraw axis, used in standalone mode for RAxisDrawable */
    redraw(): Promise<any>;
    standalone: boolean;
    /** @summary Process interactive moving of the axis drawing */
    positionChanged(drag: any): void;
    /** @summary Change axis attribute, submit changes to server and redraw axis when specified
      * @desc Arguments as redraw_mode, name1, value1, name2, value2, ... */
    changeAxisAttr(redraw_mode: any, ...args: any[]): void;
    /** @summary Change axis log scale kind */
    changeAxisLog(arg: any): void;
    /** @summary Provide context menu for axis */
    fillAxisContextMenu(menu: any, kind: any): boolean;
}
import { RObjectPainter } from "../base/RObjectPainter.mjs";
