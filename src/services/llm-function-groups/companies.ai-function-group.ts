import { ObjectId } from "mongodb";
import { CompanyManagementDbService } from "../../database/company-management-db.service";
import { Company } from "../../model/shared-models/company.model";
import { NewDbItem } from "../../model/shared-models/db-operation-types.model";
import { AiFunctionGroup } from "../../model/shared-models/functions/ai-function-group.model";
import { getCompanyById, searchForCompanyByName, createJobListing, getJobListingsLinesForCompanyId, getJobListingById, getContactsForCompanyId, deleteJobListingById, getAllJobListings } from "../../ai-functions/jobs.ai-functions";
import { JobListing, JobListingLine } from "../../model/shared-models/job-tracking/job-listing.model";
import { stringToObjectIdConverter } from "../../utils/object-id-to-string-converter.utils";
import { addCompanyDefinition, getAllCompanyList } from "../../ai-functions/admin.ai-functions";
import { CompanyContact } from "../../model/shared-models/job-tracking/company-contact.model";
import { removeNullProperties } from "../../utils/remove-null.util";


export class CompaniesAiFunctionGroup implements AiFunctionGroup {
    constructor(
        readonly companyDbService: CompanyManagementDbService
    ) {

    }

    get groupName() {
        return 'Company Management Functions';
    }

    get functions() {
        return [
            {
                definition: getCompanyById,
                function: (aiParameters: any) => this.getCompanyById(aiParameters).then(result => JSON.stringify(result))
            },
            {
                definition: searchForCompanyByName,
                function: (aiParameters: any) => this.searchForCompanyByName(aiParameters).then(result => JSON.stringify(result))
            },
            {
                definition: createJobListing,
                function: (aiParameters: any) => this.createJobListing(aiParameters).then(result => result.toString())
            },
            {
                definition: getAllCompanyList,
                function: () => this.getAllCompanyList().then(result => result.toString())
            },
            {
                definition: addCompanyDefinition,
                function: (aiParameters: any) => this.createCompany(aiParameters).then(result => JSON.stringify(result))
            },
            {
                definition: getJobListingsLinesForCompanyId,
                function: (aiParameters: any) => this.getJobListingsLinesForCompanyId(aiParameters).then(result => JSON.stringify(result))
            },
            {
                definition: getJobListingById,
                function: (aiParameters: any) => this.getJobListingById(aiParameters).then(result => JSON.stringify(result))
            },
            {
                definition: getContactsForCompanyId,
                function: (aiParameters: any) => this.getContactsForCompanyById(aiParameters).then(result => JSON.stringify(result))
            },
            {
                definition: deleteJobListingById,
                function: (aiParameters: any) => this.deleteJobListingById(aiParameters).then(result => JSON.stringify(result))
            },
            {
                definition: getAllJobListings,
                function: () => this.getAllJobListingLines().then(result => JSON.stringify(result))
            },
        ];
    }

    private getCompanyById = async ({ companyId }: { companyId: string; }): Promise<Company | undefined> => {
        return await this.companyDbService.getCompanyById(new ObjectId(companyId));
    };

    private searchForCompanyByName = async ({ searchTerm }: { searchTerm: string; }): Promise<Company[]> => {
        return await this.companyDbService.searchForCompanyByName(searchTerm);
    };

    private createCompany = async (newCompany: NewDbItem<Company>): Promise<ObjectId> => {
        const result = await this.companyDbService.addCompany(newCompany.name, newCompany.website);
        return result._id!;
    };

    private createJobListing = async (jobListing: JobListing): Promise<ObjectId> => {
        // Remove any property that's null.
        removeNullProperties(jobListing);

        // Convert all job listing IDs from strings to ObjectIds.
        jobListing = stringToObjectIdConverter(jobListing, true);
        const result = await this.companyDbService.upsertCompanyJobListing(jobListing);
        return result._id;
    };

    /** Implementation for retrieving all company list. */
    private getAllCompanyList = async (): Promise<string> => {
        const result = await this.companyDbService.getAllCompanies();

        // Return the list to the AI.
        return JSON.stringify(result);
    };

    private getJobListingsLinesForCompanyId = async ({ companyId }: { companyId: ObjectId; }): Promise<JobListingLine[]> => {
        return await this.companyDbService.getJobListingsForCompanyId(new ObjectId(companyId));
    };

    private getAllJobListingLines = async (): Promise<JobListingLine[]> => {
        return await this.companyDbService.getAllJobListings();
    };

    private getJobListingById = async ({ listingId }: { listingId: ObjectId; }): Promise<JobListing | undefined> => {
        return await this.companyDbService.getJobListingById(new ObjectId(listingId));
    };

    private getContactsForCompanyById = async ({ companyId }: { companyId: ObjectId; }): Promise<CompanyContact[]> => {
        return await this.companyDbService.getContactsForCompanyId(new ObjectId(companyId));
    };

    private deleteJobListingById = async ({ listingId }: { listingId: string; }): Promise<string> => {
        await this.companyDbService.deleteCompanyJobListingById(new ObjectId(listingId));
        return 'Listing Deleted';
    };
}