import { JobListing, JobListingLine } from "./job-listing.model";


/** Ensures the job statuses ofr a JobListing are in order. */
export function orderJobListingStatuses(listing: JobListing): void {
    if (!listing.jobStatuses) {
        // It's not our job to set the value.
        return;
    }

    // Sort the listings.
    listing.jobStatuses.sort((a, b) => a.statusDate.valueOf() - b.statusDate.valueOf());
}

/** Converts a specified JobListing to a JobListingLine. */
export function jobListingToJobListingLine(jobListing: JobListing): JobListingLine {
    const result = {
        _id: jobListing._id,
        urlLink: jobListing.urlLink,
        postingDate: jobListing.postingDate,
        jobTitle: jobListing.jobTitle,
        currentStatus: undefined // Fixing this up in a minute.
    } as JobListingLine;

    // Add the current status, if applicable.
    if (jobListing.jobStatuses && jobListing.jobStatuses.length > 0) {
        // Make sure the statuses are in order.
        orderJobListingStatuses(jobListing);

        // Update the current status.
        result.currentStatus = jobListing.jobStatuses[jobListing.jobStatuses.length - 1];
    }

    // All done!
    return result;
}