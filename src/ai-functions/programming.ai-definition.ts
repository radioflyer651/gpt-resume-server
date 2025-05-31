import { FunctionTool } from "../forwarded-types.model";


const objectPropertyDefinition = {
    type: 'object',
    required: [
        'name',
        'description',
        'type'
    ],
    additionalProperties: false,
    properties: {
        name: {
            type: 'string',
            description: 'The name of the property.'
        },
        description: {
            type: 'string',
            description: 'A description of what the property is for.  Typically, this comes from the JSDOC attached to the property.'
        },
        type: {
            type: 'string',
            enum: [
                'string',
                'number',
                'object',
                'array',
            ]
        }
    }
};

export const objectPropertiesAiDefinition = {
    type: 'object',
    required: [
        'propertyList',
        'typeName'
    ],
    additionalProperties: false,
    properties: {
        propertyList: {
            type: 'array',
            description: 'The properties, types, and descriptions of each property in the target object.',
            items: objectPropertyDefinition
        },
        typeName: {
            type: 'string',
            description: 'The name of the type.',
        }
    }
};

export const aiFunctionDefinition: FunctionTool = {
    name: "get_json_schema_for_ai_tools",
    type: "function",
    description: `Given a set of type information, returns the basic JSON Schema for the type.  This can be used in OpenAI tool definitions.`,
    strict: true,
    parameters: objectPropertiesAiDefinition
};
