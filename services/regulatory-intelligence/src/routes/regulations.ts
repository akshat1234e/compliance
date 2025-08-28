/**
 * Regulations routes for Regulatory Intelligence Service
 */

import { Router } from 'express';
import { validateSchema, validateUuidParam } from '@middleware/validation';
import { requirePermission } from '@middleware/auth';
import { businessOperationLogger } from '@middleware/requestLogger';
import RegulationsController from '@controllers/regulationsController';
import Joi from 'joi';

const router = Router();
const regulationsController = new RegulationsController();

// Validation schemas
const searchRegulationsSchema = Joi.object({
  query: Joi.string().required().min(2).max(200),
  filters: Joi.object({
    category: Joi.string().optional(),
    impactLevel: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
    status: Joi.string().valid('active', 'superseded', 'withdrawn').optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    affectedEntity: Joi.string().optional(),
  }).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  includeHighlights: Joi.boolean().default(true),
});

// Get paginated list of regulations with filtering
router.get('/',
  requirePermission(['regulations:read', 'admin']),
  businessOperationLogger('get_regulations'),
  regulationsController.getRegulations
);

// Get specific regulation details
router.get('/:id',
  requirePermission(['regulations:read', 'admin']),
  businessOperationLogger('get_regulation'),
  regulationsController.getRegulation
);

// Full-text search regulations
router.post('/search',
  validateSchema(searchRegulationsSchema),
  requirePermission(['regulations:read', 'admin']),
  businessOperationLogger('search_regulations'),
  regulationsController.searchRegulations
);

// Get compliance requirements for a regulation
router.get('/:id/requirements',
  requirePermission(['regulations:read', 'compliance:read', 'admin']),
  businessOperationLogger('get_regulation_requirements'),
  regulationsController.getRegulationRequirements
);

// Get regulatory timeline and deadlines
router.get('/:id/timeline',
  requirePermission(['regulations:read', 'timeline:read', 'admin']),
  businessOperationLogger('get_regulation_timeline'),
  regulationsController.getRegulationTimeline
);

export default router;
