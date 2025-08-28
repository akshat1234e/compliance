/**
 * Request Logger Middleware
 * HTTP request logging for the Reporting & Analytics Service
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '@utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  if (!req.requestId) {
    req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  res.setHeader('X-Request-ID', req.requestId);

  logger.info('Request started', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress || 'unknown',
  });

  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any, cb?: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    let logLevel = 'info';
    if (res.statusCode >= 400 && res.statusCode < 500) {
      logLevel = 'warn';
    } else if (res.statusCode >= 500) {
      logLevel = 'error';
    }

    logger.log(logLevel, 'Request completed', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
    });

    originalEnd.call(this, chunk, encoding, cb);
  };

  next();
};

export default { requestLogger };
