

export interface IAppConfig {
    openAiConfig: OpenAiConfig;
    mongo: MongoConfig;
    tokenSecret: string;
    corsAllowed?: string[];
    serverConfig: ServerConfig;
    /** The full path to the socket.io endpoint for chatting. */
    chatSocketIoEndpoint: string;
    /** The path of the socket.  This is different than the namespace. */
    chatSocketIoPath: string;
    infoFiles: string[];
    apolloServiceConfiguration: ApolloConfiguration;
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


export interface ApolloConfiguration {
    apiKey: string;
    host: string; // 'api.apollo.io'
}
