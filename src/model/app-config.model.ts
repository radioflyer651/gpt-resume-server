

export interface IAppConfig {
    openAiConfig: OpenAiConfig;
    mongo: MongoConfig;
    tokenSecret: string;
    corsAllowed?: string[];
    serverConfig: ServerConfig;
}

export interface OpenAiConfig {
    openAiOrg: string;
    openAiKey: string;
}

export interface MongoConfig {
    connectionString: string;
    databaseName: string;
}

export interface ServerConfig {
    port: number;
}