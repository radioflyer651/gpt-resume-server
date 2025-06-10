import { Collection, ObjectId } from "mongodb";
import { Company } from "../model/shared-models/company.model";
import { DbCollectionNames } from "../model/db-collection-names.constants";
import { nullToUndefined } from "../utils/empty-and-null.utils";
import { DbService } from "./db-service";
import { CompanyListingInfo } from "../model/shared-models/company-listing.model";
import { CompanyContact } from "../model/shared-models/job-tracking/company-contact.model";
import { JobListing, JobListingLine, JobListingLineWithCompany } from "../model/shared-models/job-tracking/job-listing.model";
import { UpsertDbItem } from "../model/shared-models/db-operation-types.model";
import { getPaginatedPipelineEnding, unpackPaginatedResults } from "./db-utils";
import { getJobListingAggregationPipeline, getJobListingAggregationPipelineForCompany, getJobListingAggregationPipelineWithCompanies } from "./company-aggregations.data";
import { JobAnalysis } from "../model/shared-models/job-tracking/job-analysis.model";
import { PaginatedResult } from "../model/shared-models/paginated-result.model";
import { TableLoadRequest } from "../model/shared-models/table-load-request.model";

/** Provide Database services for company management. */
export class CompanyManagementDbService extends DbService {

    /** Returns a company by a specified ID. */
    async getCompanyById(companyId: ObjectId): Promise<Company | undefined> {
        return await this.dbHelper.makeCallWithCollection(DbCollectionNames.Companies, async (db, collection) => {
            return await nullToUndefined(collection.findOne<Company>({ _id: companyId }));
        });
    }

    /** Attempts to find/return a company with a specified domain. */
    async getCompanyByDomain(domain: string): Promise<Company | undefined> {
        // Ensure it's just the domain, and not the website.
        domain = domain.replace(/^((https?:\/\/)(www\.)?|(www\.))/, '');

        return this.dbHelper.findDataItem(DbCollectionNames.Companies, {
            website: new RegExp(domain, 'i')
        }, { findOne: true });
    }

    /** Returns all companies from the database. */
    async getAllCompanies(): Promise<Company[]> {
        return await this.dbHelper.makeCallWithCollection(DbCollectionNames.Companies, async (db, collection) => {
            return await collection.find<Company>({}).toArray();
        });
    }

