/**
 * Monitoring Routes
 * API endpoints for monitoring and health checks
 */

import { Router } from 'express';
import { MonitoringController } from '../controllers/MonitoringController';
import { HealthCheckService } from '../services/HealthCheckService';
import { MonitoringService } from '../services/MonitoringService';
import { authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rateLimit';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();

// Initialize services and controller
const healthCheckService = new HealthCheckService();
const monitoringService = new MonitoringService(healthCheckService);
const monitoringController = new MonitoringController(healthCheckService, monitoringService);

// Apply authentication and rate limiting to monitoring routes
router.use(authMiddleware);
router.use(rateLimitMiddleware);

// Health Check Routes

/**
 * @route GET /api/monitoring/health
 * @desc Get overall system health
 * @access Private
 */
router.get('/health', monitoringController.getSystemHealth);

/**
 * @route GET /api/monitoring/health/checks
 * @desc Get all health checks
 * @access Private
 */
router.get('/health/checks', monitoringController.getHealthChecks);

/**
 * @route GET /api/monitoring/health/checks/:id
 * @desc Get specific health check details
 * @access Private
 */
router.get(
  '/health/checks/:id',
  [
    param('id')
      .notEmpty()
      .withMessage('Health check ID is required'),
  ],
  validateRequest,
  monitoringController.getHealthCheck
);

/**
 * @route POST /api/monitoring/health/checks
 * @desc Create a new health check
 * @access Private
 */
router.post(
  '/health/checks',
  [
    body('id')
      .notEmpty()
      .withMessage('Health check ID is required')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('ID must contain only alphanumeric characters, underscores, and hyphens'),
    body('name')
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be between 1 and 100 characters'),
    body('type')
      .isIn(['http', 'database', 'connector', 'service', 'custom'])
      .withMessage('Type must be one of: http, database, connector, service, custom'),
    body('config')
      .optional()
      .isObject()
      .withMessage('Config must be an object'),
    body('config.url')
      .if(body('type').equals('http'))
      .isURL()
      .withMessage('Valid URL is required for HTTP health checks'),
    body('isEnabled')
      .optional()
      .isBoolean()
      .withMessage('isEnabled must be a boolean'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
  ],
  validateRequest,
  monitoringController.createHealthCheck
);

/**
 * @route DELETE /api/monitoring/health/checks/:id
 * @desc Delete a health check
 * @access Private
 */
router.delete(
  '/health/checks/:id',
  [
    param('id')
      .notEmpty()
      .withMessage('Health check ID is required'),
  ],
  validateRequest,
  monitoringController.deleteHealthCheck
);

// Connector Monitoring Routes

/**
 * @route GET /api/monitoring/connectors
 * @desc Get all connector metrics
 * @access Private
 */
router.get('/connectors', monitoringController.getConnectorMetrics);

/**
 * @route GET /api/monitoring/connectors/:connectorId
 * @desc Get specific connector metrics
 * @access Private
 */
router.get(
  '/connectors/:connectorId',
  [
    param('connectorId')
      .notEmpty()
      .withMessage('Connector ID is required'),
  ],
  validateRequest,
  monitoringController.getConnectorMetrics
);

/**
 * @route GET /api/monitoring/connectors/health/summary
 * @desc Get connector health summary
 * @access Private
 */
router.get('/connectors/health/summary', monitoringController.getConnectorHealth);

/**
 * @route POST /api/monitoring/connectors/record-request
 * @desc Record a connector request for metrics
 * @access Private
 */
router.post(
  '/connectors/record-request',
  [
    body('connectorId')
      .notEmpty()
      .withMessage('Connector ID is required'),
    body('success')
      .isBoolean()
      .withMessage('Success must be a boolean'),
    body('responseTime')
      .isNumeric()
      .withMessage('Response time must be a number')
      .isFloat({ min: 0 })
      .withMessage('Response time must be non-negative'),
  ],
  validateRequest,
  monitoringController.recordConnectorRequest
);

// System Metrics Routes

/**
 * @route GET /api/monitoring/metrics/system
 * @desc Get system metrics
 * @access Private
 */
router.get(
  '/metrics/system',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Limit must be between 1 and 1000'),
  ],
  validateRequest,
  monitoringController.getSystemMetrics
);

/**
 * @route GET /api/monitoring/metrics/performance
 * @desc Get performance metrics summary
 * @access Private
 */
router.get('/metrics/performance', monitoringController.getPerformanceMetrics);

// Alert Management Routes

/**
 * @route GET /api/monitoring/alerts
 * @desc Get alerts
 * @access Private
 */
router.get(
  '/alerts',
  [
    query('resolved')
      .optional()
      .isIn(['true', 'false'])
      .withMessage('Resolved must be true or false'),
  ],
  validateRequest,
  monitoringController.getAlerts
);

/**
 * @route POST /api/monitoring/alerts/:alertId/resolve
 * @desc Resolve an alert
 * @access Private
 */
router.post(
  '/alerts/:alertId/resolve',
  [
    param('alertId')
      .notEmpty()
      .withMessage('Alert ID is required'),
  ],
  validateRequest,
  monitoringController.resolveAlert
);

// Dashboard Routes

/**
 * @route GET /api/monitoring/dashboard
 * @desc Get dashboard summary with all key metrics
 * @access Private
 */
router.get('/dashboard', monitoringController.getDashboardSummary);

// Utility Routes

/**
 * @route GET /api/monitoring/status
 * @desc Get monitoring service status
 * @access Private
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    services: {
      healthCheck: 'running',
      monitoring: 'running',
    },
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Export the services for use in other parts of the application
export { healthCheckService, monitoringService };
export default router;
