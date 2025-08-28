/**
 * Timeline Mapper Service
 * Maps regulatory changes to implementation timelines and deadlines
 */

import { logger, loggers } from '@utils/logger';
import { config } from '@config/index';
import { ParsedCircular } from './circularParserService';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string;
  date: Date;
  status: EventStatus;
  priority: EventPriority;
  category: string;
  source: EventSource;
  metadata: EventMetadata;
  dependencies: string[];
  affectedEntities: string[];
  estimatedDuration?: string;
  completionPercentage?: number;
}

export interface TimelineMapping {
  id: string;
  circularId: string;
  organizationId?: string;
  timeline: TimelineEvent[];
  criticalPath: string[];
  totalDuration: string;
  keyMilestones: Milestone[];
  riskFactors: RiskFactor[];
  recommendations: TimelineRecommendation[];
  createdAt: Date;
  updatedAt: Date;
  validUntil: Date;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  targetDate: Date;
  actualDate?: Date;
  status: MilestoneStatus;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
  deliverables: string[];
  owner: string;
  progress: number; // 0-100
}

export interface RiskFactor {
  id: string;
  type: 'schedule' | 'resource' | 'technical' | 'regulatory' | 'external';
  description: string;
  probability: number; // 1-10
  impact: number; // 1-10
  riskScore: number;
  mitigation: string;
  contingency: string;
  owner: string;
}

export interface TimelineRecommendation {
  id: string;
  type: 'acceleration' | 'resource' | 'risk_mitigation' | 'process_improvement';
  title: string;
  description: string;
  rationale: string;
  estimatedImpact: string;
  implementationEffort: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface EventMetadata {
  circularId?: string;
  requirementId?: string;
  workflowId?: string;
  parentEventId?: string;
  tags: string[];
  customFields: Record<string, any>;
}

export type TimelineEventType = 
  | 'circular_published'
  | 'effective_date'
  | 'implementation_deadline'
  | 'compliance_deadline'
  | 'reporting_deadline'
  | 'review_deadline'
  | 'milestone'
  | 'checkpoint'
  | 'audit_date'
  | 'training_deadline'
  | 'system_update'
  | 'policy_update'
  | 'approval_required';

export type EventStatus = 'upcoming' | 'in_progress' | 'completed' | 'overdue' | 'cancelled' | 'postponed';

export type EventPriority = 'low' | 'medium' | 'high' | 'critical' | 'urgent';

export type EventSource = 'rbi_circular' | 'internal_policy' | 'audit_requirement' | 'system_generated' | 'manual';

export type MilestoneStatus = 'not_started' | 'in_progress' | 'completed' | 'delayed' | 'at_risk' | 'cancelled';

export interface TimelineGenerationOptions {
  organizationType: 'bank' | 'nbfc' | 'cooperative_bank' | 'payment_bank' | 'small_finance_bank';
  organizationSize: 'small' | 'medium' | 'large' | 'very_large';
  complianceMaturity: number; // 1-10
  includeBufferTime: boolean;
  bufferPercentage: number; // 0-100
  includeRiskAssessment: boolean;
  customDeadlines?: CustomDeadline[];
}

export interface CustomDeadline {
  type: string;
  description: string;
  date: Date;
  priority: EventPriority;
}

export class TimelineMapperService {
  private timelineCache: Map<string, TimelineMapping> = new Map();
  private eventTemplates: Map<string, TimelineEvent[]> = new Map();

  constructor() {
    this.initializeEventTemplates();
    logger.info('Timeline Mapper Service initialized');
  }

