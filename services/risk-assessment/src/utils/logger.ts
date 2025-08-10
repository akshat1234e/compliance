/**
 * Logger Utility
 * Centralized logging configuration for the Risk Assessment Service
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '@config/index';

const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, service = 'risk-assessment', ...meta } = info;
    
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

const transports: winston.transport[] = [];

if (config.logging.console.enabled) {
  transports.push(
    new winston.transports.Console({
      level: config.logging.level,
      format: config.env === 'development' ? winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ) : customFormat,
    })
  );
}

if (config.logging.file.enabled) {
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

export const logger = winston.createLogger({
  level: config.logging.level,
  format: customFormat,
  transports,
  exitOnError: false,
});

export default logger;
