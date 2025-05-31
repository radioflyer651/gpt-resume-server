
import { AiFunctionGroup } from "../../model/shared-models/functions/ai-function-group.model";
import { LlmFunctionBase } from "./llm-function-base.service";
import { OpenAiConfig } from "../../model/app-config.model";
import { JobAnalysis } from "../../model/shared-models/job-tracking/job-analysis.model";
import { CompanyManagementDbService } from "../../database/company-management-db.service";
import { createJobListing } from "../../ai-functions/jobs.ai-functions";
import { CompaniesAiFunctionGroup } from "./companies.ai-function-group";

/** LLM Function that generates an analysis about the job, and then creates a company (if needed), and the related job. */
export class SetupAllFromJobFunction extends LlmFunctionBase<JobAnalysis> {
    constructor(
        config: OpenAiConfig,
        readonly jobDescription: string,
        readonly companyDbService: CompanyManagementDbService
    ) {
        super(config);

    }

    async getLlmInstructions(): Promise<string[]> {
        // Get the most relevant date for a reference of when this listing was probably added to the system.
        let todaysDate = new Date();

        return [

        ];
    }

    get requiredOutputToolName(): string {
        return createJobListing.name;
    }

    get chatModel() {
        return 'gpt-4o-mini';
    }


    /** Implemented by the subclass to provide the LLM with tools/functions to call to perform any required tasks. */
    getFunctionGroupsBase(): AiFunctionGroup[] {
        return [
            new CompaniesAiFunctionGroup(this.companyDbService)
        ];
    }

    protected async processResult(llmResult: JobAnalysis): Promise<JobAnalysis> {

    }
}

