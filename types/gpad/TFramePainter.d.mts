/** @summary Add drag for interactive rectangular elements for painter
  * @private */
export function addDragHandler(_painter: any, arg: any): void;
export namespace TooltipHandler {
    /** @desc only canvas info_layer can be used while other pads can overlay
      * @returns layer where frame tooltips are shown */
    function hints_layer(): any;
    /** @desc only canvas info_layer can be used while other pads can overlay
      * @returns layer where frame tooltips are shown */
    function hints_layer(): any;
    /** @returns true if tooltip is shown, use to prevent some other action */
    function isTooltipShown(): boolean;
    /** @returns true if tooltip is shown, use to prevent some other action */
    function isTooltipShown(): boolean;
    function setTooltipEnabled(enabled: any): void;
    function setTooltipEnabled(enabled: any): void;
    /** @summary central function which let show selected hints for the object */
    function processFrameTooltipEvent(pnt: any, evnt: any): void;
    /** @summary central function which let show selected hints for the object */
    function processFrameTooltipEvent(pnt: any, evnt: any): void;
    /** @summary Assigns tooltip methods */
    function assign(painter: any): void;
    /** @summary Assigns tooltip methods */
    function assign(painter: any): void;
}
export namespace FrameInteractive {
    function addBasicInteractivity(): void;
    function addBasicInteractivity(): void;
    /** @summary Add interactive handlers */
    function addFrameInteractivity(for_second_axes: any): Promise<{
        addBasicInteractivity(): void;
        addFrameInteractivity(for_second_axes: any): Promise<any>;
        /** @summary Add keys handler */
        addFrameKeysHandler(): void;
        /** @summary Handle key press */
        processKeyPress(evnt: any): boolean;
        /** @summary Function called when frame is clicked and object selection can be performed
          * @desc such event can be used to select */
        processFrameClick(pnt: any, dblckick: any): any;
        /** @summary Start mouse rect zooming */
        startRectSel(evnt: any): void;
        /** @summary Starts labels move */
        startLabelsMove(): void;
        /** @summary Process mouse rect zooming */
        moveRectSel(evnt: any): any;
        /** @summary Finish mouse rect zooming */
        endRectSel(evnt: any): void;
        /** @summary Handle mouse double click on frame */
        mouseDoubleClick(evnt: any): void;
        /** @summary Start touch zoom */
        startTouchZoom(evnt: any): void;
        /** @summary Move touch zooming */
        moveTouchZoom(evnt: any): void;
        /** @summary End touch zooming handler */
        endTouchZoom(evnt: any): void;
        /** @summary Analyze zooming with mouse wheel */
        analyzeMouseWheelEvent(event: any, item: any, dmin: any, test_ignore: any, second_side: any): any;
        /** @summary return true if default Y zooming should be enabled
          * @desc it is typically for 2-Dim histograms or
          * when histogram not draw, defined by other painters */
        isAllowedDefaultYZooming(): any;
        /** @summary Handles mouse wheel event */
        mouseWheel(evnt: any): void;
        /** @summary Show frame context menu */
        showContextMenu(kind: any, evnt: any, obj: any): void;
        /** @summary Activate context menu handler via touch events
          * @private */
        startTouchMenu(kind: any, evnt: any): void;
        /** @summary Process end-touch event, which can cause content menu to appear
         * @private */
        endTouchMenu(kind: any, evnt: any): void;
        /** @summary Clear frame interactive elements */
        clearInteractiveElements(): void;
        /** @summary Assign frame interactive methods */
        assign(painter: any): void;
    }>;
    /** @summary Add interactive handlers */
    function addFrameInteractivity(for_second_axes: any): Promise<{
        addBasicInteractivity(): void;
        addFrameInteractivity(for_second_axes: any): Promise<any>;
        /** @summary Add keys handler */
        addFrameKeysHandler(): void;
        /** @summary Handle key press */
        processKeyPress(evnt: any): boolean;
        /** @summary Function called when frame is clicked and object selection can be performed
          * @desc such event can be used to select */
        processFrameClick(pnt: any, dblckick: any): any;
        /** @summary Start mouse rect zooming */
        startRectSel(evnt: any): void;
        /** @summary Starts labels move */
        startLabelsMove(): void;
        /** @summary Process mouse rect zooming */
        moveRectSel(evnt: any): any;
        /** @summary Finish mouse rect zooming */
        endRectSel(evnt: any): void;
        /** @summary Handle mouse double click on frame */
        mouseDoubleClick(evnt: any): void;
        /** @summary Start touch zoom */
        startTouchZoom(evnt: any): void;
        /** @summary Move touch zooming */
        moveTouchZoom(evnt: any): void;
        /** @summary End touch zooming handler */
        endTouchZoom(evnt: any): void;
        /** @summary Analyze zooming with mouse wheel */
        analyzeMouseWheelEvent(event: any, item: any, dmin: any, test_ignore: any, second_side: any): any;
        /** @summary return true if default Y zooming should be enabled
          * @desc it is typically for 2-Dim histograms or
          * when histogram not draw, defined by other painters */
        isAllowedDefaultYZooming(): any;
        /** @summary Handles mouse wheel event */
        mouseWheel(evnt: any): void;
        /** @summary Show frame context menu */
        showContextMenu(kind: any, evnt: any, obj: any): void;
        /** @summary Activate context menu handler via touch events
          * @private */
        startTouchMenu(kind: any, evnt: any): void;
        /** @summary Process end-touch event, which can cause content menu to appear
         * @private */
        endTouchMenu(kind: any, evnt: any): void;
        /** @summary Clear frame interactive elements */
        clearInteractiveElements(): void;
        /** @summary Assign frame interactive methods */
        assign(painter: any): void;
    }>;
    /** @summary Add keys handler */
    function addFrameKeysHandler(): void;
    /** @summary Add keys handler */
    function addFrameKeysHandler(): void;
    /** @summary Handle key press */
    function processKeyPress(evnt: any): boolean;
    /** @summary Handle key press */
    function processKeyPress(evnt: any): boolean;
    /** @summary Function called when frame is clicked and object selection can be performed
      * @desc such event can be used to select */
    function processFrameClick(pnt: any, dblckick: any): any;
    /** @summary Function called when frame is clicked and object selection can be performed
      * @desc such event can be used to select */
    function processFrameClick(pnt: any, dblckick: any): any;
    /** @summary Start mouse rect zooming */
    function startRectSel(evnt: any): void;
    /** @summary Start mouse rect zooming */
    function startRectSel(evnt: any): void;
    /** @summary Starts labels move */
    function startLabelsMove(): void;
    /** @summary Starts labels move */
    function startLabelsMove(): void;
    /** @summary Process mouse rect zooming */
    function moveRectSel(evnt: any): any;
    /** @summary Process mouse rect zooming */
    function moveRectSel(evnt: any): any;
    /** @summary Finish mouse rect zooming */
    function endRectSel(evnt: any): void;
    /** @summary Finish mouse rect zooming */
    function endRectSel(evnt: any): void;
    /** @summary Handle mouse double click on frame */
    function mouseDoubleClick(evnt: any): void;
    /** @summary Handle mouse double click on frame */
    function mouseDoubleClick(evnt: any): void;
    /** @summary Start touch zoom */
    function startTouchZoom(evnt: any): void;
    /** @summary Start touch zoom */
    function startTouchZoom(evnt: any): void;
    /** @summary Move touch zooming */
    function moveTouchZoom(evnt: any): void;
    /** @summary Move touch zooming */
    function moveTouchZoom(evnt: any): void;
    /** @summary End touch zooming handler */
    function endTouchZoom(evnt: any): void;
    /** @summary End touch zooming handler */
    function endTouchZoom(evnt: any): void;
    /** @summary Analyze zooming with mouse wheel */
    function analyzeMouseWheelEvent(event: any, item: any, dmin: any, test_ignore: any, second_side: any): any;
    /** @summary Analyze zooming with mouse wheel */
    function analyzeMouseWheelEvent(event: any, item: any, dmin: any, test_ignore: any, second_side: any): any;
    /** @summary return true if default Y zooming should be enabled
      * @desc it is typically for 2-Dim histograms or
      * when histogram not draw, defined by other painters */
    function isAllowedDefaultYZooming(): any;
    /** @summary return true if default Y zooming should be enabled
      * @desc it is typically for 2-Dim histograms or
      * when histogram not draw, defined by other painters */
    function isAllowedDefaultYZooming(): any;
    /** @summary Handles mouse wheel event */
    function mouseWheel(evnt: any): void;
    /** @summary Handles mouse wheel event */
    function mouseWheel(evnt: any): void;
    /** @summary Show frame context menu */
    function showContextMenu(kind: any, evnt: any, obj: any): void;
    /** @summary Show frame context menu */
    function showContextMenu(kind: any, evnt: any, obj: any): void;
    /** @summary Activate context menu handler via touch events
      * @private */
    function startTouchMenu(kind: any, evnt: any): void;
    /** @summary Activate context menu handler via touch events
      * @private */
    function startTouchMenu(kind: any, evnt: any): void;
    /** @summary Process end-touch event, which can cause content menu to appear
     * @private */
    function endTouchMenu(kind: any, evnt: any): void;
    /** @summary Process end-touch event, which can cause content menu to appear
     * @private */
    function endTouchMenu(kind: any, evnt: any): void;
    /** @summary Clear frame interactive elements */
    function clearInteractiveElements(): void;
    /** @summary Clear frame interactive elements */
    function clearInteractiveElements(): void;
    /** @summary Assign frame interactive methods */
    function assign(painter: any): void;
    /** @summary Assign frame interactive methods */
    function assign(painter: any): void;
}
/**
 * @summary Painter class for TFrame, main handler for interactivity
 * @private
 */
