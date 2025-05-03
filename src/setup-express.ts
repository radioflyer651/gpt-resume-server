import express, { Application } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { authRouter } from './server/auth.server';
import { characterChatRouter } from './server/character-chat.server';
import { bodyObjectIdsToStringMiddleware } from './server/middleware/body-object-ids-to-string.middleware';
import { bodyStringsToObjectIdsMiddleware } from './server/middleware/body-strings-to-object-ids.middleware';
import { getAppConfig } from './config';
import { chatRouter } from './server/chat.server';
import { authMiddleware } from './auth/auth-middleware';
import { tarotRouter } from './server/tarot-game.server';
import { bodyStringsToDatesMiddleware } from './server/middleware/string-to-date-converters.middleware';
import { tarotImageRouter } from './server/tarot-images.server';
import { audioRouter } from './server/audio.server';
import { siteInfoRouter } from './server/site-info.server';
import { loggingService } from './app-globals';
import { AuthenticatedSpecialRequest } from './model/authenticated-request.model';

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

  // Add the middleware to convert strings to Dates.
  app.use(bodyStringsToDatesMiddleware);

  // Try to add some logging for API calls that don't have a user.
  app.use(async (req, res, next) => {
    try {
      if (!(req.headers['authorization'] as string || req.headers['Authorization'])) {
        await loggingService.logMessage({
          level: 'info',
          message: `API Call: ${req.path}`,
          data: {
            body: req?.body,
            path: req.path,
            hasAuthToken: false
          }
        });
      }

    } catch (err) {

    }

    next();
  });


  // Servers (groups of endpoints).
  app.use(authRouter);
  app.use(tarotImageRouter);
  app.use(audioRouter);

  app.use(authMiddleware);

  // Try to add some logging for API calls that DO have users.
  app.use(async (req, res, next) => {
    try {
      if (req.headers['authorization'] as string || req.headers['Authorization']) {
        const userRequest = req as AuthenticatedSpecialRequest<typeof req>;

        await loggingService.logMessage({
          level: 'info',
          message: `API Call: ${req.path}`,
          data: {
            body: req?.body,
            path: req.path,
            user: userRequest.user,
            hasAuthToken: true
          }
        });
      }
    } catch (err) {

    }

    next();
  });

  app.use(characterChatRouter);
  app.use(chatRouter);
  app.use(tarotRouter);
  app.use(siteInfoRouter);

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