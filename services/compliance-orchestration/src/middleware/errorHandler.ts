/**
 * Error Handler Middleware
 * Centralized error handling for the Compliance Orchestration Service
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
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    code = 'INVALID_ID';
  } else if (error.name === 'MongoError' && (error as any).code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value';
    code = 'DUPLICATE_FIELD';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
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

/**
 * Validation error handler for express-validator
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const error = createError(
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      errors.array()
    );
    return next(error);
  }
  
  next();
};

/**
 * Rate limit error handler
 */
export const rateLimitHandler = (req: Request, res: Response): void => {
  logger.warn('Rate limit exceeded', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    url: req.url,
    method: req.method,
  });

  res.status(429).json({
    success: false,
    error: 'Too many requests',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this IP, please try again later',
    retryAfter: 60,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Workflow-specific error handlers
 */
export const workflowErrorHandler = (error: Error, workflowId: string): AppError => {
  if (error.message.includes('not found')) {
    return createError(
      `Workflow ${workflowId} not found`,
      404,
      'WORKFLOW_NOT_FOUND',
      { workflowId }
    );
  }

  if (error.message.includes('already running')) {
    return createError(
      `Workflow ${workflowId} is already running`,
      409,
      'WORKFLOW_ALREADY_RUNNING',
      { workflowId }
    );
  }

  if (error.message.includes('cannot be paused')) {
    return createError(
      `Workflow ${workflowId} cannot be paused in current state`,
      400,
      'WORKFLOW_CANNOT_BE_PAUSED',
      { workflowId }
    );
  }

  return createError(
    `Workflow operation failed: ${error.message}`,
    500,
    'WORKFLOW_OPERATION_FAILED',
    { workflowId, originalError: error.message }
  );
};

/**
 * Task-specific error handlers
 */
export const taskErrorHandler = (error: Error, taskId: string): AppError => {
  if (error.message.includes('not found')) {
    return createError(
      `Task ${taskId} not found`,
      404,
      'TASK_NOT_FOUND',
      { taskId }
    );
  }

  if (error.message.includes('already completed')) {
    return createError(
      `Task ${taskId} is already completed`,
      409,
      'TASK_ALREADY_COMPLETED',
      { taskId }
    );
  }

  return createError(
    `Task operation failed: ${error.message}`,
    500,
    'TASK_OPERATION_FAILED',
    { taskId, originalError: error.message }
  );
};

/**
 * Notification-specific error handlers
 */
export const notificationErrorHandler = (error: Error, notificationId: string): AppError => {
  if (error.message.includes('not found')) {
    return createError(
      `Notification ${notificationId} not found`,
      404,
      'NOTIFICATION_NOT_FOUND',
      { notificationId }
    );
  }

  if (error.message.includes('already sent')) {
    return createError(
      `Notification ${notificationId} is already sent`,
      409,
      'NOTIFICATION_ALREADY_SENT',
      { notificationId }
    );
  }

  return createError(
    `Notification operation failed: ${error.message}`,
    500,
    'NOTIFICATION_OPERATION_FAILED',
    { notificationId, originalError: error.message }
  );
};

/**
 * Database error handler
 */
export const databaseErrorHandler = (error: Error): AppError => {
  if (error.message.includes('connection')) {
    return createError(
      'Database connection failed',
      503,
      'DATABASE_CONNECTION_ERROR'
    );
  }

  if (error.message.includes('timeout')) {
    return createError(
      'Database operation timed out',
      504,
      'DATABASE_TIMEOUT'
    );
  }

  return createError(
    'Database operation failed',
    500,
    'DATABASE_ERROR',
    { originalError: error.message }
  );
};

/**
 * External service error handler
 */
export const externalServiceErrorHandler = (error: Error, serviceName: string): AppError => {
  if (error.message.includes('timeout')) {
    return createError(
      `${serviceName} service timeout`,
      504,
      'EXTERNAL_SERVICE_TIMEOUT',
      { service: serviceName }
    );
  }

  if (error.message.includes('unauthorized')) {
    return createError(
      `${serviceName} service unauthorized`,
      401,
      'EXTERNAL_SERVICE_UNAUTHORIZED',
      { service: serviceName }
    );
  }

  return createError(
    `${serviceName} service error`,
    502,
    'EXTERNAL_SERVICE_ERROR',
    { service: serviceName, originalError: error.message }
  );
};

export default {
  asyncHandler,
  createError,
  errorHandler,
  notFoundHandler,
  handleValidationErrors,
  rateLimitHandler,
  workflowErrorHandler,
  taskErrorHandler,
  notificationErrorHandler,
  databaseErrorHandler,
  externalServiceErrorHandler,
};
