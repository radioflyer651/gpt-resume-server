import { Socket } from "socket.io";
import { SocketServiceBase } from "./socket-server-base.socket-service";
import { ObjectId } from "mongodb";
import { AppChatService } from "../../services/app-chat.service";
import { ChatCallback, SocketServer } from "../socket.server";

import { LlmChatService } from "../../services/llm-chat-service.service";
import { ChatMessage } from "../../model/shared-models/chat-models.model";
import { from, mergeMap, } from "rxjs";
import { ChatDbService } from "../../database/chat-db.service";
import { AiFunctionGroup } from "../../model/shared-models/functions/ai-function-group.model";
import { AdminDbService } from "../../database/admin-db.service";


export class ChatSocketService extends SocketServiceBase {
    constructor(
        socketServer: SocketServer,
        private appChatService: AppChatService,
        private llmChatService: LlmChatService,
        private chatDbService: ChatDbService,
        private adminDbService: AdminDbService,
    ) {
        super(socketServer);
        if (!socketServer || !appChatService || !llmChatService || !chatDbService) {
            throw new Error('One or more required services are not provided.');
        }
    }

    async initialize(): Promise<void> {
        this.socketServer.subscribeToEvent('sendChatMessage')
            .pipe(
                mergeMap(event => {
                    // Since our "subscription" needs to subscribe to a promise function,
                    //  this is how we have to do it.  There's no other way to make sure the promise completes,
                    //  because subscriptions don't handle them.
                    return from(this.receiveChatMessage(event.socket, event.userId!, event.data[0]!, event.data[1]));
                }))
            .subscribe();

        this.socketServer.subscribeToEvent('sendAudioRequest')
            .pipe(
                mergeMap(event => {
                    // Since our "subscription" needs to subscribe to a promise function,
                    //  this is how we have to do it.  There's no other way to make sure the promise completes,
                    //  because subscriptions don't handle them.

                    // Ensure we have a callback function.
                    if (!event.callback) {
                        return from(Promise.reject(new Error('No callback received to send response.')));
                    }

                    return from(this.receiveAudioRequest(event.socket, event.userId!, event.data[0]!, event.callback as ChatCallback<string>));
                }))
            .subscribe();
    }

    receiveChatMessage = async (socket: Socket, userId: ObjectId, chatId: ObjectId, message: string): Promise<void> => {
        // Validate the user ID.
        if (!userId) {
            throw new Error('UserID is invalid.');
        }

        // Get the chat for this user. (This could be improved to just get the ID.)
        const chat = await this.chatDbService.getChatById(chatId);

        // Ensure we have a chat.
        if (!chat) {
            throw new Error(`No chat was found for the id: ${chatId}`);
        }

        // Get the configurations for this chat.
        const configuration = this.llmChatService.getConfiguratorForChatType(chat!.chatType);

        // Create a function group for this.
        const functionGroupOwners = await configuration.getAiFunctionGroups(socket, chatId, userId);

        const functionGroups = functionGroupOwners.reduce((p, c) => [...p, ...c.getFunctionGroups()], [] as AiFunctionGroup[]);

        // Function to deal with messages received during the API call.
        const chatStream$ = this.llmChatService.createChatResponse(chatId, message, userId, functionGroups);

        // Subscribe tot he stream, and send messages to the front end as they come in.
        chatStream$.subscribe(msg => {
            if (typeof msg === 'string') {
                this.sendServerStatusMessage(socket, 'info', msg);
            } else {
                this.sendChatMessage(socket, chatId, msg);
            }
        });
    };

    /** Work function called from the socket request to get an audio message with specified content. */
    receiveAudioRequest = async (socket: Socket, userId: ObjectId, message: string, responseCallback: ChatCallback<string>) => {
        // Get the site settings, to see if audio is enabled.
        const settings = await this.adminDbService.getSiteSettings();

        // If audio chat is turned off, then we can't service this request.
        if (!settings?.allowAudioChat) {
            responseCallback('ERROR: Audio chat is not enabled.');
            return;
        }

        // Have the LLM generate the audio file.
        const audioResponse = await this.llmChatService.getAudio(message);

        // Return the file name.
        responseCallback(audioResponse.fileName);
    };

    // #region Messaging To Client

    /** Sends a chat message to the UI for a specified chat. */
    sendChatMessage(socket: Socket, chatId: ObjectId, message: ChatMessage): void {
        socket.emit('receiveChatMessage', chatId.toHexString(), message);
    };

    sendServerStatusMessage(socket: Socket, type: 'info' | 'success' | 'warn' | 'error', message: string): void {
        socket.emit('receiveServerStatusMessage', type, message);
    };

    //#endregion

}