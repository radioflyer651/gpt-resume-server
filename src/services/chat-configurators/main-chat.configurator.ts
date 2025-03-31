import { ObjectId } from "mongodb";
import { Chat } from "../../model/shared-models/chat-models.model";
import { ChatTypes } from "../../model/shared-models/chat-types.model";
import { ChatConfiguratorBase } from "./chat-configurator.model";
import { ChatDbService } from "../../database/chat-db.service";
import { ChatBaseInstructions } from "../../model/chat-instructions.model";
import { NewDbItem } from "../../model/shared-models/db-operation-types.model";
import { getAppConfig } from "../../config";
import * as fs from 'fs/promises';
import { UserDbService } from "../../database/user-db.service";
import { FunctionGroupProvider } from "../../model/function-group-provider.model";
import { ChatFunctionsService } from "../functions-services/main-chat.functions-service";
import { Socket } from "socket.io";
import { mainChatSocketService } from "../../setup-socket-services";

/** Configurator for main chats. */
export class MainChatConfigurator extends ChatConfiguratorBase {
    constructor(
        userDbService: UserDbService,
        chatDbService: ChatDbService,
    ) {
        super(userDbService, chatDbService);
        if (!userDbService) {
            throw new Error("userDbService is required and cannot be null or undefined.");
        }

        if (!chatDbService) {
            throw new Error("chatDbService is required and cannot be null or undefined.");
        }
    }

    readonly chatType = ChatTypes.Main;

    async initializeNewChat(ownerId: ObjectId): Promise<NewDbItem<Chat>> {
        return {
            userId: ownerId,
            chatType: ChatTypes.Main,
            chatMessages: [],
            lastAccessDate: new Date(),
            model: this.defaultChatModel,
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

    /** We have to get this from the global definitions, because of circular reference issues.
     *   Time doesn't permit this to be re-engineered at this time. (lesser of twp weevils)*/
    protected getMainChatSocketService() {
        return mainChatSocketService;
    }

    /** Returns the set of FunctionGroupProvider, defining what sort of functions the AI can
     *   execute in this sort of chat. */
    async getAiFunctionGroups(socket: Socket): Promise<FunctionGroupProvider[]> {
        return [new ChatFunctionsService(socket, this.getMainChatSocketService())];
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

/** Returns system messages to be used in INITIALIZATION, and stored along with the chat in the database. */
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

    const result = [];

    // Get any file data to include.
    for (let f of config.infoFiles) {
        // Get this file.
        const fileContent = await fs.readFile(f, 'utf8');
        result.push(fileContent);
    }

    return result;
}
