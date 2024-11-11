# JavaScript ROOT

JavaScript ROOT provides interactive ROOT-like graphics in the web browsers and in `node.js`.
Data can be read and displayed from ROOT binary and JSON files.
`JSROOT` implements user interface for THttpServer class.

## Examples

[![Color draw for TH2](https://root.cern/js/files/img/th2.png)](https://root.cern/js/latest/?nobrowser&file=../files/hsimple.root&item=hpxpy;1&opt=colz)   [![2-dimensional TTree::Draw with cut options](https://root.cern/js/files/img/ttree.png)](https://root.cern/js/latest/?nobrowser&file=../files/hsimple.root&item=ntuple;1&opt=px:py::pz%3E4)    [![Several variants of THStack drawing](https://root.cern/js/files/img/thstack.png)](https://root.cern/js/latest/?nobrowser&file=../files/histpainter6.root&item=draw_hstack;1)   [![Drawing of TGeo model superimposed with tracks and hits](https://root.cern/js/files/img/geo_tracks.png)](https://root.cern/js/latest/?nobrowser&json=../files/geom/simple_alice.json.gz&file=../files/geom/tracks_hits.root&item=simple_alice.json.gz+tracks_hits.root/tracks;1+tracks_hits.root/hits;1)


### In web browser
```javascript
...
   <body>
      <div id="drawing" style="position: relative; width: 800px; height: 600px;"></div>
   </body>
   <script type='module'>
      import { openFile, draw } from 'https://root.cern/js/latest/modules/main.mjs';
      let file = await openFile('https://root.cern/js/files/hsimple.root');
      let obj = await file.readObject('hpxpy;1');
      draw('drawing', obj, 'colz');
   </script>
...
```

### In node.js
```javascript
import { openFile, makeSVG } from 'jsroot';
import { writeFileSync } from 'fs';
let file = await openFile('https://root.cern/js/files/hsimple.root');
let obj = await file.readObject('hpxpy;1');
let svg = await makeSVG({ object: obj, option: 'lego2,pal50', width: 800, height: 600 });
writeFileSync('lego2.svg', svg);
```

### More examples
[Supported classes/options](https://root.cern/js/latest/examples.htm)

[API examples](https://root.cern/js/latest/api.htm)


## Install
```
npm install jsroot
```
For 3D rendering jsroot uses [gl](https://www.npmjs.com/package/gl) package which may have problems
during installation. To use jsroot without `gl` one can omit development packages:
```
npm install jsroot --omit=dev
```


## Documentation
[Tutorial](docs/JSROOT.md)

[THttpServer](docs/HttpServer.md)

[Changelog](changes.md)

[Reference API](https://root.cern/js/latest/jsdoc/global.html)

## Links
[https://root.cern/js/](https://root.cern/js/)

[https://jsroot.gsi.de](https://jsroot.gsi.de/)
