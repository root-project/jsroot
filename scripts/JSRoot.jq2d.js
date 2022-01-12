/// @file JSRoot.jq2d.js
/// Part of JavaScript ROOT, dependent from jQuery functionality

JSROOT.define(['d3', 'jquery', 'painter', 'hierarchy', 'jquery-ui', 'jqueryui-mousewheel', 'jqueryui-touch-punch'], (d3, $, jsrp) => {

   "use strict";

   JSROOT.loadScript('https://root.cern/js/6.3.2/style/jquery-ui.css');

   if (typeof jQuery === 'undefined') globalThis.jQuery = $;

   return JSROOT;
});
