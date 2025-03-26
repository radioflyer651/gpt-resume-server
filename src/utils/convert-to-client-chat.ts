import { MessageType, ResponseInputItem } from "../forwarded-types.model";
import { Chat, ChatMessage, ChatMessageRoleTypes, ClientChat } from "../model/shared-models/chat-models.model";


/** Converts the messages in a chat to ChatMessages, and returns a copy of the chat as a ClientChat. */
export function convertChatToClientChat(chat: Chat): ClientChat {
    const result = { ...chat, chatMessages: convertChatsToMessages(chat.chatMessages) };
    delete (result as any).systemMessages;
    return result;

}

/** Given a specified set of ResponseInputItem objects, filters to messages, and returns only the
 *   ChatMessage content from the source. */
export function convertChatsToMessages(chatMessages: ResponseInputItem[]): ChatMessage[] {
    return chatMessages
        // @ts-ignore - We know that the type is 'message' here.
        .filter(cm => (cm.role === 'user' || cm.role === 'assistant'))
        .map((cm) => {
            return convertChatMessageItem(cm);
        }).filter(x => !!x);
}

function convertChatMessageItem(message: ResponseInputItem): ChatMessage | undefined {
    if (message.type === 'message' || !message.type) {
        if (typeof message.content === 'string') {
            return {
                role: message.role as ChatMessageRoleTypes,
                content: message.content
            };
        } else if (Array.isArray(message.content)) {
            if (message.content.length === 1 && message.content[0].type === 'output_text') {
                return {
                    role: message.role as ChatMessageRoleTypes,
                    content: message.content[0].text
                };
            }
        } else {
            return undefined;
        }
    }
}