  /**
   * Generate timeline mapping for a regulatory circular
   */
  public async generateTimeline(
    circularId: string,
    parsedCircular: ParsedCircular,
    options: TimelineGenerationOptions,
    organizationId?: string
  ): Promise<TimelineMapping> {
    const startTime = Date.now();

    try {
      loggers.business('timeline_generation_started', {
        circularId,
        organizationId,
        organizationType: options.organizationType,
        organizationSize: options.organizationSize,
      });

      // Generate cache key
      const cacheKey = this.generateCacheKey(circularId, organizationId, options);

      // Check cache first
      if (this.timelineCache.has(cacheKey)) {
        logger.info('Returning cached timeline mapping', { cacheKey });
        return this.timelineCache.get(cacheKey)!;
      }

      // Generate timeline events
      const timeline = await this.generateTimelineEvents(parsedCircular, options);

      // Identify critical path
      const criticalPath = this.identifyCriticalPath(timeline);

      // Calculate total duration
      const totalDuration = this.calculateTotalDuration(timeline);

      // Generate key milestones
      const keyMilestones = this.generateKeyMilestones(timeline, options);

      // Assess risk factors
      const riskFactors = options.includeRiskAssessment 
        ? this.assessRiskFactors(timeline, options)
        : [];

      // Generate recommendations
      const recommendations = this.generateRecommendations(timeline, riskFactors, options);

      const timelineMapping: TimelineMapping = {
        id: `timeline_${circularId}_${Date.now()}`,
        circularId,
        organizationId,
        timeline,
        criticalPath,
        totalDuration,
        keyMilestones,
        riskFactors,
        recommendations,
        createdAt: new Date(),
        updatedAt: new Date(),
        validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days
      };

      // Cache the result
      this.timelineCache.set(cacheKey, timelineMapping);

      const processingTime = Date.now() - startTime;

      loggers.business('timeline_generation_completed', {
        timelineId: timelineMapping.id,
        circularId,
        organizationId,
        eventCount: timeline.length,
        milestoneCount: keyMilestones.length,
        totalDuration,
        processingTime: `${processingTime}ms`,
      });

      return timelineMapping;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      loggers.business('timeline_generation_failed', {
        circularId,
        organizationId,
        processingTime: `${processingTime}ms`,
        error: (error as Error).message,
      }, error as Error);

      throw error;
    }
  }

  /**
   * Generate timeline events from parsed circular
   */
  private async generateTimelineEvents(
    parsedCircular: ParsedCircular,
    options: TimelineGenerationOptions
  ): Promise<TimelineEvent[]> {
    const events: TimelineEvent[] = [];
    const baseDate = new Date(parsedCircular.metadata.circularDate);

    // Add circular publication event
    events.push({
      id: `event_${Date.now()}_1`,
      type: 'circular_published',
      title: `RBI Circular Published: ${parsedCircular.metadata.title}`,
      description: `RBI published circular ${parsedCircular.metadata.circularNumber}`,
      date: baseDate,
      status: 'completed',
      priority: this.mapImpactToPriority(parsedCircular.metadata.impactLevel),
      category: parsedCircular.metadata.category,
      source: 'rbi_circular',
      metadata: {
        circularId: parsedCircular.circularId,
        tags: ['publication', 'rbi', parsedCircular.metadata.category.toLowerCase()],
        customFields: {
          circularNumber: parsedCircular.metadata.circularNumber,
          impactLevel: parsedCircular.metadata.impactLevel,
        },
      },
      dependencies: [],
      affectedEntities: parsedCircular.metadata.affectedEntities,
    });

    // Add effective date event if available
    if (parsedCircular.metadata.effectiveDate) {
      const effectiveDate = new Date(parsedCircular.metadata.effectiveDate);
      events.push({
        id: `event_${Date.now()}_2`,
        type: 'effective_date',
        title: 'Circular Becomes Effective',
        description: `Circular ${parsedCircular.metadata.circularNumber} becomes effective`,
        date: effectiveDate,
        status: effectiveDate > new Date() ? 'upcoming' : 'completed',
        priority: 'high',
        category: parsedCircular.metadata.category,
        source: 'rbi_circular',
        metadata: {
          circularId: parsedCircular.circularId,
          tags: ['effective', 'compliance'],
          customFields: {},
        },
        dependencies: [events[0].id],
        affectedEntities: parsedCircular.metadata.affectedEntities,
      });
    }

    // Generate events from requirements
    parsedCircular.content.requirements.forEach((requirement, index) => {
      const requirementEvent = this.generateRequirementEvent(
        requirement,
        parsedCircular,
        options,
        index + 3
      );
      events.push(requirementEvent);
    });

    // Generate events from deadlines
    parsedCircular.content.deadlines.forEach((deadline, index) => {
      const deadlineEvent = this.generateDeadlineEvent(
        deadline,
        parsedCircular,
        options,
        events.length + index + 1
      );
      events.push(deadlineEvent);
    });

    // Add implementation phases based on organization characteristics
    const implementationEvents = this.generateImplementationPhases(
      parsedCircular,
      options,
      events.length + 1
    );
    events.push(...implementationEvents);

    // Add custom deadlines if provided
    if (options.customDeadlines) {
      options.customDeadlines.forEach((customDeadline, index) => {
        events.push({
          id: `event_custom_${Date.now()}_${index}`,
          type: 'compliance_deadline',
          title: customDeadline.description,
          description: `Custom deadline: ${customDeadline.description}`,
          date: customDeadline.date,
          status: customDeadline.date > new Date() ? 'upcoming' : 'overdue',
          priority: customDeadline.priority,
          category: 'Custom',
          source: 'manual',
          metadata: {
            tags: ['custom', 'deadline'],
            customFields: { type: customDeadline.type },
          },
          dependencies: [],
          affectedEntities: parsedCircular.metadata.affectedEntities,
        });
      });
    }

    // Sort events by date
    events.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Apply buffer time if requested
    if (options.includeBufferTime) {
      this.applyBufferTime(events, options.bufferPercentage);
    }

    return events;
  }

