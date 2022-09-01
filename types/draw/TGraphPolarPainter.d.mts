/**
 * @summary Painter for TGraphPolargram objects.
 *
 * @private */
export class TGraphPolargramPainter extends ObjectPainter {
    /** @summary Draw TGraphPolargram */
    static draw(dom: any, polargram: any): any;
    /** @summary Create painter
      * @param {object|string} dom - DOM element for drawing or element id
      * @param {object} polargram - object to draw */
    constructor(dom: object | string, polargram: object);
    $polargram: boolean;
    zoom_rmin: number;
    zoom_rmax: number;
    /** @summary Translate coordinates */
    translate(angle: any, radius: any, keep_float: any): {
        x: number;
        y: number;
        rx: any;
        ry: number;
    };
    /** @summary format label for radius ticks */
    format(radius: any): any;
    /** @summary Convert axis values to text */
    axisAsText(axis: any, value: any): any;
    /** @summary Returns coordinate of frame - without using frame itself */
    getFrameRect(): {
        szx: number;
        szy: number;
        width: number;
        height: number;
        x: number;
        y: number;
        hint_delta_x: number;
        hint_delta_y: number;
        transform: string;
    };
    /** @summary Process mouse event */
    mouseEvent(kind: any, evnt: any): void;
    /** @summary Process mouse wheel event */
    mouseWheel(evnt: any): void;
    /** @summary Redraw polargram */
    redraw(): Promise<void>;
    szx: any;
    szy: any;
    scale_rmin: any;
    scale_rmax: any;
    r: any;
    angle: any;
    gridatt: TAttLineHandler;
    ndig: number;
}
/**
 * @summary Painter for TGraphPolar objects.
 *
 * @private
 */
export class TGraphPolarPainter extends ObjectPainter {
    /** @summary Draw TGraphPolar */
    static draw(dom: any, graph: any, opt: any): Promise<TGraphPolarPainter>;
    /** @summary Decode options for drawing TGraphPolar */
    decodeOptions(opt: any): void;
    /** @summary Drawing TGraphPolar */
    drawGraphPolar(): void;
    /** @summary Create polargram object */
    createPolargram(): any;
    /** @summary Provide tooltip at specified point */
    extractTooltip(pnt: any): {
        name: any;
        title: any;
        x: any;
        y: any;
        color1: any;
        exact: boolean;
        lines: string[];
        binindx: number;
        menu_dist: number;
        radius: number;
    };
    /** @summary Show tooltip */
    showTooltip(hint: any): void;
    /** @summary Process tooltip event */
    processTooltipEvent(pnt: any): {
        name: any;
        title: any;
        x: any;
        y: any;
        color1: any;
        exact: boolean;
        lines: string[];
        binindx: number;
        menu_dist: number;
        radius: number;
    };
}
import { ObjectPainter } from "../base/ObjectPainter.mjs";
import { TAttLineHandler } from "../base/TAttLineHandler.mjs";
