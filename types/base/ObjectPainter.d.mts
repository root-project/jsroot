/** @summary Returns canvas painter (if any) for specified HTML element
  * @param {string|object} dom - id or DOM element
  * @private */
export function getElementCanvPainter(dom: string | object): any;
/** @summary Returns main painter (if any) for specified HTML element - typically histogram painter
  * @param {string|object} dom - id or DOM element
  * @private */
export function getElementMainPainter(dom: string | object): any;
/** @summary Save object, drawn in specified element, as JSON.
  * @desc Normally it is TCanvas object with list of primitives
  * @param {string|object} dom - id of top div element or directly DOMElement
  * @returns {string} produced JSON string */
export function drawingJSON(dom: string | object): string;
/** @summary Set active pad painter
  * @desc Normally be used to handle key press events, which are global in the web browser
  * @param {object} args - functions arguments
  * @param {object} args.pp - pad painter
  * @param {boolean} [args.active] - is pad activated or not
  * @private */
export function selectActivePad(args: {
    pp: object;
    active?: boolean;
}): void;
/** @summary Returns current active pad
  * @desc Should be used only for keyboard handling
  * @private */
export function getActivePad(): any;
/** @summary Safely remove all drawings from specified element
  * @param {string|object} dom - id or DOM element
  * @public
  * @example
  * cleanup("drawing");
  * cleanup(document.querySelector("#drawing")); */
export function cleanup(dom: string | object): any[];
/** @summary Check resize of drawn element
  * @param {string|object} dom - id or DOM element
  * @param {boolean|object} arg - options on how to resize
  * @desc As first argument dom one should use same argument as for the drawing
  * As second argument, one could specify "true" value to force redrawing of
  * the element even after minimal resize
  * Or one just supply object with exact sizes like { width:300, height:200, force:true };
  * @example
  * resize("drawing", { width: 500, height: 200 } );
  * resize(document.querySelector("#drawing"), true); */
export function resize(dom: string | object, arg: boolean | object): boolean;
/**
 * @summary Painter class for ROOT objects
 *
 */
