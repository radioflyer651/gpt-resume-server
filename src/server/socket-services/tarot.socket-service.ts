import { Socket } from "socket.io";
import { SocketServiceBase } from "./socket-server-base.socket-service";
import { ChatCallback, SocketErrorTypes, SocketServer } from "../socket.server";
import { TarotChatService } from "../../services/tarot-chat.service";
import { ObjectId } from "mongodb";
import { ChatMessage, ClientChat } from "../../model/shared-models/chat-models.model";
import { TarotGame } from "../../model/shared-models/tarot-game/tarot-game.model";
import { convertChatToClientChat } from "../../utils/convert-to-client-chat";
import { TarotDbService } from "../../database/tarot-db.service";
import { LlmChatService } from "../../services/llm-chat-service.service";
import { ChatDbService } from "../../database/chat-db.service";

// Client Event Names (from server)

// Server Event Names (from client)
//  sendStartTarotGame - must include callback.

export class TarotSocketService extends SocketServiceBase {
    constructor(
        socketServer: SocketServer,
        private readonly tarotChatService: TarotChatService,
        private readonly tarotDbService: TarotDbService,
        private readonly appChatService: LlmChatService,
        private readonly chatDbService: ChatDbService,
    ) {
        super(socketServer);
    }

    async initialize(): Promise<void> {
        // Connect to the socket functions.
        this.socketServer.subscribeToEvent('sendStartTarotGame')
            .subscribe(message => {
                if (!message.callback) {
                    throw new Error(`callback was not provided.  Is the client calling "withReply" version?`);
                }
                if (!message.userId) {
                    throw new Error(`userID was not set.`);
                }
                this.receiveStartTarotGame(message.socket, message.userId!, message.data, message.callback);
            });
    }

    /** Called by the client, returns a new tarot game and chat. */
    async receiveStartTarotGame(socket: Socket, userId: ObjectId, args: any[], responseCallback: ChatCallback<{ tarotChat: ClientChat, game: TarotGame; }>) {
        // Get the new game and chat.
        const gameAndChat = await this.tarotChatService.startNewGame(userId);

        // Convert the chat to a client chat.
        const clientChat = convertChatToClientChat(gameAndChat.chat);

        // Return the result to the client.
        responseCallback({ game: gameAndChat.tarotGame, tarotChat: clientChat });
    }

    /** Sends the list of TarotGames to the user. */
    async sendTarotGames(socket: Socket, userId: ObjectId, responseCallback: ChatCallback<TarotGame[]>) {
        // Get the games for the user.
        const games = await this.tarotDbService.getGamesForUser(userId);

        // Send the games back.
        responseCallback(games);
    }

    async sendTarotCardFlip(socket: Socket) {

    }

    async receiveTarotGameChat(socket: Socket, gameId: ObjectId, message: string) {
        // Get the game.
        const game = await this.tarotDbService.getGame(gameId);

        // Validate the user ID.
        if (game?.userId !== gameId) {
            this.socketServer.reportError(socket, SocketErrorTypes.Security, `Current userId does not match games userId.`);
            // Do nothing.
            return;
        }

        // Get the chat for this game.
        const chat = await this.chatDbService.getChatById(game.gameChatId);

        // Validate the chat.
        if (!chat) {
            this.socketServer.reportError(socket, SocketErrorTypes.BadObjectId, 'Chat does not exist for game with specified id.');
            return;
        }

        this.callWithErrorReporting(socket, async () => {
            console.warn('We need to add server functions here!');

            // Make the chat call, and response to any chat messages that come from it.
            this.appChatService.createChatResponse(game.gameChatId, message).subscribe(message => {
                if (typeof message === 'string') {
                    this.sendTarotGameChat(socket, chat._id, { role: 'user', content: message });
                } else {
                    this.sendTarotGameChat(socket, chat._id, message);
                }
            });

        });
    }

    /** Sends a tarot chat message to the client. */
    async sendTarotGameChat(socket: Socket, chatId: ObjectId, message: ChatMessage) {
        socket.emit('receiveTarotGameChat', chatId, message);
    }

}