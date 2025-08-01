import { internals, httpRequest, isBatchMode, isFunc, isStr, create, toJSON, getPromise,
         getKindForType, clTObjString, clTGraph, clTPolyMarker3D, clTH1, clTH2, clTH3 } from '../core.mjs';
import { select as d3_select } from '../d3.mjs';
import { kTString, kObject, kAnyP } from '../io.mjs';
import { kClonesNode, kSTLNode, clTBranchFunc, treeDraw, treeIOTest, TDrawSelector } from '../tree.mjs';
import { BasePainter } from '../base/BasePainter.mjs';
import { cleanup, resize, drawRawText, ObjectPainter } from '../base/ObjectPainter.mjs';
import { TH1Painter } from '../hist/TH1Painter.mjs';
import { TH2Painter } from '../hist/TH2Painter.mjs';
import { TH3Painter } from '../hist/TH3Painter.mjs';
import { TGraphPainter } from '../hist/TGraphPainter.mjs';
import { drawPolyMarker3D } from '../draw/TPolyMarker3D.mjs';
import { showProgress, registerForResize } from '../gui/utils.mjs';


/** @summary Show TTree::Draw progress during processing
  * @private */
TDrawSelector.prototype.ShowProgress = function(value) {
   let msg, ret;
   if ((value === undefined) || !Number.isFinite(value))
      msg = ret = '';
   else if (this._break) {
      msg = 'Breaking ... ';
      ret = 'break';
   } else {
      if (this.last_progress !== value) {
         const diff = value - this.last_progress;
         if (!this.aver_diff) this.aver_diff = diff;
         this.aver_diff = diff * 0.3 + this.aver_diff * 0.7;
      }

      this.last_progress = value;

      let ndig = 0;
      if (this.aver_diff <= 0)
         ndig = 0;
      else if (this.aver_diff < 0.0001)
         ndig = 3;
      else if (this.aver_diff < 0.001)
         ndig = 2;
      else if (this.aver_diff < 0.01)
         ndig = 1;
      msg = `TTree draw ${(value * 100).toFixed(ndig)} % `;
   }

   showProgress(msg, 0, () => { this._break = 1; });
   return ret;
};

/** @summary Draw result of tree drawing
  * @private */
async function drawTreeDrawResult(dom, obj, opt) {
   const typ = obj?._typename;

   if (!typ || !isStr(typ))
      return Promise.reject(Error('Object without type cannot be draw with TTree'));

   if (typ.indexOf(clTH1) === 0)
      return TH1Painter.draw(dom, obj, opt);
   if (typ.indexOf(clTH2) === 0)
      return TH2Painter.draw(dom, obj, opt);
   if (typ.indexOf(clTH3) === 0)
      return TH3Painter.draw(dom, obj, opt);
   if (typ.indexOf(clTGraph) === 0)
      return TGraphPainter.draw(dom, obj, opt);
   if ((typ === clTPolyMarker3D) && obj.$hist) {
      return TH3Painter.draw(dom, obj.$hist, opt).then(() => {
         const p2 = new ObjectPainter(dom, obj, opt);
         p2.addToPadPrimitives();
         p2.redraw = drawPolyMarker3D;
         return p2.redraw();
      });
   }

   return Promise.reject(Error(`Object of type ${typ} cannot be draw with TTree`));
}


/** @summary Handle callback function with progress of tree draw
  * @private */
