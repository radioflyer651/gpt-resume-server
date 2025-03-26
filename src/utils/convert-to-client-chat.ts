import { MessageType, ResponseInputItem } from "../forwarded-types.model";
import { Chat, ChatMessage, ClientChat } from "../model/shared-models/chat-models.model";


/** Converts the messages in a chat to ChatMessages, and returns a copy of the chat as a ClientChat. */
export function convertChatToClientChat(chat: Chat): ClientChat {
    return { ...chat, chatMessages: convertChatsToMessages(chat.chatMessages) };
}

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