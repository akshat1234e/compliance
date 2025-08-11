/**
 * RiskHeatmap Component
 * Create interactive risk heatmap with drill-down capabilities
 */

import React from 'react'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Badge,
  Button,
  Modal,
  LoadingSpinner
} from '@/components/ui'
import { cn } from '@/lib/utils'

// Types
export interface RiskItem {
  id: string
  category: string
  subcategory: string
  title: string
  description: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskScore: number
  probability: number
  impact: number
  lastAssessed: string
  owner: string
  mitigationStatus: 'none' | 'planned' | 'in_progress' | 'implemented'
  mitigationActions: Array<{
    id: string
    action: string
    status: 'pending' | 'in_progress' | 'completed'
    dueDate: string
    assignee: string
  }>
  relatedRegulations: string[]
  trend: 'increasing' | 'stable' | 'decreasing'
  trendValue: number
}

export interface RiskCategory {
  id: string
  name: string
  description: string
  totalRisks: number
  averageRiskScore: number
  highRiskCount: number
  criticalRiskCount: number
  subcategories: Array<{
    id: string
    name: string
    riskCount: number
    averageScore: number
  }>
}

export interface RiskHeatmapProps {
  categories?: RiskCategory[]
  risks?: RiskItem[]
  loading?: boolean
  onCategoryClick?: (category: RiskCategory) => void
  onRiskClick?: (risk: RiskItem) => void
  onRefresh?: () => void
  viewMode?: 'category' | 'detailed'
}

