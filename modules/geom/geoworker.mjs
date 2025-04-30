import { isNodeJs } from '../core.mjs';
import { runGeoWorker } from './geobase.mjs';

const ctxt = {};

if (isNodeJs()) {
   import('node:worker_threads').then(h => {
      h.parentPort.on('message', msg => runGeoWorker(ctxt, msg, reply => h.parentPort.postMessage(reply)));
   });
} else {
   onmessage = function(e) {
      if (!e?.data)
         return;

      if (typeof e.data === 'string') {
         console.log(`Worker get message ${e.data}`);
         return;
      }

      runGeoWorker(ctxt, e.data, postMessage);
   }
}
