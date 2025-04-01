import express from 'express';
import { adminDbService, llmChatService } from '../app-globals';
import { verifyToken } from '../auth/jwt';
import { getAudioFileContent, getAudioFileExists, getAudioFilePathForFileName } from '../utils/audio-folder.methods';

/** These have to be authenticated in their own way. */
export const audioRouter = express.Router();

/** Generates an audio file for a specified response, and returns the file name with
 *   the audio file to download. */
// audioRouter.post('/chat/audio', async (req, res) => {
//     // Get the chat content from the body.
//     const chatContent = req.body as string;
//     const token = req.query.token as string;

//     // If no token, then we can't do anything.
//     if(!token){
//         res.status(401).end();
//         return;
//     }

//     // Validate the token.
//     const decoded = await verifyToken(token);

//     if (!decoded) {
//         res.status(401).end();
//         return;
//     }

//     // Ensure we have something to say.
//     if (!chatContent) {
//         res.status(400).end();
//     }

//     // Get the audio response.
//     const response = await llmChatService.getAudio(chatContent);

//     // Return the file name.
//     res.send(response.fileName);
// });

audioRouter.get('/chat/audio/:fileName', async (req, res) => {
    // Get the file name from the request.
    const fileName = req.params.fileName as string;

    if (!fileName) {
        res.status(400).end();
        return;
    }

    // Check that the file exists.
    if (!await getAudioFileExists(fileName)) {
        res.status(404).end();
        return;
    }

    // Get the site settings.
    const settings = await adminDbService.getSiteSettings();
    // If audio chat is turned off, then we can't service this request.
    if (!settings?.allowAudioChat) {
        res.status(409).send(`Audio chat is not enabled.`);
        return;
    }

    // Get the path to the audio file.
    const filePath = getAudioFilePathForFileName(fileName);

    // Set the content headers.
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    // Serve the file.
    res.sendFile(filePath);
});