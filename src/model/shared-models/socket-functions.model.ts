import { Socket } from 'socket.io';
import { ChatMessage } from './chat-models.model';

interface ISocketFunctionsBase {
    sendMainChatMessage(message: string): void;
}

export type ISocketServerFunction = (socket: Socket, ...args: any[]) => Promise<any>;

export type ISocketServerFunctions = {
    [K in keyof ISocketFunctionsBase]: (socket: Socket, ...args: Parameters<ISocketFunctionsBase[K]>) => Promise<ReturnType<ISocketFunctionsBase[K]>>;
};

/** Messages sent from the server to the client. */
interface ISocketClientReceiverFunctions {
    receiveChatMessage(message: ChatMessage, chatId: string): void;
    receiveServerStatusMessage(type: 'info' | 'success' | 'warn' | 'error', message: string): void;
}

export type ISocketClientFunctions = ISocketClientReceiverFunctions & {
    [K in keyof ISocketFunctionsBase]: (...args: Parameters<ISocketFunctionsBase[K]>) => Promise<ReturnType<ISocketFunctionsBase[K]>>;
};
