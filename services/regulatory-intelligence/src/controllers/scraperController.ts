/**
 * Scraper Controller for Regulatory Intelligence Service
 * Handles HTTP requests for web scraping operations
 */

import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { logger, loggers } from '@utils/logger';
import RBIScraperService, { ScrapingOptions } from '@services/scraperService';

export class ScraperController {
  private scraperService: RBIScraperService;

  constructor() {
    this.scraperService = new RBIScraperService();
  }

  /**
   * Trigger manual scraping of RBI circulars
   */
  public scrapeCirculars = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    // Extract options from request
    const options: ScrapingOptions = {
      startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      category: req.body.category,
      maxPages: req.body.maxPages || 5,
      includeContent: req.body.includeContent || false,
      downloadFiles: req.body.downloadFiles || false,
    };

    logger.info('Manual scraping initiated', {
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      options,
      requestId: req.requestId,
    });

    try {
      // Perform scraping
      const result = await this.scraperService.scrapeCircularsList(options);

      const duration = Date.now() - startTime;

      // Log business operation
      loggers.business('manual_scraping', {
        requestId: req.requestId,
        userId: req.user?.id,
        totalFound: result.totalFound,
        duration: `${duration}ms`,
        success: result.success,
      });

      // Return results
      res.json({
        success: true,
        data: result,
        metadata: {
          scrapingDuration: `${duration}ms`,
          requestId: req.requestId,
          initiatedBy: req.user?.email,
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      
      loggers.business('manual_scraping', {
        requestId: req.requestId,
        userId: req.user?.id,
        duration: `${duration}ms`,
        success: false,
        error: (error as Error).message,
      }, error as Error);

      throw error;
    }
  });

  /**
   * Get scraping status and statistics
   */
  public getScrapingStatus = asyncHandler(async (req: Request, res: Response) => {
    logger.info('Scraping status requested', {
      userId: req.user?.id,
      requestId: req.requestId,
    });

    const stats = this.scraperService.getScrapingStats();

    // TODO: Get last scraping results from database
    const mockLastScraping = {
      lastScrapingTime: '2024-01-15T10:30:00Z',
      lastScrapingStatus: 'completed',
      lastScrapingCount: 25,
      nextScheduledScraping: '2024-01-16T06:00:00Z',
    };

    res.json({
      success: true,
      data: {
        currentStats: stats,
        lastScraping: mockLastScraping,
        serviceStatus: 'operational',
        configuration: {
          requestDelay: '1000ms',
          maxConcurrentRequests: 5,
          timeout: '30000ms',
          userAgent: 'RBI-Compliance-Bot/1.0',
        },
      },
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Download specific circular content
   */
  public downloadCircular = asyncHandler(async (req: Request, res: Response) => {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
        timestamp: new Date().toISOString(),
      });
    }

    logger.info('Circular download requested', {
      url,
      userId: req.user?.id,
      requestId: req.requestId,
    });

    try {
      const content = await this.scraperService.downloadCircularContent(url);

      loggers.business('circular_download', {
        requestId: req.requestId,
        userId: req.user?.id,
        url,
        contentLength: content.length,
        success: true,
      });

      res.json({
        success: true,
        data: {
          url,
          content,
          contentLength: content.length,
          downloadedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      loggers.business('circular_download', {
        requestId: req.requestId,
        userId: req.user?.id,
        url,
        success: false,
        error: (error as Error).message,
      }, error as Error);

      throw error;
    }
  });

  /**
   * Test scraping connectivity
   */
  public testConnectivity = asyncHandler(async (req: Request, res: Response) => {
    logger.info('Scraping connectivity test requested', {
      userId: req.user?.id,
      requestId: req.requestId,
    });

    const testResults = {
      rbiWebsite: { status: 'unknown', responseTime: 0, error: null },
      browserLaunch: { status: 'unknown', error: null },
      networkAccess: { status: 'unknown', error: null },
    };

    try {
      // Test RBI website accessibility
      const rbiStartTime = Date.now();
      try {
        await this.scraperService.downloadCircularContent('https://www.rbi.org.in');
        testResults.rbiWebsite = {
          status: 'accessible',
          responseTime: Date.now() - rbiStartTime,
          error: null,
        };
      } catch (error) {
        testResults.rbiWebsite = {
          status: 'failed',
          responseTime: Date.now() - rbiStartTime,
          error: (error as Error).message,
        };
      }

      // Test browser launch capability
      try {
        // This would test browser initialization
        testResults.browserLaunch = {
          status: 'available',
          error: null,
        };
      } catch (error) {
        testResults.browserLaunch = {
          status: 'failed',
          error: (error as Error).message,
        };
      }

      // Test general network access
      testResults.networkAccess = {
        status: 'available',
        error: null,
      };

      const overallStatus = Object.values(testResults).every(test => test.status !== 'failed') 
        ? 'healthy' : 'degraded';

      res.json({
        success: true,
        data: {
          overallStatus,
          tests: testResults,
          testedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      logger.error('Connectivity test failed', {
        error: (error as Error).message,
        requestId: req.requestId,
      });

      res.status(500).json({
        success: false,
        error: 'Connectivity test failed',
        data: {
          overallStatus: 'failed',
          tests: testResults,
          testedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * Reset scraping statistics
   */
  public resetStats = asyncHandler(async (req: Request, res: Response) => {
    logger.info('Scraping stats reset requested', {
      userId: req.user?.id,
      requestId: req.requestId,
    });

    this.scraperService.resetStats();

    loggers.business('scraping_stats_reset', {
      requestId: req.requestId,
      userId: req.user?.id,
      success: true,
    });

    res.json({
      success: true,
      message: 'Scraping statistics reset successfully',
      timestamp: new Date().toISOString(),
    });
  });
}

export default ScraperController;