async function treeDrawProgress(obj, final) {
   // no need to update drawing if previous is not yet completed
   if (!final && !this.last_pr)
      return;

   if (this.dump || this.dump_entries || this.testio) {
      if (!final)
         return;
      if (isBatchMode()) {
         const painter = new BasePainter(this.drawid);
         painter.selectDom().property('_json_object_', obj);
         return painter;
      }
      if (isFunc(internals.drawInspector))
         return internals.drawInspector(this.drawid, obj);
      const str = create(clTObjString);
      str.fString = toJSON(obj, 2);
      return drawRawText(this.drawid, str);
   }

   // complex logic with intermediate update
   // while TTree reading not synchronized with drawing,
   // next portion can appear before previous is drawn
   // critical is last drawing which should wait for previous one
   // therefore last_pr is kept as indication that promise is not yet processed

   if (!this.last_pr)
      this.last_pr = Promise.resolve(true);

   return this.last_pr.then(() => {
      if (this.obj_painter)
         this.last_pr = getPromise(this.obj_painter.redrawObject(obj)).then(() => this.obj_painter);
      else if (!obj) {
         if (final) console.log('no result after tree drawing');
         this.last_pr = false; // return false indicating no drawing is done
      } else {
         this.last_pr = drawTreeDrawResult(this.drawid, obj, this.drawopt).then(p => {
            this.obj_painter = p;
            if (!final) this.last_pr = null;
            return p; // return painter for histogram
         });
      }

      return final ? this.last_pr : null;
   });
}


/** @summary Create painter to perform tree drawing on server side
  * @private */
