import { ObjectId } from "mongodb";

export interface Company {
    _id: ObjectId;
    name: string;
    website: string;

    comments?: string[];
}