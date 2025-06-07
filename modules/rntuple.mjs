import { R__unzip } from './io.mjs';
const LITTLE_ENDIAN = true;
class RBufferReader {
  
  constructor(buffer) {
    if (buffer instanceof ArrayBuffer) 
      this.buffer = buffer;
    else if (ArrayBuffer.isView(buffer)) {
      const bytes = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      this.buffer = bytes.slice().buffer;
    } else 
      throw new TypeError('Invalid buffer type');
    

    this.view = new DataView(this.buffer);
    this.offset = 0;
  }

  // Move to a specific position in the buffer
  seek(position) {
    this.offset = position;
  }

  // Read unsigned 8-bit integer (1 BYTE)
  readU8() {
    const val = this.view.getUint8(this.offset, LITTLE_ENDIAN);
    this.offset += 1;
    return val;
  }

  // Read unsigned 16-bit integer (2 BYTES)
  readU16() {
    const val = this.view.getUint16(this.offset, LITTLE_ENDIAN);
    this.offset += 2;
    return val;
  }

  // Read unsigned 32-bit integer (4 BYTES)
  readU32() {
    const val = this.view.getUint32(this.offset, LITTLE_ENDIAN);
    this.offset += 4;
    return val;
  }

  // Read signed 8-bit integer (1 BYTE)
  readS8() {
    const val = this.view.getInt8(this.offset, LITTLE_ENDIAN);
    this.offset += 1;
    return val;
  }

  // Read signed 16-bit integer (2 BYTES)
  readS16() {
    const val = this.view.getInt16(this.offset, LITTLE_ENDIAN);
    this.offset += 2;
    return val;
  }

  // Read signed 32-bit integer (4 BYTES)
  readS32() {
    const val = this.view.getInt32(this.offset, LITTLE_ENDIAN);
    this.offset += 4;
    return val;
  }

  // Read 32-bit float (4 BYTES)
  readF32() {
    const val = this.view.getFloat32(this.offset, LITTLE_ENDIAN);
    this.offset += 4;
    return val;
  }

  // Read a string with 32-bit length prefix
  readString() {
    const length = this.readU32();
    let str = '';
    for (let i = 0; i < length; i++) 
      str += String.fromCharCode(this.readU8());
    return str;
  }
  
}


class RNTupleDescriptorBuilder {
      
   deserializeHeader(header_blob) {
    if (!header_blob) return;

    const reader = new RBufferReader(header_blob);

    // 1. Read header version (4 bytes)
    this.version = reader.readU32();

    // 2. Read feature flags (4 bytes)
    this.headerFeatureFlags = reader.readU32();

    // 3. Read xxhash3 (64-bit, 8 bytes)
    const low = reader.readU32(),
    high = reader.readU32();

    // Combine high and low to a hex string or BigInt
    this.xxhash3 = (BigInt(high) << 32n) | BigInt(low);

    // 4. Read name (length-prefixed string)
    this.name = reader.readString();

    // 5. Read description (length-prefixed string)
    this.description = reader.readString();
   

   // Console output to verify deserialization results
    console.log('Version:', this.version);
     console.log('Header Feature Flags:', this.headerFeatureFlags);
    console.log('Low:', low, 'High:', high);
    console.log('xxhash3:', '0x' + this.xxhash3.toString(16).padStart(16, '0'));
    console.log('Name:', this.name);
    console.log('Description:', this.description);
  }


deserializeFooter(footer_blob) {
    if (!footer_blob) return;

    const reader = new RBufferReader(footer_blob);

    this.footerFeatureFlags = reader.readU32();
    this.headerChecksum = reader.readU32();

    console.log('Footer Feature Flags:', this.footerFeatureFlags);
    console.log('Header Checksum:', this.headerChecksum);
  }


}

/** @summary Very preliminary function to read header/footer from RNTuple
  * @private */
async function readHeaderFooter(tuple) {
   if (!tuple.$file)
      return false;

   // request header and footer buffers from the file
   return tuple.$file.readBuffer([tuple.fSeekHeader, tuple.fNBytesHeader, tuple.fSeekFooter, tuple.fNBytesFooter]).then(blobs => {
      if (blobs?.length !== 2)
         return false;

      // unzip both buffers
      return Promise.all([
         R__unzip(blobs[0], tuple.fLenHeader),
         R__unzip(blobs[1], tuple.fLenFooter)
      ]).then(unzip_blobs => {
         const header_blob = unzip_blobs[0],
               footer_blob = unzip_blobs[1];
         if (!header_blob || !footer_blob)
            return false;

         // create builder description and decode it - dummy for the moment

         tuple.builder = new RNTupleDescriptorBuilder;

         tuple.builder.deserializeHeader(header_blob);

         tuple.builder.deserializeFooter(footer_blob);

         return true;
      });
   });
}


/** @summary Create hierarchy of ROOT::RNTuple object
  * @desc Used by hierarchy painter to explore sub-elements
  * @private */
async function tupleHierarchy(tuple_node, tuple) {
   tuple_node._childs = [];
   // tuple_node._tuple = tuple;  // set reference, will be used later by RNTuple::Draw

   return readHeaderFooter(tuple).then(res => {
      if (!res)
         return res;

      // just show which objects belongs to hierarchy
      // one need to fill list of items from tuple.builder ... object
      for (let k = 0; k < 3; ++k) {
         tuple_node._childs.push({
            _name: `dummy${k}`,
            _kind: 'ROOT::SomeBranchName',
            _title: `Any title for dummy${k}`,
            _obj: null
         });
      }

      return true;
   });
}

export { tupleHierarchy, readHeaderFooter, RBufferReader };
