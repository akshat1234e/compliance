/**
 * Dashboard Routes
 * API endpoints for dashboard management
 */

import { Router, Request, Response } from 'express';
import { logger } from '@utils/logger';
import { asyncHandler } from '@middleware/errorHandler';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  logger.info('Fetching dashboard data', { userId: req.user?.id });

  res.json({
    success: true,
    data: {
      widgets: [],
      layout: {},
      lastUpdated: new Date(),
    },
    message: 'Dashboard data retrieved successfully',
  });
}));

export default router;
