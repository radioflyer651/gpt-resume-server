
import express, { Request, Response } from 'express';
import { generateToken } from '../auth/jwt';
import { TokenPayload } from '../model/shared-models/token-payload.model';
import { authService } from '../app-globals';

export const authRouter = express.Router();

interface LoginRequest extends Request {
    body: {
        companyName: string;
        website: string;
    };
}

authRouter.post('/login', async (req: LoginRequest, res: Response) => {
    const { companyName, website } = req.body as Partial<TokenPayload>;

    // Validate companyName and website (add your own validation logic)
    if (!companyName || !website) {
        res.status(400).json({ message: 'Company name and website are required.' });
        return;
    } 

    // Attempt to validate a user, and if they exist, returns an ID for them.  If not, then returns undefined.
    const tokenInfo = await authService.login(companyName, website);

    // If we don't have a user, then this login attempt is denied.
    if (!tokenInfo) {
        res.status(403).json({ message: 'Invalid company name or website.' });
        return;
    }

    // Generate token
    const token = generateToken(tokenInfo);
    res.json({ token });
});
