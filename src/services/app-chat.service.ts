import { ObjectId } from "mongodb";
import { ChatDbService } from "../database/chat-db.service";
import { Chat } from "../model/chat-models.model";
import { NewDbItem } from "../model/db-operation-types.model";
import { ChatTypes } from "../model/chat-types.model";

/** Provides application-context specific chat functionality. */
export class AppChatService {
    constructor(private readonly chatDbService: ChatDbService) {

    }

    /** Retrieves a specified chat type, for a specified user ID, from the database. If one does not exist,
     *   then one is created, initialized, saved, and returned. */
    async getOrCreateChatOfType(userId: ObjectId, chatType: ChatTypes): Promise<Chat> {
        // Try to get an existing chat.
        const existingChat = await this.chatDbService.getLastAccessedChat(userId, chatType);

        // If found, return it.
        if (existingChat) {
            return existingChat;
        }

        // Create a new one.
        let newChat: Chat | NewDbItem<Chat> = this.initializeNewMainChat(userId);

        // Save it to the database.
        newChat = await this.chatDbService.upsertChat(newChat);

        // Return the new chat.
        return newChat as Chat;
    }

    /** Returns a new Chat object for the 'Main" type. */
    initializeNewMainChat(ownerUserId: ObjectId): NewDbItem<Chat> {
        return {
            userId: ownerUserId,
            chatType: ChatTypes.Main,
            chatMessages: [],
            lastAccessDate: new Date(),
            model: '',
            systemMessages: []
        };
    }
}