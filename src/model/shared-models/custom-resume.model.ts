import { ObjectId } from "mongodb";

/** Represents a custom resume, produced by the AI. */
export interface CustomResume {
    _id: ObjectId;
    /** The DB Id of the resume. */

    /** The user requesting the resume. */
    useId: ObjectId;

    /** The HTML content of the resume. */
    content: string;

    /** Gets or sets the ID of the chat that this resume is associated with. */
    chatId: ObjectId;
}