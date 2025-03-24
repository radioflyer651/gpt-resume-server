import { FunctionTool, Tool } from "../forwarded-types.model";

export interface ToolDefinition {
    /** Gets or sets the tool description for the LLM, as an option that can be called. */
    tool: FunctionTool;

    /** Gets or sets the function that will be called if the associated tool
     *   is called by the LLM. */
    function: (...args: any) => string | Promise<string>;

    /** When this function is being called, this is the message
     *   to return to the user. */
    processingMessage: string;
}