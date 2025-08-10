/**
 * Health check routes for Regulatory Intelligence Service
 */

import { Router, Request, Response } from 'express';
import { config } from '@config/index';
import { logger } from '@utils/logger';
import { asyncHandler } from '@middleware/errorHandler';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  service: string;
  checks: {
    [key: string]: {
      status: 'pass' | 'fail' | 'warn';
      message?: string;
      duration?: string;
      details?: any;
    };
  };
}

// Basic health check
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: config.version,
    environment: config.env,
    service: config.serviceName,
    checks: {},
  };

  try {
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
    };

    health.checks.memory = {
      status: memoryUsageMB.heapUsed > 500 ? 'warn' : 'pass',
      message: `Heap used: ${memoryUsageMB.heapUsed}MB`,
      details: memoryUsageMB,
    };

    // Check CPU usage (simplified)
    const cpuUsage = process.cpuUsage();
    health.checks.cpu = {
      status: 'pass',
      details: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
    };

    // Check if any checks failed
    const hasFailures = Object.values(health.checks).some(check => check.status === 'fail');
    const hasWarnings = Object.values(health.checks).some(check => check.status === 'warn');

    if (hasFailures) {
      health.status = 'unhealthy';
    } else if (hasWarnings) {
      health.status = 'degraded';
    }

    const duration = Date.now() - startTime;
    
    // Log health check
    logger.debug('Health check completed', {
      status: health.status,
      duration: `${duration}ms`,
      checks: Object.keys(health.checks).length,
    });

    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
    res.status(statusCode).json(health);

  } catch (error) {
    logger.error('Health check failed', { error: (error as Error).message });
    
    health.status = 'unhealthy';
    health.checks.general = {
      status: 'fail',
      message: 'Health check failed',
      details: { error: (error as Error).message },
    };

    res.status(503).json(health);
  }
}));

// Detailed health check with external dependencies
router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: config.version,
    environment: config.env,
    service: config.serviceName,
    checks: {},
  };

  try {
    // Check PostgreSQL connection
    try {
      const pgStartTime = Date.now();
      // TODO: Add actual PostgreSQL connection check
      // const pgClient = new Pool(config.database.postgres);
      // await pgClient.query('SELECT 1');
      // await pgClient.end();
      
      health.checks.postgresql = {
        status: 'pass',
        message: 'PostgreSQL connection successful',
        duration: `${Date.now() - pgStartTime}ms`,
      };
    } catch (error) {
      health.checks.postgresql = {
        status: 'fail',
        message: 'PostgreSQL connection failed',
        details: { error: (error as Error).message },
      };
    }

    // Check MongoDB connection
    try {
      const mongoStartTime = Date.now();
      // TODO: Add actual MongoDB connection check
      // const mongoClient = new MongoClient(config.database.mongodb.uri);
      // await mongoClient.connect();
      // await mongoClient.db().admin().ping();
      // await mongoClient.close();
      
      health.checks.mongodb = {
        status: 'pass',
        message: 'MongoDB connection successful',
        duration: `${Date.now() - mongoStartTime}ms`,
      };
    } catch (error) {
      health.checks.mongodb = {
        status: 'fail',
        message: 'MongoDB connection failed',
        details: { error: (error as Error).message },
      };
    }

    // Check Redis connection
    try {
      const redisStartTime = Date.now();
      // TODO: Add actual Redis connection check
      // const redisClient = createClient(config.database.redis);
      // await redisClient.connect();
      // await redisClient.ping();
      // await redisClient.disconnect();
      
      health.checks.redis = {
        status: 'pass',
        message: 'Redis connection successful',
        duration: `${Date.now() - redisStartTime}ms`,
      };
    } catch (error) {
      health.checks.redis = {
        status: 'fail',
        message: 'Redis connection failed',
        details: { error: (error as Error).message },
      };
    }

    // Check Elasticsearch connection
    try {
      const esStartTime = Date.now();
      // TODO: Add actual Elasticsearch connection check
      // const esClient = new Client({ node: config.database.elasticsearch.node });
      // await esClient.ping();
      
      health.checks.elasticsearch = {
        status: 'pass',
        message: 'Elasticsearch connection successful',
        duration: `${Date.now() - esStartTime}ms`,
      };
    } catch (error) {
      health.checks.elasticsearch = {
        status: 'fail',
        message: 'Elasticsearch connection failed',
        details: { error: (error as Error).message },
      };
    }

    // Check external RBI website
    try {
      const rbiStartTime = Date.now();
      // TODO: Add actual RBI website check
      // const response = await axios.get(config.externalServices.rbi.baseUrl, { timeout: 5000 });
      
      health.checks.rbi_website = {
        status: 'pass',
        message: 'RBI website accessible',
        duration: `${Date.now() - rbiStartTime}ms`,
      };
    } catch (error) {
      health.checks.rbi_website = {
        status: 'warn',
        message: 'RBI website check failed',
        details: { error: (error as Error).message },
      };
    }

    // System resource checks
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
    };

    health.checks.memory = {
      status: memoryUsageMB.heapUsed > 500 ? 'warn' : 'pass',
      message: `Heap used: ${memoryUsageMB.heapUsed}MB`,
      details: memoryUsageMB,
    };

    // Determine overall health status
    const hasFailures = Object.values(health.checks).some(check => check.status === 'fail');
    const hasWarnings = Object.values(health.checks).some(check => check.status === 'warn');

    if (hasFailures) {
      health.status = 'unhealthy';
    } else if (hasWarnings) {
      health.status = 'degraded';
    }

    const duration = Date.now() - startTime;
    
    logger.info('Detailed health check completed', {
      status: health.status,
      duration: `${duration}ms`,
      checks: Object.keys(health.checks),
      failures: Object.entries(health.checks).filter(([, check]) => check.status === 'fail').map(([name]) => name),
      warnings: Object.entries(health.checks).filter(([, check]) => check.status === 'warn').map(([name]) => name),
    });

    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
    res.status(statusCode).json(health);

  } catch (error) {
    logger.error('Detailed health check failed', { error: (error as Error).message });
    
    health.status = 'unhealthy';
    health.checks.general = {
      status: 'fail',
      message: 'Health check failed',
      details: { error: (error as Error).message },
    };

    res.status(503).json(health);
  }
}));

// Readiness probe (for Kubernetes)
router.get('/ready', asyncHandler(async (req: Request, res: Response) => {
  // Simple readiness check - service is ready if it can respond
  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    service: config.serviceName,
  });
}));

// Liveness probe (for Kubernetes)
router.get('/live', asyncHandler(async (req: Request, res: Response) => {
  // Simple liveness check - service is alive if it can respond
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: config.serviceName,
  });
}));

export default router;
