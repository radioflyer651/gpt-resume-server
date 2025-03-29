import { ObjectId } from "mongodb";
import { AppChatService } from "./app-chat.service";
import { LlmChatProcessAsyncMessage } from "./llm-chat-service.service";
import { TarotDbService } from "../database/tarot-db.service";
import { TarotGame } from "../model/shared-models/tarot-game/tarot-game.model";
import { NewDbItem } from "../model/shared-models/db-operation-types.model";
import { ChatTypes } from "../model/shared-models/chat-types.model";

/** Provides all functionality for the tarot game. */
export class TarotChatService {
    constructor(
        private readonly tarotDbService: TarotDbService,
        private readonly appChatService: AppChatService,
        private readonly llmChatService: LlmChatProcessAsyncMessage
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
        return resultGame;
    }
}