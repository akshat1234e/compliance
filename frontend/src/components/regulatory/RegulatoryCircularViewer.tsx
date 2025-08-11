/**
 * RegulatoryCircularViewer Component
 * Comprehensive viewer for regulatory circulars with impact analysis
 */

import React from 'react'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Badge,
  Button,
  Input,
  DataTable,
  LoadingSpinner,
  Modal,
  ComplianceBadge,
  RiskBadge,
  PriorityBadge
} from '@/components/ui'
import { cn } from '@/lib/utils'

// Types
export interface RegulatoryCircular {
  id: string
  circularNumber: string
  title: string
  description: string
  source: 'RBI' | 'SEBI' | 'IRDAI' | 'NPCI' | 'MCA' | 'Other'
  category: string
  subcategory: string
  publishedDate: string
  effectiveDate?: string
  deadlineDate?: string
  status: 'active' | 'superseded' | 'withdrawn' | 'draft'
  priority: 'low' | 'medium' | 'high' | 'critical'
  impactAssessment: {
    overallImpact: 'low' | 'medium' | 'high' | 'critical'
    affectedAreas: string[]
    estimatedEffort: string
    complianceRisk: 'low' | 'medium' | 'high' | 'critical'
    businessImpact: string
    technicalChanges: string[]
    policyChanges: string[]
    aiConfidence: number
    implementationComplexity: 'low' | 'medium' | 'high' | 'critical'
  }
  content: {
    fullText: string
    summary: string
    keyRequirements: string[]
    actionItems: Array<{
      id: string
      description: string
      deadline?: string
      responsible: string
      status: 'pending' | 'in_progress' | 'completed'
    }>
  }
  attachments: Array<{
    id: string
    name: string
    type: string
    size: number
    url: string
  }>
  relatedCirculars: string[]
  tags: string[]
  complianceStatus: 'compliant' | 'non-compliant' | 'partially-compliant' | 'pending' | 'not-applicable'
  implementationStatus: 'not-started' | 'planning' | 'in-progress' | 'completed' | 'overdue'
  assignedTo: string[]
  reviewedBy?: string
  reviewedDate?: string
  comments: Array<{
    id: string
    author: string
    content: string
    timestamp: string
    type: 'comment' | 'review' | 'approval'
  }>
}

export interface CircularFilters {
  source?: string[]
  category?: string[]
  status?: string[]
  priority?: string[]
  complianceStatus?: string[]
  implementationStatus?: string[]
  dateRange?: {
    start: string
    end: string
  }
  searchQuery?: string
}

export interface RegulatoryCircularViewerProps {
  circulars?: RegulatoryCircular[]
  loading?: boolean
  totalCount?: number
  currentPage?: number
  pageSize?: number
  filters?: CircularFilters
  onFilterChange?: (filters: CircularFilters) => void
  onPageChange?: (page: number) => void
  onCircularClick?: (circular: RegulatoryCircular) => void
  onStatusUpdate?: (circularId: string, status: string) => void
  onAssignmentUpdate?: (circularId: string, assignees: string[]) => void
  onRefresh?: () => void
}

