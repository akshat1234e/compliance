/**
 * Validation Middleware
 * Request validation using express-validator
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';
import { logger } from '@utils/logger';

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map((error: ValidationError) => ({
        field: error.type === 'field' ? (error as any).path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? (error as any).value : undefined,
        location: error.type === 'field' ? (error as any).location : undefined,
      }));

      logger.warn('Request validation failed', {
        path: req.path,
        method: req.method,
        errors: formattedErrors,
        body: req.body,
        query: req.query,
        params: req.params,
      });

      res.status(400).json({
        error: 'Validation failed',
        details: formattedErrors,
      });
      return;
    }

    next();
  } catch (error: any) {
    logger.error('Validation middleware error', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

// Custom validation functions
export const customValidators = {
  // Validate webhook URL
  isWebhookUrl: (value: string): boolean => {
    try {
      const url = new URL(value);
      // Only allow HTTP and HTTPS protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        return false;
      }
      // Don't allow localhost in production
      if (process.env.NODE_ENV === 'production' && 
          (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  // Validate event type format
  isEventType: (value: string): boolean => {
    // Event types should follow the pattern: service.action or service.resource.action
    const eventTypeRegex = /^[a-zA-Z0-9]+(\.[a-zA-Z0-9]+){1,2}$/;
    return eventTypeRegex.test(value);
  },

  // Validate webhook secret strength
  isStrongSecret: (value: string): boolean => {
    // At least 8 characters, containing letters and numbers
    if (value.length < 8) return false;
    
    const hasLetter = /[a-zA-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    
    return hasLetter && hasNumber;
  },

  // Validate retry policy
  isValidRetryPolicy: (value: any): boolean => {
    if (typeof value !== 'object' || value === null) return false;
    
    const required = ['maxAttempts', 'backoffMultiplier', 'initialDelay', 'maxDelay'];
    const hasAllRequired = required.every(key => key in value);
    
    if (!hasAllRequired) return false;
    
    return (
      Number.isInteger(value.maxAttempts) && value.maxAttempts >= 1 && value.maxAttempts <= 10 &&
      typeof value.backoffMultiplier === 'number' && value.backoffMultiplier >= 1 && value.backoffMultiplier <= 10 &&
      Number.isInteger(value.initialDelay) && value.initialDelay >= 100 && value.initialDelay <= 60000 &&
      Number.isInteger(value.maxDelay) && value.maxDelay >= value.initialDelay && value.maxDelay <= 300000
    );
  },

  // Validate headers object
  isValidHeaders: (value: any): boolean => {
    if (typeof value !== 'object' || value === null) return false;
    
    // Check that all keys and values are strings
    return Object.entries(value).every(([key, val]) => 
      typeof key === 'string' && typeof val === 'string' && key.length > 0
    );
  },

  // Validate signature algorithm
  isValidSignatureAlgorithm: (value: string): boolean => {
    return ['sha256', 'sha1', 'md5'].includes(value);
  },

  // Validate JSON payload
  isValidJSON: (value: string): boolean => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  },

  // Validate webhook signature format
  isValidSignature: (value: string): boolean => {
    // Signature should be in format: algorithm=hash
    const signatureRegex = /^(sha256|sha1|md5)=[a-f0-9]+$/;
    return signatureRegex.test(value);
  },

  // Validate UUID format
  isUUID: (value: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  },

  // Validate timestamp format
  isValidTimestamp: (value: string): boolean => {
    const timestamp = new Date(value);
    return !isNaN(timestamp.getTime());
  },

  // Validate that array contains only unique values
  hasUniqueValues: (value: any[]): boolean => {
    if (!Array.isArray(value)) return false;
    return new Set(value).size === value.length;
  },

  // Validate webhook event data structure
  isValidEventData: (value: any): boolean => {
    if (typeof value !== 'object' || value === null) return false;
    
    // Event data should not be empty and should not contain circular references
    try {
      JSON.stringify(value);
      return Object.keys(value).length > 0;
    } catch {
      return false;
    }
  },

  // Validate timeout value
  isValidTimeout: (value: number): boolean => {
    return Number.isInteger(value) && value >= 1000 && value <= 300000; // 1 second to 5 minutes
  },

  // Validate rate limit value
  isValidRateLimit: (value: number): boolean => {
    return Number.isInteger(value) && value >= 1 && value <= 10000;
  },

  // Validate webhook endpoint name
  isValidEndpointName: (value: string): boolean => {
    // Name should be 1-100 characters, alphanumeric with spaces, hyphens, underscores
    const nameRegex = /^[a-zA-Z0-9\s\-_]{1,100}$/;
    return nameRegex.test(value.trim());
  },

  // Validate delivery status
  isValidDeliveryStatus: (value: string): boolean => {
    return ['pending', 'success', 'failed', 'retrying'].includes(value);
  },
};

// Sanitization functions
export const sanitizers = {
  // Sanitize webhook URL
  sanitizeUrl: (value: string): string => {
    return value.trim().toLowerCase();
  },

  // Sanitize event type
  sanitizeEventType: (value: string): string => {
    return value.trim().toLowerCase();
  },

  // Sanitize endpoint name
  sanitizeName: (value: string): string => {
    return value.trim();
  },

  // Sanitize headers object
  sanitizeHeaders: (value: any): any => {
    if (typeof value !== 'object' || value === null) return {};
    
    const sanitized: any = {};
    Object.entries(value).forEach(([key, val]) => {
      if (typeof key === 'string' && typeof val === 'string') {
        sanitized[key.trim()] = val.trim();
      }
    });
    
    return sanitized;
  },

  // Sanitize array of strings
  sanitizeStringArray: (value: any[]): string[] => {
    if (!Array.isArray(value)) return [];
    
    return value
      .filter(item => typeof item === 'string')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  },

  // Remove sensitive data from logs
  sanitizeForLogging: (data: any): any => {
    if (typeof data !== 'object' || data === null) return data;
    
    const sensitiveFields = ['secret', 'password', 'token', 'key', 'authorization'];
    const sanitized = { ...data };
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '***';
      }
    });
    
    return sanitized;
  },
};

// Error response formatter
export const formatValidationError = (errors: ValidationError[]): any => {
  return {
    error: 'Validation failed',
    details: errors.map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined,
      location: error.type === 'field' ? (error as any).location : undefined,
    })),
    timestamp: new Date().toISOString(),
  };
};
