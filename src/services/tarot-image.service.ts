import { ObjectId } from "mongodb";
import { TarotDbService } from "../database/tarot-db.service";
import { getFileNameForImageNumber } from "../utils/tarot-image.utils";

/** Handles management of Tarot card images. */
export class TarotImageService {
    constructor(private readonly tarotDbService: TarotDbService) { }

    /** Given the ObjectId of a tarot card, and the image number, returns the absolute file path to the file, if it exists. */
    async getFilePathForImageId(cardId: ObjectId, fileNumber: number): Promise<string | undefined> {
        // Get the card from the database.
        const image = await this.tarotDbService.getGameCardById(cardId);

        // If not found, then we can't do anything.
        if (!image) {
            console.error(`No TarotCard exists with the card ID of ${cardId}`);
            return undefined;
        }

        // Find the file for this, based on the file number.
        return getFileNameForImageNumber(image.imageFilePrefix, fileNumber);
    }
}