function createTreePlayer(player) {
   player.draw_first = true;

   player.configureOnline = function(itemname, url, askey, root_version, expr) {
      this.setItemName(itemname, '', this);
      this.url = url;
      this.root_version = root_version;
      this.askey = askey;
      this.draw_expr = expr;
   };

   player.configureTree = function(tree) {
      this.local_tree = tree;
   };

   player.showExtraButtons = function(args) {
      const main = this.selectDom(),
            numentries = this.local_tree?.fEntries || 0;

      main.select('.treedraw_more').remove(); // remove more button first

      main.select('.treedraw_buttons').node().innerHTML +=
          'Cut: <input class="treedraw_cut ui-corner-all ui-widget" style="width:8em;margin-left:5px" title="cut expression"></input>'+
          'Opt: <input class="treedraw_opt ui-corner-all ui-widget" style="width:5em;margin-left:5px" title="histogram draw options"></input>'+
          `Num: <input class="treedraw_number" type='number' min="0" max="${numentries}" step="1000" style="width:7em;margin-left:5px" title="number of entries to process (default all)"></input>`+
          `First: <input class="treedraw_first" type='number' min="0" max="${numentries}" step="1000" style="width:7em;margin-left:5px" title="first entry to process (default first)"></input>`+
          '<button class="treedraw_clear" title="Clear drawing">Clear</button>';

      main.select('.treedraw_exe').on('click', () => this.performDraw());
      main.select('.treedraw_cut').property('value', args?.parse_cut || '').on('change', () => this.performDraw());
      main.select('.treedraw_opt').property('value', args?.drawopt || '').on('change', () => this.performDraw());
      main.select('.treedraw_number').attr('value', args?.numentries || ''); // .on('change', () => this.performDraw());
      main.select('.treedraw_first').attr('value', args?.firstentry || ''); // .on('change', () => this.performDraw());
      main.select('.treedraw_clear').on('click', () => cleanup(this.drawid));
   };

   player.showPlayer = function(args) {
      const main = this.selectDom();

      this.drawid = 'jsroot_tree_player_' + internals.id_counter++ + '_draw';

      const show_extra = args?.parse_cut || args?.numentries || args?.firstentry;

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

      if (this.local_tree) {
         main.select('.treedraw_buttons')
             .attr('title', 'Tree draw player for: ' + this.local_tree.fName);
      }
      main.select('.treedraw_exe').on('click', () => this.performDraw());
      main.select('.treedraw_varexp')
          .attr('value', args?.parse_expr || this.draw_expr || 'px:py')
          .on('change', () => this.performDraw());
      main.select('.treedraw_varexp_info')
          .attr('title', 'Example of valid draw expressions:\n' +
                         '  px - 1-dim draw\n' +
                         '  px:py - 2-dim draw\n' +
                         '  px:py:pz - 3-dim draw\n' +
                         '  px+py:px-py - use any expressions\n' +
                         '  px:py>>Graph - create and draw TGraph\n' +
                         '  px:py>>dump - dump extracted variables\n' +
                         '  px:py>>h(50,-5,5,50,-5,5) - custom histogram\n' +
                         '  px:py;hbins:100 - custom number of bins');

      if (show_extra)
         this.showExtraButtons(args);
      else
         main.select('.treedraw_more').on('click', () => this.showExtraButtons(args));

      this.checkResize();

      registerForResize(this);
   };

   player.getValue = function(sel) {
      const elem = this.selectDom().select(sel);
      if (elem.empty()) return;
      const val = elem.property('value');
      if (val !== undefined) return val;
      return elem.attr('value');
   };

   player.performLocalDraw = function() {
      if (!this.local_tree) return;

      const frame = this.selectDom(),
            args = { expr: this.getValue('.treedraw_varexp') };

      if (frame.select('.treedraw_more').empty()) {
         args.cut = this.getValue('.treedraw_cut');
         if (!args.cut) delete args.cut;

         args.drawopt = this.getValue('.treedraw_opt');
         if (args.drawopt === 'dump') { args.dump = true; args.drawopt = ''; }
         if (!args.drawopt) delete args.drawopt;

         args.numentries = parseInt(this.getValue('.treedraw_number'));
         if (!Number.isInteger(args.numentries)) delete args.numentries;

         args.firstentry = parseInt(this.getValue('.treedraw_first'));
         if (!Number.isInteger(args.firstentry)) delete args.firstentry;
      }

      cleanup(this.drawid);

      args.drawid = this.drawid;

      args.progress = treeDrawProgress.bind(args);

      treeDraw(this.local_tree, args).then(obj => args.progress(obj, true));
   };

   player.getDrawOpt = function() {
      let res = 'player';
      const expr = this.getValue('.treedraw_varexp');
      if (expr) res += ':' + expr;
      return res;
   };

   player.performDraw = function() {
      if (this.local_tree)
         return this.performLocalDraw();

      const frame = this.selectDom();
      let url = this.url + '/exe.json.gz?compact=3&method=Draw',
          expr = this.getValue('.treedraw_varexp'),
          hname = 'h_tree_draw', option = '';
      const pos = expr.indexOf('>>');

      if (pos < 0)
         expr += `>>${hname}`;
       else {
         hname = expr.slice(pos+2);
         if (hname[0] === '+') hname = hname.slice(1);
         const pos2 = hname.indexOf('(');
         if (pos2 > 0) hname = hname.slice(0, pos2);
      }

      if (frame.select('.treedraw_more').empty()) {
         const cut = this.getValue('.treedraw_cut');
         let nentries = this.getValue('.treedraw_number'),
             firstentry = this.getValue('.treedraw_first');

         option = this.getValue('.treedraw_opt');

         url += `&prototype="const char*,const char*,Option_t*,Long64_t,Long64_t"&varexp="${expr}"&selection="${cut}"`;

         // provide all optional arguments - default value kMaxEntries not works properly in ROOT6
         if (!nentries) nentries = 'TTree::kMaxEntries'; // kMaxEntries available since ROOT 6.05/03
         if (!firstentry) firstentry = '0';
         url += `&option="${option}"&nentries=${nentries}&firstentry=${firstentry}`;
      } else
         url += `&prototype="Option_t*"&opt="${expr}"`;

      url += `&_ret_object_=${hname}`;

      const submitDrawRequest = () => {
         httpRequest(url, 'object').then(res => {
            cleanup(this.drawid);
            drawTreeDrawResult(this.drawid, res, option);
         });
      };

      this.draw_expr = expr;

      if (this.askey) {
         // first let read tree from the file
         this.askey = false;
         httpRequest(this.url + '/root.json.gz?compact=3', 'text').then(submitDrawRequest);
      } else
         submitDrawRequest();
   };

   player.checkResize = function(/* arg */) {
      resize(this.drawid);
   };

   return player;
}


