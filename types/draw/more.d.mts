/** @summary Draw TText
  * @private */
export function drawText(): any;
export class drawText {
    isndc: boolean;
    pos_x: any;
    pos_y: any;
    pos_dx: number;
    pos_dy: number;
    moveDrag: (dx: any, dy: any) => void;
    moveEnd: (not_changed: any) => void;
}
/** @summary Draw TLine
  * @private */
export function drawTLine(dom: any, obj: any): Promise<void>;
/** @summary Draw TPolyLine
  * @private */
export function drawPolyLine(): void;
/** @summary Draw TEllipse
  * @private */
export function drawEllipse(): void;
/** @summary Draw TPie
  * @private */
export function drawPie(): void;
/** @summary Draw TBox
  * @private */
export function drawBox(): void;
/** @summary Draw TMarker
  * @private */
export function drawMarker(): void;
/** @summary Draw TPolyMarker
  * @private */
export function drawPolyMarker(): void;
/** @summary Draw JS image
  * @private */
export function drawJSImage(dom: any, obj: any, opt: any): BasePainter;
import { BasePainter } from "../base/BasePainter.mjs";
