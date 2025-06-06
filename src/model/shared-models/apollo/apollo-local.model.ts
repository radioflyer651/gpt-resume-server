/*
         The types in this folder are reduced/translated types
         representing source data from the Apollo.io service.  These 
         representations are meant to reduce the amount of data 
         stored, and limit the data to just what is needed.
*/

import { ObjectId } from "mongodb";

export interface LApolloOrganization {
    /** The MongoDB ID for this entry. */
    _id: ObjectId;

    apolloOrganizationId: string;
    apolloAccountId?: string;

    name: string;
    websiteUrl?: string;
    linkedInUrl?: string;
    twitterUrl?: string;

    /** Contact information */
    primaryPhone?: string;

    /** Clue-related information */
    intentStrength?: number | null;
    foundedYear?: number;
    logoUrl?: string;

    domain?: string;
    primaryDomain?: string;
}

export interface LApolloPerson {
    _id: ObjectId;

    apolloPeronId: string;
    apolloContactId?: string;

    firstName: string;
    lastName: string;
    name: string;
    title?: string;
    email?: string;
    emails?: LApolloContactEmail[];
    linkedinUrl?: string;
    twitterUrl?: string | null;
    githubUrl?: string | null;
    photoUrl?: string | null;

    /** Clue-related information */
    organizationId?: string;
    organizationName?: string;
    intentStrength?: number | null;
    city?: string;
    state?: string;
    country?: string;
    departments?: string[];
    seniority?: string;
}

export interface LApolloContactEmail {
    email: string;
    position: number;
    emailStatusUnavailableReason?: string | null;
    isFreeDomain: boolean;
    emailStatus: string;
}