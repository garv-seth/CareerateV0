import { Request, Response, NextFunction } from 'express';
import { User } from '@prisma/client';
export interface AuthenticatedRequest extends Request {
    user?: User;
}
export declare const protect: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=middleware.d.ts.map