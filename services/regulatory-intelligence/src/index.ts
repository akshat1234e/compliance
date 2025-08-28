/**
 * Regulatory Intelligence Service
 * Enterprise RBI Compliance Management Platform
 */

import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

import { config } from '@config/index';
import { databaseService } from '@database/DatabaseService';
import { authMiddleware } from '@middleware/auth';
import { errorHandler } from '@middleware/errorHandler';
import { requestLogger } from '@middleware/requestLogger';
import { logger } from '@utils/logger';

// Import routes
import changesRoutes from '@/routes/changes';
import circularsRoutes from '@/routes/circulars';
import docsRoutes from '@/routes/docs';
import healthRoutes from '@/routes/health';
import impactRoutes from '@/routes/impact';
import notificationRoutes from '@/routes/notifications';
import parserRoutes from '@/routes/parser';
import regulationsRoutes from '@/routes/regulations';
import scraperRoutes from '@/routes/scraper';
import timelineRoutes from '@/routes/timeline';

// Services
import ScheduledScrapingService from '@services/scheduledScrapingService';

// Load environment variables
dotenv.config();

class RegulatoryIntelligenceService {
  private app: express.Application;
  private port: number;
  private scheduler: ScheduledScrapingService;

  constructor() {
    this.app = express();
    this.port = config.port;
    this.scheduler = new ScheduledScrapingService();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  public getScheduler(): ScheduledScrapingService {
    return this.scheduler;
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
    this.app.use('/api/v1/scraper', authMiddleware, scraperRoutes);
    this.app.use('/api/v1/parser', authMiddleware, parserRoutes);
    this.app.use('/api/v1/notifications', authMiddleware, notificationRoutes);
    this.app.use('/api/v1/timeline', authMiddleware, timelineRoutes);
    this.app.use('/api/v1/docs', docsRoutes);

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
          impact: '/api/v1/impact',
          scraper: '/api/v1/scraper',
          parser: '/api/v1/parser',
          notifications: '/api/v1/notifications',
          timeline: '/api/v1/timeline'
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
          '/api/v1/impact',
          '/api/v1/scraper',
          '/api/v1/parser',
          '/api/v1/notifications',
          '/api/v1/timeline'
        ]
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Initialize database connections
      logger.info('Initializing database connections...');
      await databaseService.initialize();
      logger.info('✅ Database connections established');

      // Start scheduled scraping
      try {
        const scheduleConfig = ScheduledScrapingService.getDefaultConfig();
        this.scheduler.start(scheduleConfig);
        logger.info('🗓️ Scheduled scraping started', scheduleConfig);
      } catch (schedErr) {
        logger.error('Failed to start scheduled scraping', schedErr);
      }

      // Start the server
      this.app.listen(this.port, () => {
        logger.info(`🚀 Regulatory Intelligence Service started on port ${this.port}`);
        logger.info(`📊 Environment: ${config.env}`);
        logger.info(`🔗 Health check: http://localhost:${this.port}/health`);
        logger.info(`📡 API base URL: http://localhost:${this.port}/api/v1`);
        logger.info(`💾 Database: PostgreSQL, MongoDB, Redis, Elasticsearch`);
      });
    } catch (error) {
      logger.error('Failed to start service', error);
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    try {
      logger.info('Shutting down service...');

      // Stop scheduled scraping
      try {
        this.scheduler.stop();
        logger.info('🛑 Scheduled scraping stopped');
      } catch (schedErr) {
        logger.error('Failed to stop scheduled scraping', schedErr);
      }

      await databaseService.shutdown();
      logger.info('✅ Service shutdown completed');
    } catch (error) {
      logger.error('Error during shutdown', error);
    }
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Start the service
const service = new RegulatoryIntelligenceService();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await service.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await service.shutdown();
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
