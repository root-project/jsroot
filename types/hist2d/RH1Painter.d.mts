/**
 * @summary Painter for RH1 classes
 *
 * @private
 */
export class RH1Painter extends RHistPainter {
    static _draw(painter: any, opt: any): Promise<any>;
    /** @summary draw RH1 object */
    static draw(dom: any, histo: any, opt: any): Promise<any>;
    wheel_zoomy: boolean;
    /** @summary Scan content */
    scanContent(when_axis_changed: any): void;
    scan_xleft: any;
    scan_xright: number;
    stat_entries: number;
    hmin: number;
    hmax: number;
    ymin_nz: number;
    /** @summary Count statistic */
    countStat(cond: any): {
        name: string;
        meanx: number;
        meany: number;
        rmsx: number;
        rmsy: number;
        integral: number;
        entries: number;
        xmax: number;
        wmax: number;
    };
    /** @summary Fill statistic */
    fillStatistic(stat: any, dostat: any): boolean;
    /** @summary Draw histogram as bars */
    drawBars(handle: any, funcs: any, width: any, height: any): Promise<boolean>;
    /** @summary Draw histogram as filled errors */
    drawFilledErrors(handle: any, funcs: any): Promise<boolean>;
    /** @summary Draw 1D histogram as SVG */
    draw1DBins(): Promise<any>;
    /** @summary Draw histogram bins */
    drawHistBins(handle: any, funcs: any, width: any, height: any): Promise<any>;
    /** @summary Provide text information (tooltips) for histogram bin */
    getBinTooltips(bin: any): string[];
    /** @summary Process tooltip event */
    processTooltipEvent(pnt: any): {
        name: string;
        title: any;
        x: number;
        y: number;
        exact: boolean;
        color1: any;
        color2: any;
        lines: string[];
    };
    /** @summary Fill histogram context menu */
    fillHistContextMenu(menu: any): void;
    /** @summary Perform automatic zoom inside non-zero region of histogram */
    autoZoom(): any;
    /** @summary Checks if it makes sense to zoom inside specified axis range */
    canZoomInside(axis: any, min: any, max: any): boolean;
    /** @summary Call appropriate draw function */
    callDrawFunc(reason: any): any;
    /** @summary Draw in 2d */
    draw2D(reason: any): any;
    /** @summary Draw in 3d */
    draw3D(reason: any): any;
    /** @summary Readraw histogram */
    redraw(reason: any): any;
}
import { RHistPainter } from "./RHistPainter.mjs";
