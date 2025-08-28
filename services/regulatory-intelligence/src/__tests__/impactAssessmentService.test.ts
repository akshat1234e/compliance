/**
 * Tests for Impact Assessment Service
 */

import ImpactAssessmentService, { ImpactAssessmentRequest, OrganizationProfile } from '../services/impactAssessmentService';

describe('ImpactAssessmentService', () => {
  let impactService: ImpactAssessmentService;

  beforeEach(() => {
    impactService = new ImpactAssessmentService();
  });

  afterEach(() => {
    impactService.clearCache();
  });

  describe('constructor', () => {
    it('should create an instance of ImpactAssessmentService', () => {
      expect(impactService).toBeInstanceOf(ImpactAssessmentService);
    });
  });

  describe('assessImpact', () => {
    const mockOrganizationProfile: OrganizationProfile = {
      id: 'org-123',
      name: 'Test Bank',
      type: 'bank',
      size: 'large',
      assetSize: 1000000000,
      customerBase: 500000,
      geographicPresence: ['Mumbai', 'Delhi', 'Bangalore'],
      businessLines: ['Retail Banking', 'Corporate Banking'],
      currentComplianceMaturity: 7,
      riskAppetite: 'moderate',
      technologyMaturity: 6,
      complianceTeamSize: 25,
      previousViolations: 2,
      lastAuditScore: 85,
    };

    const mockRequest: ImpactAssessmentRequest = {
      circularId: 'RBI/2024/001',
      organizationId: 'org-123',
      organizationType: 'bank',
      organizationProfile: mockOrganizationProfile,
      analysisType: 'comprehensive',
      includeRecommendations: true,
      includeTimeline: true,
      includeCostEstimate: true,
    };

    it('should perform impact assessment successfully', async () => {
      const result = await impactService.assessImpact(mockRequest);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('circularId', mockRequest.circularId);
      expect(result).toHaveProperty('organizationId', mockRequest.organizationId);
      expect(result).toHaveProperty('assessmentType', mockRequest.analysisType);
      expect(result).toHaveProperty('overallImpact');
      expect(result).toHaveProperty('impactAreas');
      expect(result).toHaveProperty('timeline');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('riskAssessment');
      expect(result).toHaveProperty('costEstimate');
      expect(result).toHaveProperty('complianceGap');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('assessedAt');
      expect(result).toHaveProperty('validUntil');

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should calculate overall impact correctly', async () => {
      const result = await impactService.assessImpact(mockRequest);

      expect(result.overallImpact).toHaveProperty('overall');
      expect(result.overallImpact).toHaveProperty('level');
      expect(result.overallImpact).toHaveProperty('factors');
      expect(result.overallImpact).toHaveProperty('reasoning');

      expect(result.overallImpact.overall).toBeGreaterThan(0);
      expect(result.overallImpact.overall).toBeLessThanOrEqual(10);

      expect(['minimal', 'low', 'medium', 'high', 'critical']).toContain(result.overallImpact.level);

      expect(result.overallImpact.factors).toHaveProperty('operational');
      expect(result.overallImpact.factors).toHaveProperty('financial');
      expect(result.overallImpact.factors).toHaveProperty('regulatory');
      expect(result.overallImpact.factors).toHaveProperty('reputational');
      expect(result.overallImpact.factors).toHaveProperty('strategic');
    });

    it('should analyze impact areas', async () => {
      const result = await impactService.assessImpact(mockRequest);

      expect(Array.isArray(result.impactAreas)).toBe(true);
      
      if (result.impactAreas.length > 0) {
        const area = result.impactAreas[0];
        expect(area).toHaveProperty('area');
        expect(area).toHaveProperty('impactScore');
        expect(area).toHaveProperty('description');
        expect(area).toHaveProperty('affectedProcesses');
        expect(area).toHaveProperty('requiredChanges');
        expect(area).toHaveProperty('estimatedEffort');
        expect(area).toHaveProperty('priority');
        expect(area).toHaveProperty('dependencies');

        expect(area.impactScore).toBeGreaterThan(0);
        expect(area.impactScore).toBeLessThanOrEqual(10);
        expect(['low', 'medium', 'high', 'critical']).toContain(area.priority);
      }
    });

    it('should generate implementation timeline', async () => {
      const result = await impactService.assessImpact(mockRequest);

      expect(result.timeline).toHaveProperty('phases');
      expect(result.timeline).toHaveProperty('totalDuration');
      expect(result.timeline).toHaveProperty('criticalPath');
      expect(result.timeline).toHaveProperty('milestones');
      expect(result.timeline).toHaveProperty('dependencies');

      expect(Array.isArray(result.timeline.phases)).toBe(true);
      expect(Array.isArray(result.timeline.criticalPath)).toBe(true);
      expect(Array.isArray(result.timeline.milestones)).toBe(true);
      expect(Array.isArray(result.timeline.dependencies)).toBe(true);

      if (result.timeline.phases.length > 0) {
        const phase = result.timeline.phases[0];
        expect(phase).toHaveProperty('phase');
        expect(phase).toHaveProperty('description');
        expect(phase).toHaveProperty('duration');
        expect(phase).toHaveProperty('deliverables');
        expect(phase).toHaveProperty('resources');
        expect(phase).toHaveProperty('risks');
      }
    });

    it('should generate recommendations when requested', async () => {
      const result = await impactService.assessImpact(mockRequest);

      expect(Array.isArray(result.recommendations)).toBe(true);

      if (result.recommendations.length > 0) {
        const recommendation = result.recommendations[0];
        expect(recommendation).toHaveProperty('id');
        expect(recommendation).toHaveProperty('category');
        expect(recommendation).toHaveProperty('priority');
        expect(recommendation).toHaveProperty('title');
        expect(recommendation).toHaveProperty('description');
        expect(recommendation).toHaveProperty('rationale');
        expect(recommendation).toHaveProperty('estimatedEffort');
        expect(recommendation).toHaveProperty('owner');
        expect(recommendation).toHaveProperty('timeline');
        expect(recommendation).toHaveProperty('dependencies');
        expect(recommendation).toHaveProperty('risks');
        expect(recommendation).toHaveProperty('benefits');

        expect(['immediate', 'short_term', 'medium_term', 'long_term']).toContain(recommendation.category);
        expect(['low', 'medium', 'high', 'critical']).toContain(recommendation.priority);
      }
    });

    it('should assess risks', async () => {
      const result = await impactService.assessImpact(mockRequest);

      expect(result.riskAssessment).toHaveProperty('overallRisk');
      expect(result.riskAssessment).toHaveProperty('riskFactors');
      expect(result.riskAssessment).toHaveProperty('mitigationStrategies');
      expect(result.riskAssessment).toHaveProperty('residualRisk');
      expect(result.riskAssessment).toHaveProperty('monitoringRequirements');

      expect(['low', 'medium', 'high', 'critical']).toContain(result.riskAssessment.overallRisk);
      expect(Array.isArray(result.riskAssessment.riskFactors)).toBe(true);
      expect(Array.isArray(result.riskAssessment.mitigationStrategies)).toBe(true);
      expect(Array.isArray(result.riskAssessment.monitoringRequirements)).toBe(true);
    });

    it('should estimate costs when requested', async () => {
      const result = await impactService.assessImpact(mockRequest);

      expect(result.costEstimate).toBeDefined();
      expect(result.costEstimate).toHaveProperty('totalCost');
      expect(result.costEstimate).toHaveProperty('currency');
      expect(result.costEstimate).toHaveProperty('breakdown');
      expect(result.costEstimate).toHaveProperty('assumptions');
      expect(result.costEstimate).toHaveProperty('confidence');

      expect(result.costEstimate!.totalCost).toBeGreaterThan(0);
      expect(result.costEstimate!.confidence).toBeGreaterThan(0);
      expect(result.costEstimate!.confidence).toBeLessThanOrEqual(1);

      expect(result.costEstimate!.breakdown).toHaveProperty('implementation');
      expect(result.costEstimate!.breakdown).toHaveProperty('training');
      expect(result.costEstimate!.breakdown).toHaveProperty('technology');
      expect(result.costEstimate!.breakdown).toHaveProperty('consulting');
      expect(result.costEstimate!.breakdown).toHaveProperty('ongoing');
      expect(result.costEstimate!.breakdown).toHaveProperty('contingency');
    });

    it('should not estimate costs when not requested', async () => {
      const requestWithoutCosts = { ...mockRequest, includeCostEstimate: false };
      const result = await impactService.assessImpact(requestWithoutCosts);

      expect(result.costEstimate).toBeUndefined();
    });

    it('should analyze compliance gap', async () => {
      const result = await impactService.assessImpact(mockRequest);

      expect(result.complianceGap).toHaveProperty('currentState');
      expect(result.complianceGap).toHaveProperty('requiredState');
      expect(result.complianceGap).toHaveProperty('gaps');
      expect(result.complianceGap).toHaveProperty('gapScore');
      expect(result.complianceGap).toHaveProperty('closureTimeline');

      expect(Array.isArray(result.complianceGap.gaps)).toBe(true);
      expect(result.complianceGap.gapScore).toBeGreaterThan(0);
      expect(result.complianceGap.gapScore).toBeLessThanOrEqual(10);
    });

    it('should cache assessment results', async () => {
      const result1 = await impactService.assessImpact(mockRequest);
      const result2 = await impactService.assessImpact(mockRequest);

      // Should return the same cached result
      expect(result1.id).toBe(result2.id);
      expect(result1.assessedAt).toBe(result2.assessedAt);
    });

    it('should handle different organization sizes', async () => {
      const smallOrgRequest = {
        ...mockRequest,
        organizationProfile: {
          ...mockOrganizationProfile,
          size: 'small' as const,
        },
      };

      const largeOrgRequest = {
        ...mockRequest,
        organizationProfile: {
          ...mockOrganizationProfile,
          size: 'very_large' as const,
        },
      };

      const smallResult = await impactService.assessImpact(smallOrgRequest);
      const largeResult = await impactService.assessImpact(largeOrgRequest);

      // Large organizations should generally have higher impact scores
      expect(largeResult.overallImpact.overall).toBeGreaterThanOrEqual(smallResult.overallImpact.overall);
    });

    it('should handle different analysis types', async () => {
      const basicRequest = { ...mockRequest, analysisType: 'basic' as const };
      const comprehensiveRequest = { ...mockRequest, analysisType: 'comprehensive' as const };

      const basicResult = await impactService.assessImpact(basicRequest);
      const comprehensiveResult = await impactService.assessImpact(comprehensiveRequest);

      expect(basicResult.assessmentType).toBe('basic');
      expect(comprehensiveResult.assessmentType).toBe('comprehensive');

      // Comprehensive analysis should have higher confidence
      expect(comprehensiveResult.confidence).toBeGreaterThanOrEqual(basicResult.confidence);
    });
  });

  describe('getCachedAssessment', () => {
    it('should return cached assessment if exists', async () => {
      const mockRequest: ImpactAssessmentRequest = {
        circularId: 'RBI/2024/001',
        organizationId: 'org-123',
        organizationType: 'bank',
        organizationProfile: {} as OrganizationProfile,
        analysisType: 'basic',
        includeRecommendations: true,
        includeTimeline: true,
        includeCostEstimate: false,
      };

      const result = await impactService.assessImpact(mockRequest);
      const cached = impactService.getCachedAssessment(result.id);

      expect(cached).toBeDefined();
      expect(cached!.id).toBe(result.id);
    });

    it('should return undefined for non-existent assessment', () => {
      const cached = impactService.getCachedAssessment('non-existent-id');
      expect(cached).toBeUndefined();
    });
  });

  describe('clearCache', () => {
    it('should clear all cached assessments', async () => {
      const mockRequest: ImpactAssessmentRequest = {
        circularId: 'RBI/2024/001',
        organizationId: 'org-123',
        organizationType: 'bank',
        organizationProfile: {} as OrganizationProfile,
        analysisType: 'basic',
        includeRecommendations: true,
        includeTimeline: true,
        includeCostEstimate: false,
      };

      const result = await impactService.assessImpact(mockRequest);
      
      // Verify it's cached
      expect(impactService.getCachedAssessment(result.id)).toBeDefined();
      
      // Clear cache
      impactService.clearCache();
      
      // Verify it's no longer cached
      expect(impactService.getCachedAssessment(result.id)).toBeUndefined();
    });
  });
});
