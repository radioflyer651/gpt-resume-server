import { ObjectId } from "mongodb";


interface QuickJobSetupRequestBase {
    jobLink: string;

    jobDescription: string;
}

export interface QuickJobCompanyInfo {
    companyName: string | undefined;

    companyWebsite: string;

    companyJobsSite: string | undefined;

}

/** The API result of performing the QuickJobSetup function. */
export interface QuickJobSetupResult {
    companyId: ObjectId;
    jobDescriptionId: ObjectId;
}


/** Provides all information needed to create a new job posting with just the description. */
export type QuickJobSetupRequest = QuickJobSetupRequestBase &
    ({ companyInfo: QuickJobCompanyInfo; } | { _id: ObjectId; });
