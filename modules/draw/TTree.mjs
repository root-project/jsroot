import { internals, httpRequest, isBatchMode } from '../core.mjs';

import { select as d3_select } from '../d3.mjs';

import { kTString, kObject, kAnyP } from '../io.mjs';

import { kClonesNode, kSTLNode, treeDraw, treeIOTest, TDrawSelector } from '../tree.mjs';

import { BasePainter } from '../base/BasePainter.mjs';

import { cleanup, resize } from '../base/ObjectPainter.mjs';

import { draw, redraw } from '../draw.mjs';

import { showProgress, registerForResize } from '../gui/utils.mjs';


/** @summary Show TTree::Draw progress during processing */
TDrawSelector.prototype.ShowProgress = function(value) {
   if ((typeof document == 'undefined') || isBatchMode()) return;

   if ((value === undefined) || !Number.isFinite(value))
      return showProgress();

   if (this.last_progress !== value) {
      let diff = value - this.last_progress;
      if (!this.aver_diff) this.aver_diff = diff;
      this.aver_diff = diff * 0.3 + this.aver_diff * 0.7;
   }

   let ndig = 0;
   if (this.aver_diff <= 0) ndig = 0; else
      if (this.aver_diff < 0.0001) ndig = 3; else
         if (this.aver_diff < 0.001) ndig = 2; else
            if (this.aver_diff < 0.01) ndig = 1;

   let main_box = document.createElement("p"),
      text_node = document.createTextNode("TTree draw " + (value * 100).toFixed(ndig) + " %  "),
      selector = this;

   main_box.appendChild(text_node);
   main_box.title = "Click on element to break drawing";

   main_box.onclick = function() {
      if (++selector._break < 3) {
         main_box.title = "Tree draw will break after next I/O operation";
         return text_node.nodeValue = "Breaking ... ";
      }
      selector.Abort();
      showProgress();
   };

   showProgress(main_box);
   this.last_progress = value;
}


/** @summary Create painter to perform tree drawing on server side
  * @private */
