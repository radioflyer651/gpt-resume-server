import { getAppConfig } from "./config";
import { ChatDbService } from "./database/chat-db.service";
import { LogDbService } from "./database/log-db.service";
import { UserDbService } from "./database/user-db.service";
import { MongoHelper } from "./mongo-helper";
import { AppChatService } from "./services/app-chat.service";
import { AuthService } from "./services/auth-service";
import { LlmChatService } from "./services/llm-chat-service.service";
import { TarotImageService } from "./services/tarot-image.service";
import { TarotDbService } from "./database/tarot-db.service";
import { getChatConfigurators } from "./chat-configurators";

/** If we were using dependency injection, this would be the DI services we'd inject in the necessary places. */

/** The mongo helper used in all DB Services. */
export let dbHelper: MongoHelper;

/* All DB Services. */
export let userDbService: UserDbService;
export let chatDbService: ChatDbService;
export let appChatService: AppChatService;
export let loggingService: LogDbService;
export let llmChatService: LlmChatService;
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
    await dbHelper.connect();

    /* All DB Services. */
    userDbService = new UserDbService(dbHelper);
    chatDbService = new ChatDbService(dbHelper);
    loggingService = new LogDbService(dbHelper);
    tarotDbService = new TarotDbService(dbHelper);
    llmChatService = new LlmChatService(config.openAiConfig, chatDbService, userDbService, loggingService, getChatConfigurators());

    appChatService = new AppChatService(chatDbService, getChatConfigurators());

    tarotImageService = new TarotImageService(tarotDbService);

    /* App Services. */
    authService = new AuthService(userDbService);

}