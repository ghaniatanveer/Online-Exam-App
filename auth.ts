import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import { UserRole } from '../models/User.js';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authentication required'));
  }

  const token = header.split(' ')[1];
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token'));
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Access denied'));
    }
    next();
  };
}