export class ObjectPainter extends BasePainter {
    /** @summary constructor
      * @param {object|string} dom - dom element or identifier
      * @param {object} obj - object to draw
      * @param {string} [opt] - object draw options */
    constructor(dom: object | string, obj: object, opt?: string);
    pad_name: string;
    options: {
        original: string;
    };
    /** @summary Assign object to the painter
      * @protected */
    protected assignObject(obj: any): void;
    draw_object: any;
    /** @summary Assigns pad name where element will be drawn
      * @desc Should happend before first draw of element is performed, only for special use case
      * @param {string} [pad_name] - on which subpad element should be draw, if not specified - use current
      * @protected */
    protected setPadName(pad_name?: string): void;
    /** @summary Returns pad name where object is drawn */
    getPadName(): string;
    /** @summary Assign snapid to the painter
     * @desc Identifier used to communicate with server side and identifies object on the server
     * @private */
    private assignSnapId;
    snapid: any;
    /** @summary Generic method to cleanup painter.
      * @desc Remove object drawing and (in case of main painter) also main HTML components
      * @protected */
    protected cleanup(): void;
    /** @summary Returns drawn object */
    getObject(): any;
    /** @summary Returns drawn object class name */
    getClassName(): any;
    /** @summary Checks if drawn object matches with provided typename
      * @param {string|object} arg - typename (or object with _typename member)
      * @protected */
    protected matchObjectType(arg: string | object): any;
    /** @summary Store actual this.options together with original string
      * @private */
    private storeDrawOpt;
    options_store: {
        original: string;
    };
    /** @summary Return actual draw options as string
      * @desc if options are not modified - returns original string which was specified for object draw */
    getDrawOpt(): any;
    /** @summary Returns array with supported draw options as configured in draw.mjs
      * @desc works via pad painter and only when module was loaded */
    getSupportedDrawOptions(): any;
    /** @summary Central place to update objects drawing
      * @param {object} obj - new version of object, values will be updated in original object
      * @param {string} [opt] - when specified, new draw options
      * @returns {boolean|Promise} for object redraw
      * @desc Two actions typically done by redraw - update object content via {@link ObjectPainter#updateObject} and
       * then redraw correspondent pad via {@link ObjectPainter#redrawPad}. If possible one should redefine
       * only updateObject function and keep this function unchanged. But for some special painters this function is the
       * only way to control how object can be update while requested from the server
       * @protected */
    protected redrawObject(obj: object, opt?: string): boolean | Promise<any>;
    /** @summary Generic method to update object content.
      * @desc Default implementation just copies first-level members to current object
      * @param {object} obj - object with new data
      * @param {string} [opt] - option which will be used for redrawing
      * @protected */
    protected updateObject(obj: object): boolean;
    /** @summary Returns string with object hint
      * @desc It is either item name or object name or class name.
      * Such string typically used as object tooltip.
      * If result string larger than 20 symbols, it will be cutted. */
    getObjectHint(): string;
    /** @summary returns color from current list of colors
      * @desc First checks canvas painter and then just access global list of colors
      * @param {number} indx - color index
      * @returns {string} with SVG color name or rgb()
      * @protected */
    protected getColor(indx: number): string;
    root_colors: any;
    /** @summary Add color to list of colors
      * @desc Returned color index can be used as color number in all other draw functions
      * @returns {number} new color index
      * @protected */
    protected addColor(color: any): number;
    /** @summary returns tooltip allowed flag
      * @desc If available, checks in canvas painter
      * @private */
    private isTooltipAllowed;
    /** @summary change tooltip allowed flag
      * @param {boolean|string} [on = true] set tooltip allowed state or 'toggle'
      * @private */
    private setTooltipAllowed;
    /** @summary Checks if draw elements were resized and drawing should be updated.
      * @desc Redirects to {@link TPadPainter#checkCanvasResize}
      * @private */
    private checkResize;
    /** @summary removes <g> element with object drawing
      * @desc generic method to delete all graphical elements, associated with the painter
      * @protected */
    protected removeG(): void;
    /** @summary Returns created <g> element used for object drawing
      * @desc Element should be created by {@link ObjectPainter#createG}
      * @protected */
    protected getG(): any;
    /** @summary (re)creates svg:g element for object drawings
      * @desc either one attach svg:g to pad primitives (default)
      * or svg:g element created in specified frame layer ("main_layer" will be used when true specified)
      * @param {boolean|string} [frame_layer] - when specified, <g> element will be created inside frame layer, otherwise in the pad
      * @protected */
    protected createG(frame_layer?: boolean | string): any;
    draw_g: any;
    /** @summary Canvas main svg element
      * @returns {object} d3 selection with canvas svg
      * @protected */
    protected getCanvSvg(): object;
    /** @summary Pad svg element
      * @param {string} [pad_name] - pad name to select, if not specified - pad where object is drawn
      * @returns {object} d3 selection with pad svg
      * @protected */
    protected getPadSvg(pad_name?: string): object;
    /** @summary Method selects immediate layer under canvas/pad main element
      * @param {string} name - layer name, exits "primitives_layer", "btns_layer", "info_layer"
      * @param {string} [pad_name] - pad name; current pad name  used by default
      * @protected */
    protected getLayerSvg(name: string, pad_name?: string): any;
    /** @summary Method selects current pad name
      * @param {string} [new_name] - when specified, new current pad name will be configured
      * @returns {string} previous selected pad or actual pad when new_name not specified
      * @private */
    private selectCurrentPad;
    /** @summary returns pad painter
      * @param {string} [pad_name] pad name or use current pad by default
      * @protected */
    protected getPadPainter(pad_name?: string): any;
    /** @summary returns canvas painter
      * @protected */
    protected getCanvPainter(): any;
    /** @summary Return functor, which can convert x and y coordinates into pixels, used for drawing in the pad
      * @desc X and Y coordinates can be converted by calling func.x(x) and func.y(y)
      * Only can be used for painting in the pad, means CreateG() should be called without arguments
      * @param {boolean} isndc - if NDC coordinates will be used
      * @param {boolean} [noround] - if set, return coordinates will not be rounded
      * @protected */
    protected getAxisToSvgFunc(isndc: boolean, nornd: any): {
        isndc: boolean;
        nornd: any;
    };
    /** @summary Converts x or y coordinate into pad SVG coordinates.
      * @desc Only can be used for painting in the pad, means CreateG() should be called without arguments
      * @param {string} axis - name like "x" or "y"
      * @param {number} value - axis value to convert.
      * @param {boolean} ndc - is value in NDC coordinates
      * @param {boolean} [noround] - skip rounding
      * @returns {number} value of requested coordiantes
      * @protected */
    protected axisToSvg(axis: string, value: number, ndc: boolean, noround?: boolean): number;
    /** @summary Converts pad SVG x or y coordinates into axis values.
      * @desc Reverse transformation for {@link ObjectPainter#axisToSvg}
      * @param {string} axis - name like "x" or "y"
      * @param {number} coord - graphics coordiante.
      * @param {boolean} ndc - kind of return value
      * @returns {number} value of requested coordiantes
      * @protected */
    protected svgToAxis(axis: string, coord: number, ndc: boolean): number;
    /** @summary Returns svg element for the frame in current pad
      * @protected */
    protected getFrameSvg(pad_name: any): any;
    /** @summary Returns frame painter for current pad
      * @desc Pad has direct reference on frame if any
      * @protected */
    protected getFramePainter(): any;
    /** @summary Returns painter for main object on the pad.
      * @desc Typically it is first histogram drawn on the pad and which draws frame axes
      * But it also can be special usecase as TASImage or TGraphPolargram
      * @param {boolean} [not_store] - if true, prevent temporary storage of main painter reference
      * @protected */
    protected getMainPainter(not_store?: boolean): any;
    _main_painter: any;
    /** @summary Returns true if this is main painter
      * @protected */
    protected isMainPainter(): boolean;
    /** @summary Assign this as main painter on the pad
      * @desc Main painter typically responsible for axes drawing
      * Should not be used by pad/canvas painters, but rather by objects which are drawing axis
      * @protected */
    protected setAsMainPainter(force: any): void;
    /** @summary Add painter to pad list of painters
      * @param {string} [pad_name] - optional pad name where painter should be add
      * @desc Normally one should use {@link ensureTCanvas} to add painter to pad list of primitives
      * @protected */
    protected addToPadPrimitives(pad_name?: string): boolean;
    rstyle: any;
    /** @summary Remove painter from pad list of painters
      * @protected */
    protected removeFromPadPrimitives(): boolean;
    /** @summary Creates marker attributes object
      * @desc Can be used to produce markers in painter.
      * See {@link TAttMarkerHandler} for more info.
      * Instance assigned as this.markeratt data member, recognized by GED editor
      * @param {object} args - either TAttMarker or see arguments of {@link TAttMarkerHandler}
      * @returns {object} created handler
      * @protected */
    protected createAttMarker(args: object): object;
    markeratt: any;
    /** @summary Creates line attributes object.
      * @desc Can be used to produce lines in painter.
      * See {@link TAttLineHandler} for more info.
      * Instance assigned as this.lineatt data member, recognized by GED editor
      * @param {object} args - either TAttLine or see constructor arguments of {@link TAttLineHandler}
      * @protected */
    protected createAttLine(args: object): any;
    lineatt: any;
    /** @summary Creates fill attributes object.
      * @desc Method dedicated to create fill attributes, bound to canvas SVG
      * otherwise newly created patters will not be usable in the canvas
      * See {@link TAttFillHandler} for more info.
      * Instance assigned as this.fillatt data member, recognized by GED editors
      * @param {object} args - for special cases one can specify TAttFill as args or number of parameters
      * @param {boolean} [args.std = true] - this is standard fill attribute for object and should be used as this.fillatt
      * @param {object} [args.attr = null] - object, derived from TAttFill
      * @param {number} [args.pattern = undefined] - integer index of fill pattern
      * @param {number} [args.color = undefined] - integer index of fill color
      * @param {string} [args.color_as_svg = undefined] - color will be specified as SVG string, not as index from color palette
      * @param {number} [args.kind = undefined] - some special kind which is handled differently from normal patterns
      * @returns created handle
      * @protected */
    protected createAttFill(args: {
        std?: boolean;
        attr?: object;
        pattern?: number;
        color?: number;
        color_as_svg?: string;
        kind?: number;
    }): any;
    fillatt: any;
    /** @summary call function for each painter in the pad
      * @desc Iterate over all known painters
      * @private */
    private forEachPainter;
    /** @summary indicate that redraw was invoked via interactive action (like context menu or zooming)
      * @desc Use to catch such action by GED and by server-side
      * @returns {Promise} when completed
      * @private */
    private interactiveRedraw;
    /** @summary Redraw all objects in the current pad
      * @param {string} [reason] - like 'resize' or 'zoom'
      * @returns {Promise} when pad redraw completed
      * @protected */
    protected redrawPad(reason?: string): Promise<any>;
    /** @summary execute selected menu command, either locally or remotely
      * @private */
    private executeMenuCommand;
    /** @summary Invoke method for object via WebCanvas functionality
      * @desc Requires that painter marked with object identifier (this.snapid) or identifier provided as second argument
      * Canvas painter should exists and in non-readonly mode
      * Execution string can look like "Print()".
      * Many methods call can be chained with "Print();;Update();;Clear()"
      * @private */
    private submitCanvExec;
    /** @summary remove all created draw attributes
      * @protected */
    protected deleteAttr(): void;
    /** @summary Show object in inspector for provided object
      * @protected */
    protected showInspector(): boolean;
    /** @summary Fill context menu for the object
      * @private */
    private fillContextMenu;
    /** @summary shows objects status
      * @desc Either used canvas painter method or globaly assigned
      * When no parameters are specified, just basic object properties are shown
      * @private */
    private showObjectStatus;
    /** @summary Redraw object
      * @desc Basic method, should be reimplemented in all derived objects
      * for the case when drawing should be repeated
      * @abstract
      * @protected */
    protected redraw(): void;
    /** @summary Start text drawing
      * @desc required before any text can be drawn
      * @param {number} font_face - font id as used in ROOT font attributes
      * @param {number} font_size - font size as used in ROOT font attributes
      * @param {object} [draw_g] - element where text drawm, by default using main object <g> element
      * @param {number} [max_font_size] - maximal font size, used when text can be scaled
      * @protected */
    protected startTextDrawing(font_face: number, font_size: number, draw_g?: object, max_font_size?: number): void;
    /** @summary Apply scaling factor to all drawn text in the <g> element
      * @desc Can be applied at any time before finishTextDrawing is called - even in the postprocess callbacks of text draw
      * @param {number} factor - scaling factor
      * @param {object} [draw_g] - drawing element for the text
      * @protected */
    protected scaleTextDrawing(factor: number, draw_g?: object): void;
    /** @summary Analyze if all text draw operations are completed
      * @private */
    private _checkAllTextDrawing;
    /** @summary Post-process plain text drawing
      * @private */
    private _postprocessDrawText;
    /** @summary Draw text
      * @desc The only legal way to draw text, support plain, latex and math text output
      * @param {object} arg - different text draw options
      * @param {string} arg.text - text to draw
      * @param {number} [arg.align = 12] - int value like 12 or 31
      * @param {string} [arg.align = undefined] - end;bottom
      * @param {number} [arg.x = 0] - x position
      * @param {number} [arg.y = 0] - y position
      * @param {number} [arg.width] - when specified, adjust font size in the specified box
      * @param {number} [arg.height] - when specified, adjust font size in the specified box
      * @param {number} [arg.latex] - 0 - plain text, 1 - normal TLatex, 2 - math
      * @param {string} [arg.color=black] - text color
      * @param {number} [arg.rotate] - rotaion angle
      * @param {number} [arg.font_size] - fixed font size
      * @param {object} [arg.draw_g] - element where to place text, if not specified central draw_g container is used
      * @param {function} [arg.post_process] - optional function called when specified text is drawn
      * @protected */
    protected drawText(arg: {
        text: string;
        align?: number;
        align?: number;
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        latex?: number;
        color?: string;
        rotate?: number;
        font_size?: number;
        draw_g?: object;
        post_process?: Function;
    }): any;
    /** @summary Finish text drawing
      * @desc Should be called to complete all text drawing operations
      * @param {function} [draw_g] - <g> element for text drawing, this.draw_g used when not specified
      * @returns {Promise} when text drawing completed
      * @protected */
    protected finishTextDrawing(draw_g?: Function, try_optimize: any): Promise<any>;
    /** @summary Configure user-defined context menu for the object
      * @desc fillmenu_func will be called when context menu is actiavted
      * Arguments fillmenu_func are (menu,kind)
      * First is menu object, second is object subelement like axis "x" or "y"
      * Function should return promise with menu when items are filled
      * @param {function} fillmenu_func - function to fill custom context menu for oabject */
    configureUserContextMenu(fillmenu_func: Function): void;
    _userContextMenuFunc: Function;
    /** @summary Fill object menu in web canvas
      * @private */
    private fillObjectExecMenu;
    _got_menu: boolean;
    args_menu_items: any;
    args_menu_id: any;
    /** @summary Configure user-defined tooltip handler
      * @desc Hook for the users to get tooltip information when mouse cursor moves over frame area
      * Hanlder function will be called every time when new data is selected
      * when mouse leave frame area, handler(null) will be called
      * @param {function} handler - function called when tooltip is produced
      * @param {number} [tmout = 100] - delay in ms before tooltip delivered */
    configureUserTooltipHandler(handler: Function, tmout?: number): void;
    _user_tooltip_handler: Function;
    _user_tooltip_timeout: number;
    /** @summary Configure user-defined click handler
      * @desc Function will be called every time when frame click was perfromed
      * As argument, tooltip object with selected bins will be provided
      * If handler function returns true, default handling of click will be disabled
      * @param {function} handler - function called when mouse click is done */
    configureUserClickHandler(handler: Function): void;
    /** @summary Configure user-defined dblclick handler
      * @desc Function will be called every time when double click was called
      * As argument, tooltip object with selected bins will be provided
      * If handler function returns true, default handling of dblclick (unzoom) will be disabled
      * @param {function} handler - function called when mouse double click is done */
    configureUserDblclickHandler(handler: Function): void;
    /** @summary Check if user-defined tooltip function was configured
      * @returns {boolean} flag is user tooltip handler was configured */
    hasUserTooltip(): boolean;
    /** @summary Provide tooltips data to user-defined function
      * @param {object} data - tooltip data
      * @private */
    private provideUserTooltip;
    _user_tooltip_handle: any;
    /** @summary Provide projection areas
      * @param kind - "X", "Y" or ""
      * @private */
    private provideSpecialDrawArea;
    _special_draw_area: any;
    /** @summary Provide projection areas
      * @param kind - "X", "Y" or ""
      * @private */
    private drawInSpecialArea;
    /** @summary Get tooltip for painter and specified event position
      * @param {Object} evnt - object wiith clientX and clientY positions
      * @private */
    private getToolTip;
}
/** @summary Generic text drawing
  * @private */
export function drawRawText(dom: any, txt: any): any;
import { BasePainter } from "./BasePainter.mjs";
