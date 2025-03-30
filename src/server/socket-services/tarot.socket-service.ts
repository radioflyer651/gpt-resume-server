import { Socket } from "socket.io";
import { SocketServiceBase } from "./socket-server-base.socket-service";
import { ChatCallback, SocketErrorTypes, SocketServer } from "../socket.server";
import { ObjectId } from "mongodb";
import { ChatMessage, ClientChat } from "../../model/shared-models/chat-models.model";
import { TarotGame } from "../../model/shared-models/tarot-game/tarot-game.model";
import { convertChatToClientChat } from "../../utils/convert-to-client-chat";
import { TarotDbService } from "../../database/tarot-db.service";
import { LlmChatService } from "../../services/llm-chat-service.service";
import { ChatDbService } from "../../database/chat-db.service";
import { TarotCardDetails, TarotCardReference } from "../../model/shared-models/tarot-game/tarot-card.model";
import { getTarotCardImageNumbers } from "../../utils/tarot-image.utils";
import { AppChatService } from "../../services/app-chat.service";
import { ChatTypes } from "../../model/shared-models/chat-types.model";
import { NewDbItem } from "../../model/shared-models/db-operation-types.model";
import { UserDbService } from "../../database/user-db.service";

// Client Event Names (from server)

// Server Event Names (from client)
//  sendStartTarotGame - must include callback.

export class TarotSocketService extends SocketServiceBase {
    constructor(
        socketServer: SocketServer,
        private readonly userDbService: UserDbService,
        private readonly tarotDbService: TarotDbService,
        private readonly llmChatService: LlmChatService,
        private readonly appChatService: AppChatService,
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
        // Create a new chat for this game.
        const newChat = await this.appChatService.startNewChatOfType(userId, ChatTypes.TarotGame);

        // Set the system messages for the chat.
        newChat.systemMessages = await this.getChatSystemMessagesForNewGame(userId);

        // Update the chat with the system messages.
        this.chatDbService.upsertChat(newChat);

        // Create the game.
        const newGame: NewDbItem<TarotGame> = {
            userId: userId,
            cardsPicked: [],
            dateCreated: new Date(),
            gameChatId: newChat._id,
            isClose: false,
            isComplete: false,
        };

        // Save the game to the database.
        const resultGame = await this.tarotDbService.upsertGame(newGame);

        // Send the first message to the chat.
        await this.llmChatService.createChatResponse(newChat._id, { role: 'system', content: `The user has initiated a chat with you.  Begin the dialog.` }, []);

        // Return the game.
        const gameAndChat = { tarotGame: resultGame, chat: newChat };

        // Convert the chat to a client chat.
        const clientChat = convertChatToClientChat(gameAndChat.chat);

        // Return the result to the client.
        responseCallback({ game: gameAndChat.tarotGame, tarotChat: clientChat });
    }

    /** Returns the system messages needed for a new tarot game chat. */
    private async getChatSystemMessagesForNewGame(userId: ObjectId): Promise<string[]> {
        // Get the user for this game
        const user = await this.userDbService.getUserById(userId);

        // Get the number of game cards in the deck.
        const gameCardCount = await this.tarotDbService.getGameCardCount();

        // If we don't have one, then we have issues.
        if (!user) {
            throw new Error(`No user exists for the user id ${userId}`);
        }

        // Create the messages.
        const result = [
            `You are a tarot card reader on a website that centers around a web developer's resume.`,
            `The web developer's name is Richard Olson.`,
            `Tarot cards for the reading revolve around web development topics.`,
            `The site visitor that you're doing the reading for is ${user.displayName ?? user.userName}`,
        ];

        // We're keeping the directions separate, for easier management of info.
        const directionResults = [
            `
                Instructions:
                1. The user already knows you're playing the tarot game.
                2. Decide if you need to tell the user the instructions of the game or not.  If so, do so.  The user may have played before, and that will be noted in the system messages along with this one.

                Game Instructions:
                1. There are a deck of ${gameCardCount} tarot cards.
                2. You will pick the cards for the user, when they indicate they're ready for a card.
                  2a. When you pick a card, you will provide some commentary for the user about the card, and how it might affect the outcome.
                  2b. Be careful not to be too wordy.  We want to keep the game moving, but add an element of intrigue.
                3. You must have 5 cards to perform a reading.
                4. After 5 cards are picked, you will provide a meaning of what all 5 cards mean together, and in the order they're in.
                5. The end!
            `
        ];

        return result.concat(directionResults);
    }

    /** Sends the list of TarotGames to the user. */
    async sendTarotGames(socket: Socket, userId: ObjectId, responseCallback: ChatCallback<TarotGame[]>) {
        // Get the games for the user.
        const games = await this.tarotDbService.getGamesForUser(userId);

        // Send the games back.
        responseCallback(games);
    }

    /** For a specified TarotGame, flips a specified card, and returns the whole game plus the details for the flipped card. 
     *   the last card in the cardsPicked array is the one that was flipped. */
    async flipTarotCardForGame(gameId: ObjectId): Promise<{ game: TarotGame, card: TarotCardDetails; }> {
        // Get the game.
        const game = await this.tarotDbService.getGameById(gameId);

        // If none, then we can't do anything.
        if (!game) {
            throw new Error(`Game does not exist with the id ${gameId}`);
        }

        // Ensure we don't have more than 4 cards picked, or we can't continue.
        if (game.cardsPicked.length >= 5) {
            throw new Error(`Game already has 5 cards flipped.  No more cards can be flipped.`);
        }

        // Get all of the game cards.
        const allCards = await this.tarotDbService.getAllGameCardIdsAndImageNames();

        // Get just the cards that are not already picked.
        const remainingCards = allCards.filter(c => !game.cardsPicked.some(p => p._id.equals(c._id)));

        // Pick a random card from the remaining cards.
        const randomCard = remainingCards[Math.floor(Math.random() * remainingCards.length)];

        // Get the image numbers for all cards (since it will include this one too).
        const imageNumberSet = await getTarotCardImageNumbers();

        // Find the numbers for this base name.
        const imageNumbers = imageNumberSet.get(randomCard.imageFilePrefix);

        // If we don't have any, then we can't do anything.
        if (!imageNumbers) {
            throw new Error(`No images exist for the card ${randomCard.imageFilePrefix}`);
        }

        // Get a random number from the image numbers.
        const randomImageNumber = imageNumbers[Math.floor(Math.random() * imageNumbers.length)];

        // Add this card reference to the game.
        game.cardsPicked.push({ _id: randomCard._id, imageNumber: randomImageNumber } as TarotCardReference);

        // Update the game in the database.
        await this.tarotDbService.upsertGame(game);

        // Get the details for the card from the database.
        const cardDetails = await this.tarotDbService.getGameCardDetailsById(randomCard._id);

        // The card must exist, or we couldn't get this far - but... we better check.
        if (!cardDetails) {
            throw new Error(`Card does not exist with the id ${randomCard._id}`);
        }

        // Return the result.
        return { game, card: cardDetails };
    }

    async receiveTarotGameChat(socket: Socket, gameId: ObjectId, message: string) {
        // Get the game.
        const game = await this.tarotDbService.getGameById(gameId);

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
            this.llmChatService.createChatResponse(game.gameChatId, message).subscribe(message => {
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

    /** Sends a message to the client to tell it we flipped a card. */
    async sendTarotCardFlip(socket: Socket, gameId: ObjectId, cardReference: TarotCardReference) {
        socket.emit('receiveTarotCardFlip', gameId, cardReference);
    }

}