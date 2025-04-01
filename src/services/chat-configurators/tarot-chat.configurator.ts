import { ObjectId } from "mongodb";
import { Chat } from "../../model/shared-models/chat-models.model";
import { ChatTypes } from "../../model/shared-models/chat-types.model";
import { ChatConfiguratorBase } from "./chat-configurator.model";
import { ChatDbService } from "../../database/chat-db.service";
import { ChatBaseInstructions } from "../../model/chat-instructions.model";
import { NewDbItem } from "../../model/shared-models/db-operation-types.model";
import { UserDbService } from "../../database/user-db.service";
import { FunctionGroupProvider } from "../../model/function-group-provider.model";
import { Socket } from "socket.io";
import { mainChatSocketService, tarotSocketServer } from "../../setup-socket-services";
import { getAshliePersonaChatInstructions, getHtmlChatInstructions } from "../../utils/common-chat-instructions.utils";
import { TarotDbService } from "../../database/tarot-db.service";
import { TarotGameFunctionsService } from "../functions-services/tarot-game.functions-service";

/** Configurator for main chats. */
export class TarotChatConfigurator extends ChatConfiguratorBase {
    constructor(
        userDbService: UserDbService,
        chatDbService: ChatDbService,
        protected tarotDbService: TarotDbService
    ) {
        super(userDbService, chatDbService);
        if (!userDbService) {
            throw new Error("userDbService is required and cannot be null or undefined.");
        }

        if (!chatDbService) {
            throw new Error("chatDbService is required and cannot be null or undefined.");
        }

        this.initializeChatBaseMessages();
    }

    readonly chatType = ChatTypes.TarotGame;

    async initializeNewChat(ownerId: ObjectId): Promise<NewDbItem<Chat>> {
        return {
            userId: ownerId,
            chatType: this.chatType,
            chatMessages: [],
            lastAccessDate: new Date(),
            model: this.defaultChatModel,
            systemMessages: await this.getChatSystemMessagesForNewGame(ownerId),
            creationDate: new Date(),
        };
    }

    /** Ensures that chat types have base messages setup to use in the website. */
    protected async initializeChatBaseMessages(): Promise<void> {
        // Get the chat instructions from the database, if we have them.
        const mainInstructions = await this.chatDbService.getBaseInstructions(this.chatType);

        // If we have none, then create some.
        if (!mainInstructions) {
            const newInstructions: NewDbItem<ChatBaseInstructions> = {
                chatType: this.chatType,
                instructions: [
                    'You are a chat assistant for a website showing the resume for Richard Olson, a Software Developer.',
                    'Always be sure to introduce yourself.',
                    'Before going too far, try to find out what the visitor is looking for in an employee, so you can tailor your answers.',
                    ...getAshliePersonaChatInstructions(),
                    ...getHtmlChatInstructions(),
                ]
            };

            await this.chatDbService.upsertChatBaseInstructions(newInstructions);
        }
    }

    /** We have to get this from the global definitions, because of circular reference issues.
     *   Time doesn't permit this to be re-engineered at this time. (lesser of twp weevils)*/
    protected getMainChatSocketService() {
        return mainChatSocketService;
    }

    /** Returns the set of FunctionGroupProvider, defining what sort of functions the AI can
     *   execute in this sort of chat. */
    async getAiFunctionGroups(socket: Socket, chatId: ObjectId, userId: ObjectId): Promise<FunctionGroupProvider[]> {
        // Get the chat.
        const chat = await this.chatDbService.getChatById(chatId);

        // Get the tarot game for this chat.
        const tarotGame = await this.tarotDbService.getGameByChatId(chatId);

        return [new TarotGameFunctionsService(socket, tarotGame!._id, tarotSocketServer, this.tarotDbService)];
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
                  4a. The system won't allow you to pick more than 5 cards, so it won't do much good trying.
                5. The end!

                Meaning Instructions:
                1. Make the meaning either good or bad.  Base it on the cards drawn.
                2. Meanings should predict how their day or week might go from here on.
                3. Connect the cards.  Draw meaning from what 2 or more cards mean together, to blend into an interesting combination of the two.
                4. Above all, be creative!  Make it exciting, and be a little off-the-wall.
                5. Make the meaning exciting.

            `,
            `
                Example Meaning, using the following cards:
                    1. The Agile Spirit
                    2. The Angular Guardian
                    3. The Wheel of Fortune
                    4. The Empress of Abundance
                    5. The Systems Administrator
                
                The agile spirit guides your day and your week.  It means you will have a tendency to skirt around things, and overcome tasks
                due to your clever decision making of how to setup your project, and your process.  The Angular Guardian, however, will stifle
                your agility, as this card is one of grounding and determination.  While a good and level head is important, in this case, it
                brings caution to the tail.

                The wheel of fortune is can be a good or bad omen.  If we judged merely on the traits of the first two cards, we it might mean
                to expect the unexpected.  However, the Empress of Abundance is a bad omen.  The wheel can only mean a turn of your fortune as
                you progress throughout the week, as The Empress is a fickle soul.  She has everything she wants, and so she can never predict
                her desires.  This brings us to the final card, and one that may have the darkest omen most of all.  Given the Empresses's
                indecision, the way is paved for a decision maker, symbolized by The Systems Administrator, who will make the final call.  And
                given the ill omens of this card, it can only mean a choice was made for you that you will find hard to swallow.

                In summary, my friend, you will start your week out on a good note, dodging problems and making good choices.  You will even
                anchor your good position with some certainty.  Things will change through the week however, giving you conflict by an agent
                of confusion and malcontent.  The week will likely end on a bad note with you doing extra work to make up for what others
                decided for you to do.

                Good luck my friend.                
            `
        ];

        return result.concat(directionResults);
    }
}

