import { Company } from "./company.model";

/** Represents the information to be shown on the company list page. */
export interface CompanyListingInfo extends Company {

    /** The number of contacts found for this company. */
    companyContacts: number;

    /** The number of job listings found for this company. */
    jobListings: number;

}