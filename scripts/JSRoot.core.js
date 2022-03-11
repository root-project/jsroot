(function (factory) {
typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
typeof define === 'function' && define.amd ? define(['exports'], factory) : factory({});

})((function (exports) {

'use strict';

function v6_import() {
   return import('../modules/v6.mjs');
}

exports.httpRequest = function(...args) {
   return import('../modules/core.mjs').then(handle => handle.httpRequest(...args));
}

exports.require = function(...args) {
   return v6_import().then(handle => handle.require(...args));
}

exports.define = function(req, factoryFunc) {
   v6_import().then(handle => handle.define(req, factoryFunc));
}

exports.buildGUI = function(...args) {
   return import('../modules/gui.mjs').then(handle => handle.buildGUI(...args));
}

exports.openFile = function(...args) {
   return import('../modules/io.mjs').then(handle => handle.openFile(...args));
}

// try to define global JSROOT
if (typeof globalThis !== "undefined") {
   globalThis.JSROOT = exports;

   v6_import().then(v6 => v6.ensureJSROOT());
}

}));
