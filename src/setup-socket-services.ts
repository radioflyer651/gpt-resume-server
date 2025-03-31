import { appChatService, chatDbService, llmChatService, tarotDbService, userDbService } from "./app-globals";
import { ChatSocketService } from "./server/socket-services/chat.socket-service";
import { TarotSocketService } from "./server/socket-services/tarot.socket-service";
import { SocketServer } from "./server/socket.server";

export let mainChatSocketService: ChatSocketService;
export let tarotServer: TarotSocketService;

/** Sets up all socket servers/services that are based on the socketServer. */
export async function setupSocketServices(socketServer: SocketServer): Promise<void> {
    mainChatSocketService = new ChatSocketService(socketServer, appChatService, llmChatService, chatDbService);
    await mainChatSocketService.initialize();

    tarotServer = new TarotSocketService(socketServer, userDbService, tarotDbService, llmChatService, appChatService, chatDbService);
    await tarotServer.initialize();

}