export const kChar: 1;
export const kShort: 2;
export const kInt: 3;
export const kLong: 4;
export const kFloat: 5;
export const kCounter: 6;
export const kCharStar: 7;
export const kDouble: 8;
export const kDouble32: 9;
export const kLegacyChar: 10;
export const kUChar: 11;
export const kUShort: 12;
export const kUInt: 13;
export const kULong: 14;
export const kBits: 15;
export const kLong64: 16;
export const kULong64: 17;
export const kBool: 18;
export const kFloat16: 19;
export const kBase: 0;
export const kOffsetL: 20;
export const kOffsetP: 40;
export const kObject: 61;
export const kAny: 62;
export const kObjectp: 63;
export const kObjectP: 64;
export const kTString: 65;
export const kAnyP: 69;
export const kStreamer: 500;
export const kStreamLoop: 501;
export const kSTLp: 71;
export const kSTL: 300;
/** @summary Reads header envelope, determines zipped size and unzip content
  * @returns {Promise} with unzipped content
  * @private */
export function R__unzip(arr: any, tgtsize: any, noalert: any, src_shift: any): Promise<any>;
/** @summary Add custom streamer
  * @public */
export function addUserStreamer(type: any, user_streamer: any): void;
/** @summary create element of the streamer
  * @private  */
export function createStreamerElement(name: any, typename: any, file: any): {
    _typename: string;
    fName: any;
    fTypeName: any;
    fType: number;
    fSize: number;
    fArrayLength: number;
    fArrayDim: number;
    fMaxIndex: number[];
    fXmin: number;
    fXmax: number;
    fFactor: number;
};
/** @summary create member entry for streamer element
  * @desc used for reading of data
  * @private */
export function createMemberStreamer(element: any, file: any): {
    name: any;
    type: any;
    fArrayLength: any;
    fArrayDim: any;
    fMaxIndex: any;
};
/** @summary Open ROOT file for reading
  * @desc Generic method to open ROOT file for reading
  * Following kind of arguments can be provided:
  *  - string with file URL (see example). In node.js environment local file like "file://hsimple.root" can be specified
  *  - [File]{@link https://developer.mozilla.org/en-US/docs/Web/API/File} instance which let read local files from browser
  *  - [ArrayBuffer]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer} instance with complete file content
  *  - [FileProxy]{@link FileProxy} let access arbitrary files via tiny proxy API
  * @param {string|object} arg - argument for file open like url, see details
  * @returns {object} - Promise with {@link TFile} instance when file is opened
  * @example
  *
  * import { openFile } from '/path_to_jsroot/modules/io.mjs';
  * let f = await openFile("https://root.cern/js/files/hsimple.root");
  * console.log(`Open file ${f.getFileName()}`); */
export function openFile(arg: string | object): object;
/** @summary Reconstruct ROOT object from binary buffer
  * @desc Method can be used to reconstruct ROOT objects from binary buffer
  * which can be requested from running THttpServer, using **root.bin** request
  * To decode data, one has to request streamer infos data __after__ object data
  * as it shown in example.
  *
  * Method provided for convenience only to see how binary IO works.
  * It is strongly recommended to use **root.json** request to get data directly in
  * JSON format
  *
  * @param {string} class_name - Class name of the object
  * @param {binary} obj_rawdata - data of object root.bin request
  * @param {binary} sinfo_rawdata - data of streamer info root.bin request
  * @returns {object} - created JavaScript object
  * @example
  *
  * import { httpRequest } from 'http://localhost:8080/jsrootsys/modules/core.mjs';
  * import { reconstructObject } from 'http://localhost:8080/jsrootsys/modules/io.mjs';
  *
  * let obj_data = await httpRequest("http://localhost:8080/Files/job1.root/hpx/root.bin", "buf");
  * let si_data = await httpRequest("http://localhost:8080/StreamerInfo/root.bin", "buf");
  * let histo = await reconstructObject("TH1F", obj_data, si_data);
  * console.log(`Get histogram with title = ${histo.fTitle}`);
  *
  * // request same data via root.json request
  * httpRequest("http://localhost:8080/Files/job1.root/hpx/root.json", "object")
  *            .then(histo => console.log(`Get histogram with title = ${histo.fTitle}`)); */
