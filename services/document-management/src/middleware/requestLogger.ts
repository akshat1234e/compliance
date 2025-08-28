/**
 * Request Logger Middleware
 * HTTP request logging for the Document Management Service
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '@utils/logger';

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

  // Log request start
  logger.info('Request started', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    headers: {
      'content-type': req.get('Content-Type'),
      'content-length': req.get('Content-Length'),
      'authorization': req.get('Authorization') ? '[REDACTED]' : undefined,
    },
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
  });

  // Override res.end to capture response data
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any, cb?: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Determine log level based on status code
    let logLevel = 'info';
    if (res.statusCode >= 400 && res.statusCode < 500) {
      logLevel = 'warn';
    } else if (res.statusCode >= 500) {
      logLevel = 'error';
    }

    // Log request completion
    logger.log(logLevel, 'Request completed', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      responseHeaders: {
        'content-type': res.get('Content-Type'),
        'content-length': res.get('Content-Length'),
      },
    });

    // Log slow requests
    if (duration > 2000) {
      logger.warn('Slow request detected', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl || req.url,
        duration: `${duration}ms`,
        threshold: '2000ms',
      });
    }

    // Call original end method
    originalEnd.call(this, chunk, encoding, cb);
  };

  next();
};

export default {
  requestLogger,
};
