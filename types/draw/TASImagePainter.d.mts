/**
 * @summary Painter for TASImage object.
 *
 * @private
 */
export class TASImagePainter extends ObjectPainter {
    /** @summary Draw TASImage object */
    static draw(dom: any, obj: any, opt: any): Promise<TASImagePainter>;
    /** @summary Decode options string  */
    decodeOptions(opt: any): void;
    /** @summary Create RGBA buffers */
    createRGBA(nlevels: any): any[];
    /** @summary Create url using image buffer
      * @private */
    private makeUrlFromImageBuf;
    rgba: any[];
    fContour: {
        arr: any[];
        rgba: any[];
        getLevels(): any[];
        getPaletteColor(pal: any, zval: any): string;
    };
    makeUrlFromPngBuf(obj: any): Promise<{
        url: string;
        constRatio: boolean;
    }>;
    /** @summary Draw image */
    drawImage(): Promise<any>;
    wheel_zoomy: boolean;
    /** @summary Checks if it makes sense to zoom inside specified axis range */
    canZoomInside(axis: any, min: any, max: any): boolean;
    /** @summary Draw color palette
      * @private */
    private drawColorPalette;
    draw_palette: any;
    fPalette: boolean;
    /** @summary Toggle colz draw option
      * @private */
    private toggleColz;
    /** @summary Redraw image */
    redraw(reason: any): Promise<any>;
    /** @summary Process click on TASImage-defined buttons */
    clickButton(funcname: any): boolean;
    /** @summary Fill pad toolbar for TASImage */
    fillToolbar(): void;
}
import { ObjectPainter } from "../base/ObjectPainter.mjs";