/** @summary function used with THttpServer to assign player for the TTree object
  * @private */
function drawTreePlayer(hpainter, itemname, askey, asleaf) {
   let item = hpainter.findItem(itemname),
       expr = '', leaf_cnt = 0;
   const top = hpainter.getTopOnlineItem(item);
   if (!item || !top) return null;

   if (asleaf) {
      expr = item._name;
      while (item && !item._ttree) item = item._parent;
      if (!item) return null;
      itemname = hpainter.itemFullName(item);
   }

   const url = hpainter.getOnlineItemUrl(itemname);
   if (!url) return null;

   const root_version = top._root_version || 400129, // by default use version number 6-27-01

    mdi = hpainter.getDisplay();
   if (!mdi) return null;

   const frame = mdi.findFrame(itemname, true);
   if (!frame) return null;

   const divid = d3_select(frame).attr('id'),
       player = new BasePainter(divid);

   if (item._childs && !asleaf) {
      for (let n = 0; n < item._childs.length; ++n) {
         const leaf = item._childs[n];
         if (isStr(leaf?._kind) && (leaf._kind.indexOf(getKindForType('TLeaf')) === 0) && (leaf_cnt < 2)) {
            if (leaf_cnt++ > 0) expr += ':';
            expr += leaf._name;
         }
      }
   }

   createTreePlayer(player);
   player.configureOnline(itemname, url, askey, root_version, expr);
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
async function drawTree(dom, obj, opt) {
   let tree = obj, args = opt;

   if (obj._typename === clTBranchFunc) {
      // fictional object, created only in browser
      args = { expr: `.${obj.func}()`, branch: obj.branch };
      if (opt && opt.indexOf('dump') === 0)
         args.expr += '>>' + opt;
      else if (opt)
         args.expr += opt;
      tree = obj.branch.$tree;
   } else if (obj.$branch) {
      // this is drawing of the single leaf from the branch
      args = { expr: `.${obj.fName}${opt || ''}`, branch: obj.$branch };
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
          (obj.fStreamerType >= kObject) && (obj.fStreamerType <= kAnyP)) opt = 'dump';

      args = { expr: opt, branch: obj };
      tree = obj.$tree;
   } else {
      if (!args) args = 'player';
      if (isStr(args)) args = { expr: args };
   }

   if (!tree)
      throw Error('No TTree object available for TTree::Draw');

   if (isStr(args.expr)) {
      const p = args.expr.indexOf('player');
      if (p === 0) {
         args.player = true;
         args.expr = args.expr.slice(6);
         if (args.expr[0] === ':')
            args.expr = args.expr.slice(1);
      } else if ((p >= 0) && (p === args.expr.length - 6)) {
         args.player = true;
         args.expr = args.expr.slice(0, p);
         if ((p > 0) && (args.expr[p-1] === ';')) args.expr = args.expr.slice(0, p-1);
      }
   }

   let painter;

   if (args.player) {
      painter = new ObjectPainter(dom, obj, opt);
      createTreePlayer(painter);
      painter.configureTree(tree);
      painter.showPlayer(args);
      args.drawid = painter.drawid;
   } else
      args.drawid = dom;


   // use in result handling same function as for progress handling

   args.progress = treeDrawProgress.bind(args);

   let pr;
   if (args.expr === 'testio') {
      args.testio = true;
      args.showProgress = msg => showProgress(msg, -1, () => { args._break = 1; });
      pr = treeIOTest(tree, args);
   } else if (args.expr || args.branch)
      pr = treeDraw(tree, args);
    else
      return painter;

   return pr.then(res => args.progress(res, true));
}

export { drawTree, drawTreePlayer, drawTreePlayerKey, drawLeafPlayer, treeDrawProgress };
