

/** The basic form that the AI will fill out to aid in generating AI Function (tool) definitions. */
export interface AiObjectDefinition {
    typeName: string;
    propertyList: AiPropertyDefinition[];
}

export interface AiPropertyDefinition {
    /** The name of the parameter. */
    name: string;
    /** A description of what the parameter is for (Typically found in the JSDOC comments.) */
    description: string;
    /** The type of the parameter. */
    type: string;
}
