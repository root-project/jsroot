/** @summary Returns visible rect of element
  * @param {object} elem - d3.select object with element
  * @param {string} [kind] - which size method is used
  * @desc kind = 'bbox' use getBBox, works only with SVG
  * kind = 'full' - full size of element, using getBoundingClientRect function
  * kind = 'nopadding' - excludes padding area
  * With node.js can use "width" and "height" attributes when provided in element
  * @private */
export function getElementRect(elem: object, sizearg: any): {
    x: number;
    y: number;
    width: number;
    height: number;
};
/** @summary Calculate absolute position of provided element in canvas
  * @private */
export function getAbsPosInCanvas(sel: any, pos: any): any;
/** @summary Draw options interpreter
  * @private */
export class DrawOptions {
    constructor(opt: any);
    opt: string;
    part: string;
    /** @summary Returns true if remaining options are empty or contain only seperators symbols. */
    empty(): boolean;
    /** @summary Returns remaining part of the draw options. */
    remain(): string;
    /** @summary Checks if given option exists */
    check(name: any, postpart: any): boolean;
    /** @summary Returns remaining part of found option as integer. */
    partAsInt(offset: any, dflt: any): any;
    /** @summary Returns remaining part of found option as float. */
    partAsFloat(offset: any, dflt: any): any;
}
/** @summary Simple random generator with controlled seed
  * @private */
export class TRandom {
    constructor(i: any);
    /** @summary Seed simple random generator */
    seed(i: any): void;
    m_w: any;
    m_z: any;
    /** @summary Produce random value between 0 and 1 */
    random(): number;
}
/** @summary Converts numeric value to string according to specified format.
  * @param {number} value - value to convert
  * @param {string} [fmt="6.4g"] - format can be like 5.4g or 4.2e or 6.4f
  * @param {boolean} [ret_fmt] - when true returns array with value and actual format like ["0.1","6.4f"]
  * @returns {string|Array} - converted value or array with value and actual format
  * @private */
export function floatToString(value: number, fmt?: string, ret_fmt?: boolean): string | any[];
/** @summary Function used to provide svg:path for the smoothed curves.
  * @desc reuse code from d3.js. Used in TH1, TF1 and TGraph painters
  * @param {string} kind  should contain "bezier" or "line".
  * If first symbol "L", then it used to continue drawing
  * @private */
export function buildSvgPath(kind: string, bins: any, height: any, ndig: any): {
    path: string;
    close: string;
};
/** @summary Compress SVG code, produced from drawing
  * @desc removes extra info or empty elements
  * @private */
export function compressSVG(svg: any): any;
/**
 * @summary Base painter class
 *
 */
export class BasePainter {
    /** @summary constructor
      * @param {object|string} [dom] - dom element or id of dom element */
    constructor(dom?: object | string);
    divid: any;
    /** @summary Assign painter to specified DOM element
      * @param {string|object} elem - element ID or DOM Element
      * @desc Normally DOM element should be already assigned in constructor
      * @protected */
    protected setDom(elem: string | object): void;
    /** @summary Returns assigned dom element */
    getDom(): any;
    /** @summary Selects main HTML element assigned for drawing
      * @desc if main element was layouted, returns main element inside layout
      * @param {string} [is_direct] - if 'origin' specified, returns original element even if actual drawing moved to some other place
      * @returns {object} d3.select object for main element for drawing */
    selectDom(is_direct?: string): object;
    _selected_main: any;
    /** @summary Access/change top painter
      * @private */
    private _accessTopPainter;
    /** @summary Set painter, stored in first child element
      * @desc Only make sense after first drawing is completed and any child element add to configured DOM
      * @protected */
    protected setTopPainter(): void;
    /** @summary Return top painter set for the selected dom element
      * @protected */
    protected getTopPainter(): any;
    /** @summary Clear reference on top painter
      * @protected */
    protected clearTopPainter(): void;
    /** @summary Generic method to cleanup painter
      * @desc Removes all visible elements and all internal data */
    cleanup(keep_origin: any): void;
    /** @summary Checks if draw elements were resized and drawing should be updated
      * @returns {boolean} true if resize was detected
      * @protected
      * @abstract */
    protected checkResize(): boolean;
    /** @summary Function checks if geometry of main div was changed.
      * @desc take into account enlarge state, used only in PadPainter class
      * @returns size of area when main div is drawn
      * @private */
    private testMainResize;
    /** @summary Try enlarge main drawing element to full HTML page.
      * @param {string|boolean} action  - defines that should be done
      * @desc Possible values for action parameter:
      *    - true - try to enlarge
      *    - false - revert enlarge state
      *    - 'toggle' - toggle enlarge state
      *    - 'state' - only returns current enlarge state
      *    - 'verify' - check if element can be enlarged
      * if action not specified, just return possibility to enlarge main div
      * @protected */
    protected enlargeMain(action: string | boolean, skip_warning: any): string | boolean;
    /** @summary Set item name, associated with the painter
      * @desc Used by {@link HierarchyPainter}
      * @private */
    private setItemName;
    _hitemname: string;
    _hdrawopt: string;
    _hpainter: any;
    /** @summary Returns assigned item name
      * @desc Used with {@link HierarchyPainter} to identify drawn item name */
    getItemName(): string;
    /** @summary Returns assigned item draw option
      * @desc Used with {@link HierarchyPainter} to identify drawn item option */
    getItemDrawOpt(): string;
}
/** @summary Load and initialize JSDOM from nodes
  * @returns {Promise} with d3 selection for d3_body
   * @private */
export function _loadJSDOM(): Promise<any>;
