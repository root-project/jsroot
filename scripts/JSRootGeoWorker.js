// this is web worker, used to offload TGeo functionality in other thread


importScripts('JSRootCore.js', 'd3.v3.min.js', 'JSRootPainter.js', 'three.min.js', 'three.extra.js', 'JSRootGeoPainter.js');


onmessage = function(e) {

   if (typeof e.data == 'string') {
      console.log('Worker get message ' + e.data);

      if (e.data=='init')
         postMessage({ log : "worker ready" });

      return;
   }

   if (typeof e.data != 'object') return;

   postMessage({ log : "jsroot:" + JSROOT.version + '  three:' + THREE.REVISION });
}

