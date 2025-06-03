import { ApolloDbService } from "../database/apollo.db-service";
import { ApolloCompanySearchQuery, ApolloPeopleRequestParams } from "../model/apollo/apollo-api-request.model";
import { ApolloApiError, ApolloCompany, ApolloEmployee, ApolloPeopleResponse } from "../model/apollo/apollo-api-response.model";
import { isApolloApiErrorObject, isApolloCompanyApiResponse, isApolloPeopleApiResponse } from "../model/apollo/apollo-api.data-helpers";
import { ApolloDataInfo, createNewApolloDataInfo } from "../model/apollo/apollo-data-info.model";
import { ApolloServiceConfiguration } from "../model/app-config.model";
import { LApolloOrganization } from "../model/shared-models/apollo-local.model";
import { convertToLApolloOrganization } from "../utils/apollo-data-converter.utils";
import { ApolloApiClient } from "./apollo.api-client";


/** Provides support for performing searches against the Apollo.io API, and caching its data. */
export class ApolloService {
    constructor(
        readonly serviceConfig: ApolloServiceConfiguration,
        protected readonly apolloApiClient: ApolloApiClient,
        protected readonly apolloDbService: ApolloDbService,
    ) {
        // Ensure we have the right parameters for the service configuration.
        if (!serviceConfig) {
            throw new Error(`serviceConfiguration must be set.`);
        }
        if (!serviceConfig.employeeQuery) {
            throw new Error(`serviceConfiguration.employeeQuery must be set.`);
        }
    }

    /** Returns the ApolloPeopleRequestParams from the configuration, and adds specified parameters to the it.  Only a copy is returned. */
    private createBasePeopleQuery(query: ApolloPeopleRequestParams): ApolloPeopleRequestParams {
        return {
            ...query,
            ...this.serviceConfig.employeeQuery,
            perPage: this.serviceConfig.maxEmployeeCount
        };
    }

    /** Returns an Apollo organization, using its domain name as search criteria. */
    async getCompanyByDomain(domainName: string): Promise<LApolloOrganization | undefined> {
        // First, check the database.
        const dbResult = await this.apolloDbService.getOrganizationByDomain(domainName);

        // Return it if we found one.
        if (dbResult) {
            return convertToLApolloOrganization(dbResult);
        }

        // Create the request.
        const apiRequest: ApolloCompanySearchQuery = {
            qOrganizationName: domainName
        };

        // Try to get it from apollo.
        const apolloResult = await this.apolloApiClient.searchCompany(apiRequest);

        // Validate the result.
        if (!isApolloCompanyApiResponse(apolloResult)) {
            // Return the error - there's not much we can do here.
            if (typeof apolloResult === 'string') {
                throw new Error(apolloResult);
            } else {
                throw new Error(apolloResult.message);
            }
        }

        // Insert the results and convert them to the right type.
        const result = await this.storeApolloCompanies([...apolloResult.accounts, ...apolloResult.organizations]);

        // We only expect to have one or zero, so if we don't, then we have a problem.
        if (result.length > 0) {
            throw new Error(`Expected to have 0 or 1 results from Apollo, but received ${result.length}`);
        }

        // Return the results.
        return result[0];
    }

    /** Returns an Apollo organization, using its Apollo ID as search criteria. */
    async getCompanyByApolloId(apolloId: string): Promise<LApolloOrganization | undefined> {
        // First, check the database.
        const dbResult = await this.apolloDbService.getOrganizationById(apolloId);

        // Return it if we found one.
        if (dbResult) {
            return convertToLApolloOrganization(dbResult);
        }

        // Create the request.
        const apiRequest: ApolloCompanySearchQuery = {
            organizationIds: [apolloId]
        };

        // Try to get it from apollo.
        const apolloResult = await this.apolloApiClient.searchCompany(apiRequest);

        // Validate the result.
        if (!isApolloCompanyApiResponse(apolloResult)) {
            // Return the error - there's not much we can do here.
            if (typeof apolloResult === 'string') {
                throw new Error(apolloResult);
            } else {
                throw new Error(apolloResult.message);
            }
        }

        // Insert the results and convert them to the right type.
        const result = await this.storeApolloCompanies([...apolloResult.accounts, ...apolloResult.organizations]);

        // We only expect to have one or zero, so if we don't, then we have a problem.
        if (result.length > 0) {
            throw new Error(`Expected to have 0 or 1 results from Apollo, but received ${result.length}`);
        }

        // Return the results.
        return result[0];
    }

