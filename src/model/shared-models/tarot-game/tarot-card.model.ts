import { ObjectId } from "mongodb";

export interface TarotCard {
    /** The ID of the card in the database. */
    _id: ObjectId;
    /** The name of the card that was drawn. */
    cardName: string;
    /** The "alignment" of the card, generally indicating if it's good, bad or neutral for the user. */
    cardAlignment: string;
    /** The persona of the "being" depicted in the card. */
    persona: string;
    /** What technology, or topic, the card depicts. */
    technologicalTheme: string;
    /** A general description of the card. */
    description: string;
    /** The "meaning" of the card, which indicates how it should be interpreted. */
    meaning: string;
    /** A description of the card's image. */
    imageDescription: string;
    /** A prefix given to images representing that card on the server. */
    imageFilePrefix: string;
}

/** Reduced data set of the card for in the chat context. */
export interface TarotCardReference {
    /** The ID of the card in the database. */
    _id: ObjectId;
    /** The name of the card that was drawn. */
    cardName: string;
    /** The "alignment" of the card, generally indicating if it's good, bad or neutral for the user. */
    cardAlignment: string;
    /** What technology, or topic, the card depicts. */
    technologicalTheme: string;
    /** The "meaning" of the card, which indicates how it should be interpreted. */
    meaning: string;
    /** A prefix given to images representing that card on the server. */
    imageFilePrefix: string;
}