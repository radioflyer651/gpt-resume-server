import { ObjectId } from "mongodb";
import { UserDbService } from "../database/user-db.service";
import { isValidString } from "../utils/strings.utils";
import { TokenPayload } from "../model/shared-models/token-payload.model";


export class AuthService {
    constructor(
        private readonly dbService: UserDbService
    ) {
        if (!dbService) {
            throw new Error("dbService cannot be null or undefined.");
        }
    }

    /** Attempts to validate a user, and if they exist, returns an ID for them.  If not, then returns undefined. */
    async login(userName: string, webSite: string): Promise<TokenPayload | undefined> {
        // Ensure we have valid values.
        if (!isValidString(userName) || !isValidString(webSite)) {
            return undefined;
        }

        const lcWebsite = webSite.toLowerCase();
        const lcUserName = userName.toLowerCase();

        // Attempt to find the user.
        let userInfo = await this.dbService.getUserByNameAndSite(lcUserName, lcWebsite);
        if (userInfo?.company && !userInfo?.user) {
            // If we don't have a user, then we must create one.
            userInfo.user = await this.dbService.createUser(lcUserName, lcWebsite);
        }

        // Return the user's ID.
        return userInfo?.user ? {
            userId: userInfo.user._id,
            website: userInfo.company.website,
            companyName: userInfo.company.name,
            name: userInfo.user.userName
        } : undefined;
    }
}