import { ObjectId } from "mongodb";
import { CompanyManagementDbService } from "../database/company-management-db.service";
import { Company } from "../model/shared-models/company.model";
import { PaginatedResult } from "../model/shared-models/paginated-result.model";
import { CompanyListingInfo } from "../model/shared-models/company-listing.model";


/** Service that handles company and job data. */
export class CompanyManagementService {
    constructor(
        protected readonly companyDbService: CompanyManagementDbService,
    ) {

    }

    /** Returns a company, specified by its ID. */
    getCompanyById = async (id: ObjectId): Promise<Company | undefined> => {
        return await this.companyDbService.getCompanyById(id);
    };

    /** Returns a list of companies, paginated with specified values. */
    getCompanyList = async (skip: number, limit: number): Promise<CompanyListingInfo[]> => {
        return await this.companyDbService.getCompanyList();
    };
}