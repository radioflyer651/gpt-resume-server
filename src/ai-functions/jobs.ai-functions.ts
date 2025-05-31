import { FunctionTool } from "../forwarded-types.model";
import { OBJECT_ID_NOTE } from "./common-definitions/common-ai-prop-notes";
import { jobListingProperties_AiFunctions } from "./common-definitions/job-listing.ai-definition";


export const getCompanyById: FunctionTool = {
    name: 'get_company_by_id',
    type: 'function',
    description: `Gets a company, specified by it's ObjectId.`,
    strict: true,
    parameters: {
        type: 'object',
        required: [
            'companyId',
        ],
        additionalProperties: false,
        properties: {
            companyId: {
                type: 'string',
                description: `The MongoDB ObjectID of the company. ${OBJECT_ID_NOTE}`
            }
        }
    },
};

export const searchForCompanyByName: FunctionTool = {
    name: 'search_for_company_by_name',
    type: 'function',
    description: `Searches the database, given some or all of the company name or website, and if found, returns the company data.
                    Since a perfect match may not be possible, it's recommended to search by partial terms that are unique in the name for a better chance of success.`,
    strict: true,
    parameters: {
        type: 'object',
        required: [
            'searchTerm'
        ],
        additionalProperties: false,
        properties: {
            searchTerm: {
                type: 'string',
                description: 'All or part of the name of the company.'
            }
        }
    }
};

export const createJobListing: FunctionTool = {
    name: `create_job_listing`,
    type: `function`,
    description: `Creates a new JobListing object in the database.  The company must exist for this method to succeed.`,
    strict: true,
    parameters: jobListingProperties_AiFunctions
};

export const getJobListingById: FunctionTool = {
    name: 'get_job_listing_by_id',
    type: 'function',
    description: `Returns a job listing (full detail), for a specified job listing ID.`,
    strict: true,
    parameters: {
        type: 'object',
        additionalProperties: false,
        required: [
            'listingId'
        ],
        properties: {
            listingId: {
                type: 'string',
                description: `The DB Id for the JobListing to get the info for. ${OBJECT_ID_NOTE}`
            }
        }
    }
};


export const deleteJobListingById: FunctionTool = {
    name: 'delete_job_listing_by_id',
    type: 'function',
    description: `Deletes a job listing, for a specified job listing ID.`,
    strict: true,
    parameters: {
        type: 'object',
        additionalProperties: false,
        required: [
            'listingId'
        ],
        properties: {
            listingId: {
                type: 'string',
                description: `The DB Id for the JobListing to delete. ${OBJECT_ID_NOTE}`
            }
        }
    }
};


export const getJobListingsLinesForCompanyId: FunctionTool = {
    name: 'get_job_listing_lines_for_company_id',
    type: 'function',
    description: 'Returns a list of job listings for a company.  The listings are shortened with condensed information.',
    strict: true,
    parameters: {
        type: 'object',
        additionalProperties: false,
        required: [
            'companyId'
        ],
        properties: {
            companyId: {
                type: 'string',
                description: `The DB Id of the company to get the job listings for.`
            }
        }
    }
};

export const getContactsForCompanyId: FunctionTool = {
    name: 'get_contacts_for_company_id',
    type: 'function',
    description: 'Returns a list of contacts for a company.',
    strict: true,
    parameters: {
        type: 'object',
        additionalProperties: false,
        required: [
            'companyId'
        ],
        properties: {
            companyId: {
                type: 'string',
                description: `The DB Id of the company to get the contacts for.`
            }
        }
    }
};

export const getAllJobListings: FunctionTool = {
    name: 'get_all_job_listings',
    type: 'function',
    description: 'Returns a list of job listings.  The listings are shortened with condensed information.',
    strict: true,
    parameters: {
        type: 'object',
        additionalProperties: false,
        required: [],
        properties: {}
    }
};