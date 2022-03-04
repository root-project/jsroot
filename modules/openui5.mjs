/// Bootstraping of OpenUI5 functionality in JSROOT

import { _, source_dir } from './core.mjs';

let resolveFunc, rejectFunc, rootui5sys;

globalThis.completeUI5Loading = function() {
   sap.ui.loader.config({
      paths: {
         jsroot: source_dir,
         rootui5: rootui5sys
      }
   });

   if (resolveFunc) {
      resolveFunc(sap);
      resolveFunc = null;
   }
};

function tryOpenOpenUI(sources) {
   if (!sources || (sources.length == 0)) {
      if (rejectFunc) {
         rejectFunc(Error("openui5 was not possible to load"));
         rejectFunc = null;
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

   element.setAttribute('data-sap-ui-libs', _.openui5libs ?? "sap.m, sap.ui.layout, sap.ui.unified, sap.ui.commons");

   element.setAttribute('data-sap-ui-theme', _.openui5theme || 'sap_belize');
   element.setAttribute('data-sap-ui-compatVersion', 'edge');
   // element.setAttribute('data-sap-ui-bindingSyntax', 'complex');

   element.setAttribute('data-sap-ui-preload', 'async'); // '' to disable Component-preload.js

   element.setAttribute('data-sap-ui-evt-oninit', "completeUI5Loading()");

   element.onerror = function() {
      // remove failed element
      element.parentNode.removeChild(element);
      // and try next
      tryOpenOpenUI(sources);
   }

   element.onload = function() {
      console.log('Load openui5 from ' + src);
   }

   document.getElementsByTagName("head")[0].appendChild(element);
}

rootui5sys = source_dir.replace(/jsrootsys/g, "rootui5sys");

if (rootui5sys == source_dir) {
   // if jsrootsys location not detected, try to guess it
   if (window.location.port && (window.location.pathname.indexOf("/win") >= 0) && (!_.openui5src || _.openui5src == 'nojsroot' || _.openui5src == 'jsroot'))
      rootui5sys = window.location.origin + window.location.pathname + "../rootui5sys/";
   else
      rootui5sys = undefined;
}


// return Promise let loader wait before dependent source will be invoked

function doUi5Loading() {
   // very simple - openui5 was loaded before and will be used as is
   if (typeof sap == 'object')
      return sap;

   if (!resolveFunc) {
      console.error('ui5 loading already started - need better solution');
      return null;
   }

   let openui5_sources = [],
       openui5_dflt = "https://openui5.hana.ondemand.com/1.98.0/",
       openui5_root = rootui5sys ? rootui5sys + "distribution/" : "";

   if (typeof _.openui5src == 'string') {
      switch (_.openui5src) {
         case "nodefault": openui5_dflt = ""; break;
         case "default": openui5_sources.push(openui5_dflt); openui5_dflt = ""; break;
         case "nojsroot": /* openui5_root = ""; */ break;
         case "jsroot": openui5_sources.push(openui5_root); openui5_root = ""; break;
         default: openui5_sources.push(_.openui5src); break;
      }
   }

   if (openui5_root && (openui5_sources.indexOf(openui5_root) < 0)) openui5_sources.push(openui5_root);
   if (openui5_dflt && (openui5_sources.indexOf(openui5_dflt) < 0)) openui5_sources.push(openui5_dflt);

   return new Promise((resolve, reject) => {
      resolveFunc = resolve;
      rejectFunc = reject;
      tryOpenOpenUI(openui5_sources);
   });

}

export { doUi5Loading };
