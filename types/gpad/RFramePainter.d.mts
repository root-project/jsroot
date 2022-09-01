/**
 * @summary Painter class for RFrame, main handler for interactivity
 *
 * @private
 */
export class RFramePainter extends RObjectPainter {
    /** @summary constructor
      * @param {object|string} dom - DOM element for drawing or element id
      * @param {object} tframe - RFrame object */
    constructor(dom: object | string, tframe: object);
    mode3d: boolean;
    xmin: number;
    xmax: number;
    ymin: number;
    ymax: number;
    axes_drawn: boolean;
    keys_handler: any;
    projection: number;
    v7_frame: boolean;
    /** @summary Returns frame painter - object itself */
    getFramePainter(): RFramePainter;
    /** @summary Returns true if it is ROOT6 frame
     * @private */
    private is_root6;
    /** @summary Set active flag for frame - can block some events
     * @private */
    private setFrameActive;
    enabledKeys: boolean;
    setLastEventPos(pnt: any): void;
    fLastEventPnt: any;
    getLastEventPos(): any;
    /** @summary Update graphical attributes */
    updateAttributes(force: any): void;
    fX1NDC: number;
    fY1NDC: number;
    fX2NDC: number;
    fY2NDC: number;
    /** @summary Returns coordinates transformation func */
    getProjectionFunc(): ((l: any, b: any) => {
        x: any;
        y: number;
    }) | ((l: any, b: any) => {
        x: number;
        y: any;
    });
    /** @summary Rcalculate frame ranges using specified projection functions
      * @desc Not yet used in v7 */
    recalculateRange(Proj: any): void;
    original_xmin: any;
    original_xmax: any;
    original_ymin: any;
    original_ymax: any;
    scale_xmin: any;
    scale_xmax: any;
    scale_ymin: any;
    scale_ymax: any;
    /** @summary Draw axes grids
      * @desc Called immediately after axes drawing */
    drawGrids(): void;
    /** @summary Converts "raw" axis value into text */
    axisAsText(axis: any, value: any): any;
    /** @summary Set axix range */
    _setAxisRange(prefix: any, vmin: any, vmax: any): void;
    /** @summary Set axes ranges for drawing, check configured attributes if range already specified */
    setAxesRanges(xaxis: any, xmin: any, xmax: any, yaxis: any, ymin: any, ymax: any, zaxis: any, zmin: any, zmax: any): void;
    xaxis: any;
    yaxis: any;
    zaxis: any;
    /** @summary Set secondary axes ranges */
    setAxes2Ranges(second_x: any, xaxis: any, xmin: any, xmax: any, second_y: any, yaxis: any, ymin: any, ymax: any): void;
    x2axis: any;
    y2axis: any;
    /** @summary Create x,y objects which maps user coordinates into pixels
      * @desc Must be used only for v6 objects, see TFramePainter for more details
      * @private */
    private createXY;
    v6axes: boolean;
    swap_xy: any;
    reverse_x: any;
    reverse_y: any;
    logx: any;
    logy: any;
    zoom_ymin: any;
    zoom_ymax: any;
    x_handle: TAxisPainter | RAxisPainter;
    y_handle: TAxisPainter | RAxisPainter;
    /** @summary Identify if requested axes are drawn
      * @desc Checks if x/y axes are drawn. Also if second side is already there */
    hasDrawnAxes(second_x: any, second_y: any): boolean;
    /** @summary Draw configured axes on the frame
      * @desc axes can be drawn only for main histogram  */
    drawAxes(): Promise<boolean>;
    z_handle: RAxisPainter;
    /** @summary Draw secondary configuread axes */
    drawAxes2(second_x: any, second_y: any): Promise<[any, any]>;
    scale_x2min: any;
    scale_x2max: any;
    x2_handle: RAxisPainter;
    scale_y2min: any;
    scale_y2max: any;
    y2_handle: RAxisPainter;
    /** @summary Return functions to create x/y points based on coordinates
      * @desc In default case returns frame painter itself
      * @private */
    private getGrFuncs;
    /** @summary function called at the end of resize of frame
      * @desc Used to update attributes on the server
      * @private */
    private sizeChanged;
    /** @summary Remove all x/y functions
      * @private */
    private cleanXY;
    /** @summary Remove all axes drawings
      * @private */
    private cleanupAxes;
    /** @summary Removes all drawn elements of the frame
      * @private */
    private cleanFrameDrawings;
    /** @summary Redraw frame
      * @private */
    private redraw;
    _frame_x: number;
    _frame_y: number;
    _frame_width: number;
    _frame_height: number;
    _frame_rotate: boolean;
    _frame_fixpos: boolean;
    self_drawaxes: boolean;
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
    /** @summary Returns palette associated with frame */
    getHistPalette(): any;
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
    /** @summary function can be used for zooming into specified range
      * @desc if both limits for each axis 0 (like xmin==xmax==0), axis will be unzoomed
      * @returns {Promise} with boolean flag if zoom operation was performed */
    zoom(xmin: any, xmax: any, ymin: any, ymax: any, zmin: any, zmax: any): Promise<any>;
    zoom_xmin: any;
    zoom_xmax: any;
    zoom_zmin: any;
    zoom_zmax: any;
    /** @summary Provide zooming of single axis
      * @desc One can specify names like x/y/z but also second axis x2 or y2 */
    zoomSingle(name: any, vmin: any, vmax: any): Promise<boolean>;
    /** @summary Checks if specified axis zoomed */
    isAxisZoomed(axis: any): boolean;
    /** @summary Unzoom specified axes
      * @returns {Promise} with boolean flag if zoom is changed */
    unzoom(dox: any, doy: any, doz: any): Promise<any>;
    /** @summary Mark/check if zoom for specific axis was changed interactively
      * @private */
    private zoomChangedInteractive;
    zoom_changed_x: any;
    zoom_changed_y: any;
    zoom_changed_z: any;
    /** @summary Fill menu for frame when server is not there */
    fillObjectOfflineMenu(menu: any, kind: any): void;
    /** @summary Set grid drawing for specified axis */
    changeFrameAttr(attr: any, value: any): void;
    /** @summary Fill context menu */
    fillContextMenu(menu: any, kind: any): any;
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
    /** @summary Set selected range back to pad object - to be implemented
      * @private */
    private setRootPadRange;
    /** @summary Toggle log scale on the specified axes */
    toggleAxisLog(axis: any): void;
}
import { RObjectPainter } from "../base/RObjectPainter.mjs";
import { TAxisPainter } from "./TAxisPainter.mjs";
import { RAxisPainter } from "./RAxisPainter.mjs";
