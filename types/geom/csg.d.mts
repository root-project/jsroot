export function createBufferGeometry(polygons: any): any;
/** @summary create geometry to make cut on specified axis
  * @private */
export function createNormal(axis_name: any, pos: any, size: any): Geometry;
export class Vertex {
    constructor(x: any, y: any, z: any, nx: any, ny: any, nz: any);
    x: any;
    y: any;
    z: any;
    nx: any;
    ny: any;
    nz: any;
    setnormal(nx: any, ny: any, nz: any): void;
    clone(): Vertex;
    add(vertex: any): Vertex;
    subtract(vertex: any): Vertex;
    multiplyScalar(scalar: any): Vertex;
    cross(vertex: any): Vertex;
    normalize(): Vertex;
    dot(vertex: any): number;
    diff(vertex: any): number;
    interpolate(a: any, t: any): Vertex;
    applyMatrix4(m: any): Vertex;
}
export class Geometry {
    constructor(geometry: any, transfer_matrix: any, nodeid: any, flippedMesh: any);
    matrix: any;
    tree: Node;
    maxid: any;
    subtract(other_tree: any): Node;
    union(other_tree: any): Node;
    intersect(other_tree: any): Node;
    tryToCompress(polygons: any): void;
    direct_subtract(other_tree: any): Geometry;
    direct_union(other_tree: any): Geometry;
    direct_intersect(other_tree: any): Geometry;
    cut_from_plane(other_tree: any): Geometry;
    scale(x: any, y: any, z: any): void;
    toPolygons(): any;
    toBufferGeometry(): any;
    toMesh(material: any): any;
}
export class Polygon {
    constructor(vertices: any);
    vertices: any;
    nsign: number;
    copyProperties(parent: any, more: any): Polygon;
    normal: any;
    w: any;
    id: any;
    parent: any;
    calculateProperties(): Polygon;
    clone(): Polygon;
    flip(): Polygon;
    classifyVertex(vertex: any): 1 | 0 | 2;
    classifySide(polygon: any): 1 | 0 | 2 | 3;
    splitPolygon(polygon: any, coplanar_front: any, coplanar_back: any, front: any, back: any): void;
}
declare class Node {
    constructor(polygons: any, nodeid: any);
    polygons: any[];
    front: Node;
    back: Node;
    divider: any;
    maxnodeid: any;
    isConvex(polygons: any): boolean;
    build(polygons: any): void;
    collectPolygons(arr: any): any;
    allPolygons(): any[];
    numPolygons(): number;
    clone(): Node;
    invert(): Node;
    clipPolygons(polygons: any): any;
    clipTo(node: any): void;
}
export {};
