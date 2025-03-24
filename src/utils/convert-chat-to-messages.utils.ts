import { MessageType, ResponseInputItem } from "../forwarded-types.model";
import { ChatMessage } from "../model/shared-models/chat-models.model";

/** Given a specified set of ResponseInputItem objects, filters to messages, and returns only the
 *   ChatMessage content from the source. */
export function convertChatsToMessages(chatMessages: ResponseInputItem[]): ChatMessage[] {
    return chatMessages
        // @ts-ignore - We know that the type is 'message' here.
        .filter<MessageType>(cm => cm.type === 'message')
        .filter(cm => (cm.role === 'user' || cm.role === 'assistant') && typeof cm.content === 'string')
        .map((cm) => {
            return {
                role: cm.role!,
                content: cm.content
            } as ChatMessage;
        });
}