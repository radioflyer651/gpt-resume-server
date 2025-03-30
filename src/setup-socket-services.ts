import { appChatService, chatDbService, chatService, tarotDbService, userDbService } from "./app-globals";
import { ChatSocketService } from "./server/socket-services/chat.socket-serice";
import { TarotSocketService } from "./server/socket-services/tarot.socket-service";
import { SocketServer } from "./server/socket.server";

export let mainChatSocketServer: ChatSocketService;
export let tarotServer: TarotSocketService;

/** Sets up all socket servers/services that are based on the socketServer. */
export async function setupSocketServices(socketServer: SocketServer): Promise<void> {

    mainChatSocketServer = new ChatSocketService(socketServer, appChatService, chatService);
    await mainChatSocketServer.initialize();

    tarotServer = new TarotSocketService(socketServer, userDbService, tarotDbService, chatService, appChatService, chatDbService);
    await tarotServer.initialize();

}