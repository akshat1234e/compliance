/**
 * Scheduled Reports Routes
 * API endpoints for scheduled report management
 */

import { Router, Request, Response } from 'express';
import { logger } from '@utils/logger';
import { asyncHandler } from '@middleware/errorHandler';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  logger.info('Fetching scheduled reports', { userId: req.user?.id });

  res.json({
    success: true,
    data: {
      scheduledReports: [],
      total: 0,
    },
    message: 'Scheduled reports retrieved successfully',
  });
}));

export default router;
