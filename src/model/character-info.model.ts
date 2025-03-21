import { ObjectId } from "mongodb";

export interface CharacterInfo {
    /** Gets or sets the ID of the character. */
    _id: ObjectId;

    /** Gets or sets the name of the character, as described by the user.  Like Ernie from Sesame Street */
    specifiedName: string;

    /** Actual name of the character. */
    name: string;

    /** Gets or sets a description of the character for use in chat. */
    aiDescription?: string;
}
