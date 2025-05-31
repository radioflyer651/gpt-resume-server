import { ObjectId } from "mongodb";


export interface ChatMemory {
    _id: ObjectId;

    /** The ID of the user that was being talked to when storing this data. */
    userId: ObjectId;

    /** The object ID of the chat that this memory item was triggered from, if any. */
    originatingChatId: ObjectId;

    /** Short description of this data item. */
    subject: string;

    /** A list of topics this data can pertain to. */
    tags: string[];

    /** The full data to be stored. */
    detail: string;
}