export function reconstructObject(class_name: string, obj_rawdata: binary, sinfo_rawdata: binary): object;
/**
  * @summary Proxy to read file contenxt
  *
  * @desc Should implement followinf methods
  *        openFile() - return Promise with true when file can be open normally
  *        getFileName() - returns string with file name
  *        getFileSize() - returns size of file
  *        readBuffer(pos, len) - return promise with DataView for requested position and length
  * @private
  */
export class FileProxy {
    openFile(): Promise<boolean>;
    getFileName(): string;
    getFileSize(): number;
    readBuffer(): Promise<any>;
}
/**
  * @summary Buffer object to read data from TFile
  *
  * @private
  */
export class TBuffer {
    constructor(arr: any, pos: any, file: any, length: any);
    _typename: string;
    arr: any;
    o: any;
    fFile: any;
    length: any;
    fTagOffset: number;
    last_read_version: number;
    /** @summary locate position in the buffer  */
    locate(pos: any): void;
    /** @summary shift position in the buffer  */
    shift(cnt: any): void;
    /** @summary Returns remaining place in the buffer */
    remain(): number;
    /** @summary Get mapped object with provided tag */
    getMappedObject(tag: any): any;
    /** @summary Map object */
    mapObject(tag: any, obj: any): void;
    /** @summary Map class */
    mapClass(tag: any, classname: any): void;
    /** @summary Get mapped class with provided tag */
    getMappedClass(tag: any): any;
    /** @summary Clear objects map */
    clearObjectMap(): void;
    fObjectMap: {};
    fClassMap: {};
    fDisplacement: number;
    /** @summary  read class version from I/O buffer */
    readVersion(): {
        bytecnt: number;
        val: any;
        off: any;
        checksum: any;
    };
    last_read_checksum: any;
    /** @summary Check bytecount after object streaming */
    checkByteCount(ver: any, where: any): boolean;
    /** @summary Read TString object (or equivalent)
      * @desc std::string uses similar binary format */
    readTString(): string;
    /** @summary read Char_t array as string
      * @desc string either contains all symbols or until 0 symbol */
    readFastString(n: any): string;
    /** @summary read uint8_t */
    ntou1(): any;
    /** @summary read uint16_t */
    ntou2(): any;
    /** @summary read uint32_t */
    ntou4(): any;
    /** @summary read uint64_t */
    ntou8(): any;
    /** @summary read int8_t */
    ntoi1(): any;
    /** @summary read int16_t */
    ntoi2(): any;
    /** @summary read int32_t */
    ntoi4(): any;
    /** @summary read int64_t */
    ntoi8(): any;
    /** @summary read float */
    ntof(): any;
    /** @summary read double */
    ntod(): any;
    /** @summary Reads array of n values from the I/O buffer */
    readFastArray(n: any, array_type: any): any[] | Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;
    /** @summary Check if provided regions can be extracted from the buffer */
    canExtract(place: any): boolean;
    /** @summary Extract area */
    extract(place: any): any[] | DataView;
    /** @summary Get code at buffer position */
    codeAt(pos: any): any;
    /** @summary Get part of buffer as string */
    substring(beg: any, end: any): string;
    /** @summary Read buffer as N-dim array */
    readNdimArray(handle: any, func: any): any;
    /** @summary read TKey data */
    readTKey(key: any): any;
    /** @summary reading basket data
      * @desc this is remaining part of TBasket streamer to decode fEntryOffset
      * after unzipping of the TBasket data */
    readBasketEntryOffset(basket: any, offset: any): void;
    /** @summary read class definition from I/O buffer */
    readClass(): {
        name: number;
    };
    /** @summary Read any object from buffer data */
    readObjectAny(): any;
    /** @summary Invoke streamer for specified class  */
    classStreamer(obj: any, classname: any): any;
}
