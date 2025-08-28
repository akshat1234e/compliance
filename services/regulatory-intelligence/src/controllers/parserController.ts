/**
 * Parser Controller for Regulatory Intelligence Service
 * Handles HTTP requests for circular parsing operations
 */

import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { logger, loggers } from '@utils/logger';
import CircularParserService from '@services/circularParserService';

export class ParserController {
  private parserService: CircularParserService;

  constructor() {
    this.parserService = new CircularParserService();
  }

  /**
   * Parse a circular and extract structured data
   */
  public parseCircular = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { circularId, content, metadata } = req.body;

    if (!circularId || !content) {
      return res.status(400).json({
        success: false,
        error: 'circularId and content are required',
        timestamp: new Date().toISOString(),
      });
    }

    logger.info('Circular parsing initiated', {
      circularId,
      contentLength: content.length,
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      requestId: req.requestId,
    });

    try {
      // Parse the circular
      const result = await this.parserService.parseCircular(
        circularId,
        content,
        metadata || {}
      );

      const duration = Date.now() - startTime;

      // Log business operation
      loggers.business('circular_parsing', {
        requestId: req.requestId,
        userId: req.user?.id,
        circularId,
        contentLength: content.length,
        confidence: result.confidence,
        duration: `${duration}ms`,
        success: true,
      });

      // Return results
      res.json({
        success: true,
        data: result,
        metadata: {
          processingDuration: `${duration}ms`,
          requestId: req.requestId,
          processedBy: req.user?.email,
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      
      loggers.business('circular_parsing', {
        requestId: req.requestId,
        userId: req.user?.id,
        circularId,
        contentLength: content.length,
        duration: `${duration}ms`,
        success: false,
        error: (error as Error).message,
      }, error as Error);

      throw error;
    }
  });

  /**
   * Parse multiple circulars in batch
   */
  public parseCircularsBatch = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { circulars } = req.body;

    if (!Array.isArray(circulars) || circulars.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'circulars array is required and must not be empty',
        timestamp: new Date().toISOString(),
      });
    }

    if (circulars.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 circulars can be processed in a single batch',
        timestamp: new Date().toISOString(),
      });
    }

    logger.info('Batch circular parsing initiated', {
      batchSize: circulars.length,
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      requestId: req.requestId,
    });

    try {
      const results = [];
      const errors = [];

      // Process each circular
      for (const circular of circulars) {
        try {
          const result = await this.parserService.parseCircular(
            circular.circularId,
            circular.content,
            circular.metadata || {}
          );
          results.push(result);
        } catch (error) {
          errors.push({
            circularId: circular.circularId,
            error: (error as Error).message,
          });
        }
      }

      const duration = Date.now() - startTime;

      // Log business operation
      loggers.business('batch_circular_parsing', {
        requestId: req.requestId,
        userId: req.user?.id,
        batchSize: circulars.length,
        successCount: results.length,
        errorCount: errors.length,
        duration: `${duration}ms`,
        success: errors.length === 0,
      });

      // Return results
      res.json({
        success: true,
        data: {
          results,
          errors,
          summary: {
            total: circulars.length,
            successful: results.length,
            failed: errors.length,
          },
        },
        metadata: {
          processingDuration: `${duration}ms`,
          requestId: req.requestId,
          processedBy: req.user?.email,
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      
      loggers.business('batch_circular_parsing', {
        requestId: req.requestId,
        userId: req.user?.id,
        batchSize: circulars.length,
        duration: `${duration}ms`,
        success: false,
        error: (error as Error).message,
      }, error as Error);

      throw error;
    }
  });

  /**
   * Extract specific elements from circular content
   */
  public extractElements = asyncHandler(async (req: Request, res: Response) => {
    const { content, elements } = req.body;

    if (!content || !elements || !Array.isArray(elements)) {
      return res.status(400).json({
        success: false,
        error: 'content and elements array are required',
        timestamp: new Date().toISOString(),
      });
    }

    const validElements = [
      'summary', 'keyPoints', 'requirements', 'deadlines', 
      'references', 'definitions', 'entities', 'keywords'
    ];

    const invalidElements = elements.filter(el => !validElements.includes(el));
    if (invalidElements.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid elements: ${invalidElements.join(', ')}`,
        validElements,
        timestamp: new Date().toISOString(),
      });
    }

    logger.info('Element extraction requested', {
      contentLength: content.length,
      elements,
      userId: req.user?.id,
      requestId: req.requestId,
    });

    try {
      // Parse the circular to get all elements
      const parsed = await this.parserService.parseCircular(
        'temp_' + Date.now(),
        content,
        {}
      );

      // Extract only requested elements
      const extractedElements: any = {};
      
      elements.forEach((element: string) => {
        switch (element) {
          case 'summary':
            extractedElements.summary = parsed.content.summary;
            break;
          case 'keyPoints':
            extractedElements.keyPoints = parsed.content.keyPoints;
            break;
          case 'requirements':
            extractedElements.requirements = parsed.content.requirements;
            break;
          case 'deadlines':
            extractedElements.deadlines = parsed.content.deadlines;
            break;
          case 'references':
            extractedElements.references = parsed.content.references;
            break;
          case 'definitions':
            extractedElements.definitions = parsed.content.definitions;
            break;
          case 'entities':
            extractedElements.entities = parsed.analysis.entities;
            break;
          case 'keywords':
            extractedElements.keywords = parsed.analysis.keywords;
            break;
        }
      });

      loggers.business('element_extraction', {
        requestId: req.requestId,
        userId: req.user?.id,
        contentLength: content.length,
        elements,
        confidence: parsed.confidence,
        success: true,
      });

      res.json({
        success: true,
        data: extractedElements,
        metadata: {
          confidence: parsed.confidence,
          processingTime: parsed.processingTime,
          requestId: req.requestId,
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      loggers.business('element_extraction', {
        requestId: req.requestId,
        userId: req.user?.id,
        contentLength: content.length,
        elements,
        success: false,
        error: (error as Error).message,
      }, error as Error);

      throw error;
    }
  });

  /**
   * Analyze circular content for sentiment, complexity, etc.
   */
  public analyzeContent = asyncHandler(async (req: Request, res: Response) => {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'content is required',
        timestamp: new Date().toISOString(),
      });
    }

    logger.info('Content analysis requested', {
      contentLength: content.length,
      userId: req.user?.id,
      requestId: req.requestId,
    });

    try {
      // Parse the circular to get analysis
      const parsed = await this.parserService.parseCircular(
        'analysis_' + Date.now(),
        content,
        {}
      );

      loggers.business('content_analysis', {
        requestId: req.requestId,
        userId: req.user?.id,
        contentLength: content.length,
        confidence: parsed.confidence,
        success: true,
      });

      res.json({
        success: true,
        data: {
          analysis: parsed.analysis,
          metadata: {
            category: parsed.metadata.category,
            impactLevel: parsed.metadata.impactLevel,
            affectedEntities: parsed.metadata.affectedEntities,
          },
        },
        metadata: {
          confidence: parsed.confidence,
          processingTime: parsed.processingTime,
          requestId: req.requestId,
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      loggers.business('content_analysis', {
        requestId: req.requestId,
        userId: req.user?.id,
        contentLength: content.length,
        success: false,
        error: (error as Error).message,
      }, error as Error);

      throw error;
    }
  });
}

export default ParserController;
