/// @file JSRoot.jq2d.js
/// Part of JavaScript ROOT, dependent from jQuery functionality

JSROOT.define(['d3', 'jquery', 'painter', 'hierarchy', 'jquery-ui', 'jqueryui-mousewheel', 'jqueryui-touch-punch'], (d3, $, jsrp) => {

   "use strict";

   JSROOT.loadScript('$$$style/jquery-ui');

   if (typeof jQuery === 'undefined') globalThis.jQuery = $;

   // ==================================================

   /** @summary Create painter to perform tree drawing on server side
     * @private */
   JSROOT.createTreePlayer = function(player) {

      player.draw_first = true;

      player.ConfigureOnline = function(itemname, url, askey, root_version, dflt_expr) {
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
         let main = this.selectDom();

         let numentries = this.local_tree ? this.local_tree.fEntries : 0;

         main.select('.treedraw_more').remove(); // remove more button first

         main.select(".treedraw_buttons").append("div")
             .html(` Cut: <input class="treedraw_cut ui-corner-all ui-widget" style="width:8em;margin-left:5px" title="cut expression"></input>
                    Opt: <input class="treedraw_opt ui-corner-all ui-widget" style="width:5em;margin-left:5px" title="histogram draw options"></input>
                    Num: <input class="treedraw_number" type="number" min="0" max="${numentries}" step="1000" style="width:7em;margin-left:5px" title="number of entries to process (default all)"></input>
                    First: <input class="treedraw_first" type="number" min="0" max="${numentries}" step="1000" style="width:7em;margin-left:5px" title="first entry to process (default first)"></input>
                    <button class="treedraw_clear" title="Clear drawing">Clear</button>`);

         main.select(".treedraw_cut").property("value", args && args.parse_cut ? args.parse_cut : "").on("change", () => this.performDraw());
         main.select(".treedraw_opt").property("value", args && args.drawopt ? args.drawopt : "").on("change", () => this.performDraw());
         main.select(".treedraw_number").attr("value", args && args.numentries ? args.numentries : "").on("change", () => this.performDraw());
         main.select(".treedraw_first").attr("value", args && args.firstentry ? args.firstentry : "").on("change", () => this.performDraw());
         main.select(".treedraw_clear").on("click", () => JSROOT.cleanup(this.drawid));
      }

      player.Show = function(args) {

         let main = this.selectDom();

         this.drawid = "jsroot_tree_player_" + JSROOT._.id_counter++ + "_draw";

         let show_extra = args && (args.parse_cut || args.numentries || args.firstentry);

         main.html(`<div class="treedraw_buttons" style="padding-left:0.5em">
                   <button class="treedraw_exe" title="Execute draw expression">Draw</button>
                   Expr:<input class="treedraw_varexp treedraw_varexp_info" style="width:12em;margin-left:5px" title="draw expression"></input>
                   <label class="treedraw_varexp_info">\u24D8</label>
                   ${show_extra ? '' : '<button class="treedraw_more">More</button>'}
                   </div>
                   <hr/>
                   <div id="${this.drawid}" style="width:100%;height:100%"></div>`);

         // only when main html element created, one can painter
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
                          "  px  - 1-dim draw\n" +
                          "  px:py  - 2-dim draw\n" +
                          "  px:py:pz  - 3-dim draw\n" +
                          "  px+py:px-py - use any expressions\n" +
                          "  px:py>>Graph - create and draw TGraph\n" +
                          "  px:py>>dump - dump extracted variables\n" +
                          "  px:py>>h(50,-5,5,50,-5,5) - custom histogram\n" +
                          "  px:py;hbins:100 - custom number of bins");

         if (show_extra) {
            this.showExtraButtons(args);
         } else {
            main.select('.treedraw_more').on("click", () => this.showExtraButtons());
         }

         this.checkResize();

         jsrp.registerForResize(this);
      }

      player.PerformLocalDraw = function() {
         if (!this.local_tree) return;

         let frame = $(this.selectDom().node()),
             args = { expr: frame.find('.treedraw_varexp').val() };

         if (frame.find('.treedraw_more').length==0) {
            args.cut = frame.find('.treedraw_cut').val();
            if (!args.cut) delete args.cut;

            args.drawopt = frame.find('.treedraw_opt').val();
            if (args.drawopt === "dump") { args.dump = true; args.drawopt = ""; }
            if (!args.drawopt) delete args.drawopt;

            args.numentries = parseInt(frame.find('.treedraw_number').val());
            if (!Number.isInteger(args.numentries)) delete args.numentries;

            args.firstentry = parseInt(frame.find('.treedraw_first').val());
            if (!Number.isInteger(args.firstentry)) delete args.firstentry;
         }

         if (args.drawopt) JSROOT.cleanup(this.drawid);

         let process_result = obj => JSROOT.redraw(this.drawid, obj);

         args.progress = process_result;

         this.local_tree.Draw(args).then(process_result);
      }

      player.performDraw = function() {

         if (this.local_tree) return this.PerformLocalDraw();

         let frame = $(this.selectDom().node()),
             url = this.url + '/exe.json.gz?compact=3&method=Draw',
             expr = frame.find('.treedraw_varexp').val(),
             hname = "h_tree_draw", option = "",
             pos = expr.indexOf(">>");

         if (pos<0) {
            expr += ">>" + hname;
         } else {
            hname = expr.substr(pos+2);
            if (hname[0]=='+') hname = hname.substr(1);
            let pos2 = hname.indexOf("(");
            if (pos2>0) hname = hname.substr(0, pos2);
         }

         if (frame.find('.treedraw_more').length==0) {
            let cut = frame.find('.treedraw_cut').val(),
                nentries = frame.find('.treedraw_number').val(),
                firstentry = frame.find('.treedraw_first').val();

            option = frame.find('.treedraw_opt').val();

            url += '&prototype="const char*,const char*,Option_t*,Long64_t,Long64_t"&varexp="' + expr + '"&selection="' + cut + '"';

            // provide all optional arguments - default value kMaxEntries not works properly in ROOT6
            if (nentries=="") nentries = (this.root_version >= 394499) ? "TTree::kMaxEntries": "1000000000"; // kMaxEntries available since ROOT 6.05/03
            if (firstentry=="") firstentry = "0";
            url += '&option="' + option + '"&nentries=' + nentries + '&firstentry=' + firstentry;
         } else {
            url += '&prototype="Option_t*"&opt="' + expr + '"';
         }
         url += '&_ret_object_=' + hname;

         let SubmitDrawRequest = () => {
            JSROOT.httpRequest(url, 'object').then(res => {
               JSROOT.cleanup(this.drawid);
               JSROOT.draw(this.drawid, res, option);
            });
         };

         if (this.askey) {
            // first let read tree from the file
            this.askey = false;
            JSROOT.httpRequest(this.url + "/root.json", 'text').then(SubmitDrawRequest);
         } else {
            SubmitDrawRequest();
         }
      }

      player.checkResize = function(/*arg*/) {
         let main = $(this.selectDom().node());

         $("#" + this.drawid).width(main.width());
         let h = main.height(),
             h0 = main.find(".treedraw_buttons").outerHeight(true),
             h1 = main.find("hr").outerHeight(true);

         $("#" + this.drawid).height(h - h0 - h1 - 2);

         JSROOT.resize(this.drawid);
      }

      return player;
   }

   /** @summary function used with THttpServer to assign player for the TTree object
     * @private */
   JSROOT.drawTreePlayer = function(hpainter, itemname, askey, asleaf) {

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

      let divid = d3.select(frame).attr('id'),
          player = new JSROOT.BasePainter(divid);

      if (item._childs && !asleaf)
         for (let n=0;n<item._childs.length;++n) {
            let leaf = item._childs[n];
            if (leaf && leaf._kind && (leaf._kind.indexOf("ROOT.TLeaf")==0) && (leaf_cnt<2)) {
               if (leaf_cnt++ > 0) draw_expr+=":";
               draw_expr+=leaf._name;
            }
         }

      JSROOT.createTreePlayer(player);
      player.ConfigureOnline(itemname, url, askey, root_version, draw_expr);
      player.Show();

      return player;
   }

   /** @summary function used with THttpServer when tree is not yet loaded
     * @private */
   JSROOT.drawTreePlayerKey = function(hpainter, itemname) {
      return JSROOT.drawTreePlayer(hpainter, itemname, true);
   }

   /** @summary function used with THttpServer when tree is not yet loaded
     * @private */
   JSROOT.drawLeafPlayer = function(hpainter, itemname) {
      return JSROOT.drawTreePlayer(hpainter, itemname, false, true);
   }

   return JSROOT;
});
