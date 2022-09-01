/** @summary Ensure RCanvas and RFrame for the painter object
  * @param {Object} painter  - painter object to process
  * @param {string|boolean} frame_kind  - false for no frame or "3d" for special 3D mode
  * @desc Assigns DOM, creates and draw RCanvas and RFrame if necessary, add painter to pad list of painters
  * @returns {Promise} for ready */
export function ensureRCanvas(painter: any, frame_kind: string | boolean): Promise<any>;
/** @summary draw RPadSnapshot object
  * @private */
export function drawRPadSnapshot(dom: any, snap: any): Promise<RCanvasPainter>;
/** @summary Function used for direct draw of RFrameTitle
  * @private */
export function drawRFrameTitle(reason: any, drag: any): any;
/** @summary draw RFont object
  * @private */
export function drawRFont(): boolean;
/** @summary draw RAxis object
  * @private */
export function drawRAxis(dom: any, obj: any, opt: any): Promise<RAxisPainter>;
/** @summary draw RFrame object
  * @private */
export function drawRFrame(dom: any, obj: any, opt: any): Promise<RFramePainter>;
import { RObjectPainter } from "../base/RObjectPainter.mjs";
import { RPadPainter } from "./RPadPainter.mjs";
/**
 * @summary Painter class for RCanvas
 *
 * @private
 */
export class RCanvasPainter extends RPadPainter {
    /** @summary draw RCanvas object */
    static draw(dom: any, can: any): any;
    /** @summary constructor */
    constructor(dom: any, canvas: any);
    _websocket: any;
    tooltip_allowed: boolean;
    v7canvas: boolean;
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
    proj_painter: number;
    /** @summary Draw projection for specified histogram
      * @private */
    private drawProjection;
    /** @summary Draw in side panel
      * @private */
    private drawInSidePanel;
    /** @summary Checks if canvas shown inside ui5 widget
      * @desc Function should be used only from the func which supposed to be replaced by ui5
      * @private */
    private testUI5;
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
    /** @summary Send message via web socket
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
    /** @summary Hanler for websocket message
      * @private */
    private onWebsocketMsg;
    /** @summary Submit request to RDrawable object on server side */
    submitDrawableRequest(kind: any, req: any, painter: any, method: any): any;
    _nextreqid: number;
    _submreq: {};
    /** @summary Submit menu request
      * @private */
    private submitMenuRequest;
    /** @summary Submit executable command for given painter */
    submitExec(painter: any, exec: any, subelem: any): void;
    /** @summary Process reply from request to RDrawable */
    processDrawableReply(msg: any): boolean;
    /** @summary Show specified section in canvas */
    showSection(that: any, on: any): Promise<boolean>;
    /** @summary Method informs that something was changed in the canvas
      * @desc used to update information on the server (when used with web6gui)
      * @private */
    private processChanges;
    /** @summary Handle pad button click event
      * @private */
    private clickPadButton;
    /** @summary returns true when event status area exist for the canvas */
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
    /** @summary produce JSON for RCanvas, which can be used to display canvas once again
      * @private */
    private produceJSON;
}
import { RAxisPainter } from "./RAxisPainter.mjs";
import { RFramePainter } from "./RFramePainter.mjs";
export { RObjectPainter, RPadPainter };
