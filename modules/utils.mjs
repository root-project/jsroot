
import { settings, isBatchMode, source_dir } from './core.mjs';

import { select as d3_select } from './d3.mjs';


/** @summary Display progress message in the left bottom corner.
  * @desc Previous message will be overwritten
  * if no argument specified, any shown messages will be removed
  * @param {string} msg - message to display
  * @param {number} tmout - optional timeout in milliseconds, after message will disappear
  * @private */
function showProgress(msg, tmout) {
   if (isBatchMode() || (typeof document === 'undefined')) return;
   let id = "jsroot_progressbox",
       box = d3_select("#" + id);

   if (!settings.ProgressBox) return box.remove();

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


function tryOpenOpenUI(sources, args) {
   if (!sources || (sources.length == 0)) {
      if (args.rejectFunc) {
         args.rejectFunc(Error("openui5 was not possible to load"));
         args.rejectFunc = null;
      }
      return;
   }

   // where to take openui5 sources
   let src = sources.shift();

   if ((src.indexOf("roothandler") == 0) && (src.indexOf("://") < 0))
      src = src.replace(/\:\//g,"://");

   let element = document.createElement("script");
   element.setAttribute('type', "text/javascript");
   element.setAttribute('id', "sap-ui-bootstrap");
   // use nojQuery while we are already load jquery and jquery-ui, later one can use directly sap-ui-core.js

   // this is location of openui5 scripts when working with THttpServer or when scripts are installed inside JSROOT
   element.setAttribute('src', src + "resources/sap-ui-core.js"); // latest openui5 version

   element.setAttribute('data-sap-ui-libs', args.openui5libs ?? "sap.m, sap.ui.layout, sap.ui.unified, sap.ui.commons");

   element.setAttribute('data-sap-ui-theme', args.openui5theme || 'sap_belize');
   element.setAttribute('data-sap-ui-compatVersion', 'edge');
   // element.setAttribute('data-sap-ui-bindingSyntax', 'complex');

   element.setAttribute('data-sap-ui-preload', 'async'); // '' to disable Component-preload.js

   element.setAttribute('data-sap-ui-evt-oninit', "completeUI5Loading()");

   element.onerror = function() {
      // remove failed element
      element.parentNode.removeChild(element);
      // and try next
      tryOpenOpenUI(sources, args);
   }

   element.onload = function() {
      console.log('Load openui5 from ' + src);
   }

   document.getElementsByTagName("head")[0].appendChild(element);
}


// return Promise let loader wait before dependent source will be invoked

async function loadOpenui5(args) {
   // very simple - openui5 was loaded before and will be used as is
   if (typeof sap == 'object')
      return sap;

   if (!args) args = {};

   let rootui5sys = source_dir.replace(/jsrootsys/g, "rootui5sys");

   if (rootui5sys == source_dir) {
      // if jsrootsys location not detected, try to guess it
      if (window.location.port && (window.location.pathname.indexOf("/win") >= 0) && (!args.openui5src || args.openui5src == 'nojsroot' || args.openui5src == 'jsroot'))
         rootui5sys = window.location.origin + window.location.pathname + "../rootui5sys/";
      else
         rootui5sys = undefined;
   }

   let openui5_sources = [],
       openui5_dflt = "https://openui5.hana.ondemand.com/1.98.0/",
       openui5_root = rootui5sys ? rootui5sys + "distribution/" : "";

   if (typeof args.openui5src == 'string') {
      switch (args.openui5src) {
         case "nodefault": openui5_dflt = ""; break;
         case "default": openui5_sources.push(openui5_dflt); openui5_dflt = ""; break;
         case "nojsroot": /* openui5_root = ""; */ break;
         case "jsroot": openui5_sources.push(openui5_root); openui5_root = ""; break;
         default: openui5_sources.push(args.openui5src); break;
      }
   }

   if (openui5_root && (openui5_sources.indexOf(openui5_root) < 0)) openui5_sources.push(openui5_root);
   if (openui5_dflt && (openui5_sources.indexOf(openui5_dflt) < 0)) openui5_sources.push(openui5_dflt);

   return new Promise((resolve, reject) => {

      args.resolveFunc = resolve;
      args.rejectFunc = reject;

      globalThis.completeUI5Loading = function() {
         sap.ui.loader.config({
            paths: {
               jsroot: source_dir,
               rootui5: rootui5sys
            }
         });

         if (args.resolveFunc) {
            args.resolveFunc(sap);
            args.resolveFunc = null;
         }
      };

      tryOpenOpenUI(openui5_sources, args);
   });

}

export { showProgress, closeCurrentWindow, loadOpenui5 };
