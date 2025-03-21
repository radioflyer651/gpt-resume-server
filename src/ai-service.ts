import { ObjectId } from "mongodb";
import { MongoHelper } from "./mongo-helper";


/** Provides communication with the AI service (likely OpenAI) */
export class AiService {
    constructor(private readonly dbService: MongoHelper) {

    }

    async createChatCompletionRequest(sessionId: ObjectId, message: string) {
        this.dbService.makeCall(db => {

        });
    }
}