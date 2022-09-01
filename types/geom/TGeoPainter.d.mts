import { ClonedNodes } from "./geobase.mjs";
/** @summary Build three.js model for given geometry object
  * @param {Object} obj - TGeo-related object
  * @param {Object} [opt] - options
  * @param {Number} [opt.vislevel] - visibility level like TGeoManager, when not specified - show all
  * @param {Number} [opt.numnodes=1000] - maximal number of visible nodes
  * @param {Number} [opt.numfaces=100000] - approx maximal number of created triangles
  * @param {boolean} [opt.doubleside=false] - use double-side material
  * @param {boolean} [opt.wireframe=false] - show wireframe for created shapes
  * @param {boolean} [opt.dflt_colors=false] - use default ROOT colors
  * @returns {object} Object3D with created model
  * @example
  * import { build } from './path_to_jsroot/modules/geom/TGeoPainter.mjs';
  * let obj3d = build(obj);
  * // this is three.js object and can be now inserted in the scene
  */
export function build(obj: any, opt?: {
    vislevel?: number;
    numnodes?: number;
    numfaces?: number;
    doubleside?: boolean;
    wireframe?: boolean;
    dflt_colors?: boolean;
}): object;
/**
 * @summary Painter class for geometries drawing
 *
 * @private
 */
