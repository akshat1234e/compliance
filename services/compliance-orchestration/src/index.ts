/**
 * Compliance Orchestration Service
 * Central workflow engine for compliance processes and task orchestration
 */

import { config } from '@config/index';
import { WorkflowEngine } from '@engines/WorkflowEngine';
import { authMiddleware } from '@middleware/auth';
import { errorHandler, notFoundHandler } from '@middleware/errorHandler';
import { requestLogger } from '@middleware/requestLogger';
import { NotificationService } from '@services/NotificationService';
import { TaskScheduler } from '@services/TaskScheduler';
import { logger } from '@utils/logger';
import compression from 'compression';
import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Import routes
import analyticsRoutes from '@routes/analytics';
import approvalRoutes from '@routes/approvals';
import enhancedWorkflowRoutes from '@routes/enhanced-workflows';
import healthRoutes from '@routes/health';
import processRoutes from '@routes/processes';
import taskRoutes from '@routes/tasks';
import templateRoutes from '@routes/templates';
import workflowRoutes from '@routes/workflows';

export class ComplianceOrchestrationService {
  private app: Application;
  private port: number;
  private workflowEngine: WorkflowEngine;
  private taskScheduler: TaskScheduler;
  private notificationService: NotificationService;

  constructor() {
    this.app = express();
    this.port = config.port;
    this.workflowEngine = new WorkflowEngine();
    this.taskScheduler = new TaskScheduler();
    this.notificationService = new NotificationService();

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeServices();
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
    this.app.use('/api/v1/workflows', authMiddleware, workflowRoutes);
    this.app.use('/api/v1/enhanced-workflows', authMiddleware, enhancedWorkflowRoutes);
    this.app.use('/api/v1/tasks', authMiddleware, taskRoutes);
    this.app.use('/api/v1/processes', authMiddleware, processRoutes);
    this.app.use('/api/v1/approvals', authMiddleware, approvalRoutes);
    this.app.use('/api/v1/templates', authMiddleware, templateRoutes);
    this.app.use('/api/v1/analytics', authMiddleware, analyticsRoutes);

    // API documentation
    this.app.get('/api/v1', (req: Request, res: Response) => {
      res.json({
        service: 'Compliance Orchestration Service',
        version: '1.0.0',
        description: 'Central workflow engine for compliance processes',
        endpoints: {
          workflows: '/api/v1/workflows',
          enhancedWorkflows: '/api/v1/enhanced-workflows',
          tasks: '/api/v1/tasks',
          processes: '/api/v1/processes',
          approvals: '/api/v1/approvals',
          templates: '/api/v1/templates',
          analytics: '/api/v1/analytics'
        },
        health: '/health',
        documentation: '/api/v1/docs',
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
      logger.info('Initializing compliance orchestration services...');

      // Initialize workflow engine
      await this.workflowEngine.initialize();
      logger.info('✅ Workflow engine initialized');

      // Initialize task scheduler
      await this.taskScheduler.initialize();
      logger.info('✅ Task scheduler initialized');

      // Initialize notification service
      await this.notificationService.initialize();
      logger.info('✅ Notification service initialized');

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
        logger.info(`🚀 Compliance Orchestration Service started on port ${this.port}`);
        logger.info(`📊 Environment: ${config.env}`);
        logger.info(`🔗 Health check: http://localhost:${this.port}/health`);
        logger.info(`📡 API base URL: http://localhost:${this.port}/api/v1`);
        logger.info(`⚙️ Workflow Engine: Active`);
        logger.info(`📅 Task Scheduler: Running`);
        logger.info(`📢 Notifications: Enabled`);
      });
    } catch (error) {
      logger.error('Failed to start service', error);
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    try {
      logger.info('Shutting down Compliance Orchestration Service...');

      // Shutdown services gracefully
      await this.workflowEngine.shutdown();
      await this.taskScheduler.shutdown();
      await this.notificationService.shutdown();

      logger.info('✅ Service shutdown completed');
    } catch (error) {
      logger.error('Error during shutdown', error);
    }
  }

  public getApp(): Application {
    return this.app;
  }

  public getWorkflowEngine(): WorkflowEngine {
    return this.workflowEngine;
  }

  public getTaskScheduler(): TaskScheduler {
    return this.taskScheduler;
  }

  public getNotificationService(): NotificationService {
    return this.notificationService;
  }
}

// Create and start the service
const service = new ComplianceOrchestrationService();

// Start the service
service.start().catch((error) => {
  logger.error('Failed to start Compliance Orchestration Service', error);
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

export default ComplianceOrchestrationService;
