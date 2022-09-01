export const kindGeo: 0;
export const kindEve: 1;
export const kindShape: 2;
export function geoCfg(name: any, value: any): any;
export namespace geoBITS {
    const kVisOverride: number;
    const kVisNone: number;
    const kVisThis: number;
    const kVisDaughters: number;
    const kVisOneLevel: number;
    const kVisStreamed: number;
    const kVisTouched: number;
    const kVisOnScreen: number;
    const kVisContainers: number;
    const kVisOnly: number;
    const kVisBranch: number;
    const kVisRaytrace: number;
}
/**
  * @summary class for working with cloned nodes
  *
  * @private
  */
export class ClonedNodes {
    /** @summary Constructor */
    constructor(obj: any, clones: any);
    toplevel: boolean;
    name_prefix: string;
    maxdepth: number;
    vislevel: number;
    maxnodes: number;
    nodes: any;
    /** @summary Set maximal depth for nodes visibility */
    setVisLevel(lvl: any): void;
    /** @summary Returns maximal depth for nodes visibility */
    getVisLevel(): number;
    /** @summary Set maximal number of visible nodes */
    setMaxVisNodes(v: any): void;
    /** @summary Returns configured maximal number of visible nodes */
    getMaxVisNodes(): number;
    /** @summary Insert node into existing array */
    updateNode(node: any): void;
    /** @summary Returns TGeoShape for element with given indx */
    getNodeShape(indx: any): any;
    /** @summary function to cleanup as much as possible structures
      * @desc Provided parameters drawnodes and drawshapes are arrays created during building of geometry */
    cleanup(drawnodes: any, drawshapes: any): void;
    /** @summary Create complete description for provided Geo object */
    createClones(obj: any, sublevel: any, kind: any): void;
    origin: any[];
    sortmap: any[];
    /** @summary Create elementary item with single already existing shape
      * @desc used by details view of geometry shape */
    createClonesForShape(obj: any): void;
    plain_shape: any;
    /** @summary Count all visisble nodes */
    countVisibles(): number;
    /** @summary Mark visisble nodes.
      * @desc Set only basic flags, actual visibility depends from hierarchy */
    markVisibles(on_screen: any, copy_bits: any, hide_top_volume: any): number;
    /** @summary After visibility flags is set, produce idshift for all nodes as it would be maximum level */
    produceIdShifts(): void;
    /** @summary Extract only visibility flags
      * @desc Used to transfer them to the worker */
    getVisibleFlags(): any[];
    /** @summary Assign only visibility flags, extracted with getVisibleFlags */
    setVisibleFlags(flags: any): number;
    /** @summary Scan visible nodes in hierarchy, starting from nodeid
      * @desc Each entry in hierarchy get its unique id, which is not changed with visibility flags */
    scanVisible(arg: any, vislvl: any): number;
    /** @summary Return node name with given id.
     * @desc Either original object or description is used */
    getNodeName(nodeid: any): any;
    /** @summary Returns description for provide stack */
    resolveStack(stack: any, withmatrix: any): {
        id: number;
        obj: any;
        node: any;
        name: string;
    };
    /** @summary Create stack array based on nodes ids array.
     * @desc Ids list should correspond to existing nodes hierarchy */
    buildStackByIds(ids: any): any[];
    /** @summary Retuns ids array which correspond to the stack */
    buildIdsByStack(stack: any): number[];
    /** @summary Returns true if stack includes at any place provided nodeid */
    isIdInStack(nodeid: any, stack: any): boolean;
    /** @summary Find stack by name which include names of all parents */
    findStackByName(fullname: any): number[];
    /** @summary Set usage of default ROOT colors */
    setDefaultColors(on: any): void;
    use_dflt_colors: any;
    dflt_table: number[];
    /** @summary Provide different properties of draw entry nodeid
      * @desc Only if node visible, material will be created */
    getDrawEntryProperties(entry: any, root_colors: any): {
        name: any;
        nname: any;
        shape: any;
        material: any;
        chlds: any;
    };
    /** @summary Creates hierarchy of Object3D for given stack entry
      * @desc Such hierarchy repeats hierarchy of TGeoNodes and set matrix for the objects drawing
      * also set renderOrder, required to handle transparency */
    createObject3D(stack: any, toplevel: any, options: any): any;
    /** @summary Get volume boundary */
    getVolumeBoundary(viscnt: any, facelimit: any, nodeslimit: any): {
        min: number;
        max: number;
        sortidcut: number;
    };
    /** @summary Collects visible nodes, using maxlimit
      * @desc One can use map to define cut based on the volume or serious of cuts */
    collectVisibles(maxnumfaces: any, frustum: any): {
        lst: any;
        complete: boolean;
    };
    actual_level: number;
    /** @summary Merge list of drawn objects
      * @desc In current list we should mark if object already exists
      * from previous list we should collect objects which are not there */
    mergeVisibles(current: any, prev: any): any[];
    /** @summary Collect all uniques shapes which should be built
     *  @desc Check if same shape used many times for drawing */
    collectShapes(lst: any): any[];
    /** @summary Merge shape lists */
    mergeShapesLists(oldlst: any, newlst: any): any;
    /** @summary Build shapes */
    buildShapes(lst: any, limit: any, timelimit: any): {
        done: boolean;
        shapes: number;
        faces: number;
        notusedshapes: number;
    };
}
/** @summary Checks if two stack arrays are identical
  * @private */
