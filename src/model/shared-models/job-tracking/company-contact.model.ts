import { ObjectId } from "mongodb";
import { Comment } from "../comments.model";

/** Represents a person who works for a company. */
export interface CompanyContact {
    /** Gets or sets the ID of this object in the database. */
    _id: ObjectId;

    /** Gets or sets the ID of the company this contact works for. */
    companyId: ObjectId;

    /** Gets or sets this person's first name. */
    firstName: string;

    /** Gets or sets this person's last name. */
    lastName: string;

    /** Gets or sets the title this person holds in the company. */
    title: string;

    /** Gets or sets the email for this contact. */
    email: string;

    /** Gets or sets a list of phone numbers for this contact. */
    phoneNumbers: ContactPhoneNumber[];

    /** Gets or sets a set of notes associated with this person. */
    comments: Comment[];

    /** Optional: The ID of the ApolloEmployee, in the database, if one exists. */
    apolloId?: ObjectId;
}

/** Represents a phone number for a contact. */
export interface ContactPhoneNumber {
    /** Gets or sets a description for this phone number (i.e. home/mobile/office...) */
    description: string;

    /** Gets or sets the phone number for this entry. */
    phoneNumber: string[];

    /** Gets or sets any notes associated with this phone number.
     *   I.e. how it was obtained, when to use it, etc. */
    comments: Comment[];
}