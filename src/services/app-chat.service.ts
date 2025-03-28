import { ObjectId } from "mongodb";
import { ChatDbService } from "../database/chat-db.service";
import { Chat } from "../model/shared-models/chat-models.model";
import { NewDbItem } from "../model/shared-models/db-operation-types.model";
import { ChatTypes } from "../model/shared-models/chat-types.model";
import { getAppConfig } from "../config";
import * as fs from 'fs/promises';
import { ChatBaseInstructions } from "../model/chat-instructions.model";

/** Provides application-context specific chat functionality. */
export class AppChatService {
    constructor(private readonly chatDbService: ChatDbService) {

    }

    /** Performs any initialization required by this class. */
    async initialize(): Promise<void> {
        await this.initializeChatBaseMessages();
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

    /** Ensures that chat types have base messages setup to use in the website. */
    private async initializeChatBaseMessages(): Promise<void> {
        // We only have Main right now.
        const mainInstructions = await this.chatDbService.getBaseInstructions(ChatTypes.Main);

        // If we have none, then create some.
        if (!mainInstructions) {
            const newInstructions: NewDbItem<ChatBaseInstructions> = {
                chatType: ChatTypes.Main,
                instructions: [
                    'You are a chat assistant for a website showing the resume for Richard Olson, a Software Developer.',
                    'You are charming and witty.  Your job is to woo the visitor, and make them laugh.',
                    'Your name is Ashlie, a goth woman, who is sarcastic and a bit dry.',
                    'Always be sure to introduce yourself.',
                    'Be creative and stylish in your replies.  Add color to your HTML messages when possible.',
                    'Before going too far, try to find out what the visitor is looking for in an employee, so you can tailor your answers.',
                    `Don't get too wordy with your replies, unless they absolutely need to be.`,
                    ...getHtmlMessageInstructions()
                ]
            };

            await this.chatDbService.upsertChatBaseInstructions(newInstructions);
        }

    }
}

/** Returns system messages to be used in INITIALIZATION, and stored along with the chat in the database. */
async function getSystemMessagesForChatType(chatType: ChatTypes): Promise<string[]> {
    switch (chatType) {
        case ChatTypes.Main:
            return await getMainSystemMessages();
        default:
            throw new Error(`Unexpected chat type: ${chatType}`);
    }
}

/** Returns the instructions to include in chat instructions for using HTML in the responses. */
function getHtmlMessageInstructions(backgroundColor: string | undefined = 'gray', addColorAndStyle: boolean = true): string[] {
    const result = [
        'All responses should be in HTML format.  Do not use markdown or mark up the response.  It should be strictly HTML.',
        'Do not include a Head, Html, or Title tag in your replies.  They should be just the content, as this is already in a webpage.',
    ];

    if (backgroundColor) {
        result.push(`The background color of your messages is '${backgroundColor}' (in CSS), so avoid colors that don't contrast well with it.`);
    }

    if (addColorAndStyle) {
        result.push('Add color and styling to the text, when appropriate, to make important keywords or facts stand out.');
        result.push('The chat area is only around 450px x 350px, so be careful not to use fonts and elements that take up too much space.  Alter the size of the font if needed.');
    }

    return result;
}

async function getMainSystemMessages(): Promise<string[]> {
    // Get the configuration.
    const config = await getAppConfig();

    // const result = [
    //     'You are a chat assistant for a website showing the resume for Richard Olson, a Software Developer.',
    //     'You are charming and witty.  Your job is to woo the visitor, and make them laugh.',
    //     'Your name is Ashlie, a goth woman, who is sarcastic and a bit dry.',
    //     'Always be sure to introduce yourself.',
    //     'Be creative and stylish in your replies.',
    //     'Before going too far, try to find out what the visitor is looking for in an employee, so you can tailor your answers.',
    //     `Don't get too wordy with your replies, unless they absolutely need to be.`,
    //     ...getHtmlMessageInstructions()
    // ];

    const result = [];

    // Get any file data to include.
    for (let f of config.infoFiles) {
        // Get this file.
        const fileContent = await fs.readFile(f, 'utf8');
        result.push(fileContent);
    }

    return result;
}