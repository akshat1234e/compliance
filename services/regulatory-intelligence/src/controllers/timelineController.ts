/**
 * Timeline Controller for Regulatory Intelligence Service
 * Handles HTTP requests for timeline mapping operations
 */

import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { logger, loggers } from '@utils/logger';
import TimelineMapperService, { TimelineGenerationOptions, CustomDeadline } from '@services/timelineMapperService';
import CircularParserService from '@services/circularParserService';

export class TimelineController {
  private timelineService: TimelineMapperService;
  private parserService: CircularParserService;

  constructor() {
    this.timelineService = new TimelineMapperService();
    this.parserService = new CircularParserService();
  }

  /**
   * Generate timeline mapping for a regulatory circular
   */
  public generateTimeline = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const {
      circularId,
      circularContent,
      circularMetadata,
      organizationId,
      organizationType,
      organizationSize = 'medium',
      complianceMaturity = 5,
      includeBufferTime = true,
      bufferPercentage = 10,
      includeRiskAssessment = true,
      customDeadlines
    } = req.body;

    if (!circularId || !organizationType) {
      return res.status(400).json({
        success: false,
        error: 'circularId and organizationType are required',
        timestamp: new Date().toISOString(),
      });
    }

    logger.info('Timeline generation requested', {
      circularId,
      organizationId,
      organizationType,
      organizationSize,
      userId: req.user?.id,
      requestId: req.requestId,
    });

    try {
      // Parse circular content if provided
      let parsedCircular;
      if (circularContent) {
        parsedCircular = await this.parserService.parseCircular(
          circularId,
          circularContent,
          circularMetadata || {}
        );
      } else {
        // TODO: Fetch parsed circular from database
        throw new Error('Circular content or parsed circular data is required');
      }

      // Prepare generation options
      const options: TimelineGenerationOptions = {
        organizationType,
        organizationSize,
        complianceMaturity,
        includeBufferTime,
        bufferPercentage,
        includeRiskAssessment,
        customDeadlines: customDeadlines?.map((cd: any) => ({
          type: cd.type,
          description: cd.description,
          date: new Date(cd.date),
          priority: cd.priority,
        })) as CustomDeadline[],
      };

      // Generate timeline mapping
      const timelineMapping = await this.timelineService.generateTimeline(
        circularId,
        parsedCircular,
        options,
        organizationId
      );

      const duration = Date.now() - startTime;

      loggers.business('timeline_generation', {
        requestId: req.requestId,
        userId: req.user?.id,
        circularId,
        organizationId,
        timelineId: timelineMapping.id,
        eventCount: timelineMapping.timeline.length,
        milestoneCount: timelineMapping.keyMilestones.length,
        totalDuration: timelineMapping.totalDuration,
        duration: `${duration}ms`,
        success: true,
      });

      res.json({
        success: true,
        data: timelineMapping,
        metadata: {
          processingDuration: `${duration}ms`,
          requestId: req.requestId,
          generatedBy: req.user?.email,
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      
      loggers.business('timeline_generation', {
        requestId: req.requestId,
        userId: req.user?.id,
        circularId,
        organizationId,
        duration: `${duration}ms`,
        success: false,
        error: (error as Error).message,
      }, error as Error);

      throw error;
    }
  });

  /**
   * Get timeline mapping by ID
   */
  public getTimeline = asyncHandler(async (req: Request, res: Response) => {
    const { timelineId } = req.params;

    if (!timelineId) {
      return res.status(400).json({
        success: false,
        error: 'timelineId is required',
        timestamp: new Date().toISOString(),
      });
    }

    logger.info('Timeline retrieval requested', {
      timelineId,
      userId: req.user?.id,
      requestId: req.requestId,
    });

    try {
      const timelineMapping = this.timelineService.getTimelineMapping(timelineId);

      if (!timelineMapping) {
        return res.status(404).json({
          success: false,
          error: 'Timeline mapping not found',
          timestamp: new Date().toISOString(),
        });
      }

      loggers.business('get_timeline', {
        requestId: req.requestId,
        userId: req.user?.id,
        timelineId,
        success: true,
      });

      res.json({
        success: true,
        data: timelineMapping,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      loggers.business('get_timeline', {
        requestId: req.requestId,
        userId: req.user?.id,
        timelineId,
        success: false,
        error: (error as Error).message,
      }, error as Error);

      throw error;
    }
  });

  /**
   * Update timeline event status
   */
  public updateEventStatus = asyncHandler(async (req: Request, res: Response) => {
    const { timelineId, eventId } = req.params;
    const { status, progress } = req.body;

    if (!timelineId || !eventId || !status) {
      return res.status(400).json({
        success: false,
        error: 'timelineId, eventId, and status are required',
        timestamp: new Date().toISOString(),
      });
    }

    const validStatuses = ['upcoming', 'in_progress', 'completed', 'overdue', 'cancelled', 'postponed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        timestamp: new Date().toISOString(),
      });
    }

    logger.info('Timeline event status update requested', {
      timelineId,
      eventId,
      status,
      progress,
      userId: req.user?.id,
      requestId: req.requestId,
    });

    try {
      const updated = this.timelineService.updateEventStatus(timelineId, eventId, status, progress);

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Timeline or event not found',
          timestamp: new Date().toISOString(),
        });
      }

      loggers.business('update_event_status', {
        requestId: req.requestId,
        userId: req.user?.id,
        timelineId,
        eventId,
        status,
        progress,
        success: true,
      });

      res.json({
        success: true,
        message: 'Event status updated successfully',
        data: {
          timelineId,
          eventId,
          status,
          progress,
          updatedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      loggers.business('update_event_status', {
        requestId: req.requestId,
        userId: req.user?.id,
        timelineId,
        eventId,
        success: false,
        error: (error as Error).message,
      }, error as Error);

      throw error;
    }
  });

  /**
   * Get timeline statistics
   */
  public getTimelineStats = asyncHandler(async (req: Request, res: Response) => {
    logger.info('Timeline statistics requested', {
      userId: req.user?.id,
      requestId: req.requestId,
    });

    try {
      const stats = this.timelineService.getTimelineStats();

      loggers.business('get_timeline_stats', {
        requestId: req.requestId,
        userId: req.user?.id,
        success: true,
      });

      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      loggers.business('get_timeline_stats', {
        requestId: req.requestId,
        userId: req.user?.id,
        success: false,
        error: (error as Error).message,
      }, error as Error);

      throw error;
    }
  });

  /**
   * Get organization timeline overview
   */
  public getOrganizationTimeline = asyncHandler(async (req: Request, res: Response) => {
    const { organizationId } = req.params;
    const { timeframe = '90d', status } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'organizationId is required',
        timestamp: new Date().toISOString(),
      });
    }

