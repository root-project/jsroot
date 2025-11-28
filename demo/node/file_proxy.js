// example how FileProxy object can be used
// is allows to fully separate low-level access and reading of ROOT files
// used to implement file reading in environment where normal HTTP may not work

import { version, FileProxy, openFile, makeSVG, treeDraw } from 'jsroot';

import { writeFileSync, readFileSync, openSync, readSync, statSync } from 'fs';

import { open, stat } from 'node:fs/promises';

console.log(`JSROOT version ${version}`);

/** Class using sync  file I/O  */

class FileProxySync extends FileProxy {

   constructor(filename) {
      super();
      this.filename = filename;
      this.size = 0;
   }

   openFile() {
      this.fd = openSync(this.filename);
      if (!this.fd)
         return Promise.resolve(false);
      let stats = statSync(this.filename);
      this.size = stats.size;
      return Promise.resolve(true);
   }

   getFileName() { return this.filename; }

   getFileSize() { return this.size; }

   readBuffer(pos, sz) {
      if (!this.fd)
         return Promise.resolve(null);

      const buffer = new ArrayBuffer(sz),
            view = new DataView(buffer, 0, sz),
            bytesRead = readSync(this.fd, view, 0, sz, pos);

      return Promise.resolve(bytesRead == sz ? view : null);
   }

} // class FileProxySync


/** Class using async node.js file I/O  */

class FileProxyPromise extends FileProxy {

   constructor(filename) {
      super();
      this.filename = filename;
      this.size = 0;
   }

   async openFile() {
      return open(this.filename).then(fd => {
         if (!fd)
            return false;
         this.fd = fd;

         return stat(this.filename);
      }).then(stats => {
         this.size = stats.size;

         return this.size > 0;
      });
   }

   getFileName() { return this.filename; }

   getFileSize() { return this.size; }

   async readBuffer(pos, sz) {
      if (!this.fd)
         return Promise.resolve(null);

      const buffer = new ArrayBuffer(sz),
            view = new DataView(buffer, 0, sz);

      return this.fd.read(view, 0, sz, pos).then(res => {

         return res.bytesRead > 0 ? res.buffer : null;
      });
   }

} // class FileProxyPromise


/** Class supporting multi-range requests */
class FileProxyMultiple extends FileProxyPromise {

   /** example of reading several segments at once, always return array */
   async readBuffers(places) {
      if (!this.fd)
         return Promise.resolve([]);

      const promises = [];
      for (let k = 0; k < places.length; k += 2) {
         const pos = places[k], sz = places[k + 1],
               buffer = new ArrayBuffer(sz),
               view = new DataView(buffer, 0, sz);

         promises.push(this.fd.read(view, 0, sz, pos));
      }

      return Promise.all(promises).then(arr => {
         const res = [];
         for (let k = 0; k < arr.length; ++k)
            res.push(arr[k].bytesRead > 0 ? arr[k].buffer : null);
         return res;
      });
   }

} // class FileProxyMultiple

let filearg = null, fname = './hsimple.root';

if (process.argv && process.argv[3] && typeof process.argv[3] == 'string')
   fname = process.argv[3];

if (fname.indexOf('http') == 0) {
   console.log('Using normal file API');
   filearg = fname;
} else if (process.argv && process.argv[2] == 'buffer') {
   const nodeBuffer = readFileSync(fname);
   filearg = new Uint8Array(nodeBuffer).buffer;
   console.log('Using BufferArray', filearg.byteLength);
} else if (process.argv && process.argv[2] == 'sync') {
   console.log('Using FileProxySync');
   filearg = new FileProxySync(fname);
} else if (process.argv && process.argv[2] == 'multi') {
   console.log('Using FileProxyMultiple');
   filearg = new FileProxyMultiple(fname);
} else {
   console.log('Using FileProxyPromise');
   filearg = new FileProxyPromise(fname);
}

if (process.argv && process.argv[2] == 'sync') {
   console.log('Using sync API');

   const file = await openFile(filearg);
   if (!file)
      console.error('Fail to open file');

   // now read ntuple, perform Draw operation, create SVG file and sve to the disk
   const ntuple = await file.readObject('ntuple');
   const hist = await treeDraw(ntuple, 'px:py::pz>5');
   const svg = await makeSVG({ object: hist, width: 1200, height: 800 });
   writeFileSync('draw_proxy.svg', svg);
   console.log(`Create draw_proxy.svg size ${svg.length}`);
} else {
   console.log('Using promise API');

   openFile(filearg)
      .then(file => file.readObject('ntuple'))
      .then(ntuple => treeDraw(ntuple, 'px:py::pz>5'))
      .then(hist => makeSVG({ object: hist, width: 1200, height: 800 }))
      .then(svg => {
         writeFileSync('draw_proxy.svg', svg);
         console.log(`Create draw_proxy.svg size ${svg.length}`);
      });
}

