/**
 * Authentication Middleware
 * JWT-based authentication for the Document Management Service
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

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId?: string;
    }
  }
}

/**
 * JWT Authentication Middleware
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('Access token is required', 401, 'MISSING_TOKEN');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as any;

    // Validate token structure
    if (!decoded.id || !decoded.email || !decoded.organizationId) {
      throw createError('Invalid token structure', 401, 'INVALID_TOKEN');
    }

    // Create user object
    const user: AuthenticatedUser = {
      id: decoded.id,
      email: decoded.email,
      organizationId: decoded.organizationId,
      role: decoded.role || 'user',
      permissions: decoded.permissions || [],
      isActive: decoded.isActive !== false,
    };

    // Check if user is active
    if (!user.isActive) {
      throw createError('User account is inactive', 401, 'INACTIVE_USER');
    }

    // Attach user to request
    req.user = user;

    logger.debug('User authenticated', {
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
      requestId: req.requestId,
    });

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid JWT token', {
        error: error.message,
        requestId: req.requestId,
        ip: req.ip,
      });
      return next(createError('Invalid token', 401, 'INVALID_TOKEN'));
    }

    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Expired JWT token', {
        requestId: req.requestId,
        ip: req.ip,
      });
      return next(createError('Token expired', 401, 'TOKEN_EXPIRED'));
    }

    next(error);
  }
};

export default {
  authMiddleware,
};
