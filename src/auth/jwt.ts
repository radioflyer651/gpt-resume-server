import jwt from 'jsonwebtoken';
import { TokenPayload } from '../model/token-payload.model';

const secretKey = 'we have some secret here, and it is not what you think it is!'; // This needs to be a config property.

// Generate a token
export function generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, secretKey, { expiresIn: '4h' });
}

// Verify a token
export function verifyToken(token: string): TokenPayload | null {
    try {
        return jwt.verify(token, secretKey) as TokenPayload;
    } catch (error) {
        return null;
    }
}