import express from "express";
import { AuthenticatedRequest } from "../model/authenticated-request.model";

export const characterChatRouter = express.Router();

characterChatRouter.post('/characters', async (req: AuthenticatedRequest, res) => {
    // Get the user info from the request.
    const user = req;
});

