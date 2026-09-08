"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.createError = exports.errorHandler = void 0;
const errorHandler = (err, _req, res, _next) => {
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
exports.errorHandler = errorHandler;
const createError = (message, statusCode, errorCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.errorCode = errorCode;
    return error;
};
exports.createError = createError;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errorHandler.middleware.js.map