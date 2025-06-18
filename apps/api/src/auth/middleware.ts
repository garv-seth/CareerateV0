import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { User } from '@prisma/client';

// Extend Express Request interface to include Passport's user property
export interface AuthenticatedRequest extends Request {
    user?: User;
}

export const protect = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('jwt', { session: false }, (err: Error | null, user: User | false, info: any) => {
        if (err || !user) {
            return res.status(401).json({ message: info?.message || 'User not authenticated.' });
        }
        req.user = user;
        next();
    })(req, res, next);
}; 