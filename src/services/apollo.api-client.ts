import https = require('https');
import { ApolloCompanySearchQuery, ApolloPeopleRequestParams } from '../model/apollo/apollo-api-request.model';
import { ApolloCompanySearchResponse, ApolloOrganizationOwner, ApolloPeopleSearchResponse } from '../model/apollo/apollo-api-response.model';
import { ApolloConfiguration } from '../model/app-config.model';

const APOLLO_ORGANIZATION_SEARCH_PATH = '/api/v1/mixed_companies/search'; // POST
const APOLLO_PEOPLE_SEARCH_PATH = '/api/v1/mixed_people/search'; // POST
const APOLLO_ORGANIZATION_JOB_POSTING_PATH = '/api/v1/organizations/{organization_id}/job_postings'; // GET  !! This will have to be fixed so the organization_id can be replaced.
const APOLLO_ENRICHMENT_PEOPLE_PATH = '/api/v1/people/match'; // POST
const APOLLO_ENRICHMENT_BULK_PEOPLE_PATH = '/api/v1/people/bulk_match'; // POST
const APOLLO_ENRICHMENT_ORGANIZATION_PATH = '/api/v1/organizations/enrich'; // GET
const APOLLO_ENRICHMENT_BULK_ORGANIZATION_PATH = '/api/v1/organizations/bulk_enrich'; // POST

/** Provides interaction with Apollo.io. */
export class ApolloApiClient {
    constructor(readonly configuration: ApolloConfiguration) {

    }

    /** Returns the options needed for the HTTP request. */
    private createOptions(path: string): https.RequestOptions {
        return {
            method: 'POST',
            hostname: this.configuration.host,
            port: null,
            path: path,
            headers: {
                accept: 'application/json',
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/json',
                'x-api-key': this.configuration.apiKey
            }
        };
    }

    /** Makes an API call to the Apollo service, and returns the result as a deserialized JSON object. */
    private async makeApiCall<T>(method: 'POST' | 'GET', path: string): Promise<T> {
        return new Promise<T>((res, rej) => {
            // Create the options for this request.
            const options = this.createOptions(path);

            const req = https.request(options, function (response) {
                const chunks: any[] = [];

                response.on('data', function (chunk) {
                    chunks.push(chunk);
                });

                response.on('end', function () {
                    const body = Buffer.concat(chunks);
                    if (body) {
                        return JSON.parse(body.toString()) as T;
                    }
                });
            });

            req.end();
        });
    }

    /** Returns the full path needed to get people data from Apollo, with the specified filters. */
    private createGetPersonsPath(request: ApolloPeopleRequestParams): string {
        // The base portion.
        let result = APOLLO_PEOPLE_SEARCH_PATH + '?';

        // This will be added to the result before each new addition.
        //  After the first addition, it will be changed to "&".
        let _separator = `?`;

        // Returns the current separator to prefix the current portion of the query with.
        const separator = () => {
            const res = _separator;
            _separator = '&';
            return res;
        };

        /** Adds a portion of the query to the path, if that portion of the query exists. */
        const addQueryPart = (prefix: string, values?: string[] | string | boolean) => {
            // Since we can have null, we can't just check for !values.
            if (values === undefined || values === null) {
                return;
            }

            if (Array.isArray(values)) {
                // Handle the array of strings.
                values.forEach(t => {
                    result += `${separator()}${prefix}=${t}`;
                });
            } else if (typeof values === 'string') {
                // This is a string - just add the one.
                if (values !== '') {
                    result += `${separator()}${prefix}=${values}`;
                }
            } else if (typeof values === 'boolean') {
                // Handle the boolean value
                result += `${separator()}${prefix}=${values}`;

            } else {
                throw new Error(`Unexpected value type: ${typeof values}`);
            }
        };

        // Add each part of the query, which exists.
        addQueryPart('person_titles[]', request.personTitles);
        addQueryPart('person_seniorities[]', request.personSeniorities);
        addQueryPart('organization_locations', request.organizationLocations);
        addQueryPart('q_organization_domains_list[]', request.organizationDomainsList);
        addQueryPart('contact_email_status[]', request.contactEmailStatus);
        addQueryPart('organization_ids[]', request.organizationIds);
        addQueryPart('organization_num_employees_ranges[]', request.organizationNumEmployeesRange);
        addQueryPart('q_keywords', request.keywords);

        if (request.keywords && request.keywords.length > 0) {
            result += `${separator()}q_keywords=${request.keywords.join(' ')}`; // Not sure how these are supposed to be separated, so using a space.
        }

        if (request.page) {
            result += `${separator()}page=${request.page}`;
        }
        if (request.perPage) {
            result += `${separator()}per_page=${request.perPage}`;
        }

        // NOTE: This should be set to false if person_titles is set.  See the documentation: https://docs.apollo.io/reference/people-search
        addQueryPart('include_similar_titles', request.includeSimilarTitles);


        // Return the result, encoded for HTML.
        return encodeURI(result);
    }

