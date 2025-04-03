import { DbService } from "./db-service";
import { ObjectId } from "mongodb";
import { User } from "../model/shared-models/user.model";
import { DbCollectionNames } from "../model/db-collection-names.constants";
import { Chat } from "../model/shared-models/chat-models.model";

export type LogLevelTypes = 'error' | 'info' | 'debug' | 'warn';

export interface LogMessage {
    chat?: Chat,
    chatId?: ObjectId,
    userId?: ObjectId,
    user?: User,
    category?: string,
    level: LogLevelTypes,
    data?: any,
    message: string;
}

/** Provides logging to the MongoDb. */
export class LogDbService extends DbService {

    /** Logs a message to the logging table. */
    async logMessage(message: LogMessage): Promise<void> {
        await this.dbHelper.makeCallWithCollection(DbCollectionNames.Logs, async (db, collection) => {
            await collection.insertOne(message);
        });
    }
}