import { ObjectId } from "mongodb";
import OpenAI from "openai";
import { ChatDbService } from "../database/chat-db.service";
import { FunctionCallOutput, FunctionTool, ResponseCreateParams, ResponseFunctionToolCall, ResponseOutputMessage, Tool } from "../forwarded-types.model";
import { Chat, ChatMessage } from "../model/shared-models/chat-models.model";
import { OpenAiConfig } from "../model/app-config.model";
import { Observable } from "rxjs";
import { UserDbService } from "../database/user-db.service";
import { LogDbService } from "../database/log-db.service";
import { AiFunctionDefinitionPackage, AiFunctionGroup, convertFunctionGroupsToPackages } from "../model/shared-models/functions/ai-function-group.model";

/** When a chat request is made, if a function call is made in between, this is a function
 *   that may be called to send intermediate responses to the UI. */
export type LlmChatProcessAsyncMessage = (message: string) => void | Promise<void>;

/** Provides functionality needed to communicate with the LLM (probably ChatGPT). */
export class LlmChatService {
    constructor(config: OpenAiConfig, private readonly chatDbService: ChatDbService, private userService: UserDbService, private loggingService: LogDbService) {
        this.openAi = new OpenAI({ apiKey: config.openAiKey, organization: config.openAiOrg });
    }

    private readonly openAi: OpenAI;

    /** Creates a new ChatResponse (like a chat completion) against the LLM with a specified new message
     *   for a specified chat.  Optionally, tools (custom functions) may be supplied for the LLM to call.
     *   Optionally, a function may be provided to send a message back to the UI if a tool is called along with a message. */
    createChatResponse(chatId: ObjectId, prompt: string | ChatMessage, toolList?: AiFunctionGroup[]): Observable<ChatMessage | string> {
        return new Observable<ChatMessage | string>((subscriber) => {
            // Status to indicate if we've aborted somehow.
            let unsubscribed = false;

            const internals = async () => {
                // Get the specified chat.
                let chat = await this.chatDbService.getChatById(chatId);

                // If we don't have a chat then we can't do anything.
                if (!chat) {
                    subscriber.error('No chat with the specified ID exists.');
                    return;
                }

                // Add the new prompt to the message list.
                if (typeof prompt === 'string') {
                    chat.chatMessages.push(
                        {
                            role: 'user' as const,
                            content: prompt
                        });
                } else {
                    chat.chatMessages.push(prompt);
                }

                // Update the chat in the DB.
                chat = await this.chatDbService.upsertChat(chat);

                // Create the callback function that will send status messages to the UI
                //  through the observable, when status updates are being made.
                const asyncProcessMessage = (message: string) => {
                    // Only send this if we're not unsubscribed.
                    if (!unsubscribed) {
                        subscriber.next(message);
                    }
                };

                let chatResult: Chat;
                try {
                    // Call the LLM API, and process the results.
                    chatResult = await this.callChatResponse(chat, toolList, asyncProcessMessage);
                } catch (err) {
                    subscriber.error(err);
                    return;
                }

                // If we're unsubscribed, we don't have to do anything else.
                if (unsubscribed) {
                    return;
                }

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

                // Send the messages through the observable.
                subscriber.next({ role: 'assistant', content: response });

                // And we're done!
                subscriber.complete();
            };

            internals();
        });
    }

    /** Returns a user and company for a specified chat. */
    private async getUserInfoForChat(chat: Chat) {

        // Get the user information for this chat.
        const user = await this.userService.getUserById(chat.userId);

        // Return an empty set if nothing was found.
        if (!user) {
            return {
                user,
                company: undefined
            };
        }

        // Get the company.
        const company = await this.userService.getCompanyById(user?.companyId);

        // Return the set.
        return {
            user,
            company
        };
    }

    /** Using the getUserInfoForChat method, returns a set of information useful for a chat dialog, such as user's name, and things like that. */
    private async getChatInfoForSystem(chat: Chat): Promise<string[]> {
        // Get the user information for this chat.
        const userInfo = await this.getUserInfoForChat(chat);

        // Create information about this chat.
        const chatInfo: string[] = [
            `Chat ObjectID: ${chat._id.toHexString()}`,
            `User ObjectId: ${chat.userId.toHexString()}`,
        ];

        function addParts(recordName: string, target: any): void {
            if (!target) {
                return;
            }

            for (let n in target) {
                const curVal = target[n];
                if (curVal) {
                    if (typeof curVal === 'string' || curVal instanceof ObjectId) {
                        chatInfo.push(`${recordName} property: ${n} = ${curVal.toString()}`);
                    }
                }
            }
        }

        addParts(`User`, userInfo.user);
        addParts(`User's Company`, userInfo.company);

        if (userInfo.user?.userName) {
            chatInfo.push(`The user's name is ${userInfo.user.userName}.`);
        }

        return chatInfo;
    }

    /** Calls the LLM response API for a specified chat, assuming the last value is a user request or function call. 
     *   This may be called recursively if more function calls are made from the resulting response. */
    private async callChatResponse(chat: Chat, toolList?: AiFunctionGroup[], asyncProcessMessage?: (msg: string) => void): Promise<Chat> {

        // Get the chat instructions from the database.
        const instructions = (await this.chatDbService.getBaseInstructions(chat.chatType))?.instructions ?? [];

        // Get information about this chat, the user that owns it, and the company they belong to
        //  to add to the chat details for the AI's use.
        const chatInfo = await this.getChatInfoForSystem(chat);

        // Assemble the system messages, including the instructions from
        //  the base instructions.
        const systemMessages = [...chatInfo, ...chat.systemMessages, ...instructions].map(msg => ({
            role: 'system' as const,
            content: msg
        }));

        // Create the message list.
        const messages = [
            ...systemMessages,
            ...chat.chatMessages
        ];

        // Convert the function groups into functions we can use in the API call.
        const tools = toolList?.reduce((p, c) => [...p, ...c.functions.map(f => f.definition)], [] as FunctionTool[]);

        // Create the call (data) to be made against the LLM API.
        const responseCreation: ResponseCreateParams = {
            model: chat.model,
            input: messages,
            tools: tools
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

        // Make any function calls form the LLM, if we have any.
        if (functionCalls.length > 0) {
            // Make each function call, and collect their promise results.
            const resultPromises = functionCalls.map(fc => this.callTool(fc, convertFunctionGroupsToPackages(toolList!)));

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

    /** Given a Function Call response from the LLM, and a list of function definitions, calls the appropriate
     *   function for the call, and returns the result. */
    private async callTool(functionCall: ResponseFunctionToolCall, toolList: AiFunctionDefinitionPackage[]): Promise<FunctionCallOutput> {
        // Find the function definition in question.
        const fnDefinition = toolList.find(x => x.definition.name === functionCall.name);

        // If not found, then we have a problem.
        if (!fnDefinition) {
            throw new Error(`No function with the name ${functionCall.name} was found in the toolList.`);
        }

        // Get the result from the definition.
        console.log(functionCall.arguments);
        console.log(typeof functionCall.arguments);
        const args = JSON.parse(functionCall.arguments);
        console.log(args);
        console.log(typeof args);
        let result = fnDefinition.function(args);

        // Return the result.
        return {
            call_id: functionCall.call_id,
            type: "function_call_output",
            status: "completed",
            output: await result
        };
    }
}