const RegulatoryCircularViewer: React.FC<RegulatoryCircularViewerProps> = ({
  circulars,
  loading = false,
  totalCount = 0,
  currentPage = 1,
  pageSize = 20,
  filters = {},
  onFilterChange,
  onPageChange,
  onCircularClick,
  onStatusUpdate,
  onAssignmentUpdate,
  onRefresh
}) => {
  const [selectedCircular, setSelectedCircular] = React.useState<RegulatoryCircular | null>(null)
  const [searchQuery, setSearchQuery] = React.useState(filters.searchQuery || '')
  const [showFilters, setShowFilters] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('list')

  // Mock data for demonstration
  const mockCirculars: RegulatoryCircular[] = [
    {
      id: 'circular_001',
      circularNumber: 'RBI/2024-25/01',
      title: 'Guidelines on Digital Lending',
      description: 'Comprehensive guidelines for digital lending platforms and regulatory compliance requirements for NBFCs and banks.',
      source: 'RBI',
      category: 'Digital Banking',
      subcategory: 'Digital Lending',
      publishedDate: '2024-01-15T00:00:00Z',
      effectiveDate: '2024-03-31T00:00:00Z',
      deadlineDate: '2024-03-31T00:00:00Z',
      status: 'active',
      priority: 'high',
      impactAssessment: {
        overallImpact: 'high',
        affectedAreas: ['Digital Lending', 'Risk Management', 'Customer Onboarding', 'Technology Systems'],
        estimatedEffort: '3-6 months',
        complianceRisk: 'high',
        businessImpact: 'Significant changes to digital lending processes, customer verification workflows, and risk assessment frameworks',
        technicalChanges: ['API modifications for enhanced KYC', 'Database schema updates', 'Integration with new verification systems', 'Automated compliance monitoring'],
        policyChanges: ['Updated lending policies', 'Enhanced KYC procedures', 'Risk assessment frameworks', 'Customer protection measures'],
        aiConfidence: 0.92,
        implementationComplexity: 'high'
      },
      content: {
        fullText: 'The Reserve Bank of India (RBI) has issued comprehensive guidelines for digital lending platforms...',
        summary: 'New guidelines mandate enhanced KYC procedures, automated risk assessment, and customer protection measures for digital lending platforms.',
        keyRequirements: [
          'Implement enhanced KYC verification for digital onboarding',
          'Establish automated risk assessment frameworks',
          'Ensure customer data protection and privacy',
          'Maintain audit trails for all lending decisions',
          'Implement real-time transaction monitoring'
        ],
        actionItems: [
          {
            id: 'action_001',
            description: 'Update KYC verification procedures',
            deadline: '2024-02-15',
            responsible: 'Compliance Team',
            status: 'in_progress'
          },
          {
            id: 'action_002',
            description: 'Implement automated risk assessment',
            deadline: '2024-03-01',
            responsible: 'Risk Management',
            status: 'pending'
          }
        ]
      },
      attachments: [
        {
          id: 'att_001',
          name: 'RBI_Digital_Lending_Guidelines_2024.pdf',
          type: 'application/pdf',
          size: 2048576,
          url: '/documents/rbi_digital_lending_2024.pdf'
        }
      ],
      relatedCirculars: ['RBI/2023-24/15', 'RBI/2023-24/22'],
      tags: ['Digital Lending', 'KYC', 'Risk Management', 'Customer Protection'],
      complianceStatus: 'partially-compliant',
      implementationStatus: 'in-progress',
      assignedTo: ['Compliance Team', 'Risk Management', 'Technology Team'],
      reviewedBy: 'Chief Compliance Officer',
      reviewedDate: '2024-01-16T00:00:00Z',
      comments: [
        {
          id: 'comment_001',
          author: 'John Doe',
          content: 'Initial assessment completed. High impact on current lending processes.',
          timestamp: '2024-01-16T10:30:00Z',
          type: 'review'
        }
      ]
    },
    {
      id: 'circular_002',
      circularNumber: 'SEBI/HO/MIRSD/2024/01',
      title: 'Amendment to Mutual Fund Regulations',
      description: 'Updates to mutual fund investment guidelines and disclosure requirements.',
      source: 'SEBI',
      category: 'Investment Management',
      subcategory: 'Mutual Funds',
      publishedDate: '2024-01-12T00:00:00Z',
      effectiveDate: '2024-02-15T00:00:00Z',
      status: 'active',
      priority: 'medium',
      impactAssessment: {
        overallImpact: 'medium',
        affectedAreas: ['Investment Management', 'Reporting', 'Client Communications'],
        estimatedEffort: '1-2 months',
        complianceRisk: 'medium',
        businessImpact: 'Enhanced disclosure requirements and modified investment processes',
        technicalChanges: ['Reporting system updates', 'Client portal modifications'],
        policyChanges: ['Investment policy updates', 'Disclosure procedures'],
        aiConfidence: 0.87,
        implementationComplexity: 'medium'
      },
      content: {
        fullText: 'Securities and Exchange Board of India (SEBI) has amended the mutual fund regulations...',
        summary: 'Enhanced disclosure requirements and modified investment guidelines for mutual fund operations.',
        keyRequirements: [
          'Update disclosure documents',
          'Modify investment processes',
          'Enhance client communication'
        ],
        actionItems: [
          {
            id: 'action_003',
            description: 'Update disclosure documents',
            deadline: '2024-02-01',
            responsible: 'Legal Team',
            status: 'completed'
          }
        ]
      },
      attachments: [],
      relatedCirculars: [],
      tags: ['Mutual Funds', 'Investment', 'Disclosure'],
      complianceStatus: 'compliant',
      implementationStatus: 'completed',
      assignedTo: ['Investment Team', 'Legal Team'],
      comments: []
    }
  ]

  const displayCirculars = circulars || mockCirculars

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'RBI': return 'bg-blue-100 text-blue-800'
      case 'SEBI': return 'bg-green-100 text-green-800'
      case 'IRDAI': return 'bg-purple-100 text-purple-800'
      case 'NPCI': return 'bg-orange-100 text-orange-800'
      case 'MCA': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success-100 text-success-800'
      case 'superseded': return 'bg-warning-100 text-warning-800'
      case 'withdrawn': return 'bg-error-100 text-error-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getImplementationStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success-100 text-success-800'
      case 'in-progress': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-warning-100 text-warning-800'
      case 'overdue': return 'bg-error-100 text-error-800'
      case 'not-started': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDaysUntilDeadline = (deadlineDate?: string) => {
    if (!deadlineDate) return null
    const deadline = new Date(deadlineDate)
    const today = new Date()
    const diffTime = deadline.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleCircularClick = (circular: RegulatoryCircular) => {
    setSelectedCircular(circular)
    onCircularClick?.(circular)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onFilterChange?.({ ...filters, searchQuery: query })
  }

  const tableColumns = [
    {
      key: 'circularNumber',
      title: 'Circular Number',
      sortable: true,
      render: (value: string, record: RegulatoryCircular) => (
        <div>
          <div className="text-sm font-medium">{value}</div>
          <Badge className={getSourceColor(record.source)}>
            {record.source}
          </Badge>
        </div>
      )
    },
    {
      key: 'title',
      title: 'Title',
      sortable: true,
      render: (value: string, record: RegulatoryCircular) => (
        <div>
          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
            {value}
          </div>
          <div className="text-xs text-gray-500">{record.category}</div>
        </div>
      )
    },
    {
      key: 'publishedDate',
      title: 'Published',
      sortable: true,
      render: (value: string) => formatDate(value)
    },
    {
      key: 'priority',
      title: 'Priority',
      render: (value: string) => <PriorityBadge priority={value as any} />
    },
    {
      key: 'complianceStatus',
      title: 'Compliance',
      render: (value: string) => <ComplianceBadge status={value as any} />
    },
    {
      key: 'implementationStatus',
      title: 'Implementation',
      render: (value: string) => (
        <Badge className={getImplementationStatusColor(value)}>
          {value.replace('-', ' ')}
        </Badge>
      )
    },
    {
      key: 'deadlineDate',
      title: 'Deadline',
      render: (value: string, record: RegulatoryCircular) => {
        if (!value) return '-'
        const daysLeft = getDaysUntilDeadline(value)
        return (
          <div>
            <div className="text-sm">{formatDate(value)}</div>
            {daysLeft !== null && (
              <div className={cn(
                'text-xs',
                daysLeft <= 7 ? 'text-error-600' :
                daysLeft <= 30 ? 'text-warning-600' : 'text-gray-500'
              )}>
                {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
              </div>
            )}
          </div>
        )
      }
    }
  ]

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
          <h2 className="text-xl font-bold text-gray-900">Regulatory Circulars</h2>
          <p className="text-sm text-gray-600">
            Comprehensive regulatory circular management and impact analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors',
                viewMode === 'list' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors',
                viewMode === 'grid' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Grid
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

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search circulars..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{displayCirculars.length} circulars</Badge>
              <Badge variant="destructive">
                {displayCirculars.filter(c => c.priority === 'critical' || c.priority === 'high').length} high priority
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source
                  </label>
                  <select className="w-full text-sm border rounded-md px-3 py-2">
                    <option value="">All Sources</option>
                    <option value="RBI">RBI</option>
                    <option value="SEBI">SEBI</option>
                    <option value="IRDAI">IRDAI</option>
                    <option value="NPCI">NPCI</option>
                    <option value="MCA">MCA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select className="w-full text-sm border rounded-md px-3 py-2">
                    <option value="">All Priorities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compliance Status
                  </label>
                  <select className="w-full text-sm border rounded-md px-3 py-2">
                    <option value="">All Statuses</option>
                    <option value="compliant">Compliant</option>
                    <option value="partially-compliant">Partially Compliant</option>
                    <option value="non-compliant">Non-Compliant</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Implementation
                  </label>
                  <select className="w-full text-sm border rounded-md px-3 py-2">
                    <option value="">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="in-progress">In Progress</option>
                    <option value="planning">Planning</option>
                    <option value="not-started">Not Started</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content */}
      {viewMode === 'list' ? (
        <Card>
          <CardContent className="p-0">
            <DataTable
              data={displayCirculars}
              columns={tableColumns}
              onRow={(record) => ({
                onClick: () => handleCircularClick(record)
              })}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalCount || displayCirculars.length,
                onChange: (page) => onPageChange?.(page)
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayCirculars.map((circular) => {
            const daysUntilDeadline = getDaysUntilDeadline(circular.deadlineDate)
            
            return (
              <Card
                key={circular.id}
                className={cn(
                  'cursor-pointer hover:shadow-md transition-all border-l-4',
                  circular.priority === 'critical' ? 'border-l-error-500' :
                  circular.priority === 'high' ? 'border-l-orange-500' :
                  circular.priority === 'medium' ? 'border-l-warning-500' : 'border-l-success-500'
                )}
                onClick={() => handleCircularClick(circular)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{circular.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getSourceColor(circular.source)}>
                          {circular.source}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {circular.circularNumber}
                        </Badge>
                      </div>
                    </div>
                    <PriorityBadge priority={circular.priority as any} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {circular.description}
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Published:</span>
                      <span>{formatDate(circular.publishedDate)}</span>
                    </div>
                    
                    {circular.deadlineDate && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Deadline:</span>
                        <div className="text-right">
                          <div>{formatDate(circular.deadlineDate)}</div>
                          {daysUntilDeadline !== null && (
                            <div className={cn(
                              'text-xs',
                              daysUntilDeadline <= 7 ? 'text-error-600' :
                              daysUntilDeadline <= 30 ? 'text-warning-600' : 'text-gray-500'
                            )}>
                              {daysUntilDeadline > 0 ? `${daysUntilDeadline} days left` : 'Overdue'}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <ComplianceBadge status={circular.complianceStatus as any} />
                      <Badge className={getImplementationStatusColor(circular.implementationStatus)}>
                        {circular.implementationStatus.replace('-', ' ')}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Circular Detail Modal */}
      {selectedCircular && (
        <Modal
          open={!!selectedCircular}
          onClose={() => setSelectedCircular(null)}
          title={selectedCircular.title}
          size="xl"
        >
          <div className="space-y-6">
            {/* Header Information */}
            <div className="flex flex-wrap gap-2">
              <Badge className={getSourceColor(selectedCircular.source)}>
                {selectedCircular.source}
              </Badge>
              <Badge variant="outline">{selectedCircular.circularNumber}</Badge>
              <PriorityBadge priority={selectedCircular.priority as any} />
              <ComplianceBadge status={selectedCircular.complianceStatus as any} />
              <Badge className={getImplementationStatusColor(selectedCircular.implementationStatus)}>
                {selectedCircular.implementationStatus.replace('-', ' ')}
              </Badge>
            </div>

            <p className="text-gray-700">{selectedCircular.description}</p>

            {/* Key Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Published Date</span>
                <p className="text-sm text-gray-900">{formatDate(selectedCircular.publishedDate)}</p>
              </div>
              {selectedCircular.effectiveDate && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Effective Date</span>
                  <p className="text-sm text-gray-900">{formatDate(selectedCircular.effectiveDate)}</p>
                </div>
              )}
              {selectedCircular.deadlineDate && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Deadline</span>
                  <p className="text-sm text-gray-900">{formatDate(selectedCircular.deadlineDate)}</p>
                </div>
              )}
            </div>

            {/* Impact Assessment */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">AI Impact Assessment</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-blue-800">Overall Impact:</span>
                    <RiskBadge level={selectedCircular.impactAssessment.overallImpact as any} />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-blue-800">Compliance Risk:</span>
                    <RiskBadge level={selectedCircular.impactAssessment.complianceRisk as any} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-800">AI Confidence:</span>
                    <span className="text-sm font-medium text-blue-900">
                      {Math.round(selectedCircular.impactAssessment.aiConfidence * 100)}%
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-blue-800">Estimated Effort:</span>
                  <p className="text-sm text-blue-900">{selectedCircular.impactAssessment.estimatedEffort}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <span className="text-sm font-medium text-blue-800">Affected Areas:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedCircular.impactAssessment.affectedAreas.map((area, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Key Requirements */}
            {selectedCircular.content.keyRequirements.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Key Requirements</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  {selectedCircular.content.keyRequirements.map((requirement, index) => (
                    <li key={index}>{requirement}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Items */}
            {selectedCircular.content.actionItems.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Action Items</h4>
                <div className="space-y-2">
                  {selectedCircular.content.actionItems.map((item) => (
                    <div key={item.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{item.description}</span>
                        <Badge 
                          variant={
                            item.status === 'completed' ? 'success' :
                            item.status === 'in_progress' ? 'warning' : 'secondary'
                          }
                          className="text-xs"
                        >
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.deadline && `Due: ${formatDate(item.deadline)} | `}
                        Responsible: {item.responsible}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {selectedCircular.attachments.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Attachments</h4>
                <div className="space-y-2">
                  {selectedCircular.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-2 p-2 border rounded">
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-900">{attachment.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(attachment.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Tags</h4>
              <div className="flex flex-wrap gap-1">
                {selectedCircular.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default RegulatoryCircularViewer
