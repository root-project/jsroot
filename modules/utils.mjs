import * as d3 from './d3.mjs';

import * as JSROOT from './core.mjs';

import { select as d3_select } from './d3.mjs';


/** @summary Display progress message in the left bottom corner.
  * @desc Previous message will be overwritten
  * if no argument specified, any shown messages will be removed
  * @param {string} msg - message to display
  * @param {number} tmout - optional timeout in milliseconds, after message will disappear
  * @private */
function showProgress(msg, tmout) {
   if (JSROOT.batch_mode || (typeof document === 'undefined')) return;
   let id = "jsroot_progressbox",
       box = d3_select("#" + id);

   if (!JSROOT.settings.ProgressBox) return box.remove();

   if ((arguments.length == 0) || !msg) {
      if ((tmout !== -1) || (!box.empty() && box.property("with_timeout"))) box.remove();
      return;
   }

   if (box.empty()) {
      box = d3_select(document.body).append("div").attr("id", id);
      box.append("p");
   }

   box.property("with_timeout", false);

   if (typeof msg === "string") {
      box.select("p").html(msg);
   } else {
      box.html("");
      box.node().appendChild(msg);
   }

   if (Number.isFinite(tmout) && (tmout > 0)) {
      box.property("with_timeout", true);
      setTimeout(() => showProgress('', -1), tmout);
   }
}

/** @summary Tries to close current browser tab
  * @desc Many browsers do not allow simple window.close() call,
  * therefore try several workarounds
  * @private */
function closeCurrentWindow() {
   if (!window) return;
   window.close();
   window.open('', '_self').close();
}

export { showProgress, closeCurrentWindow };
