import { FunctionTool } from "../forwarded-types.model";

export const updateCustomResumeDefinition: FunctionTool = {
    name: "update_custom_resume",
    type: 'function',
    description: "AI Function to update a specified CustomResume.",
    parameters: {
        type: 'object',
        required: ['resumeId', 'newContent'],
        properties: {
            resumeId: {
                type: "ObjectId",
                description: "The ID of the resume to be updated."
            },
            newContent: {
                type: "string",
                description: "The new content to update the resume with."
            }
        },
        additionalProperties: false,
    },
    strict: true,
};