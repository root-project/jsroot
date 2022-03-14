import { decodeUrl, settings, internals, findFunction, parse } from './core.mjs';

import { select as d3_select } from './d3.mjs';

import { readStyleFromURL } from './painter.mjs';

import { HierarchyPainter } from './hierarchy.mjs';

/** @summary Build main GUI
  * @returns {Promise} when completed
  * @private  */
async function buildGUI(gui_element, gui_kind) {
   let myDiv = (typeof gui_element == 'string') ? d3_select('#' + gui_element) : d3_select(gui_element);
   if (myDiv.empty()) return alert('no div for gui found');

   myDiv.html(""); // clear element

   let d = decodeUrl(), online = (gui_kind == "online"), nobrowser = false, drawing = false;

   if (gui_kind == "draw") {
      online = drawing = nobrowser = true;
   } else if ((gui_kind == "nobrowser") || d.has("nobrowser") || (myDiv.attr("nobrowser") && myDiv.attr("nobrowser")!=="false")) {
      nobrowser = true;
   }

   if (myDiv.attr("ignoreurl") === "true")
      settings.IgnoreUrlOptions = true;

   readStyleFromURL();

   if (nobrowser) {
      let guisize = d.get("divsize");
      if (guisize) {
         guisize = guisize.split("x");
         if (guisize.length != 2) guisize = null;
      }

      if (guisize) {
         myDiv.style('position',"relative").style('width', guisize[0] + "px").style('height', guisize[1] + "px");
      } else {
         d3_select('html').style('height','100%');
         d3_select('body').style('min-height','100%').style('margin',0).style('overflow',"hidden");
         myDiv.style('position',"absolute").style('left',0).style('top',0).style('bottom',0).style('right',0).style('padding',1);
      }
   }

   let hpainter = new HierarchyPainter('root', null);

   if (online) hpainter.is_online = drawing ? "draw" : "online";
   if (drawing) hpainter.exclude_browser = true;
   hpainter.start_without_browser = nobrowser;

   await hpainter.startGUI(myDiv);

   if (!nobrowser) {
      hpainter.initializeBrowser();
   } else if (drawing) {
      let obj = null, func = internals.GetCachedObject || findFunction('GetCachedObject');
      if (typeof func == 'function')
         obj = parse(func());
      if (obj) hpainter._cached_draw_object = obj;
      let opt = d.get("opt", "");
      if (d.has("websocket")) opt+=";websocket";
      await hpainter.display("", opt);
   }
   return hpainter;
}

export { buildGUI, internals };
