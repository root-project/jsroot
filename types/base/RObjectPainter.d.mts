export class RObjectPainter extends ObjectPainter {
    constructor(dom: any, obj: any, opt: any, csstype: any);
    csstype: any;
    /** @summary Evaluate v7 attributes using fAttr storage and configured RStyle */
    v7EvalAttr(name: any, dflt: any): any;
    /** @summary Set v7 attributes value */
    v7SetAttr(name: any, value: any): void;
    /** @summary Decode pad length from string, return pixel value */
    v7EvalLength(name: any, sizepx: any, dflt: any): any;
    /** @summary Evaluate RColor using attribute storage and configured RStyle */
    v7EvalColor(name: any, dflt: any): any;
    _auto_colors: {};
    /** @summary Evaluate RAttrText properties
      * @returns {Object} FontHandler, can be used directly for the text drawing */
    v7EvalFont(name: any, dflts: any, fontScale: any): any;
    /** @summary Create this.fillatt object based on v7 fill attributes */
    createv7AttFill(prefix: any): void;
    /** @summary Create this.lineatt object based on v7 line attributes */
    createv7AttLine(prefix: any): void;
    /** @summary Create this.markeratt object based on v7 attributes */
    createv7AttMarker(prefix: any): void;
    /** @summary Create RChangeAttr, which can be applied on the server side
      * @private */
    private v7AttrChange;
    /** @summary Sends accumulated attribute changes to server */
    v7SendAttrChanges(req: any, do_update: any): void;
    /** @summary Submit request to server-side drawable
     * @param kind defines request kind, only single request a time can be submitted
     * @param req is object derived from DrawableRequest, including correct _typename
     * @param method is method of painter object which will be called when getting reply */
    v7SubmitRequest(kind: any, req: any, method: any): any;
    _pending_request: {
        kind: any;
        req: any;
        method: any;
    };
    /** @summary Return communication mode with the server
      * @desc
      * kOffline means no server there,
      * kLessTraffic advise not to send commands if offline functionality available
      * kNormal is standard functionality with RCanvas on server side */
    v7CommMode(): 1 | 3;
    v7NormalMode(): boolean;
    v7OfflineMode(): boolean;
}
import { ObjectPainter } from "./ObjectPainter.mjs";
