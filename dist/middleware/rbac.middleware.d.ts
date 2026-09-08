import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
export declare const requireRole: (...roles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireUser: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=rbac.middleware.d.ts.map