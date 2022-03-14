/// speical module to support older JSROOT application

import * as jsroot from './core.mjs';

import * as jsroot_io from './io.mjs';

import * as jsroot_draw from './draw.mjs';

import { getHPainter } from './hierarchy.mjs';

let sync_promises = [];
let jsrp = null, geo = null; // old JSROOT.Painter and JSROOT.GEO handles

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

function require(need) {
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
         arr.push(Promise.all([import("./hist/TH1Painter.mjs"), import("./hist/TH2Painter.mjs"), import("./hist/THStackPainter.mjs")]).then(arr => {
            // copy hist painter objects into JSROOT
            Object.assign(globalThis.JSROOT, arr[0], arr[1], arr[2]);
         }));
      else if (name == "more")
         arr.push(import("./more.mjs"));
      else if (name == "gpad")
         arr.push(Promise.all([import("./gpad/TAxisPainter.mjs"), import("./gpad/TPadPainter.mjs"), import("./gpad/TCanvasPainter.mjs")]).then(arr => {
            // copy all classes
            Object.assign(globalThis.JSROOT, arr[0], arr[1], arr[2]);
            if (jsrp) jsrp.ensureTCanvas = arr[2].ensureTCanvas;
            return handle;
         }));
      else if (name == "io")
         arr.push(import("./io.mjs"));
      else if (name == "tree")
         arr.push(import("./tree.mjs"));
      else if (name == "geom")
         arr.push(geo ? Promise.resolve(geo) : Promise.all(import("./geobase.mjs"), import("./geom.mjs")).then(res => {
            geo = {};
            Object.assign(geo, res[0], res[1]);
            globalThis.JSROOT.GEO = geo;
            globalThis.JSROOT.TGeoPainter = res[1].TGeoPainter;
            return geo;
         }));
      else if (name == "math")
         arr.push(import("./math.mjs"));
      else if (name == "latex")
         arr.push(import("./latex.mjs"));
      else if (name == "painter")
         arr.push(jsrp ? Promise.resolve(jsrp) : Promise.all([import('./d3.mjs'), import('./painter.mjs'),
                    import('./draw.mjs'), import('./base/colors.mjs'), import('./base/BasePainter.mjs'), import('./base/ObjectPainter.mjs')]).then(res => {
            globalThis.d3 = res[0]; // assign global d3
            jsrp = {};
            Object.assign(jsrp, res[1], res[2], res[3]);
            globalThis.JSROOT.Painter = jsrp;
            globalThis.JSROOT.BasePainter = res[4].BasePainter;
            globalThis.JSROOT.ObjectPainter = res[5].ObjectPainter;
            return jsrp;
         }));
      else if (name == "base3d")
         arr.push(import("./base3d.mjs"));
      else if (name == "interactive")
         arr.push(import("./interactive.mjs"));
      else if (name == "hierarchy")
         arr.push(import("./hierarchy.mjs").then(h => {
            Object.assign(globalThis.JSROOT, h);
            globalThis.JSROOT.hpainter = getHPainter();
            return h;
         }));
       else if (name == "v7hist")
         arr.push(import("./v7hist.mjs"));
      else if (name == "v7hist3d")
         arr.push(import("./v7hist3d.mjs"));
      else if (name == "v7more")
         arr.push(import("./v7more.mjs"));
      else if (name == "v7gpad")
         arr.push(import("./v7gpad.mjs"));
      else if (name == "openui5")
         arr.push(import("./openui5.mjs").then(handle => handle.doUi5Loading()));
      else if (name.indexOf(".js") >= 0)
         arr.push(import("./core.mjs").then(handle => handle.loadScript(name)));
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

function define(req, factoryFunc) {
   let pr = new Promise(resolveFunc => {
       require(req).then(arr => {
         if (req.length < 2) factoryFunc(arr)
                        else factoryFunc(...arr);
         resolveFunc(true);
       });
   });

   sync_promises.push(pr); // will wait until other PRs are finished
}

async function complete_loading() {
   if (!sync_promises) return;
   await Promise.all(sync_promises);
   sync_promises = [];
}

function ensureJSROOT()
{
   // need to keep global JSROOT for use in external scripts
   if (typeof globalThis.JSROOT == 'undefined')
      globalThis.JSROOT = {};

   Object.assign(globalThis.JSROOT, jsroot, jsroot_io, jsroot_draw);
   globalThis.JSROOT.require = require;
   globalThis.JSROOT.define = define;
   globalThis.JSROOT.extend = Object.assign;

   globalThis.JSROOT.hpainter = getHPainter();
}

export { ensureJSROOT, require, define, complete_loading };
