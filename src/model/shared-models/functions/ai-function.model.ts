export interface AiFunctionDefinition {
    type: 'function';
    name: string;
    description: string;
    parameters: AiFunctionObjectParameters;
    strict: boolean;
}

export interface AiFunctionObjectParameters {
    type: string;
    properties: AiFunctionParameter | Record<string, AiFunctionParameter>;
    required: string[];
    additionalProperties: boolean;
}

type AiFunctionParameter = AiFunctionProperty | AiFunctionObjectParameters;

export interface AiFunctionProperty {
    type: string;
    enum?: string[];
    description: string;
}
