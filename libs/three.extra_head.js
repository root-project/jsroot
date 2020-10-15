// Collection of additional THREE.js classes, required in JSROOT

JSROOT.define(['three'], function(THREE) {

   "use strict";

   if (JSROOT.nodejs) module.exports = THREE;

   // ===============================================================

   // Small initialisation part for used THREE font
   JSROOT.threejs_font_helvetiker_regular = new THREE.Font(