export function isSameStack(stack1: any, stack2: any): boolean;
/** @summary Check duplicates
  * @private */
export function checkDuplicates(parent: any, chlds: any): void;
/** @summary Returns geo object name
  * @desc Can appends some special suffixes
  * @private */
export function getObjectName(obj: any): any;
/** @summary Test fGeoAtt bits
  * @private */
export function testGeoBit(volume: any, f: any): boolean;
/** @summary Set fGeoAtt bit
  * @private */
export function setGeoBit(volume: any, f: any, value: any): void;
/** @summary Toggle fGeoAttBit
  * @private */
export function toggleGeoBit(volume: any, f: any): void;
/** @summary Implementation of TGeoVolume::InvisibleAll
  * @private */
export function setInvisibleAll(volume: any, flag: any): void;
/** @summary Returns number of shapes
  * @desc Used to count total shapes number in composites
  * @private */
export function countNumShapes(shape: any): any;
/** @summary Analyze TGeo node kind
 *  @desc  0 - TGeoNode
 *         1 - TEveGeoNode
 *        -1 - unsupported
 * @returns detected node kind
 * @private */
export function getNodeKind(obj: any): 1 | -1 | 0;
/** @summary Set rendering order for created hierarchy
 * @desc depending from provided method sort differently objects
 * @param toplevel - top element
 * @param origin - camera position used to provide sorting
 * @param method - name of sorting method like "pnt", "ray", "size", "dflt"  */
export function produceRenderOrder(toplevel: any, origin: any, method: any, clones: any): void;
/** @summary Create flipped mesh for the shape
 * @desc When transformation matrix includes one or several inversion of axis,
 * one should inverse geometry object, otherwise three.js cannot correctly draw it
 * @param {Object} shape - TGeoShape object
 * @param {Object} material - material
 * @private */
export function createFlippedMesh(shape: any, material: any): any;
/** @summary Cleanup shape entity
 * @private */
export function cleanupShape(shape: any): void;
/** @summary Creates geometry model for the provided shape
  * @param {Object} shape - instance of TGeoShape object
  * @param {Number} limit - defines return value, see details
  * @desc
  *  - if limit === 0 (or undefined) returns BufferGeometry
  *  - if limit < 0 just returns estimated number of faces
  *  - if limit > 0 return list of CsgPolygons (used only for composite shapes)
  * @private */
export function createGeometry(shape: any, limit: number): any;
/** @summary Returns number of faces for provided geometry
  * @param {Object} geom  - can be Geometry,m BufferGeometry, CsgGeometry or interim array of polygons
  * @private */
export function numGeometryFaces(geom: any): any;
/** @summary Returns number of faces for provided geometry
  * @param {Object} geom  - can be Geometry, BufferGeometry, CsgGeometry or interim array of polygons
  * @private */
export function numGeometryVertices(geom: any): any;
/** @summary Try to create projected geometry
  * @private */
export function projectGeometry(geom: any, matrix: any, projection: any, position: any, flippedMesh: any): any;
/** @summary Returns number of faces for provided geometry
  * @param geom  - can be BufferGeometry, CsgGeometry or interim array of polygons
  * @private */
export function countGeometryFaces(geom: any): any;
/** @summary Creates frustum
  * @private */
export function createFrustum(source: any): any;
/** @summary Creates projection matrix for the camera
  * @private */
export function createProjectionMatrix(camera: any): any;
/** @summary extract code of Box3.expandByObject
  * @desc Major difference - do not traverse hierarchy
  * @private */
export function getBoundingBox(node: any, box3: any, local_coordinates: any): any;
/** @summary Provides info about geo object, used for tooltip info
  * @param {Object} obj - any kind of TGeo-related object like shape or node or volume
  * @private */
export function provideObjectInfo(obj: any): any;
