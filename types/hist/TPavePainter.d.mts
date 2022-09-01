/**
 * @summary painter for TPave-derived classes
 *
 * @private
 */
export class TPavePainter extends ObjectPainter {
    /** @summary Returns true if object is supported */
    static canDraw(obj: any): boolean;
    /** @summary Draw TPave */
    static draw(dom: any, pave: any, opt: any): Promise<any>;
    /** @summary constructor
      * @param {object|string} dom - DOM element for drawing or element id
      * @param {object} pave - TPave-based object */
    constructor(dom: object | string, pave: object);
    Enabled: boolean;
    UseContextMenu: boolean;
    UseTextColor: boolean;
    /** @summary Draw pave and content */
    drawPave(arg: any): any;
    stored: any;
    _pave_x: number;
    _pave_y: number;
    moved_interactive: boolean;
    /** @summary Fill option object used in TWebCanvas */
    fillWebObjectOptions(res: any): any;
    /** @summary draw TPaveLabel object */
    drawPaveLabel(width: any, height: any): Promise<any>;
    /** @summary draw TPaveStats object */
    drawPaveStats(width: any, height: any): Promise<any>;
    /** @summary draw TPaveText object */
    drawPaveText(width: any, height: any, dummy_arg: any, text_g: any): Promise<TPavePainter>;
    /** @summary Method used to convert value to string according specified format
      * @desc format can be like 5.4g or 4.2e or 6.4f or "stat" or "fit" or "entries" */
    format(value: any, fmt: any): any;
    lastformat: any;
    /** @summary Draw TLegend object */
    drawLegend(w: any, h: any): Promise<any>;
    /** @summary draw color palette with axis */
    drawPaletteAxis(s_width: any, s_height: any, arg: any): any;
    _palette_vertical: boolean;
    _swap_side: boolean;
    /** @summary Add interactive methods for palette drawing */
    interactivePaletteAxis(s_width: any, s_height: any): void;
    /** @summary Show pave context menu */
    paveContextMenu(evnt: any): void;
    /** @summary Returns true when stat box is drawn */
    isStats(): any;
    /** @summary Clear text in the pave */
    clearPave(): void;
    /** @summary Add text to pave */
    addText(txt: any): void;
    /** @summary Fill function parameters */
    fillFunctionStat(f1: any, dofit: any): boolean;
    /** @summary Is dummy pos of the pave painter */
    isDummyPos(p: any): boolean;
    /** @summary Update TPave object  */
    updateObject(obj: any): boolean;
    /** @summary redraw pave object */
    redraw(): any;
}
/** @summary Produce and draw TLegend object for the specified dom
  * @desc Should be called when all other objects are painted
  * Invoked when item "$legend" specified in url string
  * @returns {Object} Promise with TLegend painter
  * @private */
export function produceLegend(dom: any, opt: any): any;
import { ObjectPainter } from "../base/ObjectPainter.mjs";
