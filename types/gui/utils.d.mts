/** @summary Display progress message in the left bottom corner.
  * @desc Previous message will be overwritten
  * if no argument specified, any shown messages will be removed
  * @param {string} msg - message to display
  * @param {number} tmout - optional timeout in milliseconds, after message will disappear
  * @private */
export function showProgress(msg: string, tmout: number, ...args: any[]): any;
/** @summary Tries to close current browser tab
  * @desc Many browsers do not allow simple window.close() call,
  * therefore try several workarounds
  * @private */
export function closeCurrentWindow(): void;
export function loadOpenui5(args: any): Promise<any>;
export namespace ToolbarIcons {
    namespace camera {
        const path: string;
    }
    namespace disk {
        const path_1: string;
        export { path_1 as path };
    }
    namespace question {
        const path_2: string;
        export { path_2 as path };
    }
    namespace undo {
        const path_3: string;
        export { path_3 as path };
    }
    namespace arrow_right {
        const path_4: string;
        export { path_4 as path };
    }
    namespace arrow_up {
        const path_5: string;
        export { path_5 as path };
    }
    namespace arrow_diag {
        const path_6: string;
        export { path_6 as path };
    }
    namespace auto_zoom {
        const path_7: string;
        export { path_7 as path };
    }
    namespace statbox {
        const path_8: string;
        export { path_8 as path };
    }
    namespace circle {
        const path_9: string;
        export { path_9 as path };
    }
    namespace three_circles {
        const path_10: string;
        export { path_10 as path };
    }
    namespace diamand {
        const path_11: string;
        export { path_11 as path };
    }
    namespace rect {
        const path_12: string;
        export { path_12 as path };
    }
    namespace cross {
        const path_13: string;
        export { path_13 as path };
    }
    namespace vrgoggles {
        export const size: string;
        const path_14: string;
        export { path_14 as path };
    }
    namespace th2colorz {
        const recs: ({
            x: number;
            y: number;
            w: number;
            h: number;
            f: string;
        } | {
            y: number;
            f: string;
            x?: undefined;
            w?: undefined;
            h?: undefined;
        })[];
    }
    namespace th2color {
        const recs_1: ({
            x: number;
            y: number;
            w: number;
            h: number;
            f: string;
        } | {
            x: number;
            y: number;
            w: number;
            h: number;
            f?: undefined;
        } | {
            y: number;
            h: number;
            x?: undefined;
            w?: undefined;
            f?: undefined;
        } | {
            y: number;
            x?: undefined;
            w?: undefined;
            h?: undefined;
            f?: undefined;
        } | {
            y: number;
            h: number;
            f: string;
            x?: undefined;
            w?: undefined;
        } | {
            y: number;
            f: string;
            x?: undefined;
            w?: undefined;
            h?: undefined;
        } | {
            x: number;
            y: number;
            h: number;
            w?: undefined;
            f?: undefined;
        })[];
        export { recs_1 as recs };
    }
    namespace th2draw3d {
        const path_15: string;
        export { path_15 as path };
    }
    function createSVG(group: any, btn: any, size: any, title: any): any;
    function createSVG(group: any, btn: any, size: any, title: any): any;
}
/** @summary Register handle to react on window resize
  * @desc function used to react on browser window resize event
  * While many resize events could come in short time,
  * resize will be handled with delay after last resize event
  * @param {object|string} handle can be function or object with checkResize function or dom where painting was done
  * @param {number} [delay] - one could specify delay after which resize event will be handled
  * @protected */
export function registerForResize(handle: object | string, delay?: number): void;
export function detectRightButton(event: any): boolean;
/** @summary Add move handlers for drawn element
  * @private */
export function addMoveHandler(painter: any, enabled: any): void;
/** @summary Inject style
  * @param {String} code - css string
  * @private */
export function injectStyle(code: string, node: any, tag: any): boolean;
/** @summary Select predefined style
  * @private */
export function selectgStyle(name: any): void;
/** @summary Save JSROOT settings as specified cookie parameter
  * @param {Number} expires - days when cookie will be removed by browser, negative - delete immediately
  * @param {String} name - cookie parameter name
  * @private */
export function saveSettings(expires?: number, name?: string): void;
/** @summary Read JSROOT settings from specified cookie parameter
  * @param {Boolean} only_check - when true just checks if settings were stored before with provided name
  * @param {String} name - cookie parameter name
  * @private */
export function readSettings(only_check?: boolean, name?: string): boolean;
/** @summary Save JSROOT gStyle object as specified cookie parameter
  * @param {Number} expires - days when cookie will be removed by browser, negative - delete immediately
  * @param {String} name - cookie parameter name
  * @private */
export function saveStyle(expires?: number, name?: string): void;
/** @summary Read JSROOT gStyle object specified cookie parameter
  * @param {Boolean} only_check - when true just checks if settings were stored before with provided name
  * @param {String} name - cookie parameter name
  * @private */
export function readStyle(only_check?: boolean, name?: string): boolean;
/** @summary Function store content as file with filename
  * @private */
export function saveFile(filename: any, content: any): any;
/** @summary Function store content as file with filename
  * @private */
export function setSaveFile(func: any): void;
/** @summary Returns image file content as it should be stored on the disc
  * @desc Replaces all kind of base64 coding
  * @private */
export function getBinFileContent(content: any): any;
