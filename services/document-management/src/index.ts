/**
 * Document Management Service
 * Intelligent document processing and storage service for compliance management
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
import { DocumentProcessor } from '@processors/DocumentProcessor';
import { StorageManager } from '@storage/StorageManager';
import { OCRService } from '@services/OCRService';
import { ClassificationService } from '@services/ClassificationService';

// Import routes
import healthRoutes from '@routes/health';
import documentRoutes from '@routes/documents';
import uploadRoutes from '@routes/upload';
import searchRoutes from '@routes/search';
import templateRoutes from '@routes/templates';
import analyticsRoutes from '@routes/analytics';

export class DocumentManagementService {
  private app: Application;
  private port: number;
  private documentProcessor: DocumentProcessor;
  private storageManager: StorageManager;
  private ocrService: OCRService;
  private classificationService: ClassificationService;

  constructor() {
    this.app = express();
    this.port = config.port;
    this.documentProcessor = new DocumentProcessor();
    this.storageManager = new StorageManager();
    this.ocrService = new OCRService();
    this.classificationService = new ClassificationService();
    
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

    // API routes with authentication
    this.app.use('/api/v1/documents', authMiddleware, documentRoutes);
    this.app.use('/api/v1/upload', authMiddleware, uploadRoutes);
    this.app.use('/api/v1/search', authMiddleware, searchRoutes);
    this.app.use('/api/v1/templates', authMiddleware, templateRoutes);
    this.app.use('/api/v1/analytics', authMiddleware, analyticsRoutes);

    // API documentation
    this.app.get('/api/v1', (req: Request, res: Response) => {
      res.json({
        service: 'Document Management Service',
        version: '1.0.0',
        description: 'Intelligent document processing and storage service',
        endpoints: {
          documents: '/api/v1/documents',
          upload: '/api/v1/upload',
          search: '/api/v1/search',
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
      logger.info('Initializing document management services...');

      // Initialize storage manager
      await this.storageManager.initialize();
      logger.info('✅ Storage manager initialized');

      // Initialize document processor
      await this.documentProcessor.initialize();
      logger.info('✅ Document processor initialized');

      // Initialize OCR service
      await this.ocrService.initialize();
      logger.info('✅ OCR service initialized');

      // Initialize classification service
      await this.classificationService.initialize();
      logger.info('✅ Classification service initialized');

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
        logger.info(`🚀 Document Management Service started on port ${this.port}`);
        logger.info(`📊 Environment: ${config.env}`);
        logger.info(`🔗 Health check: http://localhost:${this.port}/health`);
        logger.info(`📡 API base URL: http://localhost:${this.port}/api/v1`);
        logger.info(`📄 Document Processing: Active`);
        logger.info(`🔍 OCR Service: Enabled`);
        logger.info(`🏷️ Classification: Running`);
        logger.info(`💾 Storage: ${config.storage.provider}`);
      });
    } catch (error) {
      logger.error('Failed to start service', error);
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    try {
      logger.info('Shutting down Document Management Service...');

      // Shutdown services gracefully
      await this.documentProcessor.shutdown();
      await this.storageManager.shutdown();
      await this.ocrService.shutdown();
      await this.classificationService.shutdown();

      logger.info('✅ Service shutdown completed');
    } catch (error) {
      logger.error('Error during shutdown', error);
    }
  }

  public getApp(): Application {
    return this.app;
  }

  public getDocumentProcessor(): DocumentProcessor {
    return this.documentProcessor;
  }

  public getStorageManager(): StorageManager {
    return this.storageManager;
  }

  public getOCRService(): OCRService {
    return this.ocrService;
  }

  public getClassificationService(): ClassificationService {
    return this.classificationService;
  }
}

// Create and start the service
const service = new DocumentManagementService();

// Start the service
service.start().catch((error) => {
  logger.error('Failed to start Document Management Service', error);
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

export default DocumentManagementService;
