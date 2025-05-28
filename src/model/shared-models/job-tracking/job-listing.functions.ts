import { JobListing } from "./job-listing.model";


/** Ensures the job statuses ofr a JobListing are in order. */
export function orderJobListingStatuses(listing: JobListing): void {
    if (!listing.jobStatuses) {
        // It's not our job to set the value.
        return;
    }

    // Sort the listings.
    listing.jobStatuses.sort((a, b) => a.statusDate.valueOf() - b.statusDate.valueOf());
}