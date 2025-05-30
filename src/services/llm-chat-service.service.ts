import { ObjectId } from "mongodb";
import OpenAI from "openai";
import { ChatDbService } from "../database/chat-db.service";
import { FunctionCallOutput, FunctionTool, ResponseCreateParams, ResponseFunctionToolCall, ResponseOutputMessage } from "../forwarded-types.model";
import { Chat, ChatMessage } from "../model/shared-models/chat-models.model";
import { OpenAiConfig } from "../model/app-config.model";
import { Observable, shareReplay } from "rxjs";
import { LogDbService } from "../database/log-db.service";
import { AiFunctionDefinitionPackage, AiFunctionGroup, convertFunctionGroupsToPackages } from "../model/shared-models/functions/ai-function-group.model";
import { ChatConfiguratorBase } from "./chat-configurators/chat-configurator.model";
import { ChatTypes } from "../model/shared-models/chat-types.model";
import { User } from "../model/shared-models/user.model";
import { saveAudioFile } from "../utils/audio-folder.methods";
import { ResponseOutputItem } from "openai/resources/responses/responses";
import { AuthDbService } from "../database/auth-db.service";

/** When a chat request is made, if a function call is made in between, this is a function
 *   that may be called to send intermediate responses to the UI. */
export type LlmChatProcessAsyncMessage = (message: string) => void | Promise<void>;

/** Provides functionality needed to communicate with the LLM (probably ChatGPT). */
export class LlmChatService {
    constructor(
        config: OpenAiConfig,
        public readonly chatDbService: ChatDbService,
        public authDbService: AuthDbService,
        public loggingService: LogDbService,
        public readonly chatConfigurations: ChatConfiguratorBase[],
    ) {
        if (!config) {
            throw new Error("OpenAiConfig is required.");
        }
        if (!chatDbService) {
            throw new Error("ChatDbService is required.");
        }
        if (!authDbService) {
            throw new Error("authDbService is required.");
        }
        if (!loggingService) {
            throw new Error("LogDbService is required.");
        }
        if (!chatConfigurations || chatConfigurations.length === 0) {
            throw new Error("At least one ChatConfiguratorBase is required.");
        }

        this.openAi = new OpenAI({ apiKey: config.openAiKey, organization: config.openAiOrg });
    }

    private readonly openAi: OpenAI;

