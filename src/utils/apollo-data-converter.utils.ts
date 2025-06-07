import { ObjectId } from "mongodb";
import { ApolloCompany, ApolloContactEmail, ApolloEmployee } from "../model/shared-models/apollo/apollo-api-response.model";
import { LApolloOrganization, LApolloPerson, LApolloContactEmail } from "../model/shared-models/apollo/apollo-local.model";

/**
 * Converts an ApolloOrganization to an LApolloOrganization.
 * @param org The ApolloOrganization to convert.
 * @returns The converted LApolloOrganization wrapped in NewDbItem.
 */
export function convertToLApolloOrganization(org: undefined): undefined;
export function convertToLApolloOrganization(org: ApolloCompany): LApolloOrganization;
export function convertToLApolloOrganization(org: ApolloCompany | undefined): LApolloOrganization | undefined;
export function convertToLApolloOrganization(org: ApolloCompany | undefined): LApolloOrganization | undefined {
    if (!org) {
        return undefined;
    }

    // Get the ID, because it could be the organization_id or the id.
    let _id: ObjectId = org._id;
    if (!_id) {
        if (org.organization_id) {
            _id = new ObjectId(org.organization_id);
        }

        _id = new ObjectId(org.id);
    }

    return {
        _id,
        apolloOrganizationId: org.id,
        apolloAccountId: org.owned_by_organization_id || undefined,

        name: org.name,
        websiteUrl: org.website_url,
        linkedInUrl: org.linkedin_url,
        twitterUrl: org.twitter_url,
        primaryPhone: org.primary_phone?.number ?? org.phone ?? '', // Assuming primary domain as phone placeholder
        intentStrength: org.intent_strength,
        foundedYear: org.founded_year,
        logoUrl: org.logo_url,
        domain: org.domain,
        primaryDomain: org.primary_domain
    };
}

/**
 * Converts an ApolloBasePerson to an LApolloPerson.
 * @param person The ApolloBasePerson to convert.
 * @returns The converted LApolloPerson wrapped in NewDbItem.
 */
export function convertToLApolloPerson(person: undefined): undefined;
export function convertToLApolloPerson(person: ApolloEmployee): LApolloPerson;
export function convertToLApolloPerson(person: ApolloEmployee | undefined): LApolloPerson | undefined {
    if (!person) {
        return undefined;
    }

    const _id = person._id ?? new ObjectId(person.id);

    return {
        _id,
        apolloPeronId: person.id,
        apolloContactId: person.account_id,

        firstName: person.first_name,
        lastName: person.last_name,
        name: person.name,
        title: person.title,
        email: person.email,
        emails: person.contact_emails ? convertToLApolloContactEmails(person.contact_emails) : undefined,
        linkedinUrl: person.linkedin_url,
        twitterUrl: person.twitter_url || null,
        githubUrl: person.github_url || null,
        photoUrl: person.photo_url || null,
        organizationId: person.organization_id,
        organizationName: person.organization?.name,
        intentStrength: person.intent_strength,
        city: person.city,
        state: person.state,
        country: person.country,
        departments: person.departments,
        seniority: person.seniority
    };
}

/**
 * Converts an ApolloContactEmail to an LApolloContactEmail.
 * @param email The ApolloContactEmail to convert.
 * @returns The converted LApolloContactEmail wrapped in NewDbItem.
 */
export function convertToLApolloContactEmail(email: ApolloContactEmail): LApolloContactEmail {
    return {
        email: email.email,
        position: email.position,
        emailStatusUnavailableReason: email.email_status_unavailable_reason || null,
        isFreeDomain: email.free_domain,
        emailStatus: email.email_status
    };
}


function convertToLApolloContactEmails(emails?: ApolloContactEmail[]): LApolloContactEmail[] | undefined {
    if (!emails) {
        return undefined;
    }

    return emails.map(e => convertToLApolloContactEmail(e));
}