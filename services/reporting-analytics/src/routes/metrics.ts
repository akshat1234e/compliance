/**
 * Metrics Routes
 * API endpoints for system metrics
 */

import { Router, Request, Response } from 'express';
import { logger } from '@utils/logger';
import { asyncHandler } from '@middleware/errorHandler';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  logger.info('Fetching system metrics', { userId: req.user?.id });

  res.json({
    success: true,
    data: {
      system: { cpu: 45, memory: 60, disk: 30 },
      reports: { total: 150, success: 145, failed: 5 },
      performance: { avgGenerationTime: 2500, throughput: 25 },
    },
    message: 'System metrics retrieved successfully',
  });
}));

export default router;
