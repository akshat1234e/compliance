/**
 * Impact Assessment Service
 * AI-powered engine to assess regulatory impact on financial institutions
 */

import { logger, loggers } from '@utils/logger';
import { config } from '@config/index';
import { ParsedCircular } from './circularParserService';

export interface ImpactAssessmentRequest {
  circularId: string;
  organizationId: string;
  organizationType: 'bank' | 'nbfc' | 'cooperative_bank' | 'payment_bank' | 'small_finance_bank';
  organizationProfile: OrganizationProfile;
  analysisType: 'basic' | 'detailed' | 'comprehensive';
  includeRecommendations: boolean;
  includeTimeline: boolean;
  includeCostEstimate: boolean;
}

export interface OrganizationProfile {
  id: string;
  name: string;
  type: string;
  size: 'small' | 'medium' | 'large' | 'very_large';
  assetSize: number;
  customerBase: number;
  geographicPresence: string[];
  businessLines: string[];
  currentComplianceMaturity: number; // 1-10 scale
  riskAppetite: 'conservative' | 'moderate' | 'aggressive';
  technologyMaturity: number; // 1-10 scale
  complianceTeamSize: number;
  previousViolations: number;
  lastAuditScore: number;
}

export interface ImpactAssessment {
  id: string;
  circularId: string;
  organizationId: string;
  assessmentType: string;
  overallImpact: ImpactScore;
  impactAreas: ImpactArea[];
  timeline: ImplementationTimeline;
  recommendations: Recommendation[];
  riskAssessment: RiskAssessment;
  costEstimate?: CostEstimate;
  complianceGap: ComplianceGap;
  confidence: number;
  assessedAt: string;
  assessedBy: string;
  validUntil: string;
}

export interface ImpactScore {
  overall: number; // 1-10 scale
  level: 'minimal' | 'low' | 'medium' | 'high' | 'critical';
  factors: {
    operational: number;
    financial: number;
    regulatory: number;
    reputational: number;
    strategic: number;
  };
  reasoning: string;
}

export interface ImpactArea {
  area: string;
  subArea?: string;
  impactScore: number;
  description: string;
  affectedProcesses: string[];
  requiredChanges: string[];
  estimatedEffort: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
}

export interface ImplementationTimeline {
  phases: ImplementationPhase[];
  totalDuration: string;
  criticalPath: string[];
  milestones: Milestone[];
  dependencies: Dependency[];
}

export interface ImplementationPhase {
  phase: string;
  description: string;
  duration: string;
  startDate?: string;
  endDate?: string;
  deliverables: string[];
  resources: string[];
  risks: string[];
}

export interface Milestone {
  name: string;
  description: string;
  targetDate: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
}

export interface Dependency {
  type: 'internal' | 'external' | 'regulatory';
  description: string;
  impact: string;
  mitigation: string;
}

export interface Recommendation {
  id: string;
  category: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  rationale: string;
  estimatedEffort: string;
  estimatedCost?: number;
  owner: string;
  timeline: string;
  dependencies: string[];
  risks: string[];
  benefits: string[];
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  mitigationStrategies: MitigationStrategy[];
  residualRisk: string;
  monitoringRequirements: string[];
}

export interface RiskFactor {
  type: 'compliance' | 'operational' | 'financial' | 'reputational' | 'strategic';
  description: string;
  probability: number; // 1-10 scale
  impact: number; // 1-10 scale
  riskScore: number;
  mitigation: string;
}

export interface MitigationStrategy {
  strategy: string;
  description: string;
  effectiveness: number; // 1-10 scale
  cost: 'low' | 'medium' | 'high';
  timeline: string;
  owner: string;
}

export interface CostEstimate {
  totalCost: number;
  currency: string;
  breakdown: CostBreakdown;
  assumptions: string[];
  confidence: number;
}

export interface CostBreakdown {
  implementation: number;
  training: number;
  technology: number;
  consulting: number;
  ongoing: number;
  contingency: number;
}

export interface ComplianceGap {
  currentState: string;
  requiredState: string;
  gaps: Gap[];
  gapScore: number; // 1-10 scale
  closureTimeline: string;
}

export interface Gap {
  area: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  effort: string;
  cost?: number;
}

