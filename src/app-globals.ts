import { getAppConfig } from "./config";
import { ChatDbService } from "./database/chat-db.service";
import { LogDbService } from "./database/log-db.service";
import { UserDbService } from "./database/user-db.service";
import { MongoHelper } from "./mongo-helper";
import { SocketServer } from "./server/socket.server";
import { MainChatSocketService } from "./server/socket-services/main-chat.socket-serice";
import { AppChatService } from "./services/app-chat.service";
import { AuthService } from "./services/auth-service";
import { LlmChatService } from "./services/llm-chat-service.service";
import { TarotImageService } from "./services/tarot-image.service";
import { TarotDbService } from "./database/tarot-db.service";

/** If we were using dependency injection, this would be the DI services we'd inject in the necessary places. */

/** The mongo helper used in all DB Services. */
export let dbHelper: MongoHelper;

/* All DB Services. */
export let userDbService: UserDbService;
export let chatDbService: ChatDbService;
export let appChatService: AppChatService;
export let mainChatSocketServer: MainChatSocketService;
export let loggingService: LogDbService;
export let chatService: LlmChatService;
export let socketServer: SocketServer;
export let tarotDbService: TarotDbService;
export let tarotImageService: TarotImageService;

/* App Services. */
export let authService: AuthService;

/** Initializes the services used in the application. */
export async function initializeServices(): Promise<void> {
    // Load the configuration.
    const config = await getAppConfig();

    /** The mongo helper used in all DB Services. */
    dbHelper = new MongoHelper(config.mongo.connectionString, config.mongo.databaseName);

    /* All DB Services. */
    userDbService = new UserDbService(dbHelper);
    chatDbService = new ChatDbService(dbHelper);
    loggingService = new LogDbService(dbHelper);
    tarotDbService = new TarotDbService(dbHelper);
    appChatService = new AppChatService(chatDbService);
    await appChatService.initialize();
    chatService = new LlmChatService(config.openAiConfig, chatDbService, userDbService, loggingService);
    mainChatSocketServer = new MainChatSocketService(socketServer, appChatService, chatService);
    await mainChatSocketServer.initialize();
    tarotImageService = new TarotImageService(tarotDbService);

    /* App Services. */
    authService = new AuthService(userDbService);
    socketServer = new SocketServer(chatService, chatDbService, appChatService);

}