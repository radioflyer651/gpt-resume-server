import { MongoClient, Document } from "mongodb";
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

    /** Boolean value indicating that the close() method was called, and
     *   a reconnect should not be attempted. */
    private intentionalClose = false;

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

        const reconnectHandler = () => {
            if (this.intentionalClose) {
                console.log(`MongoDB closed connection intentionally.  A reconnect will not be attempted.`);
                return;
            }

            console.log(`MongoDB connection closed.  Attempting to reconnect.`);

            // Remove this handler, since we'll be adding it again later.
            this.client!.removeListener('close', reconnectHandler);

            // Clear up our current properties.
            this.db = undefined;
            this.client = undefined;
            this.intentionalClose = false;

            // Attempt to reconnect.
            this.connect();
        };
        this.client.addListener('close', reconnectHandler);
    }

    /** Closes the connection to the database. */
    async disconnect(): Promise<void> {
        this.intentionalClose = true;
        
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


    async makeCallWithCollection<T, C  extends Document = Document>(collectionName: string, callback: (db: mongo.Db, collection: mongo.Collection<C>) => Promise<T>): Promise<T> {
        let makeConnection = !this.isConnected;
        if (makeConnection) {
            await this.connect();
        }

        try {
            // Get the collection.
            const collection = this.db!.collection<C>(collectionName);

            // Return the result from the callback.
            return await callback(this.db!, collection) as T;
        } finally {
            if (makeConnection) {
                await this.disconnect();
            }
        }
    }
}
