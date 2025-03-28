import { AiFunctionDefinition } from "./ai-function.model";
import * as x from 'openai/resources/responses/input-items';

/** A group of AiFunctions that work as a group or category. */
export interface AiFunctionGroup {

    /** Provides a name for this group of functions. */
    groupName: string;

    /** Gets or sets a list of functions that belong to this group. */
    functions: AiFunctionDefinition[];
}