    /** Inserts a specified ApolloCompany or set of ApolloCompanies into the database.  Then returns them converted to LApolloOrganizations.*/
    private async storeApolloCompanies(companies: undefined): Promise<undefined>;
    private async storeApolloCompanies(companies: ApolloCompany[]): Promise<LApolloOrganization[]>;
    private async storeApolloCompanies(companies: ApolloCompany): Promise<LApolloOrganization>;
    private async storeApolloCompanies(companies: ApolloCompany | ApolloCompany[] | undefined): Promise<LApolloOrganization | LApolloOrganization[] | undefined> {
        if (!companies) {
            return companies;
        }

        // Make sure we have an array.
        const companyArray: ApolloCompany[] = Array.isArray(companies) ? companies : [companies];

        // Store them in the database.
        await this.apolloDbService.insertApolloCompanies(companyArray);

        // Convert the results, and return the conversions.
        if (Array.isArray(companies)) {
            return companies.map(c => convertToLApolloOrganization(c));
        } else {
            return convertToLApolloOrganization(companies);
        }
    }

    /** Returns the ApolloDataInfo for a specified apollo company ID.  If one does not exist, then one is created. */
    async getInfoForApolloCompanyId(apolloCompanyId: string): Promise<ApolloDataInfo> {
        // Try to get it from the database.
        let info = await this.apolloDbService.getDataInfoByCompanyId(apolloCompanyId);

        // If not found, then we need to create it, and add it.
        if (!info) {
            const newInfo = createNewApolloDataInfo(apolloCompanyId);
            info = await this.apolloDbService.upsertDataInfo(newInfo);
        }

        // Return the result.
        return info;
    }

    /** Given a specified Apollo company ID, attempts to load all employee data into the system, if it has not already been done. 
     *   The ApolloDataInfo object is returned for the company to signify the status of the operation. */
    async loadEmployeesForCompany(apolloCompanyId: string, reloadIfError: boolean): Promise<ApolloDataInfo> {
        // Get the data info for the company.
        let dataInfo = await this.getInfoForApolloCompanyId(apolloCompanyId);

        // If we're complete, or already in progress, then this method call has nothing to do here.
        if (dataInfo.state === 'complete' || dataInfo.state === 'in-progress') {
            return dataInfo;
        }

        // Handle the error state.  Either return, or clean it up.
        if (dataInfo.state === 'error') {
            if (!reloadIfError) {
                return dataInfo;
            }

            // Clean up.
            await this.resetApolloCompanyData(apolloCompanyId, dataInfo);
        }

        // Perform the download process.
        dataInfo = await this.loadEmployeesForCompanyInternal(dataInfo);

        // Return the result.
        return dataInfo;
    }

    /** Process to load all employees from apollo. */
    private async loadEmployeesForCompanyInternal(dataInfo: ApolloDataInfo): Promise<ApolloDataInfo> {
        // The first page in API calls is 1.  This will be the running page number for calls being made.
        let pageCounter = 1;

        // FailSafe counters.  We don't want to find ourselves
        //  in an infinite loop, and use all our credits!
        //  6 is a safety net for now, and should be updated after this has been tested better.
        const DEV_MAX_CALL_COUNT = 6;
        const maxPullCount = Math.floor(this.serviceConfig.maxEmployeeCount / this.serviceConfig.maxPageSize);

        // Now, we have to continue loading the data all up, until we reach the end!
        let loadNextSet = true;
        while (loadNextSet) {
            // Create the query for this call.  It should be good as-is from the configuration.
            //  With the addition of the page information.
            let query = this.createBasePeopleQuery({
                perPage: this.serviceConfig.maxPageSize,
                page: pageCounter++
            });

            // Ensure that we don't exceed the maximum pull count.
            //  This is a temporary safety measure for now.
            if (pageCounter > maxPullCount) {
                dataInfo.state = 'error';
                dataInfo.errorState = 'exceeds-max-record-count';
                dataInfo.errorMessage = `The max API calls for people, on a single company, is ${maxPullCount}.  This has been exceeded.`;
                return await this.apolloDbService.upsertDataInfo(dataInfo);
            }

            // This is a DEV constraint for now.
            if (pageCounter > maxPullCount) {
                dataInfo.state = 'error';
                dataInfo.errorState = 'max-safety-count-error';
                dataInfo.errorMessage = `The maximum call count of ${DEV_MAX_CALL_COUNT} for development purposes has been exceeded.`;
                return await this.apolloDbService.upsertDataInfo(dataInfo);
            }

            try {
                // Load this set.
                const newDataSet = await this.apolloApiClient.searchPeople(query);

                // Update the info status.
                dataInfo = await this.intraOpPeopleUpdateDataInfo(dataInfo, newDataSet, query);

                // Determine if we're done or not.
                loadNextSet = dataInfo.state === 'in-progress';

            } catch (err) {
                // Woops!  Error???
                dataInfo.state = 'error';
                dataInfo.errorState = 'unknown-error';
                dataInfo.errorMessage = `${err}`;

                // Save this state.
                // If we're here, then we're done.  There's nothing else we can do.
                return await this.apolloDbService.upsertDataInfo(dataInfo);
            }
        }

        // All done!  Return the final result!
        return dataInfo;
    }

