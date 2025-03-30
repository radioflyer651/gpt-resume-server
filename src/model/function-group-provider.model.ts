import { AiFunctionGroup } from "./shared-models/functions/ai-function-group.model";

/** Represents a class that returns AiFunctionGroup objects. */
export interface FunctionGroupProvider {
    getFunctionGroups(): AiFunctionGroup[];
}