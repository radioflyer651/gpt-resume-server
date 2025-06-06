import { ApolloApiErrorObject, ApolloOrganizationResponse, ApolloPeopleResponse } from "./apollo-api-response.model";

/** TypeGuard for the ApolloPeopleResponse type. */
export function isApolloPeopleApiResponse(target: any): target is ApolloPeopleResponse {
    // If it's not an object, then nope!
    if (typeof target !== 'object') {
        return false;
    }

    // Test the object for the right fields.
    return 'contacts' in target && 'people' in target;
}

/** TypeGuard for ApolloOrganizationResponse. */
export function isApolloCompanyApiResponse(target: any): target is ApolloOrganizationResponse {
    if (typeof target !== 'object') {
        return false;
    }

    // Test the object for the right fields.
    return 'accounts' in target && 'organizations' in target;
}


/** TypeGuard for the type ApolloApiErrorObject. */
export function isApolloApiErrorObject(target: any): target is ApolloApiErrorObject {
    if (typeof target !== 'object') {
        return false;
    }

    return 'message' in target || 'error' in target;
}