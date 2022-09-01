/**
 * @summary Client communication handle for RWebWindow.
 *
 * @desc Should be created with {@link connectWebWindow} function
 */
export class WebWindowHandle {
    constructor(socket_kind: any, credits: any);
    kind: any;
    state: number;
    credits: any;
    cansend: any;
    ackn: any;
    /** @summary Returns arguments specified in the RWebWindow::SetUserArgs() method
      * @desc Can be any valid JSON expression. Undefined by default.
      * @param {string} [field] - if specified and user args is object, returns correspondent object member
      * @returns user arguments object */
    getUserArgs(field?: string): any;
    /** @summary Set user args
      * @desc Normally set via RWebWindow::SetUserArgs() method */
    setUserArgs(args: any): void;
    user_args: any;
    /** @summary Set callbacks receiver.
      * @param {object} obj - object with receiver functions
      * @param {function} obj.onWebsocketMsg - called when new data receieved from RWebWindow
      * @param {function} obj.onWebsocketOpened - called when connection established
      * @param {function} obj.onWebsocketClosed - called when connection closed
      * @param {function} obj.onWebsocketError - called when get error via the connection */
    setReceiver(obj: {
        onWebsocketMsg: Function;
        onWebsocketOpened: Function;
        onWebsocketClosed: Function;
        onWebsocketError: Function;
    }): void;
    receiver: {
        onWebsocketMsg: Function;
        onWebsocketOpened: Function;
        onWebsocketClosed: Function;
        onWebsocketError: Function;
    };
    /** @summary Cleanup and close connection. */
    cleanup(): void;
    /** @summary Invoke method in the receiver.
     * @private */
    private invokeReceiver;
    /** @summary Provide data for receiver. When no queue - do it directly.
     * @private */
    private provideData;
    msgqueue: any[];
    /** @summary Reserve entry in queue for data, which is not yet decoded.
     * @private */
    private reserveQueueItem;
    /** @summary Provide data for item which was reserved before.
     * @private */
    private markQueueItemDone;
    /** @summary Process completed messages in the queue
      * @private */
    private processQueue;
    _loop_msgqueue: boolean;
    /** @summary Close connection */
    close(force: any): void;
    /** @summary Checks number of credits for send operation
      * @param {number} [numsend = 1] - number of required send operations
      * @returns true if one allow to send specified number of text message to server */
    canSend(numsend?: number): boolean;
    /** @summary Returns number of possible send operations relative to number of credits */
    getRelCanSend(): number;
    /** @summary Send text message via the connection.
      * @param {string} msg - text message to send
      * @param {number} [chid] - channel id, 1 by default, 0 used only for internal communication */
    send(msg: string, chid?: number): any;
    timerid: NodeJS.Timeout;
    /** @summary Inject message(s) into input queue, for debug purposes only
      * @private */
    private inject;
    /** @summary Send keep-alive message.
      * @desc Only for internal use, only when used with websockets
      * @private */
    private keepAlive;
    /** @summary Method open channel, which will share same connection, but can be used independently from main
      * @private */
    private createChannel;
    channels: {};
    freechannelid: number;
    /** @summary Returns used channel ID, 1 by default */
    getChannelId(): any;
    /** @summary Assign href parameter
      * @param {string} [path] - absolute path, when not specified window.location.url will be used
      * @private */
    private setHRef;
    href: any;
    /** @summary Return href part
      * @param {string} [relative_path] - relative path to the handle
      * @private */
    private getHRef;
    /** @summary Create configured socket for current object.
      * @private */
    private connect;
    _websocket: WebSocket | LongPollSocket | FileDumpSocket;
    next_binary: number;
}
/** @summary Method used to initialize connection to web window.
  * @param {object} arg - arguments
  * @param {string} [arg.socket_kind] - kind of connection longpoll|websocket, detected automatically from URL
  * @param {number} [arg.credits = 10] - number of packets which can be send to server without acknowledge
  * @param {object} arg.receiver - instance of receiver for websocket events, allows to initiate connection immediately
  * @param {string} [arg.first_recv] - required prefix in the first message from RWebWindow, remain part of message will be returned in handle.first_msg
  * @param {string} [arg.href] - URL to RWebWindow, using window.location.href by default
  * @returns {Promise} ready-to-use {@link WebWindowHandle} instance  */
export function connectWebWindow(arg: {
    socket_kind?: string;
    credits?: number;
    receiver: object;
    first_recv?: string;
    href?: string;
}): Promise<any>;
/**
 * @summary Class emulating web socket with long-poll http requests
 *
 * @private
 */
declare class LongPollSocket {
    constructor(addr: any, _raw: any, _args: any);
    path: any;
    connid: string | number;
    req: any;
    raw: any;
    args: any;
    /** @summary Submit next request */
    nextRequest(data: any, kind: any): void;
    /** @summary Process request */
    processRequest(res: any, _offset: any): void;
    /** @summary Send data */
    send(str: any): void;
    /** @summary Close connection */
    close(): void;
}
/**
 * @summary Class re-playing socket data from stored protocol
 *
 * @private
 */
declare class FileDumpSocket {
    constructor(receiver: any);
    receiver: any;
    protocol: any[];
    cnt: number;
    /** @summary Get stored protocol */
    getProtocol(res: any): void;
    /** @summary Emulate send - just cound operation */
    send(): void;
    /** @summary Emulate close */
    close(): void;
    /** @summary Read data for next operation */
    nextOperation(): void;
    wait_for_file: boolean;
}
export {};
