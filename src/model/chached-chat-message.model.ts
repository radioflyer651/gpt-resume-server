import { ObjectId } from "mongodb";


/** Since chat API calls must be done in 2 steps, this holds the chat
 *   message to be called in the future. */
export interface CachedChatMessage {
    _id: ObjectId;
    userId: ObjectId;
    content: string;
    createdAt: Date;
}