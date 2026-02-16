import { isStr, isObject } from './core.mjs';
import { R__unzip } from './io.mjs';
import { TDrawSelector, treeDraw } from './tree.mjs';

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
      // important - offset should start from actual place in the buffer
      this.offset = this.byteOffset;
   }

   // Move to a specific position in the buffer
   seek(position) {
      if (typeof position === 'bigint') {
         if (position > BigInt(Number.MAX_SAFE_INTEGER))
            throw new Error(`Offset too large to seek safely: ${position}`);
         this.offset = Number(position);
      } else
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


const ENTupleColumnType = {
   kBit: 0x00,
   kByte: 0x01,
   kChar: 0x02,
   kInt8: 0x03,
   kUInt8: 0x04,
   kInt16: 0x05,
   kUInt16: 0x06,
   kInt32: 0x07,
   kUInt32: 0x08,
   kInt64: 0x09,
   kUInt64: 0x0A,
   kReal16: 0x0B,
   kReal32: 0x0C,
   kReal64: 0x0D,
   kIndex32: 0x0E,
   kIndex64: 0x0F,
   kSwitch: 0x10,
   kSplitInt16: 0x11,
   kSplitUInt16: 0x12,
   kSplitInt32: 0x13,
   kSplitUInt32: 0x14,
   kSplitInt64: 0x15,
   kSplitUInt64: 0x16,
   kSplitReal16: 0x17,
   kSplitReal32: 0x18,
   kSplitReal64: 0x19,
   kSplitIndex32: 0x1A,
   kSplitIndex64: 0x1B,
   kReal32Trunc: 0x1C,
   kReal32Quant: 0x1D
};


/**
 * @summary Rearrange bytes from split format to normal format (row-wise) for decoding
 */
function recontructUnsplitBuffer(blob, columnDescriptor) {
   const { coltype } = columnDescriptor;

   if (
      coltype === ENTupleColumnType.kSplitUInt16 ||
        coltype === ENTupleColumnType.kSplitUInt32 ||
        coltype === ENTupleColumnType.kSplitUInt64 ||
        coltype === ENTupleColumnType.kSplitReal16 ||
        coltype === ENTupleColumnType.kSplitReal32 ||
        coltype === ENTupleColumnType.kSplitReal64 ||
        coltype === ENTupleColumnType.kSplitIndex32 ||
        coltype === ENTupleColumnType.kSplitIndex64 ||
        coltype === ENTupleColumnType.kSplitInt16 ||
        coltype === ENTupleColumnType.kSplitInt32 ||
        coltype === ENTupleColumnType.kSplitInt64
   ) {
      // Determine byte size based on column type
      let byteSize;
      switch (coltype) {
         case ENTupleColumnType.kSplitReal64:
         case ENTupleColumnType.kSplitInt64:
         case ENTupleColumnType.kSplitUInt64:
         case ENTupleColumnType.kSplitIndex64:
            byteSize = 8;
            break;
         case ENTupleColumnType.kSplitReal32:
         case ENTupleColumnType.kSplitInt32:
         case ENTupleColumnType.kSplitIndex32:
         case ENTupleColumnType.kSplitUInt32:
            byteSize = 4;
            break;
         case ENTupleColumnType.kSplitInt16:
         case ENTupleColumnType.kSplitUInt16:
         case ENTupleColumnType.kSplitReal16:
            byteSize = 2;
            break;
         default:
            throw new Error(`Unsupported split coltype: ${coltype} (0x${coltype.toString(16).padStart(2, '0')})`);
      }

      const splitView = new DataView(blob.buffer, blob.byteOffset, blob.byteLength),
            count = blob.byteLength / byteSize,
            outBuffer = new ArrayBuffer(blob.byteLength),
            outBytes = new Uint8Array(outBuffer);

      for (let i = 0; i < count; ++i) {
         for (let b = 0; b < byteSize; ++b) {
            const splitIndex = b * count + i,
                  byte = splitView.getUint8(splitIndex),
                  writeIndex = i * byteSize + b;
            outBytes[writeIndex] = byte;
         }
      }

      // Return updated blob and remapped coltype
      const newBlob = outBuffer;
      let newColtype;
      switch (coltype) {
         case ENTupleColumnType.kSplitUInt16:
            newColtype = ENTupleColumnType.kUInt16;
            break;
         case ENTupleColumnType.kSplitUInt32:
            newColtype = ENTupleColumnType.kUInt32;
            break;
         case ENTupleColumnType.kSplitUInt64:
            newColtype = ENTupleColumnType.kUInt64;
            break;
         case ENTupleColumnType.kSplitIndex32:
            newColtype = ENTupleColumnType.kIndex32;
            break;
         case ENTupleColumnType.kSplitIndex64:
            newColtype = ENTupleColumnType.kIndex64;
            break;
         case ENTupleColumnType.kSplitReal16:
            newColtype = ENTupleColumnType.kReal16;
            break;
         case ENTupleColumnType.kSplitReal32:
            newColtype = ENTupleColumnType.kReal32;
            break;
         case ENTupleColumnType.kSplitReal64:
            newColtype = ENTupleColumnType.kReal64;
            break;
         case ENTupleColumnType.kSplitInt16:
            newColtype = ENTupleColumnType.kInt16;
            break;
         case ENTupleColumnType.kSplitInt32:
            newColtype = ENTupleColumnType.kInt32;
            break;
         case ENTupleColumnType.kSplitInt64:
            newColtype = ENTupleColumnType.kInt64;
            break;
         default:
            throw new Error(`Unsupported split coltype for reassembly: ${coltype}`);
      }

      return { blob: newBlob, coltype: newColtype };
   }

   // If no split type, return original blob and coltype
   return { blob, coltype };
}


/**
 * @summary Decode a reconstructed index buffer (32- or 64-bit deltas to absolute indices)
 */
function DecodeDeltaIndex(blob, coltype) {
   let deltas, result;

   if (coltype === ENTupleColumnType.kIndex32) {
      deltas = new Int32Array(blob.buffer || blob, blob.byteOffset || 0, blob.byteLength / 4);
      result = new Int32Array(deltas.length);
   } else if (coltype === ENTupleColumnType.kIndex64) {
      deltas = new BigInt64Array(blob.buffer || blob, blob.byteOffset || 0, blob.byteLength / 8);
      result = new BigInt64Array(deltas.length);
   } else
      throw new Error(`DecodeDeltaIndex: unsupported column type ${coltype}`);

   if (deltas.length > 0)
      result[0] = deltas[0];
   for (let i = 1; i < deltas.length; ++i)
      result[i] = result[i - 1] + deltas[i];

   return { blob: result, coltype };
}

function DecodeSwitchIndex(src) {
   let o = 0, prev = BigInt(0);
   while (o < src.byteLength) {
      const v = prev + src.getBigInt64(o, LITTLE_ENDIAN);
      src.setBigInt64(o, prev, LITTLE_ENDIAN);
      prev = v;
      o += 12;
   }
   return src;
}

/**
 * @summary Decode a reconstructed signed integer buffer using ZigZag encoding
  */
function decodeZigzag(blob, coltype) {
   let zigzag, result;

   if (coltype === ENTupleColumnType.kInt16) {
      zigzag = new Uint16Array(blob.buffer || blob, blob.byteOffset || 0, blob.byteLength / 2);
      result = new Int16Array(zigzag.length);
   } else if (coltype === ENTupleColumnType.kInt32) {
      zigzag = new Uint32Array(blob.buffer || blob, blob.byteOffset || 0, blob.byteLength / 4);
      result = new Int32Array(zigzag.length);
   } else if (coltype === ENTupleColumnType.kInt64) {
      zigzag = new BigUint64Array(blob.buffer || blob, blob.byteOffset || 0, blob.byteLength / 8);
      result = new BigInt64Array(zigzag.length);
   } else
      throw new Error(`decodeZigzag: unsupported column type ${coltype}`);

   for (let i = 0; i < zigzag.length; ++i) {
      // ZigZag decode: (x >>> 1) ^ (-(x & 1))
      const x = zigzag[i];
      result[i] = (x >>> 1) ^ (-(x & 1));
   }

   return { blob: result, coltype };
}

// Envelope Types
// TODO: Define usage logic for envelope types in future
// const kEnvelopeTypeHeader = 0x01,
//       kEnvelopeTypeFooter = 0x02,
//       kEnvelopeTypePageList = 0x03,

// Field Flags
const kFlagRepetitiveField = 0x01,
      kFlagProjectedField = 0x02,
      kFlagHasTypeChecksum = 0x04,

   // Column Flags
      kFlagDeferredColumn = 0x01,
      kFlagHasValueRange = 0x02;

class RNTupleDescriptorBuilder {

   deserializeHeader(header_blob) {
      if (!header_blob)
         return;

      const reader = new RBufferReader(header_blob),

            payloadStart = reader.offset,
            // Read the envelope metadata
            {
               envelopeLength
            } = this._readEnvelopeMetadata(reader),

            // Seek to end of envelope to get checksum
            checksumPos = payloadStart + envelopeLength - 8,
            currentPos = reader.offset;

      reader.seek(checksumPos);
      this.headerEnvelopeChecksum = reader.readU64();

      reader.seek(currentPos);

      //  Read feature flags list (may span multiple 64-bit words)
      this._readFeatureFlags(reader);

      //  Read metadata strings
      this.name = reader.readString();
      this.description = reader.readString();
      this.writer = reader.readString();

      // 4 list frames inside the header envelope
      this._readSchemaDescription(reader);
   }

   deserializeFooter(footer_blob) {
      if (!footer_blob)
         return;

      const reader = new RBufferReader(footer_blob);

      // Read the envelope metadata
      this._readEnvelopeMetadata(reader);


      // Feature flag(32 bits)
      this._readFeatureFlags(reader);
      // Header checksum (64-bit xxhash3)
      const headerChecksumFromFooter = reader.readU64();
      if (headerChecksumFromFooter !== this.headerEnvelopeChecksum)
         throw new Error('RNTuple corrupted: header checksum does not match footer checksum.');

      const schemaExtensionSize = reader.readS64();

      if (schemaExtensionSize < 0)
         throw new Error('Schema extension frame is not a record frame, which is unexpected.');

      // Schema extension record frame (4 list frames inside)
      this._readSchemaDescription(reader);

      // Cluster Group record frame
      this._readClusterGroups(reader);
   }


   _readEnvelopeMetadata(reader) {
      const typeAndLength = reader.readU64(),

            // Envelope metadata
            // The 16 bits are the envelope type ID, and the 48 bits are the envelope length
            envelopeType = Number(typeAndLength & 0xFFFFn),
            envelopeLength = Number((typeAndLength >> 16n) & 0xFFFFFFFFFFFFn);

      return {
         envelopeType,
         envelopeLength
      };
   }

   _readSchemaDescription(reader) {
      // Reading new descriptor arrays from the input
      const newFields = this._readFieldDescriptors(reader),
            newColumns = this._readColumnDescriptors(reader),
            newAliases = this._readAliasColumn(reader),
            newExtra = this._readExtraTypeInformation(reader);

      // Merging these new arrays into existing arrays
      this.fieldDescriptors = (this.fieldDescriptors || []).concat(newFields);
      this.columnDescriptors = (this.columnDescriptors || []).concat(newColumns);
      this.aliasColumns = (this.aliasColumns || []).concat(newAliases);
      this.extraTypeInfo = (this.extraTypeInfo || []).concat(newExtra);
   }

   _readFeatureFlags(reader) {
      this.featureFlags = [];
      while (true) {
         const val = reader.readU64();
         this.featureFlags.push(val);
         if ((val & 0x8000000000000000n) === 0n)
            break; // MSB not set: end of list
      }

      // verify all feature flags are zero
      if (this.featureFlags.some(v => v !== 0n))
         throw new Error('Unexpected non-zero feature flags: ' + this.featureFlags);
   }

   _readFieldDescriptors(reader) {
      const startOffset = BigInt(reader.offset),
            fieldListSize = reader.readS64(), // signed 64-bit
            fieldListIsList = fieldListSize < 0;


      if (!fieldListIsList)
         throw new Error('Field list frame is not a list frame, which is required.');

      const fieldListCount = reader.readU32(), // number of field entries
         // List frame: list of field record frames

            fieldDescriptors = [];
      for (let i = 0; i < fieldListCount; ++i) {
         const recordStart = BigInt(reader.offset),
               fieldRecordSize = reader.readS64(),
               fieldVersion = reader.readU32(),
               typeVersion = reader.readU32(),
               parentFieldId = reader.readU32(),
               structRole = reader.readU16(),
               flags = reader.readU16(),

               fieldName = reader.readString(),
               typeName = reader.readString(),
               typeAlias = reader.readString(),
               description = reader.readString();
         let arraySize = null,
             sourceFieldId = null,
             checksum = null;

         if (flags & kFlagRepetitiveField)
            arraySize = reader.readU64();

         if (flags & kFlagProjectedField)
            sourceFieldId = reader.readU32();

         if (flags & kFlagHasTypeChecksum)
            checksum = reader.readU32();


         fieldDescriptors.push({
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
         reader.seek(Number(recordStart + fieldRecordSize));
      }
      reader.seek(Number(startOffset - fieldListSize));
      return fieldDescriptors;
   }

   _readColumnDescriptors(reader) {
      const startOffset = BigInt(reader.offset),
            columnListSize = reader.readS64(),
            columnListIsList = columnListSize < 0;
      if (!columnListIsList)
         throw new Error('Column list frame is not a list frame, which is required.');
      const columnListCount = reader.readU32(), // number of column entries
            columnDescriptors = [];
      for (let i = 0; i < columnListCount; ++i) {
         const recordStart = BigInt(reader.offset),
               columnRecordSize = reader.readS64(),
               coltype = reader.readU16(),
               bitsOnStorage = reader.readU16(),
               fieldId = reader.readU32(),
               flags = reader.readU16(),
               representationIndex = reader.readU16();
         let firstElementIndex = null,
             minValue = null,
             maxValue = null;

         if (flags & kFlagDeferredColumn)
            firstElementIndex = reader.readU64();

         if (flags & kFlagHasValueRange) {
            minValue = reader.readF64();
            maxValue = reader.readF64();
         }


         const column = {
            coltype,
            bitsOnStorage,
            fieldId,
            flags,
            representationIndex,
            firstElementIndex,
            minValue,
            maxValue,
            index: i
         };
         column.isDeferred = function() {
            return (this.flags & RNTupleDescriptorBuilder.kFlagDeferredColumn) !== 0;
         };
         column.isSuppressed = function() {
            return this.firstElementIndex !== null && this.firstElementIndex < 0;
         };

         columnDescriptors.push(column);
         reader.seek(Number(recordStart + columnRecordSize));
      }
      reader.seek(Number(startOffset - columnListSize));
      return columnDescriptors;
   }

   _readAliasColumn(reader) {
      const startOffset = BigInt(reader.offset),
            aliasColumnListSize = reader.readS64(),
            aliasListisList = aliasColumnListSize < 0;
      if (!aliasListisList)
         throw new Error('Alias column list frame is not a list frame, which is required.');
      const aliasColumnCount = reader.readU32(), // number of alias column entries
            aliasColumns = [];
      for (let i = 0; i < aliasColumnCount; ++i) {
         const recordStart = BigInt(reader.offset),
               aliasColumnRecordSize = reader.readS64(),
               physicalColumnId = reader.readU32(),
               fieldId = reader.readU32();
         aliasColumns.push({
            physicalColumnId,
            fieldId
         });
         reader.seek(Number(recordStart + aliasColumnRecordSize));
      }
      reader.seek(Number(startOffset - aliasColumnListSize));
      return aliasColumns;
   }

   _readExtraTypeInformation(reader) {
      const startOffset = BigInt(reader.offset),
            extraTypeInfoListSize = reader.readS64(),
            isList = extraTypeInfoListSize < 0;

      if (!isList)
         throw new Error('Extra type info frame is not a list frame, which is required.');

      const entryCount = reader.readU32(),

            extraTypeInfo = [];
      for (let i = 0; i < entryCount; ++i) {
         const recordStart = BigInt(reader.offset),
               extraTypeInfoRecordSize = reader.readS64(),
               contentId = reader.readU32(),
               typeVersion = reader.readU32();
         extraTypeInfo.push({
            contentId,
            typeVersion
         });
         reader.seek(Number(recordStart + extraTypeInfoRecordSize));
      }
      reader.seek(Number(startOffset - extraTypeInfoListSize));
      return extraTypeInfo;
   }

   _readClusterGroups(reader) {
      const startOffset = BigInt(reader.offset),
            clusterGroupListSize = reader.readS64(),
            isList = clusterGroupListSize < 0;
      if (!isList)
         throw new Error('Cluster group frame is not a list frame');

      const groupCount = reader.readU32(),

            clusterGroups = [];

      for (let i = 0; i < groupCount; ++i) {
         const recordStart = BigInt(reader.offset),
               clusterRecordSize = reader.readS64(),
               minEntry = reader.readU64(),
               entrySpan = reader.readU64(),
               numClusters = reader.readU32(),
               pageListLength = reader.readU64(),


            // Locator method to get the page list locator offset
               pageListLocator = this._readLocator(reader),


               group = {
                  minEntry,
                  entrySpan,
                  numClusters,
                  pageListLocator,
                  pageListLength
               };
         clusterGroups.push(group);
         reader.seek(Number(recordStart + clusterRecordSize));
      }
      reader.seek(Number(startOffset - clusterGroupListSize));
      this.clusterGroups = clusterGroups;
   }

   _readLocator(reader) {
      const sizeAndType = reader.readU32(); // 4 bytes: size + T bit
      if ((sizeAndType | 0) < 0) // | makes the sizeAndType as signed
         throw new Error('Non-standard locators (T=1) not supported yet');
      const size = sizeAndType,
            offset = reader.readU64(); // 8 bytes: offset
      return {
         size,
         offset
      };
   }

   deserializePageList(page_list_blob) {
      if (!page_list_blob)
         throw new Error('deserializePageList: received an invalid or empty page list blob');

      const reader = new RBufferReader(page_list_blob);
      this._readEnvelopeMetadata(reader);
      // Page list checksum (64-bit xxhash3)
      const pageListHeaderChecksum = reader.readU64();
      if (pageListHeaderChecksum !== this.headerEnvelopeChecksum)
         throw new Error('RNTuple corrupted: header checksum does not match Page List Header checksum.');

      const listStartOffset = BigInt(reader.offset),
            // Read cluster summaries list frame
            clusterSummaryListSize = reader.readS64();
      if (clusterSummaryListSize >= 0)
         throw new Error('Expected a list frame for cluster summaries');
      const clusterSummaryCount = reader.readU32(),

            clusterSummaries = [];

      for (let i = 0; i < clusterSummaryCount; ++i) {
         const recordStart = BigInt(reader.offset),
               clusterSummaryRecordSize = reader.readS64(),
               firstEntry = reader.readU64(),
               combined = reader.readU64(),
               flags = combined >> 56n;
         if (flags & 0x01n)
            throw new Error('Cluster summary uses unsupported sharded flag (0x01)');
         const numEntries = Number(combined & 0x00FFFFFFFFFFFFFFn);
         clusterSummaries.push({
            firstEntry,
            numEntries,
            flags
         });
         reader.seek(Number(recordStart + clusterSummaryRecordSize));
      }
      reader.seek(Number(listStartOffset - clusterSummaryListSize));
      this.clusterSummaries = clusterSummaries;
      this._readNestedFrames(reader);

      /* const checksumPagelist = */ reader.readU64();
   }

   _readNestedFrames(reader) {
      const clusterPageLocations = [],
            numListClusters = reader.readS64();
      if (numListClusters >= 0)
         throw new Error('Expected list frame for clusters');
      const numRecordCluster = reader.readU32();

      for (let i = 0; i < numRecordCluster; ++i) {
         const outerListSize = reader.readS64();
         if (outerListSize >= 0)
            throw new Error('Expected outer list frame for columns');

         const numColumns = reader.readU32(),
               columns = [];

         for (let c = 0; c < numColumns; ++c) {
            const innerListSize = reader.readS64();
            if (innerListSize >= 0)
               throw new Error('Expected inner list frame for pages');

            const numPages = reader.readU32(),
                  pages = [];

            for (let p = 0; p < numPages; ++p) {
               const numElementsWithBit = reader.readS32(),
                     hasChecksum = numElementsWithBit < 0,
                     numElements = BigInt(Math.abs(Number(numElementsWithBit))),

                     locator = this._readLocator(reader);
               pages.push({
                  numElements,
                  hasChecksum,
                  locator
               });
            }

            const elementOffset = reader.readS64(),
                  isSuppressed = elementOffset < 0;

            let compression = null;
            if (!isSuppressed)
               compression = reader.readU32();

            columns.push({
               pages,
               elementOffset,
               isSuppressed,
               compression
            });
         }

         clusterPageLocations.push(columns);
      }

      this.pageLocations = clusterPageLocations;
   }

   // Example Of Deserializing Page Content
   deserializePage(blob, columnDescriptor, pageInfo) {
      const originalColtype = columnDescriptor.coltype,
            {
               coltype
            } = recontructUnsplitBuffer(blob, columnDescriptor);
      let {
         blob: processedBlob
      } = recontructUnsplitBuffer(blob, columnDescriptor);


      // Handle split index types
      if (originalColtype === ENTupleColumnType.kSplitIndex32 || originalColtype === ENTupleColumnType.kSplitIndex64) {
         const {
            blob: decodedArray
         } = DecodeDeltaIndex(processedBlob, coltype);
         processedBlob = decodedArray;
      }

      // Handle Split Signed Int types
      if (originalColtype === ENTupleColumnType.kSplitInt16 || originalColtype === ENTupleColumnType.kSplitInt32 || originalColtype === ENTupleColumnType.kSplitInt64) {
         const {
            blob: decodedArray
         } = decodeZigzag(processedBlob, coltype);
         processedBlob = decodedArray;
      }

      const reader = new RBufferReader(processedBlob),
            values = [],

            // Use numElements from pageInfo parameter
            numValues = Number(pageInfo.numElements),
            // Helper for all simple types
            extractValues = (readFunc) => {
               for (let i = 0; i < numValues; ++i)
                  values.push(readFunc());
            };
      switch (coltype) {
         case ENTupleColumnType.kBit: {
            let bitCount = 0;
            const totalBitsInBuffer = processedBlob.byteLength * 8;
            if (totalBitsInBuffer < numValues)
               throw new Error(`kBit: Not enough bits in buffer (${totalBitsInBuffer}) for numValues (${numValues})`);

            for (let byteIndex = 0; byteIndex < processedBlob.byteLength; ++byteIndex) {
               const byte = reader.readU8();

               // Extract 8 bits from this byte
               for (let bitPos = 0; bitPos < 8 && bitCount < numValues; ++bitPos, ++bitCount) {
                  const bitValue = (byte >>> bitPos) & 1,
                        boolValue = bitValue === 1;
                  values.push(boolValue);
               }
            }
            break;
         }

         case ENTupleColumnType.kReal64:
            extractValues(reader.readF64.bind(reader));
            break;
         case ENTupleColumnType.kReal32:
            extractValues(reader.readF32.bind(reader));
            break;
         case ENTupleColumnType.kInt64:
            extractValues(reader.readS64.bind(reader));
            break;
         case ENTupleColumnType.kUInt64:
            extractValues(reader.readU64.bind(reader));
            break;
         case ENTupleColumnType.kInt32:
            extractValues(reader.readS32.bind(reader));
            break;
         case ENTupleColumnType.kUInt32:
            extractValues(reader.readU32.bind(reader));
            break;
         case ENTupleColumnType.kInt16:
            extractValues(reader.readS16.bind(reader));
            break;
         case ENTupleColumnType.kUInt16:
            extractValues(reader.readU16.bind(reader));
            break;
         case ENTupleColumnType.kInt8:
            extractValues(reader.readS8.bind(reader));
            break;
         case ENTupleColumnType.kUInt8:
         case ENTupleColumnType.kByte:
            extractValues(reader.readU8.bind(reader));
            break;
         case ENTupleColumnType.kChar:
            extractValues(() => String.fromCharCode(reader.readS8()));
            break;
         case ENTupleColumnType.kIndex32:
            extractValues(reader.readS32.bind(reader));
            break;
         case ENTupleColumnType.kIndex64:
            extractValues(reader.readS64.bind(reader));
            break;
         default:
            throw new Error(`Unsupported column type: ${columnDescriptor.coltype}`);
      }
      return values;
   }

   findField(name) {
      for (let n = 0; n < this.fieldDescriptors.length; ++n) {
         const field = this.fieldDescriptors[n];
         if (field.fieldName === name)
            return field;
      }
   }

   /** @summary Return all childs of specified field */
   findChildFields(field) {
      const indx = this.fieldDescriptors.indexOf(field), res = [];
      for (let n = 0; n < this.fieldDescriptors.length; ++n) {
         const fld = this.fieldDescriptors[n];
         if ((fld !== field) && (fld.parentFieldId === indx))
            res.push(fld);
      }
      return res;
   }

   /** @summary Return array of columns for specified field */
   findColumns(field) {
      const res = [];
      if (!field)
         return res;
      for (const colDesc of this.columnDescriptors) {
         if (this.fieldDescriptors[colDesc.fieldId] === field)
            res.push(colDesc);
      }
      return res;
   }


} // class RNTupleDescriptorBuilder


/** @summary Very preliminary function to read header/footer from RNTuple
 * @private */
async function readHeaderFooter(tuple) {
   // if already read - return immediately, make possible to call several times
   if (tuple?.builder)
      return true;

   if (!tuple.$file)
      return false;

   // request header and footer buffers from the file
   return tuple.$file.readBuffer([tuple.fSeekHeader, tuple.fNBytesHeader, tuple.fSeekFooter, tuple.fNBytesFooter]).then(blobs => {
      if (blobs?.length !== 2)
         return false;

      // Handle both compressed and uncompressed cases
      const processBlob = (blob, uncompressedSize) => {
         // If uncompressedSize matches blob size, it's uncompressed
         if (blob.byteLength === uncompressedSize)
            return Promise.resolve(blob);
         return R__unzip(blob, uncompressedSize);
      };

      return Promise.all([
         processBlob(blobs[0], tuple.fLenHeader),
         processBlob(blobs[1], tuple.fLenFooter)
      ]).then(unzip_blobs => {
         const [header_blob, footer_blob] = unzip_blobs;
         if (!header_blob || !footer_blob)
            return false;

         tuple.builder = new RNTupleDescriptorBuilder;
         tuple.builder.deserializeHeader(header_blob);
         tuple.builder.deserializeFooter(footer_blob);

         // Deserialize Page List
         const group = tuple.builder.clusterGroups?.[0];
         if (!group || !group.pageListLocator)
            throw new Error('No valid cluster group or page list locator found');

         const offset = Number(group.pageListLocator.offset),
               size = Number(group.pageListLocator.size),
               uncompressedSize = Number(group.pageListLength);

         return tuple.$file.readBuffer([offset, size]).then(page_list_blob => {
            if (!(page_list_blob instanceof DataView))
               throw new Error(`Expected DataView from readBuffer, got ${Object.prototype.toString.call(page_list_blob)}`);

            // Check if page list data is uncompressed
            if (page_list_blob.byteLength === uncompressedSize) {
               // Data is uncompressed, use directly
               tuple.builder.deserializePageList(page_list_blob);
               return true;
            }
            // Attempt to decompress the page list
            return R__unzip(page_list_blob, uncompressedSize).then(unzipped_blob => {
               if (!(unzipped_blob instanceof DataView))
                  throw new Error(`Unzipped page list is not a DataView, got ${Object.prototype.toString.call(unzipped_blob)}`);

               tuple.builder.deserializePageList(unzipped_blob);
               return true;
            });
         });
      });
   }).catch(err => {
      console.error('Error during readHeaderFooter execution:', err);
      throw err;
   });
}


/** @summary Return field name for specified branch index
 * @desc API let use field name in selector or field object itself */
function getSelectorFieldName(selector, i) {
   const br = selector.getBranch(i);
   return isStr(br) ? br : br?.fieldName;
}

class ReaderItem {

   constructor(column, name) {
      this.column = null;
      this.name = name;
      this.id = -1;
      this.coltype = 0;
      this.sz = 0;
      this.simple = true;
      this.page = -1; // current page for the reading

      if (column?.coltype !== undefined) {
         this.column = column;
         this.id = column.index;
         this.coltype = column.coltype;

         // special handling of split types
         if ((this.coltype >= ENTupleColumnType.kSplitInt16) && (this.coltype <= ENTupleColumnType.kSplitIndex64)) {
            this.coltype -= (ENTupleColumnType.kSplitInt16 - ENTupleColumnType.kInt16);
            this.simple = false;
         }
      } else if (column?.length)
         this.items = column;
   }

   cleanup() {
      this.views = null;
      this.view = null;
      this.view_len = 0;
   }

   init_o() {
      this.o = 0;
      this.o2 = 0; // for bit count
      if (this.column && this.views?.length) {
         this.view = this.views.shift();
         this.view_len = this.view.byteLength;
      }
   }

   shift_o(sz) {
      this.o += sz;
      while ((this.o >= this.view_len) && this.view_len) {
         this.o -= this.view_len;
         if (this.views.length) {
            this.view = this.views.shift();
            this.view_len = this.view.byteLength;
         } else {
            this.view = null;
            this.view_len = 0;
         }
      }
   }

   shift(entries) {
      if (this.sz && this.simple)
         this.shift_o(this.sz * entries);
      else {
         while (entries-- > 0)
            this.func({});
      }
   }

   /** @summary Simple column with fixed element size - no vectors, no strings */
   is_simple() { return this.sz && this.simple; }

   set_not_simple() {
      this.simple = false;
      this.items?.forEach(item => item.set_not_simple());
   }

   assignReadFunc() {
      switch (this.coltype) {
         case ENTupleColumnType.kBit: {
            this.func = function(obj) {
               if (this.o2 === 0)
                  this.byte = this.view.getUint8(this.o);
               obj[this.name] = ((this.byte >>> this.o2++) & 1) === 1;
               if (this.o2 === 8) {
                  this.o2 = 0;
                  this.shift_o(1);
               }
            };
            break;
         }
         case ENTupleColumnType.kReal64:
            this.func = function(obj) {
               obj[this.name] = this.view.getFloat64(this.o, LITTLE_ENDIAN);
               this.shift_o(8);
            };
            this.sz = 8;
            break;
         case ENTupleColumnType.kReal32:
            this.func = function(obj) {
               obj[this.name] = this.view.getFloat32(this.o, LITTLE_ENDIAN);
               this.shift_o(4);
            };
            this.sz = 4;
            break;
         case ENTupleColumnType.kInt64:
         case ENTupleColumnType.kIndex64:
            this.func = function(obj) {
               // FIXME: let process BigInt in the TTree::Draw
               obj[this.name] = Number(this.view.getBigInt64(this.o, LITTLE_ENDIAN));
               this.shift_o(8);
            };
            this.sz = 8;
            break;
         case ENTupleColumnType.kUInt64:
            this.func = function(obj) {
               // FIXME: let process BigInt in the TTree::Draw
               obj[this.name] = Number(this.view.getBigUint64(this.o, LITTLE_ENDIAN));
               this.shift_o(8);
            };
            this.sz = 8;
            break;
         case ENTupleColumnType.kSwitch:
            this.func = function(obj) {
               // index not used in std::variant, may be in some other usecases
               // obj[this.name] = Number(this.view.getBigInt64(this.o, LITTLE_ENDIAN));
               this.shift_o(8); // skip value, not used yet
               obj[this.name] = this.view.getInt32(this.o, LITTLE_ENDIAN);
               this.shift_o(4);
            };
            this.sz = 12;
            break;
         case ENTupleColumnType.kInt32:
         case ENTupleColumnType.kIndex32:
            this.func = function(obj) {
               obj[this.name] = this.view.getInt32(this.o, LITTLE_ENDIAN);
               this.shift_o(4);
            };
            this.sz = 4;
            break;
         case ENTupleColumnType.kUInt32:
            this.func = function(obj) {
               obj[this.name] = this.view.getUint32(this.o, LITTLE_ENDIAN);
               this.shift_o(4);
            };
            this.sz = 4;
            break;
         case ENTupleColumnType.kInt16:
            this.func = function(obj) {
               obj[this.name] = this.view.getInt16(this.o, LITTLE_ENDIAN);
               this.shift_o(2);
            };
            this.sz = 2;
            break;
         case ENTupleColumnType.kUInt16:
            this.func = function(obj) {
               obj[this.name] = this.view.getUint16(this.o, LITTLE_ENDIAN);
               this.shift_o(2);
            };
            this.sz = 2;
            break;
         case ENTupleColumnType.kInt8:
            this.func = function(obj) {
               obj[this.name] = this.view.getInt8(this.o);
               this.shift_o(1);
            };
            this.sz = 1;
            break;
         case ENTupleColumnType.kUInt8:
         case ENTupleColumnType.kByte:
            this.func = function(obj) {
               obj[this.name] = this.view.getUint8(this.o);
               this.shift_o(1);
            };
            this.sz = 1;
            break;
         case ENTupleColumnType.kChar:
            this.func = function(obj) {
               obj[this.name] = String.fromCharCode(this.view.getInt8(this.o));
               this.shift_o(1);
            };
            this.sz = 1;
            break;
         default:
            throw new Error(`Unsupported column type: ${this.coltype}`);
      }
   }

   readStr(len) {
      let s = '';
      while (len-- > 0) {
         s += String.fromCharCode(this.view.getInt8(this.o));
         this.shift_o(1);
      }
      return s;
   }

   collectPages(cluster_locations, dataToRead, itemsToRead, pagesToRead, emin, emax, elist) {
      // no pages without real column id
      if (!this.column || (this.id < 0))
         return;

      const pages = cluster_locations[this.id].pages;

      this.views = new Array(pages.length);

      let e0 = 0;
      for (let p = 0; p < pages.length; ++p) {
         const page = pages[p],
               e1 = e0 + Number(page.numElements),
               margin = this._is_offset_item ? 1 : 0, // offset for previous entry has to be read as well
               is_inside = (e, beg, end) => (e >= beg) && (e < end + margin);
         let is_entries_inside = false;
         if (elist?.length)
            elist.forEach(e => { is_entries_inside ||= is_inside(e, e0, e1); });
         else
            is_entries_inside = is_inside(e0, emin, emax) || is_inside(e1, emin, emax) || is_inside(emin, e0, e1) || is_inside(emax, e0, e1);

         if (!this.is_simple() || is_entries_inside) {
            itemsToRead.push(this);
            dataToRead.push(Number(page.locator.offset), page.locator.size);
            pagesToRead.push(p);
            this.views[p] = null; // placeholder, filled after request
         } else
            this.views[p] = { byteLength: this.sz * Number(page.numElements) }; // dummy entry only to allow proper navigation

         e0 = e1;
      }
   }

   async unzipBlob(blob, cluster_locations, page_indx) {
      const colEntry = cluster_locations[this.id], // Access column entry
            numElements = Number(colEntry.pages[page_indx].numElements),
            elementSize = this.column.bitsOnStorage / 8;

      let expectedSize = numElements * elementSize;
      // Special handling for boolean fields
      if (this.coltype === ENTupleColumnType.kBit)
         expectedSize = Math.ceil(numElements / 8);

      // Check if data is compressed
      if ((colEntry.compression === 0) || (blob.byteLength === expectedSize))
         return blob; // Uncompressed: use blob directly

      // Try decompression
      return R__unzip(blob, expectedSize).then(result => {
         return result || blob; // Fallback to original blob ??
      }).catch(err => {
         throw new Error(`Failed to unzip page ${page_indx} for column ${this.id}: ${err.message}`);
      });
   }

   reconstructBlob(rawblob, page_indx) {
      if (!(rawblob instanceof DataView))
         throw new Error(`Invalid blob type for column ${this.id}: ${Object.prototype.toString.call(rawblob)}`);

      const originalColtype = this.column.coltype,
            data = recontructUnsplitBuffer(rawblob, this.column);

      let view;

      // Handle split index types
      if (originalColtype === ENTupleColumnType.kSplitIndex32 || originalColtype === ENTupleColumnType.kSplitIndex64)
         view = new DataView(DecodeDeltaIndex(data.blob, data.coltype).blob.buffer);
      else if (originalColtype === ENTupleColumnType.kSwitch)
         view = DecodeSwitchIndex(data.blob);
      // Handle Split Signed Int types
      else if (originalColtype === ENTupleColumnType.kSplitInt16 || originalColtype === ENTupleColumnType.kSplitInt32 || originalColtype === ENTupleColumnType.kSplitInt64)
         view = new DataView(decodeZigzag(data.blob, data.coltype).blob.buffer);
      else if (data.blob instanceof DataView)
         view = data.blob;
      else
         view = new DataView(data.blob);

      this.views[page_indx] = view;
   }

}


/** @class reading std::string field
 * @private */

class StringReaderItem extends ReaderItem {

   constructor(items, name) {
      super(items, name);
      items[0]._is_offset_item = true;
      items[1].set_not_simple();

      this.off0 = 0;
      this.$tgt = {};
   }

   func(tgtobj) {
      this.items[0].func(this.$tgt);
      const off = Number(this.$tgt.len);
      tgtobj[this.name] = this.items[1].readStr(off - this.off0);
      this.off0 = off;
   }

   shift(entries) {
      this.items[0].shift(entries - 1);
      this.items[0].func(this.$tgt);
      this.off0 = Number(this.$tgt.len);
      this.items[1].shift_o(this.off0);
   }

}

/** @class reading of std::array<T,N>
 * @private */

class ArrayReaderItem extends ReaderItem {

   constructor(items, tgtname, arrsize) {
      super(items, tgtname);
      this.arrsize = arrsize;
      items[0].set_not_simple();
   }

   func(tgtobj) {
      const arr = [], tmp = {};
      let len = this.arrsize;
      while (len-- > 0) {
         this.items[0].func(tmp);
         arr.push(tmp.value);
      }
      tgtobj[this.name] = arr;
   }

   shift(entries) {
      this.items[0].shift(entries * this.arrsize);
   }

}



/** @class reading std::vector and other kinds of collections
 * @private */

class CollectionReaderItem extends ReaderItem {

   constructor(items, tgtname) {
      super(items, tgtname);
      this.off0 = 0;
      items[0]._is_offset_item = true;
      items[1].set_not_simple();
   }

   func(tgtobj) {
      const arr = [], tmp = {};
      this.items[0].func(tmp);
      const off = Number(tmp.len);
      let len = off - this.off0;
      while (len-- > 0) {
         this.items[1].func(tmp);
         arr.push(tmp.val);
      }
      tgtobj[this.name] = arr;
      this.off0 = off;
   }

   shift(entries) {
      const tmp = {};
      this.items[0].shift(entries - 1);
      this.items[0].func(tmp);
      this.off0 = Number(tmp[this.name]);
      this.items[1].shift(this.off0);
   }

}

/** @class reading std::variant field
  * @private */

class VariantReaderItem extends ReaderItem {

   constructor(items, tgtname) {
      super(items, tgtname);
      this.items = items;
      this.set_not_simple();
   }

   func(tgtobj) {
      const tmp = {};
      this.items[0].func(tmp);
      const id = tmp.switch;
      if (id === 0)
         tgtobj[this.name] = null; // set null
      else if (Number.isInteger(id) && (id > 0) && (id < this.items.length))
         this.items[id].func(tgtobj);
   }

}

/** @class reading std::tuple<> field
  * @private */

class TupleReaderItem extends ReaderItem {

   func(tgtobj) {
      const tuple = {};
      this.items.forEach(item => item.func(tuple));
      tgtobj[this.name] = tuple;
   }

   shift(entries) {
      this.items.forEach(item => item.shift(entries));
   }

}


/** @class reading std::pair field
 * @private */

class PairReaderItem extends ReaderItem {

   func(tgtobj) {
      const res = {};
      this.items[0].func(res);
      this.items[1].func(res);
      tgtobj[this.name] = res;
   }

   shift(entries) {
      this.items[0].shift(entries);
      this.items[1].shift(entries);
   }

}


async function rntupleProcess(rntuple, selector, args = {}) {
   const handle = {
      rntuple, // keep rntuple reference
      file: rntuple.$file, // keep file reference
      selector, // reference on selector
      columns: [], // list of ReaderItem with real columns for reading
      arr: [], // list of ReaderItem with real branches readout
      current_cluster: 0, // current cluster to process
      current_cluster_first_entry: 0, // first entry in current cluster
      current_cluster_last_entry: 0, // last entry in current cluster
      current_entry: 0, // current processed entry
      process_arrays: false, // one can process all branches as arrays
      firstentry: 0,  // first entry in the rntuple
      lastentry: 0    // last entry in the rntuple
   };

   function readNextPortion(inc_cluster) {
      if (inc_cluster) {
         handle.current_cluster++;
         handle.current_cluster_first_entry = handle.current_cluster_last_entry;
      }

      const locations = rntuple.builder.pageLocations[handle.current_cluster];
      if (!locations) {
         selector.Terminate(true);
         return selector;
      }

      const numClusterEntries = rntuple.builder.clusterSummaries[handle.current_cluster].numEntries;

      handle.current_cluster_last_entry = handle.current_cluster_first_entry + numClusterEntries;

      // calculate entries which can be extracted from the cluster
      let emin, emax;
      const dataToRead = [], itemsToRead = [], pagesToRead = [], elist = [];

      if (handle.process_entries) {
         let i = handle.process_entries_indx;
         while ((i < handle.process_entries.length) && (handle.process_entries[i] < handle.current_cluster_last_entry))
            elist.push(handle.process_entries[i++] - handle.current_cluster_first_entry);
         emin = elist[0];
         emax = elist[elist.length - 1];
      } else {
         emin = handle.current_entry - handle.current_cluster_first_entry;
         emax = Math.min(numClusterEntries, handle.process_max - handle.current_cluster_first_entry);
      }

      // loop over all columns and request required pages
      handle.columns.forEach(item => item.collectPages(locations, dataToRead, itemsToRead, pagesToRead, emin, emax, elist));

      return rntuple.$file.readBuffer(dataToRead).then(blobsRaw => {
         const blobs = Array.isArray(blobsRaw) ? blobsRaw : [blobsRaw],
               unzipPromises = blobs.map((blob, idx) => itemsToRead[idx].unzipBlob(blob, locations, pagesToRead[idx]));
         return Promise.all(unzipPromises);
      }).then(unzipBlobs => {
         unzipBlobs.map((rawblob, idx) => itemsToRead[idx].reconstructBlob(rawblob, pagesToRead[idx]));

         for (let indx = 0; indx < handle.columns.length; ++indx)
            handle.columns[indx].init_o();

         let skip_entries = handle.current_entry - handle.current_cluster_first_entry;

         while (handle.current_entry < handle.current_cluster_last_entry) {
            for (let i = 0; i < handle.arr.length; ++i) {
               if (skip_entries > 0)
                  handle.arr[i].shift(skip_entries);
               handle.arr[i].func(selector.tgtobj);
            }
            skip_entries = 0;

            selector.Process(handle.current_entry);

            if (handle.process_entries) {
               if (++handle.process_entries_indx >= handle.process_entries.length) {
                  selector.Terminate(true);
                  return selector;
               }
               const prev_entry = handle.current_entry;
               handle.current_entry = handle.process_entries[handle.process_entries_indx];
               skip_entries = handle.current_entry - prev_entry - 1;
            } else if (++handle.current_entry >= handle.process_max) {
               selector.Terminate(true);
               return selector;
            }
         }

         return readNextPortion(true);
      });
   }

   function addColumnReadout(column, tgtname) {
      const item = new ReaderItem(column, tgtname);
      item.assignReadFunc();
      handle.columns.push(item);
      return item;
   }

   function addFieldReading(field, tgtname) {
      const columns = rntuple.builder.findColumns(field),
            childs = rntuple.builder.findChildFields(field);
      if (!columns?.length) {
         if ((childs.length === 2) && (field.typeName.indexOf('std::pair') === 0)) {
            const item1 = addFieldReading(childs[0], 'first'),
                  item2 = addFieldReading(childs[1], 'second');
            return new PairReaderItem([item1, item2], tgtname);
         }

         if ((childs.length === 1) && (field.typeName.indexOf('std::array') === 0)) {
            const item1 = addFieldReading(childs[0], 'value');
            return new ArrayReaderItem([item1], tgtname, Number(field.arraySize));
         }

         if ((childs.length > 0) && (field.typeName.indexOf('std::tuple') === 0)) {
            const items = [];
            for (let i = 0; i < childs.length; ++i)
               items.push(addFieldReading(childs[i], `_${i}`));
            return new TupleReaderItem(items, tgtname);
         }

         throw new Error(`No columns found for field '${field.fieldName}' in RNTuple`);
      }

      if ((columns.length === 2) && (field.typeName === 'std::string')) {
         const itemlen = addColumnReadout(columns[0], 'len'),
               itemstr = addColumnReadout(columns[1], 'str');
         return new StringReaderItem([itemlen, itemstr], tgtname);
      }

      let is_stl = false;
      ['vector', 'map', 'unordered_map', 'multimap', 'unordered_multimap', 'set', 'unordered_set', 'multiset', 'unordered_multiset'].forEach(name => {
         if (field.typeName.indexOf('std::' + name) === 0)
            is_stl = true;
      });

      if ((childs.length === 1) && is_stl) {
         const itemlen = addColumnReadout(columns[0], 'len'),
               itemval = addFieldReading(childs[0], 'val');
         return new CollectionReaderItem([itemlen, itemval], tgtname);
      }

      if ((childs.length > 0) && (field.typeName.indexOf('std::variant') === 0)) {
         const items = [addColumnReadout(columns[0], 'switch')];
         for (let i = 0; i < childs.length; ++i)
            items.push(addFieldReading(childs[i], tgtname));
         return new VariantReaderItem(items, tgtname);
      }

      return addColumnReadout(columns[0], tgtname);
   }

   return readHeaderFooter(rntuple).then(res => {
      if (!res)
         throw new Error('Not able to read header for the RNtuple');

      for (let i = 0; i < selector.numBranches(); ++i) {
         const name = getSelectorFieldName(selector, i),
               tgtname = selector.nameOfBranch(i);
         if (!name)
            throw new Error(`Not able to extract name for field ${i}`);

         const field = rntuple.builder.findField(name);
         if (!field)
            throw new Error(`Field ${name} not found`);

         const item = addFieldReading(field, tgtname);
         handle.arr.push(item);
      }

      // calculate number of entries
      rntuple.builder.clusterSummaries.forEach(summary => { handle.lastentry += summary.numEntries; });

      if (handle.firstentry >= handle.lastentry)
         throw new Error('Not able to find entries in the RNtuple');

      // select range of entries to process
      handle.process_min = handle.firstentry;
      handle.process_max = handle.lastentry;

      if (args.elist) {
         args.firstentry = args.elist.at(0);
         args.numentries = args.elist.at(-1) - args.elist.at(0) + 1;
         handle.process_entries = args.elist;
         handle.process_entries_indx = 0;
         handle.process_arrays = false; // do not use arrays process for selected entries
      }

      if (Number.isInteger(args.firstentry) && (args.firstentry > handle.firstentry) && (args.firstentry < handle.lastentry))
         handle.process_min = args.firstentry;

      if (Number.isInteger(args.numentries) && (args.numentries > 0))
         handle.process_max = Math.min(handle.process_max, handle.process_min + args.numentries);

      // first check from which cluster one should start
      for (let indx = 0, emin = 0; indx < rntuple.builder.clusterSummaries.length; ++indx) {
         const summary = rntuple.builder.clusterSummaries[indx],
               emax = emin + summary.numEntries;
         if ((handle.process_min >= emin) && (handle.process_min < emax)) {
            handle.current_cluster = indx;
            handle.current_cluster_first_entry = emin;
            break;
         }
         emin = emax;
      }

      if (handle.current_cluster < 0)
         throw new Error(`Not able to find cluster for entry ${handle.process_min} in the RNtuple`);

      handle.current_entry = handle.process_min;

      selector.Begin(rntuple);

      return readNextPortion();
   }).then(() => selector);
}


class TDrawSelectorTuple extends TDrawSelector {

   /** @summary Return total number of entries
     * @desc TODO: check implementation details ! */
   getNumEntries(tuple) {
      let cnt = 0;
      tuple?.builder.clusterSummaries.forEach(summary => { cnt += summary.numEntries; });
      return cnt;
   }

   /** @summary Search for field in tuple
     * @desc TODO: Can be more complex when name includes extra parts referencing member or collection size or more  */
   findBranch(tuple, name) { return tuple.builder?.findField(name); }

   /** @summary Returns true if field can be used as array */
   isArrayBranch(/* tuple, br */) { return false; }

} // class TDrawSelectorTuple


/** @summary implementation of drawing for RNTuple
 * @param {object|string} args - different setting or simply draw expression
 * @param {string} args.expr - draw expression
 * @param {string} [args.cut=undefined] - cut expression (also can be part of 'expr' after '::')
 * @param {string} [args.drawopt=undefined] - draw options for result histogram
 * @param {number} [args.firstentry=0] - first entry to process
 * @param {number} [args.numentries=undefined] - number of entries to process, all by default
 * @param {Array} [args.elist=undefined] - array of entries id to process, all by default
 * @param {boolean} [args.staged] - staged processing, first apply cut to select entries and then perform drawing for selected entries
 * @param {object} [args.branch=undefined] - TBranch object from TTree itself for the direct drawing
 * @param {function} [args.progress=undefined] - function called during histogram accumulation with obj argument
 * @return {Promise} with produced object */

async function rntupleDraw(rntuple, args) {
   if (isStr(args))
      args = { expr: args };
   else if (!isObject(args))
      args = {};

   args.SelectorClass = TDrawSelectorTuple;
   args.processFunction = rntupleProcess;

   return readHeaderFooter(rntuple).then(res_header_footer => {
      return res_header_footer ? treeDraw(rntuple, args) : null;
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

      tuple.builder?.fieldDescriptors.forEach((field, indx) => {
         if (field.parentFieldId !== indx)
            return;
         const item = {
            _name: field.fieldName,
            _typename: 'ROOT::RNTupleField', // pseudo class name, used in draw.mjs
            _kind: 'ROOT::RNTupleField',
            _title: `Filed of type ${field.typeName}`,
            $tuple: tuple, // reference on tuple, need for drawing
            $field: field
         };

         item._obj = item;

         tuple_node._childs.push(item);
      });

      return true;
   });
}

export { tupleHierarchy, readHeaderFooter, RBufferReader, rntupleProcess, rntupleDraw };
