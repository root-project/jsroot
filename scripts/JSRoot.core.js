(function (factory) {
typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
typeof define === 'function' && define.amd ? define(['exports'], factory) : factory({});

})((function (exports) {

'use strict';

let sync_promises = [], getHPainter,
    jsrp = null, geo = null; // old JSROOT.Painter and JSROOT.GEO handles

async function _sync() {
   if (sync_promises) {
      await Promise.all(sync_promises);
      sync_promises = [];

      if (globalThis.JSROOT && getHPainter)
         globalThis.JSROOT.hpainter = getHPainter();
   }
   return globalThis.JSROOT;
}

exports.httpRequest = function(...args) {
   return _sync().then(() => import('../modules/core.mjs')).then(handle => handle.httpRequest(...args));
}

exports.loadScript = function(...args) {
   return _sync().then(() => import('../modules/core.mjs')).then(handle => handle.loadScript(...args));
}

exports.buildGUI = function(...args) {
   return _sync().then(() => import('../modules/gui.mjs')).then(handle => handle.buildGUI(...args));
}

exports.openFile = function(...args) {
   return _sync().then(() => import('../modules/io.mjs')).then(handle => handle.openFile(...args));
}


/** @summary Old v6 method to load JSROOT functionality
  * @desc
  * Following components can be specified
  *    - 'io'     TFile functionality
  *    - 'tree'   TTree support
  *    - 'painter' d3.js plus basic painting functions
  *    - 'geom'   TGeo support
  *    - 'math'   some methods from TMath class
  *    - 'hierarchy' hierarchy browser
  *    - 'openui5' OpenUI5 and related functionality
  * @param {Array|string} req - list of required components (as array or string separated by semicolon)
  * @returns {Promise} with array of requirements (or single element) */

function v6_require(need) {
   if (!need)
      return Promise.resolve(null);

   if (typeof need == "string") need = need.split(";");

   need.forEach((name,indx) => {
      if ((name.indexOf("load:")==0) || (name.indexOf("user:")==0))
         need[indx] = name.substr(5);
      else if (name == "2d")
         need[indx] = "painter";
      else if ((name == "jq2d") || (name == "jq"))
         need[indx] = "hierarchy";
      else if (name == "v6")
         need[indx] = "gpad";
      else if (name == "v7")
         need[indx] = "v7gpad";
   });

   let arr = [];

   need.forEach(name => {
      if (name == "hist")
         arr.push(Promise.all([import("../modules/hist/TH1Painter.mjs"), import("../modules/hist/TH2Painter.mjs"), import("../modules/hist/THStackPainter.mjs")]).then(arr => {
            // copy hist painter objects into JSROOT
            Object.assign(globalThis.JSROOT, arr[0], arr[1], arr[2]);
         }));
      else if (name == "more")
         arr.push(import("../modules/draw/more.mjs"));
      else if (name == "gpad")
         arr.push(Promise.all([import("../modules/gpad/TAxisPainter.mjs"), import("../modules/gpad/TPadPainter.mjs"), import("../modules/gpad/TCanvasPainter.mjs")]).then(arr => {
            // copy all classes
            Object.assign(globalThis.JSROOT, arr[0], arr[1], arr[2]);
            if (jsrp) jsrp.ensureTCanvas = arr[2].ensureTCanvas;
            return globalThis.JSROOT;
         }));
      else if (name == "io")
         arr.push(import("../modules/io.mjs"));
      else if (name == "tree")
         arr.push(import("../modules/tree.mjs"));
      else if (name == "geom")
         arr.push(geo ? Promise.resolve(geo) : Promise.all(import("../modules/geom/geobase.mjs"), import("../modules/geom/TGeoPainter.mjs")).then(res => {
            geo = {};
            Object.assign(geo, res[0], res[1]);
            globalThis.JSROOT.GEO = geo;
            globalThis.JSROOT.TGeoPainter = res[1].TGeoPainter;
            return geo;
         }));
      else if (name == "math")
         arr.push(import("../modules/base/math.mjs"));
      else if (name == "latex")
         arr.push(import("../modules/base/latex.mjs"));
      else if (name == "painter")
         arr.push(jsrp ? Promise.resolve(jsrp) : Promise.all([import('../modules/d3.mjs'), import('../modules/draw.mjs'),
                import('../modules/base/colors.mjs'), import('../modules/base/BasePainter.mjs'), import('../modules/base/ObjectPainter.mjs')]).then(res => {
            globalThis.d3 = res[0]; // assign global d3
            jsrp = {};
            Object.assign(jsrp, res[1], res[2], res[3], res[4]);
            globalThis.JSROOT.Painter = jsrp;
            globalThis.JSROOT.BasePainter = res[3].BasePainter;
            globalThis.JSROOT.ObjectPainter = res[4].ObjectPainter;
            return jsrp;
         }));
      else if (name == "hierarchy")
         arr.push(Promise.all([import("../modules/gui/HierarchyPainter.mjs"), import("../modules/draw/TTree.mjs")]).then(arr => {
            Object.assign(globalThis.JSROOT, arr[0], arr[1]);
            getHPainter = arr[0].getHPainter;
            globalThis.JSROOT.hpainter = getHPainter();
            return globalThis.JSROOT;
         }));
      else if (name == "openui5")
         arr.push(import("../modules/gui/utils.mjs").then(handle => handle.loadOpenui5({ openui5src: JSROOT?.openui5src, openui5libs: JSROOT?.openui5libs, openui5theme: JSROOT?.openui5theme })));
      else if (name.indexOf(".js") >= 0)
         arr.push(import("../modules/core.mjs").then(handle => handle.loadScript(name)));
   });

   // need notify calling function when require is completed
   let notify;
   sync_promises.push(new Promise(func => { notify = func; }));

   return new Promise(resolveFunc => {
      Promise.all(arr).then(res => {
         resolveFunc(res.length == 1 ? res[0] : res);
         if (notify) notify(true);
      });
   });
}


exports.require = v6_require;

exports.define = function(req, factoryFunc) {
   let pr = new Promise(resolveFunc => {
       v6_require(req).then(arr => {
         if (req.length < 2) factoryFunc(arr)
                        else factoryFunc(...arr);
         resolveFunc(true);
       });
   });

   sync_promises.push(pr); // will wait until other PRs are finished
}


exports.connectWebWindow = async function(arg) {
   await _sync();

   if (typeof arg == 'function')
      arg = { callback: arg };
   else if (!arg || (typeof arg != 'object'))
      arg = {};

   let prereq = "";
   if (arg.prereq) prereq = arg.prereq;
   if (arg.prereq2) prereq += ";" + arg.prereq;

   if (prereq) {
      if (arg.openui5src) JSROOT.openui5src = arg.openui5src;
      if (arg.openui5libs) JSROOT.openui5libs = arg.openui5libs;
      if (arg.openui5theme) JSROOT.openui5theme = arg.openui5theme;
      await v6_require(prereq);
      delete arg.prereq;
      delete arg.prereq2;
      if (arg.prereq_logdiv && document) {
         let elem = document.getElementById(arg.prereq_logdiv);
         if (elem) elem.innerHTML = '';
         delete arg.prereq_logdiv;
      }
   }

   let h = await import('../modules/webwindow.mjs');
   return h.connectWebWindow(arg);
}

// try to define global JSROOT
if ((typeof globalThis !== "undefined") && !globalThis.JSROOT) {

   globalThis.JSROOT = exports;

   globalThis.JSROOT.extend = Object.assign;

   globalThis.JSROOT._complete_loading = _sync;

   let pr = Promise.all([import('../modules/core.mjs'), import('../modules/draw.mjs'), import('../modules/gui/HierarchyPainter.mjs')]).then(arr => {
      Object.assign(globalThis.JSROOT, arr[0], arr[1]);

      globalThis.JSROOT._ = arr[0].internals;

      globalThis.JSROOT.HierarchyPainter = arr[2].HierarchyPainter;
      getHPainter = arr[2].getHPainter;

      globalThis.JSROOT.hpainter = getHPainter();
   });

   sync_promises.push(pr);
}

}));
