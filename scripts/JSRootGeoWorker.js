// this is web worker, used to offload TGeo functionality in other thread


importScripts('JSRootCore.js', 'd3.v3.min.js', 'JSRootPainter.js', 'three.min.js', 'three.extra.js', 'JSRootGeoPainter.js');

var painter = null;


onmessage = function(e) {

   if (typeof e.data == 'string') {
      console.log('Worker get message ' + e.data);

      if (e.data=='init')
         postMessage({ log : "worker ready" });

      return;
   }

   if (typeof e.data != 'object') return;

   if ('geom' in e.data) {
      painter = new JSROOT.TGeoPainter(e.data.geom);
      painter._isworker = true;
      postMessage({ progress : "Get geometry" });
      return;
   }

   if (('build' in e.data) && (painter !== null)) {
      var par = e.data.build;

      painter.createScene(par.webgl, par.w, par.h, par.pixratio);

      postMessage({ progress : "Creating scence" });

      painter.createDrawGeometry(par.maxlvl);

      postMessage({ progress : null });

      return;
   }

   postMessage({ log : "jsroot:" + JSROOT.version + '  three:' + THREE.REVISION });
}

/*

var i = 0;

function timedCount() {
    i = i + 1;
    postMessage("cnt:" + i + "  ver:" + JSROOT.version + '  three:' + THREE.REVISION);
    setTimeout(timedCount,1500);
}

timedCount();
*/
