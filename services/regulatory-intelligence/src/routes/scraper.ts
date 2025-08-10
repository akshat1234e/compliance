/**
 * Scraper routes for Regulatory Intelligence Service
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest, validateSchema } from '@middleware/validation';
import { requirePermission } from '@middleware/auth';
import { businessOperationLogger } from '@middleware/requestLogger';
import ScraperController from '@controllers/scraperController';
import Joi from 'joi';

const router = Router();
const scraperController = new ScraperController();

// Validation schemas
const scrapingOptionsSchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  category: Joi.string().optional().max(100),
  maxPages: Joi.number().integer().min(1).max(20).default(5),
  includeContent: Joi.boolean().default(false),
  downloadFiles: Joi.boolean().default(false),
});

const downloadSchema = Joi.object({
  url: Joi.string().uri().required(),
});

// Manual scraping trigger
router.post('/scrape',
  validateSchema(scrapingOptionsSchema),
  requirePermission(['regulations:write', 'admin', 'scraper:execute']),
  businessOperationLogger('manual_scraping'),
  scraperController.scrapeCirculars
);

// Get scraping status and statistics
router.get('/status',
  requirePermission(['regulations:read', 'admin', 'scraper:read']),
  businessOperationLogger('get_scraping_status'),
  scraperController.getScrapingStatus
);

// Download specific circular content
router.post('/download',
  validateSchema(downloadSchema),
  requirePermission(['regulations:read', 'admin', 'scraper:read']),
  businessOperationLogger('download_circular'),
  scraperController.downloadCircular
);

// Test scraping connectivity
router.get('/test',
  requirePermission(['regulations:read', 'admin', 'scraper:read']),
  businessOperationLogger('test_scraping_connectivity'),
  scraperController.testConnectivity
);

// Reset scraping statistics
router.post('/reset-stats',
  requirePermission(['admin', 'scraper:admin']),
  businessOperationLogger('reset_scraping_stats'),
  scraperController.resetStats
);

export default router;
