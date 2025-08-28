/**
 * Connection Routes
 * API endpoints for connection management
 */

import { Router, Request, Response } from 'express';
import { logger } from '@utils/logger';
import { asyncHandler } from '@middleware/errorHandler';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  logger.info('Fetching connections', { userId: req.user?.id });

  res.json({
    success: true,
    data: {
      connections: [
        {
          id: 'conn_001',
          name: 'Temenos T24',
          type: 'banking_core',
          system: 'temenos',
          status: 'connected',
          isActive: true,
          lastConnected: new Date().toISOString(),
        },
      ],
      total: 1,
    },
    message: 'Connections retrieved successfully',
  });
}));

export default router;
