/**
 * Logger Utility
 * Centralized logging configuration for the Compliance Orchestration Service
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '@config/index';

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(logColors);

// Create custom format
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, service = 'compliance-orchestration', ...meta } = info;
    
    const logEntry = {
      timestamp,
      level,
      service,
      message,
      ...(Object.keys(meta).length > 0 && { meta }),
    };

    return JSON.stringify(logEntry);
  })
);

// Create console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, service = 'compliance-orchestration', ...meta } = info;
    
    let logMessage = `${timestamp} [${service}] ${level}: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      logMessage += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return logMessage;
  })
);

// Create transports array
const transports: winston.transport[] = [];

// Console transport for development
if (config.logging.console.enabled) {
  transports.push(
    new winston.transports.Console({
      level: config.logging.level,
      format: config.env === 'development' ? consoleFormat : customFormat,
    })
  );
}

// File transport for production
if (config.logging.file.enabled) {
  // Error log file
  transports.push(
    new DailyRotateFile({
      filename: `${config.logging.file.path}/error-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: customFormat,
      maxSize: config.logging.file.maxSize,
      maxFiles: config.logging.file.maxFiles,
      zippedArchive: true,
    })
  );

  // Combined log file
  transports.push(
    new DailyRotateFile({
      filename: `${config.logging.file.path}/combined-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      format: customFormat,
      maxSize: config.logging.file.maxSize,
      maxFiles: config.logging.file.maxFiles,
      zippedArchive: true,
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: config.logging.level,
  levels: logLevels,
  format: customFormat,
  transports,
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logging
export const loggerStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper functions for structured logging
export const logWithContext = (level: string, message: string, context: Record<string, any> = {}) => {
  logger.log(level, message, {
    ...context,
    timestamp: new Date().toISOString(),
  });
};

export const logError = (message: string, error: Error, context: Record<string, any> = {}) => {
  logger.error(message, {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    ...context,
  });
};

export const logWorkflowEvent = (event: string, workflowId: string, context: Record<string, any> = {}) => {
  logger.info(`Workflow ${event}`, {
    workflowId,
    event,
    ...context,
  });
};

export const logTaskEvent = (event: string, taskId: string, context: Record<string, any> = {}) => {
  logger.info(`Task ${event}`, {
    taskId,
    event,
    ...context,
  });
};

export const logNotificationEvent = (event: string, notificationId: string, context: Record<string, any> = {}) => {
  logger.info(`Notification ${event}`, {
    notificationId,
    event,
    ...context,
  });
};

export const logPerformance = (operation: string, duration: number, context: Record<string, any> = {}) => {
  logger.info(`Performance: ${operation}`, {
    operation,
    duration: `${duration}ms`,
    ...context,
  });
};

export const logSecurity = (event: string, userId?: string, context: Record<string, any> = {}) => {
  logger.warn(`Security: ${event}`, {
    event,
    userId,
    timestamp: new Date().toISOString(),
    ...context,
  });
};

export const logAudit = (action: string, userId: string, resource: string, context: Record<string, any> = {}) => {
  logger.info(`Audit: ${action}`, {
    action,
    userId,
    resource,
    timestamp: new Date().toISOString(),
    ...context,
  });
};

// Export default logger
export default logger;
