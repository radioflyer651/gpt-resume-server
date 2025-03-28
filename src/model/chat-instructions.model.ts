import { ObjectId } from "mongodb";
import { ChatTypes } from "./shared-models/chat-types.model";

/** For a given chat type, this is the base instructions to be used in the chat. */
export interface ChatBaseInstructions {
    _id: ObjectId;

    /** Gets or sets the type of chat this is for. */
    chatType: ChatTypes;

    /** The instructions to the give to the chat as a system message. */
    instructions: string[];
}
