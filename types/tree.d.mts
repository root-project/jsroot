export const kClonesNode: 3;
export const kSTLNode: 4;
/**
 * @summary Class to read data from TTree
 *
 * @desc Instance of TSelector can be used to access TTree data
 */
export class TSelector {
    _branches: any[];
    _names: any[];
    _directs: any[];
    _break: number;
    tgtobj: {};
    /** @summary Add branch to the selector
     * @desc Either branch name or branch itself should be specified
     * Second parameter defines member name in the tgtobj
     * If selector.addBranch("px", "read_px") is called,
     * branch will be read into selector.tgtobj.read_px member
     * If second parameter not specified, branch name (here "px") will be used
     * If branch object specified as first parameter and second parameter missing,
     * then member like "br0", "br1" and so on will be assigned
     * @param {string|Object} branch - name of branch (or branch object itself}
     * @param {string} [name] - member name in tgtobj where data will be read
     * @param {boolean} [direct] - if only branch without any children should be read */
    addBranch(branch: string | any, name?: string, direct?: boolean): number;
    /** @summary returns number of branches used in selector */
    numBranches(): number;
    /** @summary returns branch by index used in selector */
    getBranch(indx: any): any;
    /** @summary returns index of branch
      * @private */
    private indexOfBranch;
    /** @summary returns name of branch
      * @private */
    private nameOfBranch;
    /** @summary function called during TTree processing
     * @abstract
     * @param {number} progress - current value between 0 and 1 */
    ShowProgress(): void;
    /** @summary call this function to abort processing */
    Abort(): void;
    /** @summary function called before start processing
     * @abstract
     * @param {object} tree - tree object */
    Begin(): void;
    /** @summary function called when next entry extracted from the tree
     * @abstract
     * @param {number} entry - read entry number */
    Process(): void;
    /** @summary function called at the very end of processing
     * @abstract
     * @param {boolean} res - true if all data were correctly processed */
    Terminate(): void;
}
/**
 * @summary object with single variable in TTree::Draw expression
 *
 * @private
 */
export class TDrawVariable {
    /** @summary constructor */
    constructor(globals: any);
    globals: any;
    code: string;
    brindex: any[];
    branches: any[];
    brarray: any[];
    func: Function;
    kind: string;
    buf: any[];
    /** @summary Parse variable
      * @desc when only_branch specified, its placed in the front of the expression */
    parse(tree: any, selector: any, code: any, only_branch: any, branch_mode: any): boolean;
    direct_branch: boolean;
    /** @summary Check if it is dummy variable */
    is_dummy(): boolean;
    /** @summary Produce variable
      * @desc after reading tree braches into the object, calculate variable value */
    produce(obj: any): void;
    length: number;
    isarray: boolean;
    value: any;
    /** @summary Get variable */
    get(indx: any): any;
    /** @summary Append array to the buffer */
    appendArray(tgtarr: any): void;
}
/**
 * @summary Selector class for TTree::Draw function
 *
 * @private
 */
export class TDrawSelector extends TSelector {
    ndim: number;
    vars: any[];
    cut: TDrawVariable;
    hist: any;
    histo_drawopt: string;
    hist_name: string;
    hist_title: string;
    graph: boolean;
    hist_args: any[];
    arr_limit: number;
    htype: string;
    monitoring: number;
    globals: {};
    last_progress: number;
    aver_diff: number;
    /** @summary Set draw selector callbacks */
    setCallback(result_callback: any, progress_callback: any): void;
    result_callback: any;
    progress_callback: any;
    /** @summary Parse parameters */
    parseParameters(tree: any, args: any, expr: any): any;
    hist_nbins: number;
    dump_values: boolean;
    /** @summary Parse draw expression */
    parseDrawExpression(tree: any, args: any): boolean;
    ProcessArrays: () => void;
    /** @summary Draw only specified branch */
    drawOnlyBranch(tree: any, branch: any, expr: any, args: any): boolean;
    leaf: any;
    copy_fields: boolean;
    /** @summary Normal TSelector Process handler */
    Process(entry: any): void;
    /** @summary Begin processing */
    Begin(tree: any): void;
    lasttm: number;
    /** @summary Get bins for bits histogram */
    getBitsBins(nbits: any, res: any): any;
    /** @summary Get min.max bins */
    getMinMaxBins(axisid: any, nbins: any): any;
    /** @summary Fill 1D histogram */
    fill1DHistogram(xvalue: any, weight: any): void;
    /** @summary Create histogram */
    createHistogram(): void;
    /** @summary Fill 2D histogram */
    fill2DHistogram(xvalue: any, yvalue: any, weight: any): void;
    /** @summary Fill 3D histogram */
    fill3DHistogram(xvalue: any, yvalue: any, zvalue: any, weight: any): void;
    x: any;
    y: any;
    z: any;
    /** @summary Fill TBits histogram */
    fillTBitsHistogram(xvalue: any, weight: any): void;
    /** @summary Fill bits histogram */
    FillBitsHistogram(xvalue: any, weight: any): void;
    /** @summary Dump values */
    dumpValues(v1: any, v2: any, v3: any, v4: any): void;
    /** @summary function used when all branches can be read as array
      * @desc most typical usage - histogramming of single branch */
    ProcessArraysFunc(): void;
    /** @summary simple dump of the branch - no need to analyze something */
    ProcessDump(): void;
    /** @summary Normal TSelector Terminate handler */
    Terminate(res: any): void;
}
/** @summary Create hierarchy of TTree object
  * @private */
export function treeHierarchy(node: any, obj: any): boolean;
/** @summary Process selector for the tree
  * @desc function similar to the TTree::Process
  * @param {object} tree - instance of TTree class
  * @param {object} selector - instance of {@link TSelector} class
  * @param {object} [args] - different arguments
  * @param {number} [args.firstentry] - first entry to process, 0 when not specified
  * @param {number} [args.numentries] - number of entries to process, all when not specified
  * @returns {Promise} with TSelector instance */
export function treeProcess(tree: object, selector: object, args?: {
    firstentry?: number;
    numentries?: number;
}): Promise<any>;
/** @summary implementation of TTree::Draw
  * @param {object|string} args - different setting or simply draw expression
  * @param {string} args.expr - draw expression
  * @param {string} [args.cut=undefined]   - cut expression (also can be part of 'expr' after '::')
  * @param {string} [args.drawopt=undefined] - draw options for result histogram
  * @param {number} [args.firstentry=0] - first entry to process
  * @param {number} [args.numentries=undefined] - number of entries to process, all by default
  * @param {object} [args.branch=undefined] - TBranch object from TTree itself for the direct drawing
  * @param {function} [args.progress=undefined] - function called during histogram accumulation with argument { obj: draw_object, opt: draw_options }
  * @returns {Promise} with object like { obj: draw_object, opt: draw_options } */
export function treeDraw(tree: any, args: object | string): Promise<any>;
/** @summary Performs generic I/O test for all branches in the TTree
  * @desc Used when "testio" draw option for TTree is specified
  * @private */
export function treeIOTest(tree: any, args: any): any;
