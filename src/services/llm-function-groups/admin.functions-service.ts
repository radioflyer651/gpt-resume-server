import { Socket } from "socket.io";
import { AiFunctionGroup } from "../../model/shared-models/functions/ai-function-group.model";
import { FunctionGroupProvider } from "../../model/function-group-provider.model";
import {
    setAllowSoundSiteWide,
    getAllowSoundSiteWide,
    changeChatModelDefinition,
    listChatModelsDefinition,
    getChatModelDefinition
} from "../../ai-functions/admin.ai-functions";
import { AdminDbService } from "../../database/admin-db.service";
import { CompanyManagementDbService } from "../../database/company-management-db.service";
import { AdminSocketService } from "../../server/socket-services/admin.socket-service";
import { CompaniesAiFunctionGroup } from "./companies.ai-function-group";
import { ProgrammerAiFunctionGroup } from "./programming.ai-function-group";
import { openAiChatModels } from "../../model/shared-models/chat-models.data";
import { ChatDbService } from "../../database/chat-db.service";
import { ObjectId } from "mongodb";
import { FunctionTool } from "../../forwarded-types.model";

/** Provides the AI site-management functions. */
export class AdminFunctionsService implements FunctionGroupProvider {
    constructor(
        private readonly socket: Socket,
        private readonly adminDbService: AdminDbService,
        private readonly companyDbService: CompanyManagementDbService,
        private readonly adminSocketService: AdminSocketService,
        private readonly chatDbService: ChatDbService,
    ) {

    }

    /** Returns all function groups that this chat service can provide. */
    getFunctionGroups = (): AiFunctionGroup[] => {
        const fnGroup: AiFunctionGroup = {
            groupName: 'Admin Functions',
            functions: [
                {
                    definition: setAllowSoundSiteWide,
                    function: this.setAllowSoundSiteWide
                },
                {
                    definition: getAllowSoundSiteWide,
                    function: this.getAllowSoundSiteWide
                },
                {
                    definition: changeChatModelDefinition,
                    function: (params: { chatModel: string, chatId: string; }) => this.changeChatModel(params)
                },
                {
                    definition: listChatModelsDefinition,
                    function: () => this.getChatModelList()
                },
                {
                    definition: getChatModelDefinition,
                    function: (params: { chatId: string; }) => this.getChatModelForChatId(params)
                },
                {
                    definition: updateComments,
                    function: () => this.updateComments()
                },
            ],
        };

        return [
            fnGroup,
            new CompaniesAiFunctionGroup(this.companyDbService),
            new ProgrammerAiFunctionGroup()
        ];
    };

    /** Implementation for setting site-wide sound allowance. */
    private setAllowSoundSiteWide = async ({ value }: { value: boolean; }): Promise<string> => {
        await this.adminDbService.setAllowAudioChat(value);
        // Get the new settings.
        const settings = await this.adminDbService.getSiteSettings();
        // Broadcast this to users.
        this.adminSocketService.sendSiteSettings(settings!);

        return `Set the site-wide sound allowance to: ${value}`;
    };

    /** Implementation for getting site-wide sound allowance. */
    private getAllowSoundSiteWide = async (): Promise<string> => {
        const value = await this.adminDbService.getAllowAudioChat();
        return `Allow Audio Chat Site Wide: ${value}`;
    };

    private changeChatModel = async ({ chatModel, chatId }: { chatModel: string, chatId: string; }): Promise<string> => {
        // Validate the model id.
        if (!openAiChatModels.some(x => x.value === chatModel)) {
            return `Invalid chat model.  Please consult the list of chat models to find the right one.`;
        }

        await this.chatDbService.changeChatModelForChatId(new ObjectId(chatId), chatModel);
        return `The model has been changed to ${chatModel}`;
    };

    private getChatModelForChatId = async ({ chatId }: { chatId: string; }): Promise<string> => {
        // Get the chat.
        const chat = await this.chatDbService.getChatById(new ObjectId(chatId));

        // If there's no chat - we can't do anything.
        if (!chat) {
            return `ERROR: No chat exists with the ID ${chatId}`;
        }

        // Return the value.
        return chat.model ?? `No chat set on the chat session.  Using default.`;
    };

    private getChatModelList = async () => {
        return JSON.stringify(openAiChatModels);
    };

    private updateComments = async () => {
        this.companyDbService.refactorComments();

        return 'complete';
    };
};


const updateComments: FunctionTool = {
    name: 'update_comments',
    type: 'function',
    description: `(Admin Function) Refactors comments on specific items in the database, to a new form.`,
    parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
    },
    strict: true
};
