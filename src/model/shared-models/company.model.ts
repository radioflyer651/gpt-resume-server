import { ObjectId } from "mongodb";
import { Comment } from "./comments.model";

export interface Company {
    _id: ObjectId;
    name: string;
    website: string;

    /** Boolean value indicating whether or not this company should be archived (and hidden from view). */
    archive?: boolean;

    comments?: Comment[];
}