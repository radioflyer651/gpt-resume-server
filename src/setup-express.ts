import express, { Application } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { authRouter } from './server/auth.server';
import { characterChatRouter } from './server/character-chat.server';
import { bodyObjectIdsToStringMiddleware } from './server/middleware/body-object-ids-to-string.middleware';
import { bodyStringsToObjectIdsMiddleware } from './server/middleware/body-strings-to-object-ids.middleware';
import { getAppConfig } from './config';

/** Initializes all routes and middleware for an express app. */
export async function initializeExpressApp() {
  // Create our express app.
  const app = express();

  // Setup CORS.
  await setupCors(app);

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

/** Applies CORS to the app. */
async function setupCors(app: Application) {
  // Load the app's configuration.
  const config = await getAppConfig();

  // Exit if there's no cors setup, then we're done here.
  if (!config.corsAllowed) {
    return;
  }

  // Apply cors for each of the sites in the configuration.
  const configurations = config.corsAllowed.map(cfg => {
    return {
      origin: cfg,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    };
  });

  // Apply CORS to each of the configurations.
  for (let cfg of configurations) {
    console.log(`Setting up CORS for: ${cfg.origin}`);
    app.use(cors(cfg));
  }
}