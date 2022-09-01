/**
  * @summary Handle for marker attributes
  * @private
  */
export class TAttMarkerHandler {
    /** @summary constructor
      * @param {object} args - attributes, see {@link TAttMarkerHandler#setArgs} for details */
    constructor(args: object);
    x0: number;
    y0: number;
    color: string;
    style: number;
    size: number;
    scale: number;
    stroke: boolean;
    fill: boolean;
    marker: string;
    ndig: number;
    used: boolean;
    changed: boolean;
    func: any;
    /** @summary Set marker attributes.
      * @param {object} args - arguments can be
      * @param {object} args.attr - instance of TAttrMarker (or derived class) or
      * @param {string} args.color - color in HTML form like grb(1,4,5) or 'green'
      * @param {number} args.style - marker style
      * @param {number} args.size - marker size
      * @param {number} [args.refsize] - when specified and marker size < 1, marker size will be calculated relative to that size */
    setArgs(args: {
        attr: object;
        color: string;
        style: number;
        size: number;
        refsize?: number;
    }): void;
    refsize: number;
    /** @summary Reset position, used for optimization of drawing of multiple markers
     * @private */
    private resetPos;
    lastx: any;
    lasty: any;
    /** @summary Create marker path for given position.
      * @desc When drawing many elementary points, created path may depend from previously produced markers.
      * @param {number} x - first coordinate
      * @param {number} y - second coordinate
      * @returns {string} path string */
    create(x: number, y: number): string;
    /** @summary Returns full size of marker */
    getFullSize(): number;
    /** @summary Returns approximate length of produced marker string */
    getMarkerLength(): number;
    /** @summary Change marker attributes.
     *  @param {string} color - marker color
     *  @param {number} style - marker style
     *  @param {number} size - marker size */
    change(color: string, style: number, size: number): void;
    /** @summary Prepare object to create marker
      * @private */
    private _configure;
    optimized: boolean;
    /** @summary get stroke color */
    getStrokeColor(): string;
    /** @summary get fill color */
    getFillColor(): string;
    /** @summary returns true if marker attributes will produce empty (invisible) output */
    empty(): boolean;
    /** @summary Apply marker styles to created element */
    apply(selection: any): void;
    /** @summary Method used when color or pattern were changed with OpenUi5 widgets.
     * @private */
    private verifyDirectChange;
    /** @summary Create sample with marker in given SVG element
      * @param {selection} svg - SVG element
      * @param {number} width - width of sample SVG
      * @param {number} height - height of sample SVG
      * @private */
    private createSample;
}
