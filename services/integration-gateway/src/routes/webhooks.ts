/**
 * Webhook Routes
 * API endpoints for webhook management
 */

import { Router } from 'express';
import { WebhookController } from '../controllers/WebhookController';
import { WebhookManager } from '../services/WebhookManager';
import { authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rateLimit';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();

// Initialize webhook manager and controller
const webhookManager = new WebhookManager();
const webhookController = new WebhookController(webhookManager);

// Apply authentication and rate limiting to all webhook routes
router.use(authMiddleware);
router.use(rateLimitMiddleware);

// Webhook Endpoint Management Routes

/**
 * @route POST /api/webhooks/endpoints
 * @desc Create a new webhook endpoint
 * @access Private
 */
router.post(
  '/endpoints',
  [
    body('name')
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be between 1 and 100 characters'),
    body('url')
      .isURL()
      .withMessage('Valid URL is required'),
    body('secret')
      .isLength({ min: 8 })
      .withMessage('Secret must be at least 8 characters long'),
    body('events')
      .isArray({ min: 1 })
      .withMessage('At least one event type must be specified'),
    body('events.*')
      .isString()
      .withMessage('Event types must be strings'),
    body('timeout')
      .optional()
      .isInt({ min: 1000, max: 300000 })
      .withMessage('Timeout must be between 1000 and 300000 milliseconds'),
    body('retryPolicy.maxAttempts')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Max attempts must be between 1 and 10'),
    body('retryPolicy.backoffMultiplier')
      .optional()
      .isFloat({ min: 1, max: 10 })
      .withMessage('Backoff multiplier must be between 1 and 10'),
    body('signatureAlgorithm')
      .optional()
      .isIn(['sha256', 'sha1', 'md5'])
      .withMessage('Signature algorithm must be sha256, sha1, or md5'),
  ],
  validateRequest,
  webhookController.createEndpoint
);

/**
 * @route GET /api/webhooks/endpoints
 * @desc Get all webhook endpoints
 * @access Private
 */
router.get('/endpoints', webhookController.getEndpoints);

/**
 * @route GET /api/webhooks/endpoints/:id
 * @desc Get a specific webhook endpoint
 * @access Private
 */
router.get(
  '/endpoints/:id',
  [
    param('id')
      .notEmpty()
      .withMessage('Endpoint ID is required'),
  ],
  validateRequest,
  webhookController.getEndpoint
);

/**
 * @route PUT /api/webhooks/endpoints/:id
 * @desc Update a webhook endpoint
 * @access Private
 */
router.put(
  '/endpoints/:id',
  [
    param('id')
      .notEmpty()
      .withMessage('Endpoint ID is required'),
    body('name')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be between 1 and 100 characters'),
    body('url')
      .optional()
      .isURL()
      .withMessage('Valid URL is required'),
    body('events')
      .optional()
      .isArray({ min: 1 })
      .withMessage('At least one event type must be specified'),
    body('timeout')
      .optional()
      .isInt({ min: 1000, max: 300000 })
      .withMessage('Timeout must be between 1000 and 300000 milliseconds'),
  ],
  validateRequest,
  webhookController.updateEndpoint
);

/**
 * @route DELETE /api/webhooks/endpoints/:id
 * @desc Delete a webhook endpoint
 * @access Private
 */
router.delete(
  '/endpoints/:id',
  [
    param('id')
      .notEmpty()
      .withMessage('Endpoint ID is required'),
  ],
  validateRequest,
  webhookController.deleteEndpoint
);

/**
 * @route POST /api/webhooks/endpoints/:id/test
 * @desc Test a webhook endpoint
 * @access Private
 */
router.post(
  '/endpoints/:id/test',
  [
    param('id')
      .notEmpty()
      .withMessage('Endpoint ID is required'),
  ],
  validateRequest,
  webhookController.testEndpoint
);

/**
 * @route GET /api/webhooks/endpoints/:id/stats
 * @desc Get statistics for a specific webhook endpoint
 * @access Private
 */
router.get(
  '/endpoints/:id/stats',
  [
    param('id')
      .notEmpty()
      .withMessage('Endpoint ID is required'),
  ],
  validateRequest,
  webhookController.getEndpointStats
);

// Event Publishing Routes

/**
 * @route POST /api/webhooks/events
 * @desc Publish a webhook event
 * @access Private
 */
router.post(
  '/events',
  [
    body('type')
      .notEmpty()
      .withMessage('Event type is required')
      .matches(/^[a-zA-Z0-9._-]+$/)
      .withMessage('Event type must contain only alphanumeric characters, dots, underscores, and hyphens'),
    body('source')
      .notEmpty()
      .withMessage('Event source is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Source must be between 1 and 100 characters'),
    body('data')
      .notEmpty()
      .withMessage('Event data is required'),
  ],
  validateRequest,
  webhookController.publishEvent
);

// Delivery Management Routes

/**
 * @route GET /api/webhooks/deliveries
 * @desc Get webhook deliveries
 * @access Private
 */
router.get(
  '/deliveries',
  [
    query('webhookId')
      .optional()
      .isString()
      .withMessage('Webhook ID must be a string'),
    query('eventId')
      .optional()
      .isString()
      .withMessage('Event ID must be a string'),
    query('status')
      .optional()
      .isIn(['pending', 'success', 'failed', 'retrying'])
      .withMessage('Status must be pending, success, failed, or retrying'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Limit must be between 1 and 1000'),
  ],
  validateRequest,
  webhookController.getDeliveries
);

/**
 * @route GET /api/webhooks/deliveries/:id
 * @desc Get a specific webhook delivery
 * @access Private
 */
router.get(
  '/deliveries/:id',
  [
    param('id')
      .notEmpty()
      .withMessage('Delivery ID is required'),
  ],
  validateRequest,
  webhookController.getDelivery
);

// Statistics Routes

/**
 * @route GET /api/webhooks/stats
 * @desc Get overall webhook statistics
 * @access Private
 */
router.get('/stats', webhookController.getStats);

// Utility Routes

/**
 * @route POST /api/webhooks/validate-signature
 * @desc Validate a webhook signature
 * @access Private
 */
router.post(
  '/validate-signature',
  [
    body('payload')
      .notEmpty()
      .withMessage('Payload is required'),
    body('signature')
      .notEmpty()
      .withMessage('Signature is required'),
    body('secret')
      .notEmpty()
      .withMessage('Secret is required'),
    body('algorithm')
      .optional()
      .isIn(['sha256', 'sha1', 'md5'])
      .withMessage('Algorithm must be sha256, sha1, or md5'),
  ],
  validateRequest,
  webhookController.validateSignature
);

// Health Check Route
router.get('/health', (req, res) => {
  const stats = webhookManager.getStats();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    webhookManager: {
      totalEndpoints: stats.totalEndpoints,
      activeEndpoints: stats.activeEndpoints,
      pendingDeliveries: stats.pendingDeliveries,
    },
  });
});

// Export the webhook manager instance for use in other parts of the application
export { webhookManager };
export default router;
