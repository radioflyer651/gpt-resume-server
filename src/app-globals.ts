import { getAppConfig } from "./config";
import { ChatDbService } from "./database/chat-db.service";
import { UserDbService } from "./database/user-db.service";
import { MongoHelper } from "./mongo-helper";
import { ChatServer } from "./server/chat-server";
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
export let chatService: LlmChatService;
export let chatServer: ChatServer;


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
    appChatService = new AppChatService(chatDbService);
    chatService = new LlmChatService(config.openAiConfig, chatDbService);

    /* App Services. */
    authService = new AuthService(userDbService);
    chatServer = new ChatServer(chatService, chatDbService, appChatService);

}