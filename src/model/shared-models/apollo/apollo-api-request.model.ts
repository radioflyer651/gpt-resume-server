
export type PersonSeniorityTypes = 'owner' | 'founder' | 'c_suite' | 'partner' | 'vp' | 'head' | 'director' | 'manager' | 'senior' | 'entry' | 'intern';

export type ContactEmailStatusTypes = 'verified' | 'unverified' | 'likely to engage' | 'unavailable';

/** Contains the fields needed to make a people request in the Apollo API. */
export interface ApolloPeopleRequestParams {
    personTitles?: string[];
    includeSimilarTitles?: boolean;
    personLocations?: string[];
    personSeniorities?: PersonSeniorityTypes[];
    organizationLocations?: string[];
    organizationDomainsList?: string[];
    contactEmailStatus?: ContactEmailStatusTypes[];
    organizationIds?: string[];
    organizationNumEmployeesRange?: string[]; // 1,10; 250,500; 10000,20000
    keywords?: string[];
    /** The page number for results, using pagination.  NOTE: This key is 1-based, so if there are 4 pages, then the page numbers are 1,2,3, and 4. */
    page?: number;
    perPage?: number;
}

export interface ApolloCompanySearchQuery {
    organizationNumEmployeesRanges?: string[];       // e.g. ["1,10", "250,500"]
    organizationLocations?: string[];                // e.g. ["texas", "tokyo"]
    organizationNotLocations?: string[];             // e.g. ["minnesota", "ireland"]
    revenueRangeMin?: number;// e.g. 300000
    revenueRangeMax?: number;// e.g. 50000000
    currentlyUsingAnyOfTechnologyUids?: string[];   // e.g. ["salesforce", "google_analytics"]
    qOrganizationKeywordTags?: string[];            // e.g. ["mining", "sales strategy"]
    qOrganizationName?: string;                      // e.g. "apollo"
    organizationIds?: string[];                       // e.g. ["5e66b6381e05b4008c8331b8"]
    page?: number;                                   // e.g. 4
    perPage?: number;                                // e.g. 10
}

export const apolloSeniorityOrder = [
    'owner',
    'founder',
    'c_suite',
    'partner',
    'vp',
    'head',
    'director',
    'manager',
    'senior',
    'entry',
    'intern'
];

/** Given a specified seniority value (preferably a PersonSeniorityTypes value), returns their rank.
 *   This can be used for sorting. */
export function getApolloSeniorityOrder(position: string): number {
    // Try to find their position in the order list.
    const order = apolloSeniorityOrder.indexOf(position);

    // If not found, then it should be the max value.
    if (order < 0) {
        return apolloSeniorityOrder.length;
    }

    // Return the order, since it was found.
    return order;
}