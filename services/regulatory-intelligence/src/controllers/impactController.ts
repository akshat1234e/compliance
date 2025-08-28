/**
 * Impact Assessment Controller for Regulatory Intelligence Service
 * Handles HTTP requests for regulatory impact assessment operations
 */

import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { logger, loggers } from '@utils/logger';
import ImpactAssessmentService, { ImpactAssessmentRequest, OrganizationProfile } from '@services/impactAssessmentService';
import CircularParserService from '@services/circularParserService';

export class ImpactController {
  private impactService: ImpactAssessmentService;
  private parserService: CircularParserService;

  constructor() {
    this.impactService = new ImpactAssessmentService();
    this.parserService = new CircularParserService();
  }

  /**
   * Assess regulatory impact on an organization
   */
  public assessImpact = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const {
      circularId,
      organizationId,
      organizationType,
      organizationProfile,
      analysisType = 'basic',
      includeRecommendations = true,
      includeTimeline = true,
      includeCostEstimate = false,
      circularContent
    } = req.body;

    if (!circularId || !organizationId || !organizationType || !organizationProfile) {
      return res.status(400).json({
        success: false,
        error: 'circularId, organizationId, organizationType, and organizationProfile are required',
        timestamp: new Date().toISOString(),
      });
    }

    logger.info('Impact assessment initiated', {
      circularId,
      organizationId,
      organizationType,
      analysisType,
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
          {}
        );
      }

      // Prepare assessment request
      const assessmentRequest: ImpactAssessmentRequest = {
        circularId,
        organizationId,
        organizationType,
        organizationProfile,
        analysisType,
        includeRecommendations,
        includeTimeline,
        includeCostEstimate,
      };

      // Perform impact assessment
      const assessment = await this.impactService.assessImpact(
        assessmentRequest,
        parsedCircular
      );

      const duration = Date.now() - startTime;

      // Log business operation
      loggers.business('impact_assessment', {
        requestId: req.requestId,
        userId: req.user?.id,
        circularId,
        organizationId,
        analysisType,
        overallImpact: assessment.overallImpact.level,
        confidence: assessment.confidence,
        duration: `${duration}ms`,
        success: true,
      });