    /** Returns the full path needed to get organization data from Apollo, with the specified filters. */
    private createGetOrganizationPath(request: ApolloCompanySearchQuery): string {
        // The base portion.
        let result = APOLLO_ORGANIZATION_SEARCH_PATH + '?';

        // This will be added to the result before each new addition.
        //  After the first addition, it will be changed to "&".
        let _separator = `?`;

        // Returns the current separator to prefix the current portion of the query with.
        const separator = () => {
            const res = _separator;
            _separator = '&';
            return res;
        };

        /** Adds a portion of the query to the path, if that portion of the query exists. */
        const addQueryPart = (prefix: string, values?: string[] | string | boolean | number) => {
            if (values === undefined || values === null) {
                return;
            }

            if (Array.isArray(values)) {
                // Handle the array of strings.
                values.forEach(t => {
                    result += `${separator()}${prefix}=${t}`;
                });
            } else if (typeof values === 'string') {
                // This is a string - just add the one.
                if (values !== '') {
                    result += `${separator()}${prefix}=${values}`;
                }
            } else if (typeof values === 'boolean') {
                // Handle the boolean value
                result += `${separator()}${prefix}=${values}`;

            } else if (typeof values === 'number') {
                // Handle the boolean value
                result += `${separator()}${prefix}=${values}`;

            } else {
                throw new Error(`Unexpected value type: ${typeof values}`);
            }
        };

        // Add each part of the query, which exists.
        addQueryPart('organization_num_employees_ranges[]', request.organizationNumEmployeesRanges);
        addQueryPart('organization_locations[]', request.organizationLocations);
        addQueryPart('organization_not_locations[]', request.organizationNotLocations);
        addQueryPart('currently_using_any_of_technology_uids[]', request.currentlyUsingAnyOfTechnologyUids);
        addQueryPart('q_organization_keyword_tags[]', request.qOrganizationKeywordTags);
        addQueryPart('q_organization_name', request.qOrganizationName);
        addQueryPart('organization_ids[]', request.organizationIds);
        addQueryPart('revenue_range[min]', request.revenueRangeMin);
        addQueryPart('revenue_range[max]', request.revenueRangeMax);

        if (request.page) {
            result += `${separator()}page=${request.page}`;
        }
        if (request.perPage) {
            result += `${separator()}per_page=${request.perPage}`;
        }

        // Return the result, encoded for HTML.
        return encodeURI(result);
    }

    /** Performs a search for people, using specified criteria, on the Apollo.io website. */
    async searchPeople(request: ApolloPeopleRequestParams): Promise<ApolloPeopleSearchResponse> {
        // Create the path for the request.
        const path = this.createGetPersonsPath(request);

        // Make the API call.
        const result = await this.makeApiCall<ApolloPeopleSearchResponse>('POST', path);

        // Return the result.
        return result;
    }

    /** Performs a search for organizations, using specified criteria, on the Apollo.io website. */
    async searchCompany(request: ApolloCompanySearchQuery): Promise<ApolloCompanySearchResponse> {
        // Create the path for the request.
        const path = this.createGetOrganizationPath(request);

        // Make the API call.
        const result = await this.makeApiCall<ApolloCompanySearchResponse>('POST', path);

        // Return the result.
        return result;
    }
}

