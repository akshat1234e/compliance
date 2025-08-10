/**
 * Regulatory Intelligence Service
 * Enterprise RBI Compliance Management Platform
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { config } from '@config/index';
import { logger } from '@utils/logger';
import { errorHandler } from '@middleware/errorHandler';
import { requestLogger } from '@middleware/requestLogger';
import { validateRequest } from '@middleware/validation';
import { authMiddleware } from '@middleware/auth';

// Import routes
import regulationsRoutes from '@/routes/regulations';
import circularsRoutes from '@/routes/circulars';
import changesRoutes from '@/routes/changes';
import impactRoutes from '@/routes/impact';
import healthRoutes from '@/routes/health';

// Load environment variables
dotenv.config();

class RegulatoryIntelligenceService {
  private app: express.Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = config.port;
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.cors.allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Compression
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: config.rateLimit.maxRequests, // Limit each IP to maxRequests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    if (config.env !== 'test') {
      this.app.use(morgan('combined', {
        stream: {
          write: (message: string) => logger.info(message.trim())
        }
      }));
    }

    // Custom middleware
    this.app.use(requestLogger);
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.use('/health', healthRoutes);

    // API routes with authentication
    this.app.use('/api/v1/regulations', authMiddleware, regulationsRoutes);
    this.app.use('/api/v1/circulars', authMiddleware, circularsRoutes);
    this.app.use('/api/v1/changes', authMiddleware, changesRoutes);
    this.app.use('/api/v1/impact', authMiddleware, impactRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        service: 'Regulatory Intelligence Service',
        version: '1.0.0',
        status: 'operational',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/health',
          regulations: '/api/v1/regulations',
          circulars: '/api/v1/circulars',
          changes: '/api/v1/changes',
          impact: '/api/v1/impact'
        }
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        message: `The requested endpoint ${req.originalUrl} does not exist`,
        availableEndpoints: [
          '/health',
          '/api/v1/regulations',
          '/api/v1/circulars',
          '/api/v1/changes',
          '/api/v1/impact'
        ]
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public start(): void {
    this.app.listen(this.port, () => {
      logger.info(`🚀 Regulatory Intelligence Service started on port ${this.port}`);
      logger.info(`📊 Environment: ${config.env}`);
      logger.info(`🔗 Health check: http://localhost:${this.port}/health`);
      logger.info(`📡 API base URL: http://localhost:${this.port}/api/v1`);
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Start the service
const service = new RegulatoryIntelligenceService();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

if (require.main === module) {
  service.start();
}

export default service;
