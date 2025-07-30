import { treeDrawProgress } from './TTree.mjs';
import { rntupleDraw } from '../rntuple.mjs';

/** @summary function called from draw()
  * @desc just envelope for real TTree::Draw method which do the main job
  * Can be also used for the branch and leaf object
  * @private */
async function drawRNTuple(dom, obj, opt) {
   let tuple = null, args = { };

   if (obj?.$tuple) {
      // case of fictional ROOT::RNTupleField
      tuple = obj.$tuple;
      args.expr = obj._name;
   }

   if (!tuple)
      throw Error('No RNTuple object available for drawing');

   console.log('expression', args.expr);

   args.drawid = dom;

   args.progress = treeDrawProgress.bind(args);

   return rntupleDraw(tuple, args).then(res => args.progress(res, true));
}

export { drawRNTuple };
