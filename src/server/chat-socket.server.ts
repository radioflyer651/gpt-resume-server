import http from 'http';
import { Socket, Server as SocketIOServer } from 'socket.io';
import { IAppConfig } from '../model/app-config.model';
import { ObjectId } from 'mongodb';
import { TokenPayload } from '../model/shared-models/token-payload.model';
import { verifyToken } from '../auth/jwt';
import { nullToUndefined } from '../utils/empty-and-null.utils';
import { LlmChatService } from '../services/llm-chat-service.service';
import { ChatMessage } from '../model/shared-models/chat-models.model';
import { ChatDbService } from '../database/chat-db.service';
import { ChatTypes } from '../model/shared-models/chat-types.model';
import { AppChatService } from '../services/app-chat.service';
import { objectIdToStringConverter, stringToObjectIdConverter } from '../utils/object-id-to-string-converter.utils';

/** All functions in the ChatServer that must be registered with socket.io. */
const socketFunctions = [] as string[];
function SocketFunction(target: any, propertyKey: string) {
    // Add the property to the socket function list.
    socketFunctions.push(propertyKey);
}

/** Performs chat interactions with the UI, using socket.io. This setup
 *   is only intended to support a single back-end server. */
export class ChatSocketServer {
    constructor(
        readonly llmChatService: LlmChatService,
        readonly chatDbServer: ChatDbService,
        readonly appChatService: AppChatService
    ) {

    }

    // #region Internals

    registerWithServer(config: IAppConfig, server: http.Server<any, any>) {
        const io = new SocketIOServer(server, {
            // path: 'chat-io',
            cors: {
                origin: config.corsAllowed ?? [],
                methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE']
            }
        });

        // Register the socket functions with socket.io.
        io.on('connection', async (socket) => {
            // Determine if they can connect or not.
            if (!(await this.onConnect(socket))) {
                console.log(`Connection made, but with bad credentials.  Disconnecting.`);
                // Disconnect and exit.
                socket.disconnect();
                return;
            }

            console.log(`Connection established.`);

            socket.onAnyOutgoing((...args) => {
                args.forEach(a => {
                    objectIdToStringConverter(a);
                });
            });

            // We must convert object IDs of strings to ObjectIds.
            socket.use(([event, ...args], next) => {
                args.forEach(a => {
                    stringToObjectIdConverter(a, false);
                });

                next();
            });

            // Register the disconnection.
            socket.on('disconnect', () => {
                console.log('Socket disconnected.');
                this.onDisconnect(socket);
            });

            // Register all SocketFunctions.
            socketFunctions.forEach(fName => {
                // Register this function as a server function.
                socket.on(fName, (...args) => this.callFunction(fName, socket, args));
            });
        });
    }

    private callFunction = async (fName: string, socket: Socket, args: any[]) => {
        // The last argument is always a callback to send the response to the client.
        const actArgs = [] as any[];

        // Variable to hold the response callback.
        let responseCallback!: (res: any) => void;

        // Rebuild the argument list, since we can't have the response call back inside it.
        args.forEach((arg, i) => {
            if (i !== args.length - 1 || typeof arg !== 'function') {
                // Add this to the arg list.
                actArgs.push(arg);
            } else {
                // Set the return callback.
                responseCallback = arg;
            }
        });

        // Get the function for this.
        const thisServer = (this as unknown) as { [key: string]: any; };
        const serverFunction = thisServer[fName];

        // Call the function, and get the response.
        const result = await serverFunction(socket, ...actArgs);
        // Send the result to the caller.
        if (responseCallback) {
            responseCallback(result);
        }
    };

    /** Returns the user's ID that owns a specified socket. */
    private getUserIdForSocket = async (socket: Socket): Promise<ObjectId | undefined> => {
        // Get the token.
        const token = await this.getTokenPayloadForSocket(socket);

        // Return the right thing.
        return token?.userId;
    };

    /** Returns the TokenPayload for a specified socket, if there is one. */
    private async getTokenPayloadForSocket(socket: Socket): Promise<TokenPayload | undefined> {
        const token = socket.handshake.auth.token as string | undefined;

        // If there's no token, then there's no payload.
        if (!token) {
            return undefined;
        }

        // Get the parsed token.
        const result = nullToUndefined(await verifyToken(token));

        // Ensure the IDs are ObjectIds.
        stringToObjectIdConverter(result, false);

        // Return the result.
        return result;
    }

    /** Called when a socket connects to the server.  This method will
     *   return a boolean value indicating whether or not the socket has the
     *   appropriate credentials. */
    private async onConnect(socket: Socket): Promise<boolean> {
        // Get the TokenPayload for the socket.
        const payload = await this.getTokenPayloadForSocket(socket);

        // Convert the result to a boolean.
        return !!payload;
    }

    private async onDisconnect(socket: Socket): Promise<void> {

    }

    //#endregion

    // #region Messaging To Client

    /** Sends a chat message to the UI for a specified chat. */
    receiveChatMessage(socket: Socket, chatId: ObjectId, message: ChatMessage): void {
        socket.emit('receiveChatMessage', chatId.toHexString(), message);
    }

    receiveServerStatusMessage(socket: Socket, type: 'info' | 'success' | 'warn' | 'error', message: string): void {
        socket.emit('receiveServerStatusMessage', type, message);
    }

    //#endregion

    //#region Messaging From Client
    @SocketFunction
    sendMainChatMessage = async (socket: Socket, message: string): Promise<void> => {
        // Get the user's Id
        const userId = await this.getUserIdForSocket(socket);

        // Validate the user ID.
        if (!userId) {
            throw new Error('UserID is invalid.');
        }
        // Get the main chat for this user. (This could be improved to just get the ID.)
        const mainChat = await this.appChatService.getOrCreateChatOfType(userId, ChatTypes.Main);

        // Function to deal with messages received during the API call.
        const chatStream$ = this.llmChatService.createChatResponse(mainChat._id, message);

        // Subscribe tot he stream, and send messages to the front end as they come in.
        chatStream$.subscribe(msg => {
            if (typeof msg === 'string') {
                this.receiveServerStatusMessage(socket, 'info', msg);
            } else {
                this.receiveChatMessage(socket, mainChat._id, msg);
            }
        });
    };
    //#endregion
}