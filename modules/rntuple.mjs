import { R__unzip } from './io.mjs';
const LITTLE_ENDIAN = true;
class RBufferReader {
  
  constructor(buffer) {
    if (buffer instanceof ArrayBuffer) {
    this.buffer = buffer;
    this.byteOffset = 0;
    this.byteLength = buffer.byteLength;
    } else if (ArrayBuffer.isView(buffer)) {
    this.buffer = buffer.buffer;
    this.byteOffset = buffer.byteOffset;
    this.byteLength = buffer.byteLength;
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
    const val = this.view.getUint8(this.offset);
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
    const val = this.view.getInt8(this.offset);
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

  // Read 64-bit float (8 BYTES)
  readF64() {
    const val = this.view.getFloat64(this.offset, LITTLE_ENDIAN);
    this.offset += 8;
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

    // Read unsigned 64-bit integer (8 BYTES)
  readU64() {
    const val = this.view.getBigUint64(this.offset, LITTLE_ENDIAN);
    this.offset += 8;
    return val;
  }

  // Read signed 64-bit integer (8 BYTES)
  readS64() {
    const val = this.view.getBigInt64(this.offset, LITTLE_ENDIAN);
    this.offset += 8;
    return val;
  }
  
}


class RNTupleDescriptorBuilder {
      
deserializeHeader(header_blob) {
    if (!header_blob) return;

  const reader = new RBufferReader(header_blob);
  // Read the envelope metadata
  this._readEnvelopeMetadata(reader);

  // TODO: Validate the envelope checksum at the end of deserialization
  // const payloadStart = reader.offset;

  //  Read feature flags list (may span multiple 64-bit words)
  this._readFeatureFlags(reader);

  //  Read metadata strings
  this.name = reader.readString();
  this.description = reader.readString();
  this.writer = reader.readString();

  // List frame: list of field record frames
  this._readFieldDescriptors(reader);
  }

deserializeFooter(footer_blob) {
    if (!footer_blob) return;

    const reader = new RBufferReader(footer_blob);

    this.footerFeatureFlags = reader.readU32();
    this.headerChecksum = reader.readU32();

    console.log('Footer Feature Flags:', this.footerFeatureFlags);
    console.log('Header Checksum:', this.headerChecksum);
  }


_readEnvelopeMetadata(reader) {
  const typeAndLength = reader.readU64(),

  // Envelope metadata
  // The 16 bits are the envelope type ID, and the 48 bits are the envelope length
  envelopeType = Number(typeAndLength & 0xFFFFn),
  envelopeLength = Number((typeAndLength >> 16n) & 0xFFFFFFFFFFFFn);

  console.log('Envelope Type ID:', envelopeType);
  console.log('Envelope Length:', envelopeLength);
  return { envelopeType, envelopeLength };
}

_readFeatureFlags(reader) {
  this.featureFlags = [];
  while (true) {
    const val = reader.readU64();
    this.featureFlags.push(val);
    if ((val & 0x8000000000000000n) === 0n) break; // MSB not set: end of list
  }

  // verify all feature flags are zero
  if (this.featureFlags.some(v => v !== 0n))
  throw new Error('Unexpected non-zero feature flags: ' + this.featureFlags);
}

_readFieldDescriptors(reader) {
const fieldListSize = reader.readS64(), // signed 64-bit
fieldListIsList = fieldListSize < 0;


  if (!fieldListIsList)
    throw new Error('Field list frame is not a list frame, which is required.');

  const fieldListCount = reader.readU32(); // number of field entries
  console.log('Field List Count:', fieldListCount);

  // List frame: list of field record frames

  const fieldDescriptors = [];
  for (let i = 0; i < fieldListCount; ++i) {
    const fieldRecordSize = reader.readS64(), 
    fieldVersion = reader.readU32(),
    typeVersion = reader.readU32(),
    parentFieldId = reader.readU32(),
    structRole = reader.readU16(),
    flags = reader.readU16(),

    fieldName = reader.readString(),
    typeName = reader.readString(),
    typeAlias = reader.readString(),
    description = reader.readString();
    let arraySize = null, sourceFieldId = null, checksum = null;

    if (flags & 0x1) arraySize = reader.readU32();
    if (flags & 0x2) sourceFieldId = reader.readU32();
    if (flags & 0x4) checksum = reader.readU32();

     fieldDescriptors.push({
        fieldRecordSize,
        fieldVersion,
        typeVersion,
        parentFieldId,
        structRole,
        flags,
        fieldName,
        typeName,
        typeAlias,
        description,
        arraySize,
        sourceFieldId,
        checksum
    });
}
  this.fieldDescriptors = fieldDescriptors;
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
