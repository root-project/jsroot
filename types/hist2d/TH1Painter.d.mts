/**
 * @summary Painter for TH1 classes
 * @private
 */
export class TH1Painter extends THistPainter {
    /** @summary draw TH1 object */
    static draw(dom: any, histo: any, opt: any): Promise<any>;
    /** @summary Convert TH1K into normal binned histogram */
    convertTH1K(): void;
    /** @summary Scan content of 1-D histogram
      * @desc Detect min/max values for x and y axis
      * @param {boolean} when_axis_changed - true when zooming was changed, some checks may be skipped */
    scanContent(when_axis_changed: boolean): void;
    scan_xleft: any;
    scan_xright: number;
    stat_entries: any;
    hmin: number;
    hmax: number;
    ymin_nz: number;
    zoom_ymin: any;
    zoom_ymax: any;
    wheel_zoomy: boolean;
    /** @summary Count histogram statistic */
    countStat(cond: any): {
        name: any;
        meanx: number;
        meany: number;
        rmsx: number;
        rmsy: number;
        integral: number;
        entries: any;
        xmax: number;
        wmax: number;
    };
    /** @summary Fill stat box */
    fillStatistic(stat: any, dostat: any, dofit: any): boolean;
    /** @summary Draw histogram as bars */
    drawBars(height: any, pmain: any, funcs: any): Promise<any>;
    /** @summary Draw histogram as filled errors */
    drawFilledErrors(funcs: any): void;
    /** @summary Draw TH1 bins in SVG element
      * @returns Promise or scalar value */
    draw1DBins(): void | Promise<any>;
    /** @summary Provide text information (tooltips) for histogram bin */
    getBinTooltips(bin: any): string[];
    /** @summary Process tooltip event */
    processTooltipEvent(pnt: any): {
        name: any;
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
    /** @summary Rebin histogram, used via context menu */
    rebinHist(sz: any): void;
    /** @summary Perform automatic zoom inside non-zero region of histogram */
    autoZoom(): any;
    /** @summary Checks if it makes sense to zoom inside specified axis range */
    canZoomInside(axis: any, min: any, max: any): boolean;
    /** @summary Call drawing function depending from 3D mode */
    callDrawFunc(reason: any): Promise<any>;
    /** @summary Performs 2D drawing of histogram
      * @returns {Promise} when ready */
    draw2D(): Promise<any>;
    /** @summary Should performs 3D drawing of histogram
      * @desc Disable in 2D case, just draw with default options
      * @returns {Promise} when ready */
    draw3D(reason: any): Promise<any>;
    /** @summary Redraw histogram */
    redraw(reason: any): Promise<any>;
}
import { THistPainter } from "./THistPainter.mjs";
