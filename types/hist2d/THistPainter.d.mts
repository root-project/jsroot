/**
 * @summary Basic painter for histogram classes
 * @private
 */
export class THistPainter extends ObjectPainter {
    /** @summary generic draw function for histograms
      * @private */
    private static _drawHist;
    /** @summary Constructor
      * @param {object|string} dom - DOM element for drawing or element id
      * @param {object} histo - TH1 derived histogram object */
    constructor(dom: object | string, histo: object);
    draw_content: boolean;
    nbinsx: number;
    nbinsy: number;
    accept_drops: boolean;
    mode3d: boolean;
    hist_painter_id: number;
    /** @summary Returns histogram object */
    getHisto(): any;
    /** @summary Returns histogram axis */
    getAxis(name: any): any;
    /** @summary Returns true if TProfile */
    isTProfile(): any;
    /** @summary Returns true if TH1K */
    isTH1K(): any;
    /** @summary Returns true if TH2Poly */
    isTH2Poly(): any;
    /** @summary Clear 3d drawings - if any */
    clear3DScene(): void;
    /** @summary Returns number of histogram dimensions */
    getDimension(): 1 | 0 | 2 | 3;
    /** @summary Decode options string opt and fill the option structure */
    decodeOptions(opt: any): void;
    /** @summary Copy draw options from other painter */
    copyOptionsFrom(src: any): void;
    /** @summary copy draw options to all other histograms in the pad */
    copyOptionsToOthers(): void;
    /** @summary Scan histogram content
      * @abstract */
    scanContent(): void;
    /** @summary Check pad ranges when drawing of frame axes will be performed */
    checkPadRange(use_pad: any): void;
    check_pad_range: string | boolean;
    /** @summary Generates automatic color for some objects painters */
    createAutoColor(numprimitives: any): any;
    _auto_color: any;
    /** @summary Create necessary histogram draw attributes */
    createHistDrawAttributes(): void;
    /** @summary Assign snapid for histo painter
      * @desc Used to assign snapid also for functions painters */
    setSnapId(snapid: any): void;
    /** @summary Update histogram object
      * @param obj - new histogram instance
      * @param opt - new drawing option (optional)
      * @returns {Boolean} - true if histogram was successfully updated */
    updateObject(obj: any, opt: any): boolean;
    histogram_updated: boolean;
    /** @summary Extract axes bins and ranges
      * @desc here functions are defined to convert index to axis value and back
      * was introduced to support non-equidistant bins */
    extractAxesProperties(ndim: any): void;
    nbinsz: any;
    xmin: any;
    xmax: any;
    ymin: any;
    ymax: any;
    zmin: any;
    zmax: any;
    /** @summary Draw axes for histogram
      * @desc axes can be drawn only for main histogram */
    drawAxes(): any;
    /** @summary Toggle histogram title drawing */
    toggleTitle(arg: any): boolean;
    /** @summary Draw histogram title
      * @returns {Promise} with painter */
    drawHistTitle(): Promise<any>;
    /** @summary Live change and update of title drawing
      * @desc Used from the GED */
    processTitleChange(arg: any): any;
    /** @summary Update statistics when web canvas is drawn */
    updateStatWebCanvas(): void;
    /** @summary Find stats box
      * @desc either in list of functions or as object of correspondent painter */
    findStat(): any;
    /** @summary Toggle stat box drawing
      * @private */
    private toggleStat;
    /** @summary Returns true if stats box fill can be ingored */
    isIgnoreStatsFill(): boolean;
    /** @summary Create stat box for histogram if required */
    createStat(force: any): any;
    create_stats: boolean;
    /** @summary Find function in histogram list of functions */
    findFunction(type_name: any, obj_name: any): any;
    /** @summary Add function to histogram list of functions */
    addFunction(obj: any, asfirst: any): void;
    /** @summary Check if such function should be drawn directly */
    needDrawFunc(histo: any, func: any): boolean;
    /** @summary Method draws next function from the functions list
      * @returns {Promise} fulfilled when drawing is ready */
    drawNextFunction(indx: any): Promise<any>;
    /** @summary Returns selected index for specified axis
      * @desc be aware - here indexes starts from 0 */
    getSelectIndex(axis: any, side: any, add: any): number;
    /** @summary Unzoom user range if any */
    unzoomUserRange(dox: any, doy: any, doz: any): boolean;
    /** @summary Add different interactive handlers
      * @desc only first (main) painter in list allowed to add interactive functionality
      * Most of interactivity now handled by frame
      * @returns {Promise} for ready */
    addInteractivity(): Promise<any>;
    /** @summary Invoke dialog to enter and modify user range */
    changeUserRange(menu: any, arg: any): void;
    /** @summary Start dialog to modify range of axis where histogram values are displayed */
    changeValuesRange(menu: any): void;
    /** @summary Auto zoom into histogram non-empty range
      * @abstract */
    autoZoom(): void;
    /** @summary Process click on histogram-defined buttons */
    clickButton(funcname: any): boolean;
    /** @summary Fill pad toolbar with histogram-related functions */
    fillToolbar(not_shown: any): void;
    /** @summary Returns tooltip information for 3D drawings */
    get3DToolTip(indx: any): {
        bin: any;
        name: any;
        title: any;
    };
    /** @summary Create contour object for histogram */
    createContour(nlevels: any, zmin: any, zmax: any, zminpositive: any, custom_levels: any): HistContour;
    fContour: any;
    /** @summary Return contour object */
    getContour(force_recreate: any): any;
    /** @summary Return levels from contour object */
    getContourLevels(): any;
    /** @summary Returns color palette associated with histogram
      * @desc Create if required, checks pad and canvas for custom palette */
    getHistPalette(force: any): any;
    fPalette: any;
    /** @summary Fill menu entries for palette */
    fillPaletteMenu(menu: any): void;
    /** @summary draw color palette
      * @returns {Promise} when done */
    drawColorPalette(enabled: any, postpone_draw: any, can_move: any): Promise<any>;
    do_redraw_palette: boolean;
    /** @summary Toggle color z palette drawing */
    toggleColz(): Promise<any>;
    /** @summary Toggle 3D drawing mode */
    toggleMode3D(): void;
    /** @summary Prepare handle for color draw */
    prepareDraw(args: any): {
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
    maxbin: any;
    minbin: any;
    minposbin: any;
    /** @summary Get tip text for axis bin */
    getAxisBinTip(name: any, axis: any, bin: any): any;
}
import { ObjectPainter } from "../base/ObjectPainter.mjs";
/**
 * @summary Handle for histogram contour
 *
 * @private
 */
declare class HistContour {
    constructor(zmin: any, zmax: any);
    arr: any[];
    colzmin: any;
    colzmax: any;
    below_min_indx: number;
    exact_min_indx: number;
    /** @summary Returns contour levels */
    getLevels(): any[];
    /** @summary Create normal contour levels */
    createNormal(nlevels: any, log_scale: any, zminpositive: any): void;
    custom: boolean;
    /** @summary Create custom contour levels */
    createCustom(levels: any): void;
    /** @summary Configure indicies */
    configIndicies(below_min: any, exact_min: any): void;
    /** @summary Get index based on z value */
    getContourIndex(zc: any): number;
    /** @summary Get palette color */
    getPaletteColor(palette: any, zc: any): any;
    /** @summary Get palette index */
    getPaletteIndex(palette: any, zc: any): any;
}
export {};
