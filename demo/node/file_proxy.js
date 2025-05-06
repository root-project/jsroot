// example how FileProxy object can be used
// is allows to fully separate low-level access and reading of ROOT files
// used to implement file reading in environment where normal HTTP may not work

import { version, FileProxy, openFile, makeSVG, treeDraw } from 'jsroot';

import { writeFileSync, readFileSync, openSync, readSync, statSync } from 'fs';

import { open, stat } from 'node:fs/promises';

console.log(`JSROOT version ${version}`);

class FileProxySync extends FileProxy {

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

   readBuffer(pos, sz) {
      if (!this.fd)
         return Promise.resolve(null);

      let buffer = new ArrayBuffer(sz);

      let view = new DataView(buffer, 0, sz);

      let bytesRead = readSync(this.fd, view, 0, sz, pos);

      // console.log(`Read at ${pos} size ${bytesRead}`);

      if (bytesRead == sz)
          return Promise.resolve(view);

       return Promise.resolve(null);
   }

} // class FileProxySync


class FileProxyPromise extends FileProxy {

   constructor(filename) {
      super();
      this.filename = filename;
      this.size = 0;
   }

   openFile() {

      return open(this.filename).then(fd => {
         if (!fd) return false;
         this.fd = fd;

         return stat(this.filename);
      }).then(stats => {
         this.size = stats.size;

         return this.size > 0;
      });
   }

   getFileName() { return this.filename; }

   getFileSize() { return this.size; }

   readBuffer(pos, sz) {
      if (!this.fd)
         return Promise.resolve(null);

      let buffer = new ArrayBuffer(sz);

      let view = new DataView(buffer, 0, sz);

      return this.fd.read(view, 0, sz, pos).then(res => {
         // console.log(`Read ${pos} size ${res.bytesRead}`);
         // console.trace();

         return res.bytesRead > 0 ? res.buffer : null;
      });
   }

} // class FileProxyPromise

let filearg = null, fname = '../../../files/hsimple.root';

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

