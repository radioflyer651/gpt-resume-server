import { MongoClient } from "mongodb";
import * as mongo from 'mongodb';

// const defaultConnectionString = 'mongodb://192.168.99.100:27017'
// const defaultConnectionString = 'mongodb://localhost:27017'
const defaultConnectionString = 'mongodb://mongo.fingercraft.run:27017';

export class MongoHelper {
    constructor(private connectionString?: string, private readonly databaseName: string = 'chat-session-db') {
        if (!connectionString) {
            this.connectionString = defaultConnectionString;
        }
    }

    private client?: MongoClient;
    private db?: mongo.Db;

    /** Initializes the database connection. */
    async connect(): Promise<void> {
        // We cannot connect, if we're already connected.
        if (this.client) {
            try {
                this.client.close();
            } catch (err) {

            }
            this.db = undefined;
            this.client = undefined;
            throw new Error('Cannot reconnect to the database if it is already connected.');
        }

        this.client = await MongoClient.connect(this.connectionString!);
        this.db = this.client.db(this.databaseName);
    }

    /** Closes the connection to the database. */
    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.close();
            this.db = undefined;
            this.client = undefined;
        }
    }

    get isConnected(): boolean {
        return !!this.db;
    }

    async makeCall<T>(callback: (db: mongo.Db) => Promise<T>): Promise<T> {
        let makeConnection = !this.isConnected;
        if (makeConnection) {
            await this.connect();
        }

        try {
            return await callback(this.db!) as T;
        } finally {
            if (makeConnection) {
                await this.disconnect();
            }
        }
    }
}
