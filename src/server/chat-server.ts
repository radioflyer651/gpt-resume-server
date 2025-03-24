import express from "express";
import { ObjectId } from "mongodb";
import { appChatService, chatDbService, chatService } from "../app-globals";
import { ChatTypes } from "../model/shared-models/chat-types.model";
import { AuthenticatedRequest, AuthenticatedSpecialRequest } from "../model/authenticated-request.model";
import { convertChatsToMessages } from "../utils/convert-chat-to-messages.utils";

export const chatRouter = express.Router();

/** Returns the main chat for a specified UserID, and if one does not exist, then one is created and sent. */
chatRouter.get('/chats/main-chat/:userId', async (req, res) => {
    // Get the user ID from the params.
    const userId = req.params.userId;

    // Validate this.
    if (!ObjectId.isValid(userId)) {
        res.status(400)
            .end();
        return;
    }

    // Convert the object ID to an object id.
    const userObjId = new ObjectId(userId);

    // Get the chat from the chat service, which will create one if it was missing.
    const chatResult = await appChatService.getOrCreateChatOfType(userObjId, ChatTypes.Main);

    // Convert the messages to chat messages.
    chatResult.chatMessages = convertChatsToMessages(chatResult.chatMessages);

    // Send the chat to the caller.
    res.json(chatResult);
});

/** Sends a specified chat message to the main chat for a specified user ID. */
chatRouter.post('/chats/main-chat', async (req, res) => {

    // Get the user ID from the request.
    const userId = (req as AuthenticatedSpecialRequest<typeof req>).user?.userId ?? '';

    // Validate this.
    if (!ObjectId.isValid(userId)) {
        res.status(400)
            .end();
        return;
    }

    // Convert the object ID to an object id.
    const userObjId = new ObjectId(userId);

    // Get the chat from the chat service, which will create one if it was missing.
    const chatResult = await appChatService.getOrCreateChatOfType(userObjId, ChatTypes.Main);

    // Get the message from the body.
    const message = req.body as string;

    // Get/create the main chat for this user.
    const mainChat = await appChatService.getOrCreateChatOfType(userObjId, ChatTypes.Main);

    // Make the call for the chat.
    const chatResponse = await chatService.createChatResponse(mainChat._id, message);

    // Send the chat to the caller.
    res.json(chatResponse);
});