    /** During the pull of Apollo data (PeopleSearch), validates the operation state, and updates the ApolloDataInfo on the database.
     *   This will also update the error state, which should be observed during the operation. NOTE: The original info parameter is not touched,
     *   and this method returns a new one. */
    private async intraOpPeopleUpdateDataInfo(info: ApolloDataInfo, apiResponse: ApolloPeopleResponse | ApolloApiError, query: ApolloPeopleRequestParams): Promise<ApolloDataInfo> {
        const resultInfo = { ...info, lastEmployeeQuery: query };

        // If there's an error, then let's handle that now.
        if (!isApolloPeopleApiResponse(apiResponse)) {
            // If it's not a response, then it's an error - no matter what.
            resultInfo.state = 'error';

            if (typeof apiResponse === 'string') {
                // Probably an API Key issue, based on info from the documentation site.
                resultInfo.errorState = 'api-key-error';
                resultInfo.errorMessage = apiResponse;

            } else if (isApolloApiErrorObject(apiResponse)) {
                resultInfo.errorState = 'api-error-response';
                resultInfo.errorMessage = apiResponse.message;

            } else {
                // Unknown!!
                resultInfo.errorState = 'unknown-error';
                resultInfo.errorMessage = `Unrecognized apiResponse type ${typeof apiResponse}`;
            }

            // Update the changes.
            await this.apolloDbService.upsertDataInfo(resultInfo);

            // Return the new result.
            return resultInfo;
        }

        // Get the employees from the response.
        const employees = getEmployeesFromPeopleResponse(apiResponse);

        // Update the counts.
        resultInfo.totalEmployeeCount = apiResponse.pagination.total_entries;
        resultInfo.totalEmployeesRetrieved = (resultInfo.totalEmployeesRetrieved !== undefined
            ? resultInfo.totalEmployeesRetrieved
            : 0)
            + employees.length;

        // Check if we have too many employees, compared to the max limit.
        if (apiResponse.pagination.total_entries >= this.serviceConfig.maxEmployeeCount) {
            // Woops!  Too much!
            resultInfo.state = 'error';
            resultInfo.errorState = 'exceeds-max-record-count';
            resultInfo.errorMessage = 'The number of employees to retrieve, for the specified filter, exceeds the maximum number of employees allowed to download.';
        } else {
            if (apiResponse.pagination.page === apiResponse.pagination.total_pages) {
                resultInfo.state = 'complete';
            } else {
                resultInfo.state = 'in-progress';
            }
        }

        // Update the changes.
        await this.apolloDbService.upsertDataInfo(resultInfo);

        // Return the new result.
        return resultInfo;
    }

    /** Deletes a specified apollo company, and its employees, from the system and resets is data info to new. */
    private async resetApolloCompanyData(apolloCompanyId: string, dataInfo: ApolloDataInfo): Promise<void> {
        // Clean up, so we can start again.
        await this.apolloDbService.deleteCompanyAndEmployees(apolloCompanyId);

        // Update the state.
        dataInfo.state = 'new';
        delete dataInfo.lastEmployeeQuery;
        delete dataInfo.errorMessage;
        delete dataInfo.errorState;
        await this.apolloDbService.upsertDataInfo(dataInfo);
    }
}

/** Returns all employee records from a specified ApolloPeopleResponse, since the specific
 *   record types are stored in different arrays. */
function getEmployeesFromPeopleResponse(apiResponse: ApolloPeopleResponse): ApolloEmployee[] {
    return [
        ...apiResponse.contacts,
        ...apiResponse.people
    ];
}
