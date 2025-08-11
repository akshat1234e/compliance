/**
 * ComplianceTracker Component
 * Track compliance status and implementation progress for regulatory requirements
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
export interface ComplianceRequirement {
  id: string
  circularId: string
  circularNumber: string
  requirementTitle: string
  description: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  deadline: string
  status: 'not-started' | 'in-progress' | 'completed' | 'overdue' | 'on-hold'
  complianceStatus: 'compliant' | 'non-compliant' | 'partially-compliant' | 'pending' | 'not-applicable'
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  assignedTo: string[]
  owner: string
  progress: number
  estimatedEffort: string
  actualEffort?: string
  startDate?: string
  completionDate?: string
  dependencies: string[]
  milestones: Array<{
    id: string
    title: string
    description: string
    dueDate: string
    status: 'pending' | 'completed' | 'overdue'
    completedDate?: string
  }>
  evidence: Array<{
    id: string
    type: 'document' | 'screenshot' | 'report' | 'certification'
    title: string
    description: string
    uploadDate: string
    uploadedBy: string
    fileUrl: string
    verified: boolean
    verifiedBy?: string
    verifiedDate?: string
  }>
  comments: Array<{
    id: string
    author: string
    content: string
    timestamp: string
    type: 'update' | 'issue' | 'resolution' | 'review'
  }>
  lastUpdated: string
  updatedBy: string
}

export interface ComplianceTrackerProps {
  requirements?: ComplianceRequirement[]
  loading?: boolean
  totalCount?: number
  currentPage?: number
  pageSize?: number
  filters?: {
    status?: string[]
    complianceStatus?: string[]
    priority?: string[]
    riskLevel?: string[]
    assignedTo?: string[]
    category?: string[]
    searchQuery?: string
  }
  onFilterChange?: (filters: any) => void
  onPageChange?: (page: number) => void
  onRequirementClick?: (requirement: ComplianceRequirement) => void
  onStatusUpdate?: (requirementId: string, status: string) => void
  onProgressUpdate?: (requirementId: string, progress: number) => void
  onEvidenceUpload?: (requirementId: string, evidence: any) => void
  onRefresh?: () => void
}

const ComplianceTracker: React.FC<ComplianceTrackerProps> = ({
  requirements,
  loading = false,
  totalCount = 0,
  currentPage = 1,
  pageSize = 20,
  filters = {},
  onFilterChange,
  onPageChange,
  onRequirementClick,
  onStatusUpdate,
  onProgressUpdate,
  onEvidenceUpload,
  onRefresh
}) => {
  const [selectedRequirement, setSelectedRequirement] = React.useState<ComplianceRequirement | null>(null)
  const [searchQuery, setSearchQuery] = React.useState(filters.searchQuery || '')
  const [showFilters, setShowFilters] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<'list' | 'kanban'>('list')

  // Mock data for demonstration
  const mockRequirements: ComplianceRequirement[] = [
    {
      id: 'req_001',
      circularId: 'circular_001',
      circularNumber: 'RBI/2024-25/01',
      requirementTitle: 'Enhanced KYC Verification Implementation',
      description: 'Implement enhanced KYC verification procedures for digital lending platforms',
      category: 'Customer Onboarding',
      priority: 'high',
      deadline: '2024-03-31T00:00:00Z',
      status: 'in-progress',
      complianceStatus: 'partially-compliant',
      riskLevel: 'high',
      assignedTo: ['Compliance Team', 'Technology Team'],
      owner: 'John Doe',
      progress: 65,
      estimatedEffort: '3 months',
      actualEffort: '2.5 months',
      startDate: '2024-01-15T00:00:00Z',
      dependencies: ['System Integration', 'Policy Updates'],
      milestones: [
        {
          id: 'milestone_001',
          title: 'Requirements Analysis',
          description: 'Complete analysis of KYC requirements',
          dueDate: '2024-02-15T00:00:00Z',
          status: 'completed',
          completedDate: '2024-02-10T00:00:00Z'
        },
        {
          id: 'milestone_002',
          title: 'System Development',
          description: 'Develop enhanced KYC verification system',
          dueDate: '2024-03-15T00:00:00Z',
          status: 'pending'
        }
      ],
      evidence: [
        {
          id: 'evidence_001',
          type: 'document',
          title: 'KYC Process Documentation',
          description: 'Updated KYC process documentation',
          uploadDate: '2024-02-20T00:00:00Z',
          uploadedBy: 'Jane Smith',
          fileUrl: '/documents/kyc_process.pdf',
          verified: true,
          verifiedBy: 'Compliance Officer',
          verifiedDate: '2024-02-21T00:00:00Z'
        }
      ],
      comments: [
        {
          id: 'comment_001',
          author: 'John Doe',
          content: 'System development is progressing well. Expected completion by March 10th.',
          timestamp: '2024-02-25T00:00:00Z',
          type: 'update'
        }
      ],
      lastUpdated: '2024-02-25T00:00:00Z',
      updatedBy: 'John Doe'
    },
    {
      id: 'req_002',
      circularId: 'circular_001',
      circularNumber: 'RBI/2024-25/01',
      requirementTitle: 'Real-time Risk Monitoring System',
      description: 'Implement real-time risk monitoring and alerting system',
      category: 'Risk Management',
      priority: 'critical',
      deadline: '2024-03-31T00:00:00Z',
      status: 'not-started',
      complianceStatus: 'non-compliant',
      riskLevel: 'critical',
      assignedTo: ['Risk Management', 'Technology Team'],
      owner: 'Sarah Wilson',
      progress: 0,
      estimatedEffort: '4 months',
      dependencies: ['Data Integration', 'Algorithm Development'],
      milestones: [
        {
          id: 'milestone_003',
          title: 'Requirements Gathering',
          description: 'Gather requirements for risk monitoring system',
          dueDate: '2024-02-28T00:00:00Z',
          status: 'pending'
        }
      ],
      evidence: [],
      comments: [],
      lastUpdated: '2024-01-15T00:00:00Z',
      updatedBy: 'Sarah Wilson'
    }
  ]

  const displayRequirements = requirements || mockRequirements

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success-100 text-success-800'
      case 'in-progress': return 'bg-blue-100 text-blue-800'
      case 'not-started': return 'bg-gray-100 text-gray-800'
      case 'overdue': return 'bg-error-100 text-error-800'
      case 'on-hold': return 'bg-warning-100 text-warning-800'
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

  const getDaysUntilDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline)
    const today = new Date()
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-success-500'
    if (progress >= 60) return 'bg-blue-500'
    if (progress >= 40) return 'bg-warning-500'
    return 'bg-error-500'
  }

  const handleRequirementClick = (requirement: ComplianceRequirement) => {
    setSelectedRequirement(requirement)
    onRequirementClick?.(requirement)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onFilterChange?.({ ...filters, searchQuery: query })
  }

  const tableColumns = [
    {
      key: 'requirementTitle',
      title: 'Requirement',
      sortable: true,
      render: (value: string, record: ComplianceRequirement) => (
        <div>
          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
            {value}
          </div>
          <div className="text-xs text-gray-500">{record.circularNumber}</div>
          <div className="text-xs text-gray-500">{record.category}</div>
        </div>
      )
    },
    {
      key: 'priority',
      title: 'Priority',
      render: (value: string) => <PriorityBadge priority={value as any} />
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: string) => (
        <Badge className={getStatusColor(value)}>
          {value.replace('-', ' ')}
        </Badge>
      )
    },
    {
      key: 'complianceStatus',
      title: 'Compliance',
      render: (value: string) => <ComplianceBadge status={value as any} />
    },
    {
      key: 'riskLevel',
      title: 'Risk',
      render: (value: string) => <RiskBadge level={value as any} />
    },
    {
      key: 'progress',
      title: 'Progress',
      render: (value: number, record: ComplianceRequirement) => (
        <div className="w-full">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">{value}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={cn('h-2 rounded-full transition-all', getProgressColor(value))}
              style={{ width: `${value}%` }}
            />
          </div>
        </div>
      )
    },
    {
      key: 'deadline',
      title: 'Deadline',
      render: (value: string) => {
        const daysLeft = getDaysUntilDeadline(value)
        return (
          <div>
            <div className="text-sm">{formatDate(value)}</div>
            <div className={cn(
              'text-xs',
              daysLeft <= 7 ? 'text-error-600' :
              daysLeft <= 30 ? 'text-warning-600' : 'text-gray-500'
            )}>
              {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
            </div>
          </div>
        )
      }
    },
    {
      key: 'owner',
      title: 'Owner',
      render: (value: string) => (
        <div className="text-sm text-gray-900">{value}</div>
      )
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const renderKanbanView = () => {
    const statusColumns = [
      { id: 'not-started', title: 'Not Started', color: 'bg-gray-100' },
      { id: 'in-progress', title: 'In Progress', color: 'bg-blue-100' },
      { id: 'completed', title: 'Completed', color: 'bg-success-100' },
      { id: 'overdue', title: 'Overdue', color: 'bg-error-100' }
    ]

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statusColumns.map((column) => {
          const columnRequirements = displayRequirements.filter(req => req.status === column.id)
          
          return (
            <div key={column.id} className={cn('rounded-lg p-4', column.color)}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">{column.title}</h3>
                <Badge variant="secondary" className="text-xs">
                  {columnRequirements.length}
                </Badge>
              </div>
              
              <div className="space-y-3">
                {columnRequirements.map((requirement) => (
                  <Card
                    key={requirement.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleRequirementClick(requirement)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                          {requirement.requirementTitle}
                        </h4>
                        <PriorityBadge priority={requirement.priority as any} />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-xs text-gray-500">
                          {requirement.circularNumber}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <ComplianceBadge status={requirement.complianceStatus as any} />
                          <RiskBadge level={requirement.riskLevel as any} />
                        </div>
                        
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">Progress</span>
                            <span className="text-xs text-gray-600">{requirement.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div
                              className={cn('h-1 rounded-full transition-all', getProgressColor(requirement.progress))}
                              style={{ width: `${requirement.progress}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          Due: {formatDate(requirement.deadline)}
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          Owner: {requirement.owner}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Compliance Tracker</h2>
          <p className="text-sm text-gray-600">
            Track compliance status and implementation progress
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
              onClick={() => setViewMode('kanban')}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors',
                viewMode === 'kanban' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Kanban
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {displayRequirements.length}
              </div>
              <div className="text-sm text-gray-600">Total Requirements</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-success-600">
                {displayRequirements.filter(r => r.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {displayRequirements.filter(r => r.status === 'in-progress').length}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-error-600">
                {displayRequirements.filter(r => r.status === 'overdue').length}
              </div>
              <div className="text-sm text-gray-600">Overdue</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-warning-600">
                {displayRequirements.filter(r => r.priority === 'critical' || r.priority === 'high').length}
              </div>
              <div className="text-sm text-gray-600">High Priority</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search requirements..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
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
                    Status
                  </label>
                  <select className="w-full text-sm border rounded-md px-3 py-2">
                    <option value="">All Statuses</option>
                    <option value="not-started">Not Started</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                    <option value="on-hold">On Hold</option>
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
                    Risk Level
                  </label>
                  <select className="w-full text-sm border rounded-md px-3 py-2">
                    <option value="">All Levels</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
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
              data={displayRequirements}
              columns={tableColumns}
              onRow={(record) => ({
                onClick: () => handleRequirementClick(record)
              })}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalCount || displayRequirements.length,
                onChange: (page) => onPageChange?.(page)
              }}
            />
          </CardContent>
        </Card>
      ) : (
        renderKanbanView()
      )}

      {/* Requirement Detail Modal */}
      {selectedRequirement && (
        <Modal
          open={!!selectedRequirement}
          onClose={() => setSelectedRequirement(null)}
          title={selectedRequirement.requirementTitle}
          size="xl"
        >
          <div className="space-y-6">
            {/* Header Information */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{selectedRequirement.circularNumber}</Badge>
              <PriorityBadge priority={selectedRequirement.priority as any} />
              <Badge className={getStatusColor(selectedRequirement.status)}>
                {selectedRequirement.status.replace('-', ' ')}
              </Badge>
              <ComplianceBadge status={selectedRequirement.complianceStatus as any} />
              <RiskBadge level={selectedRequirement.riskLevel as any} />
            </div>

            <p className="text-gray-700">{selectedRequirement.description}</p>

            {/* Progress and Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Progress Overview</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Overall Progress</span>
                      <span className="text-sm font-medium">{selectedRequirement.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={cn('h-3 rounded-full transition-all', getProgressColor(selectedRequirement.progress))}
                        style={{ width: `${selectedRequirement.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Owner:</span>
                      <p className="font-medium">{selectedRequirement.owner}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Deadline:</span>
                      <p className="font-medium">{formatDate(selectedRequirement.deadline)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Estimated Effort:</span>
                      <p className="font-medium">{selectedRequirement.estimatedEffort}</p>
                    </div>
                    {selectedRequirement.actualEffort && (
                      <div>
                        <span className="text-gray-500">Actual Effort:</span>
                        <p className="font-medium">{selectedRequirement.actualEffort}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Assignment</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500">Assigned To:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedRequirement.assignedTo.map((assignee, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {assignee}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {selectedRequirement.dependencies.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-500">Dependencies:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedRequirement.dependencies.map((dep, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {dep}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Milestones */}
            {selectedRequirement.milestones.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Milestones</h4>
                <div className="space-y-3">
                  {selectedRequirement.milestones.map((milestone) => (
                    <div key={milestone.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{milestone.title}</span>
                        <Badge 
                          variant={
                            milestone.status === 'completed' ? 'success' :
                            milestone.status === 'overdue' ? 'destructive' : 'secondary'
                          }
                          className="text-xs"
                        >
                          {milestone.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                      <div className="text-xs text-gray-500">
                        Due: {formatDate(milestone.dueDate)}
                        {milestone.completedDate && (
                          <span> | Completed: {formatDate(milestone.completedDate)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence */}
            {selectedRequirement.evidence.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Evidence</h4>
                <div className="space-y-3">
                  {selectedRequirement.evidence.map((evidence) => (
                    <div key={evidence.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{evidence.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {evidence.type}
                          </Badge>
                        </div>
                        {evidence.verified ? (
                          <Badge variant="success" className="text-xs">Verified</Badge>
                        ) : (
                          <Badge variant="warning" className="text-xs">Pending</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{evidence.description}</p>
                      <div className="text-xs text-gray-500">
                        Uploaded by {evidence.uploadedBy} on {formatDate(evidence.uploadDate)}
                        {evidence.verified && evidence.verifiedBy && (
                          <span> | Verified by {evidence.verifiedBy}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            {selectedRequirement.comments.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Comments</h4>
                <div className="space-y-3">
                  {selectedRequirement.comments.map((comment) => (
                    <div key={comment.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{comment.author}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {comment.type}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatDate(comment.timestamp)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{comment.content}</p>
                    </div>
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

export default ComplianceTracker
