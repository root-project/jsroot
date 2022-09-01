/**
  * @summary Painter for TF1 object
  *
  * @private
  */
export class TF1Painter extends ObjectPainter {
    /** @summary draw TF1 object */
    static draw(dom: any, tf1: any, opt: any): Promise<TF1Painter>;
    /** @summary Create bins for TF1 drawing */
    createBins(ignore_zoom: any): {
        x: any;
        y: any;
    }[];
    /** @summary Create histogram for axes drawing */
    createDummyHisto(): any;
    updateObject(obj: any): boolean;
    /** @summary Process tooltip event */
    processTooltipEvent(pnt: any): {
        name: any;
        title: any;
        x: any;
        y: any;
        color1: any;
        color2: any;
        lines: any[];
        exact: boolean;
    };
    bins: {
        x: any;
        y: any;
    }[];
    /** @summary Checks if it makes sense to zoom inside specified axis range */
    canZoomInside(axis: any, min: any, max: any): boolean;
}
export function proivdeEvalPar(obj: any): void;
import { ObjectPainter } from "../base/ObjectPainter.mjs";
