/** @summary Create JSROOT menu
  * @desc See {@link JSRootMenu} class for detailed list of methods
  * @param {object} [evnt] - event object like mouse context menu event
  * @param {object} [handler] - object with handling function, in this case one not need to bind function
  * @param {string} [menuname] - optional menu name
  * @example
  * import { createMenu } from 'path_to_jsroot/modules/gui/menu.mjs';
  * let menu = await createMenu());
  * menu.add("First", () => console.log("Click first"));
  * let flag = true;
  * menu.addchk(flag, "Checked", arg => console.log(`Now flag is ${arg}`));
  * menu.show(); */
export function createMenu(evnt?: object, handler?: object, menuname?: string): Promise<BootstrapMenu> | Promise<StandaloneMenu>;
/** @summary Close previousely created and shown JSROOT menu
  * @param {string} [menuname] - optional menu name */
export function closeMenu(menuname?: string): boolean;
/**
 * @summary Context menu class using Bootstrap
 *
 * @desc Use {@link createMenu} to create instance of the menu
 * @private
 */
declare class BootstrapMenu extends JSRootMenu {
    code: string;
    funcs: {};
    lvl: number;
    /** @summary Load bootstrap functionality, required for menu
      * @private */
    private loadBS;
    /** @summary Load bootstrap functionality */
    load(): Promise<BootstrapMenu>;
    /** @summary Add menu item
      * @param {string} name - item name
      * @param {function} func - func called when item is selected */
    add(name: string, arg: any, func: Function, title: any): void;
    /** @summary Show menu */
    show(event: any): Promise<any>;
    resolveFunc: (value: any) => void;
    /** @summary Run modal elements with bootstrap code */
    runModal(title: any, main_content: any, args: any): Promise<any>;
}
/**
 * @summary Context menu class using plain HTML/JavaScript
 *
 * @desc Use {@link createMenu} to create instance of the menu
 * based on {@link https://github.com/L1quidH2O/ContextMenu.js}
 * @private
 */
declare class StandaloneMenu extends JSRootMenu {
    code: any[];
    _use_plain_text: boolean;
    stack: any[][];
    /** @summary Load required modules, noop for that menu class */
    load(): Promise<StandaloneMenu>;
    /** @summary Add menu item
      * @param {string} name - item name
      * @param {function} func - func called when item is selected */
    add(name: string, arg: any, func: Function, title: any): number | any[];
    /** @summary Build HTML elements of the menu
      * @private */
    private _buildContextmenu;
    /** @summary Show standalone menu */
    show(event: any): Promise<StandaloneMenu>;
    /** @summary Run modal elements with standalone code */
    runModal(title: any, main_content: any, args: any): Promise<any>;
}
/**
 * @summary Abstract class for creating context menu
 *
 * @desc Use {@link createMenu} to create instance of the menu
 * @private
 */
declare class JSRootMenu {
    constructor(painter: any, menuname: any, show_event: any);
    painter: any;
    menuname: any;
    show_evnt: {
        clientX: any;
        clientY: any;
    };
    remove_handler: () => void;
    element: any;
    cnt: number;
    native(): boolean;
    load(): Promise<JSRootMenu>;
    /** @summary Returns object with mouse event position when context menu was actiavted
      * @desc Return object will have members "clientX" and "clientY" */
    getEventPosition(): {
        clientX: any;
        clientY: any;
    };
    add(): void;
    /** @summary Returns menu size */
    size(): number;
    /** @summary Close and remove menu */
    remove(): void;
    show(): void;
    /** @summary Add checked menu item
      * @param {boolean} flag - flag
      * @param {string} name - item name
      * @param {function} func - func called when item is selected */
    addchk(flag: boolean, name: string, arg: any, func: Function, title: any): void;
    /** @summary Add draw sub-menu with draw options
      * @protected */
    protected addDrawMenu(top_name: any, opts: any, call_back: any): void;
    /** @summary Add color selection menu entries
      * @protected */
    protected addColorMenu(name: any, value: any, set_func: any, fill_kind: any): void;
    /** @summary Add size selection menu entries
      * @protected */
    protected addSizeMenu(name: any, min: any, max: any, step: any, size_value: any, set_func: any, title: any): void;
    /** @summary Add palette menu entries
      * @protected */
    protected addPaletteMenu(curr: any, set_func: any): void;
    /** @summary Add rebin menu entries
      * @protected */
    protected addRebinMenu(rebin_func: any): void;
    /** @summary Add selection menu entries
      * @param {String} name - name of submenu
      * @param {Array} values - array of string entries used as list for selection
      * @param {String|Number} value - currently elected value, either name or index
      * @param {Function} set_func - function called when item selected, either name or index depending from value parameter
      * @protected */
    protected addSelectMenu(name: string, values: any[], value: string | number, set_func: Function): void;
    /** @summary Add RColor selection menu entries
      * @protected */
    protected addRColorMenu(name: any, value: any, set_func: any): void;
    /** @summary Add items to change RAttrText
      * @protected */
    protected addRAttrTextItems(fontHandler: any, opts: any, set_func: any): void;
    /** @summary Fill context menu for text attributes
      * @private */
    private addTextAttributesMenu;
    /** @summary Add line style menu
      * @private */
    private addLineStyleMenu;
    /** @summary Add fill style menu
      * @private */
    private addFillStyleMenu;
    /** @summary Add font selection menu
      * @private */
    private addFontMenu;
    /** @summary Fill context menu for graphical attributes in painter
      * @private */
    private addAttributesMenu;
    /** @summary Fill context menu for axis
      * @private */
    private addTAxisMenu;
    /** @summary Fill menu to edit settings properties
      * @private */
    private addSettingsMenu;
    /** @summary Run modal dialog
      * @returns {Promise} with html element inside dialg
      * @private */
    private runModal;
    /** @summary Show modal info dialog
      * @param {String} title - title
      * @param {String} message - message
      * @protected */
    protected info(title: string, message: string): Promise<any>;
    /** @summary Show confirm dialog
      * @param {String} title - title
      * @param {String} message - message
      * @returns {Promise} with true when "Ok" pressed or false when "Cancel" pressed
      * @protected */
    protected confirm(title: string, message: string): Promise<any>;
    /** @summary Input value
      * @returns {Promise} with input value
      * @param {string} title - input dialog title
      * @param value - initial value
      * @param {string} [kind] - use "text" (default), "number", "float" or "int"
      * @protected */
    protected input(title: string, value: any, kind?: string, min: any, max: any): Promise<any>;
    /** @summary Let input arguments from the method
      * @returns {Promise} with method argument */
    showMethodArgsDialog(method: any): Promise<any>;
    /** @summary Let input arguments from the Command
      * @returns {Promise} with command argument */
    showCommandArgsDialog(cmdname: any, args: any): Promise<any>;
}
export {};
