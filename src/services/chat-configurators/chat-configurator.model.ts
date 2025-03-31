import { ObjectId } from "mongodb";
import { ChatTypes } from "../../model/shared-models/chat-types.model";
import { Chat } from "../../model/shared-models/chat-models.model";
import { NewDbItem } from "../../model/shared-models/db-operation-types.model";
import { FunctionGroupProvider } from "../../model/function-group-provider.model";
import { UserDbService } from "../../database/user-db.service";
import { Socket } from "socket.io";
import { ChatDbService } from "../../database/chat-db.service";

/** Provides services for specific types of chats, configuring them for use and
 *    providing services required for LLM chat calls.
 */
export abstract class ChatConfiguratorBase {
    constructor(
        protected userService: UserDbService,
        protected chatDbService: ChatDbService,
    ) { 
        if (!userService) {
            throw new Error("UserDbService is required but was not provided.");
        }

        if (!chatDbService) {
            throw new Error("ChatDbService is required but was not provided.");
        }
    }

    /** The chat type that this class configures.  Each configurator can only
     *   configure a single chat type. */
    abstract readonly chatType: ChatTypes;

    /** Creates a base Chat configuration that can be modified to suit. */
    protected initializeGenericChat(ownerUserId: ObjectId) {
        return {
            userId: ownerUserId,
            chatType: this.chatType,
            chatMessages: [],
            lastAccessDate: new Date(),
            model: 'gpt-4o-mini',
            systemMessages: [],
            creationDate: new Date(),
        };
    }

    /** Returns a set of strings needed for system messages that are not permanently part of the chat itself.
     *   Possibly, things like the current time, etc. The base method returns values from the database, so any
     *   overrides should include the base's values. */
    getSystemMessagesForChatCall(): Promise<string[]> {
        return this.getInstructionsFromDatabase();
    }

    /** Returns the default chat model to use when creating new chats. */
    protected readonly defaultChatModel = 'gpt-4o-mini';

    /** Returns a newly initialized chat, configured for the type of chat this configurator services. */
    abstract initializeNewChat(ownerId: ObjectId): Promise<NewDbItem<Chat>>;

    /** Returns the set of FunctionGroupProvider, defining what sort of functions the AI can
     *   execute in this sort of chat. */
    getAiFunctionGroups(socket: Socket): Promise<FunctionGroupProvider[]> {
        return Promise.resolve([]);
    }

    /** Returns any system messages to be included in the chat call, based on the specific chat itself.  */
    async getChatSpecificSystemInfoMessages(chat: Chat): Promise<string[]> {
        return this.getChatInfoForSystem(chat);
    }

    /** Returns a user and company for a specified chat. */
    protected async getUserInfoForChat(chat: Chat) {

        // Get the user information for this chat.
        const user = await this.userService.getUserById(chat.userId);

        // Return an empty set if nothing was found.
        if (!user) {
            return {
                user,
                company: undefined
            };
        }

        // Get the company.
        const company = await this.userService.getCompanyById(user?.companyId);

        // Return the set.
        return {
            user,
            company
        };
    }

    /** Using the getUserInfoForChat method, returns a set of information useful for a chat dialog, such as user's name, and things like that. */
    protected async getChatInfoForSystem(chat: Chat): Promise<string[]> {
        // Get the user information for this chat.
        const userInfo = await this.getUserInfoForChat(chat);

        // Create information about this chat.
        const chatInfo: string[] = [
            `Chat ObjectID: ${chat._id.toHexString()}`,
            `User ObjectId: ${chat.userId.toHexString()}`,
        ];

        function addParts(recordName: string, target: any): void {
            if (!target) {
                return;
            }

            for (let n in target) {
                const curVal = target[n];
                if (curVal) {
                    if (typeof curVal === 'string' || curVal instanceof ObjectId) {
                        chatInfo.push(`${recordName} property: ${n} = ${curVal.toString()}`);
                    }
                }
            }
        }

        addParts(`User`, userInfo.user);
        addParts(`User's Company`, userInfo.company);

        if (userInfo.user?.userName) {
            chatInfo.push(`The user's name is ${userInfo.user.userName}.`);
        }

        return chatInfo;
    }

    /** Returns the chat configuration instructions from the database, if there are any. */
    protected async getInstructionsFromDatabase(): Promise<string[]> {
        const result = await this.chatDbService.getBaseInstructions(this.chatType);
        return result?.instructions ?? [];
    }
}