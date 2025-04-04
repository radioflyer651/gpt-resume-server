import { ObjectId } from "mongodb";
import { DbService } from "./db-service";
import { TarotGame } from "../model/shared-models/tarot-game/tarot-game.model";
import { DbCollectionNames } from "../model/db-collection-names.constants";
import { nullToUndefined } from "../utils/empty-and-null.utils";
import { assignIdToInsertable, isNewDbItem, UpsertDbItem } from "../model/shared-models/db-operation-types.model";
import { TarotCard, TarotCardDetails } from "../model/shared-models/tarot-game/tarot-card.model";


/** Provides database services for the tarot game. */
export class TarotDbService extends DbService {

    /** Returns a listing of all games for a specified user. */
    async getGamesForUser(userId: ObjectId): Promise<TarotGame[]> {
        return await this.dbHelper.makeCallWithCollection(DbCollectionNames.TarotGames, async (db, collection) => {
            return await collection.find<TarotGame>({ userId }).toArray();
        });
    }

    /** Returns a tarot game with a specified ID. */
    async getGameById(gameId: ObjectId): Promise<TarotGame | undefined> {
        return await this.dbHelper.makeCallWithCollection(DbCollectionNames.TarotGames, async (db, collection) => {
            return nullToUndefined(await collection.findOne<TarotGame>({ _id: gameId }));
        });
    }

    async getGameByChatId(chatId: ObjectId): Promise<TarotGame | undefined> {
        return await this.dbHelper.makeCallWithCollection(DbCollectionNames.TarotGames, async (db, collection) => {
            return nullToUndefined(await collection.findOne<TarotGame>({ gameChatId: chatId }));
        });
    }

    /** Deletes a specified TarotGame from the database. */
    async deleteGameById(gameId: ObjectId): Promise<void> {
        return await this.dbHelper.makeCallWithCollection(DbCollectionNames.TarotGames, async (db, collection) => {
            const result = await collection.deleteOne({ _id: gameId });
        });
    }


    /** Returns a tarot cards with a specified IDs. */
    async getGameCardsByIds(cardIds: ObjectId[]): Promise<TarotCardDetails[]> {
        return await this.dbHelper.makeCallWithCollection(DbCollectionNames.TarotCards, async (db, collection) => {
            return await collection.find<TarotCardDetails>({ _id: { $in: cardIds } }, {
                projection:
                    { _id: 1, cardName: 1, cardAlignment: 1, technologicalTheme: 1, meaning: 1, imageFilePrefix: 1 }
            }).toArray();
        });
    }

    /** Returns image details for game cards, for specified Ids */
    async getGameCardsImageDetailsByIds(cardIds: ObjectId[]): Promise<{ _id: ObjectId, imageDescription: string; }[]> {
        return await this.dbHelper.makeCallWithCollection(DbCollectionNames.TarotCards, async (db, collection) => {
            return await collection.find<TarotCard>({ _id: { $in: cardIds } },
                {
                    projection:
                    {
                        _id: 1,
                        imageDescription: 1
                    }
                }).toArray();
        });
    }


    /** Upserts a specified tarot game. */
    async upsertGame(tarotGame: UpsertDbItem<TarotGame>): Promise<TarotGame> {
        return await this.dbHelper.makeCallWithCollection(DbCollectionNames.TarotGames, async (db, collection) => {
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

    /** Returns a TarotCard with a specified ID. */
    async getGameCardById(cardId: ObjectId): Promise<TarotCard | undefined> {
        return this.dbHelper.makeCallWithCollection(DbCollectionNames.TarotCards, async (db, collection) => {
            return nullToUndefined(await collection.findOne<TarotCard>({ _id: cardId }));
        });
    }

    /** Returns a TarotCardDetails with a specified ID. */
    async getGameCardDetailsById(cardId: ObjectId): Promise<TarotCardDetails | undefined> {
        return this.dbHelper.makeCallWithCollection(DbCollectionNames.TarotCards, async (db, collection) => {
            return nullToUndefined(await collection.findOne<TarotCardDetails>({ _id: cardId }, {
                projection:
                    { _id: 1, cardName: 1, cardAlignment: 1, technologicalTheme: 1, meaning: 1, imageFilePrefix: 1 }
            }));
        });
    }

    /** Returns all game cards from the database. */
    async getAllGameCards(): Promise<TarotCardDetails[]> {
        return this.dbHelper.makeCallWithCollection(DbCollectionNames.TarotCards, async (db, collection) => {
            return await collection.find<TarotCard>({}, {
                projection: {
                    _id: 1,
                    cardName: 1,
                    cardAlignment: 1,
                    technologicalTheme: 1,
                    meaning: 1,
                    imageFilePrefix: 1,
                }
            }).toArray();
        });
    }

    /** Returns just the IDs, card names, and base image names of all game cards. */
    async getAllGameCardIdsNamesAndImageNames(): Promise<{ _id: ObjectId, cardName: string, imageFilePrefix: string; }[]> {
        return this.dbHelper.makeCallWithCollection(DbCollectionNames.TarotCards, async (db, collection) => {
            return await collection.find<TarotCard>({}, { projection: { _id: 1, cardName: 1, imageFilePrefix: 1 } }).toArray();
        });
    }

    /** Inserts the data for a specified card into the database. */
    async insertCardData(cardInfo: TarotCard): Promise<void> {
        return this.dbHelper.makeCallWithCollection(DbCollectionNames.TarotCards, async (db, collection) => {
            await collection.insertOne(cardInfo);
        });
    }
}