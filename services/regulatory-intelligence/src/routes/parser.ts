/**
 * Parser routes for Regulatory Intelligence Service
 */

import { Router } from 'express';
import { validateSchema } from '@middleware/validation';
import { requirePermission } from '@middleware/auth';
import { businessOperationLogger } from '@middleware/requestLogger';
import ParserController from '@controllers/parserController';
import Joi from 'joi';

const router = Router();
const parserController = new ParserController();

// Validation schemas
const parseCircularSchema = Joi.object({
  circularId: Joi.string().required(),
  content: Joi.string().required().min(10),
  metadata: Joi.object({
    circularNumber: Joi.string().optional(),
    title: Joi.string().optional(),
    circularDate: Joi.string().optional(),
    sourceUrl: Joi.string().uri().optional(),
  }).optional(),
});

const batchParseSchema = Joi.object({
  circulars: Joi.array().items(
    Joi.object({
      circularId: Joi.string().required(),
      content: Joi.string().required().min(10),
      metadata: Joi.object().optional(),
    })
  ).min(1).max(10).required(),
});

const extractElementsSchema = Joi.object({
  content: Joi.string().required().min(10),
  elements: Joi.array().items(
    Joi.string().valid(
      'summary', 'keyPoints', 'requirements', 'deadlines',
      'references', 'definitions', 'entities', 'keywords'
    )
  ).min(1).required(),
});

const analyzeContentSchema = Joi.object({
  content: Joi.string().required().min(10),
});

// Parse single circular
router.post('/parse',
  validateSchema(parseCircularSchema),
  requirePermission(['regulations:write', 'admin', 'parser:execute']),
  businessOperationLogger('parse_circular'),
  parserController.parseCircular
);

// Parse multiple circulars in batch
router.post('/parse/batch',
  validateSchema(batchParseSchema),
  requirePermission(['regulations:write', 'admin', 'parser:execute']),
  businessOperationLogger('batch_parse_circulars'),
  parserController.parseCircularsBatch
);

// Extract specific elements from content
router.post('/extract',
  validateSchema(extractElementsSchema),
  requirePermission(['regulations:read', 'admin', 'parser:read']),
  businessOperationLogger('extract_elements'),
  parserController.extractElements
);

// Analyze content for sentiment, complexity, etc.
router.post('/analyze',
  validateSchema(analyzeContentSchema),
  requirePermission(['regulations:read', 'admin', 'parser:read']),
  businessOperationLogger('analyze_content'),
  parserController.analyzeContent
);

export default router;
