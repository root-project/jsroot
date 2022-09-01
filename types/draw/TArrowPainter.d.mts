/** @summary Drawing TArrow
  * @private */
export class TArrowPainter extends ObjectPainter {
    /** @summary Draw TArrow object */
    static draw(dom: any, obj: any, opt: any): Promise<TArrowPainter>;
    /** @summary Create line segment with rotation */
    rotate(angle: any, x0: any, y0: any): string;
    /** @summary Create SVG path for the arrow */
    createPath(): string;
    /** @summary Start interactive moving */
    moveStart(x: any, y: any): void;
    side: number;
    /** @summary Continue interactive moving */
    moveDrag(dx: any, dy: any): void;
    /** @summary Finish interactive moving */
    moveEnd(not_changed: any): void;
    /** @summary Redraw arrow */
    redraw(): TArrowPainter;
    wsize: number;
    isndc: any;
    angle2: number;
    beg: number;
    mid: number;
    end: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}
import { ObjectPainter } from "../base/ObjectPainter.mjs";
