import { MongoHelper } from "../mongo-helper";
import { DbService } from "./db-service";

export class ChatMemoryDbService extends DbService {
    constructor(dbHelper: MongoHelper) {
        super(dbHelper);
    }

    
}