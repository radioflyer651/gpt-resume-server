

export interface IAppConfig {
    mongo: MongoConfig;
    openAiKey: string;
    tokenSecret: string;
}

export interface MongoConfig {
    connectionString: string;
    databaseName: string;
}