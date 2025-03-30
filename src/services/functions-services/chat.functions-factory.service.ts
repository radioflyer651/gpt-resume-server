import { Socket } from "socket.io";
import { ToastMessage } from "../../model/toast-message.model";
import { AiFunctionGroup } from "../../model/shared-models/functions/ai-function-group.model";
import { sendToastMessageDefinition } from "../../ai-functions/send-toast-message.ai-function";
import { ChatSocketService } from "../../server/socket-services/chat.socket-serice";
import { FunctionGroupProvider } from "../../model/function-group-provider.model";
import { mainChatSocketServer } from "../../setup-socket-services";
import { ChatTypes } from "../../model/shared-models/chat-types.model";
import { ChatFunctionsService } from "./main-chat.functions-service";
import { tarotDbService } from "../../app-globals";
import { TarotGameFunctionsService } from "./tarot-game.functions-service";

/** Returns the appropriate chat functions service, based on a specified chat type. */
export function chatFunctionsServiceFactory(socket: Socket, chatType: ChatTypes): ChatFunctionsService {
    switch (chatType) {
        case ChatTypes.Main:
            return new ChatFunctionsService(socket, mainChatSocketServer);

        case ChatTypes.TarotGame:
            return new TarotGameFunctionsService(socket, tarotGameId, tarotSocketService, tarotDbService);

        default:
            throw new Error(`Unexpected chat type: ${chatType}`);
    }
}