function createTreePlayer(player) {

   player.draw_first = true;

   player.configureOnline = function(itemname, url, askey, root_version, dflt_expr) {
      this.setItemName(itemname, "", this);
      this.url = url;
      this.root_version = root_version;
      this.askey = askey;
      this.dflt_expr = dflt_expr;
   }

   player.configureTree = function(tree) {
      this.local_tree = tree;
   }

   player.showExtraButtons = function(args) {
      let main = this.selectDom(),
         numentries = this.local_tree ? this.local_tree.fEntries : 0;

      main.select('.treedraw_more').remove(); // remove more button first

      main.select(".treedraw_buttons").node().innerHTML +=
          'Cut: <input class="treedraw_cut ui-corner-all ui-widget" style="width:8em;margin-left:5px" title="cut expression"></input>'+
          'Opt: <input class="treedraw_opt ui-corner-all ui-widget" style="width:5em;margin-left:5px" title="histogram draw options"></input>'+
          `Num: <input class="treedraw_number" type="number" min="0" max="${numentries}" step="1000" style="width:7em;margin-left:5px" title="number of entries to process (default all)"></input>`+
          `First: <input class="treedraw_first" type="number" min="0" max="${numentries}" step="1000" style="width:7em;margin-left:5px" title="first entry to process (default first)"></input>`+
          '<button class="treedraw_clear" title="Clear drawing">Clear</button>';

      main.select('.treedraw_exe').on("click", () => this.performDraw());
      main.select(".treedraw_cut").property("value", args && args.parse_cut ? args.parse_cut : "").on("change", () => this.performDraw());
      main.select(".treedraw_opt").property("value", args && args.drawopt ? args.drawopt : "").on("change", () => this.performDraw());
      main.select(".treedraw_number").attr("value", args && args.numentries ? args.numentries : ""); // .on("change", () => this.performDraw());
      main.select(".treedraw_first").attr("value", args && args.firstentry ? args.firstentry : ""); // .on("change", () => this.performDraw());
      main.select(".treedraw_clear").on("click", () => cleanup(this.drawid));
   }

   player.showPlayer = function(args) {

      let main = this.selectDom();

      this.drawid = "jsroot_tree_player_" + internals.id_counter++ + "_draw";

      let show_extra = args && (args.parse_cut || args.numentries || args.firstentry);

      main.html('<div style="display:flex; flex-flow:column; height:100%; width:100%;">'+
                   '<div class="treedraw_buttons" style="flex: 0 1 auto;margin-top:0.2em;">' +
                      '<button class="treedraw_exe" title="Execute draw expression" style="margin-left:0.5em">Draw</button>' +
                      'Expr:<input class="treedraw_varexp treedraw_varexp_info" style="width:12em;margin-left:5px" title="draw expression"></input>'+
                      '<label class="treedraw_varexp_info">\u24D8</label>' +
                     '<button class="treedraw_more">More</button>' +
                   '</div>' +
                   '<div style="flex: 0 1 auto"><hr/></div>' +
                   `<div id="${this.drawid}" style="flex: 1 1 auto; overflow:hidden;"></div>` +
                '</div>');

      // only when main html element created, one can set painter
      // ObjectPainter allow such usage of methods from BasePainter
      this.setTopPainter();

      if (this.local_tree)
         main.select('.treedraw_buttons')
             .attr("title", "Tree draw player for: " + this.local_tree.fName);
      main.select('.treedraw_exe').on("click", () => this.performDraw());
      main.select('.treedraw_varexp')
          .attr("value", args && args.parse_expr ? args.parse_expr : (this.dflt_expr || "px:py"))
          .on("change", () => this.performDraw());
      main.select('.treedraw_varexp_info')
          .attr('title', "Example of valid draw expressions:\n" +
                         "  px - 1-dim draw\n" +
                         "  px:py - 2-dim draw\n" +
                         "  px:py:pz - 3-dim draw\n" +
                         "  px+py:px-py - use any expressions\n" +
                         "  px:py>>Graph - create and draw TGraph\n" +
                         "  px:py>>dump - dump extracted variables\n" +
                         "  px:py>>h(50,-5,5,50,-5,5) - custom histogram\n" +
                         "  px:py;hbins:100 - custom number of bins");

      if (show_extra)
         this.showExtraButtons(args);
      else
         main.select('.treedraw_more').on("click", () => this.showExtraButtons(args));

      this.checkResize();

      registerForResize(this);
   }

   player.getValue = function(sel) {
      const elem = this.selectDom().select(sel);
      if (elem.empty()) return;
      const val = elem.property("value");
      if (val !== undefined) return val;
      return elem.attr("value");
   }

   player.performLocalDraw = function() {
      if (!this.local_tree) return;

      const frame = this.selectDom(),
            args = { expr: this.getValue('.treedraw_varexp') };

      if (frame.select('.treedraw_more').empty()) {
         args.cut = this.getValue('.treedraw_cut');
         if (!args.cut) delete args.cut;

         args.drawopt = this.getValue('.treedraw_opt');
         if (args.drawopt === "dump") { args.dump = true; args.drawopt = ""; }
         if (!args.drawopt) delete args.drawopt;

         args.numentries = parseInt(this.getValue('.treedraw_number'));
         if (!Number.isInteger(args.numentries)) delete args.numentries;

         args.firstentry = parseInt(this.getValue('.treedraw_first'));
         if (!Number.isInteger(args.firstentry)) delete args.firstentry;
      }

      if (args.drawopt) cleanup(this.drawid);

      const process_result = obj => redraw(this.drawid, obj);

      args.progress = process_result;

      treeDraw(this.local_tree, args).then(process_result);
   }

   player.getDrawOpt = function() {
      let res = "player",
          expr = this.getValue('.treedraw_varexp')
      if (expr) res += ":" + expr;
      return res;
   }

   player.performDraw = function() {

      if (this.local_tree)
         return this.performLocalDraw();

      let frame = this.selectDom(),
          url = this.url + '/exe.json.gz?compact=3&method=Draw',
          expr = this.getValue('.treedraw_varexp'),
          hname = "h_tree_draw", option = "",
          pos = expr.indexOf(">>");

      if (pos < 0) {
         expr += ">>" + hname;
      } else {
         hname = expr.substr(pos+2);
         if (hname[0]=='+') hname = hname.substr(1);
         let pos2 = hname.indexOf("(");
         if (pos2 > 0) hname = hname.substr(0, pos2);
      }

      if (frame.select('.treedraw_more').empty()) {
         let cut = this.getValue('.treedraw_cut'),
             nentries = this.getValue('.treedraw_number'),
             firstentry = this.getValue('.treedraw_first');

         option = this.getValue('.treedraw_opt');

         url += `&prototype="const char*,const char*,Option_t*,Long64_t,Long64_t"&varexp="${expr}"&selection="${cut}"`;

         // provide all optional arguments - default value kMaxEntries not works properly in ROOT6
         if (nentries=="") nentries = (this.root_version >= 394499) ? "TTree::kMaxEntries": "1000000000"; // kMaxEntries available since ROOT 6.05/03
         if (firstentry=="") firstentry = "0";
         url += `&option="${option}"&nentries=${nentries}&firstentry=${firstentry}`;
      } else {
         url += `&prototype="Option_t*"&opt="${expr}"`;
      }
      url += '&_ret_object_=' + hname;

      const submitDrawRequest = () => {
         httpRequest(url, 'object').then(res => {
            cleanup(this.drawid);
            draw(this.drawid, res, option);
         });
      };

      if (this.askey) {
         // first let read tree from the file
         this.askey = false;
         httpRequest(this.url + "/root.json.gz?compact=3", 'text').then(submitDrawRequest);
      } else {
         submitDrawRequest();
      }
   }

   player.checkResize = function(/*arg*/) {
      resize(this.drawid);
   }

   return player;
}

