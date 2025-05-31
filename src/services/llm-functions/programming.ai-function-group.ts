import { aiFunctionDefinition } from "../../ai-functions/programming.ai-definition";
import { AiObjectDefinition } from "../../model/ai-function-inputs.model";
import { AiFunctionDefinitionPackage, AiFunctionGroup } from "../../model/shared-models/functions/ai-function-group.model";


export class ProgrammerAiFunctionGroup implements AiFunctionGroup {
    constructor() {

    }

    readonly groupName: string = 'Programming Function Group';
    get functions(): AiFunctionDefinitionPackage[] {
        return [
            {
                definition: aiFunctionDefinition,
                function: (params: any) => this.generateAiFunctionDefinition(params)
            }
        ];
    }

    generateAiFunctionDefinition = (functionDefinition: AiObjectDefinition): string => {
        const parameterNames: string[] = [];
        const properties: { [name: string]: any; } = {};
        const parameters: any = {
            type: 'object',
            required: parameterNames,
            additionalProperties: false,
            properties
        };
        const result: any = {
            name: 'FILL_ME_IN',
            description: 'FILL_ME_IN_TOO',
            type: 'function',
            strict: true,
            additionalProperties: false,
            parameters
        };

        // Create the properties.
        functionDefinition.propertyList.forEach(p => {
            properties[p.name] = {
                type: p.type,
                description: p.description,
            };
        });

        // Return the JSON version of this.
        let response = `The following is the result of this function.  Even though it's in JSON format, you should convert it to TypeScript format.  It must be returned to the user in a form they can copy and paste into their own code.


                export const ${functionDefinition.typeName} = ${JSON.stringify(parameters)}
        `;

        return response;
    };
}