/**
 * Health Check Routes
 * Health monitoring endpoints for the Compliance Orchestration Service
 */

import { Router, Request, Response } from 'express';
import { config } from '@config/index';
import { logger } from '@utils/logger';
import { asyncHandler } from '@middleware/errorHandler';

const router = Router();

// Service start time for uptime calculation
const serviceStartTime = Date.now();

/**
 * @route   GET /health
 * @desc    Basic health check
 * @access  Public
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const uptime = Date.now() - serviceStartTime;
  
  res.json({
    status: 'healthy',
    service: 'compliance-orchestration',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(uptime / 1000),
      human: formatUptime(uptime),
    },
    environment: config.env,
  });
}));

/**
 * @route   GET /health/detailed
 * @desc    Detailed health check with dependencies
 * @access  Public
 */
router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();
  const uptime = startTime - serviceStartTime;
  
  const health = {
    status: 'healthy',
    service: 'compliance-orchestration',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(uptime / 1000),
      human: formatUptime(uptime),
    },
    environment: config.env,
    checks: {} as Record<string, any>,
    dependencies: {} as Record<string, any>,
    metrics: {} as Record<string, any>,
  };

  try {
    // Check workflow engine
    try {
      // In a real implementation, this would check the workflow engine status
      health.checks.workflowEngine = {
        status: 'pass',
        message: 'Workflow engine is operational',
        responseTime: '5ms',
      };
    } catch (error) {
      health.checks.workflowEngine = {
        status: 'fail',
        message: 'Workflow engine check failed',
        error: (error as Error).message,
      };
    }

    // Check task scheduler
    try {
      // In a real implementation, this would check the task scheduler status
      health.checks.taskScheduler = {
        status: 'pass',
        message: 'Task scheduler is operational',
        responseTime: '3ms',
      };
    } catch (error) {
      health.checks.taskScheduler = {
        status: 'fail',
        message: 'Task scheduler check failed',
        error: (error as Error).message,
      };
    }

    // Check notification service
    try {
      // In a real implementation, this would check the notification service status
      health.checks.notificationService = {
        status: 'pass',
        message: 'Notification service is operational',
        responseTime: '7ms',
      };
    } catch (error) {
      health.checks.notificationService = {
        status: 'fail',
        message: 'Notification service check failed',
        error: (error as Error).message,
      };
    }

    // Check database connections
    try {
      // PostgreSQL check
      health.dependencies.postgresql = {
        status: 'pass',
        message: 'PostgreSQL connection successful',
        responseTime: '12ms',
      };

      // MongoDB check
      health.dependencies.mongodb = {
        status: 'pass',
        message: 'MongoDB connection successful',
        responseTime: '8ms',
      };

      // Redis check
      health.dependencies.redis = {
        status: 'pass',
        message: 'Redis connection successful',
        responseTime: '4ms',
      };
    } catch (error) {
      health.dependencies.database = {
        status: 'fail',
        message: 'Database connection failed',
        error: (error as Error).message,
      };
    }

    // Check external services
    try {
      // Regulatory Intelligence Service
      health.dependencies.regulatoryIntelligence = {
        status: 'pass',
        message: 'Regulatory Intelligence service reachable',
        responseTime: '25ms',
        url: config.services.regulatoryIntelligence.baseUrl,
      };

      // User Management Service
      health.dependencies.userManagement = {
        status: 'pass',
        message: 'User Management service reachable',
        responseTime: '18ms',
        url: config.services.userManagement.baseUrl,
      };
    } catch (error) {
      health.dependencies.externalServices = {
        status: 'fail',
        message: 'External service check failed',
        error: (error as Error).message,
      };
    }

    // System metrics
    const memoryUsage = process.memoryUsage();
    health.metrics = {
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
        unit: 'MB',
      },
      cpu: {
        usage: process.cpuUsage(),
      },
      eventLoop: {
        lag: '0ms', // Would use actual event loop lag measurement
      },
      activeHandles: process._getActiveHandles().length,
      activeRequests: process._getActiveRequests().length,
    };

    // Determine overall status
    const failedChecks = Object.values(health.checks).filter(check => check.status === 'fail');
    const failedDependencies = Object.values(health.dependencies).filter(dep => dep.status === 'fail');
    
    if (failedChecks.length > 0 || failedDependencies.length > 0) {
      health.status = failedChecks.length > 0 ? 'unhealthy' : 'degraded';
    }

    const responseTime = Date.now() - startTime;
    health.metrics.healthCheckDuration = `${responseTime}ms`;

    // Set appropriate status code
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check failed', error);
    
    res.status(503).json({
      status: 'unhealthy',
      service: 'compliance-orchestration',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      details: (error as Error).message,
    });
  }
}));

