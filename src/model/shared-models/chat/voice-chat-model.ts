import { ChatVoices } from "./voices.model";

/** The model for sending text to speech to the AI. */
export interface VoiceChatModel {
    model: string,
    voice: 'alloy' | 'ash' | 'coral' | 'echo' | 'fable' | 'onyx' | 'nova' | 'sage' | 'shimmer',
    input: string,
    instructions: string;
}