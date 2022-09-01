/**
 * @summary Base class to manage multiple document interface for drawings
 *
 * @private
 */
export class MDIDisplay extends BasePainter {
    frameid: any;
    cleanupFrame: typeof cleanup;
    active_frame_title: string;
    /** @summary Assign func which called for each newly created frame */
    setInitFrame(func: any): void;
    initFrame: any;
    /** @summary method called before new frame is created */
    beforeCreateFrame(title: any): void;
    /** @summary method called after new frame is created
      * @private */
    private afterCreateFrame;
    /** @summary method dedicated to iterate over existing panels
      * @param {function} userfunc is called with arguments (frame)
      * @param {boolean} only_visible let select only visible frames */
    forEachFrame(userfunc: Function, only_visible: boolean): void;
    /** @summary method dedicated to iterate over existing panles
      * @param {function} userfunc is called with arguments (painter, frame)
      * @param {boolean} only_visible let select only visible frames */
    forEachPainter(userfunc: Function, only_visible: boolean): void;
    /** @summary Returns total number of drawings */
    numDraw(): number;
    /** @summary Serach for the frame using item name */
    findFrame(searchtitle: any, force: any): any;
    /** @summary Activate frame */
    activateFrame(frame: any): void;
    /** @summary Return active frame */
    getActiveFrame(): any;
    /** @summary perform resize for each frame
      * @protected */
    protected checkMDIResize(only_frame_id: any, size: any): void;
    /** @summary Cleanup all drawings */
    cleanup(): void;
}
/**
 * @summary Custom MDI display
 *
 * @desc All HTML frames should be created before and add via {@link CustomDisplay#addFrame} calls
 * @private
 */
export class CustomDisplay extends MDIDisplay {
    constructor();
    frames: {};
    addFrame(divid: any, itemname: any): void;
    forEachFrame(userfunc: any): void;
    createFrame(title: any): any;
}
/**
 * @summary Batch MDI display
 *
 * @desc Can be used together with hierarchy painter in node.js
 * @private
 */
export class BatchDisplay extends MDIDisplay {
    constructor(width: any, height: any, jsdom_body: any);
    frames: any[];
    width: any;
    height: any;
    jsdom_body: any;
    forEachFrame(userfunc: any): void;
    createFrame(title: any): any;
    /** @summary Returns number of created frames */
    numFrames(): number;
    /** @summary returns JSON representation if any
      * @desc Now works only for inspector, can be called once */
    makeJSON(id: any, spacing: any): string;
    /** @summary Create SVG for specified frame id */
    makeSVG(id: any): any;
}
/**
 * @summary Generic grid MDI display
 *
 * @private
 */
export class GridDisplay extends MDIDisplay {
    /** @summary Create GridDisplay instance
      * @param {string} frameid - where grid display is created
      * @param {string} kind - kind of grid
      * @desc  following kinds are supported
      *    - vertical or horizontal - only first letter matters, defines basic orientation
      *    - 'x' in the name disable interactive separators
      *    - v4 or h4 - 4 equal elements in specified direction
      *    - v231 -  created 3 vertical elements, first divided on 2, second on 3 and third on 1 part
      *    - v23_52 - create two vertical elements with 2 and 3 subitems, size ratio 5:2
      *    - gridNxM - normal grid layout without interactive separators
      *    - gridiNxM - grid layout with interactive separators
      *    - simple - no layout, full frame used for object drawings */
    constructor(frameid: string, kind: string, kind2: any);
    framecnt: number;
    getcnt: number;
    groups: any[];
    vertical: boolean;
    use_separarators: boolean;
    simple_layout: boolean;
    /** @summary Create frames group
      * @private */
    private createGroup;
    /** @summary Handle interactive sepearator movement
      * @private */
    private handleSeparator;
    /** @summary Create group separator
      * @private */
    private createSeparator;
    /** @summary Call function for each frame */
    forEachFrame(userfunc: any): void;
    /** @summary Returns number of frames in grid layout */
    numGridFrames(): number;
    /** @summary Return grid frame by its id */
    getGridFrame(id: any): any;
    /** @summary Create new frame */
    createFrame(title: any): any;
}
/**
 * @summary Tabs-based display
 *
 * @private
 */
