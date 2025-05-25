import { adminDbService, appChatService, chatDbService, llmChatService, tarotDbService, companyDbService } from "./app-globals";
import { AdminSocketService } from "./server/socket-services/admin.socket-service";
import { ChatSocketService } from "./server/socket-services/chat.socket-service";
import { TarotSocketService } from "./server/socket-services/tarot.socket-service";
import { SocketServer } from "./server/socket.server";

export let mainChatSocketService: ChatSocketService;
export let tarotSocketServer: TarotSocketService;
export let adminSocketService: AdminSocketService;

/** Sets up all socket servers/services that are based on the socketServer. */
export async function setupSocketServices(socketServer: SocketServer): Promise<void> {
    mainChatSocketService = new ChatSocketService(socketServer, appChatService, llmChatService, chatDbService, adminDbService);
    await mainChatSocketService.initialize();

    tarotSocketServer = new TarotSocketService(socketServer, companyDbService, tarotDbService, llmChatService, appChatService, chatDbService);
    await tarotSocketServer.initialize();

    adminSocketService = new AdminSocketService(socketServer);
    await adminSocketService.initialize();

}