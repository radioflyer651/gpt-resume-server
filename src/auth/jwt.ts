import jwt from 'jsonwebtoken';
import { TokenPayload } from '../model/shared-models/token-payload.model';
import { getAppConfig } from '../config';

/** Returns the secret key from the AppConfig. */
async function loadSecretKey(): Promise<string> {
    const config = await getAppConfig();
    return config.tokenSecret;
}

// Generate a token
export async function generateToken(payload: TokenPayload): Promise<string> {
    const secretKey = await loadSecretKey();
    console.log('Got the tokenSecret: ', secretKey);
    return jwt.sign(payload, secretKey, { expiresIn: '12h' });
}

// Verify a token
export async function verifyToken(token: string): Promise<TokenPayload | null> {
    const secretKey = await loadSecretKey();
    try {
        return jwt.verify(token, secretKey) as TokenPayload;
    } catch (error) {
        return null;
    }
}