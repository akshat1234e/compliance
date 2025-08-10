/**
 * Integration Gateway Service
 * Seamless integration with banking cores and third-party systems
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from '@config/index';
import { logger } from '@utils/logger';
import { errorHandler, notFoundHandler } from '@middleware/errorHandler';
import { requestLogger } from '@middleware/requestLogger';
import { authMiddleware } from '@middleware/auth';
import { IntegrationEngine } from '@services/IntegrationEngine';
import { DataTransformer } from '@services/DataTransformer';
import { ConnectionManager } from '@services/ConnectionManager';
import { EventProcessor } from '@services/EventProcessor';

// Import routes
import healthRoutes from '@routes/health';
import integrationRoutes from '@routes/integration';
import connectionRoutes from '@routes/connection';
import transformationRoutes from '@routes/transformation';
import eventRoutes from '@routes/event';
import webhookRoutes from '@routes/webhook';

export class IntegrationGatewayService {
  private app: Application;
  private port: number;
  private integrationEngine: IntegrationEngine;
  private dataTransformer: DataTransformer;
  private connectionManager: ConnectionManager;
  private eventProcessor: EventProcessor;

  constructor() {
    this.app = express();
    this.port = config.port;
    this.integrationEngine = new IntegrationEngine();
    this.dataTransformer = new DataTransformer();
    this.connectionManager = new ConnectionManager();
    this.eventProcessor = new EventProcessor();
    
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
        preload: true,
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: config.cors.credentials,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // Compression and parsing
    this.app.use(compression());
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Request logging
    this.app.use(requestLogger);

    // Request ID middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.requestId = req.headers['x-request-id'] as string || 
                     `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      res.setHeader('X-Request-ID', req.requestId);
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check routes (no auth required)
    this.app.use('/health', healthRoutes);

    // Webhook routes (special auth handling)
    this.app.use('/webhook', webhookRoutes);

    // API routes with authentication
    this.app.use('/api/v1/integration', authMiddleware, integrationRoutes);
    this.app.use('/api/v1/connection', authMiddleware, connectionRoutes);
    this.app.use('/api/v1/transformation', authMiddleware, transformationRoutes);
    this.app.use('/api/v1/event', authMiddleware, eventRoutes);

    // API documentation
    this.app.get('/api/v1', (req: Request, res: Response) => {
      res.json({
        service: 'Integration Gateway Service',
        version: '1.0.0',
        description: 'Seamless integration with banking cores and third-party systems',
        endpoints: {
          integration: '/api/v1/integration',
          connection: '/api/v1/connection',
          transformation: '/api/v1/transformation',
          event: '/api/v1/event',
          webhook: '/webhook'
        },
        health: '/health',
        timestamp: new Date().toISOString(),
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  private async initializeServices(): Promise<void> {
    try {
      logger.info('Initializing integration gateway services...');

      // Initialize connection manager
      await this.connectionManager.initialize();
      logger.info('✅ Connection manager initialized');

      // Initialize data transformer
      await this.dataTransformer.initialize();
      logger.info('✅ Data transformer initialized');

      // Initialize integration engine
      await this.integrationEngine.initialize();
      logger.info('✅ Integration engine initialized');

      // Initialize event processor
      await this.eventProcessor.initialize();
      logger.info('✅ Event processor initialized');

      logger.info('🎯 All services initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize services', error);
      throw error;
    }
  }

  public async start(): Promise<void> {
    try {
      // Initialize services first
      await this.initializeServices();

      // Start the server
      this.app.listen(this.port, () => {
        logger.info(`🚀 Integration Gateway Service started on port ${this.port}`);
        logger.info(`📊 Environment: ${config.env}`);
        logger.info(`🔗 Health check: http://localhost:${this.port}/health`);
        logger.info(`📡 API base URL: http://localhost:${this.port}/api/v1`);
        logger.info(`🔌 Integration Engine: Active`);
        logger.info(`🔄 Data Transformer: Running`);
        logger.info(`📡 Connection Manager: Enabled`);
        logger.info(`⚡ Event Processor: Ready`);
      });
    } catch (error) {
      logger.error('Failed to start service', error);
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    try {
      logger.info('Shutting down Integration Gateway Service...');

      // Shutdown services gracefully
      await this.integrationEngine.shutdown();
      await this.dataTransformer.shutdown();
      await this.connectionManager.shutdown();
      await this.eventProcessor.shutdown();

      logger.info('✅ Service shutdown completed');
    } catch (error) {
      logger.error('Error during shutdown', error);
    }
  }

  public getApp(): Application {
    return this.app;
  }

  public getIntegrationEngine(): IntegrationEngine {
    return this.integrationEngine;
  }

  public getDataTransformer(): DataTransformer {
    return this.dataTransformer;
  }

  public getConnectionManager(): ConnectionManager {
    return this.connectionManager;
  }

  public getEventProcessor(): EventProcessor {
    return this.eventProcessor;
  }
}

// Create and start the service
const service = new IntegrationGatewayService();

// Start the service
service.start().catch((error) => {
  logger.error('Failed to start Integration Gateway Service', error);
  process.exit(1);
});

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

export default IntegrationGatewayService;