export class TabsDisplay extends MDIDisplay {
    cnt: number;
    /** @summary call function for each frame */
    forEachFrame(userfunc: any, only_visible: any): void;
    /** @summary modify tab state by id */
    modifyTabsFrame(frame_id: any, action: any): void;
    /** @summary create new frame */
    createFrame(title: any): any;
}
/**
 * @summary Generic flexible MDI display
 *
 * @private
 */
export class FlexibleDisplay extends MDIDisplay {
    cnt: number;
    /** @summary call function for each frame */
    forEachFrame(userfunc: any, only_visible: any): void;
    /** @summary get frame state */
    getFrameState(frame: any): any;
    /** @summary returns frame rect */
    getFrameRect(frame: any): {
        x: number;
        y: number;
        w: any;
        h: any;
    };
    /** @summary change frame state */
    changeFrameState(frame: any, newstate: any, no_redraw: any): boolean;
    /** @summary handle button click
      * @private */
    private _clickButton;
    /** @summary create new frame */
    createFrame(title: any): any;
    /** @summary minimize all frames */
    minimizeAll(): void;
    /** @summary close all frames */
    closeAllFrames(): void;
    /** @summary cascade frames */
    sortFrames(kind: any): void;
    /** @summary context menu */
    showContextMenu(evnt: any): void;
}
/**
  * @summary Special browser layout
  *
  * @desc Contains three different areas for browser (left), status line (bottom) and central drawing
  * Main application is normal browser, but also used in other applications like ROOT6 canvas
  * @private
  */
export class BrowserLayout {
    /** @summary Constructor */
    constructor(id: any, hpainter: any, objpainter: any);
    gui_div: any;
    hpainter: any;
    objpainter: any;
    browser_kind: any;
    /** @summary Selects main element */
    main(): any;
    /** @summary Returns drawing divid */
    drawing_divid(): string;
    /** @summary Check resize action */
    checkResize(): void;
    /** @summary Create or update CSS style */
    createStyle(): void;
    /** @summary method used to create basic elements
      * @desc should be called only once */
    create(with_browser: any): void;
    /** @summary Create buttons in the layout */
    createBrowserBtns(): any;
    /** @summary Remove browser buttons */
    removeBrowserBtns(): void;
    /** @summary Set browser content */
    setBrowserContent(guiCode: any): void;
    /** @summary Check if there is browser content */
    hasContent(): boolean;
    /** @summary Delete content */
    deleteContent(): void;
    /** @summary Returns true when status line exists */
    hasStatus(): boolean;
    /** @summary Set browser title text
      * @desc Title also used for dragging of the float browser */
    setBrowserTitle(title: any): any;
    /** @summary Toggle browser kind
      * @desc used together with browser buttons */
    toggleKind(browser_kind: any): void;
    /** @summary Creates status line */
    createStatusLine(height: any, mode: any): Promise<string>;
    status_layout: string | GridDisplay;
    _hsepar_move: any;
    status_handler: any;
    /** @summary Adjust separator positions */
    adjustSeparators(vsepar: any, hsepar: any, redraw: any, first_time: any): void;
    last_hsepar_height: any;
    _hsepar_position: any;
    _vsepar_position: any;
    /** @summary Show status information inside special fields of browser layout */
    showStatus(...args: any[]): void;
    /** @summary Toggle browser visibility */
    toggleBrowserVisisbility(fast_close: any): void;
    browser_visible: any;
    /** @summary Adjust browser size */
    adjustBrowserSize(onlycheckmax: any): void;
    /** @summary Set buttons position */
    setButtonsPosition(): void;
    /** @summary Toggle browser kind */
    toggleBrowserKind(kind: any): Promise<any>;
    _float_left: number;
    _float_top: number;
    _max_left: number;
    _max_top: number;
    _float_width: number;
    _float_height: any;
    _max_width: number;
    _max_height: number;
    _vsepar_move: any;
}
/** @summary Returns current hierarchy painter object
  * @private */
export function getHPainter(): any;
/** @summary Set hierarchy painter object
  * @private */
export function setHPainter(hp: any): void;
import { BasePainter } from "../base/BasePainter.mjs";
import { cleanup } from "../base/ObjectPainter.mjs";
