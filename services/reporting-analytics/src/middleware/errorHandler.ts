/**
 * Error Handler Middleware
 * Centralized error handling for the Reporting & Analytics Service
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '@utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
  details?: any;
}

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const createError = (
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any
): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  error.code = code;
  error.details = details;
  return error;
};

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let code = error.code || 'INTERNAL_ERROR';

  logger.error('Request error', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      statusCode,
      code,
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.requestId,
      userId: req.user?.id,
    },
  });

  const errorResponse: any = {
    success: false,
    error: message,
    code,
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = createError(
    `Route ${req.originalUrl} not found`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

export default {
  asyncHandler,
  createError,
  errorHandler,
  notFoundHandler,
};
