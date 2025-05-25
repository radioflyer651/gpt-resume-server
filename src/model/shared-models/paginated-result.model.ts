

export interface PaginatedResult<T> {
    /** Returns the page of data for an associated query. */
    data: T[];

    /** Returns the page number of this result set for this query. */
    pageNumber: number;

    /** Returns the total number of results that can be returned for the associated query. */
    totalResults: number;
}

/** Returns a PaginatedResult object with specified inputs. */
export function getPaginatedResult<T>(data: T[], pageNumber: number, totalResults: number): PaginatedResult<T> {
    return {
        data,
        pageNumber,
        totalResults
    };
}