JSROOT = {}; // just place holder for JSROOT.GEO functions

importScripts("three.js", "ThreeCSG.js", "JSRootGeoBase.js");

if (console) console.log('geoworker started ' + THREE.REVISION);

var clones = null;

onmessage = function(e) {

   if (typeof e.data == 'string') {
      console.log('Worker get message ' + e.data);
      return;
   }

   if (typeof e.data != 'object') return;

   if (e.data.init) {
      e.data.tm1 = new Date();
      console.log('start worker ' +  (e.data.tm1.getTime() -  e.data.tm0.getTime()));

      var nodes = e.data.clones;
      if (nodes) {
         console.log('get clones ' + nodes.length);
         clones = new JSROOT.GEO.ClonedNodes(null, nodes);
         delete e.data.clones;
      }
      return postMessage(e.data);
   }

   if (e.data.shapes) {
      // this is task to create geometries in the worker

      var shapes = e.data.shapes;

      for (var n=0;n<shapes.length;++n) {
         var item = shapes[n];
         var geom = JSROOT.GEO.createGeometry(item.shape);
         item.json = geom.toJSON()

         //var bufgeom = new THREE.BufferGeometry();
         //bufgeom.fromGeometry(geom);
         //item.json = bufgeom.toJSON(); // convert to data which can be transfered to the main thread

         delete item.shape; // no need to send back shape
      }

      return postMessage(e.data);
   }

}
