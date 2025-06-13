import { getAppConfig } from "./config";
import { ChatDbService } from "./database/chat-db.service";
import { LogDbService } from "./database/log-db.service";
import { CompanyManagementDbService } from "./database/company-management-db.service";
import { MongoHelper } from "./mongo-helper";
import { AppChatService } from "./services/app-chat.service";
import { AuthService } from "./services/auth-service";
import { LlmChatService } from "./services/llm-chat-service.service";
import { TarotImageService } from "./services/tarot-image.service";
import { TarotDbService } from "./database/tarot-db.service";
import { getChatConfigurators } from "./chat-configurators";
import { AdminDbService } from "./database/admin-db.service";
import { AuthDbService } from "./database/auth-db.service";
import { JobAnalysisFunction } from "./services/llm-functions/job-analysis.llm-function";
import { ApolloDbService } from "./database/apollo.db-service";
import { ApolloService } from "./services/apollo.service";
import { ApolloApiClient } from "./services/apollo.api-client";
import { CompanyManagementService } from "./services/company-management.service";

/** If we were using dependency injection, this would be the DI services we'd inject in the necessary places. */

/** The mongo helper used in all DB Services. */
export let dbHelper: MongoHelper;

/* All DB Services. */
export let appChatService: AppChatService;
export let loggingService: LogDbService;
export let llmChatService: LlmChatService;

export let companyDbService: CompanyManagementDbService;
export let chatDbService: ChatDbService;
export let tarotImageService: TarotImageService;
export let tarotDbService: TarotDbService;
export let adminDbService: AdminDbService;
export let authDbService: AuthDbService;

export let apolloApiClient: ApolloApiClient;
export let apolloDbService: ApolloDbService;
export let apolloService: ApolloService;
export let companyService: CompanyManagementService;

/* App Services. */
export let authService: AuthService;

// Other services.
export let jobAnalyzerService: JobAnalysisFunction;

/** Initializes the services used in the application. */
export async function initializeServices(): Promise<void> {
    // Load the configuration.
    const config = await getAppConfig();

    /** The mongo helper used in all DB Services. */
    dbHelper = new MongoHelper(config.mongo.connectionString, config.mongo.databaseName);
    await dbHelper.connect();

    /* All DB Services. */
    companyDbService = new CompanyManagementDbService(dbHelper);
    authDbService = new AuthDbService(dbHelper);
    chatDbService = new ChatDbService(dbHelper);
    loggingService = new LogDbService(dbHelper);
    tarotDbService = new TarotDbService(dbHelper);
    adminDbService = new AdminDbService(dbHelper);
    llmChatService = new LlmChatService(config.openAiConfig, chatDbService, authDbService, loggingService, getChatConfigurators());

    apolloDbService = new ApolloDbService(dbHelper);
    apolloApiClient = new ApolloApiClient(config.apolloApiClientConfiguration);
    apolloService = new ApolloService(config.apolloServiceConfiguration, apolloApiClient, apolloDbService, companyDbService);
    companyService = new CompanyManagementService(companyDbService, apolloDbService);

    appChatService = new AppChatService(chatDbService, getChatConfigurators());

    tarotImageService = new TarotImageService(tarotDbService);

    /* App Services. */
    authService = new AuthService(authDbService, loggingService);

}