  /**
   * Generate requirement-based event
   */
  private generateRequirementEvent(
    requirement: any,
    parsedCircular: ParsedCircular,
    options: TimelineGenerationOptions,
    eventIndex: number
  ): TimelineEvent {
    // Calculate implementation date based on requirement priority and organization maturity
    const baseDate = new Date(parsedCircular.metadata.circularDate);
    const daysToAdd = this.calculateImplementationDays(requirement.priority, options);
    const implementationDate = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    return {
      id: `event_${Date.now()}_${eventIndex}`,
      type: 'implementation_deadline',
      title: `Implement: ${requirement.title}`,
      description: requirement.description,
      date: implementationDate,
      status: implementationDate > new Date() ? 'upcoming' : 'overdue',
      priority: requirement.priority,
      category: requirement.category,
      source: 'rbi_circular',
      metadata: {
        circularId: parsedCircular.circularId,
        requirementId: requirement.id,
        tags: ['implementation', 'requirement', requirement.category.toLowerCase()],
        customFields: {
          frequency: requirement.frequency,
          applicableEntities: requirement.applicableEntities,
        },
      },
      dependencies: [],
      affectedEntities: requirement.applicableEntities,
      estimatedDuration: this.estimateRequirementDuration(requirement, options),
    };
  }

  /**
   * Generate deadline-based event
   */
  private generateDeadlineEvent(
    deadline: any,
    parsedCircular: ParsedCircular,
    options: TimelineGenerationOptions,
    eventIndex: number
  ): TimelineEvent {
    return {
      id: `event_${Date.now()}_${eventIndex}`,
      type: deadline.type === 'reporting' ? 'reporting_deadline' : 'compliance_deadline',
      title: deadline.description,
      description: `Deadline: ${deadline.description}`,
      date: new Date(deadline.date),
      status: new Date(deadline.date) > new Date() ? 'upcoming' : 'overdue',
      priority: 'high',
      category: parsedCircular.metadata.category,
      source: 'rbi_circular',
      metadata: {
        circularId: parsedCircular.circularId,
        tags: ['deadline', deadline.type],
        customFields: {
          consequences: deadline.consequences,
        },
      },
      dependencies: [],
      affectedEntities: deadline.applicableEntities,
    };
  }

