

export interface IAppConfig {
    openAiConfig: OpenAiConfig;
    mongo: MongoConfig;
    tokenSecret: string;
}

export interface OpenAiConfig {
    openAiOrg: string;
    openAiKey: string;
}

export interface MongoConfig {
    connectionString: string;
    databaseName: string;
}