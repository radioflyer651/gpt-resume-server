import { ObjectId } from "mongodb";
import OpenAI from "openai";
import { ChatDbService } from "../database/chat-db.service";
import { FunctionCallOutput, ResponseCreateParams, ResponseFunctionToolCall, ResponseOutputMessage, Tool } from "../model/forwarded-types.model";
import { ToolDefinition } from "../model/tool-definition.model";
import { Chat } from "../model/chat-models.model";

/** When a chat request is made, if a function call is made in between, this is a function
 *   that may be called to send intermediate responses to the UI. */
export type LlmChatProcessAsyncMessage = (message: string) => void | Promise<void>;

/** Provides functionality needed to communicate with the LLM (probably ChatGPT). */
export class ChatService {
    constructor(apiKey: string, private readonly chatDbService: ChatDbService) {
        this.openAi = new OpenAI({ apiKey });
    }

    private readonly openAi: OpenAI;

    /** Creates a new ChatResponse (like a chat completion) against the LLM with a specified new message
     *   for a specified chat.  Optionally, tools (custom functions) may be supplied for the LLM to call.
     *   Optionally, a function may be provided to send a message back to the UI if a tool is called along with a message.
     */
    async createChatResponse(chatId: ObjectId, prompt: string, toolList?: ToolDefinition[], asyncProcessMessage?: (msg: string) => void): Promise<string> {
        // Get the specified chat.
        let chat = await this.chatDbService.getChatById(chatId);

        // If we don't have a chat then we can't do anything.
        if (!chat) {
            throw new Error(`No chat with the specified ID exists.`);
        }

        // Add the new prompt to the message list.
        chat.chatMessages.push(
            {
                role: 'user' as const,
                content: prompt
            });

        // Update the chat in the DB.
        chat = await this.chatDbService.upsertChat(chat);

        // Call the LLM API, and process the results.
        const chatResult = await this.callChatResponse(chat, toolList, asyncProcessMessage);

        // Get the response recast to the right type.
        const resultMessage = chatResult.chatMessages[chatResult.chatMessages.length - 1] as ResponseOutputMessage;

        // Figure out the response.  I doubt there's going to be multiple
        //  items coming out of this.
        let response = resultMessage.content.map(x => {
            if (x.type === 'output_text') {
                return x.text;
            } else {
                return x.refusal;
            }
        }).join(', ');

        // Return the result.
        return response;
    }

    /** Calls the LLM response API for a specified chat, assuming the last value is a user request or function call. 
     *   This may be called recursively if more function calls are made from the resulting response. */
    private async callChatResponse(chat: Chat, toolList?: ToolDefinition[], asyncProcessMessage?: (msg: string) => void | Promise<void>): Promise<Chat> {
        // Assemble the system messages.
        const systemMessages = chat.systemMessages.map(msg => ({
            role: 'system' as const,
            content: msg
        }));

        // Create the message list.
        const messages = [
            ...systemMessages,
            ...chat.chatMessages
        ];

        // Create the call (data) to be made against the LLM API.
        const responseCreation: ResponseCreateParams = {
            model: chat.model,
            input: messages,
            tools: toolList?.map(t => t.tool)
        };

        // Make the API call on the LLM.
        const apiResult = await this.openAi.responses.create(responseCreation);

        // Add the results to the chat.
        chat.chatMessages.push(...apiResult.output);

        // Update the chat in the DB.
        chat = await this.chatDbService.upsertChat(chat);

        // Get any function calls from the response, if there are any.
        const functionCalls = apiResult.output.filter(x => x.type === 'function_call') as ResponseFunctionToolCall[];

        // If we have a function call, and no tool list, then we have a problem.
        if (!toolList && functionCalls.length > 0) {
            throw new Error(`toolList is empty, but function calls were received from the LLM.  This is not possible.`);
        }

        // If there was a function call, inform the caller with their callback function.
        if (asyncProcessMessage && functionCalls.length > 0) {
            // Get the messages for each function call.
            const messages = functionCalls
                .map(fc => this.getToolForFunctionCall(fc, toolList!)).filter(x => !!x)
                .map(fc => fc.processingMessage);

            // Call the callback for each message, and collect the promises.
            const promises = messages.map(message => asyncProcessMessage(message));

            // Wait for the promises to be done, so we can move on.
            await Promise.all(promises);
        }

        // Make any function calls form the LLM, if we have any.
        if (functionCalls.length > 0) {
            // Make each function call, and collect their promise results.
            const resultPromises = functionCalls.map(fc => this.callTool(fc, toolList!));

            // Wait on the promises to finish.
            const results = await Promise.all(resultPromises);

            // Add the results to the chat history.
            chat.chatMessages.push(...results);

            // We have to recall the LLM again with the results.
            //  In doing so, return the result of whatever that is.
            return await this.callChatResponse(chat, toolList, asyncProcessMessage);
        }

        // We have no function responses.
        // Return the response to the caller.
        return chat;

    }

    /** Given a specified set of ToolDefinition objects, returns the one that corresponds to a specified ResponseFunctionToolCall (if any). */
    private getToolForFunctionCall(functionCall: ResponseFunctionToolCall, toolList: ToolDefinition[]) {
        return toolList.find(x => x.tool.name === functionCall.name);
    }

    /** Given a Function Call response from the LLM, and a list of function definitions, calls the appropriate
     *   function for the call, and returns the result. */
    private async callTool(functionCall: ResponseFunctionToolCall, toolList: ToolDefinition[]): Promise<FunctionCallOutput> {
        // Find the function definition in question.
        const fnDefinition = toolList.find(x => x.tool.type === "function" && x.tool.name === functionCall.name);

        // If not found, then we have a problem.
        if (!fnDefinition) {
            throw new Error(`No function with the name ${functionCall.name} was found in the toolList.`);
        }

        // Get the result from the definition.
        let result = fnDefinition.function(...functionCall.arguments);

        // Return the result.
        return {
            call_id: functionCall.call_id,
            type: "function_call_output",
            status: "completed",
            output: await result
        };
    }
}
