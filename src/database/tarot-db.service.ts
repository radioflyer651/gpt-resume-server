import { ObjectId } from "mongodb";
import { DbService } from "./db-service";
import { TarotGame } from "../model/shared-models/tarot-game/tarot-game.model";
import { DbCollectionNames } from "../model/db-collection-names.constants";
import { nullToUndefined } from "../utils/empty-and-null.utils";
import { assignIdToInsertable, isNewDbItem, UpsertDbItem } from "../model/shared-models/db-operation-types.model";


/** Provides database services for the tarot game. */
export class TarotDbService extends DbService {

    /** Returns a listing of all games for a specified user. */
    async getGamesForUser(userId: ObjectId): Promise<TarotGame[]> {
        return await this.dbHelper.makeCallWithCollection(DbCollectionNames.TarotGames, async (db, collection) => {
            return await collection.find<TarotGame>({ userId }).toArray();
        });
    }

    /** Returns a tarot game with a specified ID. */
    async getGame(gameId: ObjectId): Promise<TarotGame | undefined> {
        return await this.dbHelper.makeCallWithCollection(DbCollectionNames.TarotGames, async (db, collection) => {
            return nullToUndefined(await collection.findOne<TarotGame>({ _id: gameId }));
        });
    }

    /** Upserts a specified tarot game. */
    async upsertGame(tarotGame: UpsertDbItem<TarotGame>): Promise<TarotGame> {
        return await this.dbHelper.makeCallWithCollection(DbCollectionNames.TarotCards, async (db, collection) => {
            // Determine if the game is new or not.
            if (isNewDbItem(tarotGame)) {
                // We need to insert the game.
                const result = await collection.insertOne(tarotGame);

                // Update the ID on the game.
                const updatedGame = assignIdToInsertable(tarotGame, result.insertedId);

                // Return the game.
                return updatedGame;
            } else {
                // Recast - silly typescript...
                const actTarotGame = tarotGame as TarotGame;

                // We need to update the game.
                await collection.updateOne(
                    { _id: actTarotGame._id },
                    { $set: actTarotGame },
                    { upsert: true }
                );

                // Return the item.
                return actTarotGame;
            }
        });
    }

    /** Returns the number of game cards that exist for the Tarot Game. */
    async getGameCardCount(): Promise<number> {
        return this.dbHelper.makeCallWithCollection(DbCollectionNames.TarotCards, async (db, collection) => {
            return await collection.countDocuments();
        });
    }
}