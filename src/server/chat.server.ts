import express, { Request, Response } from 'express';
import { getUserIdFromRequest } from '../utils/get-user-from-request.utils';
import { appChatService } from '../app-globals';
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

    console.log(`Messages: ${chat.chatMessages.length}`);
    chat.chatMessages.forEach(m => {
        const x = m as any;
        console.log(x.role, x.content);
    });
    // Convert it to a client chat.
    const result = convertChatToClientChat(chat);

    console.log(`Messages: ${result.chatMessages.length}`);
    result.chatMessages.forEach(m => {
        console.log(m.role, m.content);
    });

    // Return the main chat.
    res.json(result);
});