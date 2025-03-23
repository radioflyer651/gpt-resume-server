import express from "express";
import { ObjectId } from "mongodb";
import { appChatService, chatDbService } from "../app-globals";
import { ChatTypes } from "../model/chat-types.model";

export const chatRouter = express.Router();


chatRouter.get('/chats/:chatType/:userId', async (req, res) => {
    const chatType = req.params.chatType;
    const chatId = req.params.userId;


});

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

    // Send the chat to the caller.
    res.json(chatResult);
});