import { MongoHelper } from "../mongo-helper";
import { DbService } from "./db-service";

/** Provides storage services for Apollo API queries. */
export class ApolloDbService extends DbService {
    constructor(dbHelper: MongoHelper) {
        super(dbHelper);
    }

    
}