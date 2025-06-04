import { ObjectId } from "mongodb";
import { Company } from "../model/shared-models/company.model";
import { DbCollectionNames } from "../model/db-collection-names.constants";
import { User } from "../model/shared-models/user.model";
import { MongoHelper } from "../mongo-helper";
import { nullToUndefined } from "../utils/empty-and-null.utils";
import { FilterMetadata, TableLoadRequest } from "../model/shared-models/table-load-request.model";
import { generateAggregatePipeline } from "./table-filters.functions";
import { getPaginatedPipelineEnding } from "./db-utils";


export abstract class DbService {
    constructor(protected readonly dbHelper: MongoHelper) {

    }

    /** Given a specified query specification (from a PrimeNG table source in the UI), returns the
     *   required pipeline operators to produce the proper output. If pagination is required then it will be validated. */
    createPipelineSortAndFilterPipeline(lazyLoadMeta: TableLoadRequest): object[] {
        return generateAggregatePipeline(lazyLoadMeta);
    }

    /** Given a specified TableLoadRequest data set, returns the aggregation pipeline values to use in the pipeline. */
    createPaginationAndSortAndFilterPipeline(lazyLoadMeta: TableLoadRequest, isPaginationRequired: boolean): object[] {
        const result: object[] = [];

        // Check the pagination, if needed.
        if (isPaginationRequired && typeof lazyLoadMeta.first !== 'number' || typeof lazyLoadMeta.last === 'number') {
            throw new Error('The parameters first and last are required.');
        }

        // Add the sort and filter.
        result.push(... this.createPipelineSortAndFilterPipeline(lazyLoadMeta));

        // Ensure the pagination is setup properly.
        if (typeof lazyLoadMeta.first === 'number' && typeof lazyLoadMeta.last === 'number') {
            // Validate.
            if (lazyLoadMeta.first >= lazyLoadMeta.last - 1) {
                throw new Error('first and last values for the tableLoadRequest are out of order.');
            }

            // Add the pagination properties.
            result.push(...getPaginatedPipelineEnding(lazyLoadMeta.first, lazyLoadMeta.last - lazyLoadMeta.first + 1));
        }

        // Return the result.
        return result;
    }
}