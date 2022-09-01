/**
 * @summary Painter class for RPad
 *
 * @private
 */
export class RPadPainter extends RObjectPainter {
    /** @summary draw RPad object */
    static draw(dom: any, pad: any, opt: any): any;
    /** @summary constructor */
    constructor(dom: any, pad: any, iscan: any);
    pad: any;
    iscan: any;
    this_pad_name: string;
    painters: any[];
    has_canvas: boolean;
    forEachPainter: (userfunc: Function, kind: string) => void;
    /** @summary Indicates that is not Root6 pad painter
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
     * @private */
    private setMainPainter;
    main_painter_ref: any;
    pad_frame: any;
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
    /** @summary Cleanup primitives from pad - selector lets define which painters to remove
     * @private */
    private cleanPrimitives;
    /** @summary Try to find painter for specified object
      * @desc can be used to find painter for some special objects, registered as
      * histogram functions
      * @private */
    private findPainterFor;
    /** @summary Returns palette associated with pad.
      * @desc Either from existing palette painter or just default palette */
    getHistPalette(): any;
    fDfltPalette: {
        _typename: string;
        fColors: {
            fOrdinal: number;
            fColor: {
                fColor: string;
            };
        }[];
        fInterpolate: boolean;
        fNormalized: boolean;
    };
    /** @summary Returns number of painters
      * @private */
    private getNumPainters;
    /** @summary Call function for each painter in pad
      * @param {function} userfunc - function to call
      * @param {string} kind - "all" for all objects (default), "pads" only pads and subpads, "objects" only for object in current pad
      * @private */
    private forEachPainterInPad;
    /** @summary register for pad events receiver
      * @desc in pad painter, while pad may be drawn without canvas
      * @private */
    private registerForPadEvents;
    pad_events_receiver: any;
    /** @summary Generate pad events, normally handled by GED
      * @desc in pad painter, while pad may be drawn without canvas
      * @private */
    private producePadEvent;
    /** @summary method redirect call to pad events receiver */
    selectObjectPainter(_painter: any, pos: any, _place: any): void;
    /** @summary Create SVG element for the canvas */
    createCanvasSvg(check_resize: any, new_size: any): boolean;
    _pad_x: number;
    _pad_y: number;
    _pad_width: any;
    _pad_height: any;
    _fast_drawing: boolean;
    /** @summary Enlarge pad draw element when possible */
    enlargePad(evnt: any): void;
    /** @summary Create SVG element for the pad
      * @returns true when pad is displayed and all its items should be redrawn */
    createPadSvg(only_resize: any): boolean;
    /** @summary returns true if any objects beside sub-pads exists in the pad */
    hasObjectsToDraw(): boolean;
    /** @summary sync drawing/redrawing/resize of the pad
      * @param {string} kind - kind of draw operation, if true - always queued
      * @returns {Promise} when pad is ready for draw operation or false if operation already queued
      * @private */
    private syncDraw;
    _doing_draw: {
        kind: string;
    }[];
    /** @summary confirms that drawing is completed, may trigger next drawing immediately
      * @private */
    private confirmDraw;
    /** @summary Draw single primitive */
    drawObject(dom: any, obj: any, opt: any): Promise<any>;
    /** @summary Draw pad primitives
      * @private */
    private drawPrimitives;
    _start_tm: number;
    _num_primitives: any;
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
    redraw(reason: any): Promise<any>;
    /** @summary Checks if pad should be redrawn by resize
      * @private */
    private needRedrawByResize;
    /** @summary Check resize of canvas */
    checkCanvasResize(size: any, force: any): false | Promise<any>;
    /** @summary update RPad object
      * @private */
    private updateObject;
    /** @summary Add object painter to list of primitives
      * @private */
    private addObjectPainter;
    /** @summary Extract properties from TObjectDisplayItem */
    extractTObjectProp(snap: any): void;
    /** @summary Function called when drawing next snapshot from the list
      * @returns {Promise} with pad painter when ready
      * @private */
    private drawNextSnap;
    _snaps_map: {};
    _auto_color_cnt: number;
    next_rstyle: any;
    custom_palette: ColorPalette;
    /** @summary Search painter with specified snapid, also sub-pads are checked
      * @private */
    private findSnap;
    /** @summary Redraw pad snap
      * @desc Online version of drawing pad primitives
      * @returns {Promise} with pad painter*/
    redrawPadSnap(snap: any): Promise<any>;
    _fixed_size: boolean;
    brlayout: BrowserLayout;
    /** @summary Create image for the pad
      * @desc Used with web-based canvas to create images for server side
      * @returns {Promise} with image data, coded with btoa() function
      * @private */
    private createImage;
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
    /** @summary Add buttons for pad or canvas
      * @private */
    private addPadButtons;
    /** @summary Show pad buttons
      * @private */
    private showPadButtons;
    /** @summary Calculates RPadLength value */
    getPadLength(vertical: any, len: any, frame_painter: any): number;
    /** @summary Calculates pad position for RPadPos values
      * @param {object} pos - instance of RPadPos
      * @param {object} frame_painter - if drawing will be performed inside frame, frame painter */
    getCoordinate(pos: object, frame_painter: object): {
        x: number;
        y: number;
    };
    /** @summary Decode pad draw options */
    decodeOptions(opt: any): void;
}
import { RObjectPainter } from "../base/RObjectPainter.mjs";
import { ColorPalette } from "../base/colors.mjs";
import { BrowserLayout } from "../gui/display.mjs";
