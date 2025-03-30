import { ObjectId } from "mongodb";
import { TarotCardReference } from "./tarot-card.model";

/** Represents an entire TarotGame data set. */
export interface TarotGame {
    _id: ObjectId;

    /** Gets or sets the date that this game was created. */
    dateCreated: Date;

    /** Gets or sets the ID of the user that owns this game. */
    userId: ObjectId;

    /** Boolean value indicating whether or not the user has completed the game. */
    isComplete: boolean;

    /** Gets or sets a boolean value indicating whether or not this game can
     *   still be interacted with.  The AI may decide to close it.*/
    isClose: boolean;

    /** Gets or sets the ID of the chat object used for user interaction about this chat. */
    gameChatId: ObjectId;

    /** The references of the cards picked.  There should be 0-5 cards selected in any game. 
     *   Remember, each card has more than one image, so the reference includes the image number. */
    cardsPicked: TarotCardReference[];
}
