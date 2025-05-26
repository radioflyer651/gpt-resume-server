import { ObjectId } from "mongodb";

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
    comments: string[];

}

/** Represents the status of an associated job listing. */
export interface JobListingStatus {
    /** Gets or sets the status this entry represents. */
    status: string;
    /** Gets or sets the date of this status. */
    statusDate: Date;
}

/** A shortened version of the JobListing it allow it to be listed in a table. */
export type JobListingLine = Pick<JobListing,
    '_id' | 'urlLink' | 'postingDate' | 'jobTitle'>
    & { currentStatus: JobListingStatus; };