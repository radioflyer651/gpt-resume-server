import { ObjectId } from "mongodb";
import { DbCollectionNames } from "../model/db-collection-names.constants";
import { UpsertDbItem } from "../model/shared-models/db-operation-types.model";
import { ApolloAccount, ApolloCompany, ApolloContact, ApolloEmployee, ApolloOrganization, ApolloPerson } from "../model/apollo/apollo-api-response.model";
import { MongoHelper } from "../mongo-helper";
import { nullToUndefined } from "../utils/empty-and-null.utils";
import { DbService } from "./db-service";
import { getUpsertMatchObject } from "./db-utils";
import { ApolloDataInfo } from "../model/apollo/apollo-data-info.model";
import { ApolloCompanyShortened } from "../model/apollo/apollo-api-derived.models";

function refreshId(target: { _id?: ObjectId, id: string; }): void {
    if (!target._id) {
        // If this is an "Account" then we need to use the organization_id.  Otherwise, just the id.

        target._id = new ObjectId(target.id);
    }
}
/** Provides storage services for Apollo API queries. */
export class ApolloDbService extends DbService {

    async upsertApolloOrganization(organization: ApolloCompany): Promise<ApolloCompany> {
        // Ensure the _id is matched with the Apollo id.
        refreshId(organization);

        return await this.dbHelper.makeCallWithCollection<ApolloCompany>(DbCollectionNames.ApolloOrganizations, async (db, col) => {
            const result = await col.updateOne({ _id: organization._id }, { $set: organization }, { upsert: true });
            return organization;
        });
    }

    /** Deletes an Apollo organization from the system. */
    async deleteApolloOrganization(organizationId: ObjectId | string): Promise<void> {
        await this.dbHelper.makeCallWithCollection(DbCollectionNames.ApolloOrganizations, async (db, col) => {
            if (typeof organizationId === 'string') {
                await col.deleteOne({ id: organizationId });
            } else {
                await col.deleteOne({ _id: organizationId });
            }
        });
    }

    /** Deletes an apollo company, specified by its apollo organization id. */
    async deleteApolloOrganizationByCompanyId(apolloCompanyId: string): Promise<void> {
        await this.dbHelper.deleteDataItems<ApolloCompany>(DbCollectionNames.ApolloOrganizations, { organization_id: apolloCompanyId }, { deleteMany: false });
    }

    /** Attempts to get an organization by their domain, if they exist in the system. */
    async getOrganizationByDomain(domainName: string): Promise<ApolloCompany | undefined> {
        return await this.dbHelper.makeCallWithCollection(DbCollectionNames.ApolloOrganizations, async (db, col) => {
            return nullToUndefined(await col.findOne<ApolloCompany>({
                $or: [
                    { primary_domain: { $eq: domainName.toLocaleLowerCase() } },
                    { domain: { $eq: domainName.toLocaleLowerCase() } }
                ]
            }
            ));
        });
    }

    /** Attempts to return an Apollo Company using its object ID.  Note: The Apollo ID is the string value of the ObjectId of the local record. */
    async getOrganizationById(id: ObjectId | string): Promise<ApolloCompany | undefined> {
        // Make sure we have an object ID.
        const objId = typeof id === 'object' ? id : new ObjectId(id);

        // Perform the search.
        return await this.dbHelper.makeCallWithCollection(DbCollectionNames.ApolloOrganizations, async (db, col) => {
            return nullToUndefined(await col.findOne<ApolloCompany>({ _id: objId }));
        });
    }

    /** Returns all organizations in the database, with a shortened data set. */
    async getAllOrganizations(): Promise<ApolloCompanyShortened[]> {
        return await this.dbHelper.findDataItemWithProjection<ApolloCompany>(DbCollectionNames.ApolloOrganizations, {},
            { _id: 1, id: 1, name: 1, linkedin_url: 1, website_url: 1, primary_domain: 1, domain: 1, organization_id: 1 },
            { findOne: false }) as ApolloCompanyShortened[];
    }

    /** Inserts a set of ApolloCompany objects into the database. */
    async insertApolloCompanies(companies: ApolloCompany[]): Promise<void> {
        // Ensure they have _ids.
        companies.forEach(c => refreshId(c));

        // Insert them into the database.
        await this.dbHelper.makeCallWithCollection(DbCollectionNames.ApolloOrganizations, async (db, col) => {
            await col.insertMany(companies);
        });
    }

    async upsertApolloEmployee(employee: ApolloEmployee): Promise<ApolloEmployee> {
        // Ensure the _id is matched with the Apollo id.
        refreshId(employee);

        return await this.dbHelper.makeCallWithCollection<ApolloEmployee>(DbCollectionNames.ApolloPersons, async (db, col) => {
            const result = await col.updateOne({ _id: employee._id }, { $set: employee }, { upsert: true });
            return employee;
        });
    }

    /** Deletes an Apollo employee from the system. */
    async deleteApolloEmployee(employeeId: ObjectId | string): Promise<void> {
        await this.dbHelper.makeCallWithCollection(DbCollectionNames.ApolloPersons, async (db, col) => {
            if (typeof employeeId === 'string') {
                await col.deleteOne({ id: employeeId });
            } else {
                await col.deleteOne({ _id: employeeId });
            }
        });
    }

    /** Deletes all employees for a specified apollo company id. */
    async deleteApolloEmployeesForCompanyId(apolloCompanyId: string): Promise<void> {
        await this.dbHelper.deleteDataItems<ApolloEmployee>(DbCollectionNames.ApolloPersons, { organization_id: apolloCompanyId }, { deleteMany: true });
    }

    /** Deletes a specified Apollo Company, and all of its employees, specified by the apollo company ID. */
    async deleteCompanyAndEmployees(apolloCompanyId: string): Promise<void> {
        await this.deleteApolloEmployeesForCompanyId(apolloCompanyId);
        await this.deleteApolloOrganizationByCompanyId(apolloCompanyId);
    }

    async getDataInfoByCompanyId(apolloCompanyId: string) {
        return this.dbHelper.findDataItem<ApolloDataInfo>(DbCollectionNames.ApolloDataInfos, { apolloCompanyId: apolloCompanyId }, { findOne: true });
    }

    /** Returns one or more AoplloDataInfo objects for the specified query. */
    async getDataInfo(matchQuery: Partial<ApolloDataInfo>) {
        return this.dbHelper.findDataItem<ApolloDataInfo>(DbCollectionNames.ApolloDataInfos, matchQuery);
    }

    /** Upserts a specified ApolloDataInfo object. */
    async upsertDataInfo(dataInfo: UpsertDbItem<ApolloDataInfo>) {
        return await this.dbHelper.upsertDataItem<ApolloDataInfo>(DbCollectionNames.ApolloDataInfos, dataInfo);
    }

    /** Deletes one or more ApolloDataInfo object. */
    async deleteDataInfo(dataInfoQuery: Partial<ApolloDataInfo>, deleteMany: boolean = false) {
        return await this.dbHelper.deleteDataItems<ApolloDataInfo>(DbCollectionNames.ApolloDataInfos, dataInfoQuery, { deleteMany });
    }
}