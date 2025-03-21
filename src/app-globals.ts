import { AuthService } from "./auth-service";
import { DbService } from "./database/db-service";
import { MongoHelper } from "./mongo-helper";

export const dbHelper = new MongoHelper();
export const dbService = new DbService(dbHelper);
export const authService = new AuthService(dbService);