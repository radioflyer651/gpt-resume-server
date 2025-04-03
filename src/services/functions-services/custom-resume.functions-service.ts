import { Socket } from "socket.io";
import { IFunctionGroupProvider as IFunctionGroupProvider } from "../../model/function-group-provider.model";
import { AiFunctionGroup } from "../../model/shared-models/functions/ai-function-group.model";
import { ObjectId } from "mongodb";
import { updateCustomResumeDefinition } from "../../ai-functions/custom-resume.ai-functions";
import { CustomResumeDbService } from "../../database/custom-resume.db-service";
import { CustomResumeSocketService } from "../../server/socket-services/custom-resume.socket-service";

export class CustomResumeFunctionsService implements IFunctionGroupProvider {
    constructor(
        readonly socket: Socket,
        readonly customResumeSocketService: CustomResumeSocketService,
        readonly customResumeDbService: CustomResumeDbService,
    ) {

    }

    /** AI Function to update a specified CustomResume. */
    async updateResume({ resumeId, newContent }: { resumeId: ObjectId, newContent: string; }): Promise<string> {
        await this.customResumeDbService.updateCustomResumeById(resumeId, newContent);
        // Get the full record from the database now.
        const resume = await this.customResumeDbService.getResumeById(resumeId);
        if (!resume) {
            throw new Error('Resume with the specified ID does not exist.');
        }
        
        await this.customResumeSocketService.sendNewResume(this.socket, resume);
        return 'Resume has been updated.';
    }

    getFunctionGroups(): AiFunctionGroup[] {
        return [{
            groupName: 'Custom Resume Functions',
            functions: [{
                function: this.updateResume,
                definition: updateCustomResumeDefinition
            }]
        }];
    }

}