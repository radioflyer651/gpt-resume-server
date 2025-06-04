/*******
 *  Copied from PrimeNG, as this is the info sent in the lazy load requests.
 ***********/

/**
 * Meta data for lazy load event.
 * @group Interface
 */
export interface TableLoadRequest {
    first?: number | undefined | null;
    rows?: number | undefined | null;
    sortField?: string | string[] | null | undefined;
    sortOrder?: number | undefined | null;
    filters?: {
        [s: string]: FilterMetadata | FilterMetadata[] | undefined;
    };
    globalFilter?: string | string[] | undefined | null;
    multiSortMeta?: SortMeta[] | undefined | null;
    forceUpdate?: Function;
    last?: number | undefined | null;
}

/**
 * Represents metadata for filtering a data set.
 * @group Interface
 */
export interface FilterMetadata {
    /**
     * The value used for filtering.
     */
    value?: any;
    /**
     * The match mode for filtering.
     */
    matchMode?: FilterMatchMode;
    /**
     * The operator for filtering.
     */
    operator?: FilterOperatorTypes;
}

export type FilterOperatorTypes = 'AND' | 'OR';

/**
 * Defines the possible match modes for filtering.
 * @group Type
 */
export type FilterMatchMode =
    | 'startsWith'
    | 'contains'
    | 'endsWith'
    | 'equals'
    | 'notEquals'
    | 'in'
    | 'lt'
    | 'lte'
    | 'gt'
    | 'gte'
    | 'is'
    | 'isNot'
    | 'before'
    | 'after';

/**
 * Represents metadata for sorting.
 * @group Interface
 */
export interface SortMeta {
    field: string;
    order: number;
}
