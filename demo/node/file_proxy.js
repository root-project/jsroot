// example how FileProxy object can be used
// is allows to fully separate low-level access and reading of ROOT files
// used to implement file reading in environment where normal HTTP may not work

import { version, FileProxy, openFile, makeSVG, treeDraw } from "jsroot";

import { writeFileSync, openSync, readSync, statSync } from "fs";

console.log('JSROOT version', version);

class LocalFileProxy extends FileProxy {

   constructor(filename) {
      super();
      this.filename = filename;
      this.size = 0;
   }

   openFile() {
      this.fd = openSync(this.filename);
      if (!this.fd) return Promise.resolve(false);
      let stats = statSync(this.filename);
      this.size = stats.size;
      return Promise.resolve(true);
   }

   getFileName() { return this.filename; }

   getFileSize() { return this.size; }

   readBuffer(pos, sz)
   {
      if (!this.fd)
         return Promise.resolve(null);

      let buffer = new ArrayBuffer(sz);

      let view = new DataView(buffer, 0, sz);

      let bytesRead = readSync(this.fd, view, 0, sz, pos);

      // console.log(`Reading ${pos} size ${sz}`);

      if (bytesRead == sz)
          return Promise.resolve(view);

       return Promise.resolve(null);
   }
};


let proxy = new LocalFileProxy("../../../files/large.root");

let file = await openFile(proxy);
if (!file) {
   console.error('Fail to open file');
}

// now read ntuple, perform Draw operation, create SVG file and sve to the disk
let ntuple = await file.readObject("ntuple");
let hist = await treeDraw(ntuple, "px:py::pz>5");
let svg = await makeSVG({ object: hist, width: 1200, height: 800 });
writeFileSync("draw_proxy.svg", svg);
console.log(`Create draw_proxy.svg size ${svg.length}`);
