
/** Information about the chat models used in the application. */
export interface ChatModelInfo {
    /** User friendly name of the model. */
    label: string;
    /** The actual model name used in the chat. */
    value: string;
    /** The cost, in dollars, of input tokens, per million. */
    inputCost: number;
    /** The cost, in dollars, of output tokens, per million. */
    outputCost: number;
    /** The max number of tokens that the model can support. */
    contextWindow: number;
    /** The max number of tokens that can be returned in a single response. */
    maxOutputTokens: number;
    /** On a scale of 1-5, 5 being the fastest, the speed of this model. */
    speed: number;
    /** On a scale of 1-5, 5 being the fastest, the "intelligence" of this model. */
    reasoning: number;
    /** Boolean value indicating whether or not this model has "reasoning" tokens.  This makes the model smarter. */
    reasoningTokens: boolean;
};

/** The list of chat models offered by OpenAI. */
export const openAiChatModels: ChatModelInfo[] = [
    {
        label: 'o3 mini', // **
        inputCost: 1.10,
        outputCost: 4.40,
        contextWindow: 200000,
        maxOutputTokens: 100000,
        speed: 3,
        reasoning: 4,
        reasoningTokens: true,
        value: 'o3-mini'
    },
    {
        label: 'o3', // **
        inputCost: 10.00,
        outputCost: 40.00,
        contextWindow: 200000,
        maxOutputTokens: 100000,
        speed: 1,
        reasoning: 5,
        reasoningTokens: true,
        value: 'o3-2025-04-16'
    },
    {
        label: 'GPT 4.1', // **
        inputCost: 2.0,
        outputCost: 8.0,
        contextWindow: 1047576,
        maxOutputTokens: 32768,
        speed: 3,
        reasoning: 4,
        reasoningTokens: false,
        value: 'gpt-4.1'
    },
    {
        label: 'GPT 4.1 nano', // **
        inputCost: 0.10,
        outputCost: 0.40,
        contextWindow: 1047576,
        maxOutputTokens: 32768,
        speed: 5,
        reasoning: 2,
        reasoningTokens: false,
        value: 'gpt-4.1-nano'
    },
    {
        label: 'GPT 4o mini', // **
        inputCost: 0.15,
        outputCost: 0.60,
        contextWindow: 128000,
        maxOutputTokens: 16384,
        speed: 4,
        reasoning: 3,
        reasoningTokens: false,
        value: 'gpt-4o-mini'
    },
    {
        label: 'o4 mini', // **
        inputCost: 1.1,
        outputCost: 4.4,
        contextWindow: 200000,
        maxOutputTokens: 100000,
        speed: 3,
        reasoning: 4,
        reasoningTokens: true,
        value: 'o4-mini'
    },
    {
        label: 'GPT 4.1 mini', // **
        inputCost: 0.40,
        outputCost: 1.60,
        contextWindow: 1047576,
        maxOutputTokens: 32768,
        speed: 4,
        reasoning: 3,
        reasoningTokens: false,
        value: 'gpt-4.1-mini'
    },
    {
        label: 'GPT 4o', // **
        inputCost: 2.50,
        outputCost: 10.00,
        contextWindow: 128000,
        maxOutputTokens: 16384,
        speed: 3,
        reasoning: 3,
        reasoningTokens: false,
        value: 'gpt-4o'
    },
];