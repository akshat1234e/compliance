import express from 'express';
import { GatewayService } from '../services/GatewayService';
import logger from '../utils/logger';

const router = express.Router();
const gatewayService = new GatewayService();

router.all('/:serviceName/*', async (req, res) => {
  const { serviceName } = req.params;
  const path = (req.params as any)[0]; // Fix type issue
  const method = req.method;
  const data = req.body;

  try {
    const response = await gatewayService.routeRequest(serviceName, path, method, data);
    res.json(response);
  } catch (error: any) {
    logger.error(`Gateway routing error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to route request to service'
    });
  }
});

export default router;
