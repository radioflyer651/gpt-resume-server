import { ObjectId } from "mongodb";

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
                postingDate: 1,
                jobTitle: 1,
                currentStatus: 1
            }
        },
    ];
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