  /**
   * Generate implementation phases
   */
  private generateImplementationPhases(
    parsedCircular: ParsedCircular,
    options: TimelineGenerationOptions,
    startIndex: number
  ): TimelineEvent[] {
    const phases: TimelineEvent[] = [];
    const baseDate = new Date(parsedCircular.metadata.circularDate);

    // Phase 1: Assessment and Planning
    const planningDate = new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week
    phases.push({
      id: `phase_planning_${Date.now()}`,
      type: 'milestone',
      title: 'Assessment and Planning Phase',
      description: 'Complete impact assessment and create implementation plan',
      date: planningDate,
      status: planningDate > new Date() ? 'upcoming' : 'completed',
      priority: 'high',
      category: 'Implementation',
      source: 'system_generated',
      metadata: {
        circularId: parsedCircular.circularId,
        tags: ['phase', 'planning', 'assessment'],
        customFields: { phase: 1 },
      },
      dependencies: [],
      affectedEntities: parsedCircular.metadata.affectedEntities,
      estimatedDuration: '1-2 weeks',
    });

    // Phase 2: System and Process Updates
    const systemUpdateDays = this.calculateSystemUpdateDays(options);
    const systemDate = new Date(planningDate.getTime() + systemUpdateDays * 24 * 60 * 60 * 1000);
    phases.push({
      id: `phase_system_${Date.now()}`,
      type: 'milestone',
      title: 'System and Process Updates',
      description: 'Update systems, processes, and procedures',
      date: systemDate,
      status: systemDate > new Date() ? 'upcoming' : 'completed',
      priority: 'high',
      category: 'Implementation',
      source: 'system_generated',
      metadata: {
        circularId: parsedCircular.circularId,
        tags: ['phase', 'system', 'process'],
        customFields: { phase: 2 },
      },
      dependencies: [phases[0].id],
      affectedEntities: parsedCircular.metadata.affectedEntities,
      estimatedDuration: `${systemUpdateDays} days`,
    });

    // Phase 3: Testing and Validation
    const testingDays = Math.ceil(systemUpdateDays * 0.3); // 30% of system update time
    const testingDate = new Date(systemDate.getTime() + testingDays * 24 * 60 * 60 * 1000);
    phases.push({
      id: `phase_testing_${Date.now()}`,
      type: 'milestone',
      title: 'Testing and Validation',
      description: 'Test changes and validate compliance',
      date: testingDate,
      status: testingDate > new Date() ? 'upcoming' : 'completed',
      priority: 'medium',
      category: 'Implementation',
      source: 'system_generated',
      metadata: {
        circularId: parsedCircular.circularId,
        tags: ['phase', 'testing', 'validation'],
        customFields: { phase: 3 },
      },
      dependencies: [phases[1].id],
      affectedEntities: parsedCircular.metadata.affectedEntities,
      estimatedDuration: `${testingDays} days`,
    });

    return phases;
  }

  // Helper methods
  private generateCacheKey(
    circularId: string,
    organizationId?: string,
    options?: TimelineGenerationOptions
  ): string {
    const orgKey = organizationId || 'generic';
    const optionsKey = options ? JSON.stringify(options) : 'default';
    return `${circularId}_${orgKey}_${Buffer.from(optionsKey).toString('base64')}`;
  }

  private mapImpactToPriority(impactLevel: string): EventPriority {
    switch (impactLevel.toLowerCase()) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  }

  private calculateImplementationDays(priority: string, options: TimelineGenerationOptions): number {
    let baseDays = 30; // Default 30 days

    // Adjust based on priority
    switch (priority) {
      case 'critical': baseDays = 7; break;
      case 'high': baseDays = 14; break;
      case 'medium': baseDays = 30; break;
      case 'low': baseDays = 60; break;
    }

    // Adjust based on organization size
    const sizeMultiplier = this.getOrganizationSizeMultiplier(options.organizationSize);
    baseDays = Math.ceil(baseDays * sizeMultiplier);

    // Adjust based on compliance maturity
    const maturityAdjustment = (10 - options.complianceMaturity) / 10;
    baseDays = Math.ceil(baseDays * (1 + maturityAdjustment));

    return baseDays;
  }

  private getOrganizationSizeMultiplier(size: string): number {
    switch (size) {
      case 'very_large': return 1.5;
      case 'large': return 1.3;
      case 'medium': return 1.0;
      case 'small': return 0.8;
      default: return 1.0;
    }
  }

  private calculateSystemUpdateDays(options: TimelineGenerationOptions): number {
    let baseDays = 21; // 3 weeks base

    // Adjust based on organization characteristics
    const sizeMultiplier = this.getOrganizationSizeMultiplier(options.organizationSize);
    baseDays = Math.ceil(baseDays * sizeMultiplier);

    // Adjust based on compliance maturity (higher maturity = faster updates)
    const maturityFactor = options.complianceMaturity / 10;
    baseDays = Math.ceil(baseDays * (1.5 - maturityFactor));

    return Math.max(baseDays, 7); // Minimum 1 week
  }

