import { ObjectId } from "mongodb";
import { Chat } from "../../model/shared-models/chat-models.model";
import { ChatTypes } from "../../model/shared-models/chat-types.model";
import { ChatConfiguratorBase } from "./chat-configurator.model";
import { ChatDbService } from "../../database/chat-db.service";
import { ChatBaseInstructions } from "../../model/chat-instructions.model";
import { NewDbItem } from "../../model/shared-models/db-operation-types.model";
import { getAppConfig } from "../../config";
import * as fs from 'fs/promises';
import { CompanyManagementDbService } from "../../database/company-management-db.service";
import { FunctionGroupProvider } from "../../model/function-group-provider.model";
import { ChatFunctionsService } from "../llm-function-groups/main-chat.functions-service";
import { Socket } from "socket.io";
import { adminSocketService, mainChatSocketService } from "../../setup-socket-services";
import { getAshliePersonaChatInstructions, getHtmlChatInstructions } from "../../utils/common-chat-instructions.utils";
import { adminDbService } from "../../app-globals";
import { AdminFunctionsService } from "../llm-function-groups/admin.functions-service";
import { AuthDbService } from "../../database/auth-db.service";

/** Configurator for main chats. */
export class MainChatConfigurator extends ChatConfiguratorBase {
    constructor(
        authDbService: AuthDbService,
        companyDbService: CompanyManagementDbService,
        chatDbService: ChatDbService,
    ) {
        super(authDbService, companyDbService, chatDbService);
        if (!authDbService) {
            throw new Error("userDbService is required and cannot be null or undefined.");
        }

        if (!chatDbService) {
            throw new Error("chatDbService is required and cannot be null or undefined.");
        }

        this.initializeChatBaseMessages();
    }

    readonly chatType = ChatTypes.Main;

    async initializeNewChat(ownerId: ObjectId): Promise<NewDbItem<Chat>> {
        return {
            userId: ownerId,
            chatType: this.chatType,
            chatMessages: [],
            lastAccessDate: new Date(),
            model: this.defaultChatModel,
            systemMessages: await getSystemMessagesForChatType(this.chatType),
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
                    'Always be sure to introduce yourself.',
                    'Before going too far, try to find out what the visitor is looking for in an employee, so you can tailor your answers.',
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
    async getAiFunctionGroups(socket: Socket, chatId: ObjectId, userId: ObjectId): Promise<FunctionGroupProvider[]> {
        const result: FunctionGroupProvider[] = [new ChatFunctionsService(socket, this.getMainChatSocketService())];

        // Get the user for this.
        const user = await this.userDbService.getUserById(userId);
        if (!user) {
            console.error(`Unable to get user for ID: ${userId}`);
        }

        // If they are an admin, then we need to include the admin functions.
        if (user?.isAdmin) {
            result.push(new AdminFunctionsService(socket, adminDbService, this.companyDbService, adminSocketService, this.chatDbService));
        }

        // Return the result.
        return result;
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
