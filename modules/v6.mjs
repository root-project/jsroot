/// speical module to support older JSROOT application

import * as jsroot from './core.mjs';

import { getHPainter } from './hierarchy.mjs';

let sync_promises = [];
let jsrp = null; // old JSROOT.Painter handle

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
         arr.push(import("../modules/hist.mjs"));
      else if (name == "hist3d")
         arr.push(import("../modules/hist3d.mjs"));
      else if (name == "more")
         arr.push(import("../modules/more.mjs"));
      else if (name == "gpad")
         arr.push(import("../modules/gpad.mjs"));
      else if (name == "io")
         arr.push(import("../modules/io.mjs"));
      else if (name == "tree")
         arr.push(import("../modules/tree.mjs"));
      else if (name == "geobase")
         arr.push(import("../modules/geobase.mjs"));
      else if (name == "geom")
         arr.push(import("../modules/geom.mjs"));
      else if (name == "math")
         arr.push(import("../modules/math.mjs"));
      else if (name == "latex")
         arr.push(import("../modules/latex.mjs"));
      else if (name == "painter") {
         arr.push(jsrp ? Promise.resolve(jsrp) : Promise.all([import('../modules/painter.mjs'), import('../modules/draw.mjs'), import('../modules/d3.mjs')]).then(res => {
            jsrp = {};
            Object.assign(jsrp, res[0], res[1]);
            globalThis.JSROOT.Painter = jsrp;
            globalThis.JSROOT.ObjectPainter = res[0].ObjectPainter;
            globalThis.JSROOT.BasePainter = res[0].BasePainter;
            globalThis.d3 = res[2]; // assign global d3
            return jsrp;
         }));
      } else if (name == "base3d")
         arr.push(import("../modules/base3d.mjs"));
      else if (name == "interactive")
         arr.push(import("../modules/interactive.mjs"));
      else if (name == "hierarchy")
         arr.push(import("../modules/hierarchy.mjs"));
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
