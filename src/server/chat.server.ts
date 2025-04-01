import express, { Request, Response } from 'express';
import { getUserIdFromRequest } from '../utils/get-user-from-request.utils';
import { appChatService, chatDbService } from '../app-globals';
import { ChatTypes } from '../model/shared-models/chat-types.model';
import { convertChatToClientChat } from '../utils/convert-to-client-chat';
import { ObjectId } from 'mongodb';

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

/** Returns a chat, specified by its ID. */
chatRouter.get('/chat/:chatId', async (req, res) => {
    // Get the userId for this call.
    const userId = await getUserIdFromRequest(req)!;

    // Get the chatId.
    const chatIdParam = req.params.chatId;

    // Validate.
    if (!ObjectId.isValid(chatIdParam)) {
        res.status(404).send('Unknown chat ID.');
        return;
    }

    const chatId = new ObjectId(chatIdParam);

    // Get the chat from the chat service.
    const chat = await chatDbService.getChatById(chatId);

    // If we don't have one, then we have a problem.
    if (!chat) {
        res.status(404).send(`Chat not found with chat ID: ${chatId}`);
        return;
    }

    // Validate the userId matches.
    if (!chat.userId.equals(userId)) {
        res.status(403).send('User does not have permissions for the specified chat.');
        return;
    }

    // Convert the chat to a client chat.
    const clientChat = convertChatToClientChat(chat);

    // Return the chat.
    res.send(clientChat);
});

/** Returns a listing of all chats for a specified user. */
chatRouter.get('/chat/for-user', async (req, res) => {
    // Get the userId for this call.
    const userId = await getUserIdFromRequest(req)!;

    // Get the chats from the chat service.
    const chats = await chatDbService.getUserChatList(userId);

    // Return the chats.
    res.send(chats);
});

/** Returns all chats of a specified type, for the authenticated user. */
chatRouter.get('/chats-by-type/:chatType', async (req, res) => {
    const chatType = req.params.chatType;

    // Get the user for this call.
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
        res.status(401).send('Unauthorized.');
        return;
    }

    // Get the chats of the specified type.
    const chats = await chatDbService.getChatsForUserByType(userId, chatType as ChatTypes);

    // Convert these to client chats, and return them.
    const clientChats = chats.map(c => convertChatToClientChat(c));
    res.json(clientChats);
});