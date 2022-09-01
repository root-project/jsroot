/** @summary Base painter class for RHist objects
 *
 * @private
 */
export class RHistPainter extends RObjectPainter {
    /** @summary Constructor
      * @param {object|string} dom - DOM element for drawing or element id
      * @param {object} histo - RHist object */
    constructor(dom: object | string, histo: object);
    csstype: string;
    draw_content: boolean;
    nbinsx: number;
    nbinsy: number;
    accept_drops: boolean;
    mode3d: boolean;
    /** @summary Returns true if RHistDisplayItem is used */
    isDisplayItem(): boolean;
    /** @summary get histogram */
    getHisto(force: any): any;
    /** @summary Decode options */
    decodeOptions(): void;
    /** @summary Copy draw options from other painter */
    copyOptionsFrom(src: any): void;
    /** @summary copy draw options to all other histograms in the pad*/
    copyOptionsToOthers(): void;
    /** @summary Clear 3d drawings - if any */
    clear3DScene(): void;
    /** @summary Returns histogram dimension */
    getDimension(): number;
    /** @summary Scan histogram content
      * @abstract */
    scanContent(): void;
    /** @summary Draw axes */
    drawFrameAxes(): any;
    /** @summary create attributes */
    createHistDrawAttributes(): void;
    /** @summary update display item */
    updateDisplayItem(obj: any, src: any): boolean;
    /** @summary update histogram object */
    updateObject(obj: any): boolean;
    histogram_updated: boolean;
    /** @summary Get axis object */
    getAxis(name: any): any;
    /** @summary Get tip text for axis bin */
    getAxisBinTip(name: any, bin: any, step: any): any;
    /** @summary Extract axes ranges and bins numbers
      * @desc Also here ensured that all axes objects got their necessary methods */
    extractAxesProperties(ndim: any): void;
    nbinsz: any;
    xmin: any;
    xmax: any;
    ymin: any;
    ymax: any;
    zmin: any;
    zmax: any;
    /** @summary Add interactive features, only main painter does it */
    addInteractivity(): any;
    /** @summary Process item reply */
    processItemReply(reply: any, req: any): void;
    /** @summary Special method to request bins from server if existing data insufficient
      * @returns {Promise} when ready */
    drawingBins(reason: any): Promise<any>;
    current_item_reqid: any;
    /** @summary Toggle stat box drawing
      * @desc Not yet implemented */
    toggleStat(): void;
    /** @summary get selected index for axis */
    getSelectIndex(axis: any, size: any, add: any): number;
    /** @summary Auto zoom into histogram non-empty range
      * @abstract */
    autoZoom(): void;
    /** @summary Process click on histogram-defined buttons */
    clickButton(funcname: any): boolean;
    /** @summary Fill pad toolbar with hist-related functions */
    fillToolbar(not_shown: any): void;
    /** @summary get tool tips used in 3d mode */
    get3DToolTip(indx: any): {
        bin: any;
        name: any;
        title: any;
    };
    /** @summary Create contour levels for currently selected Z range */
    createContour(main: any, palette: any, args: any): void;
    /** @summary Start dialog to modify range of axis where histogram values are displayed */
    changeValuesRange(menu: any, arg: any): void;
    /** @summary Update palette drawing */
    updatePaletteDraw(): void;
    /** @summary Fill menu entries for palette */
    fillPaletteMenu(menu: any): void;
    /** @summary Toggle 3D drawing mode */
    toggleMode3D(): void;
    /** @summary Calculate histogram inidicies and axes values for each visible bin */
    prepareDraw(args: any): {
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
    maxbin: any;
    minbin: any;
    minposbin: any;
}
import { RObjectPainter } from "../base/RObjectPainter.mjs";
