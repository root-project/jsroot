// example how FileProxy object can be used
// is allows to fully separate low-level access and reading of ROOT files
// used to implement file reading in environment where normal HTTP may not work

import { version, FileProxy, openFile, makeSVG, treeDraw } from 'jsroot';

import { writeFileSync, openSync, readSync, statSync } from 'fs';

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

   readBuffer(pos, sz)
   {
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

   readBuffer(pos, sz)
   {
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

let proxy = null, fname = '../../../files/hsimple.root';

if (process.argv && process.argv[3] && typeof process.argv[3] == 'string')
   fname = process.argv[3];

if (fname.indexOf('http') == 0) {
   console.log('Using normal file API');
   proxy = fname;
} else if (process.argv && process.argv[2] == 'sync') {
   console.log('Using FileProxySync');
   proxy = new FileProxySync(fname);
} else {
   console.log('Using FileProxyPromise');
   proxy = new FileProxyPromise(fname);
}

if (process.argv && process.argv[2] == 'sync') {
   console.log('Using sync API');

   let file = await openFile(proxy);
   if (!file) {
      console.error('Fail to open file');
   }

   // now read ntuple, perform Draw operation, create SVG file and sve to the disk
   let ntuple = await file.readObject('ntuple');
   let hist = await treeDraw(ntuple, 'px:py::pz>5');
   let svg = await makeSVG({ object: hist, width: 1200, height: 800 });
   writeFileSync('draw_proxy.svg', svg);
   console.log(`Create draw_proxy.svg size ${svg.length}`);
} else {
   console.log('Using promise API');

   openFile(proxy).then(file => file.readObject('ntuple'))
                  .then(ntuple => treeDraw(ntuple, 'px:py::pz>5'))
                  .then(hist => makeSVG({ object: hist, width: 1200, height: 800 }))
                  .then(svg => {
                     writeFileSync('draw_proxy.svg', svg);
                     console.log(`Create draw_proxy.svg size ${svg.length}`);
                  });
}

