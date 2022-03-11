/// speical module to support older JSROOT application

import * as jsroot from './core.mjs';

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
         arr.push(import("../modules/hist.mjs").then(handle => {
            globalThis.JSROOT.TH1Painter = handle.TH1Painter;
            globalThis.JSROOT.TH2Painter = handle.TH2Painter;
         }))
      else if (name == "hist3d")
         arr.push(import("../modules/hist3d.mjs"));
      else if (name == "more")
         arr.push(import("../modules/more.mjs"));
      else if (name == "gpad")
         arr.push(import("../modules/gpad.mjs").then(handle => {
            if (jsrp) jsrp.ensureTCanvas = handle.ensureTCanvas;
            return handle;
         }));
      else if (name == "io")
         arr.push(import("../modules/io.mjs"));
      else if (name == "tree")
         arr.push(import("../modules/tree.mjs"));
      else if (name == "geom")
         arr.push(geo ? Promise.resolve(geo) : Promise.all(import("../modules/geobase.mjs"), import("../modules/geom.mjs")).then(res => {
            geo = {};
            Object.assign(geo, res[0], res[1]);
            globalThis.JSROOT.GEO = geo;
            globalThis.JSROOT.TGeoPainter = res[1].TGeoPainter;
            return geo;
         }));
      else if (name == "math")
         arr.push(import("../modules/math.mjs"));
      else if (name == "latex")
         arr.push(import("../modules/latex.mjs"));
      else if (name == "painter")
         arr.push(jsrp ? Promise.resolve(jsrp) : Promise.all([import('../modules/d3.mjs'), import('../modules/painter.mjs'),
                    import('../modules/draw.mjs'), import('../modules/base/colors.mjs'), import('../modules/base/BasePainter.mjs'), import('../modules/base/ObjectPainter.mjs')]).then(res => {
            globalThis.d3 = res[0]; // assign global d3
            jsrp = {};
            Object.assign(jsrp, res[1], res[2], res[3]);
            globalThis.JSROOT.Painter = jsrp;
            globalThis.JSROOT.BasePainter = res[4].BasePainter;
            globalThis.JSROOT.ObjectPainter = res[5].ObjectPainter;
            return jsrp;
         }));
      else if (name == "base3d")
         arr.push(import("../modules/base3d.mjs"));
      else if (name == "interactive")
         arr.push(import("../modules/interactive.mjs"));
      else if (name == "hierarchy")
         arr.push(import("../modules/hierarchy.mjs").then(h => {
            Object.assign(globalThis.JSROOT, h);
            globalThis.JSROOT.hpainter = getHPainter();
            return h;
         }));
       else if (name == "v7hist")
         arr.push(import("../modules/v7hist.mjs"));
      else if (name == "v7hist3d")
         arr.push(import("../modules/v7hist3d.mjs"));
      else if (name == "v7more")
         arr.push(import("../modules/v7more.mjs"));
      else if (name == "v7gpad")
         arr.push(import("../modules/v7gpad.mjs"))
      else if (name == "openui5")
         arr.push(import("../modules/openui5.mjs").then(handle => handle.doUi5Loading()));
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
   if (typeof globalThis.JSROOT == 'undefined') {
      globalThis.JSROOT = Object.assign({}, jsroot);
      globalThis.JSROOT.require = require;
      globalThis.JSROOT.define = define;
   }

   globalThis.JSROOT.hpainter = getHPainter();
}

export { ensureJSROOT, require, define, complete_loading };
