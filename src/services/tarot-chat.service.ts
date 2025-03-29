import { ObjectId } from "mongodb";
import { AppChatService } from "./app-chat.service";
import { LlmChatService } from "./llm-chat-service.service";
import { TarotDbService } from "../database/tarot-db.service";
import { TarotGame } from "../model/shared-models/tarot-game/tarot-game.model";
import { NewDbItem } from "../model/shared-models/db-operation-types.model";
import { ChatTypes } from "../model/shared-models/chat-types.model";
import { UserDbService } from "../database/user-db.service";
import { ChatDbService } from "../database/chat-db.service";

/** Provides all functionality for the tarot game. */
export class TarotChatService {
    constructor(
        private readonly tarotDbService: TarotDbService,
        private readonly appChatService: AppChatService,
        private readonly chatDbService: ChatDbService,
        private readonly llmChatService: LlmChatService,
        private readonly userDbService: UserDbService,
    ) { }

    /** Returns a boolean value indicating whether or not the user has an open Tarot Game. */
    async userHasOpenTarotChat(userId: ObjectId): Promise<boolean> {
        // Get the games.
        const games = await this.tarotDbService.getGamesForUser(userId);

        // Return the result.
        return games.some(g => !g.isComplete && !g.isClose);
    }

    /** Starts a new TarotGame for a specified user, and returns the game. */
    async startNewGame(userId: ObjectId): Promise<TarotGame> {
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
        await this.llmChatService.createChatResponse(newChat._id, {role: 'system', content: `The user has initiated a chat with you.  Begin the dialog.`}, [])

        // Return the game.
        return resultGame;
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
}