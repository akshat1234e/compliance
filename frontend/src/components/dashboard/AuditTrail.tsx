/**
 * AuditTrail Component
 * Develop audit trail viewer with search and filtering capabilities
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
export interface AuditEvent {
  id: string
  timestamp: string
  userId: string
  userName: string
  userRole: string
  action: string
  resource: string
  resourceId: string
  resourceType: 'document' | 'policy' | 'user' | 'system' | 'transaction' | 'report'
  eventType: 'create' | 'read' | 'update' | 'delete' | 'approve' | 'reject' | 'login' | 'logout'
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'success' | 'failure' | 'warning'
  ipAddress: string
  userAgent: string
  location?: string
  details: {
    description: string
    oldValues?: Record<string, any>
    newValues?: Record<string, any>
    metadata?: Record<string, any>
  }
  complianceRelevant: boolean
  regulatoryImpact?: string[]
  tags: string[]
}

export interface AuditFilters {
  dateRange?: {
    start: string
    end: string
  }
  users?: string[]
  actions?: string[]
  resources?: string[]
  eventTypes?: string[]
  severity?: string[]
  status?: string[]
  complianceRelevant?: boolean
  searchQuery?: string
}

export interface AuditTrailProps {
  events?: AuditEvent[]
  loading?: boolean
  totalCount?: number
  currentPage?: number
  pageSize?: number
  filters?: AuditFilters
  onFilterChange?: (filters: AuditFilters) => void
  onPageChange?: (page: number) => void
  onEventClick?: (event: AuditEvent) => void
  onExport?: (format: 'csv' | 'pdf' | 'json') => void
  onRefresh?: () => void
}

const AuditTrail: React.FC<AuditTrailProps> = ({
  events,
  loading = false,
  totalCount = 0,
  currentPage = 1,
  pageSize = 20,
  filters = {},
  onFilterChange,
  onPageChange,
  onEventClick,
  onExport,
  onRefresh
}) => {
  const [selectedEvent, setSelectedEvent] = React.useState<AuditEvent | null>(null)
  const [searchQuery, setSearchQuery] = React.useState(filters.searchQuery || '')
  const [showFilters, setShowFilters] = React.useState(false)

  // Mock data for demonstration
  const mockEvents: AuditEvent[] = [
    {
      id: 'audit_001',
      timestamp: '2024-01-15T14:30:25Z',
      userId: 'user_123',
      userName: 'John Doe',
      userRole: 'Compliance Officer',
      action: 'Updated compliance policy',
      resource: 'KYC Policy Document',
      resourceId: 'policy_456',
      resourceType: 'policy',
      eventType: 'update',
      severity: 'medium',
      status: 'success',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      location: 'Mumbai, India',
      details: {
        description: 'Updated KYC verification requirements for digital onboarding',
        oldValues: { minDocuments: 2, verificationLevel: 'basic' },
        newValues: { minDocuments: 3, verificationLevel: 'enhanced' },
        metadata: { approvalRequired: true, effectiveDate: '2024-02-01' }
      },
      complianceRelevant: true,
      regulatoryImpact: ['RBI KYC Guidelines', 'PMLA Requirements'],
      tags: ['KYC', 'Policy Update', 'Digital Onboarding']
    },
    {
      id: 'audit_002',
      timestamp: '2024-01-15T13:45:12Z',
      userId: 'user_456',
      userName: 'Jane Smith',
      userRole: 'Risk Manager',
      action: 'Approved risk assessment',
      resource: 'Credit Risk Assessment',
      resourceId: 'risk_789',
      resourceType: 'document',
      eventType: 'approve',
      severity: 'high',
      status: 'success',
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      location: 'Delhi, India',
      details: {
        description: 'Approved high-value loan risk assessment',
        metadata: { loanAmount: 50000000, riskScore: 7.2, approvalLevel: 'senior' }
      },
      complianceRelevant: true,
      regulatoryImpact: ['RBI Credit Risk Guidelines'],
      tags: ['Risk Assessment', 'Loan Approval', 'High Value']
    },
    {
      id: 'audit_003',
      timestamp: '2024-01-15T12:20:08Z',
      userId: 'user_789',
      userName: 'Mike Johnson',
      userRole: 'System Administrator',
      action: 'Failed login attempt',
      resource: 'Authentication System',
      resourceId: 'auth_001',
      resourceType: 'system',
      eventType: 'login',
      severity: 'critical',
      status: 'failure',
      ipAddress: '203.0.113.45',
      userAgent: 'curl/7.68.0',
      details: {
        description: 'Multiple failed login attempts detected',
        metadata: { attemptCount: 5, accountLocked: true, suspiciousActivity: true }
      },
      complianceRelevant: false,
      tags: ['Security', 'Failed Login', 'Suspicious Activity']
    },
    {
      id: 'audit_004',
      timestamp: '2024-01-15T11:15:33Z',
      userId: 'user_321',
      userName: 'Sarah Wilson',
      userRole: 'Compliance Analyst',
      action: 'Generated compliance report',
      resource: 'Monthly Compliance Report',
      resourceId: 'report_012',
      resourceType: 'report',
      eventType: 'create',
      severity: 'low',
      status: 'success',
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      location: 'Bangalore, India',
      details: {
        description: 'Generated monthly compliance status report for January 2024',
        metadata: { reportType: 'monthly', period: '2024-01', totalItems: 1247 }
      },
      complianceRelevant: true,
      regulatoryImpact: ['Internal Reporting'],
      tags: ['Report Generation', 'Monthly Report', 'Compliance Status']
    }
  ]

  const displayEvents = events || mockEvents

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-error-100 text-error-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-warning-100 text-warning-800'
      case 'low': return 'bg-success-100 text-success-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-success-100 text-success-800'
      case 'failure': return 'bg-error-100 text-error-800'
      case 'warning': return 'bg-warning-100 text-warning-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'create':
        return (
          <svg className="w-4 h-4 text-success-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        )
      case 'update':
        return (
          <svg className="w-4 h-4 text-warning-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        )
      case 'delete':
        return (
          <svg className="w-4 h-4 text-error-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'approve':
        return (
          <svg className="w-4 h-4 text-success-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
      case 'reject':
        return (
          <svg className="w-4 h-4 text-error-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString('en-IN'),
      time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }
  }

  const handleEventClick = (event: AuditEvent) => {
    setSelectedEvent(event)
    onEventClick?.(event)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onFilterChange?.({ ...filters, searchQuery: query })
  }

  const tableColumns = [
    {
      key: 'timestamp',
      title: 'Timestamp',
      sortable: true,
      render: (value: string) => {
        const { date, time } = formatTimestamp(value)
        return (
          <div>
            <div className="text-sm font-medium">{date}</div>
            <div className="text-xs text-gray-500">{time}</div>
          </div>
        )
      }
    },
    {
      key: 'userName',
      title: 'User',
      render: (value: string, record: AuditEvent) => (
        <div>
          <div className="text-sm font-medium">{value}</div>
          <div className="text-xs text-gray-500">{record.userRole}</div>
        </div>
      )
    },
    {
      key: 'eventType',
      title: 'Action',
      render: (value: string, record: AuditEvent) => (
        <div className="flex items-center gap-2">
          {getEventTypeIcon(value)}
          <span className="text-sm">{record.action}</span>
        </div>
      )
    },
    {
      key: 'resource',
      title: 'Resource',
      render: (value: string, record: AuditEvent) => (
        <div>
          <div className="text-sm font-medium">{value}</div>
          <Badge variant="outline" className="text-xs">
            {record.resourceType}
          </Badge>
        </div>
      )
    },
    {
      key: 'severity',
      title: 'Severity',
      render: (value: string) => (
        <Badge className={getSeverityColor(value)}>
          {value}
        </Badge>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: string) => (
        <Badge className={getStatusColor(value)}>
          {value}
        </Badge>
      )
    },
    {
      key: 'complianceRelevant',
      title: 'Compliance',
      render: (value: boolean) => (
        value ? (
          <Badge variant="success" className="text-xs">Relevant</Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">N/A</Badge>
        )
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Audit Trail</h2>
          <p className="text-sm text-gray-600">
            Comprehensive audit log with search and filtering capabilities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport?.('csv')}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport?.('pdf')}
          >
            Export PDF
          </Button>
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
                placeholder="Search audit events..."
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Type
                  </label>
                  <select className="w-full text-sm border rounded-md px-3 py-2">
                    <option value="">All Types</option>
                    <option value="create">Create</option>
                    <option value="update">Update</option>
                    <option value="delete">Delete</option>
                    <option value="approve">Approve</option>
                    <option value="reject">Reject</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Severity
                  </label>
                  <select className="w-full text-sm border rounded-md px-3 py-2">
                    <option value="">All Severities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compliance Relevant
                  </label>
                  <select className="w-full text-sm border rounded-md px-3 py-2">
                    <option value="">All Events</option>
                    <option value="true">Compliance Relevant</option>
                    <option value="false">Non-Compliance</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Events Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            data={displayEvents}
            columns={tableColumns}
            onRow={(record) => ({
              onClick: () => handleEventClick(record)
            })}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalCount || displayEvents.length,
              onChange: (page) => onPageChange?.(page)
            }}
          />
        </CardContent>
      </Card>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <Modal
          open={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title="Audit Event Details"
          size="xl"
        >
          <div className="space-y-6">
            {/* Event Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedEvent.action}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedEvent.details.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getSeverityColor(selectedEvent.severity)}>
                  {selectedEvent.severity}
                </Badge>
                <Badge className={getStatusColor(selectedEvent.status)}>
                  {selectedEvent.status}
                </Badge>
              </div>
            </div>

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Event Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Timestamp:</span>
                      <span>{new Date(selectedEvent.timestamp).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Event Type:</span>
                      <span>{selectedEvent.eventType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Resource:</span>
                      <span>{selectedEvent.resource}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Resource Type:</span>
                      <span>{selectedEvent.resourceType}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">User Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">User:</span>
                      <span>{selectedEvent.userName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Role:</span>
                      <span>{selectedEvent.userRole}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">IP Address:</span>
                      <span>{selectedEvent.ipAddress}</span>
                    </div>
                    {selectedEvent.location && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Location:</span>
                        <span>{selectedEvent.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {selectedEvent.complianceRelevant && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Compliance Impact</h4>
                    <div className="space-y-2">
                      <Badge variant="success" className="text-xs">
                        Compliance Relevant
                      </Badge>
                      {selectedEvent.regulatoryImpact && (
                        <div>
                          <span className="text-sm text-gray-500">Regulatory Impact:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedEvent.regulatoryImpact.map((impact, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {impact}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedEvent.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Change Details */}
            {(selectedEvent.details.oldValues || selectedEvent.details.newValues) && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Change Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedEvent.details.oldValues && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Previous Values</h5>
                      <div className="bg-error-50 rounded-lg p-3">
                        <pre className="text-xs text-error-800 whitespace-pre-wrap">
                          {JSON.stringify(selectedEvent.details.oldValues, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                  {selectedEvent.details.newValues && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">New Values</h5>
                      <div className="bg-success-50 rounded-lg p-3">
                        <pre className="text-xs text-success-800 whitespace-pre-wrap">
                          {JSON.stringify(selectedEvent.details.newValues, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metadata */}
            {selectedEvent.details.metadata && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Additional Metadata</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                    {JSON.stringify(selectedEvent.details.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

export default AuditTrail
