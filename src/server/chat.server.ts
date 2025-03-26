import express, { Request, Response } from 'express';
import { getUserIdFromRequest } from '../utils/get-user-from-request.utils';
import { appChatService } from '../app-globals';
import { ChatTypes } from '../model/shared-models/chat-types.model';
import { convertChatToClientChat } from '../utils/convert-to-client-chat';

export const chatRouter = express.Router();

chatRouter.get('/chat/main', async (req, res) => {
    console.log((req as any).user);

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