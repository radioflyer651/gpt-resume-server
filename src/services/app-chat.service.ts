import { ObjectId } from "mongodb";
import { ChatDbService } from "../database/chat.db-service";
import { Chat } from "../model/shared-models/chat-models.model";
import { NewDbItem } from "../model/shared-models/db-operation-types.model";
import { ChatTypes } from "../model/shared-models/chat-types.model";
import { ChatConfiguratorBase } from "./chat-configurators/chat-configurator.model";

/** Provides application-context specific chat functionality. */
export class AppChatService {
    constructor(
        private readonly chatDbService: ChatDbService,
        private readonly chatConfigurations: ChatConfiguratorBase[]
    ) {
        if (!chatDbService) {
            throw new Error("chatDbService cannot be null or undefined.");
        }

        if (!chatConfigurations) {
            throw new Error("chatConfigurations cannot be null or undefined.");
        }
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
        let newChat: Chat | NewDbItem<Chat> = await this.initializeNewChatOfType(userId, chatType);

        // Save it to the database.
        newChat = await this.chatDbService.upsertChat(newChat);

        // Return the new chat.
        return newChat as Chat;
    }

    /** Creates a new chat, of a specified type, for a specified user. */
    async startNewChatOfType(userId: ObjectId, chatType: ChatTypes): Promise<Chat> {
        // Create the new chat of the specified type.
        const newChat = await this.initializeNewChatOfType(userId, chatType);

        // Save it.
        await this.chatDbService.upsertChat(newChat);

        // Return it.  (Recast, because we know it has an ID now.)
        return newChat as Chat;
    }

    /** Returns the configurator for a specified chat type.  If not found, throws an error. */
    protected getConfiguratorForChatType(chatType: ChatTypes): ChatConfiguratorBase {
        // Find the configurator for the chat type we need.
        const configurator = this.chatConfigurations.find(c => c.chatType === chatType);

        // If not found, then we have issues.
        if (!configurator) {
            throw new Error(`No configurator found for chat type: ${chatType}`);
        }

        return configurator;
    }

    /** Creates and initializes a specified chat type for a specified user ID. */
    async initializeNewChatOfType(userId: ObjectId, chatType: ChatTypes): Promise<NewDbItem<Chat>> {
        // Get the configurator for this chat type.
        const configurator = this.getConfiguratorForChatType(chatType);

        // Return the configured chat.
        return configurator.initializeNewChat(userId);
    }
}
