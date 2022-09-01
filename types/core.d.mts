/** @summary version id
  * @desc For the JSROOT release the string in format "major.minor.patch" like "7.0.0" */
export let version_id: string;
/** @summary version date
  * @desc Release date in format day/month/year like "19/11/2021" */
export let version_date: string;
/** @summary version id and date
  * @desc Produced by concatenation of {@link version_id} and {@link version_date}
  * Like "7.0.0 14/04/2022" */
export let version: string;
/** @summary Location of JSROOT scripts
  * @desc Automatically detected and used to load other scripts or modules */
export let source_dir: string;
/** @summary Indicates if running inside Node.js */
export function isNodeJs(): boolean;
/** @summary Indicates if running in batch mode */
export function isBatchMode(): boolean;
/** @summary Set batch mode */
export function setBatchMode(on: any): void;
export namespace browser {
    const isFirefox: boolean;
    const isSafari: boolean;
    const isChrome: boolean;
    const isWin: boolean;
    const touches: boolean;
}
export namespace internals {
    const id_counter: number;
}
export namespace constants {
    namespace Render3D {
        const Default: number;
        const WebGL: number;
        const WebGLImage: number;
        const SVG: number;
        function fromString(s: any): number;
        function fromString(s: any): number;
    }
    namespace Embed3D {
        export const NoEmbed: number;
        const Default_1: number;
        export { Default_1 as Default };
        export const Overlay: number;
        export const Embed: number;
        export const EmbedSVG: number;
        /** @summary Convert string values into number  */
        export function fromString(s: any): number;
        /** @summary Convert string values into number  */
        export function fromString(s: any): number;
    }
    namespace Latex {
        const Off: number;
        const Symbols: number;
        const Normal: number;
        const MathJax: number;
        const AlwaysMathJax: number;
        /** @summary Convert string values into number */
        function fromString(s: any): number;
        /** @summary Convert string values into number */
        function fromString(s: any): number;
    }
}
export namespace settings {
    import Render3D_1 = Default;
    export { Render3D_1 as Render3D };
    import Render3DBatch = Default;
    export { Render3DBatch };
    import Embed3D_1 = Default;
    export { Embed3D_1 as Embed3D };
    export const Tooltip: boolean;
    export const TooltipAnimation: number;
    export const ContextMenu: boolean;
    export const Zooming: boolean;
    export const ZoomMouse: boolean;
    export const ZoomWheel: boolean;
    export const ZoomTouch: boolean;
    export const MoveResize: boolean;
    export const HandleKeys: boolean;
    export const DragAndDrop: boolean;
    export const DragGraphs: boolean;
    export const ProgressBox: boolean;
    export const ToolBar: string;
    export const ToolBarSide: string;
    export const ToolBarVert: boolean;
    export const CanEnlarge: boolean;
    export const CanAdjustFrame: boolean;
    export const ApproxTextSize: boolean;
    export const OptimizeDraw: number;
    export const AutoStat: boolean;
    export namespace FrameNDC {
        const fX1NDC: number;
        const fY1NDC: number;
        const fX2NDC: number;
        const fY2NDC: number;
    }
    export namespace SmallPad {
        const width: number;
        const height: number;
    }
    export const Palette: number;
    import Latex_1 = Normal;
    export { Latex_1 as Latex };
    export const GeoGradPerSegm: number;
    export const GeoCompressComp: boolean;
    export const IgnoreUrlOptions: boolean;
    export const HierarchyLimit: number;
    export const XValuesFormat: any;
    export const YValuesFormat: any;
    export const ZValuesFormat: any;
    export const HandleWrongHttpResponse: boolean;
    export const UseStamp: boolean;
    export const MaxRanges: number;
    export const SkipStreamerInfos: boolean;
    export const OnlyLastCycle: boolean;
    export const DarkMode: boolean;
}
export namespace gStyle {
    const fName: string;
    const fOptLogx: number;
    const fOptLogy: number;
    const fOptLogz: number;
    const fOptDate: number;
    const fOptFile: number;
    const fDateX: number;
    const fDateY: number;
    const fOptTitle: number;
    const fCanvasColor: number;
    const fPadColor: number;
    const fPadBottomMargin: number;
    const fPadTopMargin: number;
    const fPadLeftMargin: number;
    const fPadRightMargin: number;
    const fPadGridX: boolean;
    const fPadGridY: boolean;
    const fPadTickX: number;
    const fPadTickY: number;
    const fStatColor: number;
    const fStatStyle: number;
    const fStatTextColor: number;
    const fStatFontSize: number;
    const fStatFont: number;
    const fStatBorderSize: number;
    const fStatFormat: string;
    const fStatX: number;
    const fStatY: number;
    const fStatW: number;
    const fStatH: number;
    const fTitleAlign: number;
    const fTitleColor: number;
    const fTitleTextColor: number;
    const fTitleBorderSize: number;
    const fTitleFont: number;
    const fTitleFontSize: number;
    const fTitleStyle: number;
    const fTitleX: number;
    const fTitleY: number;
    const fTitleW: number;
    const fTitleH: number;
    const fFitFormat: string;
    const fOptStat: number;
    const fOptFit: number;
    const fNumberContours: number;
    const fGridColor: number;
    const fGridStyle: number;
    const fGridWidth: number;
    const fFrameFillColor: number;
    const fFrameFillStyle: number;
    const fFrameLineColor: number;
    const fFrameLineWidth: number;
    const fFrameLineStyle: number;
    const fFrameBorderSize: number;
    const fFrameBorderMode: number;
    const fEndErrorSize: number;
    const fErrorX: number;
    const fHistMinimumZero: boolean;
    const fHistTopMargin: number;
    const fHistFillColor: number;
    const fHistFillStyle: number;
    const fHistLineColor: number;
    const fHistLineStyle: number;
    const fHistLineWidth: number;
    const fPaintTextFormat: string;
    const fTimeOffset: number;
    const fLegendBorderSize: number;
    const fLegendFont: number;
    const fLegendTextSize: number;
    const fLegendFillColor: number;
    const fHatchesLineWidth: number;
    const fHatchesSpacing: number;
}
export function atob_func(str: any): string;
export function btoa_func(str: any): string;
/** @summary Check if prototype string match to array (typed on untyped)
  * @returns {Number} 0 - not array, 1 - regular array, 2 - typed array
  * @private */
