import { Socket } from "socket.io";
import { ChatDbService } from "../database/chat-db.service";
import { ToastMessage } from "../model/toast-message.model";
import { ChatSocketServer } from "../server/chat-socket.server";
import { LlmChatService } from "./llm-chat-service.service";
import { chatSocketServer, chatService, chatDbService } from "../app-globals";
import { AiFunctionGroup } from "../model/shared-models/functions/ai-function-group.model";
import { sendToastMessageDefinition } from "../ai-functions/send-toast-message.ai-function";

/** Factory function to create ChatFunctionsServices on demand. */
export function chatFunctionsServiceFactory(socket: Socket): ChatFunctionsService {
    return new ChatFunctionsService(socket, chatSocketServer, chatDbService, chatService);
}

/** ChatFunctionService gets created on each request or socket message.  Since these items have important
 *   context, the service has to work with each one individually to avoid a context management nightmare. */
export class ChatFunctionsService {
    constructor(
        public readonly socket: Socket | undefined,
        private chatSocketService: ChatSocketServer,
        private chatDbService: ChatDbService,
        appChatService: LlmChatService) {
        if (!socket) {
            console.error('No socket was passed to the ChatFunctionService.');
        }
    }

    /** Sends the user a toast popup. */
    sendUserToastMessage = async (message: ToastMessage): Promise<string> => {
        // Validate the socket.
        if (!this.socket) {
            console.error(`Socket was not set.`);
            return 'failure';
        }

        console.log(`Toast message:`, JSON.stringify(message, undefined, 2));

        // Send the message.
        this.chatSocketService.receiveToastMessage(this.socket, message);

        return 'success';
    };

    /** Returns all function groups that this chat service can provide. */
    getFunctionGroups = (): AiFunctionGroup[] => {
        const fnGroup: AiFunctionGroup = {
            groupName: 'UI Functions',
            functions: [
                {
                    definition: sendToastMessageDefinition,
                    function: this.sendUserToastMessage
                }
            ]
        };

        return [fnGroup];
    };
}