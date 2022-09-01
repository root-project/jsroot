/** @summary Assigns method to handle 3D drawings inside SVG
  * @private */
export function assign3DHandler(painter: any): void;
/** @summary Method cleanup three.js object as much as possible.
  * @desc Simplify JS engine to remove it from memory
  * @private */
export function disposeThreejsObject(obj: any, only_childs: any): void;
/** @summary Create OrbitControls for painter
  * @private */
export function createOrbitControl(painter: any, camera: any, scene: any, renderer: any, lookat: any): any;
/** @summary Create LineSegments mesh (or only geometry)
  * @desc If required, calculates lineDistance attribute for dashed geometries
  * @private */
export function createLineSegments(arr: any, material: any, index?: any, only_geometry?: boolean): any;
/** @summary Create material for 3D line
  * @desc Takes into account dashed properties
  * @private */
export function create3DLineMaterial(painter: any, arg: any, is_v7?: boolean): any;
export namespace Box3D {
    const MeshSegments: Int32Array;
}
/** @summary Creates renderer for the 3D drawings
  * @param {value} width - rendering width
  * @param {value} height - rendering height
  * @param {value} render3d - render type, see {@link constants.Render3D}
  * @param {object} args - different arguments for creating 3D renderer
  * @returns {Promise} with renderer object
  * @private */
export function createRender3D(width: value, height: value, render3d: value, args: object): Promise<any>;
/** @summary Cleanup previous renderings before doing next one
  * @desc used together with SVG
  * @private */
export function beforeRender3D(renderer: any): void;
/** @summary Post-process result of rendering
  * @desc used together with SVG or node.js image rendering
  * @private */
export function afterRender3D(renderer: any): void;
/** @ummary Define rendering kind which will be used for rendering of 3D elements
 * @param {value} [render3d] - preconfigured value, will be used if applicable
 * @returns {value} - rendering kind, see constants.Render3D
 * @private */
export function getRender3DKind(render3d?: value): value;
/** @summary Cleanup created renderer object
  * @private */
export function cleanupRender3D(renderer: any): void;
export const HelveticerRegularFont: any;
/**
 * @summary Abstract interactive control interface for 3D objects
 *
 * @abstract
 * @private
 */
export class InteractiveControl {
    cleanup(): void;
    extractIndex(): void;
    setSelected(): void;
    setHighlight(): void;
    checkHighlightIndex(): void;
}
/**
 * @summary Special class to control highliht and selection of single points, used in geo painter
 *
 * @private
 */
export class PointsControl extends InteractiveControl {
    /** @summary constructor
      * @param {object} mesh - draw object */
    constructor(mesh: object);
    mesh: any;
    /** @summary extract intersect index */
    extractIndex(intersect: any): any;
    /** @summary set selection */
    setSelected(col: any, indx: any): boolean;
    /** @summary set highlight */
    setHighlight(col: any, indx: any): boolean;
    /** @summary create special object */
    createSpecial(color: any, index: any): void;
}
/**
 * @summary Class for creation of 3D points
 *
 * @private
 */
export class PointsCreator {
    /** @summary constructor
      * @param {number} size - number of points
      * @param {booleand} [iswebgl=true] - if WebGL is used
      * @param {number} [scale=1] - scale factor */
    constructor(size: number, iswebgl?: booleand, scale?: number);
    webgl: any;
    scale: number;
    pos: Float32Array;
    geom: any;
    indx: number;
    /** @summary Add point */
    addPoint(x: any, y: any, z: any): void;
    /** @summary Create points */
    createPoints(args: any): any;
}
export function createSVGRenderer(as_is: any, precision: any, doc: any): any;
