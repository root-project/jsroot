/**
  * @summary Handle for line attributes
  * @private
  */
export class TAttLineHandler {
    /** @summary constructor
      * @param {object} attr - attributes, see {@link TAttLineHandler#setArgs} */
    constructor(args: any);
    func: any;
    used: boolean;
    /** @summary Set line attributes.
      * @param {object} args - specify attributes by different ways
      * @param {object} args.attr - TAttLine object with appropriate data members or
      * @param {string} args.color - color in html like rgb(255,0,0) or "red" or "#ff0000"
      * @param {number} args.style - line style number
      * @param {number} args.width - line width */
    setArgs(args: {
        attr: object;
        color: string;
        style: number;
        width: number;
    }): void;
    color_index: any;
    color: any;
    width: any;
    style: any;
    pattern: any;
    excl_side: any;
    excl_width: any;
    /** @summary Change exclusion attributes */
    changeExcl(side: any, width: any): void;
    changed: boolean;
    /** @summary returns true if line attribute is empty and will not be applied. */
    empty(): boolean;
    /** @summary set border parameters, used for rect drawing */
    setBorder(rx: any, ry: any): void;
    rx: any;
    ry: any;
    /** @summary Applies line attribute to selection.
      * @param {object} selection - d3.js selection */
    apply(selection: object): void;
    /** @summary Applies line and border attribute to selection.
      * @param {object} selection - d3.js selection */
    applyBorder(selection: object): void;
    /** @summary Change line attributes */
    change(color: any, width: any, style: any): void;
    /** @summary Create sample element inside primitive SVG - used in context menu */
    createSample(svg: any, width: any, height: any, plain: any): void;
    /** @summary Save attributes values to gStyle */
    saveToStyle(name_color: any, name_width: any, name_style: any): void;
}
/** @summary Get svg string for specified line style
  * @private */
export function getSvgLineStyle(indx: any): string;
export const root_line_styles: string[];
