import express from 'express';
import bodyParser from 'body-parser';
import { authRouter } from './server/auth.server';
import { characterChatRouter } from './server/character-chat.server';
import { bodyObjectIdsToStringMiddleware } from './server/middleware/body-object-ids-to-string.middleware';
import { bodyStringsToObjectIdsMiddleware } from './server/middleware/body-strings-to-object-ids.middleware';

/** Initializes all routes and middleware for an express app. */
export function initializeExpressApp() {
  // Create our express app.
  const app = express();

  // Add the JSON body parser.
  app.use(bodyParser.json());

  // Add the final middleware.
  app.use(bodyStringsToObjectIdsMiddleware);
  
  // Add the middleware.
  app.use(bodyObjectIdsToStringMiddleware);

  // Servers (groups of endpoints).
  app.use(authRouter);
  app.use(characterChatRouter);

  app.use((req, res) => {
    res.status(404).send('Not Found');
  });

  return app;
}