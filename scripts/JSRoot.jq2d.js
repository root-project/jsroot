/// @file JSRoot.jq2d.js
/// Part of JavaScript ROOT, dependent from jQuery functionality

JSROOT.define(['d3', 'jquery', 'painter', 'hierarchy', 'jquery-ui', 'jqueryui-mousewheel', 'jqueryui-touch-punch'], (d3, $, jsrp) => {

   "use strict";

   JSROOT.loadScript('$$$style/jquery-ui');

   if (typeof jQuery === 'undefined') globalThis.jQuery = $;

   class CollapsibleDisplay extends JSROOT.MDIDisplay {
      constructor(frameid) {
         super(frameid);
         this.cnt = 0; // use to count newly created frames
      }

      forEachFrame(userfunc,  only_visible) {
         let topid = this.frameid + '_collapsible';

         if (!document.getElementById(topid)) return;

         if (typeof userfunc != 'function') return;

         $('#' + topid + ' .collapsible_draw').each(function() {

            // check if only visible specified
            if (only_visible && $(this).is(":hidden")) return;

            userfunc($(this).get(0));
         });
      }

      getActiveFrame() {
         let found = super.getActiveFrame();
         if (found && !$(found).is(":hidden")) return found;

         found = null;
         this.forEachFrame(frame => { if (!found) found = frame; }, true);

         return found;
      }

      activateFrame(frame) {
         if ($(frame).is(":hidden")) {
            $(frame).prev().toggleClass("ui-accordion-header-active ui-state-active ui-state-default ui-corner-bottom")
                    .find("> .ui-icon").toggleClass("ui-icon-triangle-1-e ui-icon-triangle-1-s").end()
                    .next().toggleClass("ui-accordion-content-active").slideDown(0);
         }
         $(frame).prev()[0].scrollIntoView();
         // remember title
         this.active_frame_title = d3.select(frame).attr('frame_title');
      }

      createFrame(title) {

         this.beforeCreateFrame(title);

         let topid = this.frameid + '_collapsible';

         if (!document.getElementById(topid))
            $("#"+this.frameid).append('<div id="'+ topid  + '" class="jsroot ui-accordion ui-accordion-icons ui-widget ui-helper-reset" style="overflow:auto; overflow-y:scroll; height:100%; padding-left: 2px; padding-right: 2px"></div>');

         let mdi = this,
             hid = topid + "_sub" + this.cnt++,
             uid = hid + "h",
             entryInfo = "<h5 id=\"" + uid + "\">" +
                           "<span class='ui-icon ui-icon-triangle-1-e'></span>" +
                           "<a> " + title + "</a>&nbsp; " +
                           "<button type='button' class='jsroot_collaps_closebtn' style='float:right; width:1.4em' title='close canvas'/>" +
                           " </h5>\n" +
                           "<div class='collapsible_draw' id='" + hid + "'></div>\n";

         $("#" + topid).append(entryInfo);

         $('#' + uid)
               .addClass("ui-accordion-header ui-helper-reset ui-state-default ui-corner-top ui-corner-bottom")
               .hover(function() { $(this).toggleClass("ui-state-hover"); })
               .click( function() {
                        $(this).toggleClass("ui-accordion-header-active ui-state-active ui-state-default ui-corner-bottom")
                              .find("> .ui-icon").toggleClass("ui-icon-triangle-1-e ui-icon-triangle-1-s")
                              .end().next().toggleClass("ui-accordion-content-active").slideToggle(0);
                        let sub = $(this).next(), hide_drawing = sub.is(":hidden");
                        sub.css('display', hide_drawing ? 'none' : '');
                        if (!hide_drawing) JSROOT.resize(sub.get(0));
                     })
               .next()
               .addClass("ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom")
               .hide();

         $('#' + uid).find(" .jsroot_collaps_closebtn")
              .button({ icons: { primary: "ui-icon-close" }, text: false })
              .click(function(){
                 mdi.cleanupFrame($(this).parent().next().attr('id'));
                 $(this).parent().next().remove(); // remove drawing
                 $(this).parent().remove();  // remove header
              });

         $('#' + uid)
               .toggleClass("ui-accordion-header-active ui-state-active ui-state-default ui-corner-bottom")
               .find("> .ui-icon").toggleClass("ui-icon-triangle-1-e ui-icon-triangle-1-s").end().next()
               .toggleClass("ui-accordion-content-active").slideToggle(0);

         let frame = $("#" + hid).attr('frame_title', title).css('overflow','hidden')
                                 .attr('can_resize','height') // inform JSROOT that it can resize height of the
                                 .css('position','relative') // this required for correct positioning of 3D canvas in WebKit
                                 .get(0);

         return this.afterCreateFrame(frame);
       }

    } // class CollapsibleDisplay

   // ================================================

   class TabsDisplay extends JSROOT.MDIDisplay {

      constructor(frameid) {
         super(frameid);
         this.cnt = 0;
      }

      forEachFrame(userfunc, only_visible) {
         let topid = this.frameid + '_tabs';

         if (!document.getElementById(topid)) return;

         if (typeof userfunc != 'function') return;

         let cnt = -1;
         let active = $('#' + topid).tabs("option", "active");

         $('#' + topid + '> .tabs_draw').each(function() {
            cnt++;
            if (!only_visible || (cnt == active))
               userfunc($(this).get(0));
         });
      }

      getActiveFrame() {
         let found = null;
         this.forEachFrame(frame => { if (!found) found = frame; }, true);
         return found;
      }

      activateFrame(frame) {
         let cnt = 0, id = -1;
         this.forEachFrame(fr => {
            if ($(fr).attr('id') == $(frame).attr('id')) id = cnt;
            cnt++;
         });
         $('#' + this.frameid + "_tabs").tabs("option", "active", id);

         this.active_frame_title = d3.select(frame).attr('frame_title');
      }

      createFrame(title) {

         this.beforeCreateFrame(title);

         let mdi = this,
             topid = this.frameid + '_tabs',
             hid = topid + "_sub" + this.cnt++,
             li = '<li><a href="#' + hid + '">' + title
                    + '</a><span class="ui-icon ui-icon-close" style="float: left; margin: 0.4em 0.2em 0 0; cursor: pointer;" role="presentation">Remove Tab</span></li>',
            cont = '<div class="tabs_draw" id="' + hid + '"></div>';

         if (!document.getElementById(topid)) {
            $("#" + this.frameid).append('<div id="' + topid + '" class="jsroot">' + ' <ul>' + li + ' </ul>' + cont + '</div>');

            let tabs = $("#" + topid)
                          .css('overflow','hidden')
                          .tabs({
                             heightStyle : "fill",
                             activate : function (event,ui) {
                                $(ui.newPanel).css('overflow', 'hidden');
                                JSROOT.resize($(ui.newPanel).get(0));
                              }
                           });

            tabs.delegate("span.ui-icon-close", "click", function() {
               let panelId = $(this).closest("li").remove().attr("aria-controls");
               mdi.cleanupFrame(panelId);
               $("#" + panelId).remove();
               tabs.tabs("refresh");
               if ($('#' + topid + '> .tabs_draw').length == 0)
                  $("#" + topid).remove();

            });
         } else {
            $("#" + topid).find("> .ui-tabs-nav").append(li);
            $("#" + topid).append(cont);
            $("#" + topid).tabs("refresh");
            $("#" + topid).tabs("option", "active", -1);
         }
         $('#' + hid)
            .empty()
            .css('overflow', 'hidden')
            .attr('frame_title', title);

         return this.afterCreateFrame($('#' + hid).get(0));
      }

      checkMDIResize(frame_id, size) {
         $("#" + this.frameid + '_tabs').tabs("refresh");
         super.checkMDIResize(frame_id, size);
      }

   } // class TabsDisplay

   // ==================================================

   class FlexibleDisplayOld extends JSROOT.MDIDisplay {

      constructor(frameid) {
         super(frameid);
         this.cnt = 0; // use to count newly created frames
      }

      forEachFrame(userfunc,  only_visible) {
         if (typeof userfunc != 'function') return;

         let main = d3.select(`#${this.frameid}_flex`);
         if (main.empty()) return;

         main.selectAll(".flex_draw").each(function() {
            // check if only visible specified
            if (only_visible && $(this).is(":hidden")) return;

            userfunc(this);
         });
      }

      getActiveFrame() {
         let found = super.getActiveFrame();
         if (found && !$(found).is(":hidden")) return found;

         found = null;
         this.forEachFrame(frame => { if (!found) found = frame; }, true);

         return found;
      }

      activateFrame(frame) {
         let sel;
         if (frame === 'first') {
            $(`#${topid}`).selectAll(".flex_frame").each(function() {
               if (!$(this).is(":hidden") && ($(this).prop('state') != "minimal") && !sel) sel = $(this);
            });
         } else if (typeof frame == 'object') {
            sel = $(frame);
         }
         if (!sel) return;
         if (sel.hasClass("flex_draw")) sel = sel.parent();

         sel.appendTo(sel.parent());

         if (sel.prop('state') == "minimal") return;
         let draw_frame = sel.find(".flex_draw").get(0);
         jsrp.selectActivePad({ pp: jsrp.getElementCanvPainter(draw_frame), active: true });
         JSROOT.resize(draw_frame);
      }

      createFrame(title) {

         this.beforeCreateFrame(title);

         let topid = this.frameid + '_flex';

         if (!document.getElementById(topid))
            d3.select("#" + this.frameid).html(`<div id="${topid}" class="jsroot" style="overflow:none; height:100%; width:100%"></div>`);

         let mdi = this,
             top = d3.select("#" + topid),
             w = top.node().clientWidth,
             h = top.node().clientHeight,
             subid = topid + "_frame" + this.cnt;

         top.append('div').attr("id", subid).attr("class", "flex_frame").style("position", "absolute")
            .html(`<div class="ui-widget-header flex_header">
                     <p>${title}</p>
                     <button type="button" style="float:right; width:1.4em"/>
                     <button type="button" style="float:right; width:1.4em"/>
                     <button type="button" style="float:right; width:1.4em"/>
                    </div>
                    <div id="${subid}_cont" class="flex_draw">
                    </div>`);

         function ChangeWindowState(main, state) {
            let curr = main.prop('state');
            if (!curr) curr = "normal";
            main.prop('state', state);
            if (state == curr) return;

            if (curr == "normal") {
               main.prop('original_height', main.height());
               main.prop('original_width', main.width());
               main.prop('original_top', main.css('top'));
               main.prop('original_left', main.css('left'));
            }

            main.find(".jsroot_minbutton").find('.ui-icon')
                .toggleClass("ui-icon-triangle-1-s", state!="minimal")
                .toggleClass("ui-icon-triangle-2-n-s", state=="minimal");

            main.find(".jsroot_maxbutton").find('.ui-icon')
                .toggleClass("ui-icon-triangle-1-n", state!="maximal")
                .toggleClass("ui-icon-triangle-2-n-s", state=="maximal");

            switch (state) {
               case "minimal":
                  main.height(main.find('.flex_header').height()).width("auto");
                  main.find(".flex_draw").css("display","none");
                  main.find(".ui-resizable-handle").css("display","none");
                  break;
               case "maximal":
                  main.height("100%").width("100%").css('left','').css('top','');
                  main.find(".flex_draw").css("display","");
                  main.find(".ui-resizable-handle").css("display","none");
                  break;
               default:
                  main.find(".flex_draw").css("display","");
                  main.find(".ui-resizable-handle").css("display","");
                  main.height(main.prop('original_height'))
                      .width(main.prop('original_width'));
                  if (curr!="minimal")
                     main.css('left', main.prop('original_left'))
                         .css('top', main.prop('original_top'));
            }

            if (state !== "minimal")
               mdi.activateFrame(main.get(0));
            else
               mdi.activateFrame("first");
         }

         d3.select("#" + subid)
            .style('left', Math.round(w * (this.cnt % 5)/10) + "px")
            .style('top', Math.round(h * (this.cnt % 5)/10) + "px")
            .style('width', Math.round(w * 0.58) + "px")
            .style('height', Math.round(h * 0.58) + "px");
/*            .resizable({
               helper: "jsroot-flex-resizable-helper",
               start: function(event, ui) {
                  // bring element to front when start resizing
                  mdi.activateFrame(this);
               },
               stop: function(event, ui) {
                  let rect = { width:  ui.size.width - 1, height: ui.size.height - $(this).find(".flex_header").height() - 1 };
                  JSROOT.resize($(this).find(".flex_draw").get(0), rect);
               }
             })
             .draggable({
               containment: "parent",
               start: function(event , ui) {
                  // bring element to front when start dragging
                  mdi.activateFrame(this);
                  // block dragging when mouse below header
                  let draw_area = $(this).find(".flex_draw"),
                      elementMouseIsOver = document.elementFromPoint(event.clientX, event.clientY),
                      isparent = false;
                  $(elementMouseIsOver).parents().each(function() { if ($(this).get(0) === draw_area.get(0)) isparent = true; });
                  if (isparent) return false;
               }
            })
          .click(function() { mdi.activateFrame(this); })
          .find('.flex_header')
            // .hover(function() { $(this).toggleClass("ui-state-hover"); })
            .click(function() {
               mdi.activateFrame(this.parentNode);
            })
            .dblclick(function() {
               let main = $(this).parent();
               if (main.prop('state') == "normal")
                  ChangeWindowState(main, "maximal");
               else
                  ChangeWindowState(main, "normal");
            })
           .find("button")
              .first()
              .attr('title','close canvas')
              .button({ icons: { primary: "ui-icon-close" }, text: false })
              .click(function() {
                 let main = $(this).parent().parent();
                 mdi.cleanupFrame(main.find(".flex_draw").get(0));
                 main.remove();
                 mdi.activateFrame('first'); // set active as first window
              })
              .next()
              .attr('title','maximize canvas')
              .addClass('jsroot_maxbutton')
              .button({ icons: { primary: "ui-icon-triangle-1-n" }, text: false })
              .click(function() {
                 let main = $(this).parent().parent();
                 let maximize = $(this).find('.ui-icon').hasClass("ui-icon-triangle-1-n");
                 ChangeWindowState(main, maximize ? "maximal" : "normal");
              })
              .next()
              .attr('title','minimize canvas')
              .addClass('jsroot_minbutton')
              .button({ icons: { primary: "ui-icon-triangle-1-s" }, text: false })
              .click(function() {
                 let main = $(this).parent().parent();
                 let minimize = $(this).find('.ui-icon').hasClass("ui-icon-triangle-1-s");
                 ChangeWindowState(main, minimize ? "minimal" : "normal");
              });
*/
         // set default z-index to avoid overlap of these special elements
         // $("#" + subid).find(".ui-resizable-handle").css('z-index', '');

         this.cnt++;

         let frame = d3.select(`#${subid}_cont`).attr('frame_title', title).node();

         return this.afterCreateFrame(frame);
      }

   } // class FlexibleDisplayOld

   // ===================================================

   /** @summary Create MDI display
     * @private */
   JSROOT.create_jq_mdi = function(frameid, kind) {
      if (kind == "tabs")
         return new TabsDisplay(frameid);

      if (kind.indexOf("coll") == 0)
         return new CollapsibleDisplay(frameid);

      return new FlexibleDisplayOld(frameid);
   }


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

      player.KeyUp = function(e) {
         if (e.keyCode == 13) this.PerformDraw();
      }

      player.ShowExtraButtons = function(args) {
         let main = $(this.selectDom().node());

          main.find(".treedraw_buttons")
             .append(" Cut: <input class='treedraw_cut ui-corner-all ui-widget' style='width:8em;margin-left:5px' title='cut expression'></input>"+
                     " Opt: <input class='treedraw_opt ui-corner-all ui-widget' style='width:5em;margin-left:5px' title='histogram draw options'></input>"+
                     " Num: <input class='treedraw_number' style='width:7em;margin-left:5px' title='number of entries to process (default all)'></input>" +
                     " First: <input class='treedraw_first' style='width:7em;margin-left:5px' title='first entry to process (default first)'></input>" +
                     " <button class='treedraw_clear' title='Clear drawing'>Clear</button>");

          let numentries = this.local_tree ? this.local_tree.fEntries : 0;

          main.find(".treedraw_cut").val(args && args.parse_cut ? args.parse_cut : "").keyup(this.keyup);
          main.find(".treedraw_opt").val(args && args.drawopt ? args.drawopt : "").keyup(this.keyup);
          main.find(".treedraw_number").val(args && args.numentries ? args.numentries : "").spinner({ numberFormat: "n", min: 0, page: 1000, max: numentries || 0 }).keyup(this.keyup);
          main.find(".treedraw_first").val(args && args.firstentry ? args.firstentry : "").spinner({ numberFormat: "n", min: 0, page: 1000, max: numentries || 0 }).keyup(this.keyup);
          main.find(".treedraw_clear").button().click(() => JSROOT.cleanup(this.drawid));
      }

      player.Show = function(args) {

         let main = $(this.selectDom().node());

         this.drawid = "jsroot_tree_player_" + JSROOT._.id_counter++ + "_draw";

         this.keyup = this.KeyUp.bind(this);

         let show_extra = args && (args.parse_cut || args.numentries || args.firstentry);

         main.html("<div class='treedraw_buttons' style='padding-left:0.5em'>" +
               "<button class='treedraw_exe' title='Execute draw expression'>Draw</button>" +
               " Expr:<input class='treedraw_varexp treedraw_varexp_info ui-corner-all ui-widget' style='width:12em;margin-left:5px' title='draw expression'></input> " +
               "<label class='treedraw_varexp_info'>\u24D8</label>" +
               (show_extra ? "" : "<button class='treedraw_more'>More</button>") +
               "</div>" +
               "<hr/>" +
               "<div id='" + this.drawid + "' style='width:100%'></div>");

         // only when main html element created, one can painter
         // ObjectPainter allow such usage of methods from BasePainter
         this.setTopPainter();

         let p = this;

         if (this.local_tree)
            main.find('.treedraw_buttons')
                .prop("title", "Tree draw player for: " + this.local_tree.fName);
         main.find('.treedraw_exe')
             .button().click(() => p.PerformDraw());
         main.find('.treedraw_varexp')
              .val(args && args.parse_expr ? args.parse_expr : (this.dflt_expr || "px:py"))
              .keyup(this.keyup);
         main.find('.treedraw_varexp_info')
             .prop('title', "Example of valid draw expressions:\n" +
                          "  px  - 1-dim draw\n" +
                          "  px:py  - 2-dim draw\n" +
                          "  px:py:pz  - 3-dim draw\n" +
                          "  px+py:px-py - use any expressions\n" +
                          "  px:py>>Graph - create and draw TGraph\n" +
                          "  px:py>>dump - dump extracted variables\n" +
                          "  px:py>>h(50,-5,5,50,-5,5) - custom histogram\n" +
                          "  px:py;hbins:100 - custom number of bins");

         if (show_extra) {
            this.ShowExtraButtons(args);
         } else {
            main.find('.treedraw_more').button().click(function() {
               $(this).remove();
               p.ShowExtraButtons();
            });
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

      player.PerformDraw = function() {

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
