/**
 * Reporting & Analytics Service
 * Automated report generation and compliance analytics service
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
import { ReportGenerator } from '@services/ReportGenerator';
import { AnalyticsEngine } from '@services/AnalyticsEngine';
import { DashboardService } from '@services/DashboardService';
import { SchedulerService } from '@services/SchedulerService';

// Import routes
import healthRoutes from '@routes/health';
import reportRoutes from '@routes/reports';
import analyticsRoutes from '@routes/analytics';
import dashboardRoutes from '@routes/dashboard';
import metricsRoutes from '@routes/metrics';
import scheduledRoutes from '@routes/scheduled';

export class ReportingAnalyticsService {
  private app: Application;
  private port: number;
  private reportGenerator: ReportGenerator;
  private analyticsEngine: AnalyticsEngine;
  private dashboardService: DashboardService;
  private schedulerService: SchedulerService;

  constructor() {
    this.app = express();
    this.port = config.port;
    this.reportGenerator = new ReportGenerator();
    this.analyticsEngine = new AnalyticsEngine();
    this.dashboardService = new DashboardService();
    this.schedulerService = new SchedulerService();
    
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
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

    // API routes with authentication
    this.app.use('/api/v1/reports', authMiddleware, reportRoutes);
    this.app.use('/api/v1/analytics', authMiddleware, analyticsRoutes);
    this.app.use('/api/v1/dashboard', authMiddleware, dashboardRoutes);
    this.app.use('/api/v1/metrics', authMiddleware, metricsRoutes);
    this.app.use('/api/v1/scheduled', authMiddleware, scheduledRoutes);

    // API documentation
    this.app.get('/api/v1', (req: Request, res: Response) => {
      res.json({
        service: 'Reporting & Analytics Service',
        version: '1.0.0',
        description: 'Automated report generation and compliance analytics',
        endpoints: {
          reports: '/api/v1/reports',
          analytics: '/api/v1/analytics',
          dashboard: '/api/v1/dashboard',
          metrics: '/api/v1/metrics',
          scheduled: '/api/v1/scheduled'
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
      logger.info('Initializing reporting and analytics services...');

      // Initialize report generator
      await this.reportGenerator.initialize();
      logger.info('✅ Report generator initialized');

      // Initialize analytics engine
      await this.analyticsEngine.initialize();
      logger.info('✅ Analytics engine initialized');

      // Initialize dashboard service
      await this.dashboardService.initialize();
      logger.info('✅ Dashboard service initialized');

      // Initialize scheduler service
      await this.schedulerService.initialize();
      logger.info('✅ Scheduler service initialized');

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
        logger.info(`🚀 Reporting & Analytics Service started on port ${this.port}`);
        logger.info(`📊 Environment: ${config.env}`);
        logger.info(`🔗 Health check: http://localhost:${this.port}/health`);
        logger.info(`📡 API base URL: http://localhost:${this.port}/api/v1`);
        logger.info(`📈 Report Generation: Active`);
        logger.info(`📊 Analytics Engine: Running`);
        logger.info(`📋 Dashboard Service: Enabled`);
        logger.info(`⏰ Scheduler: Active`);
      });
    } catch (error) {
      logger.error('Failed to start service', error);
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    try {
      logger.info('Shutting down Reporting & Analytics Service...');

      // Shutdown services gracefully
      await this.reportGenerator.shutdown();
      await this.analyticsEngine.shutdown();
      await this.dashboardService.shutdown();
      await this.schedulerService.shutdown();

      logger.info('✅ Service shutdown completed');
    } catch (error) {
      logger.error('Error during shutdown', error);
    }
  }

  public getApp(): Application {
    return this.app;
  }

  public getReportGenerator(): ReportGenerator {
    return this.reportGenerator;
  }

  public getAnalyticsEngine(): AnalyticsEngine {
    return this.analyticsEngine;
  }

  public getDashboardService(): DashboardService {
    return this.dashboardService;
  }

  public getSchedulerService(): SchedulerService {
    return this.schedulerService;
  }
}

// Create and start the service
const service = new ReportingAnalyticsService();

// Start the service
service.start().catch((error) => {
  logger.error('Failed to start Reporting & Analytics Service', error);
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

export default ReportingAnalyticsService;