export class TFramePainter extends ObjectPainter {
    /** @summary constructor
      * @param {object|string} dom - DOM element for drawing or element id
      * @param {object} tframe - TFrame object */
    constructor(dom: object | string, tframe: object);
    zoom_kind: number;
    mode3d: boolean;
    shrink_frame_left: number;
    xmin: number;
    xmax: number;
    ymin: number;
    ymax: number;
    ranges_set: boolean;
    axes_drawn: boolean;
    keys_handler: any;
    projection: number;
    /** @summary Returns frame painter - object itself */
    getFramePainter(): TFramePainter;
    /** @summary Returns true if it is ROOT6 frame
      * @private */
    private is_root6;
    /** @summary Returns frame or sub-objects, used in GED editor */
    getObject(place: any): any;
    /** @summary Set active flag for frame - can block some events
      * @private */
    private setFrameActive;
    enabledKeys: boolean;
    /** @summary Shrink frame size
      * @private */
    private shrinkFrame;
    /** @summary Set position of last context menu event */
    setLastEventPos(pnt: any): void;
    fLastEventPnt: any;
    /** @summary Return position of last event
      * @private */
    private getLastEventPos;
    /** @summary Returns coordinates transformation func */
    getProjectionFunc(): ((l: any, b: any) => {
        x: any;
        y: number;
    }) | ((l: any, b: any) => {
        x: number;
        y: any;
    });
    /** @summary Rcalculate frame ranges using specified projection functions */
    recalculateRange(Proj: any): void;
    original_xmin: any;
    original_xmax: any;
    original_ymin: any;
    original_ymax: any;
    scale_xmin: any;
    scale_xmax: any;
    scale_ymin: any;
    scale_ymax: any;
    /** @summary Configure frame axes ranges */
    setAxesRanges(xaxis: any, xmin: any, xmax: any, yaxis: any, ymin: any, ymax: any, zaxis: any, zmin: any, zmax: any): void;
    xaxis: any;
    yaxis: any;
    zaxis: any;
    zmin: any;
    zmax: any;
    /** @summary Configure secondary frame axes ranges */
    setAxes2Ranges(second_x: any, xaxis: any, xmin: any, xmax: any, second_y: any, yaxis: any, ymin: any, ymax: any): void;
    x2axis: any;
    x2min: any;
    x2max: any;
    y2axis: any;
    y2min: any;
    y2max: any;
    /** @summary Retuns associated axis object */
    getAxis(name: any): any;
    /** @summary Apply axis zooming from pad user range
      * @private */
    private applyPadUserRange;
    /** @summary Create x,y objects which maps user coordinates into pixels
      * @desc While only first painter really need such object, all others just reuse it
      * following functions are introduced
      *    this.GetBin[X/Y]  return bin coordinate
      *    this.[x,y]  these are d3.scale objects
      *    this.gr[x,y]  converts root scale into graphical value
      * @private */
    private createXY;
    swap_xy: any;
    reverse_x: any;
    reverse_y: any;
    logx: number;
    logy: number;
    zoom_ymin: any;
    zoom_ymax: any;
    x_handle: TAxisPainter;
    y_handle: TAxisPainter;
    /** @summary Create x,y objects for drawing of second axes
      * @private */
    private createXY2;
    reverse_x2: any;
    reverse_y2: any;
    logx2: number;
    logy2: number;
    scale_x2min: any;
    scale_x2max: any;
    scale_y2min: any;
    scale_y2max: any;
    x2_handle: TAxisPainter;
    y2_handle: TAxisPainter;
    /** @summary Return functions to create x/y points based on coordinates
      * @desc In default case returns frame painter itself
      * @private */
    private getGrFuncs;
    /** @summary Set selected range back to TPad object
      * @private */
    private setRootPadRange;
    /** @summary Draw axes grids
      * @desc Called immediately after axes drawing */
    drawGrids(): void;
    /** @summary Converts "raw" axis value into text */
    axisAsText(axis: any, value: any): any;
    /** @summary Identify if requested axes are drawn
      * @desc Checks if x/y axes are drawn. Also if second side is already there */
    hasDrawnAxes(second_x: any, second_y: any): boolean;
    /** @summary draw axes, return Promise which ready when drawing is completed  */
    drawAxes(shrink_forbidden: any, disable_x_draw: any, disable_y_draw: any, AxisPos: any, has_x_obstacle: any, has_y_obstacle: any): Promise<boolean>;
    /** @summary draw second axes (if any)  */
    drawAxes2(second_x: any, second_y: any): Promise<[any, any]>;
    /** @summary Update frame attributes
      * @private */
    private updateAttributes;
    /** @summary Function called at the end of resize of frame
      * @desc One should apply changes to the pad
      * @private */
    private sizeChanged;
    /** @summary Remove all kinds of X/Y function for axes transformation */
    cleanXY(): void;
    /** @summary remove all axes drawings */
    cleanAxesDrawings(): void;
    /** @summary Returns frame rectangle plus extra info for hint display */
    cleanFrameDrawings(): void;
    zoom_xmin: number;
    zoom_xmax: number;
    zoom_zmin: number;
    zoom_zmax: number;
    scale_zmin: number;
    scale_zmax: number;
    /** @summary Redraw TFrame */
    redraw(): TFramePainter;
    _frame_x: number;
    _frame_y: number;
    _frame_width: number;
    _frame_height: number;
    _frame_rotate: boolean;
    _frame_fixpos: boolean;
    /** @summary Change log state of specified axis
      * @param {number} value - 0 (linear), 1 (log) or 2 (log2) */
    changeAxisLog(axis: any, value: number): void;
    /** @summary Toggle log state on the specified axis */
    toggleAxisLog(axis: any): void;
    /** @summary Fill context menu for the frame
      * @desc It could be appended to the histogram menus */
    fillContextMenu(menu: any, kind: any, obj: any): boolean;
    /** @summary Fill option object used in TWebCanvas
      * @private */
    private fillWebObjectOptions;
    /** @summary Returns frame width */
    getFrameWidth(): number;
    /** @summary Returns frame height */
    getFrameHeight(): number;
    /** @summary Returns frame rectangle plus extra info for hint display */
    getFrameRect(): {
        x: number;
        y: number;
        width: number;
        height: number;
        transform: any;
        hint_delta_x: number;
        hint_delta_y: number;
    };
    /** @summary Configure user-defined click handler
      * @desc Function will be called every time when frame click was perfromed
      * As argument, tooltip object with selected bins will be provided
      * If handler function returns true, default handling of click will be disabled */
    configureUserClickHandler(handler: any): void;
    _click_handler: any;
    /** @summary Configure user-defined dblclick handler
      * @desc Function will be called every time when double click was called
      * As argument, tooltip object with selected bins will be provided
      * If handler function returns true, default handling of dblclick (unzoom) will be disabled */
    configureUserDblclickHandler(handler: any): void;
    _dblclick_handler: any;
    /** @summary Function can be used for zooming into specified range
      * @desc if both limits for each axis 0 (like xmin==xmax==0), axis will be unzoomed
      * @param {number} xmin
      * @param {number} xmax
      * @param {number} [ymin]
      * @param {number} [ymax]
      * @param {number} [zmin]
      * @param {number} [zmax]
      * @returns {Promise} with boolean flag if zoom operation was performed */
    zoom(xmin: number, xmax: number, ymin?: number, ymax?: number, zmin?: number, zmax?: number): Promise<any>;
    /** @summary Provide zooming of single axis
      * @desc One can specify names like x/y/z but also second axis x2 or y2
      * @private */
    private zoomSingle;
    /** @summary Checks if specified axis zoomed */
    isAxisZoomed(axis: any): boolean;
    /** @summary Unzoom speicified axes
      * @returns {Promise} with boolean flag if zooming changed */
    unzoom(dox: any, doy: any, doz: any): Promise<any>;
    /** @summary Mark/check if zoom for specific axis was changed interactively
      * @private */
    private zoomChangedInteractive;
    zoom_changed_x: any;
    zoom_changed_y: any;
    zoom_changed_z: any;
    /** @summary Convert graphical coordinate into axis value */
    revertAxis(axis: any, pnt: any): any;
    /** @summary Show axis status message
     * @desc method called normally when mouse enter main object element
     * @private */
    private showAxisStatus;
    /** @summary Add interactive keys handlers
     * @private */
    private addKeysHandler;
    /** @summary Add interactive functionality to the frame
      * @private */
    private addInteractivity;
}
import { ObjectPainter } from "../base/ObjectPainter.mjs";
import { TAxisPainter } from "./TAxisPainter.mjs";