    logger.info('Organization timeline overview requested', {
      organizationId,
      timeframe,
      status,
      userId: req.user?.id,
      requestId: req.requestId,
    });

    try {
      // TODO: Implement actual organization timeline aggregation
      // For now, return mock data
      const mockOverview = {
        organizationId,
        timeframe,
        summary: {
          totalEvents: 45,
          upcomingEvents: 12,
          inProgressEvents: 8,
          completedEvents: 20,
          overdueEvents: 5,
        },
        upcomingDeadlines: [
          {
            eventId: 'event_001',
            title: 'Capital Adequacy Report Submission',
            date: '2024-02-15',
            daysRemaining: 25,
            priority: 'high',
            status: 'upcoming',
          },
          {
            eventId: 'event_002',
            title: 'Risk Assessment Update',
            date: '2024-02-28',
            daysRemaining: 38,
            priority: 'medium',
            status: 'upcoming',
          },
        ],
        criticalPath: [
          {
            eventId: 'event_003',
            title: 'System Implementation Phase 1',
            date: '2024-01-30',
            status: 'in_progress',
            progress: 65,
          },
          {
            eventId: 'event_004',
            title: 'Compliance Testing',
            date: '2024-02-10',
            status: 'upcoming',
            dependencies: ['event_003'],
          },
        ],
        riskAlerts: [
          {
            type: 'schedule',
            description: 'Multiple high-priority events scheduled in same week',
            severity: 'medium',
            affectedEvents: ['event_001', 'event_005'],
          },
        ],
        recommendations: [
          {
            type: 'resource',
            title: 'Allocate Additional Resources',
            description: 'Consider additional resources for upcoming critical events',
            priority: 'medium',
          },
        ],
        lastUpdated: new Date().toISOString(),
      };

      loggers.business('get_organization_timeline', {
        requestId: req.requestId,
        userId: req.user?.id,
        organizationId,
        timeframe,
        success: true,
      });

      res.json({
        success: true,
        data: mockOverview,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      loggers.business('get_organization_timeline', {
        requestId: req.requestId,
        userId: req.user?.id,
        organizationId,
        success: false,
        error: (error as Error).message,
      }, error as Error);

      throw error;
    }
  });

  /**
   * Clear timeline cache
   */
  public clearCache = asyncHandler(async (req: Request, res: Response) => {
    logger.info('Timeline cache clear requested', {
      userId: req.user?.id,
      requestId: req.requestId,
    });

    try {
      this.timelineService.clearCache();

      loggers.business('clear_timeline_cache', {
        requestId: req.requestId,
        userId: req.user?.id,
        success: true,
      });

      res.json({
        success: true,
        message: 'Timeline cache cleared successfully',
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      loggers.business('clear_timeline_cache', {
        requestId: req.requestId,
        userId: req.user?.id,
        success: false,
        error: (error as Error).message,
      }, error as Error);

      throw error;
    }
  });
}

export default TimelineController;
