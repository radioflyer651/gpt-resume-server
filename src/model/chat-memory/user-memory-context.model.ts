import { ObjectId } from "mongodb";

/** Acts as persistent, immediate memory, for when interacting with a user. */
export interface UserMemoryContext {
    /** This is the same as the ID of the user that this context belongs to. */
    _id: ObjectId;

    /** A list of ChatMemory items that are currently part of this context. */
    chatMemoryItems: ObjectId[];

    /** Gets or sets the current topic being discussed - if any. */
    currentTopic: string;
}

export interface ChatMemoryContextItem {
    /** The ID of the memory context item. */
    _id: ObjectId;

    /** When set to true, this item could be removed from the context, potentially at the next chat interaction.  It's best to pin these in place if you want to keep them longer. */
    isEphemeral: boolean;

    /** A reason why this item is being included in the context. */
    inclusionBasis: string;
}