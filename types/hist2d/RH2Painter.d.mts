/**
 * @summary Painter for RH2 classes
 *
 * @private
 */
export class RH2Painter extends RHistPainter {
    static _draw(painter: any, opt: any): Promise<any>;
    /** @summary draw RH2 object */
    static draw(dom: any, obj: any, opt: any): Promise<any>;
    wheel_zoomy: boolean;
    /** @summary Toggle projection */
    toggleProjection(kind: any, width: any): void;
    projection_width: any;
    is_projection: any;
    /** @summary Readraw projections */
    redrawProjection(): void;
    /** @summary Execute menu command */
    executeMenuCommand(method: any, args: any): boolean;
    /** @summary Fill histogram context menu */
    fillHistContextMenu(menu: any): void;
    /** @summary Fill pad toolbar with RH2-related functions */
    fillToolbar(): void;
    /** @summary Toggle color drawing mode */
    toggleColor(): void;
    /** @summary Perform automatic zoom inside non-zero region of histogram */
    autoZoom(): any;
    /** @summary Scan content of 2-dim histogram */
    scanContent(when_axis_changed: any): void;
    gminbin: any;
    gminposbin: any;
    gmaxbin: any;
    /** @summary Count statistic */
    countStat(cond: any): {
        name: string;
        entries: number;
        integral: number;
        meanx: number;
        meany: number;
        rmsx: number;
        rmsy: number;
        matrix: number[];
        xmax: number;
        ymax: number;
        wmax: any;
    };
    /** @summary Fill statistic into statbox */
    fillStatistic(stat: any, dostat: any): boolean;
    /** @summary Draw histogram bins as color */
    drawBinsColor(): {
        i1: number;
        i2: number;
        j1: number;
        j2: number;
        k1: number;
        k2: number;
        stepi: number;
        stepj: number;
        stepk: number;
        min: number;
        max: number;
        sumz: number;
        xbar1: number;
        xbar2: number;
        ybar1: number;
        ybar2: number;
    };
    /** @summary Build histogram contour lines */
    buildContour(handle: any, levels: any, palette: any, contour_func: any): void;
    /** @summary Draw histogram bins as contour */
    drawBinsContour(funcs: any, frame_w: any, frame_h: any): {
        i1: number;
        i2: number;
        j1: number;
        j2: number;
        k1: number;
        k2: number;
        stepi: number;
        stepj: number;
        stepk: number;
        min: number;
        max: number;
        sumz: number;
        xbar1: number;
        xbar2: number;
        ybar1: number;
        ybar2: number;
    };
    /** @summary Create polybin */
    createPolyBin(pmain: any, bin: any, text_pos: any): string;
    /** @summary Draw RH2 bins as text */
    drawBinsText(handle: any): Promise<any>;
    /** @summary Draw RH2 bins as arrows */
    drawBinsArrow(): {
        i1: number;
        i2: number;
        j1: number;
        j2: number;
        k1: number;
        k2: number;
        stepi: number;
        stepj: number;
        stepk: number;
        min: number;
        max: number;
        sumz: number;
        xbar1: number;
        xbar2: number;
        ybar1: number;
        ybar2: number;
    };
    /** @summary Draw RH2 bins as boxes */
    drawBinsBox(): {
        i1: number;
        i2: number;
        j1: number;
        j2: number;
        k1: number;
        k2: number;
        stepi: number;
        stepj: number;
        stepk: number;
        min: number;
        max: number;
        sumz: number;
        xbar1: number;
        xbar2: number;
        ybar1: number;
        ybar2: number;
    };
    /** @summary Draw histogram bins as candle plot */
    drawBinsCandle(funcs: any, w: any): {
        i1: number;
        i2: number;
        j1: number;
        j2: number;
        k1: number;
        k2: number;
        stepi: number;
        stepj: number;
        stepk: number;
        min: number;
        max: number;
        sumz: number;
        xbar1: number;
        xbar2: number;
        ybar1: number;
        ybar2: number;
    };
    /** @summary Draw RH2 bins as scatter plot */
    drawBinsScatter(): {
        i1: number;
        i2: number;
        j1: number;
        j2: number;
        k1: number;
        k2: number;
        stepi: number;
        stepj: number;
        stepk: number;
        min: number;
        max: number;
        sumz: number;
        xbar1: number;
        xbar2: number;
        ybar1: number;
        ybar2: number;
    };
    /** @summary Draw RH2 bins in 2D mode */
    draw2DBins(): Promise<boolean> | Promise<RH2Painter>;
    tt_handle: any;
    /** @summary Provide text information (tooltips) for histogram bin */
    getBinTooltips(i: any, j: any): string[];
    /** @summary Provide text information (tooltips) for candle bin */
    getCandleTooltips(p: any): string[];
    /** @summary Provide text information (tooltips) for poly bin */
    getPolyBinTooltips(binindx: any, realx: any, realy: any): string[];
    /** @summary Process tooltip event */
    processTooltipEvent(pnt: any): {
        name: string;
        title: any;
        x: any;
        y: any;
        color1: any;
        color2: any;
        exact: boolean;
        menu: boolean;
        lines: string[];
    };
    /** @summary Checks if it makes sense to zoom inside specified axis range */
    canZoomInside(axis: any, min: any, max: any): boolean;
    /** @summary Performs 2D drawing of histogram
      * @returns {Promise} when ready */
    draw2D(reason: any): Promise<any>;
    /** @summary Performs 3D drawing of histogram
      * @returns {Promise} when ready */
    draw3D(reason: any): Promise<any>;
    /** @summary Call drawing function depending from 3D mode */
    callDrawFunc(reason: any): Promise<any>;
    /** @summary Redraw histogram */
    redraw(reason: any): Promise<any>;
}
import { RHistPainter } from "./RHistPainter.mjs";
