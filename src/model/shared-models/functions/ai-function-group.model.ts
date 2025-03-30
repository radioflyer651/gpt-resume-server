import { FunctionTool } from "../../../forwarded-types.model";

/** A group of AiFunctions that work as a group or category. */
export interface AiFunctionGroup {

    /** Provides a name for this group of functions. */
    groupName: string;

    /** Gets or sets a list of functions that belong to this group. */
    functions: AiFunctionDefinitionPackage[];
}

/** Contains an AiFunctionDefinition and the actual function to call when
 *   the function is called. */
export interface AiFunctionDefinitionPackage {
    /** The function definition to send to the AI. */
    definition: FunctionTool;

    /** The function to call when the AI calls this function. */
    function: (...args: any[]) => string | Promise<string>;
}


/** Given a specified set of AiFunctionGroup objects, returns all of their AiFunctionDefinitionPackages. */
export function convertFunctionGroupsToPackages(functionGroups: AiFunctionGroup[]): Array<AiFunctionDefinitionPackage> {
    const result = functionGroups.reduce((p, c) => [...p, ...c.functions], [] as AiFunctionDefinitionPackage[]);
    return result;
}