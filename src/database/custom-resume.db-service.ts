import { ObjectId } from "mongodb";
import { Company } from "../model/shared-models/company.model";
import { DbCollectionNames } from "../model/db-collection-names.constants";
import { User } from "../model/shared-models/user.model";
import { nullToUndefined } from "../utils/empty-and-null.utils";
import { DbService } from "./db-service";
import * as mongo from 'mongodb';
import { CustomResume } from "../model/shared-models/custom-resume.model";


export class CustomResumeDbService extends DbService {

    /** Simplified "makeCall" function for the ResumeCollection, based ont he DbHelper function. */
    private makeResumeCall<T>(callback: (resumeCollection: mongo.Collection) => Promise<T>) {
        return this.dbHelper.makeCallWithCollection<T>(DbCollectionNames.CustomResume, async (db, collection) => {
            return await callback(collection);
        });
    }

    /** Returns a custom resume with a specified ObjectId, if it exists. */
    getResumeForChatId(chatId: ObjectId): Promise<CustomResume | undefined> {
        return this.makeResumeCall(async (collection) => {
            return nullToUndefined(collection.findOne<CustomResume>({ chatId }));
        });
    }

    /** Returns a CustomResume, specified by it's ID. */
    getResumeById(resumeId: ObjectId): Promise<CustomResume | undefined> {
        return this.makeResumeCall(async (collection) => {
            return nullToUndefined(collection.findOne<CustomResume>({ _id: resumeId }));
        });
    }

    /** Deletes a CustomResume specified by it's ChatID. */
    deleteCustomResumeByChatId(chatId: ObjectId): Promise<void> {
        return this.makeResumeCall(async (collection) => {
            await collection.deleteOne({ chatId });
        });
    }

    /** Deletes a CustomResume specified by its ID. */
    deleteCustomResumeById(resumeId: ObjectId): Promise<void> {
        return this.makeResumeCall(async (collection) => {
            await collection.deleteOne({ _id: resumeId });
        });
    }

    /** Updates the content of a CustomResume, specified by its ID. */
    updateCustomResumeById(resumeId: ObjectId, newContent: string): Promise<void> {
        return this.makeResumeCall(async (collection) => {
            const result = await collection.updateOne(
                { _id: resumeId }, {
                $set: {
                    content: newContent
                }
            });

            if (result.matchedCount < 1) {
                throw new Error(`No match was found for the specified ID.`);
            }
        });
    }
}