/** @summary function used with THttpServer to assign player for the TTree object
  * @private */
function drawTreePlayer(hpainter, itemname, askey, asleaf) {

   let item = hpainter.findItem(itemname),
       top = hpainter.getTopOnlineItem(item),
       draw_expr = "", leaf_cnt = 0;
   if (!item || !top) return null;

   if (asleaf) {
      draw_expr = item._name;
      while (item && !item._ttree) item = item._parent;
      if (!item) return null;
      itemname = hpainter.itemFullName(item);
   }

   let url = hpainter.getOnlineItemUrl(itemname);
   if (!url) return null;

   let root_version = top._root_version ? parseInt(top._root_version) : 396545; // by default use version number 6-13-01

   let mdi = hpainter.getDisplay();
   if (!mdi) return null;

   let frame = mdi.findFrame(itemname, true);
   if (!frame) return null;

   let divid = d3_select(frame).attr('id'),
       player = new BasePainter(divid);

   if (item._childs && !asleaf)
      for (let n = 0; n < item._childs.length; ++n) {
         let leaf = item._childs[n];
         if (leaf && leaf._kind && (leaf._kind.indexOf("ROOT.TLeaf") == 0) && (leaf_cnt < 2)) {
            if (leaf_cnt++ > 0) draw_expr+=":";
            draw_expr+=leaf._name;
         }
      }

   createTreePlayer(player);
   player.configureOnline(itemname, url, askey, root_version, draw_expr);
   player.showPlayer();

   return player;
}

/** @summary function used with THttpServer when tree is not yet loaded
  * @private */
function drawTreePlayerKey(hpainter, itemname) {
   return drawTreePlayer(hpainter, itemname, true);
}

/** @summary function used with THttpServer when tree is not yet loaded
  * @private */
function drawLeafPlayer(hpainter, itemname) {
   return drawTreePlayer(hpainter, itemname, false, true);
}

/** @summary function called from draw()
  * @desc just envelope for real TTree::Draw method which do the main job
  * Can be also used for the branch and leaf object
  * @private */
function drawTree() {

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

   let has_player = false, last_pr = null;

   function process_result(obj, intermediate = false) {

      let drawid;

      // no need to update drawing if previous is not yet completed
      if (intermediate && last_pr)
         return;

      if (!args.player) {
         drawid = painter.getDom();
      } else if (has_player) {
         drawid = painter.drawid;
      } else {
         createTreePlayer(painter);
         painter.configureTree(tree);
         painter.showPlayer(args);
         drawid = painter.drawid;
         has_player = true;
      }

      // complex logic with intermediate update
      // while TTree reading not synchronized with drawing,
      // next portion can appear before previous is drawn
      // critical is last drawing which should wait for previous one
      // therefore last_pr is kept as inidication that promise is not yet processed

      if (!last_pr) last_pr = Promise.resolve(true);

      return last_pr.then(() => {
         last_pr = redraw(drawid, obj).then(objpainter => {
            if (intermediate)
               last_pr = null;
            if (has_player)
               painter.setItemName("TreePlayer"); // item name used by MDI when process resize
            return objpainter; // return painter for histogram
         });

         return intermediate ? null : last_pr;
      });
   };

   // use in result handling same function as for progress handling

   let pr;
   if (args.expr === "testio") {
      args.showProgress = showProgress;
      pr = treeIOTest(tree, args);
   } else {
      args.progress = obj => process_result(obj, true);
      pr = treeDraw(tree, args);
   }

   return pr.then(res => process_result(res));
}

export { drawTree, drawTreePlayer, drawTreePlayerKey, drawLeafPlayer };
