/**
 * @summary Color palette handle
 *
 * @private
 */
export class ColorPalette {
    /** @summary constructor */
    constructor(arr: any);
    palette: any;
    /** @summary Returns color index which correspond to contour index of provided length */
    calcColorIndex(i: any, len: any): number;
    /** @summary Returns color with provided index */
    getColor(indx: any): any;
    /** @summary Returns number of colors in the palette */
    getLength(): any;
    /** @summary Calculate color for given i and len */
    calcColor(i: any, len: any): any;
}
/** @summary Return ROOT color by index
  * @desc Color numbering corresponds typical ROOT colors
  * @returns {String} with RGB color code or existing color name like 'cyan'
  * @private */
export function getColor(indx: any): string;
/** @summary Search for specified color in the list of colors
  * @returns Color index or -1 if fails
  * @private */
export function findColor(name: any): number;
/** @summary Add new color
  * @param {string} rgb - color name or just string with rgb value
  * @param {array} [lst] - optional colors list, to which add colors
  * @returns {number} index of new color
  * @private */
export function addColor(rgb: string, lst?: any[]): number;
/** @ummary Set global list of colors.
  * @desc Either TObjArray of TColor instances or just plain array with rgb() code.
  * List of colors typically stored together with TCanvas primitives
  * @private */
export function adoptRootColors(objarr: any): void;
/** @summary Get list of colors
  * @private */
export function getRootColors(): any[];
/** @summary Add new colors from object array
  * @private */
export function extendRootColors(jsarr: any, objarr: any): any;
/** @summary Produces rgb code for TColor object
  * @private */
export function getRGBfromTColor(col: any): string;
/** @summary Generates all root colors, used also in jstests to reset colors
  * @private */
export function createRootColors(): void;
/** @summary Covert value between 0 and 1 into hex, used for colors coding
  * @private */
export function toHex(num: any, scale: any): string;
