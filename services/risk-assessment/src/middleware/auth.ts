/**
 * Authentication Middleware
 * JWT-based authentication for the Risk Assessment Service
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '@utils/logger';
import { config } from '@config/index';
import { createError } from './errorHandler';

export interface AuthenticatedUser {
  id: string;
  email: string;
  organizationId: string;
  role: string;
  permissions: string[];
  isActive: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId?: string;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('Access token is required', 401, 'MISSING_TOKEN');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret) as any;

    if (!decoded.id || !decoded.email || !decoded.organizationId) {
      throw createError('Invalid token structure', 401, 'INVALID_TOKEN');
    }

    const user: AuthenticatedUser = {
      id: decoded.id,
      email: decoded.email,
      organizationId: decoded.organizationId,
      role: decoded.role || 'user',
      permissions: decoded.permissions || [],
      isActive: decoded.isActive !== false,
    };

    if (!user.isActive) {
      throw createError('User account is inactive', 401, 'INACTIVE_USER');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(createError('Invalid token', 401, 'INVALID_TOKEN'));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(createError('Token expired', 401, 'TOKEN_EXPIRED'));
    }
    next(error);
  }
};

export default { authMiddleware };
