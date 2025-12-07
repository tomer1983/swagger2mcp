import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Request ID middleware for tracking
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.headers['x-request-id'] as string || uuidv4();
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
};

// Error response format
interface ErrorResponse {
    error: string;
    requestId?: string;
    timestamp?: string;
    path?: string;
}

// Global error handler middleware
export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const requestId = req.headers['x-request-id'] as string;
    const timestamp = new Date().toISOString();
    const path = req.path;

    // Log detailed error server-side (never expose to client)
    console.error('[ERROR]', {
        requestId,
        timestamp,
        path,
        method: req.method,
        error: {
            message: err.message,
            stack: err.stack,
            code: err.code,
            statusCode: err.statusCode,
        },
        body: req.body,
        query: req.query,
        params: req.params,
    });

    // Determine status code
    const statusCode = err.statusCode || err.status || 500;

    // Create sanitized error response
    const response: ErrorResponse = {
        error: sanitizeErrorMessage(err, statusCode),
        requestId,
        timestamp,
        path,
    };

    // Send response
    res.status(statusCode).json(response);
};

// Sanitize error messages to avoid information disclosure
function sanitizeErrorMessage(err: any, statusCode: number): string {
    // For client errors (4xx), return specific messages
    if (statusCode >= 400 && statusCode < 500) {
        // Use the error message if it's safe
        if (err.message && !err.message.includes('ENOENT') && !err.message.includes('prisma')) {
            return err.message;
        }

        // Generic client error messages
        const clientErrors: Record<number, string> = {
            400: 'Bad request. Please check your input.',
            401: 'Authentication required.',
            403: 'Access forbidden.',
            404: 'Resource not found.',
            409: 'Resource conflict.',
            413: 'Payload too large.',
            422: 'Invalid request data.',
            429: 'Too many requests. Please try again later.',
        };

        return clientErrors[statusCode] || 'Client error occurred.';
    }

    // For server errors (5xx), return generic message
    return 'An internal server error occurred. Please try again later.';
}

// Async error wrapper - catches async errors in route handlers
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Not found handler (404)
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
    const error: any = new Error(`Not found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};
