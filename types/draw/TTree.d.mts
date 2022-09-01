/** @summary function called from draw()
  * @desc just envelope for real TTree::Draw method which do the main job
  * Can be also used for the branch and leaf object
  * @private */
export function drawTree(dom: any, obj: any, opt: any): any;
/** @summary function used with THttpServer to assign player for the TTree object
  * @private */
export function drawTreePlayer(hpainter: any, itemname: any, askey: any, asleaf: any): BasePainter;
/** @summary function used with THttpServer when tree is not yet loaded
  * @private */
export function drawTreePlayerKey(hpainter: any, itemname: any): BasePainter;
/** @summary function used with THttpServer when tree is not yet loaded
  * @private */
export function drawLeafPlayer(hpainter: any, itemname: any): BasePainter;
import { BasePainter } from "../base/BasePainter.mjs";
