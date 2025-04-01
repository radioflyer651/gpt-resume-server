import express from 'express';
import { getUserIdFromRequest } from '../utils/get-user-from-request.utils';
import { adminDbService, chatDbService } from '../app-globals';

export const siteInfoRouter = express.Router();

/** Returns the SiteSettings for the site, indicating what capabilities are functioning. */
siteInfoRouter.get('/site/settings', async (req, res) => {
    // Get the site settings from the database.
    const settings = await adminDbService.getSiteSettings();

    // Return the settings to the client.
    res.json(settings);
});
