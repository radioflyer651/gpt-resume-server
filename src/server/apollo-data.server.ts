import express from 'express';
import { ObjectId } from 'mongodb';
import { apolloDbService } from '../app-globals';

export const apolloOrganizationRouter = express.Router();

apolloOrganizationRouter.use('/apollo', (req, res, next) => {
    next();
});

