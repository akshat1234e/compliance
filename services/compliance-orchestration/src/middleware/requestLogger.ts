/**
 * Request Logger Middleware
 * HTTP request logging for the Compliance Orchestration Service
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '@utils/logger';

export interface RequestLogData {
  requestId: string;
  method: string;
  url: string;
  userAgent?: string;
  ip: string;
  userId?: string;
  organizationId?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  statusCode?: number;
  contentLength?: number;
  error?: string;
}

/**
 * Request logger middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Generate request ID if not already set
  if (!req.requestId) {
    req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Set request ID header
  res.setHeader('X-Request-ID', req.requestId);

  // Prepare log data
  const logData: RequestLogData = {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    startTime,
  };

  // Log request start
  logger.info('Request started', {
    ...logData,
    headers: {
      'content-type': req.get('Content-Type'),
      'content-length': req.get('Content-Length'),
      'authorization': req.get('Authorization') ? '[REDACTED]' : undefined,
    },
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    body: shouldLogBody(req) ? sanitizeBody(req.body) : '[BODY_NOT_LOGGED]',
  });

  // Override res.end to capture response data
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any, cb?: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Update log data with response information
    logData.endTime = endTime;
    logData.duration = duration;
    logData.statusCode = res.statusCode;
    logData.contentLength = res.get('Content-Length') ? parseInt(res.get('Content-Length')!) : undefined;

    // Add user information if available
    if (req.user) {
      logData.userId = req.user.id;
      logData.organizationId = req.user.organizationId;
    }

    // Determine log level based on status code
    let logLevel = 'info';
    if (res.statusCode >= 400 && res.statusCode < 500) {
      logLevel = 'warn';
    } else if (res.statusCode >= 500) {
      logLevel = 'error';
      logData.error = 'Server error';
    }

    // Log request completion
    logger.log(logLevel, 'Request completed', {
      ...logData,
      responseHeaders: {
        'content-type': res.get('Content-Type'),
        'content-length': res.get('Content-Length'),
      },
    });

    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        ...logData,
        threshold: '1000ms',
      });
    }

    // Call original end method
    originalEnd.call(this, chunk, encoding, cb);
  };

  next();
};

/**
 * Determine if request body should be logged
 */
function shouldLogBody(req: Request): boolean {
  // Don't log body for certain routes
  const skipBodyRoutes = [
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/upload',
  ];

  if (skipBodyRoutes.some(route => req.url.includes(route))) {
    return false;
  }

  // Don't log large bodies
  const contentLength = req.get('Content-Length');
  if (contentLength && parseInt(contentLength) > 10000) {
    return false;
  }

  // Don't log file uploads
  const contentType = req.get('Content-Type');
  if (contentType && contentType.includes('multipart/form-data')) {
    return false;
  }

  return true;
}

/**
 * Sanitize request body for logging
 */
function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
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

/**
 * Error request logger
 */
export const errorRequestLogger = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  logger.error('Request error', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    organizationId: req.user?.organizationId,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    headers: {
      'content-type': req.get('Content-Type'),
      'authorization': req.get('Authorization') ? '[REDACTED]' : undefined,
    },
    query: req.query,
    body: shouldLogBody(req) ? sanitizeBody(req.body) : '[BODY_NOT_LOGGED]',
  });

  next(error);
};

/**
 * Security event logger
 */
export const securityLogger = {
  logAuthAttempt: (req: Request, success: boolean, reason?: string): void => {
    logger.warn('Authentication attempt', {
      requestId: req.requestId,
      success,
      reason,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      timestamp: new Date().toISOString(),
    });
  },

  logUnauthorizedAccess: (req: Request, resource: string): void => {
    logger.warn('Unauthorized access attempt', {
      requestId: req.requestId,
      resource,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      timestamp: new Date().toISOString(),
    });
  },

  logSuspiciousActivity: (req: Request, activity: string, details?: any): void => {
    logger.warn('Suspicious activity detected', {
      requestId: req.requestId,
      activity,
      details,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      timestamp: new Date().toISOString(),
    });
  },
};

/**
 * Performance logger
 */
export const performanceLogger = {
  logSlowQuery: (operation: string, duration: number, details?: any): void => {
    logger.warn('Slow operation detected', {
      operation,
      duration: `${duration}ms`,
      details,
      threshold: '1000ms',
      timestamp: new Date().toISOString(),
    });
  },

  logHighMemoryUsage: (usage: number, threshold: number): void => {
    logger.warn('High memory usage detected', {
      usage: `${usage}MB`,
      threshold: `${threshold}MB`,
      timestamp: new Date().toISOString(),
    });
  },

  logHighCpuUsage: (usage: number, threshold: number): void => {
    logger.warn('High CPU usage detected', {
      usage: `${usage}%`,
      threshold: `${threshold}%`,
      timestamp: new Date().toISOString(),
    });
  },
};

/**
 * Audit logger
 */
export const auditLogger = {
  logWorkflowAction: (req: Request, action: string, workflowId: string, details?: any): void => {
    logger.info('Workflow action', {
      requestId: req.requestId,
      action,
      workflowId,
      details,
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
  },

  logTaskAction: (req: Request, action: string, taskId: string, details?: any): void => {
    logger.info('Task action', {
      requestId: req.requestId,
      action,
      taskId,
      details,
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
  },

  logNotificationAction: (req: Request, action: string, notificationId: string, details?: any): void => {
    logger.info('Notification action', {
      requestId: req.requestId,
      action,
      notificationId,
      details,
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
  },

  logDataAccess: (req: Request, resource: string, action: string, details?: any): void => {
    logger.info('Data access', {
      requestId: req.requestId,
      resource,
      action,
      details,
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
  },
};

export default {
  requestLogger,
  errorRequestLogger,
  securityLogger,
  performanceLogger,
  auditLogger,
};
