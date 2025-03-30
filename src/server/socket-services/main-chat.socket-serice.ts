import { Socket } from "socket.io";
import { SocketServiceBase } from "./socket-server-base.socket-service";
import { ObjectId } from "mongodb";
import { AppChatService } from "../../services/app-chat.service";
import { SocketServer } from "../socket.server";
import { ChatTypes } from "../../model/shared-models/chat-types.model";
import { chatFunctionsServiceFactory } from "../../services/functions-services/chat.functions-service";
import { LlmChatService } from "../../services/llm-chat-service.service";
import { ChatMessage } from "../../model/shared-models/chat-models.model";


export class MainChatSocketService extends SocketServiceBase {
    constructor(
        socketServer: SocketServer,
        private appChatService: AppChatService,
        private llmChatService: LlmChatService,
    ) {
        super(socketServer);
    }

    async initialize(): Promise<void> {
        this.socketServer.subscribeToEvent('sendMainChatMessage').subscribe(event => {
            this.receiveMainChatMessage(event.socket, event.userId!, event.data[0]);
        });
    }

    receiveMainChatMessage = async (socket: Socket, userId: ObjectId, message: string): Promise<void> => {
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
                this.sendMainChatMessage(socket, mainChat._id, msg);
            }
        });
    };

    // #region Messaging To Client

    /** Sends a chat message to the UI for a specified chat. */
    sendMainChatMessage(socket: Socket, chatId: ObjectId, message: ChatMessage): void {
        socket.emit('receiveMainChatMessage', chatId.toHexString(), message);
    }

    sendServerStatusMessage(socket: Socket, type: 'info' | 'success' | 'warn' | 'error', message: string): void {
        socket.emit('receiveServerStatusMessage', type, message);
    }

    //#endregion

}