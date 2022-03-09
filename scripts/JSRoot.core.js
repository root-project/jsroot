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

exports.decodeUrl = function(...args) {
   return core_import().then(handle => handle.decodeUrl(...args));
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
      // copy all methods - even when asynchrone
      globalThis.JSROOT.internals = handle.internals;
   });

}

console.log('loading JSRootCore.js done');

//openuicfg // DO NOT DELETE, used to configure openui5 usage like _.openui5src = "nojsroot";

}));