export class TGeoPainter extends ObjectPainter {
    /** @summary draw TGeo object */
    static draw(dom: any, obj: any, opt: any): Promise<any>;
    /** @summary Constructor
      * @param {object|string} dom - DOM element for drawing or element id
      * @param {object} obj - supported TGeo object */
    constructor(dom: object | string, obj: object);
    geo_manager: any;
    no_default_title: boolean;
    mode3d: boolean;
    drawing_stage: number;
    drawing_log: string;
    ctrl: {
        clipIntersect: boolean;
        clip: {
            name: string;
            enabled: boolean;
            value: number;
            min: number;
            max: number;
        }[];
        ssao: {
            enabled: boolean;
            output: any;
            kernelRadius: number;
            minDistance: number;
            maxDistance: number;
        };
        bloom: {
            enabled: boolean;
            strength: number;
        };
        info: {
            num_meshes: number;
            num_faces: number;
            num_shapes: number;
        };
        highlight: boolean;
        highlight_scene: boolean;
        depthTest: boolean;
        depthMethod: string;
        select_in_view: boolean;
        update_browser: boolean;
        light: {
            kind: string;
            top: boolean;
            bottom: boolean;
            left: boolean;
            right: boolean;
            front: boolean;
            specular: boolean;
            power: number;
        };
        trans_radial: number;
        trans_z: number;
    };
    /** @summary Change drawing stage
      * @private */
    private changeStage;
    /** @summary Check drawing stage */
    isStage(value: any): boolean;
    /** @summary Create toolbar */
    createToolbar(): void;
    _toolbar: Toolbar;
    /** @summary Initialize VR mode */
    initVRMode(): void;
    _dolly: any;
    _standingMatrix: any;
    _raycasterEnd: any;
    _raycasterOrigin: any;
    _vrDisplay: any;
    /** @summary Init VR controllers geometry
      * @private */
    private initVRControllersGeometry;
    _controllersMeshes: any[];
    /** @summary Update VR controllers list
      * @private */
    private updateVRControllersList;
    _vrControllers: any[];
    /** @summary Process VR controller intersection
      * @private */
    private processVRControllerIntersections;
    /** @summary Update VR controllers
      * @private */
    private updateVRControllers;
    /** @summary Toggle VR mode
      * @private */
    private toggleVRMode;
    _previousCameraPosition: any;
    _previousCameraRotation: any;
    _previousCameraNear: any;
    /** @summary Exit VR mode
      * @private */
    private exitVRMode;
    /** @summary Returns main geometry object */
    getGeometry(): any;
    /** @summary Modify visibility of provided node by name */
    modifyVisisbility(name: any, sign: any): void;
    /** @summary Decode drawing options */
    decodeOptions(opt: any): {
        _grid: boolean;
        _bound: boolean;
        _debug: boolean;
        _full: boolean;
        _axis: number;
        _count: boolean;
        wireframe: boolean;
        scale: any;
        zoom: number;
        rotatey: number;
        rotatez: number;
        more: number;
        maxlimit: number;
        vislevel: any;
        maxnodes: any;
        dflt_colors: boolean;
        use_worker: boolean;
        show_controls: boolean;
        highlight: boolean;
        highlight_scene: boolean;
        no_screen: boolean;
        project: string;
        is_main: boolean;
        tracks: boolean;
        showtop: boolean;
        can_rotate: boolean;
        ortho_camera: boolean;
        clipx: boolean;
        clipy: boolean;
        clipz: boolean;
        usessao: boolean;
        usebloom: boolean;
        outline: boolean;
        script_name: string;
        transparency: number;
        rotate: boolean;
        background: string;
        depthMethod: string;
        mouse_tmout: number;
        trans_radial: number;
        trans_z: number;
    };
    /** @summary Activate specified items in the browser */
    activateInBrowser(names: any, force: any): void;
    /** @summary  method used to check matrix calculations performance with current three.js model */
    testMatrixes(): void;
    /** @summary Fills context menu */
    fillContextMenu(menu: any): void;
    /** @summary Method used to set transparency for all geometrical shapes
      * @param {number|Function} transparency - one could provide function
      * @param {boolean} [skip_render] - if specified, do not perform rendering */
    changedGlobalTransparency(transparency: number | Function, skip_render?: boolean): void;
    /** @summary Reset transformation */
    resetTransformation(): void;
    /** @summary Method should be called when transformation parameters were changed */
    changedTransformation(arg: any): void;
    /** @summary Should be called when autorotate property changed */
    changedAutoRotate(): void;
    /** @summary Method should be called when changing axes drawing */
    changedAxes(): void;
    /** @summary Method should be called to change background color */
    changedBackground(val: any): void;
    /** @summary Method called when SSAO configuration changed via GUI */
    changedSSAO(): void;
    /** @summary Display control GUI */
    showControlOptions(on: any): void;
    /** @summary build dat.gui elements
      * @private */
    private buildDatGui;
    _datgui: any;
    /** @summary Method called when bloom configuration changed via GUI */
    changedBloomSettings(): void;
    /** @summary Handle change of camera kind */
    changeCamera(): void;
    _first_drawing: boolean;
    /** @summary create bloom effect */
    createBloom(): void;
    _bloomComposer: any;
    _bloomPass: any;
    /** @summary Remove bloom highlight */
    removeBloom(): void;
    /** @summary Remove composer */
    removeSSAO(): void;
    /** @summary create SSAO */
    createSSAO(): void;
    _effectComposer: any;
    _ssaoPass: any;
    /** @summary Show context menu for orbit control
      * @private */
    private orbitContext;
    /** @summary Filter some objects from three.js intersects array */
    filterIntersects(intersects: any): any;
    /** @summary test camera position
      * @desc function analyzes camera position and start redraw of geometry
      *  if objects in view may be changed */
    testCameraPositionChange(): void;
    /** @summary Resolve stack */
    resolveStack(stack: any): any;
    /** @summary Returns stack full name
      * @desc Includes item name of top geo object */
    getStackFullName(stack: any): any;
    /** @summary Add handler which will be called when element is highlighted in geometry drawing
      * @desc Handler should have highlightMesh function with same arguments as TGeoPainter  */
    addHighlightHandler(handler: any): void;
    _highlight_handlers: any[];
    /** @summary perform mesh highlight */
    highlightMesh(active_mesh: any, color: any, geo_object: any, geo_index: any, geo_stack: any, no_recursive: any): boolean;
    _selected_mesh: any;
    /** @summary handle mouse click event */
    processMouseClick(pnt: any, intersects: any, evnt: any): void;
    /** @summary Configure mouse delay, required for complex geometries */
    setMouseTmout(val: any): void;
    /** @summary Configure depth method, used for render order production.
      * @param {string} method - Allowed values: "ray", "box","pnt", "size", "dflt" */
    setDepthMethod(method: string): void;
    /** @summary Add orbit control */
    addOrbitControls(): void;
    _controls: any;
    /** @summary add transformation control */
    addTransformControl(): void;
    _tcontrols: any;
    /** @summary Main function in geometry creation loop
      * @desc Returns:
      * - false when nothing todo
      * - true if one could perform next action immediately
      * - 1 when call after short timeout required
      * - 2 when call must be done from processWorkerReply */
    nextDrawAction(): boolean | 1 | 2;
    _draw_all_nodes: any;
    _current_face_limit: any;
    _new_draw_nodes: any;
    _draw_nodes: any;
    _build_shapes: any;
    /** @summary Insert appropriate mesh for given entry */
    createEntryMesh(entry: any, shape: any, toplevel: any): boolean;
    /** @summary used by geometry viewer to show more nodes
      * @desc These nodes excluded from selection logic and always inserted into the model
      * Shape already should be created and assigned to the node */
    appendMoreNodes(nodes: any, from_drawing: any): void;
    _provided_more_nodes: any;
    _more_nodes: any[];
    /** @summary Returns hierarchy of 3D objects used to produce projection.
      * @desc Typically external master painter is used, but also internal data can be used */
    getProjectionSource(): any;
    /** @summary Calculate geometry bounding box */
    getGeomBoundingBox(topitem: any, scalar: any): any;
    /** @summary Create geometry projection */
    doProjection(): boolean;
    /** @summary Should be invoked when light configuration changed */
    changedLight(box: any): void;
    /** @summary Create configured camera */
    createCamera(): void;
    _camera: any;
    /** @summary Create special effects */
    createSpecialEffects(): void;
    /** @summary Initial scene creation */
    createScene(w: any, h: any): Promise<any>;
    _scene: any;
    _scene_width: any;
    _scene_height: any;
    _overall_size: number;
    _toplevel: any;
    _renderer: any;
    _webgl: boolean;
    _animating: boolean;
    _clipPlanes: any[];
    /** @summary Start geometry drawing */
    startDrawGeometry(force: any): void;
    _draw_nodes_again: boolean;
    _startm: number;
    _last_render_tm: number;
    _last_render_meshes: number;
    _drawing_ready: boolean;
    _full_geom: any;
    /** @summary reset all kind of advanced features like SSAO or depth test changes */
    resetAdvanced(): void;
    /** @summary returns maximal dimension */
    getOverallSize(force: any): number;
    /** @summary Create png image with drawing snapshot. */
    createSnapshot(filename: any): any;
    /** @summary Returns url parameters defining camera position.
      * @desc It is zoom, roty, rotz parameters
      * These parameters applied from default position which is shift along X axis */
    produceCameraUrl(prec: any): string;
    /** @summary Calculates current zoom factor */
    calculateZoom(): number;
    /** @summary Place camera to default position */
    adjustCameraPosition(first_time: any, keep_zoom: any): void;
    _lookat: any;
    _camera0pos: any;
    /** @summary Specifies camera position */
    setCameraPosition(rotatey: any, rotatez: any, zoom: any): void;
    /** @summary focus on item */
    focusOnItem(itemname: any): void;
    /** @summary focus camera on speicifed position */
    focusCamera(focus: any, autoClip: any): void;
    /** @summary actiavte auto rotate */
    autorotate(speed: any): void;
    /** @summary called at the end of scene drawing */
    completeScene(): void;
    /** @summary Drawing with "count" option
      * @desc Scans hieararchy and check for unique nodes
      * @returns {Promise} with object drawing ready */
    drawCount(unqievis: any, clonetm: any): Promise<any>;
    /** @summary Handle drop operation
      * @desc opt parameter can include function name like opt$func_name
      * Such function should be possible to find via {@link findFunction}
      * Function has to return Promise with objects to draw on geometry
      * By default function with name "extract_geo_tracks" is checked
      * @returns {Promise} handling of drop operation */
    performDrop(obj: any, itemname: any, hitem: any, opt: any): Promise<any>;
    /** @summary function called when mouse is going over the item in the browser */
    mouseOverHierarchy(on: any, itemname: any, hitem: any): void;
    /** @summary clear extra drawn objects like tracks or hits */
    clearExtras(): void;
    /** @summary Register extra objects like tracks or hits
     * @desc Rendered after main geometry volumes are created
     * Check if object already exists to prevent duplication */
    addExtra(obj: any, itemname: any): boolean;
    _extraObjects: any;
    /** @summary manipulate visisbility of extra objects, used for HierarhcyPainter
      * @private */
    private extraObjectVisible;
    /** @summary Draw extra object like tracks
      * @returns {Promise} for ready */
    drawExtras(obj: any, itemname: any, add_objects: any): Promise<any>;
    /** @summary returns container for extra objects */
    getExtrasContainer(action: any, name: any): any;
    /** @summary add object to extras container.
      * @desc If fail, dispore object */
    addToExtrasContainer(obj: any, name: any): void;
    /** @summary drawing TGeoTrack */
    drawGeoTrack(track: any, itemname: any): boolean;
    /** @summary drawing TPolyLine3D */
    drawPolyLine(line: any, itemname: any): boolean;
    /** @summary Drawing TEveTrack */
    drawEveTrack(track: any, itemname: any): boolean;
    /** @summary Drawing different hits types like TPolyMarker3D */
    drawHit(hit: any, itemname: any): any;
    /** @summary Draw extra shape on the geometry */
    drawExtraShape(obj: any, itemname: any): boolean;
    /** @summary Serach for specified node
      * @private */
    private findNodeWithVolume;
    /** @summary Process script option - load and execute some gGeoManager-related calls */
    loadMacro(script_name: any): Promise<{
        obj: any;
        prefix: string;
    }>;
    /** @summary Assign clones, created outside.
      * @desc Used by geometry painter, where clones are handled by the server */
    assignClones(clones: any): void;
    _clones_owner: boolean;
    _clones: any;
    /** @summary Prepare drawings
      * @desc Return value used as promise for painter */
    prepareObjectDraw(draw_obj: any, name_prefix: any): Promise<any>;
    _new_append_nodes: any;
    _geom_viewer: boolean;
    _start_drawing_time: number;
    _on_pad: boolean;
    _fit_main_area: boolean;
    _resolveFunc: (value: any) => void;
    /** @summary methods show info when first geometry drawing is performed */
    showDrawInfo(msg: any): void;
    /** @summary Reentrant method to perform geometry drawing step by step */
    continueDraw(): NodeJS.Timeout;
    /** @summary Checks camera position and recalculate rendering order if needed
      * @param force - if specified, forces calculations of render order */
    testCameraPosition(force: any): void;
    _last_camera_position: any;
    /** @summary Call 3D rendering of the geometry
      * @param tmout - specifies delay, after which actual rendering will be invoked
      * @param [measure] - when true, for the first time printout rendering time
      * @returns {Promise} when tmout bigger than 0 is specified
      * @desc Timeout used to avoid multiple rendering of the picture when several 3D drawings
      * superimposed with each other. If tmeout<=0, rendering performed immediately
      * Several special values are used:
      *   -1    - force recheck of rendering order based on camera position */
    render3D(tmout: any, measure?: any): Promise<any>;
    _render_resolveFuncs: any[];
    render_tmout: NodeJS.Timeout;
    last_render_tm: number;
    first_render_tm: number;
    /** @summary Start geo worker */
    startWorker(): void;
    _worker_ready: boolean;
    _worker_jobs: number;
    _worker: Worker;
    /** @summary check if one can submit request to worker
      * @private */
    private canSubmitToWorker;
    /** @summary submit request to worker
      * @private */
    private submitToWorker;
    /** @summary process reply from worker
      * @private */
    private processWorkerReply;
    /** @summary start draw geometries on master and all slaves
      * @private */
    private testGeomChanges;
    /** @summary Draw axes if configured, otherwise just remove completely
      * @returns {Promise} when norender not specified */
    drawSimpleAxis(norender: any): Promise<any>;
    /** @summary Set axes visibility 0 - off, 1 - on, 2 - centered */
    setAxesDraw(on: any): Promise<any>;
    /** @summary Set auto rotate mode */
    setAutoRotate(on: any): void;
    /** @summary Toggle wireframe mode */
    toggleWireFrame(): void;
    /** @summary Specify wireframe mode */
    setWireFrame(on: any): void;
    /** @summary Specify showtop draw options, relevant only for TGeoManager */
    setShowTop(on: any): void;
    /** @summary Should be called when configuration of particular axis is changed */
    changedClipping(naxis: any): void;
    /** @summary Should be called when depth test flag is changed */
    changedDepthTest(): void;
    /** @summary Should be called when depth method is changed */
    changedDepthMethod(arg: any): Promise<any>;
    /** @summary Should be called when configuration of highlight is changed */
    changedHighlight(): void;
    /** @summary Assign clipping attributes to the meshes - supported only for webgl */
    updateClipping(without_render: any, force_traverse: any): boolean;
    _clipCfg: any;
    /** @summary Assign callback, invoked every time when drawing is completed
      * @desc Used together with web-based geometry viewer
      * @private */
    private setCompleteHandler;
    _complete_handler: any;
    /** @summary Completes drawing procedure
      * @returns {Promise} for ready */
    completeDraw(close_progress: any): Promise<any>;
    _full_redrawing: boolean;
    /** @summary Returns true if geometry drawing is completed */
    isDrawingReady(): boolean;
    /** @summary Remove already drawn node. Used by geom viewer */
    removeDrawnNode(nodeid: any): void;
    /** @summary Cleanup geometry painter */
    cleanup(first_time: any): void;
    did_cleanup: boolean;
    _slave_painters: any[];
    /** @summary show message in progress area
      * @private */
    private helpText;
    /** @summary perform resize */
    performResize(width: any, height: any): boolean;
    /** @summary Toggle enlarge state */
    toggleEnlarge(): void;
    /** @summary check if element belongs to trnasform control
      * @private */
    private ownedByTransformControls;
    /** @summary either change mesh wireframe or return current value
      * @returns undefined when wireframe cannot be accessed
      * @private */
    private accessObjectWireFrame;
    /** @summary handle wireframe flag change in GUI
      * @private */
    private changedWireFrame;
    /** @summary Update object in geo painter */
    updateObject(obj: any): boolean;
    /** @summary Cleanup TGeo drawings */
    clearDrawings(): void;
    /** @summary Redraw TGeo object inside TPad */
    redraw(): boolean;
    /** @summary Redraw TGeo object */
    redrawObject(obj: any): false | Promise<any>;
}
/**
  * @summary geometry drawing control
  *
  * @private
  */
