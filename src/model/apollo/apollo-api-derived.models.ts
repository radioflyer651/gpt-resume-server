

/* 
*  The types here are types from the apollo-api-response.mode.ts file, but derived for various reasons.
*/

import { ApolloCompany } from "../shared-models/apollo/apollo-api-response.model";

/** The ApolloCompany class, but with a reduced dataset for listing the data in the UI. */
export type ApolloCompanyShortened =
    Pick<ApolloCompany, '_id' | 'name' | 'id' | 'linkedin_url' | 'website_url' | 'primary_domain' | 'domain' | 'organization_id'>;