      // Return results
      res.json({
        success: true,
        data: assessment,
        metadata: {
          processingDuration: `${duration}ms`,
          requestId: req.requestId,
          assessedBy: req.user?.email,
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      
      loggers.business('impact_assessment', {
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
   * Get impact assessment by ID
   */
  public getAssessment = asyncHandler(async (req: Request, res: Response) => {
    const { assessmentId } = req.params;

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        error: 'assessmentId is required',
        timestamp: new Date().toISOString(),
      });
    }

    logger.info('Impact assessment retrieval requested', {
      assessmentId,
      userId: req.user?.id,
      requestId: req.requestId,
    });

    try {
      // Try to get from cache first
      const assessment = this.impactService.getCachedAssessment(assessmentId);

      if (!assessment) {
        return res.status(404).json({
          success: false,
          error: 'Assessment not found',
          timestamp: new Date().toISOString(),
        });
      }

      // TODO: In production, also check database for persistent storage

      loggers.business('get_impact_assessment', {
        requestId: req.requestId,
        userId: req.user?.id,
        assessmentId,
        success: true,
      });

      res.json({
        success: true,
        data: assessment,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      loggers.business('get_impact_assessment', {
        requestId: req.requestId,
        userId: req.user?.id,
        assessmentId,
        success: false,
        error: (error as Error).message,
      }, error as Error);

      throw error;
    }
  });

  /**
   * Get impact summary for an organization
   */
  public getOrganizationSummary = asyncHandler(async (req: Request, res: Response) => {
    const { organizationId } = req.params;
    const { timeframe = '30d' } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'organizationId is required',
        timestamp: new Date().toISOString(),
      });
    }

    logger.info('Organization impact summary requested', {
      organizationId,
      timeframe,
      userId: req.user?.id,
      requestId: req.requestId,
    });

    try {
      // TODO: Implement actual summary generation from database
      // For now, return mock data
      const mockSummary = {
        organizationId,
        timeframe,
        totalAssessments: 15,
        averageImpact: 6.2,
        impactDistribution: {
          critical: 2,
          high: 5,
          medium: 6,
          low: 2,
        },
        topImpactAreas: [
          { area: 'Capital Management', averageImpact: 7.8, assessmentCount: 8 },
          { area: 'Risk Management', averageImpact: 6.5, assessmentCount: 12 },
          { area: 'Compliance Operations', averageImpact: 5.9, assessmentCount: 10 },
        ],
        recentAssessments: [
          {
            id: 'assessment_001',
            circularId: 'RBI/2024/001',
            circularTitle: 'Capital Adequacy Guidelines',
            impactLevel: 'high',
            assessedAt: '2024-01-15T10:00:00Z',
          },
          {
            id: 'assessment_002',
            circularId: 'RBI/2024/002',
            circularTitle: 'KYC Requirements Update',
            impactLevel: 'medium',
            assessedAt: '2024-01-14T15:30:00Z',
          },
        ],
        upcomingDeadlines: [
          {
            circularId: 'RBI/2024/001',
            description: 'Implementation of new capital adequacy framework',
            deadline: '2024-06-30',
            daysRemaining: 165,
            status: 'in_progress',
          },
        ],
        riskMetrics: {
          overallRisk: 'medium',
          complianceRisk: 'high',
          operationalRisk: 'medium',
          financialRisk: 'medium',
          reputationalRisk: 'low',
        },
        trends: {
          impactTrend: 'increasing',
          assessmentFrequency: 'stable',
          complianceMaturity: 'improving',
        },
        lastUpdated: new Date().toISOString(),
      };

      loggers.business('get_organization_summary', {
        requestId: req.requestId,
        userId: req.user?.id,
        organizationId,
        timeframe,
        success: true,
      });

      res.json({
        success: true,
        data: mockSummary,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      loggers.business('get_organization_summary', {
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
   * Compare impact assessments
   */
  public compareAssessments = asyncHandler(async (req: Request, res: Response) => {
    const { assessmentIds } = req.body;

    if (!Array.isArray(assessmentIds) || assessmentIds.length < 2 || assessmentIds.length > 5) {
      return res.status(400).json({
        success: false,
        error: 'assessmentIds must be an array with 2-5 assessment IDs',
        timestamp: new Date().toISOString(),
      });
    }

    logger.info('Assessment comparison requested', {
      assessmentIds,
      userId: req.user?.id,
      requestId: req.requestId,
    });

    try {
      // Get assessments from cache
      const assessments = assessmentIds
        .map(id => this.impactService.getCachedAssessment(id))
        .filter(assessment => assessment !== undefined);

      if (assessments.length !== assessmentIds.length) {
        return res.status(404).json({
          success: false,
          error: 'One or more assessments not found',
          timestamp: new Date().toISOString(),
        });
      }

      // Generate comparison
      const comparison = {
        assessments: assessments.map(assessment => ({
          id: assessment!.id,
          circularId: assessment!.circularId,
          organizationId: assessment!.organizationId,
          overallImpact: assessment!.overallImpact,
          assessedAt: assessment!.assessedAt,
        })),
        comparison: {
          averageImpact: assessments.reduce((sum, a) => sum + a!.overallImpact.overall, 0) / assessments.length,
          impactRange: {
            min: Math.min(...assessments.map(a => a!.overallImpact.overall)),
            max: Math.max(...assessments.map(a => a!.overallImpact.overall)),
          },
          commonImpactAreas: this.findCommonImpactAreas(assessments),
          riskComparison: this.compareRisks(assessments),
          recommendationSummary: this.summarizeRecommendations(assessments),
        },
        insights: [
          'Capital Management shows consistently high impact across assessments',
          'Organizations with higher compliance maturity show lower implementation effort',
          'Technology upgrades are common requirements across multiple circulars',
        ],
      };

      loggers.business('compare_assessments', {
        requestId: req.requestId,
        userId: req.user?.id,
        assessmentCount: assessments.length,
        success: true,
      });

      res.json({
        success: true,
        data: comparison,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      loggers.business('compare_assessments', {
        requestId: req.requestId,
        userId: req.user?.id,
        assessmentIds,
        success: false,
        error: (error as Error).message,
      }, error as Error);

      throw error;
    }
  });

  /**
   * Clear assessment cache
   */
  public clearCache = asyncHandler(async (req: Request, res: Response) => {
    logger.info('Assessment cache clear requested', {
      userId: req.user?.id,
      requestId: req.requestId,
    });

    try {
      this.impactService.clearCache();

      loggers.business('clear_assessment_cache', {
        requestId: req.requestId,
        userId: req.user?.id,
        success: true,
      });

      res.json({
        success: true,
        message: 'Assessment cache cleared successfully',
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      loggers.business('clear_assessment_cache', {
        requestId: req.requestId,
        userId: req.user?.id,
        success: false,
        error: (error as Error).message,
      }, error as Error);

      throw error;
    }
  });

  // Helper methods
  private findCommonImpactAreas(assessments: any[]): string[] {
    const allAreas = assessments.flatMap(a => a.impactAreas.map((area: any) => area.area));
    const areaCounts = allAreas.reduce((counts, area) => {
      counts[area] = (counts[area] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    return Object.entries(areaCounts)
      .filter(([, count]) => count > 1)
      .map(([area]) => area);
  }

  private compareRisks(assessments: any[]): any {
    const riskLevels = assessments.map(a => a.riskAssessment.overallRisk);
    const riskCounts = riskLevels.reduce((counts, risk) => {
      counts[risk] = (counts[risk] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    return {
      distribution: riskCounts,
      mostCommon: Object.entries(riskCounts).sort(([,a], [,b]) => b - a)[0][0],
    };
  }

  private summarizeRecommendations(assessments: any[]): any {
    const allRecommendations = assessments.flatMap(a => a.recommendations);
    const categories = allRecommendations.reduce((cats, rec) => {
      cats[rec.category] = (cats[rec.category] || 0) + 1;
      return cats;
    }, {} as Record<string, number>);

    return {
      totalRecommendations: allRecommendations.length,
      byCategory: categories,
      commonThemes: ['Policy updates', 'Staff training', 'System enhancements'],
    };
  }
}

export default ImpactController;
