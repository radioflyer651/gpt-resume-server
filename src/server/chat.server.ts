import express, { Request, Response } from 'express';
import { getUserIdFromRequest } from '../utils/get-user-from-request.utils';
import { appChatService, chatDbService } from '../app-globals';
import { ChatTypes } from '../model/shared-models/chat-types.model';
import { convertChatToClientChat } from '../utils/convert-to-client-chat';

export const chatRouter = express.Router();

chatRouter.get('/chat/main', async (req, res) => {
    // Get the user from this request.
    const userId = getUserIdFromRequest(req);

    // If we have none, then we can't do anything.
    if (!userId) {
        res.status(403).end();
        return;
    }

    // Get or create the main chat.
    const chat = await appChatService.getOrCreateChatOfType(userId, ChatTypes.Main);

    // Convert it to a client chat.
    const result = convertChatToClientChat(chat);

    // Return the main chat.
    res.json(result);
});

/** Starts a new main chat for the user, assuming there was probably already one that existed. */
chatRouter.get('/chat/main/start-new', async (req, res) => {
    // Get the user info.
    const userId = getUserIdFromRequest(req);

    // If non, then we have a problem.
    if (!userId) {
        res.status(403).end();
        return;
    }

    // Get the existing main chat, if there is one.
    const existingChat = await chatDbService.getLastAccessedChat(userId, ChatTypes.Main);

    // Ensure it's been around a while, and and/or has a few messages.
    if (existingChat) {
        const chatAge = (Date.now() - existingChat.creationDate.valueOf()) / 1000;
        if (chatAge < 120 && existingChat.chatMessages.length < 6) {
            res.status(409)
                .send(`Main chat is too new.`);
            return;
        }
    }

    // Start a new main chat.
    const newChat = await appChatService.startNewChatOfType(userId, ChatTypes.Main);

    // Convert it to a client chat.
    const result = convertChatToClientChat(newChat);

    // Return the new chat.
    res.json(result);
});