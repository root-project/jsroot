import {kTString, kObject, kAnyP } from '../io.mjs';

import { kClonesNode, kSTLNode, treeDraw } from '../tree.mjs';

import { createTreePlayer } from '../hierarchy.mjs';

import { redraw } from '../draw.mjs';

/** @summary function called from draw()
  * @desc just envelope for real TTree::Draw method which do the main job
  * Can be also used for the branch and leaf object
  * @private */
async function drawTree() {

   let painter = this,
       obj = this.getObject(),
       opt = this.getDrawOpt(),
       tree = obj,
       args = opt;

   if (obj._typename == "TBranchFunc") {
      // fictional object, created only in browser
      args = { expr: "." + obj.func + "()", branch: obj.branch };
      if (opt && opt.indexOf("dump")==0)
         args.expr += ">>" + opt;
      else if (opt)
         args.expr += opt;
      tree = obj.branch.$tree;
   } else if (obj.$branch) {
      // this is drawing of the single leaf from the branch
      args = { expr: "." + obj.fName + (opt || ""), branch: obj.$branch };
      if ((args.branch.fType === kClonesNode) || (args.branch.fType === kSTLNode)) {
         // special case of size
         args.expr = opt;
         args.direct_branch = true;
      }

      tree = obj.$branch.$tree;
   } else if (obj.$tree) {
      // this is drawing of the branch

      // if generic object tried to be drawn without specifying any options, it will be just dump
      if (!opt && obj.fStreamerType && (obj.fStreamerType !== kTString) &&
          (obj.fStreamerType >= kObject) && (obj.fStreamerType <= kAnyP)) opt = "dump";

      args = { expr: opt, branch: obj };
      tree = obj.$tree;
   } else {
      if (!args) args = 'player';

      if ((typeof args == 'string') && (args.indexOf('player') == 0)) {
         createTreePlayer(painter);
         painter.configureTree(tree);
         painter.showPlayer((args[6] ==':') ? { parse_expr: args.substr(7) } : null);
         return painter;
      }

      if (typeof args === 'string') args = { expr: args };
   }

   if (!tree)
      throw Error('No TTree object available for TTree::Draw');

   let create_player = 0, finalResolve;

   async function process_result(obj, intermediate) {

      let drawid;

      if (!args.player)
         drawid = painter.getDom();
      else if (create_player === 2)
         drawid = painter.drawid;

      if (drawid)
         return redraw(drawid, obj); // return painter for histogram

      if (create_player === 1)
         return intermediate ? null : new Promise(resolve => { finalResolve = resolve; });

      // redirect drawing to the player
      create_player = 1;

      createTreePlayer(painter);
      painter.configureTree(tree);
      painter.showPlayer(args);
      create_player = 2;

      let objpainter = await redraw(painter.drawid, obj);
      painter.setItemName("TreePlayer"); // item name used by MDI when process resize
      if (finalResolve) finalResolve(objpainter);
      return objpainter; // return painter for histogram
   };

   args.progress = obj => process_result(obj, true);

   // use in result handling same function as for progress handling
   return treeDraw(tree, args).then(obj => process_result(obj));
}

export { drawTree };
