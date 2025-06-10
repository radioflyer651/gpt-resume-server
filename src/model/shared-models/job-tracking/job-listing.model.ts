import { ObjectId } from "mongodb";
import { UpsertDbItem } from "../db-operation-types.model";
import { JobAnalysis } from "./job-analysis.model";
import { Comment } from "../comments.model";
import { Company } from "../company.model";

/** Represents a job posted on a job board or something similar. */
export interface JobListing {
    /** Gets or sets the database ID for this chat. */
    _id: ObjectId;

    /** Optional: Gets or sets the date that the job posting was posted. */
    postingDate?: Date;

    /** Gets or sets the Title of this job. */
    jobTitle: string;

    /** Gets or sets the ID of the company this job is associated with. */
    companyId: ObjectId;

    /** Gets or sets the link to the URL that this job was posted on. */
    urlLink: string;

    /** Gets or sets the job description copied/pasted from the website. */
    description: string;

    /** Contains a historical set of statuses for this job. */
    jobStatuses: JobListingStatus[];

    /** Gets or sets notes about this job listing. */
    comments: Comment[];

    /** An AI analysis of this job, with specific properties about the job found in the description. */
    analysis?: JobAnalysis;

}

/** Represents the status of an associated job listing. */
export interface JobListingStatus {
    /** Gets or sets the status this entry represents. */
    status: string;
    /** Gets or sets the date of this status. */
    statusDate: Date;
    /** Gets or sets a boolean value indicating whether or not this job listing
     *   is closed, making it "dead". */
    isClosed?: boolean;
}

/** A shortened version of the JobListing it allow it to be listed in a table. */
export type JobListingLine = Pick<JobListing,
    '_id' | 'urlLink' | 'postingDate' | 'jobTitle' | 'companyId'>
    & { currentStatus?: JobListingStatus; };

export type JobListingCompany = Pick<Company, '_id' | 'name' | 'website'>;

/** A shortened version of the JobListing, and includes some company details. */
export type JobListingLineWithCompany = JobListingLine & { company: JobListingCompany; };

/**
 * Returns an UpsertDbItem of JobListing with all fields initialized empty 
 * or as placeholders for user input and editing.
 */
export function createJobListing(companyId: ObjectId): UpsertDbItem<JobListing> {
    const emptyStatus: JobListingStatus = {
        status: '',
        statusDate: new Date(0), // Epoch as placeholder date
    };

    return {
        postingDate: new Date(),
        jobTitle: '',
        companyId: companyId, // Placeholder ObjectId
        urlLink: '',
        description: '',
        jobStatuses: [],
        comments: []
    };
}