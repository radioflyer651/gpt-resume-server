import { ObjectId } from "mongodb";
import { AiFunctionGroup } from "../../model/shared-models/functions/ai-function-group.model";
import { LlmFunctionBase } from "./llm-function-base.service";
import { JobListing } from "../../model/shared-models/job-tracking/job-listing.model";
import { OpenAiConfig } from "../../model/app-config.model";
import { JobAnalysis } from "../../model/shared-models/job-tracking/job-analysis.model";
import { FunctionTool } from "../../forwarded-types.model";
import { CompanyManagementDbService } from "../../database/company-management-db.service";
import { jobListingAnalysisProperties_AiFunctions } from "../../ai-functions/common-definitions/job-analysis.ai-definition";
import { OpenAiChatModelValue } from "../../model/shared-models/chat-models.data";

export class JobAnalysisFunction extends LlmFunctionBase<JobAnalysis> {
    constructor(
        config: OpenAiConfig,
        readonly jobDescriptionId: ObjectId,
        readonly companyDbService: CompanyManagementDbService
    ) {
        super(config);

    }

    async getLlmInstructions(): Promise<string[]> {
        // Get the job description.
        const jobListing = await this.getJobById(this.jobDescriptionId);

        // Get the most relevant date for a reference of when this listing was probably added to the system.
        let postingDate = new Date();

        if (jobListing.jobStatuses && jobListing.jobStatuses.length > 0) {
            postingDate = new Date(jobListing.jobStatuses[0].statusDate);
        }

        if (jobListing.postingDate) {
            postingDate = new Date(jobListing.postingDate);
        }

        return [
            `You are a data analyzer for job openings.  You will analyze job descriptions, and organize the important information in a normalized form.`,
            `You will assist in providing clues that might help lead to the hiring manager in another application.  Such clues might be what department the job is in, the team, or project.  Location might be a factor, but anything that might help narrow down the search for the hiring manager should be provided.`,
            `Your analysis must be passed as arguments to the return function tool.`,
            `If the role is not allowed in Minnesota, the posting will either indicate the job is "not remote", or that it might be remote, but only allowed in specific states.`,
            `
                When considering if a job allows people who work in Minnesota, consider the following two questions:
                  - Does the job specifically state that only residents of a certain state will be able to apply?  (If so, and Minnesota (MN) is not in the list, then Minnesotans are not allowed to apply.)
                  - Does the job NOT say it is remote anywhere? (If the job does not say "Remote" anywhere, and DOES list a location, then Minnesotans are not allowed to apply.)
                
                If the previous two questions do not disqualify Minnesotans, then Minnesotans are eligible.
                This information is in regards specifically to the allowWorkInMn property.
            `,
            `The most likely date this posting was copied from the site is ${postingDate.toLocaleDateString()}.  When considering posted date, we only want actual dates, and not a value like "2 days ago".  Dates should be in the form of "MM/dd/yy"`,
            `The following is the job description to analyze: \n\n${jobListing.description}`,
        ];
    }

    get requiredOutputToolName(): string {
        return jobAnalysisAiFunctionDefinition.name;
    }

    get chatModel() {
        return 'o4-mini' as OpenAiChatModelValue;
    }

    async getJobById(jobId: ObjectId): Promise<JobListing> {
        const result = await this.companyDbService.getJobListingById(jobId);
        if (!result) {
            throw new Error(`No company exists with the ID: ${jobId}`);
        }

        return result;
    }

    /** Implemented by the subclass to provide the LLM with tools/functions to call to perform any required tasks. */
    getFunctionGroupsBase(): AiFunctionGroup[] {
        return [
            {
                groupName: 'Job Analysis Functions',
                functions: [
                    {
                        definition: jobAnalysisAiFunctionDefinition,
                        function: (resultValue: any) => resultValue
                    }
                ]
            }
        ];
    }

    protected async processResult(llmResult: JobAnalysis): Promise<JobAnalysis> {
        // Update the data on the job.
        await this.companyDbService.updateJobAnalysisForJob(this.jobDescriptionId, llmResult);

        // Return the result.
        return llmResult;
    }
}


export const jobAnalysisAiFunctionDefinition: FunctionTool = {
    name: 'final_result_call',
    description: 'This method returns the final result from the LLM to be processed by the caller.',
    parameters: jobListingAnalysisProperties_AiFunctions,
    strict: true,
    type: 'function'
};
