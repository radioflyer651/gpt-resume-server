import { filter, map, mergeMap, Observable, Subject, takeUntil } from "rxjs";
import { SocketErrorTypes, SocketServer, SocketServerEvent } from "../socket.server";
import { ToastMessage } from "../../model/toast-message.model";
import { ObjectId } from "mongodb";
import { Socket } from "socket.io";


/** Base class for all socket servers. */
export abstract class SocketServiceBase {
    constructor(protected readonly socketServer: SocketServer) {
    }

    /** Initializes the base class, letting it sync with the socket server. */
    abstract initialize(): Promise<void>;

    protected async getUserIdForSocket(socket: Socket): Promise<ObjectId | undefined> {
        return this.socketServer.getUserIdForSocket(socket);
    }

    /** Observable called when this server is being disposed of.
     *   It's unlikely that it will be, but just to be sure. */
    private _disposing$ = new Subject<void>();

    /** Disposes of this server.  This is called when the server is shutting down. */
    dispose() {
        this._disposing$.next();
        this._disposing$.complete();
    }


    // #region Messaging To Client

    /** Sends a Toast message to the UI, which is a popup. */
    receiveToastMessage = async (socket: Socket, message: ToastMessage) => {
        socket.emit('receiveToastMessage', message);
    };

    //#endregion

    /** Calls a specified callback, catching any errors, and reporting them back to the calling socket if one occurs. */
    protected callWithErrorReporting(socket: Socket, callback: () => void | Promise<void>): void | Promise<void> {
        try {
            // Call the callback.
            return callback();
        } catch (err) {
            // Send the error to the socket.
            this.socketServer.reportError(socket, SocketErrorTypes.InternalError, err?.toString() ?? '');
        }
    }
}