export class GeoDrawingControl extends InteractiveControl {
    constructor(mesh: any, bloom: any);
    mesh: any;
    bloom: any;
    /** @summary set highlight */
    setHighlight(col: any, indx: any): boolean;
    /** @summary draw special */
    drawSpecial(col: any): boolean;
}
/** @summary Expand geo object
  * @private */
export function expandGeoObject(parent: any, obj: any): boolean;
/** @summary Create geo painter
  * @private */
export function createGeoPainter(dom: any, obj: any, opt: any): TGeoPainter;
/** @summary Direct draw function for TAxis3D
  * @private */
export function drawAxis3D(): any;
/** @summary Draw dummy geometry
  * @private */
export function drawDummy3DGeom(painter: any): Promise<any>;
import { produceRenderOrder } from "./geobase.mjs";
import { ObjectPainter } from "../base/ObjectPainter.mjs";
/**
  * @summary Toolbar for geometry painter
  *
  * @private
  */
declare class Toolbar {
    /** @summary constructor */
    constructor(container: any, bright: any);
    bright: any;
    element: any;
    /** @summary add buttons */
    addButtons(buttons: any): void;
    buttonsNames: any[];
    /** @summary change brightness */
    changeBrightness(bright: any): void;
    /** @summary cleanup toolbar */
    cleanup(): void;
}
import { InteractiveControl } from "../base/base3d.mjs";
export { ClonedNodes, produceRenderOrder };
