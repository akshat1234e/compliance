/**
 * Request logging middleware for Regulatory Intelligence Service
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger, loggers } from '@utils/logger';

// Extend Request interface to include custom properties
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
      user?: {
        id: string;
        email: string;
        organizationId: string;
        roles: string[];
      };
    }
  }
}

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Generate unique request ID
  req.requestId = req.headers['x-request-id'] as string || uuidv4();
  req.startTime = Date.now();

  // Set request ID in response headers
  res.setHeader('X-Request-ID', req.requestId);

  // Log request start
  logger.info('Request Started', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    referer: req.get('Referer'),
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    params: Object.keys(req.params).length > 0 ? req.params : undefined,
  });

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body: any) {
    const duration = Date.now() - req.startTime;
    
    // Log response
    logger.info('Request Completed', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
    });

    // Log performance warning for slow requests
    if (duration > 1000) {
      loggers.performance(`${req.method} ${req.originalUrl}`, duration, 1000);
    }

    return originalJson.call(this, body);
  };

  // Override res.send to log response
  const originalSend = res.send;
  res.send = function(body: any) {
    const duration = Date.now() - req.startTime;
    
    // Log response if not already logged by res.json
    if (!res.headersSent || res.get('Content-Type')?.includes('application/json')) {
      logger.info('Request Completed', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        contentLength: res.get('Content-Length'),
        userId: req.user?.id,
        organizationId: req.user?.organizationId,
      });
    }

    return originalSend.call(this, body);
  };

  // Log request body for POST/PUT/PATCH requests (excluding sensitive data)
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    const sanitizedBody = sanitizeRequestBody(req.body);
    if (Object.keys(sanitizedBody).length > 0) {
      logger.debug('Request Body', {
        requestId: req.requestId,
        body: sanitizedBody,
      });
    }
  }

  next();
};

// Sanitize request body to remove sensitive information
function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return {};
  }

  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'auth',
    'credential',
    'apiKey',
    'api_key',
  ];

  const sanitized = { ...body };

  // Recursively sanitize nested objects
  function sanitizeObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item));
    }

    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          result[key] = '[REDACTED]';
        } else {
          result[key] = sanitizeObject(value);
        }
      }
      return result;
    }

    return obj;
  }

  return sanitizeObject(sanitized);
}

// Middleware to log specific business operations
export const businessOperationLogger = (operation: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    // Override res.json to log business operation completion
    const originalJson = res.json;
    res.json = function(body: any) {
      const duration = Date.now() - startTime;
      
      loggers.business(operation, {
        requestId: req.requestId,
        userId: req.user?.id,
        organizationId: req.user?.organizationId,
        duration: `${duration}ms`,
        success: res.statusCode < 400,
        statusCode: res.statusCode,
      });

      return originalJson.call(this, body);
    };

    next();
  };
};

// Middleware to log database operations
export const databaseOperationLogger = (operation: string, table: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    // Store operation info in request for later use
    req.dbOperation = {
      operation,
      table,
      startTime,
    };

    next();
  };
};

// Helper function to log external API calls
export const logExternalApiCall = (
  service: string,
  endpoint: string,
  method: string,
  startTime: number,
  statusCode?: number,
  error?: Error
): void => {
  const duration = Date.now() - startTime;
  loggers.externalApi(service, endpoint, method, statusCode, duration, error);
};

export default requestLogger;
