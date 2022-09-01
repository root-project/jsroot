/**
 * @summary Painter for RH3 classes
 *
 * @private
 */
export class RH3Painter extends RHistPainter {
    /** @summary draw RH3 object */
    static draw(dom: any, histo: any): Promise<any>;
    scanContent(when_axis_changed: any): void;
    gminbin: any;
    gminposbin: any;
    gmaxbin: any;
    /** @summary Count histogram statistic */
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
    /** @summary Fill statistic */
    fillStatistic(stat: any, dostat: any): boolean;
    /** @summary Provide text information (tooltips) for histogram bin */
    getBinTooltips(ix: any, iy: any, iz: any): string[];
    /** @summary Try to draw 3D histogram as scatter plot
      * @desc If there are too many points, returns promise with false */
    draw3DScatter(handle: any): any;
    /** @summary Drawing of 3D histogram */
    draw3DBins(handle: any): boolean;
    draw3D(): any;
    /** @summary Redraw histogram*/
    redraw(reason: any): any;
    /** @summary Fill pad toolbar with RH3-related functions */
    fillToolbar(): void;
    /** @summary Checks if it makes sense to zoom inside specified axis range */
    canZoomInside(axis: any, min: any, max: any): boolean;
    /** @summary Perform automatic zoom inside non-zero region of histogram */
    autoZoom(): any;
    /** @summary Fill histogram context menu */
    fillHistContextMenu(menu: any): void;
}
/** @summary draw RHistDisplayItem  object
  * @private */
export function drawHistDisplayItem(dom: any, obj: any, opt: any): Promise<any>;
import { RHistPainter } from "../hist2d/RHistPainter.mjs";
