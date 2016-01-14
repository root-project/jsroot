// this is web worker, used to offload TGeo functionality in other thread


importScripts('JSRootCore.js', 'd3.v3.min.js', 'JSRootPainter.js', 'three.min.js', 'three.extra.js', 'JSRootGeoPainter.js');


onmessage = function(e) {

   if (typeof e.data == 'string')
      console.log('Worker get message ' + e.data);
   else
   if (typeof e.data == 'object') {
      if ('geom' in e.data) {
         console.log('GEO time = ' + ((new Date()).getTime() - e.data.dt.getTime()));
         var arr = [];
         var cnt = JSROOT.Painter.CountGeoVolumes(e.data.geom, 0, arr);
         console.log('GEO count = ' + cnt);

         var map = [];
         JSROOT.clear_func(e.data.geom, map);
         console.log('GEO map length = ' + map.length);
      }
   }

   postMessage("jsroot:" + JSROOT.version + '  three:' + THREE.REVISION)
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