export class ImpactAssessmentService {
  private assessmentCache: Map<string, ImpactAssessment> = new Map();

  constructor() {
    logger.info('Impact Assessment Service initialized');
  }

  /**
   * Assess regulatory impact on an organization
   */
  public async assessImpact(
    request: ImpactAssessmentRequest,
    parsedCircular?: ParsedCircular
  ): Promise<ImpactAssessment> {
    const startTime = Date.now();

    try {
      loggers.business('impact_assessment_started', {
        circularId: request.circularId,
        organizationId: request.organizationId,
        analysisType: request.analysisType,
      });

      // Generate assessment ID
      const assessmentId = this.generateAssessmentId(request);

      // Check cache first
      if (this.assessmentCache.has(assessmentId)) {
        logger.info('Returning cached impact assessment', { assessmentId });
        return this.assessmentCache.get(assessmentId)!;
      }

      // Perform impact assessment
      const assessment = await this.performAssessment(request, parsedCircular);

      // Cache the result
      this.assessmentCache.set(assessmentId, assessment);

      const processingTime = Date.now() - startTime;

      loggers.business('impact_assessment_completed', {
        assessmentId,
        circularId: request.circularId,
        organizationId: request.organizationId,
        overallImpact: assessment.overallImpact.level,
        confidence: assessment.confidence,
        processingTime: `${processingTime}ms`,
      });

      return assessment;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      loggers.business('impact_assessment_failed', {
        circularId: request.circularId,
        organizationId: request.organizationId,
        processingTime: `${processingTime}ms`,
        error: (error as Error).message,
      }, error as Error);

      throw error;
    }
  }

  /**
   * Perform the actual impact assessment
   */
  private async performAssessment(
    request: ImpactAssessmentRequest,
    parsedCircular?: ParsedCircular
  ): Promise<ImpactAssessment> {
    
    // Calculate overall impact score
    const overallImpact = this.calculateOverallImpact(request, parsedCircular);

    // Analyze impact areas
    const impactAreas = this.analyzeImpactAreas(request, parsedCircular);

    // Generate implementation timeline
    const timeline = this.generateImplementationTimeline(request, impactAreas);

    // Generate recommendations
    const recommendations = this.generateRecommendations(request, impactAreas);

    // Assess risks
    const riskAssessment = this.assessRisks(request, impactAreas);

    // Estimate costs (if requested)
    const costEstimate = request.includeCostEstimate 
      ? this.estimateCosts(request, impactAreas) 
      : undefined;

    // Analyze compliance gap
    const complianceGap = this.analyzeComplianceGap(request, parsedCircular);

    // Calculate confidence score
    const confidence = this.calculateConfidence(request, parsedCircular);

    const assessment: ImpactAssessment = {
      id: this.generateAssessmentId(request),
      circularId: request.circularId,
      organizationId: request.organizationId,
      assessmentType: request.analysisType,
      overallImpact,
      impactAreas,
      timeline,
      recommendations,
      riskAssessment,
      costEstimate,
      complianceGap,
      confidence,
      assessedAt: new Date().toISOString(),
      assessedBy: 'AI Impact Assessment Engine',
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
    };

    return assessment;
  }

