/**
 * ImpactAnalysisPanel Component
 * AI-powered regulatory impact analysis with detailed assessments
 */

import React from 'react'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Badge,
  Button,
  LoadingSpinner,
  RiskBadge,
  PriorityBadge
} from '@/components/ui'
import { cn } from '@/lib/utils'

// Types
export interface ImpactAnalysis {
  id: string
  circularId: string
  circularNumber: string
  circularTitle: string
  analysisDate: string
  analysisVersion: string
  aiConfidence: number
  overallImpact: {
    level: 'low' | 'medium' | 'high' | 'critical'
    score: number
    description: string
    reasoning: string[]
  }
  businessImpact: {
    level: 'low' | 'medium' | 'high' | 'critical'
    areas: Array<{
      area: string
      impact: string
      severity: 'low' | 'medium' | 'high' | 'critical'
      description: string
    }>
    financialImpact: {
      estimatedCost: number
      costBreakdown: Array<{
        category: string
        amount: number
        description: string
      }>
      revenueImpact: number
      timeToImplement: string
    }
  }
  technicalImpact: {
    level: 'low' | 'medium' | 'high' | 'critical'
    systems: Array<{
      system: string
      impact: string
      complexity: 'low' | 'medium' | 'high' | 'critical'
      estimatedEffort: string
      dependencies: string[]
    }>
    dataChanges: Array<{
      type: string
      description: string
      complexity: 'low' | 'medium' | 'high' | 'critical'
    }>
    integrationChanges: Array<{
      integration: string
      changes: string
      effort: string
    }>
  }
  complianceImpact: {
    level: 'low' | 'medium' | 'high' | 'critical'
    requirements: Array<{
      requirement: string
      currentStatus: 'compliant' | 'non-compliant' | 'partially-compliant' | 'unknown'
      targetStatus: 'compliant'
      gapAnalysis: string
      actionRequired: string
      deadline?: string
    }>
    riskAssessment: {
      complianceRisk: 'low' | 'medium' | 'high' | 'critical'
      reputationalRisk: 'low' | 'medium' | 'high' | 'critical'
      operationalRisk: 'low' | 'medium' | 'high' | 'critical'
      financialRisk: 'low' | 'medium' | 'high' | 'critical'
    }
  }
  implementationPlan: {
    phases: Array<{
      phase: string
      description: string
      duration: string
      dependencies: string[]
      deliverables: string[]
      resources: string[]
    }>
    timeline: {
      totalDuration: string
      criticalPath: string[]
      milestones: Array<{
        milestone: string
        date: string
        description: string
      }>
    }
    resourceRequirements: {
      teams: string[]
      skills: string[]
      budget: number
      externalSupport: boolean
    }
  }
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low'
    category: 'immediate' | 'short-term' | 'long-term'
    recommendation: string
    rationale: string
    impact: string
    effort: string
  }>
  monitoring: {
    kpis: Array<{
      metric: string
      target: string
      frequency: string
      owner: string
    }>
    checkpoints: Array<{
      checkpoint: string
      date: string
      criteria: string[]
    }>
  }
}

export interface ImpactAnalysisPanelProps {
  analysis?: ImpactAnalysis
  loading?: boolean
  onRefresh?: () => void
  onExport?: (format: 'pdf' | 'excel' | 'json') => void
  onUpdateAnalysis?: (analysisId: string, updates: Partial<ImpactAnalysis>) => void
}

