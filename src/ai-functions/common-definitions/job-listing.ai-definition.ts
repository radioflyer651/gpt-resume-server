import { DATE_STRING_NOTE, OBJECT_ID_NOTE } from "./common-ai-prop-notes";
import { jobListingAnalysisProperties_AiFunctions } from './job-analysis.ai-definition';

export const jobListingStatusProperties_AiFunctions = {
    type: 'object',
    required: [
        'status',
        'statusDate',
        'isClosed',
    ],
    additionalProperties: false,
    properties: {
        status: {
            type: 'string',
            description: `The title or "action" of this status.  Typically, the first status will be "Applied".  Sometimes it's "Closed", or "Declined".  These are the common ones, but the purpose is to denote an important event about the job listing, in regards to an application for employment.`
        },
        statusDate: {
            type: 'string',
            description: `The date that this status took effect.  This should be a string value that can be converted to a Date() object type in JavaScript.`
        },
        isClosed: {
            type: 'boolean',
            description: `Optional: When all business is complete with the job description (as it pertains to an application for employment), then this should be true.  Otherwise, don't include it.`
        }
    }

};

export const jobListingProperties_AiFunctions = {
    type: 'object',
    required: [
        `companyId`,
        `postingDate`,
        `jobTitle`,
        `urlLink`,
        `description`,
        `jobStatuses`,
        `comments`,
        `analysis`,
        '_id'
    ],
    additionalProperties: false,
    properties: {
        _id: {
            type: ['string', 'null'],
            description: `The MongoDB ObjectId of this job listing.  If this is a new job listing, then this property MUST be omitted. ${OBJECT_ID_NOTE}`
        },
        companyId: {
            type: 'string',
            description: `The MongoDB ObjectId of the company that owns this job listing. ${OBJECT_ID_NOTE}`
        },
        postingDate: {
            type: `string`,
            description: `The date that this job was posted - typically in the job description. ${DATE_STRING_NOTE}`
        },
        jobTitle: {
            type: 'string',
            description: `The job title for this posting.`
        },
        urlLink: {
            type: `string`,
            description: `The URL that this job posting was found at.  This may not be available during creation, so leave it an empty string if that's the case.`
        },
        description: {
            type: `string`,
            description: `This is the ENTIRE job description text, copied and pasted from the source website.  It should be unmodified for any reason.`
        },
        jobStatuses: {
            type: `array`,
            description: `The historical set of status values that were applied to this job posting.`,
            items: jobListingStatusProperties_AiFunctions
        },
        comments: {
            type: `array`,
            description: `Any arbitrary comments to be noted for this job posting.`,
            items: {
                type: `string`,
                description: "Comment regarding the job listing."
            }
        },
        analysis: jobListingAnalysisProperties_AiFunctions
    },
};
