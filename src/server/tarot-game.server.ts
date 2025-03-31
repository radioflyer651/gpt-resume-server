import express from 'express';
import { getUserIdFromRequest } from '../utils/get-user-from-request.utils';
import { ObjectId } from 'mongodb';
import * as path from 'path';
import { tarotDbService, tarotImageService } from '../app-globals';

export const tarotRouter = express.Router();

/** Returns a tarot image, specified by it's card ObjectId, and image number.
 *   There are multiple images for each tarot card, so both must be provide. */
tarotRouter.get('/tarot/images/:cardId/:imageNumber', async (req, res) => {
    const cardId = req.params.cardId;
    const imageNumber = req.params.imageNumber;

    if (!ObjectId.isValid(cardId)) {
        res.status(400).send('Invalid card ID.');
        return;
    }

    // Get the user from this request.
    const userId = getUserIdFromRequest(req);

    // If we have none, then we can't do anything.
    if (!userId) {
        res.sendStatus(403);
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
    res.sendFile(path.join(__dirname, filePath));
});

tarotRouter.get('/tarot/games', async (req, res) => {
    // Get the user from this request.
    const userId = getUserIdFromRequest(req);

    // If we have none, then we can't do anything.
    if (!userId) {
        res.sendStatus(403);
        return;
    }

    // Get the games.
    const games = await tarotDbService.getGamesForUser(userId);

    // Return them.
    res.json(games);
});