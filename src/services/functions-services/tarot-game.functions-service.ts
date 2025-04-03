import { Socket } from "socket.io";
import { AiFunctionGroup } from "../../model/shared-models/functions/ai-function-group.model";
import { TarotSocketService } from "../../server/socket-services/tarot.socket-service";
import { TarotDbService } from "../../database/tarot.db-service";
import { ObjectId } from "mongodb";
import { IFunctionGroupProvider } from "../../model/function-group-provider.model";
import * as fs from 'fs/promises';
import * as path from 'path';
import { flipTarotCard as flipTarotCardDetails, getAllGameCardListDetails, getTarotCardDetailsDefinition, getTarotCardsImageDetails, loadCardData as loadCardDataDetails } from "../../ai-functions/tarot.ai-functions";


/** ChatFunctionService gets created on each request or socket message.  Since these items have important
 *   context, the service has to work with each one individually to avoid a context management nightmare. */
export class TarotGameFunctionsService implements IFunctionGroupProvider {
    constructor(
        public readonly socket: Socket,
        public readonly tarotGameId: ObjectId,
        public readonly tarotSocketService: TarotSocketService,
        public readonly tarotDbService: TarotDbService,
    ) {
        if (!socket) {
            console.error('No socket was passed to the ChatFunctionService.');
        }
        if (!tarotGameId) {
            throw new Error('No tarotGameId was provided to the TarotGameFunctionsService.');
        }
        if (!tarotSocketService) {
            throw new Error('No tarotSocketService was provided to the TarotGameFunctionsService.');
        }
        if (!tarotDbService) {
            throw new Error('No tarotDbService was provided to the TarotGameFunctionsService.');
        }
    }

    /** Returns the IDs and Names of all game cards. */
    getAllGameCardList = async (): Promise<string> => {
        // Get the cards.
        const allCards = await this.tarotDbService.getAllGameCardIdsNamesAndImageNames();

        // Form the results as a JSON array.
        let result = '[';
        allCards.map(c => result += JSON.stringify(c)).join(', ');
        result += ']';

        // Return the result.
        return result;
    };

    /** FOR LLM: Returns the details for a set of tarot cards specified by their IDs. */
    getTarotCardsDetails = async ({ tarotIds }: { tarotIds: string[]; }): Promise<string> => {
        // Get the cards.
        const cards = await this.tarotDbService.getGameCardsByIds(tarotIds.map((id) => new ObjectId(id)));

        // Format the response for the LLM.
        let result = '';

        cards.forEach(card => {
            result += `
            # Card: ${card._id.toHexString()}
              - Card Name: ${card.cardName}
              - Card Alignment: ${card.cardAlignment}
              - Technological Theme: ${card.technologicalTheme}
              - Meaning/Interpretation: ${card.meaning}

              `;
        });

        // Return the result.
        return result;

    };

    /** FOR LLM: Returns the image details for a set of tarot cards specified by their IDs. */
    getTarotCardsImageDetails = async ({ tarotIds }: { tarotIds: string[]; }): Promise<string> => {
        // Get the cards.
        const cards = await this.tarotDbService.getGameCardsImageDetailsByIds(tarotIds.map((id) => new ObjectId(id)));

        // Format the response for the LLM.
        let result = '';

        cards.forEach(card => {
            result += `
            # Card: ${card._id.toHexString()}
              - Image Description: ${card.imageDescription}
              `;
        });

        // Return the result.
        return result;
    };

    /** FOR LLM: Flips the tarot card in a Tarot game, and returns the details. 
     *   (Current game and flipped card.) */
    flipTarotCard = async (): Promise<string> => {
        // Perform the flip, and get the game/card results.
        const result = await this.tarotSocketService.flipTarotCardForGame(this.tarotGameId);

        // Inform the UI that a card has been flipped.
        const cardsPicked = result.game.cardsPicked;
        this.tarotSocketService.sendTarotCardFlip(this.socket, this.tarotGameId, cardsPicked[cardsPicked.length - 1]);

        // Return the card to the AI.
        return `The card flipped was: (ID: ${result.card._id}) ${result.card.cardName}`;
    };

    /** Loads the cards in the card folder. */
    loadCardData = async (): Promise<string> => {
        console.log(`Loading card data into the database.`);
        try {
            const folderPath = path.join(__dirname, '../../tarot-game/card-data');

            // Get the files in the folder.
            const folderContent = await fs.readdir(folderPath);

            // Load each file into the database.
            for (let i = 0; i < folderContent.length; i++) {
                // Get the file path.
                const filePath = path.join(folderPath, folderContent[i]);

                // Get the file content.
                const content = await fs.readFile(filePath, 'utf8');

                // Convert to an object.
                const obj = JSON.parse(content);

                // Send it to the database.
                await this.tarotDbService.insertCardData(obj);
            }
        } catch (err) {
            return `Error: ${err}`;
        }

        return 'All cards inserted.';
    };

    /** Returns all function groups that this chat service can provide. */
    getFunctionGroups = (): AiFunctionGroup[] => {
        const fnGroup: AiFunctionGroup = {
            groupName: 'UI Functions',
            functions: [
                {
                    definition: getTarotCardDetailsDefinition,
                    function: this.getTarotCardsDetails
                },
                {
                    definition: getTarotCardsImageDetails,
                    function: this.getTarotCardsImageDetails
                },
                {
                    definition: flipTarotCardDetails,
                    function: this.flipTarotCard
                },
                {
                    definition: loadCardDataDetails,
                    function: this.loadCardData
                },
                {
                    definition: getAllGameCardListDetails,
                    function: this.getAllGameCardList
                }
            ]
        };

        return [fnGroup];
    };

}