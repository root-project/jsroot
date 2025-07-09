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


class RNTupleDescriptorBuilder {

    deserializeHeader(header_blob) {
        if (!header_blob) return;

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
        if (!footer_blob) return;

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
            if ((val & 0x8000000000000000n) === 0n) break; // MSB not set: end of list
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

            if (flags & 0x1) arraySize = reader.readU64();
            if (flags & 0x2) sourceFieldId = reader.readU32();
            if (flags & 0x4) checksum = reader.readU32();

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
            if (flags & 0x1) firstElementIndex = reader.readU64();
            if (flags & 0x2) {
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
                return (this.flags & 0x01) !== 0;
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
            reader.seek(Number(recordStart+aliasColumnRecordSize));
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
        if (!isList) throw new Error('Cluster group frame is not a list frame');

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

        const checksumPagelist = reader.readU64();
        console.log(checksumPagelist);
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
    deserializePage(blob, columnDescriptor) {
        const reader = new RBufferReader(blob);

        // Validate the column type before decoding
        if (columnDescriptor.coltype !== 13)
            throw new Error(`Expected column type 13 (kReal64), got ${columnDescriptor.coltype}`);


        for (let i = 0; i < 10; ++i) {
            const val = reader.readF64();
            console.log(val);
        }
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

            // Build fieldToColumns mapping
            tuple.fieldToColumns = {};
            for (const colDesc of tuple.builder.columnDescriptors) {
                const fieldDesc = tuple.builder.fieldDescriptors[colDesc.fieldId],
                fieldName = fieldDesc.fieldName;
                if (!tuple.fieldToColumns[fieldName])
                    tuple.fieldToColumns[fieldName] = [];
                tuple.fieldToColumns[fieldName].push(colDesc);
            }

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

// Read and process the next data cluster from the RNTuple
function readNextCluster(rntuple, selector) {
    const builder = rntuple.builder,
    clusterIndex = selector.currentCluster,
    clusterSummary = builder.clusterSummaries[clusterIndex],

    // Gather all pages for this cluster from all columns
    pages = [];

    for (const columns of Object.values(rntuple.fieldToColumns)) {
        for (const colDesc of columns) {
            const colPages = builder.pageLocations[clusterIndex][colDesc.index].pages;
            for (const page of colPages)
                pages.push({ page, colDesc });
        }
    }

    selector.currentCluster++;

    // Build flat array of [offset, size, offset, size, ...] to read pages
    const dataToRead = pages
    .filter(p => p.page && p.page.locator)  // Skip invalid ones
    .flatMap(p => [Number(p.page.locator.offset), Number(p.page.locator.size)]);


    return rntuple.$file.readBuffer(dataToRead).then(blobsRaw => {
        const blobs = Array.isArray(blobsRaw) ? blobsRaw : [blobsRaw],
        unzipPromises = blobs.map((blob, idx) => {
            const { page, colDesc } = pages[idx],
            numElements = Number(page.numElements),
            elementSize = colDesc.bitsOnStorage / 8;
            return R__unzip(blob, numElements * elementSize);
        });

        return Promise.all(unzipPromises).then(unzipBlobs => {
            for (let i = 0; i < unzipBlobs.length; ++i) {
                const { colDesc } = pages[i],
                field = builder.fieldDescriptors[colDesc.fieldId];
                rntuple.builder.deserializePage(unzipBlobs[i], colDesc, field);
            }

            const reader = new RBufferReader(unzipBlobs[0].buffer); // pick one column as example
            for (let i = 0; i < clusterSummary.numEntries; ++i) {
                selector.tgtobj.myDouble = reader.readF64();  // TODO: Replace with real field extraction later
                selector.Process();
            }

            selector.Terminate();
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

/** @summary Create hierarchy of ROOT::RNTuple object
 * @desc Used by hierarchy painter to explore sub-elements
 * @private */
async function tupleHierarchy(tuple_node, tuple) {
    tuple_node._childs = [];
    // tuple_node._tuple = tuple;  // set reference, will be used later by RNTuple::Draw

    return readHeaderFooter(tuple).then(res => {
        if (!res)
            return res;

        tuple.builder?.fieldDescriptors.forEach(field => {
            tuple_node._childs.push({
                _name: field.fieldName,
                _kind: 'ROOT::RNTupleField', // pseudo class name, used in draw.mjs
                _title: `Filed of type ${field.typeName}`,
                _obj: field
            });
        });

        return true;
    });
}

export { tupleHierarchy, readHeaderFooter, RBufferReader, rntupleProcess };