import { ObjectId } from "mongodb";
import { Company } from "../model/shared-models/company.model";
import { DbCollectionNames } from "../model/db-collection-names.constants";
import { nullToUndefined } from "../utils/empty-and-null.utils";
import { DbService } from "./db-service";
import { getPaginatedResult, PaginatedResult } from "../model/shared-models/paginated-result.model";
import { CompanyListingInfo } from "../model/shared-models/company-listing.model";
import { CompanyContact } from "../model/shared-models/job-tracking/company-contact.data";
import { JobListing, JobListingLine } from "../model/shared-models/job-tracking/job-listing.model";
import { UpsertDbItem } from "../model/shared-models/db-operation-types.model";
import { getUpsertMatchObject } from "./db-utils";

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
    async getCompanyList(): Promise<CompanyListingInfo[]> {
        return await this.dbHelper.makeCallWithCollection<CompanyListingInfo[], Company>(DbCollectionNames.Companies, async (db, collection) => {
            // Create the aggregation to get this information.
            const aggregation = [
                {
                    $lookup: {
                        from: 'job-listings',
                        localField: '_id',
                        foreignField: 'companyId',
                        as: 'jobListings'
                    }
                },
                {
                    $lookup: {
                        from: 'company-contacts',
                        localField: '_id',
                        foreignField: 'companyId',
                        as: 'companyContacts'
                    }
                },
                {
                    $addFields: {
                        companyContacts: {
                            $size: '$companyContacts'
                        }
                    }
                },
                {
                    $addFields: {
                        jobListings: {
                            $size: '$jobListings'
                        }
                    }
                }
            ];

            const result = await collection.aggregate(aggregation).toArray();
            return result as CompanyListingInfo[];
        });
    }

    /** Returns all contacts for a specified company. */
    async getContactsForCompanyId(companyId: ObjectId): Promise<CompanyContact[]> {
        return await this.dbHelper.makeCallWithCollection<CompanyContact[], CompanyContact>(DbCollectionNames.CompanyContacts, async (db, col) => {
            return await col.find({ companyId: companyId }).toArray();
        });
    }

    /** Returns all job listings (shortened) for a specified company ID. */
    async getJobListingsForCompanyId(companyId: ObjectId): Promise<JobListingLine[]> {
        // Create the aggregation to get this information.
        const aggregation = [
            {
                $match: {
                    companyId
                }
            },
            {
                $addFields: {
                    jobStatuses: {
                        $sortArray: {
                            input: '$jobStatuses',
                            sortBy: { statusDate: 1 }
                        }
                    },
                }
            },
            {
                $addFields: {
                    currentStatus: {
                        $arrayElemAt: [`$jobStatuses`, -1]
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    urlLink: 1,
                    postingDate: 1,
                    jobTitle: 1,
                    currentStatus: 1
                }
            },
        ];

        return await this.dbHelper.makeCallWithCollection<JobListingLine[], JobListing>(DbCollectionNames.JobListings, async (db, col) => {
            return await col.aggregate(aggregation).toArray() as JobListingLine[];
        });
    }

    /** Returns a company job listing, specified by its ID. */
    async getJobListingById(listingId: ObjectId): Promise<JobListing | undefined> {
        return await this.dbHelper.makeCallWithCollection<JobListing | undefined, JobListing>(DbCollectionNames.JobListings, async (db, col) => {
            return await nullToUndefined(col.findOne({ _id: listingId }));
        });
    }

    /** Returns a company contact, specified by its ID. */
    async getContactById(contactId: ObjectId): Promise<CompanyContact | undefined> {
        return await this.dbHelper.makeCallWithCollection<CompanyContact | undefined, CompanyContact>(DbCollectionNames.CompanyContacts, async (db, col) => {
            return await nullToUndefined(col.findOne({ _id: contactId }));
        });
    }

    /** Upserts a specified company contact. */
    async upsertCompanyContact(contact: UpsertDbItem<CompanyContact>): Promise<CompanyContact> {
        return await this.dbHelper.makeCallWithCollection<CompanyContact>(DbCollectionNames.CompanyContacts, async (db, col) => {
            if (!contact._id) {
                const result = await col.insertOne(contact);
                contact._id = result.insertedId;
                return contact as CompanyContact;

            } else {
                await col.updateOne(getUpsertMatchObject(contact), { $set: contact });
                return contact as CompanyContact;

            }

        });
    }

    /** Updates a specified company in the database, or adds them if they don't exist. */
    async upsertCompany(company: Company): Promise<Company> {
        return await this.dbHelper.makeCallWithCollection(DbCollectionNames.Companies, async (db, col) => {
            // Ensure the company data is pure.
            const updateDocument = {
                _id: company._id,
                name: company.name,
                website: company.website,
                comments: company.comments,
            } as any;

            if (!company._id) {
                const result = await col.insertOne(updateDocument);
                updateDocument._id = result.insertedId;

                // Return the company back, with the new ID.
                return updateDocument;

            } else {
                await col.updateOne(getUpsertMatchObject(company), { $set: updateDocument });
                return updateDocument;
            }

        });
    }

    /** Updates/inserts a specified job description into the database. */
    async upsertCompanyJobListing(jobDescription: UpsertDbItem<JobListing>): Promise<JobListing> {
        return await this.dbHelper.makeCallWithCollection<JobListing>(DbCollectionNames.JobListings, async (db, col) => {
            if (!jobDescription._id) {
                const result = await col.insertOne(jobDescription);
                jobDescription._id = result.insertedId;

                return jobDescription as JobListing;

            } else {
                await col.updateOne(getUpsertMatchObject(jobDescription), { $set: jobDescription });
                return jobDescription as JobListing;

            }
        });
    }

    /** Returns a Job Listing specified by its ID. */
    async deleteCompanyJobListingById(_id: ObjectId): Promise<void> {
        return await this.dbHelper.makeCallWithCollection(DbCollectionNames.JobListings, async (db, col) => {
            await col.deleteOne({ _id });
        });
    }

    /** Returns a contact specified by its ID. */
    async deleteCompanyContactById(_id: ObjectId): Promise<void> {
        return await this.dbHelper.makeCallWithCollection(DbCollectionNames.CompanyContacts, async (db, col) => {
            await col.deleteOne({ _id });
        });
    }

    /** Deletes a specified company, it's contacts, and job listings. */
    async deleteCompanyById(companyId: ObjectId): Promise<void> {
        return await this.dbHelper.makeCall(async (db) => {
            await db.collection(DbCollectionNames.CompanyContacts).deleteMany({ companyId: companyId });
            await db.collection(DbCollectionNames.JobListings).deleteMany({ companyId: companyId });
            await db.collection(DbCollectionNames.Companies).deleteOne({ _id: companyId });
        });
    }
}