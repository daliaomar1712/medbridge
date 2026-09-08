import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  errorCode?: string;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errorCode = err.errorCode || 'INTERNAL_ERROR';

  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      message,
      statusCode,
      errorCode,
      stack: err.stack,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorCode,
  });
};

export const createError = (
  message: string,
  statusCode: number,
  errorCode: string
): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.errorCode = errorCode;
  return error;
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
