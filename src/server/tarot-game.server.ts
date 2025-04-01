import express from 'express';
import { getUserIdFromRequest } from '../utils/get-user-from-request.utils';
import { ObjectId } from 'mongodb';
import * as path from 'path';
import { chatDbService, tarotDbService, tarotImageService } from '../app-globals';

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

tarotRouter.delete('/tarot/games/:gameId', async (req, res) => {
    // Get the user from this request.
    const userId = getUserIdFromRequest(req);

    // If we have none, then we can't do anything.
    if (!userId) {
        res.sendStatus(403);
        return;
    }

    // Get the game id.
    const gameId = req.params.gameId;

    // Get the game from the database.
    const game = await tarotDbService.getGameById(new ObjectId(gameId));

    // If we don't have the game, then we can't do anything.
    if (!game) {
        res.sendStatus(404);
        return;
    }

    // Ensure the user has access to this game.
    if (!game.userId.equals(userId)) {
        res.sendStatus(403);
        return;
    }

    // Get the chat for this game.
    // const chat = await chatDbService.getChatById(game.gameChatId);

    // Keep the chats.  They just won't show up if we don't have a game for it.
    // Delete the chat.
    // if (chat) {
    //     await chatDbService.deleteChat(chat._id);
    // }

    // Delete the game.
    await tarotDbService.deleteGameById(game._id);

    res.status(200).json("ok");
});