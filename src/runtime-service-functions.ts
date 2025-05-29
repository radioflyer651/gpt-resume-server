import { ObjectId } from "mongodb";
import { JobAnalysis } from "./model/shared-models/job-tracking/job-analysis.model";
import { JobAnalysisFunction } from "./services/llm-functions/job-analysis.llm-function";
import { getAppConfig } from "./config";
import { companyDbService } from "./app-globals";


/** Updates the analysis of a JobDescription through the LLM function, and returns the resulting data. */
export async function updateJobAnalysis(jobId: ObjectId): Promise<JobAnalysis> {
    const config = await getAppConfig();

    // Create the service.
    const service = new JobAnalysisFunction(config.openAiConfig, jobId, companyDbService);

    // Return the result.
    return await service.execute();
}