/**
 * Error Handler Middleware
 * Centralized error handling for the Document Management Service
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '@utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
  details?: any;
}

/**
 * Async handler wrapper to catch async errors
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create operational error
 */
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

/**
 * Global error handler middleware
 */
export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let code = error.code || 'INTERNAL_ERROR';
  let details = error.details;

  // Log error with context
  logger.error('Request error', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      statusCode,
      code,
      isOperational: error.isOperational,
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.requestId,
      userId: req.user?.id,
    },
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    code = 'VALIDATION_ERROR';
    details = error.details || error.message;
  } else if (error.name === 'MulterError') {
    statusCode = 400;
    message = 'File upload error';
    code = 'UPLOAD_ERROR';
    details = error.message;
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && !error.isOperational) {
    message = 'Something went wrong';
    details = undefined;
  }

  // Send error response
  const errorResponse: any = {
    success: false,
    error: message,
    code,
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  };

  if (details) {
    errorResponse.details = details;
  }

  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 */
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
