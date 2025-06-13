import { ObjectId } from "mongodb";
import { CompanyManagementDbService } from "../database/company-management-db.service";
import { Company } from "../model/shared-models/company.model";
import { CompanyListingInfo } from "../model/shared-models/company-listing.model";
import { CompanyContact } from "../model/shared-models/job-tracking/company-contact.model";
import { ApolloDbService } from "../database/apollo.db-service";
import { NewDbItem } from "../model/shared-models/db-operation-types.model";


/** Service that handles company and job data. */
export class CompanyManagementService {
    constructor(
        protected readonly companyDbService: CompanyManagementDbService,
        protected readonly apolloDbService: ApolloDbService,
    ) {

    }

    /** Returns a company, specified by its ID. */
    getCompanyById = async (id: ObjectId): Promise<Company | undefined> => {
        return await this.companyDbService.getCompanyById(id);
    };

    /** Returns a list of companies, paginated with specified values. */
    getCompanyList = async (skip: number, limit: number): Promise<CompanyListingInfo[]> => {
        return await this.companyDbService.getCompanyList();
    };

    /** Creates a new contact for a company, specified by its id, from an apollo contact, specified by its ID. */
    createCompanyContactFromApolloId = async (companyId: ObjectId, apolloId: string): Promise<CompanyContact> => {
        // Get the company and the contact.
        const companyP = this.companyDbService.getCompanyById(companyId);
        const apolloContact = await this.apolloDbService.getEmployeeById(apolloId);
        const company = await companyP;

        // Ensure we have actual objects.
        if (!company) {
            throw new Error(`Company with _id ${companyId} was not found.`);
        }

        if (!apolloContact) {
            throw new Error(`Apollo Employee with id/contactId ${apolloId} was not found.`);
        }


        // Determine the email to use.
        function isValidEmail(email: undefined | string): boolean {
            if (!email) {
                return false;
            }
            if (email.startsWith('email_not_unlocked')) {
                return false;
            }

            return /[\w\d\.\-_]+@[\w\d\-_\.]+\.[\w\d\-_]+/i.test(email);
        }

        let email = apolloContact.email;
        if (!isValidEmail(email)) {
            if (apolloContact.contact_emails && apolloContact.contact_emails.length > 0) {
                email = apolloContact.contact_emails.find(e => isValidEmail(e.email))?.email;
            }
        }
        if (!isValidEmail(email)) {
            email = '';
        }

        // Create the new contact.
        const contact: NewDbItem<CompanyContact> = {
            companyId: companyId,
            firstName: apolloContact.first_name,
            lastName: apolloContact.last_name,
            email: email!,
            comments: [],
            title: apolloContact.title ?? '',
            apolloId: apolloContact.person_id ?? apolloContact.id,
            phoneNumbers: []
        };

        // Insert it into the database.
        const result = await this.companyDbService.upsertCompanyContact(contact);

        // Return the result.
        return result;
    };
}