(function (global, factory) {
typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, 'node') :
typeof define === 'function' && define.amd ? define(['exports'], factory) : factory({}, 'plain');

})(this, (function (exports, export_kind) { 'use strict';





// try to define global JSROOT
if (typeof globalThis !== "undefined")
   globalThis.JSROOT = exports;

//openuicfg // DO NOT DELETE, used to configure openui5 usage like JSROOT.openui5src = "nojsroot";

}));
