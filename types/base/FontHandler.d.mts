/**
 * @summary Helper class for font handling
 * @private
 */
export class FontHandler {
    /** @summary constructor */
    constructor(fontIndex: any, size: any, scale: any, name: any, style: any, weight: any);
    name: any;
    style: any;
    weight: any;
    scaled: boolean;
    size: number;
    scale: any;
    aver_width: number;
    isSymbol: any;
    func: any;
    /** @summary Assigns font-related attributes */
    setFont(selection: any, arg: any): void;
    /** @summary Set font size (optional) */
    setSize(size: any): void;
    /** @summary Set text color (optional) */
    setColor(color: any): void;
    color: any;
    /** @summary Set text align (optional) */
    setAlign(align: any): void;
    align: any;
    /** @summary Set text angle (optional) */
    setAngle(angle: any): void;
    angle: any;
    /** @summary Allign angle to step raster, add optional offset */
    roundAngle(step: any, offset: any): void;
    /** @summary Clears all font-related attributes */
    clearFont(selection: any): void;
    /** @summary Returns true in case of monospace font
      * @private */
    private isMonospace;
    /** @summary Return full font declaration which can be set as font property like "12pt Arial bold"
      * @private */
    private getFontHtml;
    /** @summary Returns font name */
    getFontName(): any;
}
