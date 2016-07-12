JSROOT = {}; // just place holder for JSROOT.GEO functions

JSROOT.BIT = function(n) { return 1 << (n); }

importScripts("three.js", "ThreeCSG.js", "JSRootGeoBase.js");

if (console) console.log('geoworker started ' + THREE.REVISION);

var clones = null;

onmessage = function(e) {

   if (typeof e.data == 'string') {
      console.log('Worker get message ' + e.data);
      return;
   }

   if (typeof e.data != 'object') return;

   e.data.tm1 = new Date().getTime();

   if (e.data.init) {
      console.log('start worker ' +  (e.data.tm1 -  e.data.tm0));

      var nodes = e.data.clones;
      if (nodes) {
         console.log('get clones ' + nodes.length);
         clones = new JSROOT.GEO.ClonedNodes(null, nodes);
         delete e.data.clones;
      }

      e.data.tm2 = new Date().getTime();

      return postMessage(e.data);
   }

   if (e.data.shapes) {
      // this is task to create geometries in the worker

      var shapes = e.data.shapes;

      var tm1 = new Date().getTime();

      for (var n=0;n<shapes.length;++n) {
         var item = shapes[n];
         item.geom = JSROOT.GEO.createGeometry(item.shape);
      }

      var tm2 = new Date().getTime();

      for (var n=0;n<shapes.length;++n) {
         var item = shapes[n];

         if (item.geom) {
            var bufgeom = new THREE.BufferGeometry();
            bufgeom.fromGeometry(item.geom);
            item.json = bufgeom.toJSON(); // convert to data which can be transfered to the main thread
         }

         delete item.shape; // no need to send back shape
         delete item.geom;
         // delete item.json;
      }

      var tm3 = new Date().getTime();

      console.log('Worker create ' +  shapes.length + ' geom takes ' + (tm2-tm1) + '  conversion ' + (tm3-tm2));

      e.data.tm2 = new Date().getTime();

      var res = { shapes : [] };
      res.tm2 = new Date().getTime();

      return postMessage(e.data);
   }

}
