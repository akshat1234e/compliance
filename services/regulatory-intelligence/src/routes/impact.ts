/**
 * Impact Analysis routes for Regulatory Intelligence Service
 */

import { Router } from 'express';
import { validateUuidParam, schemas, validateSchema } from '@middleware/validation';
import { requirePermission } from '@middleware/auth';
import { businessOperationLogger } from '@middleware/requestLogger';
import ImpactController from '@controllers/impactController';
import Joi from 'joi';

const router = Router();
const impactController = new ImpactController();

// Validation schemas
const impactAssessmentSchema = Joi.object({
  circularId: Joi.string().required(),
  organizationId: Joi.string().uuid().required(),
  organizationType: Joi.string().valid('bank', 'nbfc', 'cooperative_bank', 'payment_bank', 'small_finance_bank').required(),
  organizationProfile: Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    type: Joi.string().required(),
    size: Joi.string().valid('small', 'medium', 'large', 'very_large').required(),
    assetSize: Joi.number().positive().required(),
    customerBase: Joi.number().positive().required(),
    geographicPresence: Joi.array().items(Joi.string()).required(),
    businessLines: Joi.array().items(Joi.string()).required(),
    currentComplianceMaturity: Joi.number().min(1).max(10).required(),
    riskAppetite: Joi.string().valid('conservative', 'moderate', 'aggressive').required(),
    technologyMaturity: Joi.number().min(1).max(10).required(),
    complianceTeamSize: Joi.number().positive().required(),
    previousViolations: Joi.number().min(0).required(),
    lastAuditScore: Joi.number().min(0).max(100).required(),
  }).required(),
  analysisType: Joi.string().valid('basic', 'detailed', 'comprehensive').default('basic'),
  includeRecommendations: Joi.boolean().default(true),
  includeTimeline: Joi.boolean().default(true),
  includeCostEstimate: Joi.boolean().default(false),
  circularContent: Joi.string().optional(),
});

const compareAssessmentsSchema = Joi.object({
  assessmentIds: Joi.array().items(Joi.string()).min(2).max(5).required(),
});

// Analyze impact of a circular on an organization
router.post('/analyze',
  validateSchema(impactAssessmentSchema),
  requirePermission(['regulations:read', 'compliance:read']),
  businessOperationLogger('analyze_impact'),
  impactController.assessImpact
);

// Get impact analysis by ID
router.get('/:assessmentId',
  requirePermission(['regulations:read', 'compliance:read']),
  businessOperationLogger('get_impact_analysis'),
  impactController.getAssessment
);

// Get impact summary for organization
router.get('/summary/:organizationId',
  validateUuidParam,
  requirePermission(['regulations:read', 'compliance:read']),
  businessOperationLogger('get_impact_summary'),
  impactController.getOrganizationSummary
);

// Compare multiple impact assessments
router.post('/compare',
  validateSchema(compareAssessmentsSchema),
  requirePermission(['regulations:read', 'compliance:read']),
  businessOperationLogger('compare_assessments'),
  impactController.compareAssessments
);

// Clear assessment cache (admin only)
router.post('/cache/clear',
  requirePermission(['admin']),
  businessOperationLogger('clear_assessment_cache'),
  impactController.clearCache
);

export default router;