  /**
   * Calculate overall impact score
   */
  private calculateOverallImpact(
    request: ImpactAssessmentRequest,
    parsedCircular?: ParsedCircular
  ): ImpactScore {
    let operationalScore = 5; // Base score
    let financialScore = 5;
    let regulatoryScore = 5;
    let reputationalScore = 5;
    let strategicScore = 5;

    // Adjust based on circular content
    if (parsedCircular) {
      // Impact based on circular category
      switch (parsedCircular.metadata.category) {
        case 'Capital Adequacy':
          financialScore += 2;
          regulatoryScore += 3;
          break;
        case 'Risk Management':
          operationalScore += 2;
          regulatoryScore += 2;
          break;
        case 'KYC/AML':
          operationalScore += 3;
          reputationalScore += 2;
          break;
        case 'Cyber Security':
          operationalScore += 3;
          reputationalScore += 3;
          break;
      }

      // Impact based on circular impact level
      const multiplier = this.getImpactMultiplier(parsedCircular.metadata.impactLevel);
      operationalScore *= multiplier;
      financialScore *= multiplier;
      regulatoryScore *= multiplier;
      reputationalScore *= multiplier;
      strategicScore *= multiplier;

      // Impact based on requirements count
      const requirementsCount = parsedCircular.content.requirements.length;
      if (requirementsCount > 5) {
        operationalScore += 1;
        regulatoryScore += 1;
      }
    }

    // Adjust based on organization profile
    const profile = request.organizationProfile;
    
    // Size adjustment
    const sizeMultiplier = this.getSizeMultiplier(profile.size);
    operationalScore *= sizeMultiplier;
    financialScore *= sizeMultiplier;

    // Compliance maturity adjustment
    const maturityAdjustment = (10 - profile.currentComplianceMaturity) / 10;
    operationalScore += maturityAdjustment;
    regulatoryScore += maturityAdjustment;

    // Technology maturity adjustment
    const techAdjustment = (10 - profile.technologyMaturity) / 10;
    operationalScore += techAdjustment;

    // Normalize scores (1-10 scale)
    operationalScore = Math.min(Math.max(operationalScore, 1), 10);
    financialScore = Math.min(Math.max(financialScore, 1), 10);
    regulatoryScore = Math.min(Math.max(regulatoryScore, 1), 10);
    reputationalScore = Math.min(Math.max(reputationalScore, 1), 10);
    strategicScore = Math.min(Math.max(strategicScore, 1), 10);

    // Calculate overall score (weighted average)
    const overall = (
      operationalScore * 0.3 +
      financialScore * 0.2 +
      regulatoryScore * 0.3 +
      reputationalScore * 0.1 +
      strategicScore * 0.1
    );

    const level = this.getImpactLevel(overall);

    return {
      overall: Math.round(overall * 10) / 10,
      level,
      factors: {
        operational: Math.round(operationalScore * 10) / 10,
        financial: Math.round(financialScore * 10) / 10,
        regulatory: Math.round(regulatoryScore * 10) / 10,
        reputational: Math.round(reputationalScore * 10) / 10,
        strategic: Math.round(strategicScore * 10) / 10,
      },
      reasoning: this.generateImpactReasoning(level, parsedCircular, request.organizationProfile),
    };
  }

  /**
   * Analyze specific impact areas
   */
  private analyzeImpactAreas(
    request: ImpactAssessmentRequest,
    parsedCircular?: ParsedCircular
  ): ImpactArea[] {
    const areas: ImpactArea[] = [];

    // Standard impact areas based on organization type
    const standardAreas = this.getStandardImpactAreas(request.organizationType);

    standardAreas.forEach(area => {
      const impactScore = this.calculateAreaImpact(area, request, parsedCircular);
      
      if (impactScore > 3) { // Only include areas with meaningful impact
        areas.push({
          area: area.name,
          subArea: area.subArea,
          impactScore,
          description: area.description,
          affectedProcesses: area.processes,
          requiredChanges: this.generateRequiredChanges(area, parsedCircular),
          estimatedEffort: this.estimateEffort(impactScore, request.organizationProfile.size),
          priority: this.determinePriority(impactScore),
          dependencies: area.dependencies,
        });
      }
    });

    return areas.sort((a, b) => b.impactScore - a.impactScore);
  }

  // Helper methods
  private generateAssessmentId(request: ImpactAssessmentRequest): string {
    return `assessment_${request.circularId}_${request.organizationId}_${Date.now()}`;
  }

  private getImpactMultiplier(level: string): number {
    switch (level) {
      case 'critical': return 1.5;
      case 'high': return 1.3;
      case 'medium': return 1.1;
      case 'low': return 0.9;
      default: return 1.0;
    }
  }

  private getSizeMultiplier(size: string): number {
    switch (size) {
      case 'very_large': return 1.3;
      case 'large': return 1.2;
      case 'medium': return 1.0;
      case 'small': return 0.8;
      default: return 1.0;
    }
  }

