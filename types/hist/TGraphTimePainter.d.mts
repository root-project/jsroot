/**
 * @summary Painter for TGraphTime object
 *
 * @private
 */
export class TGraphTimePainter extends ObjectPainter {
    /** @summary Draw TGraphTime object */
    static draw(dom: any, gr: any, opt: any): Promise<any>;
    /** @summary Decode drawing options */
    decodeOptions(opt: any): void;
    /** @summary Draw primitives */
    drawPrimitives(indx: any): any;
    _doing_primitives: boolean;
    /** @summary Continue drawing */
    continueDrawing(): void;
    wait_animation_frame: boolean;
    step: number;
    running_timeout: NodeJS.Timeout;
    /** @ummary Start drawing of graph time */
    startDrawing(): any;
}
import { ObjectPainter } from "../base/ObjectPainter.mjs";
