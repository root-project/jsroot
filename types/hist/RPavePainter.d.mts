/**
 * @summary Painter for RPave class
 *
 * @private
 */
export class RPavePainter extends RObjectPainter {
    /** @summary draw RPave object */
    static draw(dom: any, pave: any, opt: any): Promise<RPavePainter>;
    /** @summary Draw pave content
      * @desc assigned depending on pave class */
    drawContent(): Promise<RPavePainter>;
    /** @summary Draw pave */
    drawPave(): Promise<RPavePainter>;
    onFrame: any;
    corner: any;
    pave_width: any;
    pave_height: any;
    /** @summary Process interactive moving of the stats box */
    sizeChanged(drag: any): void;
    /** @summary Redraw RPave object */
    redraw(): Promise<RPavePainter>;
}
/**
 * @summary Painter for RLegend class
 *
 * @private
 */
export class RLegendPainter extends RPavePainter {
    /** @summary draw RLegend object */
    static draw(dom: any, legend: any, opt: any): Promise<RLegendPainter>;
    /** @summary draw RLegend content */
    drawContent(): Promise<any>;
}
/**
 * @summary Painter for RPaveText class
 *
 * @private
 */
export class RPaveTextPainter extends RPavePainter {
    /** @summary draw RPaveText object */
    static draw(dom: any, pave: any, opt: any): Promise<RPaveTextPainter>;
    /** @summary draw RPaveText content */
    drawContent(): Promise<any>;
}
/**
 * @summary Painter for RHistStats class
 *
 * @private
 */
export class RHistStatsPainter extends RPavePainter {
    /** @summary draw RHistStats object */
    static draw(dom: any, stats: any, opt: any): Promise<RHistStatsPainter>;
    /** @summary clear entries from stat box */
    clearStat(): void;
    stats_lines: any;
    /** @summary add text entry to stat box */
    addText(line: any): void;
    /** @summary update statistic from the server */
    updateStatistic(reply: any): void;
    /** @summary fill statistic */
    fillStatistic(): any;
    /** @summary format float value as string
      * @private */
    private format;
    lastformat: any;
    /** @summary Draw content */
    drawContent(): Promise<any>;
    /** @summary Change mask */
    changeMask(nbit: any): void;
    /** @summary Context menu */
    statsContextMenu(evnt: any): void;
    /** @summary Draw statistic */
    drawStatistic(lines: any): Promise<any>;
    /** @summary Redraw stats box */
    redraw(reason: any): Promise<RHistStatsPainter>;
}
import { RObjectPainter } from "../base/RObjectPainter.mjs";
