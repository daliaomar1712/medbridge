import { Request, Response, NextFunction } from 'express';
export interface AppError extends Error {
    statusCode?: number;
    errorCode?: string;
}
export declare const errorHandler: (err: AppError, _req: Request, res: Response, _next: NextFunction) => void;
export declare const createError: (message: string, statusCode: number, errorCode: string) => AppError;
export declare const asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.middleware.d.ts.map