  private estimateRequirementDuration(requirement: any, options: TimelineGenerationOptions): string {
    const complexity = this.assessRequirementComplexity(requirement);
    const baseDays = complexity * this.getOrganizationSizeMultiplier(options.organizationSize);
    
    if (baseDays <= 7) return '1 week';
    if (baseDays <= 14) return '2 weeks';
    if (baseDays <= 30) return '1 month';
    if (baseDays <= 60) return '2 months';
    return '3+ months';
  }

  private assessRequirementComplexity(requirement: any): number {
    // Simple complexity assessment based on requirement characteristics
    let complexity = 5; // Base complexity

    if (requirement.category === 'Capital Adequacy') complexity += 3;
    if (requirement.category === 'Risk Management') complexity += 2;
    if (requirement.priority === 'critical') complexity += 2;
    if (requirement.applicableEntities.length > 3) complexity += 1;

    return Math.min(complexity, 10);
  }

  private identifyCriticalPath(events: TimelineEvent[]): string[] {
    // Simplified critical path identification
    // In a real implementation, this would use proper critical path method (CPM)
    return events
      .filter(event => event.priority === 'critical' || event.priority === 'high')
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(event => event.id);
  }

  private calculateTotalDuration(events: TimelineEvent[]): string {
    if (events.length === 0) return '0 days';

    const startDate = events[0].date;
    const endDate = events[events.length - 1].date;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) return `${diffDays} days`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks`;
    if (diffDays <= 365) return `${Math.ceil(diffDays / 30)} months`;
    return `${Math.ceil(diffDays / 365)} years`;
  }

  private generateKeyMilestones(events: TimelineEvent[], options: TimelineGenerationOptions): Milestone[] {
    return events
      .filter(event => event.type === 'milestone' || event.priority === 'critical')
      .map(event => ({
        id: `milestone_${event.id}`,
        name: event.title,
        description: event.description,
        targetDate: event.date,
        status: this.mapEventStatusToMilestoneStatus(event.status),
        criticality: event.priority === 'critical' ? 'critical' : 'high',
        dependencies: event.dependencies,
        deliverables: this.generateMilestoneDeliverables(event),
        owner: 'Compliance Team',
        progress: event.status === 'completed' ? 100 : 0,
      }));
  }

  private mapEventStatusToMilestoneStatus(status: EventStatus): MilestoneStatus {
    switch (status) {
      case 'upcoming': return 'not_started';
      case 'in_progress': return 'in_progress';
      case 'completed': return 'completed';
      case 'overdue': return 'delayed';
      default: return 'not_started';
    }
  }

  private generateMilestoneDeliverables(event: TimelineEvent): string[] {
    // Generate deliverables based on event type
    switch (event.type) {
      case 'milestone':
        return ['Implementation plan', 'Progress report', 'Compliance documentation'];
      case 'implementation_deadline':
        return ['Updated procedures', 'System changes', 'Training materials'];
      case 'compliance_deadline':
        return ['Compliance report', 'Evidence documentation', 'Audit trail'];
      default:
        return ['Documentation', 'Status report'];
    }
  }

  private assessRiskFactors(events: TimelineEvent[], options: TimelineGenerationOptions): RiskFactor[] {
    const risks: RiskFactor[] = [];

    // Schedule risk assessment
    const criticalEvents = events.filter(e => e.priority === 'critical' || e.priority === 'high');
    if (criticalEvents.length > 5) {
      risks.push({
        id: `risk_schedule_${Date.now()}`,
        type: 'schedule',
        description: 'High number of critical events may cause schedule conflicts',
        probability: 7,
        impact: 8,
        riskScore: 56,
        mitigation: 'Prioritize critical events and allocate additional resources',
        contingency: 'Extend timeline for non-critical items',
        owner: 'Project Manager',
      });
    }

    // Resource risk assessment
    if (options.organizationSize === 'small' && events.length > 10) {
      risks.push({
        id: `risk_resource_${Date.now()}`,
        type: 'resource',
        description: 'Limited resources may impact implementation capacity',
        probability: 8,
        impact: 7,
        riskScore: 56,
        mitigation: 'Consider external consulting support',
        contingency: 'Phase implementation over longer period',
        owner: 'Resource Manager',
      });
    }

    return risks;
  }

  private generateRecommendations(
    events: TimelineEvent[],
    risks: RiskFactor[],
    options: TimelineGenerationOptions
  ): TimelineRecommendation[] {
    const recommendations: TimelineRecommendation[] = [];

    // Early start recommendation for critical events
    const criticalEvents = events.filter(e => e.priority === 'critical');
    if (criticalEvents.length > 0) {
      recommendations.push({
        id: `rec_early_start_${Date.now()}`,
        type: 'acceleration',
        title: 'Early Start for Critical Events',
        description: 'Begin work on critical compliance requirements immediately',
        rationale: 'Critical events have limited flexibility and high impact',
        estimatedImpact: 'Reduces overall timeline risk by 30%',
        implementationEffort: 'medium',
        priority: 'high',
      });
    }

    // Resource allocation recommendation
    if (options.complianceMaturity < 6) {
      recommendations.push({
        id: `rec_resource_${Date.now()}`,
        type: 'resource',
        title: 'Enhance Compliance Team Capacity',
        description: 'Consider additional compliance resources or external support',
        rationale: 'Lower compliance maturity requires additional support',
        estimatedImpact: 'Improves implementation quality and reduces delays',
        implementationEffort: 'high',
        priority: 'medium',
      });
    }

    return recommendations;
  }

  private applyBufferTime(events: TimelineEvent[], bufferPercentage: number): void {
    events.forEach(event => {
      if (event.status === 'upcoming') {
        const bufferDays = Math.ceil(
          (event.date.getTime() - Date.now()) / (1000 * 60 * 60 * 24) * bufferPercentage / 100
        );
        event.date = new Date(event.date.getTime() + bufferDays * 24 * 60 * 60 * 1000);
      }
    });
  }

  private initializeEventTemplates(): void {
    // TODO: Load event templates from configuration or database
    logger.info('Event templates initialized');
  }

  /**
   * Get timeline mapping by ID
   */
  public getTimelineMapping(timelineId: string): TimelineMapping | undefined {
    return Array.from(this.timelineCache.values()).find(mapping => mapping.id === timelineId);
  }

  /**
   * Update timeline event status
   */
  public updateEventStatus(timelineId: string, eventId: string, status: EventStatus, progress?: number): boolean {
    const mapping = this.getTimelineMapping(timelineId);
    if (!mapping) return false;

    const event = mapping.timeline.find(e => e.id === eventId);
    if (!event) return false;

    event.status = status;
    if (progress !== undefined) {
      event.completionPercentage = progress;
    }

    mapping.updatedAt = new Date();
    return true;
  }

  /**
   * Get timeline statistics
   */
  public getTimelineStats(): any {
    const mappings = Array.from(this.timelineCache.values());

    return {
      totalMappings: mappings.length,
      averageEventCount: mappings.length > 0
        ? mappings.reduce((sum, m) => sum + m.timeline.length, 0) / mappings.length
        : 0,
      averageDuration: mappings.length > 0
        ? mappings.reduce((sum, m) => sum + this.parseDuration(m.totalDuration), 0) / mappings.length
        : 0,
      statusDistribution: this.calculateStatusDistribution(mappings),
      riskDistribution: this.calculateRiskDistribution(mappings),
    };
  }

  private parseDuration(duration: string): number {
    // Simple duration parsing - in production, use a proper duration library
    const match = duration.match(/(\d+)\s*(days?|weeks?|months?|years?)/);
    if (!match) return 0;

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'day': case 'days': return value;
      case 'week': case 'weeks': return value * 7;
      case 'month': case 'months': return value * 30;
      case 'year': case 'years': return value * 365;
      default: return value;
    }
  }

  private calculateStatusDistribution(mappings: TimelineMapping[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    mappings.forEach(mapping => {
      mapping.timeline.forEach(event => {
        distribution[event.status] = (distribution[event.status] || 0) + 1;
      });
    });

    return distribution;
  }

  private calculateRiskDistribution(mappings: TimelineMapping[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    mappings.forEach(mapping => {
      mapping.riskFactors.forEach(risk => {
        distribution[risk.type] = (distribution[risk.type] || 0) + 1;
      });
    });

    return distribution;
  }

  /**
   * Clear timeline cache
   */
  public clearCache(): void {
    this.timelineCache.clear();
    logger.info('Timeline cache cleared');
  }
}

export default TimelineMapperService;
