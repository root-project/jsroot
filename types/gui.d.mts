/** @summary Build main GUI
  * @desc Used in many HTML files to create JSROOT GUI elements
  * @param {String} gui_element - id of the `<div>` element
  * @param {String} gui_kind - either "online", "nobrowser", "draw"
  * @returns {Promise} with {@link HierarchyPainter} instance
  * @example
  * import { buildGUI } from '/path_to_jsroot/modules/gui.mjs';
  * buildGUI("guiDiv"); */
export function buildGUI(gui_element: string, gui_kind?: string): Promise<any>;
import { internals } from "./core.mjs";
/** @summary Read style and settings from URL
  * @private */
export function readStyleFromURL(url: any): void;
import { HierarchyPainter } from "./gui/HierarchyPainter.mjs";
export { internals, HierarchyPainter };
