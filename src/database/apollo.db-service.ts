import { ObjectId } from "mongodb";
import { DbCollectionNames } from "../model/db-collection-names.constants";
import { UpsertDbItem } from "../model/shared-models/db-operation-types.model";
import { ApolloCompany, ApolloEmployee } from "../model/shared-models/apollo/apollo-api-response.model";
import { nullToUndefined } from "../utils/empty-and-null.utils";
import { DbService } from "./db-service";
import { ApolloDataInfo } from "../model/shared-models/apollo/apollo-data-info.model";
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

    /** Given a specified apollo company ID, returns all employees in the database. */
    async getEmployeesForApolloCompanyId(apolloCompanyId: string): Promise<ApolloEmployee[]> {
        const apolloSeniorityOrder = [
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
        return await this.dbHelper.makeCallWithCollection<ApolloEmployee[], ApolloEmployee>(DbCollectionNames.ApolloPersons, async (db, col) => {
            const pipeline = [
                { $match: { organization_id: apolloCompanyId } },
                {
                    $addFields: {
                        seniorityOrder: {
                            $indexOfArray: [apolloSeniorityOrder, { $toLower: "$seniority" }]
                        }
                    }
                },
                { $sort: { country: -1, seniorityOrder: 1, title: 1 } }
            ];
            return await col.aggregate(pipeline).toArray() as ApolloEmployee[];
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

    /** Returns an Apollo employee, specified by its apollo ID. */
    async getEmployeeById(apolloId: string): Promise<ApolloEmployee | undefined> {
        const result = await this.dbHelper.findDataItem(DbCollectionNames.ApolloPersons, { $or: [{ id: apolloId }, { person_id: apolloId }] }, { findOne: false }) as ApolloEmployee[];
        // If there's one or none, then just return the result.
        if (result.length < 2) {
            return result[0];
        }

        // If we have more than 1, (which is probably only 2), then we want the one that's the "contact" shape, and not the "person" shape.
        //  We should probably warn if we have more than 2 though, because that would be odd.
        if (result.length > 2) {
            console.warn(`getEmployeeById yielded more than 2 results, which was unexpected.  Actual count: ${result.length}.`);
        }

        let final = result.find(r => !!r.person_id);
        // If found - return it.
        if (final) {
            return final;
        }

        // We shouldn't reach this point, but if we did, then let's just return the first item.  Not sure what else to do.
        return result[0];
    }
}