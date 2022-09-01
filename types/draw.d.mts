/** @summary Register draw function for the class
  * @desc List of supported draw options could be provided, separated  with ';'
  * @param {object} args - arguments
  * @param {string|regexp} args.name - class name or regexp pattern
  * @param {function} [args.func] - draw function
  * @param {function} [args.draw] - async function to load draw function
  * @param {function} [args.class] - async function to load painter class with static draw function
  * @param {boolean} [args.direct] - if true, function is just Redraw() method of ObjectPainter
  * @param {string} [args.opt] - list of supported draw options (separated with semicolon) like "col;scat;"
  * @param {string} [args.icon] - icon name shown for the class in hierarchy browser
  * @param {string} [args.draw_field] - draw only data member from object, like fHistogram
  * @protected */
export function addDrawFunc(args: {
    name: string | regexp;
    func?: Function;
    draw?: Function;
    class?: Function;
    direct?: boolean;
    opt?: string;
    icon?: string;
    draw_field?: string;
}): {
    name: string | regexp;
    func?: Function;
    draw?: Function;
    class?: Function;
    direct?: boolean;
    opt?: string;
    icon?: string;
    draw_field?: string;
};
/** @summary return draw handle for specified item kind
  * @desc kind could be ROOT.TH1I for ROOT classes or just
  * kind string like "Command" or "Text"
  * selector can be used to search for draw handle with specified option (string)
  * or just sequence id
  * @private */
export function getDrawHandle(kind: any, selector: any): any;
/** @summary Returns true if handle can be potentially drawn
  * @private */
export function canDrawHandle(h: any): boolean;
/** @summary Provide draw settings for specified class or kind
  * @private */
export function getDrawSettings(kind: any, selector: any): {
    opts: any;
    inspect: boolean;
    expand: boolean;
    draw: boolean;
    handle: any;
};
/** @summary Set default draw option for provided class */
export function setDefaultDrawOpt(classname: any, opt: any): void;
/** @summary Draw object in specified HTML element with given draw options.
  * @param {string|object} dom - id of div element to draw or directly DOMElement
  * @param {object} obj - object to draw, object type should be registered before with {@link addDrawFunc}
  * @param {string} opt - draw options separated by space, comma or semicolon
  * @returns {Promise} with painter object
  * @public
  * @desc An extensive list of support draw options can be found on [examples page]{@link https://root.cern/js/latest/examples.htm}
  * @example
  * let file = await openFile("https://root.cern/js/files/hsimple.root");
  * let obj = await file.readObject("hpxpy;1");
  * await draw("drawing", obj, "colz;logx;gridx;gridy"); */
export function draw(dom: string | object, obj: object, opt: string): Promise<any>;
/** @summary Redraw object in specified HTML element with given draw options.
  * @param {string|object} dom - id of div element to draw or directly DOMElement
  * @param {object} obj - object to draw, object type should be registered before with {@link addDrawFunc}
  * @param {string} opt - draw options
  * @returns {Promise} with painter object
  * @desc If drawing was not done before, it will be performed with {@link draw}.
  * Otherwise drawing content will be updated
  * @public */
export function redraw(dom: string | object, obj: object, opt: string): Promise<any>;
import { cleanup } from "./base/ObjectPainter.mjs";
/** @summary Create SVG image for provided object.
  * @desc Function especially useful in Node.js environment to generate images for
  * supported ROOT classes
  * @param {object} args - contains different settings
  * @param {object} args.object - object for the drawing
  * @param {string} [args.option] - draw options
  * @param {number} [args.width = 1200] - image width
  * @param {number} [args.height = 800] - image height
  * @returns {Promise} with svg code */
export function makeSVG(args: {
    object: object;
    option?: string;
    width?: number;
    height?: number;
}): Promise<any>;
/** @summary Draw TRooPlot
  * @private */
export function drawRooPlot(dom: any, plot: any): Promise<any>;
export function assignPadPainterDraw(PadPainterClass: any): void;
export { cleanup };
