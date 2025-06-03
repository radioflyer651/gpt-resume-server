import { ObjectId } from "mongodb";
import { ApolloPeopleRequestParams } from "./apollo-api-request.model";
import { NewDbItem } from "../shared-models/db-operation-types.model";

export type ApolloDataStateTypes = 'complete' | 'in-progress' | 'error' | 'new';

export type ApolloErrorTypes = 'exceeds-max-record-count' | 'api-error-response' | 'unknown-error' | 'api-key-error' | 'max-safety-count-error';

/** Contains information about data obtained from apollo, to help understand the state of the data. */
export interface ApolloDataInfo {
    /** The Database ID of this object. */
    _id: ObjectId;

    /** The ID of the Apollo company this information belongs to. */
    apolloCompanyId: string;

    /** Gets or sets the state of the data, indicating where it is in the process of record acquisition. */
    state: ApolloDataStateTypes;

    /** If an error occurred in the last attempt to retrieve apollo employees, this value will be set. */
    errorState?: ApolloErrorTypes;

    /** If an error occurred in the last attempt to load employees, this message will hopefully be set with the error. */
    errorMessage?: string | Error;

    /** Gets or sets the parameters used to get the last data set of employees. */
    lastEmployeeQuery?: ApolloPeopleRequestParams;

    /** Returns total number of employee records found for the query ran on this company's data set. */
    totalEmployeeCount?: number;

    /** Returns the total number of employee records received so far.
     *   If the download is in process, then this number will reflect our current progress. */
    totalEmployeesRetrieved?: number;
}

/** Returns a new instance of the ApolloDataInfo. */
export function createNewApolloDataInfo(companyId: string): NewDbItem<ApolloDataInfo> {
    return {
        apolloCompanyId: companyId,
        state: 'new',
    };
}