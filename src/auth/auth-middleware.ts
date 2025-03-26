import { Response, Request, NextFunction } from 'express';
import { verifyToken } from './jwt';
import { AuthenticatedRequest } from '../model/authenticated-request.model';

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    const token: string | undefined = req.headers['authorization'] as string || req.headers['Authorization'] as string;

    console.log(req.headers);

    if (!token) {
        res.status(401).json({ message: 'Access denied. No token provided.' });
        return;
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
        res.status(401).json({ message: 'Invalid token.' });
        return;
    }

    (req as any).user = decoded;
    next();
}