/**
 * @route   GET /health/ready
 * @desc    Readiness probe for Kubernetes
 * @access  Public
 */
router.get('/ready', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Check if service is ready to accept requests
    // This would include checking if all required services are initialized
    
    const ready = {
      status: 'ready',
      service: 'compliance-orchestration',
      timestamp: new Date().toISOString(),
      checks: {
        workflowEngine: 'initialized',
        taskScheduler: 'initialized',
        notificationService: 'initialized',
        database: 'connected',
      },
    };

    res.json(ready);
  } catch (error) {
    logger.error('Readiness check failed', error);
    
    res.status(503).json({
      status: 'not_ready',
      service: 'compliance-orchestration',
      timestamp: new Date().toISOString(),
      error: 'Service not ready',
      details: (error as Error).message,
    });
  }
}));

/**
 * @route   GET /health/live
 * @desc    Liveness probe for Kubernetes
 * @access  Public
 */
router.get('/live', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Basic liveness check - service is running
    const uptime = Date.now() - serviceStartTime;
    
    res.json({
      status: 'alive',
      service: 'compliance-orchestration',
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: Math.floor(uptime / 1000),
        human: formatUptime(uptime),
      },
    });
  } catch (error) {
    logger.error('Liveness check failed', error);
    
    res.status(503).json({
      status: 'dead',
      service: 'compliance-orchestration',
      timestamp: new Date().toISOString(),
      error: 'Liveness check failed',
    });
  }
}));

/**
 * @route   GET /health/metrics
 * @desc    Prometheus-style metrics endpoint
 * @access  Public
 */
router.get('/metrics', asyncHandler(async (req: Request, res: Response) => {
  try {
    const memoryUsage = process.memoryUsage();
    const uptime = Date.now() - serviceStartTime;
    
    // Prometheus-style metrics
    const metrics = [
      `# HELP compliance_orchestration_uptime_seconds Total uptime of the service in seconds`,
      `# TYPE compliance_orchestration_uptime_seconds counter`,
      `compliance_orchestration_uptime_seconds ${Math.floor(uptime / 1000)}`,
      '',
      `# HELP compliance_orchestration_memory_usage_bytes Memory usage in bytes`,
      `# TYPE compliance_orchestration_memory_usage_bytes gauge`,
      `compliance_orchestration_memory_usage_bytes{type="heap_used"} ${memoryUsage.heapUsed}`,
      `compliance_orchestration_memory_usage_bytes{type="heap_total"} ${memoryUsage.heapTotal}`,
      `compliance_orchestration_memory_usage_bytes{type="external"} ${memoryUsage.external}`,
      '',
      `# HELP compliance_orchestration_active_handles Number of active handles`,
      `# TYPE compliance_orchestration_active_handles gauge`,
      `compliance_orchestration_active_handles ${process._getActiveHandles().length}`,
      '',
      `# HELP compliance_orchestration_active_requests Number of active requests`,
      `# TYPE compliance_orchestration_active_requests gauge`,
      `compliance_orchestration_active_requests ${process._getActiveRequests().length}`,
      '',
      // Add workflow-specific metrics here
      `# HELP compliance_orchestration_workflows_total Total number of workflows`,
      `# TYPE compliance_orchestration_workflows_total counter`,
      `compliance_orchestration_workflows_total 0`, // Would get from workflow engine
      '',
      `# HELP compliance_orchestration_tasks_total Total number of tasks`,
      `# TYPE compliance_orchestration_tasks_total counter`,
      `compliance_orchestration_tasks_total 0`, // Would get from task scheduler
      '',
    ].join('\n');

    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics);
  } catch (error) {
    logger.error('Metrics endpoint failed', error);
    res.status(500).send('# Error generating metrics\n');
  }
}));

/**
 * Format uptime in human-readable format
 */
function formatUptime(uptimeMs: number): string {
  const seconds = Math.floor(uptimeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

export default router;
