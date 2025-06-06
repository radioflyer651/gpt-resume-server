import { ObjectId } from "mongodb";
import { ApolloDbService } from "../database/apollo.db-service";
import { ApolloCompanySearchQuery, ApolloPeopleRequestParams } from "../model/shared-models/apollo/apollo-api-request.model";
import { ApolloAccount, ApolloApiError, ApolloCompany, ApolloEmployee, ApolloPeopleResponse } from "../model/apollo/apollo-api-response.model";
import { isApolloApiErrorObject, isApolloCompanyApiResponse, isApolloPeopleApiResponse } from "../model/apollo/apollo-api.data-helpers";
import { ApolloDataInfo, createNewApolloDataInfo } from "../model/shared-models/apollo/apollo-data-info.model";
import { ApolloServiceConfiguration } from "../model/app-config.model";
import { LApolloOrganization } from "../model/shared-models/apollo/apollo-local.model";
import { convertToLApolloOrganization } from "../utils/apollo-data-converter.utils";
import { ApolloApiClient } from "./apollo.api-client";
import { CompanyManagementDbService } from "../database/company-management-db.service";


/** Provides support for performing searches against the Apollo.io API, and caching its data. */
export class ApolloService {
    constructor(
        readonly serviceConfig: ApolloServiceConfiguration,
        protected readonly apolloApiClient: ApolloApiClient,
        protected readonly apolloDbService: ApolloDbService,
        protected readonly companyDbService: CompanyManagementDbService,
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
            perPage: this.serviceConfig.maxPageSize
        };
    }

    /** Attempts to update an Apollo company in the database using the domain of a local company, specified by its ID. 
     *   The ID of the ApolloCompany is returned, if one was found. */
    async updateApolloCompanyByCompanyDomain(localCompanyId: ObjectId): Promise<ObjectId> {
        // Get the company by the ID.
        const company = await this.companyDbService.getCompanyById(localCompanyId);

        // If not found, then we can't do much.
        if (!company) {
            throw new Error(`Company does not exist with the id ${localCompanyId}.  NOTE: This is not the Apollo company ID, but the local company ID of the application.`);
        }

        // Ensure we have a valid domain.
        if (typeof company.website !== 'string' || company.website.trim() === '') {
            throw new Error(`Company ${company.name} does not have a valid domain/website.`);
        }

        // Get the domain from the website.
        const websiteMatch = /(([\w+\d_\-]+)\.)+([\w+\d_\-]+)/i.exec(company.website);

        // If no match, then we can't do anything.
        if (!websiteMatch) {
            throw new Error(`Could not extract the domain from the website value: ${company.website}`);
        }

        // Get the domain.
        const website = websiteMatch[0];

        // Now we have to make sure it doesn't start with www., per the Apollo instructions.
        const domainMatch = /(www\.)?(.+)/.exec(website)!;
        const domain = domainMatch[2];

        // Perform the update.
        const result = await this.getCompanyByDomain(domain);

        // If no result was found, then even though there was no error, we can't link this
        //  to the company.  We'll throw the error here.
        if (!result) {
            throw new Error(`No company was found in Apollo with the domain: ${domain}`);
        }

        // Link the company to the apollo company.
        company.apolloId = result._id;

        // Update the company with its new ID.
        await this.companyDbService.upsertCompany(company);

        // Return the ID of the company.
        return result._id;
    }

    /** Returns an Apollo organization, using its domain name as search criteria. */
    async getCompanyByDomain(domainName: string): Promise<LApolloOrganization | undefined> {
        // Be sure the domain is lower case.
        domainName = domainName.toLowerCase().trim();

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

        // Get the company list, since they're not all int he same array.
        const companyList = [...apolloResult.accounts, ...apolloResult.organizations] as ApolloCompany[];

        // Ensure their _id's are all set.
        companyList.forEach(c => {
            c._id = new ObjectId(c.organization_id ? c.organization_id : c.id);
        });

        // Insert the results and convert them to the right type.
        const results = await this.storeApolloCompanies(companyList);

        // We only expect to have one or zero, so if we don't, then we have a problem.
        if (results.length > 1) {
            console.warn(`Expected to have 0 or 1 results from Apollo, but received ${results.length}`);
        }

        // Domain searches will be a partial match, so we may get multiple results.
        //  Make sure the domain matches exactly, if we don't have a single result.
        let result: LApolloOrganization | undefined = results[0];
        if (results.length > 1) {
            result = results.find(r => r.domain?.toLocaleLowerCase() === domainName || r.primaryDomain?.toLocaleLowerCase() === domainName);
        }

        // Return the results.
        return results[0];
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
        //  Since we have an exact ID, it would be a little odd if we have more than one.
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

    /** Returns the employees in the database for a specified apollo company ID. */
    async getApolloEmployeesForApolloCompany(apolloCompanyId: string): Promise<ApolloEmployee[]> {
        // Get the data info for the company.
        const dataInfo = await this.getInfoForApolloCompanyId(apolloCompanyId);

        // If we're not complete, then we can't return the employees.
        if (dataInfo.state !== 'complete') {
            throw new Error(`Cannot get employees for company ${apolloCompanyId} because the data is not complete.  Current state: ${dataInfo.state}`);
        }

        // Get the employees from the database.
        return await this.apolloDbService.getEmployeesForApolloCompanyId(apolloCompanyId);
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
        dataInfo = await this.loadEmployeesForCompanyInternal({ organizationIds: [apolloCompanyId] }, dataInfo);

        // Return the result.
        return dataInfo;
    }

    /** Process to load all employees from apollo. */
    private async loadEmployeesForCompanyInternal(query: ApolloPeopleRequestParams, dataInfo: ApolloDataInfo): Promise<ApolloDataInfo> {
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
            let internalQuery = this.createBasePeopleQuery({
                perPage: this.serviceConfig.maxPageSize,
                page: pageCounter++,
                ...query,
            });

            // Ensure that we don't exceed the maximum pull count.
            //  This is a temporary safety measure for now.
            if (internalQuery.page! > maxPullCount) {
                dataInfo.state = 'error';
                dataInfo.errorState = 'exceeds-max-record-count';
                dataInfo.errorMessage = `The max API calls for people, on a single company, is ${maxPullCount}.  This has been exceeded.`;
                return await this.apolloDbService.upsertDataInfo(dataInfo);
            }

            // This is a DEV constraint for now.
            if (internalQuery.page! > DEV_MAX_CALL_COUNT) {
                dataInfo.state = 'error';
                dataInfo.errorState = 'max-safety-count-error';
                dataInfo.errorMessage = `The maximum call count of ${DEV_MAX_CALL_COUNT} for development purposes has been exceeded.`;
                return await this.apolloDbService.upsertDataInfo(dataInfo);
            }

            try {
                // Load this set.
                const newDataSet = await this.apolloApiClient.searchPeople(internalQuery);

                // Update the info status.
                dataInfo = await this.intraOpPeopleUpdateDataInfo(dataInfo, newDataSet, internalQuery);

                if (dataInfo.state !== 'error') {
                    // Get the employees from the response.
                    const employees = getEmployeesFromPeopleResponse(newDataSet as ApolloPeopleResponse);

                    // Insert them into the database.
                    for (const employee of employees) {
                        await this.apolloDbService.upsertApolloEmployee(employee);
                    }
                }


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
                if (apiResponse.error) {
                    resultInfo.errorMessage = apiResponse.error;
                } else if (apiResponse.message) {
                    resultInfo.errorMessage = apiResponse.message;
                } else {
                    resultInfo.errorMessage = 'Unknown Apollo API error response';
                }

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
            if (apiResponse.pagination.page >= apiResponse.pagination.total_pages) {
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
