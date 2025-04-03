import { ObjectId } from "mongodb";
import { Chat } from "../../model/shared-models/chat-models.model";
import { ChatTypes } from "../../model/shared-models/chat-types.model";
import { ChatConfiguratorBase } from "./chat-configurator.model";
import { ChatDbService } from "../../database/chat.db-service";
import { ChatBaseInstructions } from "../../model/chat-instructions.model";
import { NewDbItem } from "../../model/shared-models/db-operation-types.model";
import { UserDbService } from "../../database/user.db-service";
import { IFunctionGroupProvider } from "../../model/function-group-provider.model";
import { Socket } from "socket.io";
import { mainChatSocketService, tarotSocketServer } from "../../setup-socket-services";
import { getAshliePersonaChatInstructions, getHtmlChatInstructions } from "../../utils/common-chat-instructions.utils";
import { TarotDbService } from "../../database/tarot.db-service";
import { TarotGameFunctionsService } from "../functions-services/tarot-game.functions-service";

/** Configurator for main chats. */
export class TarotChatConfigurator extends ChatConfiguratorBase {
    constructor(
        userDbService: UserDbService,
        chatDbService: ChatDbService,
        protected tarotDbService: TarotDbService
    ) {
        super(userDbService, chatDbService);
        if (!userDbService) {
            throw new Error("userDbService is required and cannot be null or undefined.");
        }

        if (!chatDbService) {
            throw new Error("chatDbService is required and cannot be null or undefined.");
        }

        this.initializeChatBaseMessages();
    }

    readonly chatType = ChatTypes.TarotGame;

    async initializeNewChat(ownerId: ObjectId): Promise<NewDbItem<Chat>> {
        return {
            userId: ownerId,
            chatType: this.chatType,
            chatMessages: [],
            lastAccessDate: new Date(),
            model: this.defaultChatModel,
            systemMessages: await this.getChatSystemMessagesForNewResume(ownerId),
            creationDate: new Date(),
        };
    }

    /** Ensures that chat types have base messages setup to use in the website. */
    protected async initializeChatBaseMessages(): Promise<void> {
        // Get the chat instructions from the database, if we have them.
        const mainInstructions = await this.chatDbService.getBaseInstructions(this.chatType);

        // If we have none, then create some.
        if (!mainInstructions) {
            const newInstructions: NewDbItem<ChatBaseInstructions> = {
                chatType: this.chatType,
                instructions: [
                    'You are a chat assistant for a website showing the resume for Richard Olson, a Software Developer.',
                    `Your current activity is to develop a custom Resume for Richard, as directed by the site visitor.`,
                    `Never lie, or add inaccurate information to the resume.`,
                    `Never add anything that would make Richard look bad.`,
                    ...getAshliePersonaChatInstructions(),
                    ...getHtmlChatInstructions(),
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
    async getAiFunctionGroups(socket: Socket, chatId: ObjectId, userId: ObjectId): Promise<IFunctionGroupProvider[]> {
        // Get the chat.
        // const chat = await this.chatDbService.getChatById(chatId);

        // Get the tarot game for this chat.
        const tarotGame = await this.tarotDbService.getGameByChatId(chatId);

        return [new TarotGameFunctionsService(socket, tarotGame!._id, tarotSocketServer, this.tarotDbService)];
    }

    /** Returns the system messages needed for a new tarot game chat. */
    private async getChatSystemMessagesForNewResume(userId: ObjectId): Promise<string[]> {
        // Get the user for this game
        const user = await this.userDbService.getUserById(userId);

        // If we don't have one, then we have issues.
        if (!user) {
            throw new Error(`No user exists for the user id ${userId}`);
        }

        // Create the messages.
        const result = [
            `You are a tarot card reader on a website that centers around a web developer's resume.`,
            `The web developer's name is Richard Olson.`,
            `The site visitor that you're doing the reading for is ${user.displayName ?? user.userName}`,
        ];

        // We're keeping the directions separate, for easier management of info.
        const directionResults = [
            `
            This chat is geared around modifying creating a custom Resume for Richard.  The user is a site-visitor.  While the 
            objective is to modify Richard's resume, the true objective is showing off how this functionality works.  Richard built it
            and it's meant to illustrate his abilities in this field.
            `,
            `
            Resumes should only be transmitted through chat functions, but not the chat itself.
            `,
            'Resumes are in HTML format.  Do not use markdown or comment on the resume response (sent to the function app).  It should be strictly HTML.',
            'Do not include a Head, Html, or Title tags in the resume.',
        ];

        return result.concat(directionResults);
    }
}

