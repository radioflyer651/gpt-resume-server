import { Socket } from "socket.io";
import { ToastMessage } from "../../model/toast-message.model";
import { mainChatSocketServer } from "../../app-globals";
import { AiFunctionGroup } from "../../model/shared-models/functions/ai-function-group.model";
import { sendToastMessageDefinition } from "../../ai-functions/send-toast-message.ai-function";
import { MainChatSocketService } from "../../server/socket-services/main-chat.socket-serice";
import { TarotSocketService } from "../../server/socket-services/tarot.socket-service";
import { TarotDbService } from "../../database/tarot-db.service";
import { ObjectId } from "mongodb";
import { FunctionGroupProvider } from "../../model/function-group-provider.model";

/** Factory function to create ChatFunctionsServices on demand. */
export function tarotGameFunctionsServiceFactory(socket: Socket, tarotGameId: ObjectId, tarotSocketService: TarotSocketService, tarotDbService: TarotDbService): TarotGameFunctionsService {
    return new TarotGameFunctionsService(socket, tarotGameId, tarotSocketService, tarotDbService);
}

/** ChatFunctionService gets created on each request or socket message.  Since these items have important
 *   context, the service has to work with each one individually to avoid a context management nightmare. */
export class TarotGameFunctionsService implements FunctionGroupProvider {
    constructor(
        public readonly socket: Socket,
        public readonly tarotGameId: ObjectId,
        public readonly tarotSocketService: TarotSocketService,
        public readonly tarotDbService: TarotDbService,
    ) {
        if (!socket) {
            console.error('No socket was passed to the ChatFunctionService.');
        }
    }

    /** FOR LLM: Returns the details for a set of tarot cards specified by their IDs. */
    getTarotCardsDetails = async (cardIds: string[]): Promise<string> => {
        // Get the cards.
        const cards = await this.tarotDbService.getGameCardsByIds(cardIds.map((id) => new ObjectId(id)));

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
    getTarotCardsImageDetails = async (tarotIds: string[]): Promise<string> => {
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

    /** Returns all function groups that this chat service can provide. */
    getFunctionGroups = (): AiFunctionGroup[] => {
        const fnGroup: AiFunctionGroup = {
            groupName: 'UI Functions',
            functions: [
                {
                    definition: sendToastMessageDefinition,
                    function: this.getTarotCardsDetails
                },
                {
                    definition: sendToastMessageDefinition,
                    function: this.getTarotCardsImageDetails
                },
                {
                    definition: sendToastMessageDefinition,
                    function: this.flipTarotCard
                }
            ]
        };

        return [fnGroup];
    };

}