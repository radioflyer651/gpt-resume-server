import { FunctionTool } from "../forwarded-types.model";


export const setAllowSoundSiteWide: FunctionTool = {
    name: 'admin_set_allow_sound',
    type: 'function',
    description: `(Admin Function) Turns off or on the ability for users to play their chat responses in audio.  This is a site-wide setting.`,
    parameters: {
        type: "object",
        required: [
            'value'
        ],
        properties: {
            value: {
                type: "boolean",
                description: "true == All buttons to play AI chat audio are enabled.  false == All buttons to play AI chat audio are disabled.",
            }
        },
        additionalProperties: false
    },
    strict: true
};

export const getAllowSoundSiteWide: FunctionTool = {
    name: 'admin_get_allow_sound',
    type: 'function',
    description: `(Admin Function) Returns a boolean value indicating whether users, site wide, are able to play their AI chat responses as audio.`,
    parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
    },
    strict: true
};

export const getAllCompanyList: FunctionTool = {
    name: 'admin_get_all_companies',
    type: 'function',
    description: `(Admin Function) Returns a list of all companies setup in the system.`,
    parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
    },
    strict: true
};

export const addCompanyDefinition: FunctionTool = {
    name: 'admin_add_company_definition',
    type: 'function',
    description: `(Admin Function) Adds a new company to the company list in the database.  This allows users from that company to login.`,
    parameters: {
        type: "object",
        required: [
            'website',
            'name'
        ],
        properties: {
            website: {
                type: "string",
                description: "The website URL, must be in all lowercase."
            },
            name: {
                type: "string",
                description: "The name of the company."
            }
        },
        additionalProperties: false
    },
    strict: true
};