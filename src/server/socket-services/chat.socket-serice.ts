import { Socket } from "socket.io";
import { SocketServiceBase } from "./socket-server-base.socket-service";
import { ObjectId } from "mongodb";
import { AppChatService } from "../../services/app-chat.service";
import { SocketServer } from "../socket.server";
import { ChatTypes } from "../../model/shared-models/chat-types.model";
import { chatFunctionsServiceFactory } from "../../services/functions-services/chat.functions-factory.service";
import { LlmChatService } from "../../services/llm-chat-service.service";
import { ChatMessage } from "../../model/shared-models/chat-models.model";
import { from, mergeMap, Observable, tap } from "rxjs";
import { ChatDbService } from "../../database/chat-db.service";


export class ChatSocketService extends SocketServiceBase {
    constructor(
        socketServer: SocketServer,
        private appChatService: AppChatService,
        private llmChatService: LlmChatService,
        private chatDbService: ChatDbService,
    ) {
        super(socketServer);
    }

    async initialize(): Promise<void> {
        this.socketServer.subscribeToEvent('sendChatMessage')
            .pipe(
                mergeMap(event => {
                    // Since our "subscription" needs to subscribe to a promise function,
                    //  this is how we have to do it.  There's no other way to make sure the promise completes,
                    //  because subscriptions don't handle them.
                    return from(this.receiveChatMessage(event.socket, event.userId!, event.userId!, event.data[0]));
                }))
            .subscribe();
    }

    receiveChatMessage = (socket: Socket, userId: ObjectId, chatId: ObjectId, message: string): Observable<void> => {
        return new Observable<void>(observer => {
            const resolver = async () => {
                // Get the chat from the database.
                const chat = await this.chatDbService.getChatById(chatId);

                // If nothing, then exit.
                if (!chat) {
                    observer.complete();
                    return;
                }

                // Create a function group for this.


            };
        });
    };


    receiveChatMessage = async (socket: Socket, userId: ObjectId, message: string): Promise<void> => {
        // Validate the user ID.
        if (!userId) {
            throw new Error('UserID is invalid.');
        }
        // Get the main chat for this user. (This could be improved to just get the ID.)
        const mainChat = await this.appChatService.getOrCreateChatOfType(userId, ChatTypes.Main);

        // Create a function group for this.
        const functionGroup = chatFunctionsServiceFactory(socket);

        // Function to deal with messages received during the API call.
        const chatStream$ = this.llmChatService.createChatResponse(mainChat._id, message, functionGroup.getFunctionGroups());

        // Subscribe tot he stream, and send messages to the front end as they come in.
        chatStream$.subscribe(msg => {
            if (typeof msg === 'string') {
                this.sendServerStatusMessage(socket, 'info', msg);
            } else {
                this.sendChatMessage(socket, mainChat._id, msg);
            }
        });
    };

    // #region Messaging To Client

    /** Sends a chat message to the UI for a specified chat. */
    sendChatMessage(socket: Socket, chatId: ObjectId, message: ChatMessage): void {
        socket.emit('receiveChatMessage', chatId.toHexString(), message);
    }

    sendServerStatusMessage(socket: Socket, type: 'info' | 'success' | 'warn' | 'error', message: string): void {
        socket.emit('receiveServerStatusMessage', type, message);
    }

    //#endregion

}