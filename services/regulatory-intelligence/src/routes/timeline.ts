/**
 * Timeline routes for Regulatory Intelligence Service
 */

import { Router } from 'express';
import { validateSchema, validateUuidParam } from '@middleware/validation';
import { requirePermission } from '@middleware/auth';
import { businessOperationLogger } from '@middleware/requestLogger';
import TimelineController from '@controllers/timelineController';
import Joi from 'joi';

const router = Router();
const timelineController = new TimelineController();

// Validation schemas
const generateTimelineSchema = Joi.object({
  circularId: Joi.string().required(),
  circularContent: Joi.string().optional(),
  circularMetadata: Joi.object({
    circularNumber: Joi.string().optional(),
    title: Joi.string().optional(),
    circularDate: Joi.string().optional(),
    effectiveDate: Joi.string().optional(),
    category: Joi.string().optional(),
    impactLevel: Joi.string().optional(),
    affectedEntities: Joi.array().items(Joi.string()).optional(),
    sourceUrl: Joi.string().uri().optional(),
  }).optional(),
  organizationId: Joi.string().uuid().optional(),
  organizationType: Joi.string().valid(
    'bank',
    'nbfc',
    'cooperative_bank',
    'payment_bank',
    'small_finance_bank'
  ).required(),
  organizationSize: Joi.string().valid('small', 'medium', 'large', 'very_large').default('medium'),
  complianceMaturity: Joi.number().min(1).max(10).default(5),
  includeBufferTime: Joi.boolean().default(true),
  bufferPercentage: Joi.number().min(0).max(100).default(10),
  includeRiskAssessment: Joi.boolean().default(true),
  customDeadlines: Joi.array().items(
    Joi.object({
      type: Joi.string().required(),
      description: Joi.string().required(),
      date: Joi.date().iso().required(),
      priority: Joi.string().valid('low', 'medium', 'high', 'critical', 'urgent').required(),
    })
  ).optional(),
});

const updateEventStatusSchema = Joi.object({
  status: Joi.string().valid(
    'upcoming',
    'in_progress',
    'completed',
    'overdue',
    'cancelled',
    'postponed'
  ).required(),
  progress: Joi.number().min(0).max(100).optional(),
});

// Generate timeline mapping for a regulatory circular
router.post('/generate',
  validateSchema(generateTimelineSchema),
  requirePermission(['regulations:read', 'timeline:create', 'admin']),
  businessOperationLogger('generate_timeline'),
  timelineController.generateTimeline
);

// Get timeline mapping by ID
router.get('/:timelineId',
  requirePermission(['regulations:read', 'timeline:read', 'admin']),
  businessOperationLogger('get_timeline'),
  timelineController.getTimeline
);

// Update timeline event status
router.patch('/:timelineId/events/:eventId/status',
  validateSchema(updateEventStatusSchema),
  requirePermission(['timeline:write', 'admin']),
  businessOperationLogger('update_event_status'),
  timelineController.updateEventStatus
);

// Get timeline statistics
router.get('/stats/overview',
  requirePermission(['timeline:read', 'admin']),
  businessOperationLogger('get_timeline_stats'),
  timelineController.getTimelineStats
);

// Get organization timeline overview
router.get('/organization/:organizationId',
  validateUuidParam,
  requirePermission(['regulations:read', 'timeline:read', 'admin']),
  businessOperationLogger('get_organization_timeline'),
  timelineController.getOrganizationTimeline
);

// Clear timeline cache (admin only)
router.post('/cache/clear',
  requirePermission(['admin']),
  businessOperationLogger('clear_timeline_cache'),
  timelineController.clearCache
);

export default router;
