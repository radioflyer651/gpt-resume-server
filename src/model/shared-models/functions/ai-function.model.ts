export interface AiFunctionDefinition {
    name: string;
    description: string;
    parameters: AiFunctionObjectParameters[];
    strict: boolean;
}

export interface AiFunctionObjectParameters {
    type: string;
    properties: Record<string, AiFunctionProperty>;
    required: string[];
    additionalProperties: boolean;
}

export interface AiFunctionProperty {
    type: string;
    description: string;
}

export interface AiFunctionEnumProperty extends AiFunctionProperty {
    enum: string[];
}
