import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorMiddleware';
import { requestLogger } from './middleware/requestLogger';
import gatewayRoutes from './routes/gatewayRoutes';
import webhookRoutes from './routes/webhooks';
import { ConnectorHealthIntegration } from './services/ConnectorHealthIntegration';
import { DataTransformationEngine } from './services/DataTransformationEngine';
import { GatewayService } from './services/GatewayService';
import { HealthCheckService } from './services/HealthCheckService';
import { MonitoringService } from './services/MonitoringService';
import { WebhookIntegrationService } from './services/WebhookIntegrationService';
import { WebhookManager } from './services/WebhookManager';
import logger from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env['GATEWAY_PORT'] || 3000;
const startTime = Date.now();

// Initialize services
let gatewayService: GatewayService;
let webhookManager: WebhookManager;
let webhookIntegrationService: WebhookIntegrationService;
let transformationEngine: DataTransformationEngine;
let healthCheckService: HealthCheckService;
let monitoringService: MonitoringService;
let connectorHealthIntegration: ConnectorHealthIntegration;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env['ALLOWED_ORIGINS']?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// Request logging
app.use(requestLogger);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const systemHealth = healthCheckService
      ? await healthCheckService.getSystemHealth()
      : {
          status: 'unknown',
          timestamp: new Date(),
          uptime: Date.now() - startTime,
          version: process.env['npm_package_version'] || '1.0.0',
          environment: process.env['NODE_ENV'] || 'development',
          checks: [],
          summary: { total: 0, healthy: 0, unhealthy: 0, degraded: 0, unknown: 0 },
          performance: {
            averageResponseTime: 0,
            totalRequests: 0,
            errorRate: 0,
            memoryUsage: { used: 0, total: 0, percentage: 0 },
            cpuUsage: 0,
          },
        };

    // Set appropriate HTTP status based on health
    let statusCode = 200;
    if (systemHealth.status === 'unhealthy') {
      statusCode = 503; // Service Unavailable
    } else if (systemHealth.status === 'degraded') {
      statusCode = 200; // OK but with warnings
    }

    res.status(statusCode).json({
      ...systemHealth,
      services: {
        gateway: gatewayService?.getConnectorStatus() || 'not initialized',
        webhook: webhookManager?.getStats() || 'not initialized',
        monitoring: monitoringService ? 'running' : 'not initialized',
        healthCheck: healthCheckService ? 'running' : 'not initialized',
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// API Routes
app.use('/api/gateway', gatewayRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/monitoring', monitoringRoutes);

// Error handling middleware
app.use(errorHandler);

// Initialize and start services
async function initializeServices() {
  try {
    logger.info('Initializing Integration Gateway services...');

    // Initialize transformation engine
    transformationEngine = new DataTransformationEngine();
    await transformationEngine.initialize();

    // Initialize health check service
    healthCheckService = new HealthCheckService({
      checkInterval: parseInt(process.env['HEALTH_CHECK_INTERVAL'] || '30000'),
      timeout: parseInt(process.env['HEALTH_CHECK_TIMEOUT'] || '10000'),
      enableAlerts: process.env['ENABLE_HEALTH_ALERTS'] === 'true',
    });
    await healthCheckService.initialize();

    // Initialize monitoring service
    monitoringService = new MonitoringService(healthCheckService, {
      metricsRetentionDays: parseInt(process.env['METRICS_RETENTION_DAYS'] || '7'),
      alertingEnabled: process.env['ENABLE_MONITORING_ALERTS'] === 'true',
      performanceThresholds: {
        responseTime: parseInt(process.env['PERFORMANCE_RESPONSE_TIME_THRESHOLD'] || '5000'),
        errorRate: parseFloat(process.env['PERFORMANCE_ERROR_RATE_THRESHOLD'] || '0.05'),
        throughput: parseInt(process.env['PERFORMANCE_THROUGHPUT_THRESHOLD'] || '100'),
      },
    });
    await monitoringService.initialize();

    // Initialize gateway service
    gatewayService = new GatewayService();
    await gatewayService.initialize();

    // Initialize connector health integration
    connectorHealthIntegration = new ConnectorHealthIntegration(
      healthCheckService,
      monitoringService,
      gatewayService,
      {
        enableAutoRegistration: process.env['ENABLE_CONNECTOR_AUTO_HEALTH_CHECKS'] === 'true',
        enablePerformanceMonitoring: process.env['ENABLE_CONNECTOR_PERFORMANCE_MONITORING'] === 'true',
      }
    );
    await connectorHealthIntegration.initialize();

    // Initialize webhook manager
    webhookManager = new WebhookManager();

    // Initialize webhook integration service
    webhookIntegrationService = new WebhookIntegrationService(
      webhookManager,
      gatewayService,
      transformationEngine,
      {
        enableAutoEvents: process.env['ENABLE_AUTO_WEBHOOK_EVENTS'] === 'true',
        eventBufferSize: parseInt(process.env['WEBHOOK_EVENT_BUFFER_SIZE'] || '1000'),
        eventBatchSize: parseInt(process.env['WEBHOOK_EVENT_BATCH_SIZE'] || '10'),
        eventFlushInterval: parseInt(process.env['WEBHOOK_EVENT_FLUSH_INTERVAL'] || '5000'),
        enableEventFiltering: process.env['ENABLE_WEBHOOK_EVENT_FILTERING'] === 'true',
        enableEventTransformation: process.env['ENABLE_WEBHOOK_EVENT_TRANSFORMATION'] === 'true',
        defaultTransformationRuleId: process.env['DEFAULT_WEBHOOK_TRANSFORMATION_RULE_ID'] || undefined,
      }
    );
    await webhookIntegrationService.initialize();

    logger.info('All services initialized successfully');

  } catch (error) {
    logger.error('Failed to initialize services', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function gracefulShutdown() {
  logger.info('Received shutdown signal, gracefully shutting down...');

  try {
    if (connectorHealthIntegration) {
      await connectorHealthIntegration.shutdown();
    }
    if (webhookIntegrationService) {
      await webhookIntegrationService.shutdown();
    }
    if (webhookManager) {
      await webhookManager.shutdown();
    }
    if (monitoringService) {
      await monitoringService.shutdown();
    }
    if (healthCheckService) {
      await healthCheckService.shutdown();
    }
    if (gatewayService) {
      await gatewayService.shutdown();
    }
    if (transformationEngine) {
      await transformationEngine.shutdown();
    }

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start the server
async function startServer() {
  await initializeServices();

  app.listen(PORT, () => {
    logger.info(`Integration Gateway Service running on port ${PORT}`);
    console.log(`🚀 Integration Gateway Service running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 Gateway API: http://localhost:${PORT}/api/gateway`);
    console.log(`🪝 Webhook API: http://localhost:${PORT}/api/webhooks`);
    console.log(`📈 Monitoring API: http://localhost:${PORT}/api/monitoring`);
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});
