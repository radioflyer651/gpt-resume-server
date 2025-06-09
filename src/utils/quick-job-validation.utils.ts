import { QuickJobSetupRequest } from "../model/shared-models/quick-job-setup-request.model";
import { ObjectId } from 'mongodb';


/** TypeGuard for QuickJobSetupRequest. */
export function isQuickJobSetupRequest(target: any): target is QuickJobSetupRequest {
    if (typeof target !== 'object') {
        return false;
    }

    if ('_id' in target) {
        const isId = target._id instanceof ObjectId;
        return isId;
    }

    // We must have the job info then.
    if (!('companyInfo' in target)) {
        return false;
    }

    // Validate the company info.
    const companyInfo = target.companyInfo;
    if (typeof companyInfo !== 'object') {
        return false;
    }

    return [
        'companyName',
        'companyWebsite',
        'companyJobsSite',
    ].every(n => n in companyInfo);
}