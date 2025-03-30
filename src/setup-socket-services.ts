import { appChatService, chatDbService, chatService, tarotDbService, userDbService } from "./app-globals";
import { MainChatSocketService } from "./server/socket-services/main-chat.socket-serice";
import { TarotSocketService } from "./server/socket-services/tarot.socket-service";
import { SocketServer } from "./server/socket.server";

export let mainChatSocketServer: MainChatSocketService;
export let tarotServer: TarotSocketService;

/** Sets up all socket servers/services that are based on the socketServer. */
export async function setupSocketServices(socketServer: SocketServer): Promise<void> {

    mainChatSocketServer = new MainChatSocketService(socketServer, appChatService, chatService);
    await mainChatSocketServer.initialize();

    tarotServer = new TarotSocketService(socketServer, userDbService, tarotDbService, chatService, appChatService, chatDbService);
    await tarotServer.initialize();

}