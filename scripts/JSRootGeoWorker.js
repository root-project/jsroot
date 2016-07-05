JSROOT = {}; // just place holder for JSROOT.GEO functions

importScripts("three.js", "ThreeCSG.js", "JSRootGeoBase.js");

postMessage({ log : "geoworker three.js " + THREE.REVISION });


onmessage = function(e) {

   if (typeof e.data == 'string') {
      console.log('Worker get message ' + e.data);

      return;
   }

   if (typeof e.data != 'object') return;

   if ('init' in e.data) {
      e.data.tm1 = new Date();
      console.log('start worker ' +  (e.data.tm1.getTime() -  e.data.tm0.getTime()));
      postMessage(e.data);
   }

   if ('map' in e.data) {
      var map = e.data.map;
      e.data.tm1 = new Date();

      console.log('get map len ' + map.length);
      console.log('copy of cloned data takes ' + (e.data.tm1.getTime() -  e.data.tm0.getTime()));
   }

}
