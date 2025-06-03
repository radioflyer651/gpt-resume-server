import { ApolloPeopleRequestParams } from "./apollo/apollo-api-request.model";


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
    apolloApiClientConfiguration: ApolloConfiguration;
    apolloServiceConfiguration: ApolloServiceConfiguration;
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

export interface ApolloServiceConfiguration {
    /** The max number of employees a company can have to download them all. */
    maxEmployeeCount: number;
    /** The maximum number of employee records to pull at a time, when paging data. */
    maxPageSize: number;
    /** When finding relevant people for a company, this is the API query used to find the right ones. */
    employeeQuery: ApolloPeopleRequestParams;
}