import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'auth-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
  });
});

export { router as healthRoutes };
