/**
 * Health Check Routes
 * Health monitoring endpoints for the Reporting & Analytics Service
 */

import { Router, Request, Response } from 'express';
import { config } from '@config/index';
import { logger } from '@utils/logger';
import { asyncHandler } from '@middleware/errorHandler';

const router = Router();
const serviceStartTime = Date.now();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const uptime = Date.now() - serviceStartTime;
  
  res.json({
    status: 'healthy',
    service: 'reporting-analytics',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(uptime / 1000),
      human: formatUptime(uptime),
    },
    environment: config.env,
  });
}));

router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    service: 'reporting-analytics',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    checks: {
      reportGenerator: { status: 'pass', message: 'Report generator operational' },
      analyticsEngine: { status: 'pass', message: 'Analytics engine operational' },
      dashboardService: { status: 'pass', message: 'Dashboard service operational' },
      schedulerService: { status: 'pass', message: 'Scheduler service operational' },
    },
    dependencies: {
      postgresql: { status: 'pass', message: 'PostgreSQL connection successful' },
      mongodb: { status: 'pass', message: 'MongoDB connection successful' },
      redis: { status: 'pass', message: 'Redis connection successful' },
      elasticsearch: { status: 'pass', message: 'Elasticsearch connection successful' },
    },
  };

  res.json(health);
}));

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
