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

      var shapes = e.data.shapes, transferables = [];

      var tm1 = new Date().getTime();

      for (var n=0;n<shapes.length;++n) {
         var item = shapes[n];
         item.geom = JSROOT.GEO.createGeometry(item.shape);
      }

      var tm2 = new Date().getTime();

      for (var n=0;n<shapes.length;++n) {
         var item = shapes[n];

         if (item.geom) {
            var bufgeom;
            if (item.geom instanceof THREE.BufferGeometry) {
               bufgeom = item.geom;
            } else {
               var bufgeom = new THREE.BufferGeometry();
               bufgeom.fromGeometry(item.geom);
            }

            item.buf_pos = bufgeom.attributes.position.array;
            item.buf_norm = bufgeom.attributes.normal.array;

            // use nice feature of HTML workers with transferables
            // we allow to take ownership of buffer from local array
            // therefore buffer content not need to be copied
            transferables.push(item.buf_pos.buffer, item.buf_norm.buffer);
         }

         delete item.shape; // no need to send back shape
         delete item.geom;
         // delete item.json;
      }

      var tm3 = new Date().getTime();

      console.log('Worker create ' +  shapes.length + ' geom takes ' + (tm2-tm1) + '  conversion ' + (tm3-tm2));

      e.data.tm2 = new Date().getTime();

      return postMessage(e.data, transferables);
   }

   if (e.data.collect !== undefined) {
      // this is task to collect visible nodes using camera position

      // first mark all visible flags
      clones.MarkVisisble(false, false, e.data.visible);
      delete e.data.visible;

      var matrix = null;
      if (e.data.matrix)
         matrix = new THREE.Matrix4().fromArray(e.data.matrix);
      delete e.data.matrix;

      e.data.new_nodes = clones.CollectVisibles(e.data.collect, JSROOT.GEO.CreateFrustum(matrix));

      e.data.tm2 = new Date().getTime();

      console.log('Collect visibles in worker ' + e.data.new_nodes.length + ' takes ' + (e.data.tm2-e.data.tm1));

      return postMessage(e.data);
   }

}
