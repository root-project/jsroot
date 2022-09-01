/** @summary painter for RPalette
 *
 * @private
 */
export class RPalettePainter extends RObjectPainter {
    /** @summary draw RPalette object */
    static draw(dom: any, palette: any, opt: any): Promise<RPalettePainter>;
    /** @summary get palette */
    getHistPalette(): any;
    /** @summary Draw palette */
    drawPalette(drag: any): any;
}
/** @summary draw RText object
  * @private */
export function drawText(): any;
/** @summary draw RLine object
  * @private */
export function drawLine(): void;
/** @summary draw RBox object
  * @private */
export function drawBox(): void;
/** @summary draw RMarker object
  * @private */
export function drawMarker(): void;
import { RObjectPainter } from "../base/RObjectPainter.mjs";
