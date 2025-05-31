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

export const changeChatModelDefinition: FunctionTool = {
    name: 'admin_change_chat_model',
    type: 'function',
    description: 'Changes the chat model for the LLM chat being used on a specified chat.',
    strict: true,
    parameters: {
        type: "object",
        required: ["chatModel", "chatId"],
        additionalProperties: false,
        properties: {
            chatModel: {
                type: "string",
                description: "The ID of the chat model to change to."
            },
            chatId: {
                type: "string",
                description: "The ID of the chat session to change the chat model on."
            }
        }
    }
};

export const getChatModelDefinition: FunctionTool = {
    name: 'admin_get_chat_model_for_id',
    type: 'function',
    description: 'Returns the name of the chat model for a specified chat session.',
    strict: true,
    parameters: {
        type: "object",
        required: ["chatId"],
        additionalProperties: false,
        properties: {
            chatId: {
                type: "string",
                description: "The ID of the chat session to get the model for."
            }
        }
    }
};

export const listChatModelsDefinition: FunctionTool = {
    name: 'admin_list_chat_models',
    type: 'function',
    description: `Lists all of the available chat models for use in the LLM chat.  Note that costs are in dollars per 1m token.
                    Always make sure the user is aware of the costs of switching to another model.  This can get expensive.
                    Below is the meaning of the return properties of this function:
                        /** User friendly name of the model. */
                        label: string;
                        /** The actual model name used in the chat. */
                        value: string;
                        /** The cost, in dollars, of input tokens, per million. */
                        inputCost: number;
                        /** The cost, in dollars, of output tokens, per million. */
                        outputCost: number;
                        /** The max number of tokens that the model can support. */
                        contextWindow: number;
                        /** The max number of tokens that can be returned in a single response. */
                        maxOutputTokens: number;
                        /** On a scale of 1-5, 5 being the fastest, the speed of this model. */
                        speed: number;
                        /** On a scale of 1-5, 5 being the fastest, the "intelligence" of this model. */
                        reasoning: number;
                        /** Boolean value indicating whether or not this model has "reasoning" tokens.  This makes the model smarter. */
                        reasoningTokens: boolean;
    `,
    strict: true,
    parameters: {
        type: "object",
        required: [],
        additionalProperties: false,
        properties: {}
    }
};

