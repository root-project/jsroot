/// Bootstraping of OpenUI5 functionality in JSROOT

import { source_dir } from './core.mjs';

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

   // FIXME: do not load JSROOT in general case!!
   if (typeof globalThis.JSROOT === 'undefined')
      globalThis.JSROOT = await import('./main.mjs');

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

export { loadOpenui5 };
