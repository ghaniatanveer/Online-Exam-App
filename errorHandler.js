import { ApiError } from '../utils/ApiError.js';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
export function errorHandler(err, _req, res, _next) {
    if (err instanceof ApiError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors,
        });
        return;
    }
    if (err instanceof ZodError) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: err.flatten().fieldErrors,
        });
        return;
    }
    if (err.name === 'CastError') {
        res.status(400).json({ success: false, message: 'Invalid ID format' });
        return;
    }
    if (err.code === 11000) {
        res.status(409).json({ success: false, message: 'Duplicate entry' });
        return;
    }
    console.error(err);
    res.status(500).json({
        success: false,
        message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
}