const ImpactAnalysisPanel: React.FC<ImpactAnalysisPanelProps> = ({
  analysis,
  loading = false,
  onRefresh,
  onExport,
  onUpdateAnalysis
}) => {
  const [activeTab, setActiveTab] = React.useState<'overview' | 'business' | 'technical' | 'compliance' | 'implementation' | 'recommendations'>('overview')

  // Mock data for demonstration
  const mockAnalysis: ImpactAnalysis = {
    id: 'analysis_001',
    circularId: 'circular_001',
    circularNumber: 'RBI/2024-25/01',
    circularTitle: 'Guidelines on Digital Lending',
    analysisDate: '2024-01-16T00:00:00Z',
    analysisVersion: '1.2',
    aiConfidence: 0.92,
    overallImpact: {
      level: 'high',
      score: 8.2,
      description: 'Significant impact requiring substantial changes to digital lending processes and systems',
      reasoning: [
        'New KYC requirements affect customer onboarding workflows',
        'Risk assessment frameworks need comprehensive updates',
        'Technology systems require API modifications and database changes',
        'Policy and procedure updates across multiple departments'
      ]
    },
    businessImpact: {
      level: 'high',
      areas: [
        {
          area: 'Customer Onboarding',
          impact: 'Enhanced KYC procedures will increase onboarding time',
          severity: 'high',
          description: 'Additional verification steps and documentation requirements'
        },
        {
          area: 'Risk Management',
          impact: 'New risk assessment criteria and monitoring requirements',
          severity: 'high',
          description: 'Updated risk scoring models and real-time monitoring systems'
        },
        {
          area: 'Operations',
          impact: 'Process changes and staff training requirements',
          severity: 'medium',
          description: 'Updated procedures and training for compliance teams'
        }
      ],
      financialImpact: {
        estimatedCost: 2500000,
        costBreakdown: [
          { category: 'Technology Development', amount: 1500000, description: 'API modifications, database updates, system integrations' },
          { category: 'Process Redesign', amount: 500000, description: 'Workflow analysis and process optimization' },
          { category: 'Training & Change Management', amount: 300000, description: 'Staff training and change management programs' },
          { category: 'Compliance & Legal', amount: 200000, description: 'Legal review and compliance validation' }
        ],
        revenueImpact: -500000,
        timeToImplement: '4-6 months'
      }
    },
    technicalImpact: {
      level: 'high',
      systems: [
        {
          system: 'Customer Onboarding Platform',
          impact: 'Major modifications required for enhanced KYC',
          complexity: 'high',
          estimatedEffort: '3-4 months',
          dependencies: ['Identity Verification Service', 'Document Management System']
        },
        {
          system: 'Risk Assessment Engine',
          impact: 'Algorithm updates and new scoring models',
          complexity: 'high',
          estimatedEffort: '2-3 months',
          dependencies: ['Data Analytics Platform', 'Regulatory Database']
        },
        {
          system: 'Loan Management System',
          impact: 'Integration with new compliance monitoring',
          complexity: 'medium',
          estimatedEffort: '1-2 months',
          dependencies: ['Compliance Monitoring System']
        }
      ],
      dataChanges: [
        {
          type: 'Database Schema',
          description: 'New tables for enhanced KYC data and audit trails',
          complexity: 'medium'
        },
        {
          type: 'API Modifications',
          description: 'Updated endpoints for new verification workflows',
          complexity: 'high'
        }
      ],
      integrationChanges: [
        {
          integration: 'Third-party KYC Providers',
          changes: 'Enhanced verification APIs and data exchange',
          effort: '2-3 weeks'
        },
        {
          integration: 'Regulatory Reporting Systems',
          changes: 'New reporting formats and data points',
          effort: '3-4 weeks'
        }
      ]
    },
    complianceImpact: {
      level: 'critical',
      requirements: [
        {
          requirement: 'Enhanced KYC Verification',
          currentStatus: 'partially-compliant',
          targetStatus: 'compliant',
          gapAnalysis: 'Current KYC process lacks required verification steps',
          actionRequired: 'Implement additional verification layers and documentation',
          deadline: '2024-03-31'
        },
        {
          requirement: 'Real-time Risk Monitoring',
          currentStatus: 'non-compliant',
          targetStatus: 'compliant',
          gapAnalysis: 'No real-time monitoring system in place',
          actionRequired: 'Develop and deploy real-time monitoring capabilities',
          deadline: '2024-03-31'
        }
      ],
      riskAssessment: {
        complianceRisk: 'high',
        reputationalRisk: 'medium',
        operationalRisk: 'high',
        financialRisk: 'high'
      }
    },
    implementationPlan: {
      phases: [
        {
          phase: 'Phase 1: Analysis & Design',
          description: 'Detailed requirements analysis and system design',
          duration: '4-6 weeks',
          dependencies: [],
          deliverables: ['Requirements Document', 'System Design', 'Implementation Plan'],
          resources: ['Business Analysts', 'System Architects', 'Compliance Experts']
        },
        {
          phase: 'Phase 2: Development',
          description: 'System development and integration',
          duration: '12-16 weeks',
          dependencies: ['Phase 1'],
          deliverables: ['Updated Systems', 'API Modifications', 'Database Changes'],
          resources: ['Development Team', 'QA Team', 'DevOps Team']
        },
        {
          phase: 'Phase 3: Testing & Validation',
          description: 'Comprehensive testing and compliance validation',
          duration: '4-6 weeks',
          dependencies: ['Phase 2'],
          deliverables: ['Test Results', 'Compliance Validation', 'Performance Reports'],
          resources: ['QA Team', 'Compliance Team', 'Security Team']
        }
      ],
      timeline: {
        totalDuration: '5-6 months',
        criticalPath: ['Requirements Analysis', 'System Development', 'Integration Testing', 'Compliance Validation'],
        milestones: [
          { milestone: 'Requirements Finalized', date: '2024-02-15', description: 'All requirements documented and approved' },
          { milestone: 'Development Complete', date: '2024-05-15', description: 'All system changes implemented' },
          { milestone: 'Go-Live', date: '2024-06-30', description: 'System deployed and operational' }
        ]
      },
      resourceRequirements: {
        teams: ['Development', 'QA', 'Compliance', 'Operations', 'Security'],
        skills: ['API Development', 'Database Design', 'Compliance Management', 'Risk Assessment'],
        budget: 2500000,
        externalSupport: true
      }
    },
    recommendations: [
      {
        priority: 'high',
        category: 'immediate',
        recommendation: 'Establish project team and governance structure',
        rationale: 'Critical to ensure coordinated implementation across teams',
        impact: 'Enables effective project management and delivery',
        effort: '1-2 weeks'
      },
      {
        priority: 'high',
        category: 'short-term',
        recommendation: 'Begin requirements analysis and system design',
        rationale: 'Foundation for all subsequent development work',
        impact: 'Ensures proper planning and reduces implementation risks',
        effort: '4-6 weeks'
      },
      {
        priority: 'medium',
        category: 'long-term',
        recommendation: 'Develop automated compliance monitoring capabilities',
        rationale: 'Proactive compliance management and risk reduction',
        impact: 'Improved compliance posture and reduced manual effort',
        effort: '3-4 months'
      }
    ],
    monitoring: {
      kpis: [
        { metric: 'KYC Completion Rate', target: '95%', frequency: 'Daily', owner: 'Compliance Team' },
        { metric: 'Risk Assessment Accuracy', target: '90%', frequency: 'Weekly', owner: 'Risk Management' },
        { metric: 'System Availability', target: '99.9%', frequency: 'Real-time', owner: 'IT Operations' }
      ],
      checkpoints: [
        { checkpoint: 'Requirements Review', date: '2024-02-15', criteria: ['All requirements documented', 'Stakeholder approval obtained'] },
        { checkpoint: 'Development Milestone', date: '2024-04-15', criteria: ['Core functionality implemented', 'Integration testing passed'] },
        { checkpoint: 'Go-Live Readiness', date: '2024-06-15', criteria: ['All testing completed', 'Compliance validation passed'] }
      ]
    }
  }

  const displayAnalysis = analysis || mockAnalysis

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-error-600 bg-error-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-warning-600 bg-warning-50'
      case 'low': return 'text-success-600 bg-success-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-error-600 bg-error-50'
      case 'medium': return 'text-warning-600 bg-warning-50'
      case 'low': return 'text-success-600 bg-success-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'business', name: 'Business Impact', icon: '💼' },
    { id: 'technical', name: 'Technical Impact', icon: '⚙️' },
    { id: 'compliance', name: 'Compliance Impact', icon: '📋' },
    { id: 'implementation', name: 'Implementation', icon: '🚀' },
    { id: 'recommendations', name: 'Recommendations', icon: '💡' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Overall Impact Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Impact Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <RiskBadge level={displayAnalysis.overallImpact.level as any} />
                <span className="text-2xl font-bold text-gray-900">
                  {displayAnalysis.overallImpact.score}/10
                </span>
                <Badge variant="outline" className="text-xs">
                  {Math.round(displayAnalysis.aiConfidence * 100)}% AI Confidence
                </Badge>
              </div>
              <p className="text-gray-700 mb-4">{displayAnalysis.overallImpact.description}</p>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Key Reasoning:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {displayAnalysis.overallImpact.reasoning.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Impact Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Business Impact:</span>
                    <RiskBadge level={displayAnalysis.businessImpact.level as any} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Technical Impact:</span>
                    <RiskBadge level={displayAnalysis.technicalImpact.level as any} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Compliance Impact:</span>
                    <RiskBadge level={displayAnalysis.complianceImpact.level as any} />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Financial Impact</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Implementation Cost:</span>
                    <span className="font-medium text-error-600">
                      {formatCurrency(displayAnalysis.businessImpact.financialImpact.estimatedCost)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Revenue Impact:</span>
                    <span className="font-medium text-error-600">
                      {formatCurrency(displayAnalysis.businessImpact.financialImpact.revenueImpact)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time to Implement:</span>
                    <span className="font-medium text-gray-900">
                      {displayAnalysis.businessImpact.financialImpact.timeToImplement}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {displayAnalysis.technicalImpact.systems.length}
              </div>
              <div className="text-sm text-gray-600">Systems Affected</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {displayAnalysis.complianceImpact.requirements.length}
              </div>
              <div className="text-sm text-gray-600">Compliance Requirements</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {displayAnalysis.implementationPlan.phases.length}
              </div>
              <div className="text-sm text-gray-600">Implementation Phases</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {displayAnalysis.recommendations.filter(r => r.priority === 'high').length}
              </div>
              <div className="text-sm text-gray-600">High Priority Actions</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderBusinessImpact = () => (
    <div className="space-y-6">
      {/* Business Areas */}
      <Card>
        <CardHeader>
          <CardTitle>Affected Business Areas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayAnalysis.businessImpact.areas.map((area, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{area.area}</h4>
                  <RiskBadge level={area.severity as any} />
                </div>
                <p className="text-sm text-gray-600 mb-2">{area.impact}</p>
                <p className="text-xs text-gray-500">{area.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial Impact */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Impact Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Cost Breakdown</h4>
              <div className="space-y-3">
                {displayAnalysis.businessImpact.financialImpact.costBreakdown.map((cost, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{cost.category}</div>
                      <div className="text-xs text-gray-500">{cost.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{formatCurrency(cost.amount)}</div>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between font-semibold text-gray-900">
                    <span>Total Implementation Cost</span>
                    <span className="text-error-600">
                      {formatCurrency(displayAnalysis.businessImpact.financialImpact.estimatedCost)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Impact Summary</h4>
              <div className="space-y-3">
                <div className="p-3 bg-error-50 rounded-lg">
                  <div className="text-sm font-medium text-error-800">Revenue Impact</div>
                  <div className="text-lg font-bold text-error-900">
                    {formatCurrency(displayAnalysis.businessImpact.financialImpact.revenueImpact)}
                  </div>
                  <div className="text-xs text-error-600">Potential revenue loss during implementation</div>
                </div>
                <div className="p-3 bg-warning-50 rounded-lg">
                  <div className="text-sm font-medium text-warning-800">Implementation Timeline</div>
                  <div className="text-lg font-bold text-warning-900">
                    {displayAnalysis.businessImpact.financialImpact.timeToImplement}
                  </div>
                  <div className="text-xs text-warning-600">Estimated time for full implementation</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderTechnicalImpact = () => (
    <div className="space-y-6">
      {/* Systems Impact */}
      <Card>
        <CardHeader>
          <CardTitle>System Impact Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayAnalysis.technicalImpact.systems.map((system, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{system.system}</h4>
                  <div className="flex items-center gap-2">
                    <RiskBadge level={system.complexity as any} />
                    <Badge variant="outline" className="text-xs">
                      {system.estimatedEffort}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{system.impact}</p>
                {system.dependencies.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-gray-500">Dependencies:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {system.dependencies.map((dep, depIndex) => (
                        <Badge key={depIndex} variant="secondary" className="text-xs">
                          {dep}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Changes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Data Changes Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {displayAnalysis.technicalImpact.dataChanges.map((change, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{change.type}</span>
                    <RiskBadge level={change.complexity as any} />
                  </div>
                  <p className="text-sm text-gray-600">{change.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integration Changes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {displayAnalysis.technicalImpact.integrationChanges.map((integration, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{integration.integration}</span>
                    <Badge variant="outline" className="text-xs">
                      {integration.effort}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{integration.changes}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderComplianceImpact = () => (
    <div className="space-y-6">
      {/* Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="mb-2">
                <RiskBadge level={displayAnalysis.complianceImpact.riskAssessment.complianceRisk as any} />
              </div>
              <div className="text-sm font-medium text-gray-900">Compliance Risk</div>
            </div>
            <div className="text-center">
              <div className="mb-2">
                <RiskBadge level={displayAnalysis.complianceImpact.riskAssessment.reputationalRisk as any} />
              </div>
              <div className="text-sm font-medium text-gray-900">Reputational Risk</div>
            </div>
            <div className="text-center">
              <div className="mb-2">
                <RiskBadge level={displayAnalysis.complianceImpact.riskAssessment.operationalRisk as any} />
              </div>
              <div className="text-sm font-medium text-gray-900">Operational Risk</div>
            </div>
            <div className="text-center">
              <div className="mb-2">
                <RiskBadge level={displayAnalysis.complianceImpact.riskAssessment.financialRisk as any} />
              </div>
              <div className="text-sm font-medium text-gray-900">Financial Risk</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayAnalysis.complianceImpact.requirements.map((req, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{req.requirement}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant={req.currentStatus === 'compliant' ? 'success' : 'destructive'}>
                      {req.currentStatus.replace('-', ' ')}
                    </Badge>
                    {req.deadline && (
                      <Badge variant="outline" className="text-xs">
                        Due: {formatDate(req.deadline)}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Gap Analysis:</span>
                    <p className="text-gray-600 mt-1">{req.gapAnalysis}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Action Required:</span>
                    <p className="text-gray-600 mt-1">{req.actionRequired}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderImplementation = () => (
    <div className="space-y-6">
      {/* Implementation Phases */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Phases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayAnalysis.implementationPlan.phases.map((phase, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{phase.phase}</h4>
                  <Badge variant="outline">{phase.duration}</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{phase.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Deliverables:</span>
                    <ul className="list-disc list-inside text-gray-600 mt-1">
                      {phase.deliverables.map((deliverable, delIndex) => (
                        <li key={delIndex}>{deliverable}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Resources:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {phase.resources.map((resource, resIndex) => (
                        <Badge key={resIndex} variant="secondary" className="text-xs">
                          {resource}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Dependencies:</span>
                    <div className="text-gray-600 mt-1">
                      {phase.dependencies.length > 0 ? phase.dependencies.join(', ') : 'None'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timeline & Milestones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Timeline Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Total Duration:</span>
                <p className="text-lg font-semibold text-gray-900">
                  {displayAnalysis.implementationPlan.timeline.totalDuration}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Critical Path:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {displayAnalysis.implementationPlan.timeline.criticalPath.map((item, index) => (
                    <Badge key={index} variant="destructive" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {displayAnalysis.implementationPlan.timeline.milestones.map((milestone, index) => (
                <div key={index} className="border-l-4 border-brand-500 pl-3">
                  <div className="font-medium text-gray-900">{milestone.milestone}</div>
                  <div className="text-sm text-gray-600">{formatDate(milestone.date)}</div>
                  <div className="text-xs text-gray-500">{milestone.description}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderRecommendations = () => (
    <div className="space-y-6">
      {/* Recommendations by Category */}
      {['immediate', 'short-term', 'long-term'].map((category) => {
        const categoryRecommendations = displayAnalysis.recommendations.filter(r => r.category === category)
        if (categoryRecommendations.length === 0) return null

        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="capitalize">{category.replace('-', ' ')} Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryRecommendations.map((rec, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{rec.recommendation}</h4>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority} priority
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {rec.effort}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Rationale:</span>
                        <p className="text-gray-600 mt-1">{rec.rationale}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Expected Impact:</span>
                        <p className="text-gray-600 mt-1">{rec.impact}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Monitoring & KPIs */}
      <Card>
        <CardHeader>
          <CardTitle>Monitoring & KPIs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Key Performance Indicators</h4>
              <div className="space-y-3">
                {displayAnalysis.monitoring.kpis.map((kpi, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{kpi.metric}</span>
                      <Badge variant="outline" className="text-xs">{kpi.target}</Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      {kpi.frequency} | Owner: {kpi.owner}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Review Checkpoints</h4>
              <div className="space-y-3">
                {displayAnalysis.monitoring.checkpoints.map((checkpoint, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="font-medium text-gray-900">{checkpoint.checkpoint}</div>
                    <div className="text-sm text-gray-600">{formatDate(checkpoint.date)}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Criteria: {checkpoint.criteria.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Impact Analysis</h2>
          <p className="text-sm text-gray-600">
            {displayAnalysis.circularNumber} - {displayAnalysis.circularTitle}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              Analysis v{displayAnalysis.analysisVersion}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {formatDate(displayAnalysis.analysisDate)}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onExport?.('pdf')}>
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => onExport?.('excel')}>
            Export Excel
          </Button>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <span>{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'business' && renderBusinessImpact()}
        {activeTab === 'technical' && renderTechnicalImpact()}
        {activeTab === 'compliance' && renderComplianceImpact()}
        {activeTab === 'implementation' && renderImplementation()}
        {activeTab === 'recommendations' && renderRecommendations()}
      </div>
    </div>
  )
}

export default ImpactAnalysisPanel
