/**
 * PolicyManagement Component
 * Comprehensive policy management system with version control and approval workflows
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
  Modal
} from '@/components/ui'
import { cn } from '@/lib/utils'

// Types
export interface Policy {
  id: string
  title: string
  description: string
  category: string
  subcategory: string
  version: string
  status: 'draft' | 'under-review' | 'approved' | 'published' | 'archived' | 'superseded'
  priority: 'low' | 'medium' | 'high' | 'critical'
  effectiveDate?: string
  expiryDate?: string
  reviewDate: string
  nextReviewDate: string
  owner: string
  approver?: string
  approvedDate?: string
  createdBy: string
  createdDate: string
  lastModifiedBy: string
  lastModifiedDate: string
  content: {
    purpose: string
    scope: string
    definitions: Array<{
      term: string
      definition: string
    }>
    procedures: Array<{
      id: string
      title: string
      description: string
      steps: string[]
      responsible: string
      frequency?: string
    }>
    controls: Array<{
      id: string
      control: string
      description: string
      type: 'preventive' | 'detective' | 'corrective'
      frequency: string
      responsible: string
    }>
    exceptions: Array<{
      id: string
      condition: string
      approval: string
      documentation: string
    }>
    references: Array<{
      type: 'regulation' | 'standard' | 'guideline' | 'policy'
      title: string
      reference: string
      url?: string
    }>
  }
  relatedPolicies: string[]
  relatedRegulations: string[]
  tags: string[]
  attachments: Array<{
    id: string
    name: string
    type: string
    size: number
    url: string
    uploadDate: string
    uploadedBy: string
  }>
  versionHistory: Array<{
    version: string
    changes: string
    changedBy: string
    changeDate: string
    approvedBy?: string
    approvalDate?: string
  }>
  approvalWorkflow: {
    currentStep: number
    steps: Array<{
      step: number
      role: string
      assignee: string
      status: 'pending' | 'approved' | 'rejected' | 'skipped'
      comments?: string
      date?: string
    }>
  }
  compliance: {
    applicableRegulations: string[]
    complianceStatus: 'compliant' | 'non-compliant' | 'partially-compliant' | 'under-review'
    lastAssessment?: string
    nextAssessment: string
    assessor?: string
  }
  training: {
    required: boolean
    audience: string[]
    completionRate?: number
    lastTrainingDate?: string
    nextTrainingDate?: string
  }
  metrics: {
    adherenceRate?: number
    violationCount?: number
    lastViolationDate?: string
    effectivenessScore?: number
  }
}

export interface PolicyManagementProps {
  policies?: Policy[]
  loading?: boolean
  totalCount?: number
  currentPage?: number
  pageSize?: number
  filters?: {
    status?: string[]
    category?: string[]
    priority?: string[]
    owner?: string[]
    searchQuery?: string
  }
  onFilterChange?: (filters: any) => void
  onPageChange?: (page: number) => void
  onPolicyClick?: (policy: Policy) => void
  onStatusUpdate?: (policyId: string, status: string) => void
  onApprovalAction?: (policyId: string, action: 'approve' | 'reject', comments?: string) => void
  onCreatePolicy?: () => void
  onEditPolicy?: (policyId: string) => void
  onRefresh?: () => void
}

const PolicyManagement: React.FC<PolicyManagementProps> = ({
  policies,
  loading = false,
  totalCount = 0,
  currentPage = 1,
  pageSize = 20,
  filters = {},
  onFilterChange,
  onPageChange,
  onPolicyClick,
  onStatusUpdate,
  onApprovalAction,
  onCreatePolicy,
  onEditPolicy,
  onRefresh
}) => {
  const [selectedPolicy, setSelectedPolicy] = React.useState<Policy | null>(null)
  const [searchQuery, setSearchQuery] = React.useState(filters.searchQuery || '')
  const [showFilters, setShowFilters] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<'overview' | 'content' | 'workflow' | 'compliance' | 'history'>('overview')

  // Mock data for demonstration
  const mockPolicies: Policy[] = [
    {
      id: 'policy_001',
      title: 'Digital Lending Risk Management Policy',
      description: 'Comprehensive policy for managing risks in digital lending operations',
      category: 'Risk Management',
      subcategory: 'Digital Lending',
      version: '2.1',
      status: 'published',
      priority: 'high',
      effectiveDate: '2024-01-01T00:00:00Z',
      reviewDate: '2024-01-15T00:00:00Z',
      nextReviewDate: '2024-07-15T00:00:00Z',
      owner: 'Risk Management Team',
      approver: 'Chief Risk Officer',
      approvedDate: '2024-01-20T00:00:00Z',
      createdBy: 'John Doe',
      createdDate: '2023-12-01T00:00:00Z',
      lastModifiedBy: 'Jane Smith',
      lastModifiedDate: '2024-01-15T00:00:00Z',
      content: {
        purpose: 'To establish comprehensive risk management framework for digital lending operations',
        scope: 'Applies to all digital lending products and services offered by the organization',
        definitions: [
          { term: 'Digital Lending', definition: 'Lending services provided through digital channels' },
          { term: 'Risk Assessment', definition: 'Systematic evaluation of potential risks' }
        ],
        procedures: [
          {
            id: 'proc_001',
            title: 'Customer Risk Assessment',
            description: 'Evaluate customer creditworthiness and risk profile',
            steps: [
              'Collect customer information',
              'Perform credit checks',
              'Analyze risk factors',
              'Generate risk score'
            ],
            responsible: 'Risk Assessment Team',
            frequency: 'Per application'
          }
        ],
        controls: [
          {
            id: 'ctrl_001',
            control: 'Automated Risk Scoring',
            description: 'Automated system to calculate customer risk scores',
            type: 'preventive',
            frequency: 'Real-time',
            responsible: 'Technology Team'
          }
        ],
        exceptions: [
          {
            id: 'exc_001',
            condition: 'High-value customers with established relationship',
            approval: 'Senior Risk Manager',
            documentation: 'Exception form with justification'
          }
        ],
        references: [
          {
            type: 'regulation',
            title: 'RBI Guidelines on Digital Lending',
            reference: 'RBI/2024-25/01',
            url: 'https://rbi.org.in/circular/2024'
          }
        ]
      },
      relatedPolicies: ['policy_002', 'policy_003'],
      relatedRegulations: ['RBI/2024-25/01'],
      tags: ['Digital Lending', 'Risk Management', 'Customer Assessment'],
      attachments: [
        {
          id: 'att_001',
          name: 'Risk_Assessment_Template.xlsx',
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          size: 1024000,
          url: '/documents/risk_template.xlsx',
          uploadDate: '2024-01-15T00:00:00Z',
          uploadedBy: 'Jane Smith'
        }
      ],
      versionHistory: [
        {
          version: '2.1',
          changes: 'Updated risk scoring criteria based on new RBI guidelines',
          changedBy: 'Jane Smith',
          changeDate: '2024-01-15T00:00:00Z',
          approvedBy: 'Chief Risk Officer',
          approvalDate: '2024-01-20T00:00:00Z'
        },
        {
          version: '2.0',
          changes: 'Major revision to include digital lending specific requirements',
          changedBy: 'John Doe',
          changeDate: '2023-12-01T00:00:00Z',
          approvedBy: 'Chief Risk Officer',
          approvalDate: '2023-12-15T00:00:00Z'
        }
      ],
      approvalWorkflow: {
        currentStep: 3,
        steps: [
          { step: 1, role: 'Policy Author', assignee: 'Jane Smith', status: 'approved', date: '2024-01-15T00:00:00Z' },
          { step: 2, role: 'Department Head', assignee: 'Risk Manager', status: 'approved', date: '2024-01-18T00:00:00Z' },
          { step: 3, role: 'Chief Risk Officer', assignee: 'CRO', status: 'approved', date: '2024-01-20T00:00:00Z' }
        ]
      },
      compliance: {
        applicableRegulations: ['RBI/2024-25/01', 'SEBI Guidelines'],
        complianceStatus: 'compliant',
        lastAssessment: '2024-01-25T00:00:00Z',
        nextAssessment: '2024-07-25T00:00:00Z',
        assessor: 'Compliance Team'
      },
      training: {
        required: true,
        audience: ['Risk Team', 'Lending Team', 'Operations'],
        completionRate: 85,
        lastTrainingDate: '2024-02-01T00:00:00Z',
        nextTrainingDate: '2024-08-01T00:00:00Z'
      },
      metrics: {
        adherenceRate: 92,
        violationCount: 2,
        lastViolationDate: '2024-02-10T00:00:00Z',
        effectivenessScore: 88
      }
    },
    {
      id: 'policy_002',
      title: 'Customer Data Protection Policy',
      description: 'Policy for protecting customer data and ensuring privacy compliance',
      category: 'Data Protection',
      subcategory: 'Privacy',
      version: '1.3',
      status: 'under-review',
      priority: 'critical',
      reviewDate: '2024-02-01T00:00:00Z',
      nextReviewDate: '2024-08-01T00:00:00Z',
      owner: 'Data Protection Officer',
      createdBy: 'Sarah Wilson',
      createdDate: '2023-06-01T00:00:00Z',
      lastModifiedBy: 'Sarah Wilson',
      lastModifiedDate: '2024-02-01T00:00:00Z',
      content: {
        purpose: 'To ensure customer data is protected and privacy regulations are followed',
        scope: 'Applies to all customer data processing activities',
        definitions: [
          { term: 'Personal Data', definition: 'Any information relating to an identified or identifiable person' }
        ],
        procedures: [],
        controls: [],
        exceptions: [],
        references: []
      },
      relatedPolicies: [],
      relatedRegulations: ['GDPR', 'RBI Data Protection Guidelines'],
      tags: ['Data Protection', 'Privacy', 'GDPR'],
      attachments: [],
      versionHistory: [
        {
          version: '1.3',
          changes: 'Updated to include new RBI data protection requirements',
          changedBy: 'Sarah Wilson',
          changeDate: '2024-02-01T00:00:00Z'
        }
      ],
      approvalWorkflow: {
        currentStep: 2,
        steps: [
          { step: 1, role: 'Policy Author', assignee: 'Sarah Wilson', status: 'approved', date: '2024-02-01T00:00:00Z' },
          { step: 2, role: 'Legal Team', assignee: 'Legal Counsel', status: 'pending' },
          { step: 3, role: 'Chief Compliance Officer', assignee: 'CCO', status: 'pending' }
        ]
      },
      compliance: {
        applicableRegulations: ['GDPR', 'RBI Data Protection Guidelines'],
        complianceStatus: 'under-review',
        nextAssessment: '2024-03-01T00:00:00Z'
      },
      training: {
        required: true,
        audience: ['All Staff'],
        completionRate: 78
      },
      metrics: {
        adherenceRate: 95,
        violationCount: 0,
        effectivenessScore: 92
      }
    }
  ]

  const displayPolicies = policies || mockPolicies

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-success-100 text-success-800'
      case 'approved': return 'bg-blue-100 text-blue-800'
      case 'under-review': return 'bg-warning-100 text-warning-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'archived': return 'bg-gray-100 text-gray-600'
      case 'superseded': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-error-100 text-error-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-warning-100 text-warning-800'
      case 'low': return 'bg-success-100 text-success-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-success-100 text-success-800'
      case 'non-compliant': return 'bg-error-100 text-error-800'
      case 'partially-compliant': return 'bg-warning-100 text-warning-800'
      case 'under-review': return 'bg-blue-100 text-blue-800'
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

  const handlePolicyClick = (policy: Policy) => {
    setSelectedPolicy(policy)
    onPolicyClick?.(policy)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onFilterChange?.({ ...filters, searchQuery: query })
  }

  const tableColumns = [
    {
      key: 'title',
      title: 'Policy Title',
      sortable: true,
      render: (value: string, record: Policy) => (
        <div>
          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
            {value}
          </div>
          <div className="text-xs text-gray-500">{record.category} - {record.subcategory}</div>
          <div className="text-xs text-gray-500">v{record.version}</div>
        </div>
      )
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
      key: 'priority',
      title: 'Priority',
      render: (value: string) => (
        <Badge className={getPriorityColor(value)}>
          {value}
        </Badge>
      )
    },
    {
      key: 'owner',
      title: 'Owner',
      render: (value: string) => (
        <div className="text-sm text-gray-900">{value}</div>
      )
    },
    {
      key: 'nextReviewDate',
      title: 'Next Review',
      sortable: true,
      render: (value: string) => (
        <div className="text-sm">{formatDate(value)}</div>
      )
    },
    {
      key: 'compliance',
      title: 'Compliance',
      render: (value: any, record: Policy) => (
        <Badge className={getComplianceStatusColor(record.compliance.complianceStatus)}>
          {record.compliance.complianceStatus.replace('-', ' ')}
        </Badge>
      )
    },
    {
      key: 'lastModifiedDate',
      title: 'Last Modified',
      sortable: true,
      render: (value: string) => (
        <div className="text-sm">{formatDate(value)}</div>
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

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Policy Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Category:</span>
              <span>{selectedPolicy?.category} - {selectedPolicy?.subcategory}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Version:</span>
              <span>v{selectedPolicy?.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Owner:</span>
              <span>{selectedPolicy?.owner}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Created By:</span>
              <span>{selectedPolicy?.createdBy}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Created Date:</span>
              <span>{selectedPolicy && formatDate(selectedPolicy.createdDate)}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Status & Dates</h4>
          <div className="space-y-2 text-sm">
            {selectedPolicy?.effectiveDate && (
              <div className="flex justify-between">
                <span className="text-gray-500">Effective Date:</span>
                <span>{formatDate(selectedPolicy.effectiveDate)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Review Date:</span>
              <span>{selectedPolicy && formatDate(selectedPolicy.reviewDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Next Review:</span>
              <span>{selectedPolicy && formatDate(selectedPolicy.nextReviewDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Last Modified:</span>
              <span>{selectedPolicy && formatDate(selectedPolicy.lastModifiedDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Modified By:</span>
              <span>{selectedPolicy?.lastModifiedBy}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      {selectedPolicy?.metrics && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Policy Metrics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {selectedPolicy.metrics.adherenceRate && (
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {selectedPolicy.metrics.adherenceRate}%
                </div>
                <div className="text-sm text-gray-600">Adherence Rate</div>
              </div>
            )}
            {selectedPolicy.metrics.violationCount !== undefined && (
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {selectedPolicy.metrics.violationCount}
                </div>
                <div className="text-sm text-gray-600">Violations</div>
              </div>
            )}
            {selectedPolicy.metrics.effectivenessScore && (
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {selectedPolicy.metrics.effectivenessScore}%
                </div>
                <div className="text-sm text-gray-600">Effectiveness</div>
              </div>
            )}
            {selectedPolicy.training.completionRate && (
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {selectedPolicy.training.completionRate}%
                </div>
                <div className="text-sm text-gray-600">Training Completion</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tags and References */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Tags</h4>
          <div className="flex flex-wrap gap-1">
            {selectedPolicy?.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Related Regulations</h4>
          <div className="flex flex-wrap gap-1">
            {selectedPolicy?.relatedRegulations.map((regulation, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {regulation}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => (
    <div className="space-y-6">
      {/* Purpose and Scope */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Purpose</h4>
        <p className="text-gray-700">{selectedPolicy?.content.purpose}</p>
      </div>

      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Scope</h4>
        <p className="text-gray-700">{selectedPolicy?.content.scope}</p>
      </div>

      {/* Definitions */}
      {selectedPolicy?.content.definitions.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Definitions</h4>
          <div className="space-y-2">
            {selectedPolicy.content.definitions.map((definition, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="font-medium text-gray-900">{definition.term}</div>
                <div className="text-sm text-gray-600">{definition.definition}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Procedures */}
      {selectedPolicy?.content.procedures.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Procedures</h4>
          <div className="space-y-4">
            {selectedPolicy.content.procedures.map((procedure) => (
              <div key={procedure.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">{procedure.title}</h5>
                  <Badge variant="outline" className="text-xs">
                    {procedure.responsible}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{procedure.description}</p>
                <div>
                  <span className="text-sm font-medium text-gray-700">Steps:</span>
                  <ol className="list-decimal list-inside text-sm text-gray-600 mt-1">
                    {procedure.steps.map((step, stepIndex) => (
                      <li key={stepIndex}>{step}</li>
                    ))}
                  </ol>
                </div>
                {procedure.frequency && (
                  <div className="mt-2 text-xs text-gray-500">
                    Frequency: {procedure.frequency}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      {selectedPolicy?.content.controls.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Controls</h4>
          <div className="space-y-3">
            {selectedPolicy.content.controls.map((control) => (
              <div key={control.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{control.control}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {control.type}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {control.frequency}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">{control.description}</p>
                <div className="text-xs text-gray-500">
                  Responsible: {control.responsible}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderWorkflow = () => (
    <div className="space-y-6">
      {/* Approval Workflow */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Approval Workflow</h4>
        <div className="space-y-3">
          {selectedPolicy?.approvalWorkflow.steps.map((step) => (
            <div key={step.step} className="flex items-center gap-4 p-3 border rounded-lg">
              <div className="flex-shrink-0">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  step.status === 'approved' ? 'bg-success-100 text-success-800' :
                  step.status === 'rejected' ? 'bg-error-100 text-error-800' :
                  step.status === 'pending' ? 'bg-warning-100 text-warning-800' :
                  'bg-gray-100 text-gray-800'
                )}>
                  {step.step}
                </div>
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{step.role}</div>
                <div className="text-sm text-gray-600">Assignee: {step.assignee}</div>
                {step.date && (
                  <div className="text-xs text-gray-500">
                    {step.status === 'approved' ? 'Approved' : 'Processed'} on {formatDate(step.date)}
                  </div>
                )}
                {step.comments && (
                  <div className="text-xs text-gray-600 mt-1">
                    Comments: {step.comments}
                  </div>
                )}
              </div>
              <div className="flex-shrink-0">
                <Badge 
                  variant={
                    step.status === 'approved' ? 'success' :
                    step.status === 'rejected' ? 'destructive' :
                    step.status === 'pending' ? 'warning' : 'secondary'
                  }
                  className="text-xs"
                >
                  {step.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderCompliance = () => (
    <div className="space-y-6">
      {/* Compliance Status */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Compliance Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <Badge className={getComplianceStatusColor(selectedPolicy?.compliance.complianceStatus || '')}>
                  {selectedPolicy?.compliance.complianceStatus.replace('-', ' ')}
                </Badge>
              </div>
              {selectedPolicy?.compliance.lastAssessment && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Assessment:</span>
                  <span>{formatDate(selectedPolicy.compliance.lastAssessment)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Next Assessment:</span>
                <span>{selectedPolicy && formatDate(selectedPolicy.compliance.nextAssessment)}</span>
              </div>
              {selectedPolicy?.compliance.assessor && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Assessor:</span>
                  <span>{selectedPolicy.compliance.assessor}</span>
                </div>
              )}
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-500">Applicable Regulations:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {selectedPolicy?.compliance.applicableRegulations.map((regulation, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {regulation}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Training Information */}
      {selectedPolicy?.training && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Training Requirements</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Required:</span>
                  <Badge variant={selectedPolicy.training.required ? 'success' : 'secondary'}>
                    {selectedPolicy.training.required ? 'Yes' : 'No'}
                  </Badge>
                </div>
                {selectedPolicy.training.completionRate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Completion Rate:</span>
                    <span>{selectedPolicy.training.completionRate}%</span>
                  </div>
                )}
                {selectedPolicy.training.lastTrainingDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Training:</span>
                    <span>{formatDate(selectedPolicy.training.lastTrainingDate)}</span>
                  </div>
                )}
                {selectedPolicy.training.nextTrainingDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Next Training:</span>
                    <span>{formatDate(selectedPolicy.training.nextTrainingDate)}</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500">Target Audience:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedPolicy.training.audience.map((audience, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {audience}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderHistory = () => (
    <div className="space-y-6">
      {/* Version History */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Version History</h4>
        <div className="space-y-3">
          {selectedPolicy?.versionHistory.map((version, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">Version {version.version}</span>
                <div className="text-sm text-gray-500">
                  {formatDate(version.changeDate)}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">{version.changes}</p>
              <div className="text-xs text-gray-500">
                Changed by: {version.changedBy}
                {version.approvedBy && (
                  <span> | Approved by: {version.approvedBy}</span>
                )}
                {version.approvalDate && (
                  <span> on {formatDate(version.approvalDate)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attachments */}
      {selectedPolicy?.attachments.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Attachments</h4>
          <div className="space-y-2">
            {selectedPolicy.attachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center gap-2 p-2 border rounded">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <div className="text-sm text-gray-900">{attachment.name}</div>
                  <div className="text-xs text-gray-500">
                    Uploaded by {attachment.uploadedBy} on {formatDate(attachment.uploadDate)}
                    ({(attachment.size / 1024 / 1024).toFixed(1)} MB)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Policy Management</h2>
          <p className="text-sm text-gray-600">
            Comprehensive policy management with version control and approval workflows
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCreatePolicy}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Policy
          </Button>
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
                {displayPolicies.length}
              </div>
              <div className="text-sm text-gray-600">Total Policies</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-success-600">
                {displayPolicies.filter(p => p.status === 'published').length}
              </div>
              <div className="text-sm text-gray-600">Published</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-warning-600">
                {displayPolicies.filter(p => p.status === 'under-review').length}
              </div>
              <div className="text-sm text-gray-600">Under Review</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {displayPolicies.filter(p => p.status === 'draft').length}
              </div>
              <div className="text-sm text-gray-600">Drafts</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-error-600">
                {displayPolicies.filter(p => p.priority === 'critical' || p.priority === 'high').length}
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
                placeholder="Search policies..."
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
                    <option value="published">Published</option>
                    <option value="approved">Approved</option>
                    <option value="under-review">Under Review</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select className="w-full text-sm border rounded-md px-3 py-2">
                    <option value="">All Categories</option>
                    <option value="Risk Management">Risk Management</option>
                    <option value="Data Protection">Data Protection</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Operations">Operations</option>
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
                    Owner
                  </label>
                  <select className="w-full text-sm border rounded-md px-3 py-2">
                    <option value="">All Owners</option>
                    <option value="Risk Management Team">Risk Management Team</option>
                    <option value="Data Protection Officer">Data Protection Officer</option>
                    <option value="Compliance Team">Compliance Team</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Policies Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            data={displayPolicies}
            columns={tableColumns}
            onRow={(record) => ({
              onClick: () => handlePolicyClick(record)
            })}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalCount || displayPolicies.length,
              onChange: (page) => onPageChange?.(page)
            }}
          />
        </CardContent>
      </Card>

      {/* Policy Detail Modal */}
      {selectedPolicy && (
        <Modal
          open={!!selectedPolicy}
          onClose={() => setSelectedPolicy(null)}
          title={selectedPolicy.title}
          size="xl"
        >
          <div className="space-y-6">
            {/* Header Information */}
            <div className="flex flex-wrap gap-2">
              <Badge className={getStatusColor(selectedPolicy.status)}>
                {selectedPolicy.status.replace('-', ' ')}
              </Badge>
              <Badge className={getPriorityColor(selectedPolicy.priority)}>
                {selectedPolicy.priority}
              </Badge>
              <Badge className={getComplianceStatusColor(selectedPolicy.compliance.complianceStatus)}>
                {selectedPolicy.compliance.complianceStatus.replace('-', ' ')}
              </Badge>
              <Badge variant="outline">v{selectedPolicy.version}</Badge>
            </div>

            <p className="text-gray-700">{selectedPolicy.description}</p>

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8" aria-label="Tabs">
                {[
                  { id: 'overview', name: 'Overview' },
                  { id: 'content', name: 'Content' },
                  { id: 'workflow', name: 'Workflow' },
                  { id: 'compliance', name: 'Compliance' },
                  { id: 'history', name: 'History' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                      activeTab === tab.id
                        ? 'border-brand-500 text-brand-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    )}
                  >
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div>
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'content' && renderContent()}
              {activeTab === 'workflow' && renderWorkflow()}
              {activeTab === 'compliance' && renderCompliance()}
              {activeTab === 'history' && renderHistory()}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default PolicyManagement
