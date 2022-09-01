/** @summary Ensure TCanvas and TFrame for the painter object
  * @param {Object} painter  - painter object to process
  * @param {string|boolean} frame_kind  - false for no frame or "3d" for special 3D mode
  * @desc Assign dom, creates TCanvas if necessary, add to list of pad painters */
export function ensureTCanvas(painter: any, frame_kind: string | boolean): Promise<any>;
/** @summary draw TPad snapshot from TWebCanvas
  * @private */
export function drawTPadSnapshot(dom: any, snap: any): Promise<TCanvasPainter>;
/** @summary draw TGaxis object
  * @private */
export function drawTGaxis(dom: any, obj: any, opt: any): Promise<TAxisPainter>;
/** @summary draw TGaxis object
  * @private */
export function drawTFrame(dom: any, obj: any, opt: any): Promise<TFramePainter>;
import { TPadPainter } from "./TPadPainter.mjs";
/**
  * @summary Painter for TCanvas object
  *
  * @private
  */
export class TCanvasPainter extends TPadPainter {
    /** @summary draw TCanvas */
    static draw(dom: any, can: any, opt: any): Promise<TCanvasPainter>;
    /** @summary Constructor */
    constructor(dom: any, canvas: any);
    _websocket: any;
    tooltip_allowed: boolean;
    /** @summary Returns layout kind */
    getLayoutKind(): any;
    /** @summary Set canvas layout kind */
    setLayoutKind(kind: any, main_selector: any): void;
    _changed_layout: boolean;
    /** @summary Changes layout
      * @returns {Promise} indicating when finished */
    changeLayout(layout_kind: any, mainid: any): Promise<any>;
    /** @summary Toggle projection
      * @returns {Promise} indicating when ready
      * @private */
    private toggleProjection;
    proj_painter: any;
    /** @summary Draw projection for specified histogram
      * @private */
    private drawProjection;
    /** @summary Checks if canvas shown inside ui5 widget
      * @desc Function should be used only from the func which supposed to be replaced by ui5
      * @private */
    private testUI5;
    /** @summary Draw in side panel
      * @private */
    private drawInSidePanel;
    /** @summary Show message
      * @desc Used normally with web-based canvas and handled in ui5
      * @private */
    private showMessage;
    /** @summary Function called when canvas menu item Save is called */
    saveCanvasAsFile(fname: any): void;
    /** @summary Send command to server to save canvas with specified name
      * @desc Should be only used in web-based canvas
      * @private */
    private sendSaveCommand;
    /** @summary Submit menu request
      * @private */
    private submitMenuRequest;
    _getmenu_callback: (value: any) => void;
    /** @summary Submit object exec request
      * @private */
    private submitExec;
    /** @summary Send text message with web socket
      * @desc used for communication with server-side of web canvas
      * @private */
    private sendWebsocket;
    /** @summary Close websocket connection to canvas
      * @private */
    private closeWebsocket;
    /** @summary Use provided connection for the web canvas
      * @private */
    private useWebsocket;
    /** @summary Hanler for websocket open event
      * @private */
    private onWebsocketOpened;
    /** @summary Hanler for websocket close event
      * @private */
    private onWebsocketClosed;
    /** @summary Handle websocket messages
      * @private */
    private onWebsocketMsg;
    /** @summary Handle pad button click event */
    clickPadButton(funcname: any, evnt: any): void | Promise<any>;
    /** @summary Returns true if event status shown in the canvas */
    hasEventStatus(): any;
    /** @summary Show/toggle event status bar
      * @private */
    private activateStatusBar;
    /** @summary Returns true if GED is present on the canvas */
    hasGed(): boolean;
    /** @summary Function used to de-activate GED
      * @private */
    private removeGed;
    /** @summary Function used to activate GED
      * @returns {Promise} when GED is there
      * @private */
    private activateGed;
    ged_view: any;
    /** @summary Show section of canvas  like menu or editor */
    showSection(that: any, on: any): Promise<any>;
    /** @summary Complete handling of online canvas drawing
      * @private */
    private completeCanvasSnapDrawing;
    _all_sections_showed: boolean;
    /** @summary Handle highlight in canvas - delver information to server
      * @private */
    private processHighlightConnect;
    _last_highlight_msg: any;
    /** @summary Method informs that something was changed in the canvas
      * @desc used to update information on the server (when used with web6gui)
      * @private */
    private processChanges;
    /** @summary Select active pad on the canvas */
    selectActivePad(pad_painter: any, obj_painter: any, click_pos: any): void;
    /** @summary Return actual TCanvas status bits  */
    getStatusBits(): number;
    /** @summary produce JSON for TCanvas, which can be used to display canvas once again */
    produceJSON(): string;
}
import { TAxisPainter } from "./TAxisPainter.mjs";
import { TFramePainter } from "./TFramePainter.mjs";
export { TPadPainter };
