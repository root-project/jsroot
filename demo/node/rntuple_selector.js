import { readHeaderFooter, RBufferReader } from '../../modules/rntuple.mjs';
import { R__unzip } from '../../modules/io.mjs';
import { openFile } from 'jsroot';

// Read and process the next data cluster from the RNTuple
function readNextCluster(rntuple, selector) {
  const builder = rntuple.builder,
      clusterSummary = builder.clusterSummaries[selector.currentCluster],
      pages = builder.pageLocations[selector.currentCluster][0].pages;

  selector.currentCluster++;

// Build flat array of [offset, size, offset, size, ...] to read pages
  const dataToRead = pages.flatMap(p => [Number(p.locator.offset), Number(p.locator.size)]);

return rntuple.$file.readBuffer(dataToRead).then(blobsRaw => {
  const blobs = Array.isArray(blobsRaw) ? blobsRaw : [blobsRaw],
        unzipPromises = blobs.map((blob, idx) => {
          const numElements = Number(pages[idx].numElements);
          return R__unzip(blob, 8 * numElements);
        });
 
  // Wait for all pages to be decompressed
  return Promise.all(unzipPromises).then(unzipBlobs => {
    const totalSize = unzipBlobs.reduce((sum, b) => sum + b.byteLength, 0),
          flat = new Uint8Array(totalSize);

    let offset = 0;
    for (const blob of unzipBlobs) {
      flat.set(new Uint8Array(blob.buffer || blob), offset);
      offset += blob.byteLength;
    }
    
    // Create reader and deserialize doubles from the buffer
    const reader = new RBufferReader(flat.buffer);
    for (let i = 0; i < clusterSummary.numEntries; ++i) {
      selector.tgtobj.myDouble = reader.readF64();
      selector.Process();
    }

    selector.End();
  });
});
}

// TODO args can later be used to filter fields, limit entries, etc.
// Create reader and deserialize doubles from the buffer
function rntupleProcess(rntuple, selector, args) {
  return readHeaderFooter(rntuple).then(() => {
    selector.Begin();
    selector.currentCluster = 0;
    return readNextCluster(rntuple, selector, args);
  });
}

// test block (runs only in node)
if (typeof window === 'undefined') {
  // Defining the object selector
  const selector = {
    tgtobj: {},
    currentCluster: 0,
    count: 0,
    sum: 0,

    Begin() {
      console.log('Begin processing');
    },

    Process() {
      console.log('Entry : ', this.tgtobj);
      this.sum += this.tgtobj.myDouble;
      this.count++;
    },

    End() {
      if (this.count === 0)
        console.error('No entries processed');
      else
        console.log(`Mean = ${(this.sum / this.count).toFixed(4)} from ${this.count} entries`);
    }
  };

  openFile('./simple.root')
    .then(file => file.readObject('myNtuple'))
    .then(rntuple => {
      if (!rntuple) throw new Error('myNtuple not found');
      return rntupleProcess(rntuple, selector);
    })
    .then(() => console.log('RNTuple::Process finished'))
    .catch(err => console.error(err));
}

export { rntupleProcess };
