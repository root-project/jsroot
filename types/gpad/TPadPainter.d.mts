/**
  * @summary Painter for TPad object
  * @private
  */
export class TPadPainter extends ObjectPainter {
    /** @summary draw TPad object */
    static draw(dom: any, pad: any, opt: any): Promise<TPadPainter>;
    /** @summary constructor
      * @param {object|string} dom - DOM element for drawing or element id
      * @param {object} pad - TPad object to draw
      * @param {boolean} [iscan] - if TCanvas object */
    constructor(dom: object | string, pad: object, iscan?: boolean);
    pad: any;
    iscan: boolean;
    this_pad_name: any;
    painters: any[];
    has_canvas: boolean;
    forEachPainter: (userfunc: Function, kind: string) => void;
    /** @summary Indicates that is is Root6 pad painter
     * @private */
    private isRoot6;
    /** @summary Returns SVG element for the pad itself
     * @private */
    private svg_this_pad;
    /** @summary Returns main painter on the pad
      * @desc Typically main painter is TH1/TH2 object which is drawing axes
     * @private */
    private getMainPainter;
    /** @summary Assign main painter on the pad
      * @desc Typically main painter is TH1/TH2 object which is drawing axes
     * @private */
    private setMainPainter;
    main_painter_ref: any;
    /** @summary get pad width */
    getPadWidth(): any;
    /** @summary get pad height */
    getPadHeight(): any;
    /** @summary get pad rect */
    getPadRect(): {
        x: number;
        y: number;
        width: any;
        height: any;
    };
    /** @summary Returns frame coordiantes - also when frame is not drawn */
    getFrameRect(): any;
    /** @summary return RPad object */
    getRootPad(is_root6: any): any;
    /** @summary Cleanup primitives from pad - selector lets define which painters to remove */
    cleanPrimitives(selector: any): void;
    /** @summary returns custom palette associated with pad or top canvas
      * @private */
    private getCustomPalette;
    /** @summary Returns number of painters
      * @private */
    private getNumPainters;
    /** @summary Call function for each painter in pad
      * @param {function} userfunc - function to call
      * @param {string} kind - "all" for all objects (default), "pads" only pads and subpads, "objects" only for object in current pad
      * @private */
    private forEachPainterInPad;
    /** @summary register for pad events receiver
      * @desc in pad painter, while pad may be drawn without canvas */
    registerForPadEvents(receiver: any): void;
    pad_events_receiver: any;
    /** @summary Generate pad events, normally handled by GED
     * @desc in pad painter, while pad may be drawn without canvas
      * @private */
    private producePadEvent;
    /** @summary method redirect call to pad events receiver */
    selectObjectPainter(_painter: any, pos: any, _place: any): void;
    /** @summary Draw pad active border
     * @private */
    private drawActiveBorder;
    is_active_pad: any;
    /** @summary Create SVG element for canvas */
    createCanvasSvg(check_resize: any, new_size: any): boolean;
    _pad_x: number;
    _pad_y: number;
    _pad_width: any;
    _pad_height: any;
    _fast_drawing: boolean;
    /** @summary Draw item name on canvas if gStyle.fOptFile is configured
      * @private */
    private drawItemNameOnCanvas;
    /** @summary Enlarge pad draw element when possible */
    enlargePad(evnt: any): void;
    /** @summary Create main SVG element for pad
      * @returns true when pad is displayed and all its items should be redrawn */
    createPadSvg(only_resize: any): boolean;
    /** @summary Disable pad drawing
      * @desc Complete SVG element will be hidden */
    disablePadDrawing(): void;
    pad_draw_disabled: boolean;
    /** @summary Check if it is special object, which should be handled separately
      * @desc It can be TStyle or list of colors or palette object
      * @returns {boolean} tru if any */
    checkSpecial(obj: any): boolean;
    custom_palette: ColorPalette;
    /** @summary Check if special objects appears in primitives
      * @desc it could be list of colors or palette */
    checkSpecialsInPrimitives(can: any): void;
    /** @summary try to find object by name in list of pad primitives
      * @desc used to find title drawing
      * @private */
    private findInPrimitives;
    /** @summary Try to find painter for specified object
      * @desc can be used to find painter for some special objects, registered as
      * histogram functions
      * @param {object} selobj - object to which painter should be search, set null to ignore parameter
      * @param {string} [selname] - object name, set to null to ignore
      * @param {string} [seltype] - object type, set to null to ignore
      * @returns {object} - painter for specified object (if any)
      * @private */
    private findPainterFor;
    /** @summary Return true if any objects beside sub-pads exists in the pad */
    hasObjectsToDraw(): boolean;
    /** @summary sync drawing/redrawing/resize of the pad
      * @param {string} kind - kind of draw operation, if true - always queued
      * @returns {Promise} when pad is ready for draw operation or false if operation already queued
      * @private */
    private syncDraw;
    _doing_draw: {
        kind: string;
    }[];
    /** @summary indicates if painter performing objects draw
      * @private */
    private doingDraw;
    /** @summary confirms that drawing is completed, may trigger next drawing immediately
      * @private */
    private confirmDraw;
    /** @summary Draw single primitive */
    drawObject(): Promise<any>;
    /** @summary Draw pad primitives
      * @returns {Promise} when drawing completed
      * @private */
    private drawPrimitives;
    _start_tm: number;
    _num_primitives: any;
    /** @summary Divide pad on subpads
      * @returns {Promise} when finished
      * @private */
    private divide;
    /** @summary Return sub-pads painter, only direct childs are checked
      * @private */
    private getSubPadPainter;
    /** @summary Process tooltip event in the pad
      * @private */
    private processPadTooltipEvent;
    /** @summary Changes canvas dark mode
      * @private */
    private changeDarkMode;
    /** @summary Show pad context menu
      * @private */
    private padContextMenu;
    /** @summary Redraw pad means redraw ourself
      * @returns {Promise} when redrawing ready */
    redrawPad(reason: any): Promise<any>;
    /** @summary redraw pad */
    redraw(reason: any): void;
    /** @summary Checks if pad should be redrawn by resize
      * @private */
    private needRedrawByResize;
    /** @summary Check resize of canvas
      * @returns {Promise} with result */
    checkCanvasResize(size: any, force: any): Promise<any>;
    /** @summary Update TPad object */
    updateObject(obj: any): boolean;
    /** @summary Add object painter to list of primitives
      * @private */
    private addObjectPainter;
    /** @summary Function called when drawing next snapshot from the list
      * @returns {Promise} for drawing of the snap
      * @private */
    private drawNextSnap;
    _snaps_map: {};
    /** @summary Return painter with specified id
      * @private */
    private findSnap;
    /** @summary Redraw pad snap
      * @desc Online version of drawing pad primitives
      * for the canvas snapshot contains list of objects
      * as first entry, graphical properties of canvas itself is provided
      * in ROOT6 it also includes primitives, but we ignore them
      * @returns {Promise} with pad painter when drawing completed
      * @private */
    private redrawPadSnap;
    _readonly: any;
    _fixed_size: boolean;
    brlayout: BrowserLayout;
    _highlight_connect: any;
    /** @summary Create image for the pad
      * @desc Used with web-based canvas to create images for server side
      * @returns {Promise} with image data, coded with btoa() function
      * @private */
    private createImage;
    /** @summary Collects pad information for TWebCanvas
      * @desc need to update different states
      * @private */
    private getWebPadOptions;
    /** @summary returns actual ranges in the pad, which can be applied to the server
      * @private */
    private getPadRanges;
    /** @summary Show context menu for specified item
      * @private */
    private itemContextMenu;
    /** @summary Save pad in specified format
      * @desc Used from context menu */
    saveAs(kind: any, full_canvas: any, filename: any): void;
    /** @summary Prodce image for the pad
      * @returns {Promise} with created image */
    produceImage(full_canvas: any, file_format: any): Promise<any>;
    /** @summary Process pad button click */
    clickPadButton(funcname: any, evnt: any): void;
    /** @summary Add button to the pad
      * @private */
    private addPadButton;
    _buttons: any[];
    /** @summary Show pad buttons
      * @private */
    private showPadButtons;
    /** @summary Add buttons for pad or canvas
      * @private */
    private addPadButtons;
    /** @summary Decode pad draw options
      * @private */
    private decodeOptions;
}
export namespace PadButtonsHandler {
    function alignButtons(btns: any, width: any, height: any): void;
    function alignButtons(btns: any, width: any, height: any): void;
    function findPadButton(keyname: any): string;
    function findPadButton(keyname: any): string;
    function removePadButtons(): void;
    function removePadButtons(): void;
    function showPadButtons(): void;
    function showPadButtons(): void;
    function assign(painter: any): void;
    function assign(painter: any): void;
}
import { ObjectPainter } from "../base/ObjectPainter.mjs";
import { ColorPalette } from "../base/colors.mjs";
import { BrowserLayout } from "../gui/display.mjs";
