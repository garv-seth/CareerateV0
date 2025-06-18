import { Request, Response, NextFunction } from 'express';

// This interface will be augmented by Passport
export interface AuthenticatedRequest extends Request {
    isAuthenticated(): this is AuthenticatedRequest;
    user?: {
        id: string;
        teamId: string;
    }
}

export const protect = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: 'User not authenticated.' });
}; 