  private getImpactLevel(score: number): 'minimal' | 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 8.5) return 'critical';
    if (score >= 7.0) return 'high';
    if (score >= 5.0) return 'medium';
    if (score >= 3.0) return 'low';
    return 'minimal';
  }

  private generateImpactReasoning(
    level: string,
    parsedCircular?: ParsedCircular,
    profile?: OrganizationProfile
  ): string {
    let reasoning = `Impact assessed as ${level} based on `;
    
    if (parsedCircular) {
      reasoning += `circular category (${parsedCircular.metadata.category}), `;
      reasoning += `impact level (${parsedCircular.metadata.impactLevel}), `;
      reasoning += `and ${parsedCircular.content.requirements.length} compliance requirements. `;
    }
    
    if (profile) {
      reasoning += `Organization factors include ${profile.size} size, `;
      reasoning += `compliance maturity (${profile.currentComplianceMaturity}/10), `;
      reasoning += `and technology readiness (${profile.technologyMaturity}/10).`;
    }
    
    return reasoning;
  }

  private getStandardImpactAreas(orgType: string): any[] {
    // Simplified standard areas - in real implementation, this would be more comprehensive
    return [
      {
        name: 'Capital Management',
        subArea: 'Capital Adequacy',
        description: 'Impact on capital planning and adequacy ratios',
        processes: ['Capital planning', 'Risk assessment', 'Regulatory reporting'],
        dependencies: ['Risk Management', 'Finance'],
      },
      {
        name: 'Risk Management',
        subArea: 'Operational Risk',
        description: 'Impact on risk management frameworks and processes',
        processes: ['Risk identification', 'Risk assessment', 'Risk monitoring'],
        dependencies: ['Compliance', 'Operations'],
      },
      {
        name: 'Compliance Operations',
        subArea: 'Regulatory Compliance',
        description: 'Impact on compliance monitoring and reporting',
        processes: ['Compliance monitoring', 'Regulatory reporting', 'Audit management'],
        dependencies: ['Legal', 'Operations'],
      },
    ];
  }

  private calculateAreaImpact(area: any, request: ImpactAssessmentRequest, parsedCircular?: ParsedCircular): number {
    // Simplified calculation - in real implementation, this would use ML models
    let score = 5; // Base score
    
    if (parsedCircular) {
      // Increase score based on relevance to area
      if (area.name.toLowerCase().includes(parsedCircular.metadata.category.toLowerCase())) {
        score += 2;
      }
    }
    
    return Math.min(score, 10);
  }

  private generateRequiredChanges(area: any, parsedCircular?: ParsedCircular): string[] {
    // Simplified - in real implementation, this would be more sophisticated
    return ['Update policies and procedures', 'Enhance monitoring systems', 'Train staff'];
  }

  private estimateEffort(impactScore: number, orgSize: string): string {
    const baseEffort = impactScore > 7 ? 'High' : impactScore > 5 ? 'Medium' : 'Low';
    const sizeMultiplier = orgSize === 'large' || orgSize === 'very_large' ? ' (Extended)' : '';
    return baseEffort + sizeMultiplier;
  }

  private determinePriority(impactScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (impactScore >= 8) return 'critical';
    if (impactScore >= 6) return 'high';
    if (impactScore >= 4) return 'medium';
    return 'low';
  }

  private generateImplementationTimeline(request: ImpactAssessmentRequest, areas: ImpactArea[]): ImplementationTimeline {
    // Simplified timeline generation
    return {
      phases: [
        {
          phase: 'Assessment & Planning',
          description: 'Detailed impact assessment and implementation planning',
          duration: '2-4 weeks',
          deliverables: ['Impact assessment report', 'Implementation plan'],
          resources: ['Compliance team', 'Project manager'],
          risks: ['Resource availability', 'Stakeholder alignment'],
        },
        {
          phase: 'Implementation',
          description: 'Execute required changes and updates',
          duration: '8-12 weeks',
          deliverables: ['Updated policies', 'System changes', 'Training materials'],
          resources: ['IT team', 'Compliance team', 'Business units'],
          risks: ['Technical complexity', 'Change resistance'],
        },
        {
          phase: 'Testing & Validation',
          description: 'Test changes and validate compliance',
          duration: '2-3 weeks',
          deliverables: ['Test results', 'Compliance validation'],
          resources: ['QA team', 'Compliance team'],
          risks: ['Test failures', 'Compliance gaps'],
        },
      ],
      totalDuration: '12-19 weeks',
      criticalPath: ['Assessment & Planning', 'Implementation'],
      milestones: [
        {
          name: 'Implementation Plan Approved',
          description: 'Detailed implementation plan approved by stakeholders',
          targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          criticality: 'high',
          dependencies: ['Assessment & Planning'],
        },
      ],
      dependencies: [
        {
          type: 'internal',
          description: 'IT system availability for changes',
          impact: 'May delay implementation phase',
          mitigation: 'Schedule changes during maintenance windows',
        },
      ],
    };
  }

  private generateRecommendations(request: ImpactAssessmentRequest, areas: ImpactArea[]): Recommendation[] {
    // Simplified recommendation generation
    return [
      {
        id: 'rec_001',
        category: 'immediate',
        priority: 'high',
        title: 'Establish Implementation Team',
        description: 'Form a cross-functional team to manage the regulatory implementation',
        rationale: 'Ensures coordinated approach and clear accountability',
        estimatedEffort: '1 week',
        estimatedCost: 50000,
        owner: 'Compliance Head',
        timeline: '1 week',
        dependencies: ['Management approval'],
        risks: ['Resource availability'],
        benefits: ['Coordinated implementation', 'Clear accountability'],
      },
    ];
  }

  private assessRisks(request: ImpactAssessmentRequest, areas: ImpactArea[]): RiskAssessment {
    // Simplified risk assessment
    return {
      overallRisk: 'medium',
      riskFactors: [
        {
          type: 'compliance',
          description: 'Risk of non-compliance with new requirements',
          probability: 6,
          impact: 8,
          riskScore: 48,
          mitigation: 'Implement robust monitoring and testing procedures',
        },
      ],
      mitigationStrategies: [
        {
          strategy: 'Phased Implementation',
          description: 'Implement changes in phases to reduce risk',
          effectiveness: 8,
          cost: 'medium',
          timeline: '12 weeks',
          owner: 'Project Manager',
        },
      ],
      residualRisk: 'Low to medium risk after implementing mitigation strategies',
      monitoringRequirements: ['Weekly progress reviews', 'Compliance testing'],
    };
  }

  private estimateCosts(request: ImpactAssessmentRequest, areas: ImpactArea[]): CostEstimate {
    // Simplified cost estimation
    const baseCost = areas.reduce((total, area) => total + (area.impactScore * 10000), 0);
    
    return {
      totalCost: baseCost,
      currency: 'INR',
      breakdown: {
        implementation: baseCost * 0.4,
        training: baseCost * 0.15,
        technology: baseCost * 0.25,
        consulting: baseCost * 0.1,
        ongoing: baseCost * 0.05,
        contingency: baseCost * 0.05,
      },
      assumptions: [
        'Based on similar regulatory implementations',
        'Assumes existing technology infrastructure',
        'Includes 5% contingency buffer',
      ],
      confidence: 0.75,
    };
  }

  private analyzeComplianceGap(request: ImpactAssessmentRequest, parsedCircular?: ParsedCircular): ComplianceGap {
    // Simplified gap analysis
    return {
      currentState: 'Partially compliant with existing regulations',
      requiredState: 'Full compliance with new regulatory requirements',
      gaps: [
        {
          area: 'Policy Updates',
          description: 'Policies need to be updated to reflect new requirements',
          severity: 'medium',
          effort: '4-6 weeks',
          cost: 25000,
        },
      ],
      gapScore: 6.5,
      closureTimeline: '12-16 weeks',
    };
  }

  private calculateConfidence(request: ImpactAssessmentRequest, parsedCircular?: ParsedCircular): number {
    let confidence = 0.7; // Base confidence
    
    if (parsedCircular && parsedCircular.confidence > 0.8) {
      confidence += 0.1;
    }
    
    if (request.analysisType === 'comprehensive') {
      confidence += 0.1;
    }
    
    if (request.organizationProfile.currentComplianceMaturity > 7) {
      confidence += 0.05;
    }
    
    return Math.min(confidence, 0.95);
  }

  /**
   * Get cached assessment
   */
  public getCachedAssessment(assessmentId: string): ImpactAssessment | undefined {
    return this.assessmentCache.get(assessmentId);
  }

  /**
   * Clear assessment cache
   */
  public clearCache(): void {
    this.assessmentCache.clear();
    logger.info('Impact assessment cache cleared');
  }
}

export default ImpactAssessmentService;
