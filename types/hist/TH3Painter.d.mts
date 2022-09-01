/**
 * @summary Painter for TH3 classes
 * @private
 */
export class TH3Painter extends THistPainter {
    /** @summary draw TH3 object */
    static draw(dom: any, histo: any, opt: any): Promise<TH3Painter>;
    /** @summary Scan TH3 histogram content */
    scanContent(when_axis_changed: any): void;
    gminbin: any;
    gmaxbin: any;
    /** @summary Count TH3 statistic */
    countStat(): {
        name: any;
        entries: number;
        integral: number;
        meanx: number;
        meany: number;
        meanz: number;
        rmsx: number;
        rmsy: number;
        rmsz: number;
    };
    /** @summary Fill TH3 statistic in stat box */
    fillStatistic(stat: any, dostat: any, dofit: any): boolean;
    /** @summary Provide text information (tooltips) for histogram bin */
    getBinTooltips(ix: any, iy: any, iz: any): string[];
    /** @summary draw 3D histogram as scatter plot
      * @desc If there are too many points, box will be displayed */
    draw3DScatter(): any;
    /** @summary Drawing of 3D histogram */
    draw3DBins(): any;
    /** @summary Redraw TH3 histogram */
    redraw(reason: any): Promise<TH3Painter>;
    /** @summary Fill pad toolbar with TH3-related functions */
    fillToolbar(): void;
    /** @summary Checks if it makes sense to zoom inside specified axis range */
    canZoomInside(axis: any, min: any, max: any): boolean;
    /** @summary Perform automatic zoom inside non-zero region of histogram */
    autoZoom(): any;
    /** @summary Fill histogram context menu */
    fillHistContextMenu(menu: any): void;
}
import { THistPainter } from "../hist2d/THistPainter.mjs";
