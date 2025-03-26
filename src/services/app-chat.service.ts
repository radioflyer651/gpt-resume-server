import { ObjectId } from "mongodb";
import { ChatDbService } from "../database/chat-db.service";
import { Chat } from "../model/shared-models/chat-models.model";
import { NewDbItem } from "../model/shared-models/db-operation-types.model";
import { ChatTypes } from "../model/shared-models/chat-types.model";
import { getAppConfig } from "../config";
import * as fs from 'fs/promises';

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

    /** Creates and initializes a specified chat type for a specified user ID. */
    async initializeNewChatOfType(ownerUserId: ObjectId, chatType: ChatTypes): Promise<NewDbItem<Chat>> {
        switch (chatType) {
            case ChatTypes.Main:
                return this.initializeNewMainChat(ownerUserId);
            default:
                throw new Error(`The chat type '${chatType}' is not supported.`);
        }
    }

    /** Returns a new Chat object for the 'Main" type. */
    async initializeNewMainChat(ownerUserId: ObjectId): Promise<NewDbItem<Chat>> {
        return {
            userId: ownerUserId,
            chatType: ChatTypes.Main,
            chatMessages: [],
            lastAccessDate: new Date(),
            model: 'gpt-4o-mini',
            systemMessages: await getSystemMessagesForChatType(ChatTypes.Main),
            creationDate: new Date(),
        };
    }
}

async function getSystemMessagesForChatType(chatType: ChatTypes): Promise<string[]> {
    switch (chatType) {
        case ChatTypes.Main:
            return await getMainSystemMessages();
        default:
            throw new Error(`Unexpected chat type: ${chatType}`);
    }
}

async function getMainSystemMessages(): Promise<string[]> {
    // Get the configuration.
    const config = await getAppConfig();

    const result = [
        'You are a chat assistant for a website showing the resume for Richard Olson, a Software Developer.',
        'You are charming and witty.  Your job is to woo the visitor, and make them laugh.',
        'Your name is Ashlie, a goth woman, who is sarcastic and a bit dry.',
        'Always be sure to introduce yourself.',
        'All responses should be in HTML format.  Do not use markdown or mark up the response.  It should be strictly HTML.',
        'Do not include a Head, Html, or Title tag in your replies.  They should be just the content, as this is already in a webpage.',
        'Be creative and stylish in your replies.',
        'Before going too far, try to find out what the visitor is looking for in an employee, so you can tailor your answers.',
        'Add color and styling to the text, when appropriate, to make important keywords or facts stand out.',
        `Don't get too wordy with your replies, unless they absolutely need to be.`,
        `The background color of your messages is 'gray' (in CSS), so avoid colors that don't contrast well with it.`,
    ];

    // Get any file data to include.
    for (let f of config.infoFiles) {
        // Get this file.
        const fileContent = await fs.readFile(f, 'utf8');
        result.push(fileContent);
    }

    return result;
}