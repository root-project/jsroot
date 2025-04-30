import { isNodeJs } from '../core.mjs';
import { THREE } from '../base/base3d.mjs';
import { ClonedNodes, createFrustum } from './geobase.mjs';

if (typeof console !== 'undefined')
   console.log(`geoworker started three.js r${THREE.REVISION}`);

let clones = null, doPost;

function processMessage(data) {

   if (typeof data == 'string') {
      console.log(`Worker get message ${data}`);
      return;
   }

   if (typeof data != 'object')
      return;

   data.tm1 = new Date().getTime();

   if (data.init) {
      // console.log(`start worker ${data.tm1 -  data.tm0}`);

      let nodes = data.clones;
      if (nodes) {
         // console.log(`get clones ${nodes.length}`);
         clones = new ClonedNodes(null, nodes);
         clones.setVisLevel(data.vislevel);
         clones.setMaxVisNodes(data.maxvisnodes);
         delete data.clones;
         clones.sortmap = data.sortmap;
      }

      data.tm2 = new Date().getTime();

      return doPost(data);
   }

   if (data.shapes) {
      // this is task to create geometries in the worker

      let shapes = data.shapes, transferables = [];

      // build all shapes up to specified limit, also limit execution time
      for (let n = 0; n < 100; ++n) {
         let res = clones.buildShapes(shapes, data.limit, 1000);
         if (res.done) break;
         doPost({ progress: "Worker creating: " + res.shapes + " / " + shapes.length + " shapes,  "  + res.faces + " faces" });
      }

      for (let n=0;n<shapes.length;++n) {
         let item = shapes[n];

         if (item.geom) {
            let bufgeom;
            if (item.geom instanceof THREE.BufferGeometry) {
               bufgeom = item.geom;
            } else {
               let bufgeom = new THREE.BufferGeometry();
               bufgeom.fromGeometry(item.geom);
            }

            item.buf_pos = bufgeom.attributes.position.array;
            item.buf_norm = bufgeom.attributes.normal.array;

            // use nice feature of HTML workers with transferable
            // we allow to take ownership of buffer from local array
            // therefore buffer content not need to be copied
            transferables.push(item.buf_pos.buffer, item.buf_norm.buffer);

            delete item.geom;
         }

         delete item.shape; // no need to send back shape
      }

      data.tm2 = new Date().getTime();

      return doPost(data, transferables);
   }

   if (data.collect !== undefined) {
      // this is task to collect visible nodes using camera position

      // first mark all visible flags
      clones.setVisibleFlags(data.flags);
      clones.setVisLevel(data.vislevel);
      clones.setMaxVisNodes(data.maxvisnodes);

      delete data.flags;

      clones.produceIdShifts();

      let matrix = null;
      if (data.matrix)
         matrix = new THREE.Matrix4().fromArray(data.matrix);
      delete data.matrix;

      let res = clones.collectVisibles(data.collect, createFrustum(matrix));

      data.new_nodes = res.lst;
      data.complete = res.complete; // inform if all nodes are selected

      data.tm2 = new Date().getTime();

      // console.log(`Collect visibles in worker ${data.new_nodes.length} takes ${data.tm2-data.tm1}`);

      return doPost(data);
   }

}

if (isNodeJs()) {
   import('node:worker_threads').then(h => {
      doPost = msg => h.parentPort.postMessage(msg);
      h.parentPort.on('message', msg => processMessage(msg));
   });
} else {
   doPost = postMessage;
   onmessage = function(e) {
      if (!e?.data)
         return;

      if (typeof e.data === 'string') {
         console.log(`Worker get message ${e.data}`);
         return;
      }

      processMessage(e.data);
   }
}