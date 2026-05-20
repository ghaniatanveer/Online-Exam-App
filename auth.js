import { verifyToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';
export function authenticate(req, _res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        return next(new ApiError(401, 'Authentication required'));
    }
    const token = header.split(' ')[1];
    try {
        req.user = verifyToken(token);
        next();
    }
    catch {
        next(new ApiError(401, 'Invalid or expired token'));
    }
}
export function authorize(...roles) {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new ApiError(401, 'Authentication required'));
        }
        if (!roles.includes(req.user.role)) {
            return next(new ApiError(403, 'Access denied'));
        }
        next();
    };
}
