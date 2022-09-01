/**
  * @summary Handle for fill attributes
  * @private
  */
export class TAttFillHandler {
    /** @summary constructor
      * @param {object} args - arguments see {@link TAttFillHandler#setArgs} for more info
      * @param {number} [args.kind = 2] - 1 means object drawing where combination fillcolor==0 and fillstyle==1001 means no filling,  2 means all other objects where such combination is white-color filling */
    constructor(args: {
        kind?: number;
    });
    color: string;
    colorindx: number;
    pattern: number;
    used: boolean;
    kind: number;
    changed: boolean;
    func: any;
    /** @summary Set fill style as arguments
      * @param {object} args - different arguments to set fill attributes
      * @param {object} [args.attr] - TAttFill object
      * @param {number} [args.color] - color id
      * @param {number} [args.pattern] - filll pattern id
      * @param {object} [args.svg] - SVG element to store newly created patterns
      * @param {string} [args.color_as_svg] - color in SVG format */
    setArgs(args: {
        attr?: object;
        color?: number;
        pattern?: number;
        svg?: object;
        color_as_svg?: string;
    }): void;
    /** @summary Apply fill style to selection */
    apply(selection: any): void;
    /** @summary Returns fill color (or pattern url) */
    getFillColor(): string;
    /** @summary Returns fill color without pattern url.
      * @desc If empty, alternative color will be provided
      * @param {string} [altern] - alternative color which returned when fill color not exists
      * @private */
    private getFillColorAlt;
    /** @summary Returns true if color not specified or fill style not specified */
    empty(): boolean;
    /** @summary Returns true if fill attributes has real color */
    hasColor(): boolean;
    /** @summary Set solid fill color as fill pattern
      * @param {string} col - solid color */
    setSolidColor(col: string): void;
    /** @summary Check if solid fill is used, also color can be checked
      * @param {string} [solid_color] - when specified, checks if fill color matches */
    isSolid(solid_color?: string): boolean;
    /** @summary Method used when color or pattern were changed with OpenUi5 widgets
      * @private */
    private verifyDirectChange;
    /** @summary Method to change fill attributes.
      * @param {number} color - color index
      * @param {number} pattern - pattern index
      * @param {selection} svg - top canvas element for pattern storages
      * @param {string} [color_as_svg] - when color is string, interpret as normal SVG color
      * @param {object} [painter] - when specified, used to extract color by index */
    change(color: number, pattern: number, svg: selection, color_as_svg?: string, painter?: object): boolean;
    pattern_url: string;
    opacity: number;
    antialias: boolean;
    /** @summary Create sample of fill pattern inside SVG
      * @private */
    private createSample;
    /** @summary Save fill attributes to style
      * @private */
    private saveToStyle;
}
