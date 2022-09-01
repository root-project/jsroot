import { getHPainter } from "./display.mjs";
/**
  * @summary Painter of hierarchical structures
  *
  * @example
  * // create hierarchy painter in "myTreeDiv"
  * let h = new HierarchyPainter("example", "myTreeDiv");
  * // configure 'simple' layout in "myMainDiv"
  * // one also can specify "grid2x2" or "flex" or "tabs"
  * h.setDisplay("simple", "myMainDiv");
  * // open file and display element
  * h.openRootFile("https://root.cern/js/files/hsimple.root").then(() => h.display("hpxpy;1","colz")); */
export class HierarchyPainter extends BasePainter {
    /** @summary Create painter
      * @param {string} name - symbolic name
      * @param {string} frameid - element id where hierarchy is drawn
      * @param {string} [backgr] - background color */
    constructor(name: string, frameid: string, backgr?: string);
    name: string;
    h: any;
    with_icons: boolean;
    background: string;
    textcolor: string;
    files_monitoring: boolean;
    nobrowser: boolean;
    /** @summary Cleanup hierarchy painter
      * @desc clear drawing and browser */
    cleanup(): void;
    /** @summary Create file hierarchy
      * @private */
    private fileHierarchy;
    /** @summary Iterate over all items in hierarchy
      * @param {function} func - function called for every item
      * @param {object} [top] - top item to start from
      * @private */
    private forEachItem;
    /** @summary Search item in the hierarchy
      * @param {object|string} arg - item name or object with arguments
      * @param {string} arg.name -  item to search
      * @param {boolean} [arg.force] - specified elements will be created when not exists
      * @param {boolean} [arg.last_exists] -  when specified last parent element will be returned
      * @param {boolean} [arg.check_keys] - check TFile keys with cycle suffix
      * @param {boolean} [arg.allow_index] - let use sub-item indexes instead of name
      * @param {object} [arg.top] - element to start search from
      * @private */
    private findItem;
    /** @summary Produce full string name for item
      * @param {Object} node - item element
      * @param {Object} [uptoparent] - up to which parent to continue
      * @param {boolean} [compact] - if specified, top parent is not included
      * @returns {string} produced name
      * @private */
    private itemFullName;
    /** @summary Executes item marked as 'Command'
      * @desc If command requires additional arguments, they could be specified as extra arguments arg1, arg2, ...
      * @param {String} itemname - name of command item
      * @param {Object} [elem] - HTML element for command execution
      * @param [arg1] - first optional argument
      * @param [arg2] - second optional argument and so on
      * @returns {Promise} with command result */
    executeCommand(itemname: string, elem?: any, ...args: any[]): Promise<any>;
    /** @summary Get object item with specified name
      * @desc depending from provided option, same item can generate different object types
      * @param {Object} arg - item name or config object
      * @param {string} arg.name - item name
      * @param {Object} arg.item - or item itself
      * @param {string} options - supposed draw options
      * @returns {Promise} with object like { item, obj, itemname }
      * @private */
    private getObject;
    /** @summary returns true if item is last in parent childs list
      * @private */
    private isLastSibling;
    /** @summary Create item html code
      * @private */
    private addItemHtml;
    /** @summary Toggle open state of the item
      * @desc Used with "open all" / "close all" buttons in normal GUI
      * @param {boolean} isopen - if items should be expand or closed
      * @returns {boolean} true when any item was changed */
    toggleOpenState(isopen: boolean, h: any): boolean;
    /** @summary Refresh HTML code of hierarchy painter
      * @returns {Promise} when done */
    refreshHtml(): Promise<any>;
    /** @summary Update item node
      * @private */
    private updateTreeNode;
    /** @summary Update item background
      * @private */
    private updateBackground;
    /** @summary Focus on hierarchy item
      * @param {Object|string} hitem - item to open or its name
      * @desc all parents to the otem will be opened first
      * @returns {Promise} when done
      * @private */
    private focusOnItem;
    /** @summary Handler for click event of item in the hierarchy
      * @private */
    private tree_click;
    /** @summary Handler for mouse-over event
      * @private */
    private tree_mouseover;
    /** @summary alternative context menu, used in the object inspector
      * @private */
    private direct_contextmenu;
    /** @summary Fills settings menu items
      * @private */
    private fillSettingsMenu;
    /** @summary Toggle dark mode
      * @private */
    private toggleDarkMode;
    /** @summary Handle context menu in the hieararchy
      * @private */
    private tree_contextmenu;
    /** @summary Starts player for specified item
      * @desc Same as "Player" context menu
      * @param {string} itemname - item name for which player should be started
      * @param {string} [option] - extra options for the player
      * @returns {Promise} when ready*/
    player(itemname: string, option?: string): Promise<any>;
    /** @summary Checks if item can be displayed with given draw option
      * @private */
    private canDisplay;
    /** @summary Returns true if given item displayed
      * @param {string} itemname - item name */
    isItemDisplayed(itemname: string): boolean;
    /** @summary Display specified item
      * @param {string} itemname - item name
      * @param {string} [drawopt] - draw option for the item
      * @param {boolean} [interactive] - if display was called in interactive mode, will activate selected drawing
      * @returns {Promise} with created painter object */
    display(itemname: string, drawopt?: string, interactive?: boolean): Promise<any>;
    /** @summary Enable drag of the element
      * @private  */
    private enableDrag;
    /** @summary Enable drop on the frame
      * @private  */
    private enableDrop;
    /** @summary Remove all drop handlers on the frame
      * @private  */
    private clearDrop;
    /** @summary Drop item on specified element for drawing
      * @returns {Promise} when completed
      * @private */
    private dropItem;
    /** @summary Update specified items
      * @desc Method can be used to fetch new objects and update all existing drawings
      * @param {string|array|boolean} arg - either item name or array of items names to update or true if only automatic items will be updated
      * @returns {Promise} when ready */
    updateItems(arg: string | any[] | boolean): Promise<any>;
    /** @summary Display all provided elements
      * @returns {Promise} when drawing finished
      * @private */
    private displayItems;
    /** @summary Reload hierarchy and refresh html code
      * @returns {Promise} when completed */
    reload(): Promise<any>;
    /** @summary activate (select) specified item
      * @param {Array} items - array of items names
      * @param {boolean} [force] - if specified, all required sub-levels will be opened
      * @private */
    private activateItems;
    /** @summary Check if item can be (potentially) expand
      * @private */
    private canExpandItem;
    /** @summary expand specified item
      * @param {String} itemname - item name
      * @returns {Promise} when ready */
    expandItem(itemname: string, d3cont: any, silent: any): Promise<any>;
    /** @summary Return main online item
      * @private */
    private getTopOnlineItem;
    /** @summary Call function for each item which corresponds to JSON file
      * @private */
    private forEachJsonFile;
    /** @summary Open JSON file
      * @param {string} filepath - URL to JSON file
      * @returns {Promise} when object ready */
    openJsonFile(filepath: string): Promise<any>;
    /** @summary Call function for each item which corresponds to ROOT file
      * @private */
    private forEachRootFile;
    /** @summary Open ROOT file
      * @param {string} filepath - URL to ROOT file, argument for openFile
      * @returns {Promise} when file is opened */
    openRootFile(filepath: string): Promise<any>;
    /** @summary Apply loaded TStyle object
      * @desc One also can specify item name of JSON file name where style is loaded
      * @param {object|string} style - either TStyle object of item name where object can be load */
    applyStyle(style: object | string): Promise<void> | Promise<boolean>;
    /** @summary Provides information abouf file item
      * @private */
    private getFileProp;
    /** @summary Provides URL for online item
      * @desc Such URL can be used  to request data from the server
      * @returns string or null if item is not online
      * @private */
    private getOnlineItemUrl;
    /** @summary Returns true if item is online
      * @private */
    private isOnlineItem;
    /** @summary Dynamic module import, supports special shorcuts from core or draw_tree
      * @returns {Promise} with module
      * @private */
    private importModule;
    /** @summary method used to request object from the http server
      * @returns {Promise} with requested object
      * @private */
    private getOnlineItem;
    /** @summary Access THttpServer with provided address
      * @param {string} server_address - URL to server like "http://localhost:8090/"
      * @returns {Promise} when ready */
    openOnline(server_address: string): Promise<any>;
    /** @summary Get properties for online item  - server name and relative name
      * @private */
    private getOnlineProp;
    /** @summary Fill context menu for online item
      * @private */
    private fillOnlineMenu;
    /** @summary Assign existing hierarchy to the painter and refresh HTML code
      * @private */
    private setHierarchy;
    /** @summary Configures monitoring interval
      * @param {number} interval - repetition interval in ms
      * @param {boolean} flag - initial monitoring state */
    setMonitoring(interval: number, monitor_on: any): void;
    _monitoring_interval: number;
    _monitoring_on: any;
    /** @summary Runs monitoring event loop
      * @private */
    private _runMonitoring;
    _monitoring_frame: number;
    _monitoring_handle: NodeJS.Timeout;
    /** @summary Returns configured monitoring interval in ms */
    getMonitoringInterval(): number;
    /** @summary Returns true when monitoring is enabled */
    isMonitoring(): any;
    /** @summary Assign default layout and place where drawing will be performed
      * @param {string} layout - layout like "simple" or "grid2x2"
      * @param {string} frameid - DOM element id where object drawing will be performed */
    setDisplay(layout: string, frameid: string): void;
    disp: GridDisplay | TabsDisplay | FlexibleDisplay | BatchDisplay;
    disp_kind: any;
    disp_frameid: string;
    register_resize: boolean;
    /** @summary Returns configured layout */
    getLayout(): any;
    /** @summary Remove painter reference from hierarhcy
      * @private */
    private removePainter;
    /** @summary Cleanup all items in hierarchy
      * @private */
    private clearHierarchy;
    /** @summary Returns actual MDI display object
      * @desc It should an instance of {@link MDIDsiplay} class */
    getDisplay(): GridDisplay | TabsDisplay | FlexibleDisplay | BatchDisplay;
    /** @summary method called when MDI element is cleaned up
      * @desc hook to perform extra actions when frame is cleaned
      * @private */
    private cleanupFrame;
    /** @summary Creates configured MDIDisplay object
      * @returns {Promise} when ready
      * @private */
    private createDisplay;
    /** @summary If possible, creates custom MDIDisplay for given item
      * @param itemname - name of item, for which drawing is created
      * @param custom_kind - display kind
      * @returns {Promise} with mdi object created
      * @private */
    private createCustomDisplay;
    /** @summary function updates object drawings for other painters
      * @private */
    private updateOnOtherFrames;
    /** @summary Process resize event
      * @private */
    private checkResize;
    /** @summary Load and execute scripts, kept to support v6 applications
      * @private */
    private loadScripts;
    /** @summary Start GUI
      * @returns {Promise} when ready
      * @private */
    private startGUI;
    no_select: any;
    status_disabled: boolean;
    exclude_browser: boolean;
    float_browser_disabled: boolean;
    _topname: any;
    /** @summary Prepare div element - create layout and buttons
      * @private */
    private prepareGuiDiv;
    gui_div: any;
    brlayout: BrowserLayout;
    /** @summary Returns trus if status is exists */
    hasStatusLine(): boolean;
    /** @summary Create status line
      * @param {number} [height] - size of the status line
      * @param [mode] - false / true / "toggle"
      * @returns {Promise} when ready */
    createStatusLine(height?: number, mode?: any): Promise<any>;
    /** @summary Redraw hierarchy
      * @desc works only when inspector or streamer info is displayed
      * @private */
    private redrawObject;
    /** @summary Create browser elements
      * @returns {Promise} when completed */
    createBrowser(browser_kind: any, update_html: any): Promise<any>;
    readSelectedFile: () => void;
    selectLocalFile: () => Promise<any>;
    /** @summary Initialize browser elements */
    initializeBrowser(): void;
    /** @summary Enable monitoring mode */
    enableMonitoring(on: any): void;
}
/** @summary Display inspector
  * @private */
