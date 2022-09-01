/**
 * @summary Painter for TH2 classes
 * @private
 */
export class TH2Painter extends THistPainter {
    /** @summary draw TH2 object */
    static draw(dom: any, histo: any, opt: any): Promise<any>;
    wheel_zoomy: boolean;
    _show_empty_bins: boolean;
    /** @summary Toggle projection */
    toggleProjection(kind: any, width: any): void;
    projection_width: any;
    is_projection: any;
    /** @summary Redraw projection */
    redrawProjection(ii1: any, ii2: any, jj1: any, jj2: any): any;
    proj_hist: any;
    /** @summary Execute TH2 menu command
      * @desc Used to catch standard menu items and provide local implementation */
    executeMenuCommand(method: any, args: any): boolean;
    /** @summary Fill histogram context menu */
    fillHistContextMenu(menu: any): void;
    /** @summary Fill pad toolbar with histogram-related functions */
    fillToolbar(): void;
    /** @summary Toggle color drawing mode */
    toggleColor(): void;
    _can_move_colz: boolean;
    /** @summary Perform automatic zoom inside non-zero region of histogram */
    autoZoom(): any;
    /** @summary Scan TH2 histogram content */
    scanContent(when_axis_changed: any): void;
    gminposbin: any;
    gminbin: any;
    gmaxbin: any;
    /** @summary Count TH2 histogram statistic
      * @desc Optionally one could provide condition function to select special range */
    countStat(cond: any): {
        name: any;
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
    /** @summary Fill TH2 statistic in stat box */
    fillStatistic(stat: any, dostat: any, dofit: any): boolean;
    /** @summary Draw TH2 bins as colors */
    drawBinsColor(): {
        i1: number;
        i2: number;
        j1: number;
        j2: number;
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
    drawBinsContour(): {
        i1: number;
        i2: number;
        j1: number;
        j2: number;
        min: number;
        max: number;
        sumz: number;
        xbar1: number;
        xbar2: number;
        ybar1: number;
        ybar2: number;
    };
    /** @summary Create poly bin */
    createPolyBin(funcs: any, bin: any, text_pos: any): string;
    /** @summary draw TH2Poly as color */
    drawPolyBinsColor(): Promise<{
        poly: boolean;
    }>;
    /** @summary Draw TH2 bins as text */
    drawBinsText(handle: any): Promise<any>;
    /** @summary Draw TH2 bins as arrows */
    drawBinsArrow(): {
        i1: number;
        i2: number;
        j1: number;
        j2: number;
        min: number;
        max: number;
        sumz: number;
        xbar1: number;
        xbar2: number;
        ybar1: number;
        ybar2: number;
    };
    /** @summary Draw TH2 bins as boxes */
    drawBinsBox(): {
        i1: number;
        i2: number;
        j1: number;
        j2: number;
        min: number;
        max: number;
        sumz: number;
        xbar1: number;
        xbar2: number;
        ybar1: number;
        ybar2: number;
    };
    /** @summary Draw histogram bins as candle plot */
    drawBinsCandle(): {
        i1: number;
        i2: number;
        j1: number;
        j2: number;
        min: number;
        max: number;
        sumz: number;
        xbar1: number;
        xbar2: number;
        ybar1: number;
        ybar2: number;
    };
    /** @summary Draw TH2 bins as scatter plot */
    drawBinsScatter(): {
        i1: number;
        i2: number;
        j1: number;
        j2: number;
        min: number;
        max: number;
        sumz: number;
        xbar1: number;
        xbar2: number;
        ybar1: number;
        ybar2: number;
    };
    /** @summary Draw TH2 bins in 2D mode */
    draw2DBins(): void | Promise<void>;
    tt_handle: any;
    /** @summary Draw TH2 in circular mode */
    drawBinsCircular(): Promise<any>;
    _hide_frame: boolean;
    /** @summary Draw histogram bins as chord diagram */
    drawBinsChord(): Promise<boolean>;
    /** @summary Provide text information (tooltips) for histogram bin */
    getBinTooltips(i: any, j: any): string[];
    /** @summary Provide text information (tooltips) for candle bin */
    getCandleTooltips(p: any): string[];
    /** @summary Provide text information (tooltips) for poly bin */
    getPolyBinTooltips(binindx: any, realx: any, realy: any): string[];
    /** @summary Process tooltip event */
    processTooltipEvent(pnt: any): {
        name: any;
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
    /** @summary Complete paletted drawing */
    completePalette(pp: any): any;
    /** @summary Performs 2D drawing of histogram
      * @returns {Promise} when ready */
    draw2D(): Promise<any>;
    /** @summary Should performs 3D drawing of histogram
      * @desc Disabled in 2D case. just draw default draw options
      * @returns {Promise} when ready */
    draw3D(reason: any): Promise<any>;
    /** @summary Call drawing function depending from 3D mode */
    callDrawFunc(reason: any): Promise<any>;
    /** @summary Redraw histogram */
    redraw(reason: any): Promise<any>;
}
import { THistPainter } from "./THistPainter.mjs";
