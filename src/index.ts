import express from 'express';
import bodyParser from 'body-parser';
import { authRouter } from './server/auth.server';
import { characterChatRouter } from './server/character-chat.server';

const app = express();

app.use(bodyParser.json());

// Servers (groups of endpoints).
app.use(authRouter);
app.use(characterChatRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});