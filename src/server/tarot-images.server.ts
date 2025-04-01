import express from 'express';
import { getUserIdFromRequest } from '../utils/get-user-from-request.utils';
import { ObjectId } from 'mongodb';
import * as path from 'path';
import { tarotDbService, tarotImageService } from '../app-globals';

export const tarotImageRouter = express.Router();

/** Returns a tarot image, specified by it's card ObjectId, and image number.
 *   There are multiple images for each tarot card, so both must be provide. */
tarotImageRouter.get('/tarot/images/:cardId/:imageNumber', async (req, res) => {
    const cardId = req.params.cardId;
    const imageNumber = req.params.imageNumber;

    if (!ObjectId.isValid(cardId)) {
        res.status(400).send('Invalid card ID.');
        return;
    }

    // Convert the object ID from the route.
    const cardIdObj = new ObjectId(cardId);
    const imageNumberV = parseInt(imageNumber);

    // Get the file path for the image.
    const filePath = await tarotImageService.getFilePathForImageId(cardIdObj, imageNumberV);

    // If there's no file, then there's nothing to return.
    if (!filePath) {
        res.sendStatus(404);
        return;
    }

    // Files are in a static location in the app.  No need for any trickery.
    res.sendFile(filePath);
});
