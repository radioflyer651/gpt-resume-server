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
import { CompanyManagementDbService } from "../../database/company-management-db.service";
import { AiFunctionGroup } from "../../model/shared-models/functions/ai-function-group.model";

// Client Event Names (from server)

// Server Event Names (from client)
//  sendStartTarotGame - must include callback.

export class TarotSocketService extends SocketServiceBase {
    constructor(
        socketServer: SocketServer,
        private readonly userDbService: CompanyManagementDbService,
        private readonly tarotDbService: TarotDbService,
        private readonly llmChatService: LlmChatService,
        private readonly appChatService: AppChatService,
        private readonly chatDbService: ChatDbService,
    ) {
        super(socketServer);
        if (!socketServer || !userDbService || !tarotDbService || !llmChatService || !appChatService || !chatDbService) {
            throw new Error('One or more required services are not provided.');
        }
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

        // Return the game.
        const gameAndChat = { tarotGame: resultGame, chat: newChat };

        // Get the AiFunctionGroups for this chat type.
        const functionGroups = (await this.llmChatService.getConfiguratorForChatType(ChatTypes.TarotGame).getAiFunctionGroups(socket, gameAndChat.chat._id, userId)).reduce((p, c) => [...p, ...c.getFunctionGroups()], [] as AiFunctionGroup[]);

        // Send the first message to the chat.
        await this.llmChatService.createChatResponse(newChat._id, { role: 'system', content: `The user has initiated a chat with you.  Begin the dialog.` }, userId, functionGroups);

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
        const allCards = await this.tarotDbService.getAllGameCardIdsNamesAndImageNames();

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
            throw new Error(`No images exist for the card ${randomCard.imageFilePrefix}.`);
        }

        // Get a random number from the image numbers.
        const randomImageNumber = imageNumbers[Math.floor(Math.random() * imageNumbers.length)];

        // Add this card reference to the game.
        const newPickedCard = { _id: randomCard._id, cardName: randomCard.cardName, imageNumber: randomImageNumber } as TarotCardReference;
        game.cardsPicked.push(newPickedCard);

        // Update the game in the database.
        await this.tarotDbService.insertCardIntoGame(game._id, newPickedCard);

        // Get the details for the card from the database.
        const cardDetails = await this.tarotDbService.getGameCardDetailsById(randomCard._id);

        // The card must exist, or we couldn't get this far - but... we better check.
        if (!cardDetails) {
            throw new Error(`Card does not exist with the id ${randomCard._id}`);
        }

        // Return the result.
        return { game, card: cardDetails };
    }

    /** Sends a message to the client to tell it we flipped a card. */
    async sendTarotCardFlip(socket: Socket, gameId: ObjectId, cardReference: TarotCardReference) {
        socket.emit('receiveTarotCardFlip', gameId, cardReference);
    }

}