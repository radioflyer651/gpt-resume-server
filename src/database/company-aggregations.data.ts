import { ObjectId } from "mongodb";
import { DbCollectionNames } from "../model/db-collection-names.constants";

/** Returns a MongoDB Aggregation pipeline used to get JobListings. */
export function getJobListingAggregationPipeline() {
    return [
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
                companyId: 1,
                postingDate: 1,
                jobTitle: 1,
                currentStatus: 1
            }
        },
    ];
}

/** Returns a pipeline that will yieldJobListingLines and include company details. */
export function getJobListingAggregationPipelineWithCompanies() {
    // Start with just the job listings.
    const result = getJobListingAggregationPipeline();

    // Start the new part of the pipeline as a single array, to be merged later.
    const newPart: any[] = [
        {
            $lookup: {
                from: DbCollectionNames.Companies,
                localField: 'companyId',
                foreignField: '_id',
                as: 'company',
            }
        },
        {
            $set: {
                company: {
                    $arrayElemAt: ['$company', 0]
                }
            }
        },
        {
            $set: {
                company: {
                    _id: '$company._id',
                    name: '$company.name',
                    website: '$company.website'
                }
            }
        }
    ];

    // Return the combined pipeline.
    result.push(...newPart);
    return result;
}



/** Returns a MongoDB Aggregation pipeline used to get JobListings for a specified company. */
export function getJobListingAggregationPipelineForCompany(companyId: ObjectId) {
    return [
        {
            $match: {
                companyId
            }
        },
        ...getJobListingAggregationPipeline()
    ];
}

