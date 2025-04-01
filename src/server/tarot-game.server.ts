import express from 'express';
import { getUserIdFromRequest } from '../utils/get-user-from-request.utils';
import { ObjectId } from 'mongodb';
import * as path from 'path';
import { tarotDbService, tarotImageService } from '../app-globals';

export const tarotRouter = express.Router();

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
