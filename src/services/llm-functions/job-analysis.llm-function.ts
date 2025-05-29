import { ObjectId } from "mongodb";
import { AiFunctionDefinitionPackage, AiFunctionGroup } from "../../model/shared-models/functions/ai-function-group.model";
import { LlmFunctionBase } from "./llm-function-base.service";
import { JobListing } from "../../model/shared-models/job-tracking/job-listing.model";
import { OpenAiConfig } from "../../model/app-config.model";
import { JobAnalysis } from "../../model/shared-models/job-tracking/job-analysis.model";
import { FunctionTool } from "../../forwarded-types.model";
import { CompanyManagementDbService } from "../../database/company-management-db.service";

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
            `Your analysis must be passed as arguments to the return function tool.`,
            `If the role is not allowed in Minnesota, the posting will either indicate the job is "not remote", or that it might be remote, but only allowed in specific states.`,
            `The most likely date this posting was copied from the site is ${postingDate.toLocaleDateString()}.  When considering posted date, we only want actual dates, and not a value like "2 days ago".  Dates should be in the form of "MM/dd/yy"`,
            `The following is the job description to analyze: \n\n${jobListing.description}`,
        ];
    }

    get requiredOutputToolName(): string {
        return jobAnalysisAiFunctionDefinition.name;
    }

    get chatModel() {
        return 'gpt-4.1-nano';
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
    parameters: {
        type: 'object',
        "required": [
            "companyName",
            "jobTitle",
            "companyDescription",
            "datePosted",
            "jobLocation",
            "isContactRole",
            "allowWorkInMn",
            "minCompensation",
            "maxCompensation",
            "jobDescription",
            "jobDuties",
            "educationRequirements",
            "requiredSkillList",
            "optionalSkillList",
            "otherQualifyingInfo",
            "otherInformation",
            "requiredTechnologies",
            "bonusTechnologies",
        ],
        "properties": {
            "companyName": {
                "type": "string",
                "description": "The name of the company, if found in the job description"
            },
            "jobTitle": {
                "type": "string",
                "description": "The title of the job opening, it's available."
            },
            "companyDescription": {
                "type": "string",
                "description": "A description of the job"
            },
            "datePosted": {
                "type": "string",
                "description": "If found, the date this job opening was posted"
            },
            "jobLocation": {
                "type": "string",
                "description": "The location that this job reports to, preferably city/state"
            },
            "isContactRole": {
                "type": "boolean",
                "description": "Indicates if this job is a contractor role"
            },
            "allowWorkInMn": {
                "type": "boolean",
                "description": "Indicates whether this position is open to minnesotans"
            },
            "minCompensation": {
                "type": "string",
                "description": "The minimum compensation listed, if any found"
            },
            "maxCompensation": {
                "type": "string",
                "description": "The maximum compensation listed, if any found"
            },
            "jobDescription": {
                "type": "string",
                "description": "A description of the job"
            },
            "jobDuties": {
                "type": "array",
                "description": "A list of duties described by the job",
                "items": {
                    "type": "string"
                }
            },
            "educationRequirements": {
                "type": "string",
                "description": "Educational requirements listed by the job"
            },
            "requiredTechnologies": {
                "type": "array",
                "description": "Technologies the applicant must know to be qualified",
                "items": {
                    "type": "string"
                }
            },
            "bonusTechnologies": {
                "type": "array",
                "description": "Technologies the company would like the candidate to know, but is not required.",
                "items": {
                    "type": "string"
                }
            },
            "requiredSkillList": {
                "type": "array",
                "description": "A list of skills that are required for this position",
                "items": {
                    "type": "string"
                }
            },
            "optionalSkillList": {
                "type": "array",
                "description": "A list of skills that are listed as preferred",
                "items": {
                    "type": "string"
                }
            },
            "otherQualifyingInfo": {
                "type": "array",
                "description": "A list of any qualifying information found in the job description",
                "items": {
                    "type": "string"
                }
            },
            "otherInformation": {
                "type": "array",
                "description": "A list of any other interesting information found in the job description",
                "items": {
                    "type": "string"
                }
            }
        },
        "additionalProperties": false
    },
    strict: true,
    type: 'function'
};