    /** Creates a new ChatResponse (like a chat completion) against the LLM with a specified new message
     *   for a specified chat.  Optionally, tools (custom functions) may be supplied for the LLM to call.
     *   Optionally, a function may be provided to send a message back to the UI if a tool is called along with a message. */
    createChatResponse(chatId: ObjectId, prompt: string | ChatMessage, userId: ObjectId, toolList?: AiFunctionGroup[]): Observable<ChatMessage | string> {
        return new Observable<ChatMessage | string>((subscriber) => {
            // Status to indicate if we've aborted somehow.
            let unsubscribed = false;

            const internals = async () => {
                await this.loggingService.logMessage({
                    level: 'info',
                    message: `Make Chat Call`,
                    data: {
                        prompt: prompt,
                        chatId: chatId
                    }
                });

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

                // Get the user for this call.
                const user = await this.authDbService.getUserById(userId);
                if (!user) {
                    console.warn('No user was provided for the chat.');
                }

                // Update the chat in the DB.
                await this.chatDbService.updateChatMessages(chat);

                // Create the callback function that will send status messages to the UI
                //  through the observable, when status updates are being made.
                const asyncProcessMessage = (message: string | ResponseOutputMessage) => {
                    // Only send this if we're not unsubscribed.
                    if (!unsubscribed) {
                        if (typeof message === 'string') {
                            subscriber.next(message);
                        } else {
                            message.content.forEach(m => {
                                if (m.type === 'output_text') {
                                    subscriber.next({
                                        content: m.text,
                                        role: message.role
                                    });
                                }
                            });
                        }
                    }
                };

                let chatResult: Chat;
                try {
                    // Call the LLM API, and process the results.
                    chatResult = await this.callChatResponse(chat, user!, toolList, asyncProcessMessage);
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
        }).pipe(shareReplay());
    }

    /** Calls the LLM response API for a specified chat, assuming the last value is a user request or function call. 
     *   This may be called recursively if more function calls are made from the resulting response. */
    private async callChatResponse(chat: Chat, user: User, toolList?: AiFunctionGroup[], asyncProcessMessage?: (msg: string | ResponseOutputMessage) => void): Promise<Chat> {
        // Get the configurator for this chat type.
        const configurator = this.getConfiguratorForChatType(chat.chatType);

        // Get the chat configuration instructions for this chat type.
        const instructions = await configurator.getSystemMessagesForChatCall();

        // Get any chat-specific system info messages for the call.
        const chatSpecificInstructions = await configurator.getChatSpecificSystemInfoMessages(chat);

        // If this is an admin user, then add that fact to the system messages.
        if (user.isAdmin) {
            instructions.push(`This user is a site administrator.  Provide them access to diagnostics functions and information that you have available to you.`);
        } else {
            instructions.push(`This user is NOT a site administrator.  They are an ordinary user.`);
        }

        // Assemble the system messages, including the instructions from
        //  the base instructions.
        const systemMessages = [...chat.systemMessages, ...chatSpecificInstructions, ...instructions].map(msg => ({
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

        let apiResult!: Awaited<ReturnType<typeof this.openAi.responses.create>> & { output: Array<ResponseOutputItem>; };
        try {
            // Make the API call on the LLM.
            apiResult = await this.openAi.responses.create(responseCreation);
        } catch (err) {
            this.loggingService.logMessage({
                level: 'error',
                message: `An error occurred when attempting to call the LLM.  ${err?.toString()}`,
                data: err
            });
            console.log(`Error`, err);
        }

        // Add the results to the chat.
        chat.chatMessages.push(...apiResult.output);

        // Update the chat in the DB.
        await this.chatDbService.updateChatMessages(chat);

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

            // Store these replies.
            await this.chatDbService.updateChatMessages(chat);

            // We have to recall the LLM again with the results.
            //  In doing so, return the result of whatever that is.
            return await this.callChatResponse(chat, user, toolList, asyncProcessMessage);
        }

        // We have no function responses.
        // Return the response to the caller.
        return chat;

    }

    /** Given a Function Call response from the LLM, and a list of function definitions, calls the appropriate
     *   function for the call, and returns the result. */
    private async callTool(functionCall: ResponseFunctionToolCall, toolList: AiFunctionDefinitionPackage[]): Promise<FunctionCallOutput> {
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


    /** Returns the configurator for a specified chat type.  If not found, throws an error. */
    getConfiguratorForChatType(chatType: ChatTypes): ChatConfiguratorBase {
        // Find the configurator for the chat type we need.
        const configurator = this.chatConfigurations.find(c => c.chatType === chatType);

        // If not found, then we have issues.
        if (!configurator) {
            throw new Error(`No configurator found for chat type: ${chatType}`);
        }

        return configurator;
    }

    /** Request the LLM to return an audio response with specified content.
     *   Returns an object with the file name of the file with the content, as well as
     *   the content itself. */
    async getAudio(message: string): Promise<{ fileName: string, fileContent: any; }> {
        // Create the instructions for how to voice should sound.
        const instructions = `
                        The message may be in HTML format.  Convert any HTML to text, interpret the meaning of what the HTML is trying to convey, and express that through the voice.
                        Absolutely no HTML should be in the spoken output.

                        Affect: We have it going on together!
                        Tone: High pitch, loli, speech and spoken in a down inflection.
                        Delivery: Keeping it flowing, but not too fast.
                        Emotion: Excited
                        Punctuation: Normal, never pausing too long on commas and transitions.
                `;

        // Make the call to Open AI to get the speech.
        const result = await this.openAi.audio.speech.create({
            model: 'gpt-4o-mini-tts',
            instructions: instructions,
            input: message,
            voice: 'coral'
        });

        // Get the audio content.
        const content = result.body;

        // Save the file to the audio folder.
        const fileName = await saveAudioFile(content, 'mp3');

        // Return the result.
        return { fileName, fileContent: content };
    }
}
