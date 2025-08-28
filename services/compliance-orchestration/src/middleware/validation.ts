/**
 * Validation Middleware
 * Request validation utilities for the Compliance Orchestration Service
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';
import Joi from 'joi';
import { logger } from '@utils/logger';
import { createError } from './errorHandler';

/**
 * Express-validator error handler
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error: ValidationError) => ({
      field: error.type === 'field' ? (error as any).path : error.type,
      message: error.msg,
      value: (error as any).value,
    }));

    logger.warn('Request validation failed', {
      errors: formattedErrors,
      requestId: req.requestId,
      url: req.url,
      method: req.method,
    });

    return next(createError(
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      formattedErrors
    ));
  }

  next();
};

/**
 * Joi schema validation middleware
 */
export const validateSchema = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const formattedErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      logger.warn('Schema validation failed', {
        errors: formattedErrors,
        requestId: req.requestId,
        property,
      });

      return next(createError(
        'Schema validation failed',
        400,
        'SCHEMA_VALIDATION_ERROR',
        formattedErrors
      ));
    }

    // Replace the property with the validated and sanitized value
    req[property] = value;
    next();
  };
};

/**
 * Workflow validation schemas
 */
export const workflowSchemas = {
  create: Joi.object({
    definitionId: Joi.string().required().min(1).max(100),
    context: Joi.object().required(),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
    timeout: Joi.number().integer().min(1000).max(86400000), // 1 second to 24 hours
    metadata: Joi.object().default({}),
    scheduledAt: Joi.date().iso().min('now'),
  }),

  update: Joi.object({
    context: Joi.object(),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical'),
    timeout: Joi.number().integer().min(1000).max(86400000),
    metadata: Joi.object(),
    assignedTo: Joi.array().items(Joi.string()),
  }).min(1),

  search: Joi.object({
    query: Joi.string().max(500),
    status: Joi.array().items(Joi.string().valid('pending', 'running', 'paused', 'completed', 'failed', 'cancelled')),
    priority: Joi.array().items(Joi.string().valid('low', 'medium', 'high', 'critical')),
    definitionId: Joi.string(),
    initiatedBy: Joi.string(),
    assignedTo: Joi.string(),
    createdAfter: Joi.date().iso(),
    createdBefore: Joi.date().iso(),
    tags: Joi.array().items(Joi.string()),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid('createdAt', 'startedAt', 'completedAt', 'priority').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),
};

/**
 * Task validation schemas
 */
export const taskSchemas = {
  create: Joi.object({
    name: Joi.string().required().min(1).max(200),
    description: Joi.string().max(1000),
    type: Joi.string().required(),
    data: Joi.object().required(),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
    scheduledAt: Joi.date().iso().min('now'),
    timeout: Joi.number().integer().min(1000),
    maxRetries: Joi.number().integer().min(0).max(10).default(3),
    dependencies: Joi.array().items(Joi.string()),
    tags: Joi.array().items(Joi.string()),
    metadata: Joi.object().default({}),
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(200),
    description: Joi.string().max(1000),
    data: Joi.object(),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical'),
    scheduledAt: Joi.date().iso().min('now'),
    timeout: Joi.number().integer().min(1000),
    maxRetries: Joi.number().integer().min(0).max(10),
    tags: Joi.array().items(Joi.string()),
    metadata: Joi.object(),
  }).min(1),
};

/**
 * Notification validation schemas
 */
export const notificationSchemas = {
  send: Joi.object({
    type: Joi.string().required(),
    title: Joi.string().required().min(1).max(200),
    message: Joi.string().required().min(1).max(2000),
    recipients: Joi.array().items(Joi.string().email()).min(1).required(),
    channels: Joi.array().items(Joi.string().valid('email', 'sms', 'slack', 'teams', 'in_app', 'push', 'webhook')).min(1).required(),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
    scheduledAt: Joi.date().iso().min('now'),
    templateId: Joi.string(),
    data: Joi.object().default({}),
    attachments: Joi.array().items(Joi.object({
      filename: Joi.string().required(),
      originalName: Joi.string().required(),
      mimeType: Joi.string().required(),
      size: Joi.number().integer().min(0),
      url: Joi.string().uri().required(),
    })),
    metadata: Joi.object().default({}),
    tags: Joi.array().items(Joi.string()),
    workflowId: Joi.string(),
    taskId: Joi.string(),
  }),
};

/**
 * Recurring job validation schemas
 */
export const recurringJobSchemas = {
  create: Joi.object({
    name: Joi.string().required().min(1).max(200),
    description: Joi.string().max(1000),
    schedule: Joi.string().required(), // Cron expression
    timezone: Joi.string().default('UTC'),
    taskType: Joi.string().required(),
    taskData: Joi.object().required(),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
    isActive: Joi.boolean().default(true),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')),
    maxRuns: Joi.number().integer().min(1),
    timeout: Joi.number().integer().min(1000),
    retryPolicy: Joi.object({
      maxRetries: Joi.number().integer().min(0).max(10).required(),
      backoffStrategy: Joi.string().valid('fixed', 'exponential', 'linear').required(),
      initialDelay: Joi.number().integer().min(100).required(),
      maxDelay: Joi.number().integer().min(Joi.ref('initialDelay')),
      multiplier: Joi.number().min(1),
      jitter: Joi.boolean().default(false),
    }),
    tags: Joi.array().items(Joi.string()),
    metadata: Joi.object().default({}),
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(200),
    description: Joi.string().max(1000),
    schedule: Joi.string(),
    timezone: Joi.string(),
    taskData: Joi.object(),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical'),
    isActive: Joi.boolean(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    maxRuns: Joi.number().integer().min(1),
    timeout: Joi.number().integer().min(1000),
    retryPolicy: Joi.object({
      maxRetries: Joi.number().integer().min(0).max(10),
      backoffStrategy: Joi.string().valid('fixed', 'exponential', 'linear'),
      initialDelay: Joi.number().integer().min(100),
      maxDelay: Joi.number().integer(),
      multiplier: Joi.number().min(1),
      jitter: Joi.boolean(),
    }),
    tags: Joi.array().items(Joi.string()),
    metadata: Joi.object(),
  }).min(1),
};

/**
 * Common validation utilities
 */
export const validationUtils = {
  /**
   * Validate UUID format
   */
  isValidUUID: (value: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  },

  /**
   * Validate cron expression
   */
  isValidCronExpression: (expression: string): boolean => {
    // Basic cron validation - in production, use a proper cron parser
    const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
    return cronRegex.test(expression);
  },

  /**
   * Validate email format
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Sanitize string input
   */
  sanitizeString: (input: string): string => {
    return input.trim().replace(/[<>]/g, '');
  },

  /**
   * Validate JSON string
   */
  isValidJSON: (jsonString: string): boolean => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  },
};

/**
 * Custom validation middleware for specific business rules
 */
export const businessValidation = {
  /**
   * Validate workflow definition exists
   */
  validateWorkflowDefinition: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { definitionId } = req.body;
    
    // In a real implementation, check if the workflow definition exists
    // For now, we'll just validate the format
    if (!definitionId || typeof definitionId !== 'string') {
      return next(createError(
        'Invalid workflow definition ID',
        400,
        'INVALID_WORKFLOW_DEFINITION'
      ));
    }

    next();
  },

  /**
   * Validate user permissions for workflow operations
   */
  validateWorkflowPermissions: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      return next(createError('Authentication required', 401, 'AUTHENTICATION_REQUIRED'));
    }

    // Check if user has workflow management permissions
    const hasPermission = req.user.permissions.includes('workflow:manage') || 
                         req.user.permissions.includes('admin');

    if (!hasPermission) {
      return next(createError(
        'Insufficient permissions for workflow operations',
        403,
        'INSUFFICIENT_WORKFLOW_PERMISSIONS'
      ));
    }

    next();
  },

  /**
   * Validate organization quota limits
   */
  validateOrganizationQuota: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      return next(createError('Authentication required', 401, 'AUTHENTICATION_REQUIRED'));
    }

    // In a real implementation, check organization quotas
    // For now, we'll just pass through
    next();
  },
};

export default {
  validateRequest,
  validateSchema,
  workflowSchemas,
  taskSchemas,
  notificationSchemas,
  recurringJobSchemas,
  validationUtils,
  businessValidation,
};
