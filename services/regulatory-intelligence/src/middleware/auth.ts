/**
 * Authentication middleware for Regulatory Intelligence Service
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@config/index';
import { logger, loggers } from '@utils/logger';
import { UnauthorizedError, ForbiddenError } from './errorHandler';

interface JwtPayload {
  id: string;
  email: string;
  organizationId: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
}

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        organizationId: string;
        tenantId: string;
        roles: string[];
        permissions: string[];
      };
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      loggers.security('Missing or invalid authorization header', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        method: req.method,
      });
      throw new UnauthorizedError('Access token is required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, config.security.jwtSecret) as JwtPayload;
    } catch (error) {
      loggers.security('Invalid JWT token', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        method: req.method,
        error: (error as Error).message,
      });
      
      if ((error as Error).name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token has expired');
      } else if ((error as Error).name === 'JsonWebTokenError') {
        throw new UnauthorizedError('Invalid token');
      } else {
        throw new UnauthorizedError('Token verification failed');
      }
    }

    // Validate token payload
    if (!decoded.id || !decoded.email || !decoded.organizationId) {
      loggers.security('Invalid token payload', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        method: req.method,
        tokenPayload: decoded,
      });
      throw new UnauthorizedError('Invalid token payload');
    }

    // Set user information in request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      organizationId: decoded.organizationId,
      tenantId: decoded.tenantId,
      roles: decoded.roles || [],
      permissions: decoded.permissions || [],
    };

    // Log successful authentication
    logger.debug('User authenticated', {
      userId: req.user.id,
      email: req.user.email,
      organizationId: req.user.organizationId,
      roles: req.user.roles,
      requestId: req.requestId,
    });

    next();
  } catch (error) {
    next(error);
  }
};

// Role-based authorization middleware
export const requireRole = (requiredRoles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const userRoles = req.user.roles || [];

    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      loggers.security('Insufficient role permissions', {
        userId: req.user.id,
        userRoles,
        requiredRoles: roles,
        url: req.originalUrl,
        method: req.method,
      }, 'medium');
      
      throw new ForbiddenError('Insufficient permissions');
    }

    next();
  };
};

// Permission-based authorization middleware
export const requirePermission = (requiredPermissions: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    const userPermissions = req.user.permissions || [];

    const hasRequiredPermission = permissions.some(permission => 
      userPermissions.includes(permission) || userPermissions.includes('*')
    );

    if (!hasRequiredPermission) {
      loggers.security('Insufficient permissions', {
        userId: req.user.id,
        userPermissions,
        requiredPermissions: permissions,
        url: req.originalUrl,
        method: req.method,
      }, 'medium');
      
      throw new ForbiddenError('Insufficient permissions');
    }

    next();
  };
};

// Organization-based authorization middleware
export const requireOrganization = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  // Check if the request is for the user's organization
  const requestedOrgId = req.params.organizationId || req.body.organizationId || req.query.organizationId;
  
  if (requestedOrgId && requestedOrgId !== req.user.organizationId) {
    // Check if user has system admin role
    if (!req.user.roles.includes('system_admin')) {
      loggers.security('Cross-organization access attempt', {
        userId: req.user.id,
        userOrganizationId: req.user.organizationId,
        requestedOrganizationId: requestedOrgId,
        url: req.originalUrl,
        method: req.method,
      }, 'high');
      
      throw new ForbiddenError('Access to other organizations not allowed');
    }
  }

  next();
};

// Optional authentication middleware (for public endpoints with optional auth)
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
    
    try {
      const decoded = jwt.verify(token, config.security.jwtSecret) as JwtPayload;
      
      if (decoded.id && decoded.email && decoded.organizationId) {
        req.user = {
          id: decoded.id,
          email: decoded.email,
          organizationId: decoded.organizationId,
          tenantId: decoded.tenantId,
          roles: decoded.roles || [],
          permissions: decoded.permissions || [],
        };
      }
    } catch (error) {
      // Invalid token, but continue without authentication
      logger.debug('Invalid token in optional auth', {
        error: (error as Error).message,
        requestId: req.requestId,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// API key authentication middleware (for service-to-service communication)
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    throw new UnauthorizedError('API key is required');
  }

  // In a real implementation, you would validate the API key against a database
  // For now, we'll use a simple environment variable check
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  
  if (!validApiKeys.includes(apiKey)) {
    loggers.security('Invalid API key', {
      apiKey: apiKey.substring(0, 8) + '...',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      method: req.method,
    }, 'high');
    
    throw new UnauthorizedError('Invalid API key');
  }

  // Set service user information
  req.user = {
    id: 'service',
    email: 'service@system',
    organizationId: 'system',
    tenantId: 'system',
    roles: ['service'],
    permissions: ['*'],
  };

  next();
};

export default authMiddleware;
