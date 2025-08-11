/**
 * RegulatoryAlerts Component
 * Create regulatory change alerts with AI-powered impact assessment display
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
  LoadingSpinner,
  Modal
} from '@/components/ui'
import { cn } from '@/lib/utils'

// Types
export interface RegulatoryAlert {
  id: string
  title: string
  description: string
  source: 'RBI' | 'SEBI' | 'IRDAI' | 'NPCI' | 'MCA' | 'Other'
  type: 'circular' | 'notification' | 'guideline' | 'amendment' | 'deadline'
  severity: 'low' | 'medium' | 'high' | 'critical'
  publishedDate: string
  effectiveDate?: string
  deadlineDate?: string
  status: 'new' | 'reviewed' | 'in_progress' | 'implemented' | 'dismissed'
  impactAssessment: {
    overallImpact: 'low' | 'medium' | 'high' | 'critical'
    affectedAreas: string[]
    estimatedEffort: string
    complianceRisk: 'low' | 'medium' | 'high' | 'critical'
    businessImpact: string
    technicalChanges: string[]
    policyChanges: string[]
    aiConfidence: number
  }
  tags: string[]
  attachments?: Array<{
    id: string
    name: string
    type: string
    size: number
    url: string
  }>
  relatedAlerts?: string[]
}

export interface RegulatoryAlertsProps {
  alerts?: RegulatoryAlert[]
  loading?: boolean
  onAlertClick?: (alert: RegulatoryAlert) => void
  onStatusChange?: (alertId: string, status: RegulatoryAlert['status']) => void
  onFilterChange?: (filters: AlertFilters) => void
  onRefresh?: () => void
}

export interface AlertFilters {
  source?: string[]
  type?: string[]
  severity?: string[]
  status?: string[]
  dateRange?: {
    start: string
    end: string
  }
  searchQuery?: string
}

const RegulatoryAlerts: React.FC<RegulatoryAlertsProps> = ({
  alerts,
  loading = false,
  onAlertClick,
  onStatusChange,
  onFilterChange,
  onRefresh
}) => {
  const [selectedAlert, setSelectedAlert] = React.useState<RegulatoryAlert | null>(null)
  const [filters, setFilters] = React.useState<AlertFilters>({})
  const [searchQuery, setSearchQuery] = React.useState('')

  // Mock data for demonstration
  const mockAlerts: RegulatoryAlert[] = [
    {
      id: 'alert_001',
      title: 'RBI Circular on Digital Lending Guidelines',
      description: 'New guidelines for digital lending platforms and regulatory compliance requirements for NBFCs and banks.',
      source: 'RBI',
      type: 'circular',
      severity: 'high',
      publishedDate: '2024-01-15T00:00:00Z',
      effectiveDate: '2024-03-31T00:00:00Z',
      deadlineDate: '2024-03-31T00:00:00Z',
      status: 'new',
      impactAssessment: {
        overallImpact: 'high',
        affectedAreas: ['Digital Lending', 'Risk Management', 'Customer Onboarding'],
        estimatedEffort: '3-6 months',
        complianceRisk: 'high',
        businessImpact: 'Significant changes to digital lending processes and customer verification workflows',
        technicalChanges: ['API modifications', 'Database schema updates', 'Integration with new verification systems'],
        policyChanges: ['Updated lending policies', 'Enhanced KYC procedures', 'Risk assessment frameworks'],
        aiConfidence: 0.92
      },
      tags: ['Digital Lending', 'NBFC', 'KYC', 'Risk Management'],
      attachments: [
        {
          id: 'att_001',
          name: 'RBI_Circular_Digital_Lending_2024.pdf',
          type: 'application/pdf',
          size: 2048576,
          url: '/documents/rbi_circular_2024.pdf'
        }
      ]
    },
    {
      id: 'alert_002',
      title: 'SEBI Amendment on Mutual Fund Regulations',
      description: 'Updates to mutual fund investment guidelines and disclosure requirements.',
      source: 'SEBI',
      type: 'amendment',
      severity: 'medium',
      publishedDate: '2024-01-12T00:00:00Z',
      effectiveDate: '2024-02-15T00:00:00Z',
      status: 'reviewed',
      impactAssessment: {
        overallImpact: 'medium',
        affectedAreas: ['Investment Management', 'Reporting', 'Client Communications'],
        estimatedEffort: '1-2 months',
        complianceRisk: 'medium',
        businessImpact: 'Enhanced disclosure requirements and modified investment processes',
        technicalChanges: ['Reporting system updates', 'Client portal modifications'],
        policyChanges: ['Investment policy updates', 'Disclosure procedures'],
        aiConfidence: 0.87
      },
      tags: ['Mutual Funds', 'Investment', 'Disclosure', 'Reporting']
    },
    {
      id: 'alert_003',
      title: 'NPCI UPI Transaction Limit Update',
      description: 'Revised transaction limits for UPI payments and enhanced security requirements.',
      source: 'NPCI',
      type: 'notification',
      severity: 'critical',
      publishedDate: '2024-01-10T00:00:00Z',
      effectiveDate: '2024-01-20T00:00:00Z',
      deadlineDate: '2024-01-20T00:00:00Z',
      status: 'in_progress',
      impactAssessment: {
        overallImpact: 'critical',
        affectedAreas: ['Payment Processing', 'Transaction Monitoring', 'Security Systems'],
        estimatedEffort: '2-4 weeks',
        complianceRisk: 'critical',
        businessImpact: 'Immediate changes required to payment processing systems',
        technicalChanges: ['Payment gateway updates', 'Transaction limit configurations', 'Security enhancements'],
        policyChanges: ['Transaction policies', 'Security procedures'],
        aiConfidence: 0.95
      },
      tags: ['UPI', 'Payments', 'Transaction Limits', 'Security']
    }
  ]

  const displayAlerts = alerts || mockAlerts

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-error-100 text-error-800 border-error-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-warning-100 text-warning-800 border-warning-200'
      case 'low': return 'bg-success-100 text-success-800 border-success-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'reviewed': return 'bg-yellow-100 text-yellow-800'
      case 'in_progress': return 'bg-purple-100 text-purple-800'
      case 'implemented': return 'bg-success-100 text-success-800'
      case 'dismissed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

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

  const handleAlertClick = (alert: RegulatoryAlert) => {
    setSelectedAlert(alert)
    onAlertClick?.(alert)
  }

  const handleStatusChange = (alertId: string, newStatus: RegulatoryAlert['status']) => {
    onStatusChange?.(alertId, newStatus)
    // Update local state if needed
  }

  const filteredAlerts = displayAlerts.filter(alert => {
    if (searchQuery && !alert.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !alert.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

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
          <h2 className="text-xl font-bold text-gray-900">Regulatory Alerts</h2>
          <p className="text-sm text-gray-600">
            AI-powered regulatory change monitoring and impact assessment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{filteredAlerts.length} alerts</Badge>
          <Badge variant="destructive">
            {filteredAlerts.filter(a => a.severity === 'critical').length} critical
          </Badge>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => {
          const daysUntilDeadline = getDaysUntilDeadline(alert.deadlineDate)
          
          return (
            <Card
              key={alert.id}
              className={cn(
                'cursor-pointer hover:shadow-md transition-all border-l-4',
                alert.severity === 'critical' ? 'border-l-error-500' :
                alert.severity === 'high' ? 'border-l-orange-500' :
                alert.severity === 'medium' ? 'border-l-warning-500' : 'border-l-success-500'
              )}
              onClick={() => handleAlertClick(alert)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getSourceColor(alert.source)}>
                        {alert.source}
                      </Badge>
                      <Badge variant="outline">{alert.type}</Badge>
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <Badge className={getStatusColor(alert.status)}>
                        {alert.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {alert.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-4">
                      {alert.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <span className="text-xs font-medium text-gray-500">Published</span>
                        <p className="text-sm text-gray-900">{formatDate(alert.publishedDate)}</p>
                      </div>
                      {alert.effectiveDate && (
                        <div>
                          <span className="text-xs font-medium text-gray-500">Effective Date</span>
                          <p className="text-sm text-gray-900">{formatDate(alert.effectiveDate)}</p>
                        </div>
                      )}
                      {alert.deadlineDate && (
                        <div>
                          <span className="text-xs font-medium text-gray-500">Deadline</span>
                          <p className={cn(
                            'text-sm font-medium',
                            daysUntilDeadline && daysUntilDeadline <= 7 ? 'text-error-600' :
                            daysUntilDeadline && daysUntilDeadline <= 30 ? 'text-warning-600' : 'text-gray-900'
                          )}>
                            {formatDate(alert.deadlineDate)}
                            {daysUntilDeadline !== null && (
                              <span className="ml-1">
                                ({daysUntilDeadline > 0 ? `${daysUntilDeadline} days left` : 'Overdue'})
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* AI Impact Assessment Preview */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-900">AI Impact Assessment</span>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(alert.impactAssessment.aiConfidence * 100)}% confidence
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Overall Impact:</span>
                          <Badge className={cn('ml-2', getSeverityColor(alert.impactAssessment.overallImpact))}>
                            {alert.impactAssessment.overallImpact}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-gray-500">Estimated Effort:</span>
                          <span className="ml-2 text-gray-900">{alert.impactAssessment.estimatedEffort}</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="text-gray-500 text-sm">Affected Areas:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {alert.impactAssessment.affectedAreas.map((area, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-4">
                      {alert.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <select
                      value={alert.status}
                      onChange={(e) => handleStatusChange(alert.id, e.target.value as RegulatoryAlert['status'])}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs border rounded px-2 py-1"
                    >
                      <option value="new">New</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="implemented">Implemented</option>
                      <option value="dismissed">Dismissed</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <Modal
          open={!!selectedAlert}
          onClose={() => setSelectedAlert(null)}
          title={selectedAlert.title}
          size="xl"
        >
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Badge className={getSourceColor(selectedAlert.source)}>
                {selectedAlert.source}
              </Badge>
              <Badge variant="outline">{selectedAlert.type}</Badge>
              <Badge className={getSeverityColor(selectedAlert.severity)}>
                {selectedAlert.severity}
              </Badge>
            </div>

            <p className="text-gray-700">{selectedAlert.description}</p>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">Detailed Impact Assessment</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-blue-800">Business Impact:</span>
                  <p className="text-blue-700 mt-1">{selectedAlert.impactAssessment.businessImpact}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Technical Changes Required:</span>
                  <ul className="list-disc list-inside text-blue-700 mt-1">
                    {selectedAlert.impactAssessment.technicalChanges.map((change, index) => (
                      <li key={index}>{change}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Policy Changes Required:</span>
                  <ul className="list-disc list-inside text-blue-700 mt-1">
                    {selectedAlert.impactAssessment.policyChanges.map((change, index) => (
                      <li key={index}>{change}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {selectedAlert.attachments && selectedAlert.attachments.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Attachments</h4>
                <div className="space-y-2">
                  {selectedAlert.attachments.map((attachment) => (
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
          </div>
        </Modal>
      )}
    </div>
  )
}

export default RegulatoryAlerts
