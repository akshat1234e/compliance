/**
 * Logger utility for Regulatory Intelligence Service
 */

import winston from 'winston';
import { config } from '@config/index';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = config.env || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => {
      const { timestamp, level, message, service = 'regulatory-intelligence', ...meta } = info;
      
      let logMessage = `${timestamp} [${service}] ${level}: ${message}`;
      
      // Add metadata if present
      if (Object.keys(meta).length > 0) {
        logMessage += ` ${JSON.stringify(meta, null, 2)}`;
      }
      
      return logMessage;
    }
  )
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    level: level(),
    format: config.env === 'development' 
      ? winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      : winston.format.json(),
  }),
  
  // File transport for errors
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: 'logs/combined.log',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),
];

// Create the logger
export const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  defaultMeta: {
    service: 'regulatory-intelligence',
    version: config.version,
    environment: config.env,
  },
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logging
export const loggerStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper functions for structured logging
export const loggers = {
  // Request logging
  request: (req: any, res: any, duration?: number) => {
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      statusCode: res.statusCode,
      duration: duration ? `${duration}ms` : undefined,
    });
  },

  // Database operation logging
  database: (operation: string, table: string, duration?: number, error?: Error) => {
    if (error) {
      logger.error('Database Error', {
        operation,
        table,
        duration: duration ? `${duration}ms` : undefined,
        error: error.message,
        stack: error.stack,
      });
    } else {
      logger.debug('Database Operation', {
        operation,
        table,
        duration: duration ? `${duration}ms` : undefined,
      });
    }
  },

  // External API logging
  externalApi: (service: string, endpoint: string, method: string, statusCode?: number, duration?: number, error?: Error) => {
    if (error) {
      logger.error('External API Error', {
        service,
        endpoint,
        method,
        statusCode,
        duration: duration ? `${duration}ms` : undefined,
        error: error.message,
      });
    } else {
      logger.info('External API Call', {
        service,
        endpoint,
        method,
        statusCode,
        duration: duration ? `${duration}ms` : undefined,
      });
    }
  },

  // Business logic logging
  business: (operation: string, details: any, error?: Error) => {
    if (error) {
      logger.error('Business Logic Error', {
        operation,
        details,
        error: error.message,
        stack: error.stack,
      });
    } else {
      logger.info('Business Operation', {
        operation,
        details,
      });
    }
  },

  // Security logging
  security: (event: string, details: any, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') => {
    logger.warn('Security Event', {
      event,
      severity,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  // Performance logging
  performance: (operation: string, duration: number, threshold: number = 1000) => {
    const level = duration > threshold ? 'warn' : 'info';
    logger.log(level, 'Performance Metric', {
      operation,
      duration: `${duration}ms`,
      threshold: `${threshold}ms`,
      slow: duration > threshold,
    });
  },

  // Scraping activity logging
  scraping: (url: string, status: 'started' | 'completed' | 'failed', details?: any, error?: Error) => {
    if (error) {
      logger.error('Scraping Failed', {
        url,
        status,
        details,
        error: error.message,
      });
    } else {
      logger.info('Scraping Activity', {
        url,
        status,
        details,
      });
    }
  },

  // NLP processing logging
  nlp: (operation: string, inputLength: number, confidence?: number, duration?: number, error?: Error) => {
    if (error) {
      logger.error('NLP Processing Error', {
        operation,
        inputLength,
        confidence,
        duration: duration ? `${duration}ms` : undefined,
        error: error.message,
      });
    } else {
      logger.info('NLP Processing', {
        operation,
        inputLength,
        confidence,
        duration: duration ? `${duration}ms` : undefined,
      });
    }
  },
};

export default logger;
