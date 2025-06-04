import { TableLoadRequest, FilterMetadata, SortMeta } from '../model/shared-models/table-load-request.model';

/**
 * Generates a MongoDB aggregation pipeline for filtering based on LazyLoadMeta.
 * @param filters - Filters metadata from LazyLoadMeta.
 * @returns MongoDB aggregation pipeline stages for filtering.
 */
export function generateFilterPipeline(filters: { [s: string]: FilterMetadata | FilterMetadata[] | undefined; }): any[] {
    const pipeline: any[] = [];

    if (filters) {
        Object.entries(filters).forEach(([field, filter]) => {
            if (Array.isArray(filter)) {
                const orConditions = filter.map(f => createFilterCondition(field, f));
                pipeline.push({ $match: { $or: orConditions } });
            } else if (filter) {
                const condition = createFilterCondition(field, filter);
                pipeline.push({ $match: condition });
            }
        });
    }

    return pipeline;
}

/**
 * Creates a MongoDB filter condition based on FilterMetadata.
 * @param field - The field to filter.
 * @param filter - Filter metadata.
 * @returns MongoDB filter condition.
 */
function createFilterCondition(field: string, filter: FilterMetadata): any {
    const { value, matchMode } = filter;

    switch (matchMode) {
        case 'startsWith':
            return { [field]: { $regex: `^${value}`, $options: 'i' } };
        case 'contains':
            return { [field]: { $regex: value, $options: 'i' } };
        case 'endsWith':
            return { [field]: { $regex: `${value}$`, $options: 'i' } };
        case 'equals':
            return { [field]: value };
        case 'notEquals':
            return { [field]: { $ne: value } };
        case 'in':
            return { [field]: { $in: value } };
        case 'lt':
            return { [field]: { $lt: value } };
        case 'lte':
            return { [field]: { $lte: value } };
        case 'gt':
            return { [field]: { $gt: value } };
        case 'gte':
            return { [field]: { $gte: value } };
        case 'before':
            return { [field]: { $lt: value } };
        case 'after':
            return { [field]: { $gt: value } };
        default:
            return {};
    }
}

/**
 * Generates a MongoDB aggregation pipeline for sorting based on LazyLoadMeta.
 * @param sortMeta - Sorting metadata from LazyLoadMeta.
 * @returns MongoDB aggregation pipeline stages for sorting.
 */
export function generateSortPipeline(sortMeta: SortMeta[] | undefined): any[] {
    const pipeline: any[] = [];

    if (sortMeta) {
        const sortStage: any = {};
        sortMeta.forEach(({ field, order }) => {
            sortStage[field] = order;
        });
        pipeline.push({ $sort: sortStage });
    }

    return pipeline;
}

/**
 * Combines filter and sort pipelines into a single MongoDB aggregation pipeline.
 * @param tableLoadRequest - LazyLoadMeta containing filters and sorting metadata.
 * @returns Combined MongoDB aggregation pipeline.
 */
export function generateAggregatePipeline(tableLoadRequest: TableLoadRequest): any[] {
    const filterPipeline = generateFilterPipeline(tableLoadRequest.filters || {});
    const sortPipeline = generateSortPipeline(tableLoadRequest.multiSortMeta || []);

    return [...filterPipeline, ...sortPipeline];
}