export function isArrayProto(proto: any): number;
/** @summary Method returns current document in use
  * @private */
export function getDocument(): any;
/** @summary Generate mask for given bit
  * @param {number} n bit number
  * @returns {Number} produced mask
  * @private */
export function BIT(n: number): number;
/** @summary Make deep clone of the object, including all sub-objects
  * @returns {object} cloned object
  * @private */
export function clone(src: any, map: any, nofunc: any): object;
/** @summary Adds specific methods to the object.
  * @desc JSROOT implements some basic methods for different ROOT classes.
  * @param {object} obj - object where methods are assigned
  * @param {string} [typename] - optional typename, if not specified, obj._typename will be used
  * @private */
export function addMethods(obj: object, typename?: string): void;
/** @summary Should be used to parse JSON string produced with TBufferJSON class
  * @desc Replace all references inside object like { "$ref": "1" }
  * @param {object|string} json  object where references will be replaced
  * @returns {object} parsed object */
export function parse(json: object | string): object;
/** @summary Parse response from multi.json request
  * @desc Method should be used to parse JSON code, produced by multi.json request of THttpServer
  * @param {string} json string to parse
  * @returns {Array} array of parsed elements */
export function parseMulti(json: string): any[];
/** @summary Method converts JavaScript object into ROOT-like JSON
  * @desc Produced JSON can be used in parse() again
  * When performed properly, JSON can be used in [TBufferJSON::fromJSON()]{@link https://root.cern/doc/master/classTBufferJSON.html#a2ecf0daacdad801e60b8093a404c897d} method to read data back with C++
  * @param {object} obj - JavaScript object to convert
  * @param {number} [spacing] - optional line spacing in JSON
  * @returns {string} produced JSON code */
export function toJSON(obj: object, spacing?: number): string;
/** @summary decodes URL options after '?' mark
  * @desc Following options supported ?opt1&opt2=3
  * @param {string} [url] URL string with options, document.URL will be used when not specified
  * @returns {Object} with ```.has(opt)``` and ```.get(opt,dflt)``` methods
  * @example
  * let d = decodeUrl("any?opt1&op2=3");
  * console.log(`Has opt1 ${d.has("opt1")}`);     // true
  * console.log(`Get opt1 ${d.get("opt1")}`);     // ""
  * console.log(`Get opt2 ${d.get("opt2")}`);     // "3"
  * console.log(`Get opt3 ${d.get("opt3","-")}`); // "-" */
export function decodeUrl(url?: string): any;
/** @summary Find function with given name
  * @private */
export function findFunction(name: any): any;
/** @summary Method to create http request, without promise can be used only in browser environment
  * @private */
