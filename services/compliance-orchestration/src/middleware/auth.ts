/**
 * Authentication Middleware
 * JWT-based authentication for the Compliance Orchestration Service
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

/**
 * Role-based authorization middleware
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError('Authentication required', 401, 'AUTHENTICATION_REQUIRED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Insufficient role permissions', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        requestId: req.requestId,
      });
      
      return next(createError(
        'Insufficient permissions',
        403,
        'INSUFFICIENT_ROLE_PERMISSIONS',
        { requiredRoles: allowedRoles, userRole: req.user.role }
      ));
    }

    next();
  };
};

/**
 * Permission-based authorization middleware
 */
export const requirePermission = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError('Authentication required', 401, 'AUTHENTICATION_REQUIRED'));
    }

    const hasPermission = requiredPermissions.every(permission =>
      req.user!.permissions.includes(permission) || req.user!.permissions.includes('admin')
    );

    if (!hasPermission) {
      logger.warn('Insufficient permissions', {
        userId: req.user.id,
        userPermissions: req.user.permissions,
        requiredPermissions,
        requestId: req.requestId,
      });
      
      return next(createError(
        'Insufficient permissions',
        403,
        'INSUFFICIENT_PERMISSIONS',
        { requiredPermissions, userPermissions: req.user.permissions }
      ));
    }

    next();
  };
};

/**
 * Organization-based authorization middleware
 */
export const requireOrganization = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(createError('Authentication required', 401, 'AUTHENTICATION_REQUIRED'));
  }

  // Check if the requested resource belongs to the user's organization
  const resourceOrganizationId = req.params.organizationId || req.body.organizationId || req.query.organizationId;
  
  if (resourceOrganizationId && resourceOrganizationId !== req.user.organizationId) {
    // Allow admin users to access other organizations
    if (!req.user.permissions.includes('admin') && !req.user.permissions.includes('super_admin')) {
      logger.warn('Organization access denied', {
        userId: req.user.id,
        userOrganizationId: req.user.organizationId,
        requestedOrganizationId: resourceOrganizationId,
        requestId: req.requestId,
      });
      
      return next(createError(
        'Access denied to organization resource',
        403,
        'ORGANIZATION_ACCESS_DENIED',
        { organizationId: resourceOrganizationId }
      ));
    }
  }

  next();
};

/**
 * Optional authentication middleware (for public endpoints with optional auth)
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token provided, continue without authentication
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret) as any;

    if (decoded.id && decoded.email && decoded.organizationId) {
      req.user = {
        id: decoded.id,
        email: decoded.email,
        organizationId: decoded.organizationId,
        role: decoded.role || 'user',
        permissions: decoded.permissions || [],
        isActive: decoded.isActive !== false,
      };
    }

    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
};

/**
 * API Key authentication middleware (for service-to-service communication)
 */
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return next(createError('API key is required', 401, 'MISSING_API_KEY'));
  }

  // Validate API key (in production, this would check against a database)
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  
  if (!validApiKeys.includes(apiKey)) {
    logger.warn('Invalid API key', {
      apiKey: apiKey.substring(0, 8) + '...',
      ip: req.ip,
      requestId: req.requestId,
    });
    
    return next(createError('Invalid API key', 401, 'INVALID_API_KEY'));
  }

  // Set service user context
  req.user = {
    id: 'service',
    email: 'service@compliance-platform.com',
    organizationId: 'system',
    role: 'service',
    permissions: ['admin'],
    isActive: true,
  };

  next();
};

/**
 * Rate limiting by user
 */
export const userRateLimit = (maxRequests: number, windowMs: number) => {
  const userRequests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const now = Date.now();
    const userLimit = userRequests.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      userRequests.set(userId, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (userLimit.count >= maxRequests) {
      logger.warn('User rate limit exceeded', {
        userId,
        count: userLimit.count,
        maxRequests,
        requestId: req.requestId,
      });
      
      return next(createError(
        'Rate limit exceeded',
        429,
        'USER_RATE_LIMIT_EXCEEDED',
        { maxRequests, windowMs, resetTime: userLimit.resetTime }
      ));
    }

    userLimit.count++;
    next();
  };
};

/**
 * Workflow ownership validation
 */
export const validateWorkflowOwnership = (req: Request, res: Response, next: NextFunction): void => {
  // This would typically check if the user has access to the workflow
  // For now, we'll just ensure the user is authenticated
  if (!req.user) {
    return next(createError('Authentication required', 401, 'AUTHENTICATION_REQUIRED'));
  }

  // In a real implementation, you would:
  // 1. Get the workflow ID from params
  // 2. Query the database to check ownership
  // 3. Verify the user has access to the workflow

  next();
};

export default {
  authMiddleware,
  requireRole,
  requirePermission,
  requireOrganization,
  optionalAuth,
  apiKeyAuth,
  userRateLimit,
  validateWorkflowOwnership,
};
