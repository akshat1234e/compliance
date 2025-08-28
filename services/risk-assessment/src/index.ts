/**
 * Risk Assessment Service
 * AI-powered compliance risk scoring and prediction service
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
import { RiskEngine } from '@services/RiskEngine';
import { PredictionService } from '@services/PredictionService';
import { ScenarioAnalyzer } from '@services/ScenarioAnalyzer';
import { ModelTrainer } from '@services/ModelTrainer';

// Import routes
import healthRoutes from '@routes/health';
import riskRoutes from '@routes/risk';
import predictionRoutes from '@routes/prediction';
import scenarioRoutes from '@routes/scenario';
import modelRoutes from '@routes/model';
import assessmentRoutes from '@routes/assessment';

export class RiskAssessmentService {
  private app: Application;
  private port: number;
  private riskEngine: RiskEngine;
  private predictionService: PredictionService;
  private scenarioAnalyzer: ScenarioAnalyzer;
  private modelTrainer: ModelTrainer;

  constructor() {
    this.app = express();
    this.port = config.port;
    this.riskEngine = new RiskEngine();
    this.predictionService = new PredictionService();
    this.scenarioAnalyzer = new ScenarioAnalyzer();
    this.modelTrainer = new ModelTrainer();
    
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
    this.app.use('/api/v1/risk', authMiddleware, riskRoutes);
    this.app.use('/api/v1/prediction', authMiddleware, predictionRoutes);
    this.app.use('/api/v1/scenario', authMiddleware, scenarioRoutes);
    this.app.use('/api/v1/model', authMiddleware, modelRoutes);
    this.app.use('/api/v1/assessment', authMiddleware, assessmentRoutes);

    // API documentation
    this.app.get('/api/v1', (req: Request, res: Response) => {
      res.json({
        service: 'Risk Assessment Service',
        version: '1.0.0',
        description: 'AI-powered compliance risk scoring and prediction',
        endpoints: {
          risk: '/api/v1/risk',
          prediction: '/api/v1/prediction',
          scenario: '/api/v1/scenario',
          model: '/api/v1/model',
          assessment: '/api/v1/assessment'
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
      logger.info('Initializing risk assessment services...');

      // Initialize risk engine
      await this.riskEngine.initialize();
      logger.info('✅ Risk engine initialized');

      // Initialize prediction service
      await this.predictionService.initialize();
      logger.info('✅ Prediction service initialized');

      // Initialize scenario analyzer
      await this.scenarioAnalyzer.initialize();
      logger.info('✅ Scenario analyzer initialized');

      // Initialize model trainer
      await this.modelTrainer.initialize();
      logger.info('✅ Model trainer initialized');

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
        logger.info(`🚀 Risk Assessment Service started on port ${this.port}`);
        logger.info(`📊 Environment: ${config.env}`);
        logger.info(`🔗 Health check: http://localhost:${this.port}/health`);
        logger.info(`📡 API base URL: http://localhost:${this.port}/api/v1`);
        logger.info(`🎯 Risk Engine: Active`);
        logger.info(`🔮 Prediction Service: Running`);
        logger.info(`📈 Scenario Analyzer: Enabled`);
        logger.info(`🤖 Model Trainer: Ready`);
      });
    } catch (error) {
      logger.error('Failed to start service', error);
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    try {
      logger.info('Shutting down Risk Assessment Service...');

      // Shutdown services gracefully
      await this.riskEngine.shutdown();
      await this.predictionService.shutdown();
      await this.scenarioAnalyzer.shutdown();
      await this.modelTrainer.shutdown();

      logger.info('✅ Service shutdown completed');
    } catch (error) {
      logger.error('Error during shutdown', error);
    }
  }

  public getApp(): Application {
    return this.app;
  }

  public getRiskEngine(): RiskEngine {
    return this.riskEngine;
  }

  public getPredictionService(): PredictionService {
    return this.predictionService;
  }

  public getScenarioAnalyzer(): ScenarioAnalyzer {
    return this.scenarioAnalyzer;
  }

  public getModelTrainer(): ModelTrainer {
    return this.modelTrainer;
  }
}

// Create and start the service
const service = new RiskAssessmentService();

// Start the service
service.start().catch((error) => {
  logger.error('Failed to start Risk Assessment Service', error);
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

export default RiskAssessmentService;
