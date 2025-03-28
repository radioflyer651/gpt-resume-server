import { FunctionTool } from "../forwarded-types.model";

export const sendToastMessageDefinition: FunctionTool = {
    name: 'ui_send_toast',
    type: 'function',
    description: `Sends a toast popup to the user, off to the side of the screen, to provide quick update information.  It's not meant for long sets of info.`,
    parameters: {
        type: 'object',
        required: ['level', 'content', 'title'],
        additionalProperties: false,
        properties: {
            'level': {
                type: 'string',
                description: 'The level of importance of the message.',
                enum: [
                    'info',
                    'error',
                    'warn'
                ]
            },
            'title': {
                type: 'string',
                description: 'The header of the message, if any.',
            },
            'content': {
                type: 'string',
                description: 'The body of the message, which has the more detail that the title.'
            }
        }
    },
    strict: true
};

export const sendToastMessageDefinition_OLD: FunctionTool = {
    name: 'ui_send_toast',
    type: 'function',
    description: `Sends a toast popup to the user, off to the side of the screen, to provide quick update information.  It's not meant for long sets of info.`,
    parameters: {
        type: 'object',
        additionalProperties: false,
        required: ['message'],
        properties: {
            message: {
                type: 'object',
                required: ['level', 'content', 'title'],
                additionalProperties: false,
                properties: {
                    'level': {
                        type: 'string',
                        description: 'The level of importance of the message.',
                        enum: [
                            'info',
                            'error',
                            'warn'
                        ]
                    },
                    'title': {
                        type: 'string',
                        description: 'The header of the message, if any.',
                    },
                    'content': {
                        type: 'string',
                        description: 'The body of the message, which has the more detail that the title.'
                    }
                }
            }
        }
    },
    strict: true
};