const RiskHeatmap: React.FC<RiskHeatmapProps> = ({
  categories,
  risks,
  loading = false,
  onCategoryClick,
  onRiskClick,
  onRefresh,
  viewMode = 'category'
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState<RiskCategory | null>(null)
  const [selectedRisk, setSelectedRisk] = React.useState<RiskItem | null>(null)
  const [currentViewMode, setCurrentViewMode] = React.useState(viewMode)

  // Mock data for demonstration
  const mockCategories: RiskCategory[] = [
    {
      id: 'operational',
      name: 'Operational Risk',
      description: 'Risks arising from internal processes, people, and systems',
      totalRisks: 24,
      averageRiskScore: 6.8,
      highRiskCount: 5,
      criticalRiskCount: 2,
      subcategories: [
        { id: 'process', name: 'Process Risk', riskCount: 8, averageScore: 7.2 },
        { id: 'technology', name: 'Technology Risk', riskCount: 10, averageScore: 6.5 },
        { id: 'people', name: 'People Risk', riskCount: 6, averageScore: 6.8 }
      ]
    },
    {
      id: 'compliance',
      name: 'Compliance Risk',
      description: 'Risks related to regulatory compliance and legal requirements',
      totalRisks: 18,
      averageRiskScore: 7.5,
      highRiskCount: 8,
      criticalRiskCount: 3,
      subcategories: [
        { id: 'regulatory', name: 'Regulatory Risk', riskCount: 12, averageScore: 8.1 },
        { id: 'legal', name: 'Legal Risk', riskCount: 6, averageScore: 6.3 }
      ]
    },
    {
      id: 'credit',
      name: 'Credit Risk',
      description: 'Risks related to borrower default and credit losses',
      totalRisks: 15,
      averageRiskScore: 5.9,
      highRiskCount: 3,
      criticalRiskCount: 1,
      subcategories: [
        { id: 'retail', name: 'Retail Credit', riskCount: 8, averageScore: 5.5 },
        { id: 'corporate', name: 'Corporate Credit', riskCount: 7, averageScore: 6.4 }
      ]
    },
    {
      id: 'market',
      name: 'Market Risk',
      description: 'Risks from market movements and volatility',
      totalRisks: 12,
      averageRiskScore: 6.2,
      highRiskCount: 4,
      criticalRiskCount: 1,
      subcategories: [
        { id: 'interest_rate', name: 'Interest Rate Risk', riskCount: 6, averageScore: 6.8 },
        { id: 'fx', name: 'Foreign Exchange Risk', riskCount: 6, averageScore: 5.6 }
      ]
    },
    {
      id: 'liquidity',
      name: 'Liquidity Risk',
      description: 'Risks related to funding and liquidity management',
      totalRisks: 8,
      averageRiskScore: 5.4,
      highRiskCount: 2,
      criticalRiskCount: 0,
      subcategories: [
        { id: 'funding', name: 'Funding Risk', riskCount: 4, averageScore: 5.8 },
        { id: 'asset', name: 'Asset Liquidity Risk', riskCount: 4, averageScore: 5.0 }
      ]
    },
    {
      id: 'cyber',
      name: 'Cyber Security Risk',
      description: 'Risks related to cyber threats and data security',
      totalRisks: 16,
      averageRiskScore: 8.1,
      highRiskCount: 9,
      criticalRiskCount: 4,
      subcategories: [
        { id: 'data_breach', name: 'Data Breach Risk', riskCount: 8, averageScore: 8.5 },
        { id: 'system_attack', name: 'System Attack Risk', riskCount: 8, averageScore: 7.7 }
      ]
    }
  ]

  const mockRisks: RiskItem[] = [
    {
      id: 'risk_001',
      category: 'compliance',
      subcategory: 'regulatory',
      title: 'RBI Digital Lending Compliance Gap',
      description: 'Non-compliance with new RBI digital lending guidelines',
      riskLevel: 'critical',
      riskScore: 9.2,
      probability: 0.8,
      impact: 0.95,
      lastAssessed: '2024-01-15T00:00:00Z',
      owner: 'Compliance Team',
      mitigationStatus: 'in_progress',
      mitigationActions: [
        {
          id: 'action_001',
          action: 'Update lending policies',
          status: 'in_progress',
          dueDate: '2024-02-15',
          assignee: 'Policy Team'
        },
        {
          id: 'action_002',
          action: 'Implement new KYC procedures',
          status: 'pending',
          dueDate: '2024-03-01',
          assignee: 'Operations Team'
        }
      ],
      relatedRegulations: ['RBI/2024-25/01'],
      trend: 'increasing',
      trendValue: 0.5
    },
    {
      id: 'risk_002',
      category: 'cyber',
      subcategory: 'data_breach',
      title: 'Customer Data Exposure Risk',
      description: 'Potential exposure of customer PII through API vulnerabilities',
      riskLevel: 'high',
      riskScore: 8.1,
      probability: 0.6,
      impact: 0.9,
      lastAssessed: '2024-01-14T00:00:00Z',
      owner: 'IT Security Team',
      mitigationStatus: 'planned',
      mitigationActions: [
        {
          id: 'action_003',
          action: 'API security audit',
          status: 'pending',
          dueDate: '2024-01-30',
          assignee: 'Security Team'
        }
      ],
      relatedRegulations: ['GDPR', 'RBI Data Protection'],
      trend: 'stable',
      trendValue: 0.0
    }
  ]

  const displayCategories = categories || mockCategories
  const displayRisks = risks || mockRisks

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-error-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-warning-500'
      case 'low': return 'bg-success-500'
      default: return 'bg-gray-400'
    }
  }

  const getRiskScoreColor = (score: number) => {
    if (score >= 8) return 'text-error-600 bg-error-50'
    if (score >= 6) return 'text-orange-600 bg-orange-50'
    if (score >= 4) return 'text-warning-600 bg-warning-50'
    return 'text-success-600 bg-success-50'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return (
          <svg className="w-4 h-4 text-error-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        )
      case 'decreasing':
        return (
          <svg className="w-4 h-4 text-success-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleCategoryClick = (category: RiskCategory) => {
    setSelectedCategory(category)
    onCategoryClick?.(category)
  }

  const handleRiskClick = (risk: RiskItem) => {
    setSelectedRisk(risk)
    onRiskClick?.(risk)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Risk Heatmap</h2>
          <p className="text-sm text-gray-600">
            Interactive risk assessment and monitoring dashboard
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setCurrentViewMode('category')}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors',
                currentViewMode === 'category' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Category View
            </button>
            <button
              onClick={() => setCurrentViewMode('detailed')}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors',
                currentViewMode === 'detailed' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Detailed View
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>
      </div>

      {/* Risk Level Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Risk Levels:</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-success-500"></div>
                <span className="text-xs text-gray-600">Low (0-4)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-warning-500"></div>
                <span className="text-xs text-gray-600">Medium (4-6)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-orange-500"></div>
                <span className="text-xs text-gray-600">High (6-8)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-error-500"></div>
                <span className="text-xs text-gray-600">Critical (8-10)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category View */}
      {currentViewMode === 'category' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayCategories.map((category) => (
            <Card
              key={category.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleCategoryClick(category)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {category.name}
                  <Badge className={getRiskScoreColor(category.averageRiskScore)}>
                    {category.averageRiskScore.toFixed(1)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-xs text-gray-500">Total Risks</span>
                    <p className="text-lg font-semibold text-gray-900">{category.totalRisks}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">High/Critical</span>
                    <p className="text-lg font-semibold text-error-600">
                      {category.highRiskCount + category.criticalRiskCount}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {category.subcategories.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{sub.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900">{sub.riskCount}</span>
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          getRiskLevelColor(
                            sub.averageScore >= 8 ? 'critical' :
                            sub.averageScore >= 6 ? 'high' :
                            sub.averageScore >= 4 ? 'medium' : 'low'
                          )
                        )} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detailed View */}
      {currentViewMode === 'detailed' && (
        <div className="space-y-4">
          {displayRisks.map((risk) => (
            <Card
              key={risk.id}
              className={cn(
                'cursor-pointer hover:shadow-md transition-all border-l-4',
                risk.riskLevel === 'critical' ? 'border-l-error-500' :
                risk.riskLevel === 'high' ? 'border-l-orange-500' :
                risk.riskLevel === 'medium' ? 'border-l-warning-500' : 'border-l-success-500'
              )}
              onClick={() => handleRiskClick(risk)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{risk.category}</Badge>
                      <Badge variant="outline">{risk.subcategory}</Badge>
                      <Badge className={getRiskScoreColor(risk.riskScore)}>
                        Score: {risk.riskScore.toFixed(1)}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(risk.trend)}
                        <span className="text-xs text-gray-500">{risk.trend}</span>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {risk.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-4">{risk.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <span className="text-xs font-medium text-gray-500">Probability</span>
                        <p className="text-sm text-gray-900">{(risk.probability * 100).toFixed(0)}%</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">Impact</span>
                        <p className="text-sm text-gray-900">{(risk.impact * 100).toFixed(0)}%</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">Owner</span>
                        <p className="text-sm text-gray-900">{risk.owner}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">Last Assessed</span>
                        <p className="text-sm text-gray-900">{formatDate(risk.lastAssessed)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Mitigation:</span>
                      <Badge 
                        variant={
                          risk.mitigationStatus === 'implemented' ? 'success' :
                          risk.mitigationStatus === 'in_progress' ? 'warning' :
                          risk.mitigationStatus === 'planned' ? 'secondary' : 'destructive'
                        }
                      >
                        {risk.mitigationStatus.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        ({risk.mitigationActions.length} actions)
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Category Detail Modal */}
      {selectedCategory && (
        <Modal
          open={!!selectedCategory}
          onClose={() => setSelectedCategory(null)}
          title={selectedCategory.name}
          size="lg"
        >
          <div className="space-y-4">
            <p className="text-gray-700">{selectedCategory.description}</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Risk Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Risks:</span>
                    <span className="font-medium">{selectedCategory.totalRisks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Score:</span>
                    <span className="font-medium">{selectedCategory.averageRiskScore.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>High Risk:</span>
                    <span className="font-medium text-orange-600">{selectedCategory.highRiskCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Critical Risk:</span>
                    <span className="font-medium text-error-600">{selectedCategory.criticalRiskCount}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Subcategories</h4>
                <div className="space-y-2">
                  {selectedCategory.subcategories.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between text-sm">
                      <span>{sub.name}</span>
                      <div className="flex items-center gap-2">
                        <span>{sub.riskCount} risks</span>
                        <Badge className={getRiskScoreColor(sub.averageScore)}>
                          {sub.averageScore.toFixed(1)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Risk Detail Modal */}
      {selectedRisk && (
        <Modal
          open={!!selectedRisk}
          onClose={() => setSelectedRisk(null)}
          title={selectedRisk.title}
          size="xl"
        >
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{selectedRisk.category}</Badge>
              <Badge variant="outline">{selectedRisk.subcategory}</Badge>
              <Badge className={getRiskScoreColor(selectedRisk.riskScore)}>
                Risk Score: {selectedRisk.riskScore.toFixed(1)}
              </Badge>
            </div>

            <p className="text-gray-700">{selectedRisk.description}</p>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Risk Assessment</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Probability:</span>
                    <span className="font-medium">{(selectedRisk.probability * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Impact:</span>
                    <span className="font-medium">{(selectedRisk.impact * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trend:</span>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(selectedRisk.trend)}
                      <span className="font-medium">{selectedRisk.trend}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Mitigation Actions</h4>
                <div className="space-y-2">
                  {selectedRisk.mitigationActions.map((action) => (
                    <div key={action.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{action.action}</span>
                        <Badge 
                          variant={
                            action.status === 'completed' ? 'success' :
                            action.status === 'in_progress' ? 'warning' : 'secondary'
                          }
                          className="text-xs"
                        >
                          {action.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        Due: {formatDate(action.dueDate)} | Assignee: {action.assignee}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {selectedRisk.relatedRegulations.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Related Regulations</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedRisk.relatedRegulations.map((regulation, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {regulation}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

export default RiskHeatmap
