import { ObjectId } from "mongodb";
import { Company } from "../model/company.model";
import { DbCollectionNames } from "../model/db-collection-names.constants";
import { User } from "../model/user.model";
import { MongoHelper } from "../mongo-helper";
import { nullToUndefined } from "../utils/empty-and-null.utils";


export abstract class DbService {
    constructor(protected readonly dbHelper: MongoHelper) {

    }

}