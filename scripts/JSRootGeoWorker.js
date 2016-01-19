// @file JSRootGeoWorker.js
// this is web worker, used to offload TGeo functionality in other thread(s)


JSROOT = {}; // just place holder for JSROOT.GEO functions

importScripts('three.min.js', "JSRootGeoBase.js");


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

   postMessage({ log : "geoworker three.js " + THREE.REVISION });
}