export function drawInspector(dom: any, obj: any): Promise<HierarchyPainter>;
/** @summary Display streamer info
  * @private */
export function drawStreamerInfo(dom: any, lst: any): Promise<HierarchyPainter>;
/** @summary draw list content
  * @desc used to draw all items from TList or TObjArray inserted into the TCanvas list of primitives
  * @private */
export function drawList(dom: any, lst: any, opt: any): any;
/** @summary tag item in hierarchy painter as streamer info
  * @desc this function used on THttpServer to mark streamer infos list
  * as fictional TStreamerInfoList class, which has special draw function
  * @private */
export function markAsStreamerInfo(h: any, item: any, obj: any): void;
/** @summary Create hierarchy elements for TFolder object
  * @private */
export function folderHierarchy(item: any, obj: any): boolean;
/** @summary Create hierarchy elements for TTask object
  * @private */
export function taskHierarchy(item: any, obj: any): boolean;
/** @summary Create hierarchy elements for TList object
  * @private */
export function listHierarchy(folder: any, lst: any): boolean;
/** @summary Create hierarchy for arbitrary object
  * @private */
export function objectHierarchy(top: any, obj: any, args?: any): boolean;
/** @summary Create hierarchy of TKey lists in file or sub-directory
  * @private */
export function keysHierarchy(folder: any, keys: any, file: any, dirname: any): boolean;
import { BasePainter } from "../base/BasePainter.mjs";
import { GridDisplay } from "./display.mjs";
import { TabsDisplay } from "./display.mjs";
import { FlexibleDisplay } from "./display.mjs";
import { BatchDisplay } from "./display.mjs";
import { BrowserLayout } from "./display.mjs";
export { getHPainter };
