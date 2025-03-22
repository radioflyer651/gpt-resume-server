import express from "express";

export const chatRouter = express.Router();


chatRouter.get('/chats/:chatType/:userId', async (req, res) => {
    const chatType = req.params.chatType;
    const chatId = req.params.userId;

    
});