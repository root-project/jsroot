(function (factory) {
typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
typeof define === 'function' && define.amd ? define(['exports'], factory) : factory({});

})((function (exports) {

'use strict';

function core_import() {
   return import('../modules/core.mjs');
}

function v6_import() {
   return import('../modules/v6.mjs');
}

exports.httpRequest = function(...args) {
   return core_import().then(handle => handle.httpRequest(...args));
}

exports.require = function(...args) {
   return v6_import().then(handle => handle.require(...args));
}

exports.define = function(req, factoryFunc) {
   v6_import().then(handle => handle.define(req, factoryFunc));
}

exports.buildGUI = function(...args) {
   return core_import().then(handle => handle.buildGUI(...args));
}

exports.openFile = function(...args) {
   return core_import().then(handle => handle.openFile(...args));
}

// try to define global JSROOT
if (typeof globalThis !== "undefined") {
   globalThis.JSROOT = exports;

   core_import().then(handle => {
      // copy all methods
      let old = exports.require;
      Object.assign(exports, handle);
      exports.require = old;
      return v6_import();
   }).then(v6 => {
      exports.require = v6.require;
      exports.define = v6.define;
      v6.ensureJSROOT();
   });

}

}));
