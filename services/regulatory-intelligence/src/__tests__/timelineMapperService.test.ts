/**
 * Tests for Timeline Mapper Service
 */

import TimelineMapperService, { TimelineGenerationOptions } from '../services/timelineMapperService';
import { ParsedCircular } from '../services/circularParserService';

describe('TimelineMapperService', () => {
  let timelineService: TimelineMapperService;

  beforeEach(() => {
    timelineService = new TimelineMapperService();
  });

  afterEach(() => {
    timelineService.clearCache();
  });

  describe('constructor', () => {
    it('should create an instance of TimelineMapperService', () => {
      expect(timelineService).toBeInstanceOf(TimelineMapperService);
    });
  });

  describe('generateTimeline', () => {
    const mockParsedCircular: ParsedCircular = {
      circularId: 'RBI/2024/001',
      metadata: {
        circularNumber: 'RBI/2024/001',
        title: 'Capital Adequacy Guidelines',
        circularDate: '2024-01-15',
        effectiveDate: '2024-04-01',
        category: 'Capital Adequacy',
        impactLevel: 'high',
        affectedEntities: ['banks', 'nbfcs'],
        sourceUrl: 'https://example.com/circular',
      },
      content: {
        summary: 'Updated capital adequacy guidelines',
        keyPoints: ['Minimum ratio increased', 'New reporting format'],
        requirements: [
          {
            id: 'req_001',
            title: 'Maintain minimum capital ratio',
            description: 'Banks must maintain minimum 9% capital adequacy ratio',
            category: 'Capital Adequacy',
            priority: 'high',
            applicableEntities: ['banks'],
          },
        ],
        deadlines: [
          {
            description: 'Submit quarterly report',
            date: '2024-06-30',
            type: 'reporting',
            applicableEntities: ['banks'],
          },
        ],
        references: [],
        definitions: [],
        sections: [],
      },
      analysis: {
        sentiment: { score: 0, label: 'neutral' },
        complexity: { score: 7, level: 'moderate' },
        urgency: { score: 8, level: 'high' },
        topics: ['capital', 'adequacy'],
        entities: [],
        keywords: ['capital', 'adequacy', 'ratio'],
      },
      confidence: 0.85,
      processingTime: 1500,
      parsedAt: '2024-01-15T10:00:00Z',
    };

    const mockOptions: TimelineGenerationOptions = {
      organizationType: 'bank',
      organizationSize: 'large',
      complianceMaturity: 7,
      includeBufferTime: true,
      bufferPercentage: 10,
      includeRiskAssessment: true,
    };

    it('should generate timeline mapping successfully', async () => {
      const result = await timelineService.generateTimeline(
        'RBI/2024/001',
        mockParsedCircular,
        mockOptions,
        'org-123'
      );

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('circularId', 'RBI/2024/001');
      expect(result).toHaveProperty('organizationId', 'org-123');
      expect(result).toHaveProperty('timeline');
      expect(result).toHaveProperty('criticalPath');
      expect(result).toHaveProperty('totalDuration');
      expect(result).toHaveProperty('keyMilestones');
      expect(result).toHaveProperty('riskFactors');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
      expect(result).toHaveProperty('validUntil');

      expect(Array.isArray(result.timeline)).toBe(true);
      expect(Array.isArray(result.criticalPath)).toBe(true);
      expect(Array.isArray(result.keyMilestones)).toBe(true);
      expect(Array.isArray(result.riskFactors)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should generate timeline events from circular data', async () => {
      const result = await timelineService.generateTimeline(
        'RBI/2024/001',
        mockParsedCircular,
        mockOptions
      );

      expect(result.timeline.length).toBeGreaterThan(0);

      // Should include circular publication event
      const publicationEvent = result.timeline.find(e => e.type === 'circular_published');
      expect(publicationEvent).toBeDefined();
      expect(publicationEvent!.title).toContain('Capital Adequacy Guidelines');

      // Should include effective date event
      const effectiveEvent = result.timeline.find(e => e.type === 'effective_date');
      expect(effectiveEvent).toBeDefined();

      // Should include implementation events
      const implementationEvents = result.timeline.filter(e => e.type === 'implementation_deadline');
      expect(implementationEvents.length).toBeGreaterThan(0);

      // Should include milestone events
      const milestoneEvents = result.timeline.filter(e => e.type === 'milestone');
      expect(milestoneEvents.length).toBeGreaterThan(0);
    });

    it('should sort timeline events by date', async () => {
      const result = await timelineService.generateTimeline(
        'RBI/2024/001',
        mockParsedCircular,
        mockOptions
      );

      for (let i = 1; i < result.timeline.length; i++) {
        expect(result.timeline[i].date.getTime()).toBeGreaterThanOrEqual(
          result.timeline[i - 1].date.getTime()
        );
      }
    });

    it('should generate key milestones', async () => {
      const result = await timelineService.generateTimeline(
        'RBI/2024/001',
        mockParsedCircular,
        mockOptions
      );

      expect(result.keyMilestones.length).toBeGreaterThan(0);

      const milestone = result.keyMilestones[0];
      expect(milestone).toHaveProperty('id');
      expect(milestone).toHaveProperty('name');
      expect(milestone).toHaveProperty('description');
      expect(milestone).toHaveProperty('targetDate');
      expect(milestone).toHaveProperty('status');
      expect(milestone).toHaveProperty('criticality');
      expect(milestone).toHaveProperty('dependencies');
      expect(milestone).toHaveProperty('deliverables');
      expect(milestone).toHaveProperty('owner');
      expect(milestone).toHaveProperty('progress');

      expect(['not_started', 'in_progress', 'completed', 'delayed', 'at_risk', 'cancelled']).toContain(milestone.status);
      expect(['low', 'medium', 'high', 'critical']).toContain(milestone.criticality);
      expect(milestone.progress).toBeGreaterThanOrEqual(0);
      expect(milestone.progress).toBeLessThanOrEqual(100);
    });

    it('should assess risk factors when requested', async () => {
      const result = await timelineService.generateTimeline(
        'RBI/2024/001',
        mockParsedCircular,
        mockOptions
      );

      // Risk assessment was enabled in options
      expect(Array.isArray(result.riskFactors)).toBe(true);

      if (result.riskFactors.length > 0) {
        const risk = result.riskFactors[0];
        expect(risk).toHaveProperty('id');
        expect(risk).toHaveProperty('type');
        expect(risk).toHaveProperty('description');
        expect(risk).toHaveProperty('probability');
        expect(risk).toHaveProperty('impact');
        expect(risk).toHaveProperty('riskScore');
        expect(risk).toHaveProperty('mitigation');
        expect(risk).toHaveProperty('contingency');
        expect(risk).toHaveProperty('owner');

        expect(['schedule', 'resource', 'technical', 'regulatory', 'external']).toContain(risk.type);
        expect(risk.probability).toBeGreaterThanOrEqual(1);
        expect(risk.probability).toBeLessThanOrEqual(10);
        expect(risk.impact).toBeGreaterThanOrEqual(1);
        expect(risk.impact).toBeLessThanOrEqual(10);
      }
    });

    it('should generate recommendations', async () => {
      const result = await timelineService.generateTimeline(
        'RBI/2024/001',
        mockParsedCircular,
        mockOptions
      );

      expect(Array.isArray(result.recommendations)).toBe(true);

      if (result.recommendations.length > 0) {
        const recommendation = result.recommendations[0];
        expect(recommendation).toHaveProperty('id');
        expect(recommendation).toHaveProperty('type');
        expect(recommendation).toHaveProperty('title');
        expect(recommendation).toHaveProperty('description');
        expect(recommendation).toHaveProperty('rationale');
        expect(recommendation).toHaveProperty('estimatedImpact');
        expect(recommendation).toHaveProperty('implementationEffort');
        expect(recommendation).toHaveProperty('priority');

        expect(['acceleration', 'resource', 'risk_mitigation', 'process_improvement']).toContain(recommendation.type);
        expect(['low', 'medium', 'high']).toContain(recommendation.implementationEffort);
        expect(['low', 'medium', 'high', 'critical']).toContain(recommendation.priority);
      }
    });

    it('should handle different organization sizes', async () => {
      const smallOrgOptions = { ...mockOptions, organizationSize: 'small' as const };
      const largeOrgOptions = { ...mockOptions, organizationSize: 'very_large' as const };

      const smallResult = await timelineService.generateTimeline(
        'RBI/2024/001',
        mockParsedCircular,
        smallOrgOptions
      );

      const largeResult = await timelineService.generateTimeline(
        'RBI/2024/002',
        mockParsedCircular,
        largeOrgOptions
      );

      // Large organizations typically have longer implementation timelines
      const smallDuration = timelineService['parseDuration'](smallResult.totalDuration);
      const largeDuration = timelineService['parseDuration'](largeResult.totalDuration);
      
      expect(largeDuration).toBeGreaterThanOrEqual(smallDuration);
    });

    it('should handle different compliance maturity levels', async () => {
      const lowMaturityOptions = { ...mockOptions, complianceMaturity: 3 };
      const highMaturityOptions = { ...mockOptions, complianceMaturity: 9 };

      const lowMaturityResult = await timelineService.generateTimeline(
        'RBI/2024/003',
        mockParsedCircular,
        lowMaturityOptions
      );

      const highMaturityResult = await timelineService.generateTimeline(
        'RBI/2024/004',
        mockParsedCircular,
        highMaturityOptions
      );

      // Lower maturity should result in more recommendations
      expect(lowMaturityResult.recommendations.length).toBeGreaterThanOrEqual(
        highMaturityResult.recommendations.length
      );
    });

    it('should apply buffer time when requested', async () => {
      const withBufferOptions = { ...mockOptions, includeBufferTime: true, bufferPercentage: 20 };
      const withoutBufferOptions = { ...mockOptions, includeBufferTime: false };

      const withBufferResult = await timelineService.generateTimeline(
        'RBI/2024/005',
        mockParsedCircular,
        withBufferOptions
      );

      const withoutBufferResult = await timelineService.generateTimeline(
        'RBI/2024/006',
        mockParsedCircular,
        withoutBufferOptions
      );

      // With buffer should have later dates for upcoming events
      const withBufferUpcoming = withBufferResult.timeline.filter(e => e.status === 'upcoming');
      const withoutBufferUpcoming = withoutBufferResult.timeline.filter(e => e.status === 'upcoming');

      if (withBufferUpcoming.length > 0 && withoutBufferUpcoming.length > 0) {
        expect(withBufferUpcoming[0].date.getTime()).toBeGreaterThanOrEqual(
          withoutBufferUpcoming[0].date.getTime()
        );
      }
    });

    it('should include custom deadlines when provided', async () => {
      const customDeadlines = [
        {
          type: 'audit',
          description: 'Internal audit review',
          date: new Date('2024-05-15'),
          priority: 'medium' as const,
        },
      ];

      const optionsWithCustom = { ...mockOptions, customDeadlines };

      const result = await timelineService.generateTimeline(
        'RBI/2024/007',
        mockParsedCircular,
        optionsWithCustom
      );

      const customEvent = result.timeline.find(e => e.description.includes('Internal audit review'));
      expect(customEvent).toBeDefined();
      expect(customEvent!.source).toBe('manual');
    });

    it('should cache timeline mappings', async () => {
      const result1 = await timelineService.generateTimeline(
        'RBI/2024/008',
        mockParsedCircular,
        mockOptions,
        'org-123'
      );

      const result2 = await timelineService.generateTimeline(
        'RBI/2024/008',
        mockParsedCircular,
        mockOptions,
        'org-123'
      );

      // Should return the same cached result
      expect(result1.id).toBe(result2.id);
      expect(result1.createdAt).toBe(result2.createdAt);
    });
  });

  describe('getTimelineMapping', () => {
    it('should return timeline mapping if exists', async () => {
      const mockParsedCircular: ParsedCircular = {
        circularId: 'RBI/2024/009',
        metadata: {
          circularNumber: 'RBI/2024/009',
          title: 'Test Circular',
          circularDate: '2024-01-15',
          category: 'General',
          impactLevel: 'medium',
          affectedEntities: ['banks'],
          sourceUrl: 'https://example.com',
        },
        content: {
          summary: 'Test',
          keyPoints: [],
          requirements: [],
          deadlines: [],
          references: [],
          definitions: [],
          sections: [],
        },
        analysis: {
          sentiment: { score: 0, label: 'neutral' },
          complexity: { score: 5, level: 'moderate' },
          urgency: { score: 5, level: 'medium' },
          topics: [],
          entities: [],
          keywords: [],
        },
        confidence: 0.8,
        processingTime: 1000,
        parsedAt: '2024-01-15T10:00:00Z',
      };

      const options: TimelineGenerationOptions = {
        organizationType: 'bank',
        organizationSize: 'medium',
        complianceMaturity: 5,
        includeBufferTime: false,
        bufferPercentage: 0,
        includeRiskAssessment: false,
      };

      const result = await timelineService.generateTimeline(
        'RBI/2024/009',
        mockParsedCircular,
        options
      );

      const retrieved = timelineService.getTimelineMapping(result.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(result.id);
    });

    it('should return undefined for non-existent timeline', () => {
      const result = timelineService.getTimelineMapping('non-existent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('updateEventStatus', () => {
    it('should update event status successfully', async () => {
      const mockParsedCircular: ParsedCircular = {
        circularId: 'RBI/2024/010',
        metadata: {
          circularNumber: 'RBI/2024/010',
          title: 'Test Circular',
          circularDate: '2024-01-15',
          category: 'General',
          impactLevel: 'medium',
          affectedEntities: ['banks'],
          sourceUrl: 'https://example.com',
        },
        content: {
          summary: 'Test',
          keyPoints: [],
          requirements: [],
          deadlines: [],
          references: [],
          definitions: [],
          sections: [],
        },
        analysis: {
          sentiment: { score: 0, label: 'neutral' },
          complexity: { score: 5, level: 'moderate' },
          urgency: { score: 5, level: 'medium' },
          topics: [],
          entities: [],
          keywords: [],
        },
        confidence: 0.8,
        processingTime: 1000,
        parsedAt: '2024-01-15T10:00:00Z',
      };

      const options: TimelineGenerationOptions = {
        organizationType: 'bank',
        organizationSize: 'medium',
        complianceMaturity: 5,
        includeBufferTime: false,
        bufferPercentage: 0,
        includeRiskAssessment: false,
      };

      const timeline = await timelineService.generateTimeline(
        'RBI/2024/010',
        mockParsedCircular,
        options
      );

      const eventId = timeline.timeline[0].id;
      const updated = timelineService.updateEventStatus(timeline.id, eventId, 'in_progress', 50);

      expect(updated).toBe(true);

      const updatedTimeline = timelineService.getTimelineMapping(timeline.id);
      const updatedEvent = updatedTimeline!.timeline.find(e => e.id === eventId);
      expect(updatedEvent!.status).toBe('in_progress');
      expect(updatedEvent!.completionPercentage).toBe(50);
    });

    it('should return false for non-existent timeline or event', () => {
      const result1 = timelineService.updateEventStatus('non-existent', 'event-id', 'completed');
      expect(result1).toBe(false);

      // This would also return false if timeline exists but event doesn't
    });
  });

  describe('getTimelineStats', () => {
    it('should return timeline statistics', () => {
      const stats = timelineService.getTimelineStats();

      expect(stats).toHaveProperty('totalMappings');
      expect(stats).toHaveProperty('averageEventCount');
      expect(stats).toHaveProperty('averageDuration');
      expect(stats).toHaveProperty('statusDistribution');
      expect(stats).toHaveProperty('riskDistribution');

      expect(typeof stats.totalMappings).toBe('number');
      expect(typeof stats.averageEventCount).toBe('number');
      expect(typeof stats.averageDuration).toBe('number');
      expect(typeof stats.statusDistribution).toBe('object');
      expect(typeof stats.riskDistribution).toBe('object');
    });
  });

  describe('clearCache', () => {
    it('should clear timeline cache', async () => {
      // First create a timeline
      const mockParsedCircular: ParsedCircular = {
        circularId: 'RBI/2024/011',
        metadata: {
          circularNumber: 'RBI/2024/011',
          title: 'Test Circular',
          circularDate: '2024-01-15',
          category: 'General',
          impactLevel: 'medium',
          affectedEntities: ['banks'],
          sourceUrl: 'https://example.com',
        },
        content: {
          summary: 'Test',
          keyPoints: [],
          requirements: [],
          deadlines: [],
          references: [],
          definitions: [],
          sections: [],
        },
        analysis: {
          sentiment: { score: 0, label: 'neutral' },
          complexity: { score: 5, level: 'moderate' },
          urgency: { score: 5, level: 'medium' },
          topics: [],
          entities: [],
          keywords: [],
        },
        confidence: 0.8,
        processingTime: 1000,
        parsedAt: '2024-01-15T10:00:00Z',
      };

      const options: TimelineGenerationOptions = {
        organizationType: 'bank',
        organizationSize: 'medium',
        complianceMaturity: 5,
        includeBufferTime: false,
        bufferPercentage: 0,
        includeRiskAssessment: false,
      };

      const result = await timelineService.generateTimeline(
        'RBI/2024/011',
        mockParsedCircular,
        options
      );

      // Verify it exists
      expect(timelineService.getTimelineMapping(result.id)).toBeDefined();

      // Clear cache
      timelineService.clearCache();

      // Verify it's gone
      expect(timelineService.getTimelineMapping(result.id)).toBeUndefined();
    });
  });
});
