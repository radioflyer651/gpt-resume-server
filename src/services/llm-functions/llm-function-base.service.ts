import OpenAI from "openai";
import { OpenAiConfig } from "../../model/app-config.model";
import { AiFunctionDefinitionPackage, AiFunctionGroup, convertFunctionGroupsToPackages } from "../../model/shared-models/functions/ai-function-group.model";
import { FunctionCallOutput, FunctionTool, ResponseCreateParams, ResponseFunctionToolCall } from "../../forwarded-types.model";

/** Represents a method/function, just like one that would be called through code, except this uses
 *   an LLM to perform the actual call, and/or action.  For instance, given a freeform message, and a function "definition"
 *   the AI could call the function to create a new company, filling in the inputs to the function from the freeform message. */
export abstract class LlmFunctionBase<T_RESULT, T_LLM_RESPONSE = T_RESULT> {
    private readonly openAi: OpenAI;

    constructor(config: OpenAiConfig) {
        this.openAi = new OpenAI({
            apiKey: config.openAiKey,
            organization: config.openAiOrg,
        });
    }

    async execute(): Promise<T_RESULT> {
        await this.initialize();
        const llmResponse = await this.executeLlm();
        return await this.processResult(llmResponse);
    }

    /** Gets or sets the maximum number of calls to the LLM that are permitted, to avoid infinite loops of any kind. */
    protected maxLlmCallCount = 5;

    abstract getLlmInstructions(): Promise<string[]>;
    abstract get requiredOutputToolName(): string;
    /** Implemented by the subclass to provide the LLM with tools/functions to call to perform any required tasks. */
    abstract getFunctionGroupsBase(): AiFunctionGroup[];

    /** Called internally to get the functions defined by the subclass and this base class. */
    private getFunctionGroups(): AiFunctionGroup[] {
        // Copy the subclass' list, so we don't modify a potential static value.
        const result = this.getFunctionGroupsBase().slice();
        // Add our functions to the list.
        result.push({ groupName: 'LLM Operation Functions', functions: [errorFunctionPackage] });
        // Return it.
        return result;
    }

    /** Returns the model to use for LLM chat. */
    protected abstract get chatModel(): string;
    protected async initialize(): Promise<void> { }

    protected abstract processResult(
        llmResult: T_LLM_RESPONSE
    ): Promise<T_RESULT>;

    /** When set to true, additional instructions are provided to the LLM that the goal
     *   of the operation is to call the requiredOutputToolName for function completion. */
    protected provideGoalInstruction: boolean = true;

    /** Returns the "goal" instructions, for use as system instructions to the LLM. */
    protected get getGoalInstructions(): string[] {
        return [
            `The final goal of this interaction is to call the ${this.requiredOutputToolName} tool.`
        ];
    }

    private async executeLlm(): Promise<T_LLM_RESPONSE> {
        const messages: any[] = (await this.getLlmInstructions()).map((instr) => ({
            role: "system",
            content: instr,
        }));

        // Convert the function groups into functions we can use in the API call.
        const tools = this.getFunctionGroups().reduce((p, c) => [...p, ...c.functions.map(f => f.definition)], [] as FunctionTool[]);

        let callCount = 0;
        while (callCount++ < this.maxLlmCallCount) {
            // Create the call (data) to be made against the LLM API.
            const responseCreation: ResponseCreateParams = {
                model: this.chatModel,
                input: messages,
                tools: tools
            };

            const apiResult = await this.openAi.responses.create(responseCreation);

            const fnCalls = apiResult.output.filter(x => x.type === 'function_call');
            if (fnCalls.length < 1) {
                // This is a message.  We should store it, so we can continue on.
                // messages.push(apiResult);

                // Actually - we probably shouldn't obtain any messages.  This is probably an error.

            } else {
                // Make each function call, and collect their promise results.
                const functionCalls = fnCalls.map(fc => ({ call: fc, resultPromise: this.callTool(fc) }));

                // Wait on the promises to finish.
                const results = await Promise.all(functionCalls.map(fc => fc.resultPromise));

                // If any of these are the target function, then we're done.  Return it.
                const targetFunction = functionCalls.find(f => f.call.name === this.requiredOutputToolName);
                if (targetFunction) {
                    const rawResult = await targetFunction.resultPromise;
                    return rawResult.output as T_LLM_RESPONSE;
                }

                // Add the results to the chat history.
                messages.push(...results);
            }
        }

        throw new Error(
            `LLM did not invoke required tool: ${this.requiredOutputToolName} in the required number of calls.`
        );
    }

    /** Given a Function Call response from the LLM, and a list of function definitions, calls the appropriate
     *   function for the call, and returns the result. */
    private async callTool(functionCall: ResponseFunctionToolCall): Promise<FunctionCallOutput> {
        const toolList = convertFunctionGroupsToPackages(this.getFunctionGroups());

        try {
            // Find the function definition in question.
            const fnDefinition = toolList.find(x => x.definition.name === functionCall.name);

            // If not found, then we have a problem.
            if (!fnDefinition) {
                throw new Error(`No function with the name ${functionCall.name} was found in the toolList.`);
            }

            // Get the result from the definition.
            const args = JSON.parse(functionCall.arguments);
            let result = await fnDefinition.function(args);

            // Return the result.
            return {
                call_id: functionCall.call_id,
                type: "function_call_output",
                status: "completed",
                output: result
            };
        } catch (err: any) {
            // Print the error to the prompt.
            const errorMessage = `An error occurred when trying to run the tool ${functionCall.name}.  \nError: ${err}\n\nTrace:\n${err?.stack ?? 'No Trace'}`;
            console.trace('See error below.');
            console.error(errorMessage);

            // Return the as an error.
            return {
                call_id: functionCall.call_id,
                type: "function_call_output",
                status: "incomplete",
                output: errorMessage
            };
        }
    }
}

const errorFunctionPackage: AiFunctionDefinitionPackage = {
    definition: {
        name: 'llm_fn_call_llm_error',
        parameters: {
            "type": "object",
            "required": [
                "message"
            ],
            "properties": {
                "message": {
                    "type": "string",
                    "description": "The error message to be thrown."
                }
            },
            "additionalProperties": false
        },
        strict: true,
        type: 'function',
        description: `Called by the LLM, when it detects an error scenario, and cannot resolve it.  This is to report the error to the calling function, and end the process.`
    },
    function: ({ message }: { message: string; }) => {
        throw new Error(message);
    }
};