export function createHttpRequest(url: any, kind: any, user_accept_callback: any, user_reject_callback: any, use_promise: any): Promise<any> | XMLHttpRequest;
/** @summary Submit asynchronoues http request
  * @desc Following requests kind can be specified:
  *    - "bin" - abstract binary data, result as string
  *    - "buf" - abstract binary data, result as ArrayBuffer (default)
  *    - "text" - returns req.responseText
  *    - "object" - returns parse(req.responseText)
  *    - "multi" - returns correctly parsed multi.json request
  *    - "xml" - returns req.responseXML
  *    - "head" - returns request itself, uses "HEAD" request method
  *    - "post" - creates post request, submits req.send(post_data)
  *    - "postbuf" - creates post request, expectes binary data as response
  * @param {string} url - URL for the request
  * @param {string} kind - kind of requested data
  * @param {string} [post_data] - data submitted with post kind of request
  * @returns {Promise} Promise for requested data, result type depends from the kind
  * @example
  * httpRequest("https://root.cern/js/files/thstack.json.gz", "object")
  *       .then(obj => console.log(`Get object of type ${obj._typename}`))
  *       .catch(err => console.error(err.message)); */
export function httpRequest(url: string, kind: string, post_data?: string): Promise<any>;
/** @summary Load script or CSS file into the browser
  * @param {String} url - script or css file URL (or array, in this case they all loaded secuentially)
  * @returns {Promise} */
export function loadScript(url: string): Promise<any>;
/** @summary Inject javascript code
  * @desc Replacement for eval
  * @returns {Promise} when code is injected
  * @private */
export function injectCode(code: any): Promise<any>;
/** @summary Create some ROOT classes
  * @desc Supported classes: `TObject`, `TNamed`, `TList`, `TAxis`, `TLine`, `TText`, `TLatex`, `TPad`, `TCanvas`
  * @param {string} typename - ROOT class name
  * @example
  * import { create } from 'path_to_jsroot/modules/core.mjs';
  * let obj = create("TNamed");
  * obj.fName = "name";
  * obj.fTitle = "title"; */
export function create(typename: string, target: any): any;
/** @summary Create histogram object of specified type
  * @param {string} typename - histogram typename like 'TH1I' or 'TH2F'
  * @param {number} nbinsx - number of bins on X-axis
  * @param {number} [nbinsy] - number of bins on Y-axis (for 2D/3D histograms)
  * @param {number} [nbinsz] - number of bins on Z-axis (for 3D histograms)
  * @returns {Object} created histogram object
  * @example
  * let h1 = createHistogram("TH1I", 20);
  * h1.fName = "Hist1";
  * h1.fTitle = "Histogram title";
  * h1.fXaxis.fTitle = "xaxis";
  * h1.fYaxis.fTitle = "yaxis";
  * h1.fXaxis.fLabelSize = 0.02; */
export function createHistogram(typename: string, nbinsx: number, nbinsy?: number, nbinsz?: number): any;
/** @summary Creates TPolyLine object
  * @param {number} npoints - number of points
  * @param {boolean} [use_int32] - use Int32Array type for points, default is Float32Array */
export function createTPolyLine(npoints: number, use_int32?: boolean): any;
/** @summary Creates TGraph object
  * @param {number} npoints - number of points in TGraph
  * @param {array} [xpts] - array with X coordinates
  * @param {array} [ypts] - array with Y coordinates */
export function createTGraph(npoints: number, xpts?: any[], ypts?: any[]): any;
/** @summary Creates THStack object
  * @desc As arguments one could specify any number of histograms objects
  * @example
  * let nbinsx = 20;
  * let h1 = createHistogram("TH1F", nbinsx);
  * let h2 = createHistogram("TH1F", nbinsx);
  * let h3 = createHistogram("TH1F", nbinsx);
  * let stack = createTHStack(h1, h2, h3); */
export function createTHStack(...args: any[]): any;
/** @summary Creates TMultiGraph object
  * @desc As arguments one could specify any number of TGraph objects
  * @example
  * let gr1 = createTGraph(100);
  * let gr2 = createTGraph(100);
  * let gr3 = createTGraph(100);
  * let mgr = createTMultiGraph(gr1, gr2, gr3); */
export function createTMultiGraph(...args: any[]): any;
/** @summary Returns methods for given typename
  * @private */
export function getMethods(typename: any, obj: any): any;
/** @summary Add methods for specified type.
  * @desc Will be automatically applied when decoding JSON string
  * @private */
export function registerMethods(typename: any, m: any): void;
/** @summary Returns true if object represents basic ROOT collections
  * @desc Checks if type is TList or TObjArray or TClonesArray or TMap or THashList
  * @param {object} lst - object to check
  * @param {string} [typename] - or just typename to check
  * @private */
export function isRootCollection(lst: object, typename?: string): boolean;
/** @summary Check if object is a Promise
  * @private */
export function isPromise(obj: any): boolean;
/** @summary Ensure global JSROOT and v6 support methods
  * @private */
export function _ensureJSROOT(): Promise<any>;
