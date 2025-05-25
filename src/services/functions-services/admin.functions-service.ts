import { Socket } from "socket.io";
import { AiFunctionGroup } from "../../model/shared-models/functions/ai-function-group.model";
import { FunctionGroupProvider } from "../../model/function-group-provider.model";
import {
    setAllowSoundSiteWide,
    getAllowSoundSiteWide,
    getAllCompanyList,
    addCompanyDefinition
} from "../../ai-functions/admin.ai-functions";
import { AdminDbService } from "../../database/admin-db.service";
import { CompanyManagementDbService } from "../../database/company-management-db.service";
import { AdminSocketService } from "../../server/socket-services/admin.socket-service";

/** Provides the AI site-management functions. */
export class AdminFunctionsService implements FunctionGroupProvider {
    constructor(
        private readonly socket: Socket,
        private readonly adminDbService: AdminDbService,
        private readonly userDbService: CompanyManagementDbService,
        private readonly adminSocketService: AdminSocketService,
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
                    definition: getAllCompanyList,
                    function: this.getAllCompanyList
                },
                {
                    definition: addCompanyDefinition,
                    function: this.addCompanyDefinition
                }
            ]
        };

        return [fnGroup];
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

    /** Implementation for retrieving all company list. */
    private getAllCompanyList = async (): Promise<string> => {
        const result = await this.userDbService.getAllCompanies();

        // Return the list to the AI.
        return JSON.stringify(result);
    };

    /** Implementation for adding a company definition. */
    private addCompanyDefinition = async ({ name, website }: { name: string, website: string; }): Promise<string> => {
        const result = await this.userDbService.addCompany(website, name);
        return `New company Added with ID: ${result?._id}`;
    };
}