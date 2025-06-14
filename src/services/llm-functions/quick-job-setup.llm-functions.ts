import { ObjectId } from "mongodb";
import { OpenAiConfig } from "../../model/app-config.model";
import { AiFunctionGroup } from "../../model/shared-models/functions/ai-function-group.model";
import { isQuickJobSetupRequest } from "../../utils/quick-job-validation.utils";
import { LlmFunctionBase } from "./llm-function-base.service";
import { CompanyManagementDbService } from "../../database/company-management-db.service";
import { Comment } from '../../model/shared-models/comments.model';
import { JobListing } from "../../model/shared-models/job-tracking/job-listing.model";
import { OpenAiChatModelValue } from "../../model/shared-models/chat-models.data";
import { QuickJobSetupResult, QuickJobSetupRequest } from "../../model/shared-models/quick-job-setup-request.model";
import { getCommonAnalysisLlmInstructions, jobAnalysisAiFunctionDefinition } from "./job-analysis.llm-function";
import { NewDbItem } from "../../model/shared-models/db-operation-types.model";
import { JobAnalysis } from "../../model/shared-models/job-tracking/job-analysis.model";

export class QuickJobSetupFunction extends LlmFunctionBase<QuickJobSetupResult, JobAnalysis> {
    constructor(
        config: OpenAiConfig,
        private companyDbService: CompanyManagementDbService,
        private quickJobSetupRequest: QuickJobSetupRequest,
    ) {
        super(config);
    }

    async getLlmInstructions(): Promise<string[]> {
        return [
            ...getCommonAnalysisLlmInstructions(),
            `Todays date is ${new Date().toDateString()}`,
            `The following is the job description to analyze: \n\n${this.quickJobSetupRequest.jobDescription}`,
        ];
    }

    requiredOutputToolName = jobAnalysisAiFunctionDefinition.name;

    getFunctionGroupsBase(): AiFunctionGroup[] {
        return [{
            groupName: 'Job Creation Functions',
            functions: [
                {
                    definition: jobAnalysisAiFunctionDefinition,
                    // Normally this should be a string, but since our process never
                    //  hands this back to the LLM, we don't have to deal with it.
                    function: (resultValue) => resultValue
                }
            ]
        }];
    }

    chatModel = 'o4-mini' as OpenAiChatModelValue;

    /** Gets or sets the ID of the company that the request will be added to. */
    private companyId!: ObjectId;

    /** Gets or sets the ID of the job posting.  This will be used to perform
     *   the analysis on the job posting. */
    private jobListingId!: ObjectId;

    protected async processResult(llmAnalysis: JobAnalysis): Promise<QuickJobSetupResult> {
        // Get the job from the database again.
        const jobListing = (await this.companyDbService.getJobListingById(this.jobListingId))!;

        // Update the fields on the listing, using the analysis.
        jobListing.jobTitle = llmAnalysis.jobTitle ?? '';
        jobListing.analysis = llmAnalysis;
        jobListing.postingDate = new Date();

        // Update the posting in the database.
        await this.companyDbService.upsertCompanyJobListing(jobListing);

        // Return the IDS of the company and the job.
        return {
            companyId: this.companyId!,
            jobDescriptionId: this.jobListingId,
        };
    }

    async initialize(): Promise<void> {
        // Validate the request.
        if (!isQuickJobSetupRequest(this.quickJobSetupRequest)) {
            throw new Error(`request is invalid.`);
        }

        // Ensure the company ID gets set.
        await this.setCompanyId();

        // Now, create the job listing.
        await this.createJobListing();
    }

    /** Attempts to find or create a new company from the info in the request. */
    private async setCompanyId(): Promise<void> {
        // Check for the id.
        if ('_id' in this.quickJobSetupRequest) {
            this.companyId = this.quickJobSetupRequest._id;
            return;
        }

        // We must have company info then:
        const companyInfo = this.quickJobSetupRequest.companyInfo;

        // Try to find the company by website.
        const company = await this.companyDbService.getCompanyByDomain(companyInfo.companyWebsite);

        // If found, then set the ID, and be done.
        if (company) {
            this.companyId = company._id;
            return;
        }

        // If we don't have the company this way, then we need to ensure we have the company name.
        if (!companyInfo.companyName) {
            throw new Error(`Company website ${companyInfo.companyWebsite} was not found.  companyName is required (and missing) to create a new company.`);
        }

        // It doesn't exist, so we'll have to create a new one.
        const newCompany = await this.companyDbService.upsertCompany({
            name: companyInfo.companyName,
            website: this.getWebSiteFromUrl(companyInfo.companyWebsite),
            jobsSite: companyInfo.companyJobsSite,
            comments: [] as Comment[]
        });

        // Set the company ID now.
        this.companyId = newCompany._id;
    }

    getWebSiteFromUrl(url: string): string {
        // Message the website so it's the way we want it.
        const webMatch = /(htts?:\/\/)?(?<domain>([\w\d\-_]+\.)+([\w\d]+))/i.exec(url);

        // If no match, then just exit with the URL as-is.
        if (!webMatch) {
            return url;
        }

        // Get the domain we found.
        let domain = webMatch.groups!['domain'];

        // Check if we need to add www to it.
        if (!domain.startsWith('www.')) {
            domain = 'www.' + domain;
        }

        // Return it.
        return domain;
    }

    /** Creates the new job posting so we can do the analysis for it. */
    private async createJobListing(): Promise<void> {
        const newJob: NewDbItem<JobListing> = {
            companyId: this.companyId,
            jobStatuses: [],
            comments: [],
            description: this.quickJobSetupRequest.jobDescription,
            urlLink: this.quickJobSetupRequest.jobLink,
            jobTitle: '',
        };

        // Push this to the database.
        const result = await this.companyDbService.upsertCompanyJobListing(newJob);
        this.jobListingId = result._id;
    }
}

