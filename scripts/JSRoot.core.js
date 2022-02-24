(function (factory) {
typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
typeof define === 'function' && define.amd ? define(['exports'], factory) : factory({});

})((function (exports) {

'use strict';

function jsroot_import() {
   return import('../modules/core.mjs');
}

exports.httpRequest = function(...args) {
   return jsroot_import().then(handle => handle.httpRequest(...args));
}

exports.require = function(...args) {
   return jsroot_import().then(handle => handle.require(...args));
}

exports.decodeUrl = function(...args) {
   return jsroot_import().then(handle => handle.decodeUrl(...args));
}


// try to define global JSROOT
if (typeof globalThis !== "undefined") {
   globalThis.JSROOT = exports;
   // copy all methods - even when asynchrone
   jsroot_import().then(jsroot => Object.assign(exports, jsroot));
}


//openuicfg // DO NOT DELETE, used to configure openui5 usage like JSROOT.openui5src = "nojsroot";

}));
