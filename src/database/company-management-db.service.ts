import { ObjectId } from "mongodb";
import { Company } from "../model/shared-models/company.model";
import { DbCollectionNames } from "../model/db-collection-names.constants";
import { nullToUndefined } from "../utils/empty-and-null.utils";
import { DbService } from "./db-service";
import { getPaginatedResult, PaginatedResult } from "../model/shared-models/paginated-result.model";

/** Provide Database services for company management. */
export class CompanyManagementDbService extends DbService {

    /** Returns a company by a specified ID. */
    async getCompanyById(companyId: ObjectId): Promise<Company | undefined> {
        return await this.dbHelper.makeCallWithCollection(DbCollectionNames.Companies, async (db, collection) => {
            return await nullToUndefined(collection.findOne<Company>({ _id: companyId }));
        });
    }

    /** Returns all companies from the database. */
    async getAllCompanies(): Promise<Company[]> {
        return await this.dbHelper.makeCallWithCollection(DbCollectionNames.Companies, async (db, collection) => {
            return await collection.find<Company>({}).toArray();
        });
    }

    /** Adds a new company to the system. */
    async addCompany(website: string, name: string): Promise<Company | undefined> {
        // Ensure we have valid values.
        const lcWebsite = website.toLowerCase();

        return await this.dbHelper.makeCall(async db => {
            // Create the company.
            const company: Company = {
                _id: new ObjectId(),
                website: lcWebsite,
                name
            };

            // Insert the company.
            await db.collection(DbCollectionNames.Companies).insertOne(company);

            // Return the company.
            return company;
        });
    }

    /** Returns a list of companies, paginated by a specified amount. */
    async getCompanyList(skip: number, limit: number): Promise<PaginatedResult<Company>> {
        return await this.dbHelper.makeCallWithCollection<PaginatedResult<Company>, Company>(DbCollectionNames.Companies, async (db, collection) => {
            // Get the total document count.
            const totalCount = await collection.countDocuments();

            // Get the results.
            const result = await collection.find({}, { limit, skip }).toArray();

            // Return the result.
            return getPaginatedResult(result, skip, totalCount);
        });
    }
}