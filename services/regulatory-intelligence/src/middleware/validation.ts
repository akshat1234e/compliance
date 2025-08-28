/**
 * Validation middleware for Regulatory Intelligence Service
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import Joi from 'joi';
import { ValidationError } from './errorHandler';
import { logger } from '@utils/logger';

// Express-validator middleware
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : error.type,
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined,
    }));

    logger.warn('Validation failed', {
      requestId: req.requestId,
      url: req.originalUrl,
      method: req.method,
      errors: errorDetails,
    });

    throw new ValidationError('Validation failed', errorDetails);
  }

  next();
};

// Joi validation middleware factory
export const validateSchema = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      logger.warn('Schema validation failed', {
        requestId: req.requestId,
        url: req.originalUrl,
        method: req.method,
        property,
        errors: errorDetails,
      });

      throw new ValidationError('Schema validation failed', errorDetails);
    }

    // Replace the request property with the validated and sanitized value
    req[property] = value;
    next();
  };
};

// Common validation schemas
export const schemas = {
  // Pagination schema
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  // UUID parameter schema
  uuidParam: Joi.object({
    id: Joi.string().uuid().required(),
  }),

  // Organization ID parameter schema
  organizationParam: Joi.object({
    organizationId: Joi.string().uuid().required(),
  }),

  // Date range schema
  dateRange: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  }),

  // RBI Circular creation schema
  createCircular: Joi.object({
    circularNumber: Joi.string().required().max(100),
    title: Joi.string().required().max(500),
    content: Joi.string().optional(),
    summary: Joi.string().optional().max(1000),
    circularDate: Joi.date().iso().required(),
    effectiveDate: Joi.date().iso().optional(),
    expiryDate: Joi.date().iso().optional(),
    category: Joi.string().optional().max(100),
    subCategory: Joi.string().optional().max(100),
    impactLevel: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
    affectedEntities: Joi.array().items(Joi.string()).optional(),
    subjectTags: Joi.array().items(Joi.string()).optional(),
    sourceUrl: Joi.string().uri().optional(),
  }),

  // RBI Circular update schema
  updateCircular: Joi.object({
    title: Joi.string().optional().max(500),
    content: Joi.string().optional(),
    summary: Joi.string().optional().max(1000),
    effectiveDate: Joi.date().iso().optional(),
    expiryDate: Joi.date().iso().optional(),
    category: Joi.string().optional().max(100),
    subCategory: Joi.string().optional().max(100),
    impactLevel: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
    affectedEntities: Joi.array().items(Joi.string()).optional(),
    subjectTags: Joi.array().items(Joi.string()).optional(),
    processingStatus: Joi.string().valid('pending', 'processing', 'analyzed', 'published').optional(),
  }),

  // Compliance requirement creation schema
  createRequirement: Joi.object({
    requirementCode: Joi.string().required().max(100),
    title: Joi.string().required().max(255),
    description: Joi.string().required(),
    category: Joi.string().optional().max(100),
    subCategory: Joi.string().optional().max(100),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
    frequency: Joi.string().valid('daily', 'weekly', 'monthly', 'quarterly', 'annually', 'event_based').optional(),
    applicableEntities: Joi.array().items(Joi.string()).optional(),
    regulationId: Joi.string().uuid().optional(),
    circularId: Joi.string().uuid().optional(),
  }),

  // Search schema
  search: Joi.object({
    query: Joi.string().required().min(1).max(500),
    filters: Joi.object({
      category: Joi.string().optional(),
      impactLevel: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
      dateFrom: Joi.date().iso().optional(),
      dateTo: Joi.date().iso().optional(),
      affectedEntities: Joi.array().items(Joi.string()).optional(),
    }).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),

  // Impact analysis request schema
  impactAnalysis: Joi.object({
    circularId: Joi.string().uuid().required(),
    organizationId: Joi.string().uuid().required(),
    analysisType: Joi.string().valid('basic', 'detailed', 'comprehensive').default('basic'),
    includeRecommendations: Joi.boolean().default(true),
  }),

  // Regulatory change notification schema
  changeNotification: Joi.object({
    changeType: Joi.string().valid('new', 'amendment', 'clarification', 'withdrawal').required(),
    title: Joi.string().required().max(255),
    description: Joi.string().required(),
    impactLevel: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
    affectedOrganizations: Joi.array().items(Joi.string().uuid()).optional(),
    effectiveDate: Joi.date().iso().optional(),
    implementationDeadline: Joi.date().iso().optional(),
    sourceCircularId: Joi.string().uuid().optional(),
  }),
};

// Validation middleware factories for common patterns
export const validatePagination = validateSchema(schemas.pagination, 'query');
export const validateUuidParam = validateSchema(schemas.uuidParam, 'params');
export const validateOrganizationParam = validateSchema(schemas.organizationParam, 'params');
export const validateDateRange = validateSchema(schemas.dateRange, 'query');

// Custom validation functions
export const validateArrayNotEmpty = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.body[fieldName];
    
    if (Array.isArray(value) && value.length === 0) {
      throw new ValidationError(`${fieldName} cannot be empty array`);
    }
    
    next();
  };
};

export const validateFileUpload = (allowedTypes: string[], maxSize: number = 10 * 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.file) {
      throw new ValidationError('File is required');
    }

    // Check file type
    if (!allowedTypes.includes(req.file.mimetype)) {
      throw new ValidationError(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Check file size
    if (req.file.size > maxSize) {
      throw new ValidationError(`File size too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
    }

    next();
  };
};

// Sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // Recursively sanitize strings in request body
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

export default validateRequest;
