import { ChatDbService } from "./database/chat-db.service";
import { DbService } from "./database/db-service";
import { UserDbService } from "./database/user-db.service";
import { MongoHelper } from "./mongo-helper";
import { AuthService } from "./services/auth-service";


/** If we were using dependency injection, this would be the DI services we'd inject in the necessary places. */

/** The mongo helper used in all DB Services. */
export const dbHelper = new MongoHelper();

/* All DB Services. */
export const userDbService = new UserDbService(dbHelper);
export const chatDbService = new ChatDbService(dbHelper);

/* App Services. */
export const authService = new AuthService(userDbService);