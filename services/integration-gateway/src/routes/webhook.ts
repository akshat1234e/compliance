/**
 * Webhook Routes
 * API endpoints for webhook handling
 */

import { Router, Request, Response } from 'express';
import { logger } from '@utils/logger';
import { asyncHandler } from '@middleware/errorHandler';

const router = Router();

router.post('/:system/:event', asyncHandler(async (req: Request, res: Response) => {
  const { system, event } = req.params;
  
  logger.info('Webhook received', {
    system,
    event,
    headers: req.headers,
    body: req.body,
  });

  // Process webhook
  res.status(200).json({
    success: true,
    message: 'Webhook processed successfully',
    timestamp: new Date().toISOString(),
  });
}));

export default router;
