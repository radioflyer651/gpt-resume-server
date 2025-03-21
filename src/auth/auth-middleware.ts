import { Response, NextFunction } from 'express';
import { verifyToken } from './jwt';
import { AuthenticatedRequest } from '../model/authenticated-request.model';

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const token = req.headers.get('authorization') || req.headers.get('Authorization');

    if (!token) {
        res.status(401).json({ message: 'Access denied. No token provided.' });
        return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        res.status(401).json({ message: 'Invalid token.' });
        return;
    }

    req.user = decoded; // attach the decoded token payload to the request object
    next();
}