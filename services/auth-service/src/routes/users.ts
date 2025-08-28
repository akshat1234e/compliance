import { Router } from 'express';
import { logger } from '../utils/logger';

const router = Router();

// Mock users endpoint
router.get('/', (req, res) => {
  logger.info('Users list requested');
  res.json({
    success: true,
    data: {
      users: [
        {
          id: '1',
          email: 'admin@compliance.com',
          name: 'Admin User',
          role: 'admin',
          organization: 'RBI Compliance Platform',
          isActive: true,
        },
        {
          id: '2',
          email: 'user@compliance.com',
          name: 'Regular User',
          role: 'user',
          organization: 'RBI Compliance Platform',
          isActive: true,
        },
      ],
    },
  });
});

export { router as userRoutes };