    /** Adds a new company to the system. */
    async addCompany(website: string, name: string): Promise<Company> {
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
            const aggregation: object[] = [
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
                    $set: {
                        jobListings: {
                            $map: {
                                input: '$jobListings',
                                as: 'jobListing',
                                in: {
                                    $mergeObjects: [
                                        '$$jobListing',
                                        {
                                            isClosed: {
                                                $anyElementTrue: {
                                                    $map: {
                                                        input: { $ifNull: ["$$jobListing.jobStatuses", []] }, // <-- fix here
                                                        as: "status",
                                                        in: { $eq: ["$$status.isClosed", true] }
                                                    }
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                },
                {
                    $set: {
                        openJobListings: {
                            $filter: {
                                input: '$jobListings',
                                as: 'jobListing',
                                cond: { $eq: ['$$jobListing.isClosed', false] },
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        jobListings: {
                            $size: '$jobListings'
                        },
                        openJobListings: {
                            $size: '$openJobListings'
                        },
                        companyContacts: {
                            $size: '$companyContacts'
                        }
                    }
                },
            ];

            const result = await collection.aggregate(aggregation).toArray();
            return result as CompanyListingInfo[];
        });
    }

    /** Returns a list of companies, paginated by a specified amount. */
    async getPaginatedCompanyList(tableLoadRequest: TableLoadRequest): Promise<PaginatedResult<CompanyListingInfo>> {
        return await this.dbHelper.makeCallWithCollection<PaginatedResult<CompanyListingInfo>, Company>(DbCollectionNames.Companies, async (db, collection) => {
            // Create the aggregation to get this information.
            const aggregation: object[] = [
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
                    $set: {
                        jobListings: {
                            $map: {
                                input: '$jobListings',
                                as: 'jobListing',
                                in: {
                                    $mergeObjects: [
                                        '$$jobListing',
                                        {
                                            isClosed: {
                                                $anyElementTrue: {
                                                    $map: {
                                                        input: { $ifNull: ["$$jobListing.jobStatuses", []] }, // <-- fix here
                                                        as: "status",
                                                        in: { $eq: ["$$status.isClosed", true] }
                                                    }
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                },
                {
                    $set: {
                        openJobListings: {
                            $filter: {
                                input: '$jobListings',
                                as: 'jobListing',
                                cond: { $not: '$$jobListing.isClosed' },
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        jobListings: {
                            $size: '$jobListings'
                        },
                        openJobListings: {
                            $size: '$openJobListings'
                        },
                        companyContacts: {
                            $size: '$companyContacts'
                        }
                    }
                },
            ];

            // Add the sort and filter.
            aggregation.push(... this.createPipelineSortAndFilterPipeline(tableLoadRequest));

            // Ensure the pagination is setup properly.
            if (typeof tableLoadRequest.first !== 'number' || typeof tableLoadRequest.rows !== 'number') {
                throw new Error(`pagination properties are required (first and rows).`);
            }

            // Validate.
            if (tableLoadRequest.first > tableLoadRequest.rows) {
                // throw new Error(`first and last values for the tableLoadRequest are out of order. (first: ${tableLoadRequest.first}, last: ${tableLoadRequest.rows}) `);
            }

            // Add the pagination properties.
            aggregation.push(...getPaginatedPipelineEnding(tableLoadRequest.first, Math.max(tableLoadRequest.rows, 1)));

            // Unpack the pipeline result to get the paginated results.
            const result = unpackPaginatedResults<CompanyListingInfo>(await collection.aggregate(aggregation).toArray());

            // Return the paginated results.
            return result;
        });
    }

    /** Returns all contacts for a specified company. */
    async getContactsForCompanyId(companyId: ObjectId): Promise<CompanyContact[]> {
        return await this.dbHelper.makeCallWithCollection<CompanyContact[], CompanyContact>(DbCollectionNames.CompanyContacts, async (db, col) => {
            return await col.find({ companyId: companyId }).toArray();
        });
    };

    /** Returns all job listings (shortened) for a specified company ID. */
    async getJobListingsForCompanyId(companyId: ObjectId): Promise<JobListingLine[]> {
        // Create the aggregation to get this information.
        const aggregation = getJobListingAggregationPipelineForCompany(companyId);

        return await this.dbHelper.makeCallWithCollection<JobListingLine[], JobListing>(DbCollectionNames.JobListings, async (db, col) => {
            return await col.aggregate(aggregation).toArray() as JobListingLine[];
        });
    };

    /** Returns the JobListingLines for all jobs in the system. */
    async getAllJobListings(): Promise<JobListingLineWithCompany[]> {
        // Create the aggregation to get this information.
        const aggregation = getJobListingAggregationPipelineWithCompanies();

        return await this.dbHelper.makeCallWithCollection<JobListingLineWithCompany[], JobListing>(DbCollectionNames.JobListings, async (db, col) => {
            return await col.aggregate(aggregation).toArray() as JobListingLineWithCompany[];
        });
    };

    /** Returns a company job listing, specified by its ID. */
    async getJobListingById(listingId: ObjectId): Promise<JobListing | undefined> {
        return await this.dbHelper.makeCallWithCollection<JobListing | undefined, JobListing>(DbCollectionNames.JobListings, async (db, col) => {
            return await nullToUndefined(col.findOne({ _id: listingId }));
        });
    };

    /** Returns a company contact, specified by its ID. */
    async getContactById(contactId: ObjectId): Promise<CompanyContact | undefined> {
        return await this.dbHelper.makeCallWithCollection<CompanyContact | undefined, CompanyContact>(DbCollectionNames.CompanyContacts, async (db, col) => {
            return await nullToUndefined(col.findOne({ _id: contactId }));
        });
    };

    /** Upserts a specified company contact. */
    async upsertCompanyContact(contact: UpsertDbItem<CompanyContact>): Promise<CompanyContact> {
        return await this.dbHelper.makeCallWithCollection<CompanyContact>(DbCollectionNames.CompanyContacts, async (db, col) => {
            if (!contact._id) {
                const result = await col.insertOne(contact);
                contact._id = result.insertedId;
                return contact as CompanyContact;

            } else {
                await col.updateOne({ _id: contact._id }, { $set: contact });
                return contact as CompanyContact;
            }
        });
    };

    /** Updates a specified company in the database, or adds them if they don't exist. */
    async upsertCompany(company: UpsertDbItem<Company>): Promise<Company> {
        return await this.dbHelper.makeCallWithCollection<Company>(DbCollectionNames.Companies, async (db, col) => {
            if (!company._id) {
                const result = await col.insertOne(company);
                company._id = result.insertedId;

                // Return the company back, with the new ID.
                return company as Company;

            } else {
                await col.updateOne({ _id: company._id }, { $set: company });
                return company as Company;
            }

        });
    };

    /** Updates/inserts a specified job description into the database. */
    async upsertCompanyJobListing(jobDescription: UpsertDbItem<JobListing>): Promise<JobListing> {
        return await this.dbHelper.makeCallWithCollection<JobListing>(DbCollectionNames.JobListings, async (db, col) => {
            if (!jobDescription._id) {
                const result = await col.insertOne(jobDescription);
                jobDescription._id = result.insertedId;

                return jobDescription as JobListing;

            } else {
                await col.updateOne({ _id: jobDescription._id }, { $set: jobDescription });
                return jobDescription as JobListing;

            }
        });
    };

    /** Returns a Job Listing specified by its ID. */
    async deleteCompanyJobListingById(_id: ObjectId): Promise<void> {
        return await this.dbHelper.makeCallWithCollection(DbCollectionNames.JobListings, async (db, col) => {
            await col.deleteOne({ _id });
        });
    };

    /** Returns a contact specified by its ID. */
    async deleteCompanyContactById(_id: ObjectId): Promise<void> {
        return await this.dbHelper.makeCallWithCollection(DbCollectionNames.CompanyContacts, async (db, col) => {
            await col.deleteOne({ _id });
        });
    };

    /** Deletes a specified company, it's contacts, and job listings. */
    async deleteCompanyById(companyId: ObjectId): Promise<void> {
        return await this.dbHelper.makeCall(async (db) => {
            await db.collection(DbCollectionNames.CompanyContacts).deleteMany({ companyId: companyId });
            await db.collection(DbCollectionNames.JobListings).deleteMany({ companyId: companyId });
            await db.collection(DbCollectionNames.Companies).deleteOne({ _id: companyId });
        });
    };

    /** Updates the analysis property on a JobListing object, specified by its ID. */
    async updateJobAnalysisForJob(jobListingId: ObjectId, analysis: JobAnalysis): Promise<void> {
        return await this.dbHelper.makeCallWithCollection<void, JobListing>(DbCollectionNames.JobListings, async (db, col) => {
            await col.updateOne({ _id: jobListingId }, {
                $set: { analysis }
            });
        });
    };

    /** Searches the names and websites of all companies with specified criteria, and returns those that contain the search term. */
    async searchForCompanyByName(searchTerm: string): Promise<Company[]> {
        return await this.dbHelper.makeCallWithCollection<Company[], Company>(DbCollectionNames.Companies, async (db, col) => {
            return await col.find<Company>({ $or: [{ name: { $regex: searchTerm } }, { website: { $regex: searchTerm } }] }).toArray();
        });
    }
}