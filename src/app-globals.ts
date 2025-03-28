import { getAppConfig } from "./config";
import { ChatDbService } from "./database/chat-db.service";
import { LogDbService } from "./database/log-db.service";
import { UserDbService } from "./database/user-db.service";
import { MongoHelper } from "./mongo-helper";
import { ChatSocketServer } from "./server/chat-socket.server";
import { AppChatService } from "./services/app-chat.service";
import { AuthService } from "./services/auth-service";
import { LlmChatService } from "./services/llm-chat-service.service";

/** If we were using dependency injection, this would be the DI services we'd inject in the necessary places. */

/** The mongo helper used in all DB Services. */
export let dbHelper: MongoHelper;

/* All DB Services. */
export let userDbService: UserDbService;
export let chatDbService: ChatDbService;
export let appChatService: AppChatService;
export let loggingService: LogDbService;
export let chatService: LlmChatService;
export let chatSocketServer: ChatSocketServer;


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
    appChatService = new AppChatService(chatDbService);
    await appChatService.initialize();
    chatService = new LlmChatService(config.openAiConfig, chatDbService, userDbService, loggingService);

    /* App Services. */
    authService = new AuthService(userDbService);
    chatSocketServer = new ChatSocketServer(chatService, chatDbService, appChatService);

}