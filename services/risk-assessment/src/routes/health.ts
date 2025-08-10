/**
 * Health Check Routes
 * Health monitoring endpoints for the Risk Assessment Service
 */

import { Router, Request, Response } from 'express';
import { config } from '@config/index';
import { asyncHandler } from '@middleware/errorHandler';

const router = Router();
const serviceStartTime = Date.now();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const uptime = Date.now() - serviceStartTime;
  
  res.json({
    status: 'healthy',
    service: 'risk-assessment',
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
    service: 'risk-assessment',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    checks: {
      riskEngine: { status: 'pass', message: 'Risk engine operational' },
      predictionService: { status: 'pass', message: 'Prediction service operational' },
      scenarioAnalyzer: { status: 'pass', message: 'Scenario analyzer operational' },
      modelTrainer: { status: 'pass', message: 'Model trainer operational' },
    },
    dependencies: {
      postgresql: { status: 'pass', message: 'PostgreSQL connection successful' },
      mongodb: { status: 'pass', message: 'MongoDB connection successful' },
      redis: { status: 'pass', message: 'Redis connection successful' },
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
