import { Socket } from "socket.io";
import { ToastMessage } from "../../model/toast-message.model";
import { AiFunctionGroup } from "../../model/shared-models/functions/ai-function-group.model";
import { sendToastMessageDefinition } from "../../ai-functions/send-toast-message.ai-function";
import { ChatSocketService } from "../../server/socket-services/chat.socket-service";
import { IFunctionGroupProvider } from "../../model/function-group-provider.model";

/** ChatFunctionService gets created on each request or socket message.  Since these items have important
 *   context, the service has to work with each one individually to avoid a context management nightmare. */
export class ChatFunctionsService implements IFunctionGroupProvider {
    constructor(
        public readonly socket: Socket | undefined,
        private mainChatSocketService: ChatSocketService
    ) {
        if (!socket) {
            console.error('No socket was passed to the ChatFunctionService.');
        }
        // Validate the inputs.
        if (!mainChatSocketService) {
            throw new Error('mainChatSocketService is required.');
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
        this.mainChatSocketService.receiveToastMessage(this.socket, message);

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