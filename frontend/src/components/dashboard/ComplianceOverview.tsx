/**
 * ComplianceOverview Component
 * Real-time compliance health score dashboard with trend indicators
 */

import React from 'react'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  StatCard,
  Badge,
  ComplianceBadge,
  LoadingSpinner
} from '@/components/ui'
import { cn } from '@/lib/utils'

// Types
export interface ComplianceMetric {
  id: string
  title: string
  value: number
  target: number
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  status: 'excellent' | 'good' | 'warning' | 'critical'
  description: string
}

export interface ComplianceOverviewData {
  overallScore: number
  overallStatus: 'compliant' | 'non-compliant' | 'partially-compliant'
  lastUpdated: string
  metrics: ComplianceMetric[]
  recentAlerts: Array<{
    id: string
    type: 'regulatory_change' | 'deadline' | 'violation' | 'review'
    title: string
    description: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    timestamp: string
  }>
  upcomingDeadlines: Array<{
    id: string
    title: string
    dueDate: string
    daysRemaining: number
    status: 'on_track' | 'at_risk' | 'overdue'
    assignee: string
  }>
}

export interface ComplianceOverviewProps {
  data?: ComplianceOverviewData
  loading?: boolean
  onRefresh?: () => void
  onMetricClick?: (metric: ComplianceMetric) => void
  onAlertClick?: (alertId: string) => void
  onDeadlineClick?: (deadlineId: string) => void
}

const ComplianceOverview: React.FC<ComplianceOverviewProps> = ({
  data,
  loading = false,
  onRefresh,
  onMetricClick,
  onAlertClick,
  onDeadlineClick
}) => {
  // Mock data for demonstration
  const mockData: ComplianceOverviewData = {
    overallScore: 87.5,
    overallStatus: 'partially-compliant',
    lastUpdated: '2024-01-15T10:30:00Z',
    metrics: [
      {
        id: 'regulatory_compliance',
        title: 'Regulatory Compliance',
        value: 92,
        target: 95,
        trend: 'up',
        trendValue: 2.3,
        status: 'good',
        description: 'Overall compliance with RBI regulations'
      },
      {
        id: 'policy_adherence',
        title: 'Policy Adherence',
        value: 88,
        target: 90,
        trend: 'down',
        trendValue: -1.2,
        status: 'warning',
        description: 'Internal policy compliance rate'
      },
      {
        id: 'risk_management',
        title: 'Risk Management',
        value: 95,
        target: 95,
        trend: 'stable',
        trendValue: 0.1,
        status: 'excellent',
        description: 'Risk assessment and mitigation effectiveness'
      },
      {
        id: 'documentation',
        title: 'Documentation',
        value: 75,
        target: 85,
        trend: 'up',
        trendValue: 3.5,
        status: 'warning',
        description: 'Compliance documentation completeness'
      }
    ],
    recentAlerts: [
      {
        id: 'alert_1',
        type: 'regulatory_change',
        title: 'New RBI Circular on Digital Lending',
        description: 'RBI/2024-25/01 requires implementation by March 31, 2024',
        severity: 'high',
        timestamp: '2024-01-15T09:15:00Z'
      },
      {
        id: 'alert_2',
        type: 'deadline',
        title: 'KYC Compliance Review Due',
        description: 'Annual KYC compliance review deadline approaching',
        severity: 'medium',
        timestamp: '2024-01-15T08:30:00Z'
      },
      {
        id: 'alert_3',
        type: 'violation',
        title: 'Transaction Limit Breach',
        description: 'Multiple transactions exceeded regulatory limits',
        severity: 'critical',
        timestamp: '2024-01-15T07:45:00Z'
      }
    ],
    upcomingDeadlines: [
      {
        id: 'deadline_1',
        title: 'Digital Lending Guidelines Implementation',
        dueDate: '2024-03-31',
        daysRemaining: 75,
        status: 'on_track',
        assignee: 'Compliance Team'
      },
      {
        id: 'deadline_2',
        title: 'Annual Risk Assessment Report',
        dueDate: '2024-02-15',
        daysRemaining: 31,
        status: 'at_risk',
        assignee: 'Risk Management'
      },
      {
        id: 'deadline_3',
        title: 'Customer Due Diligence Update',
        dueDate: '2024-01-20',
        daysRemaining: 5,
        status: 'at_risk',
        assignee: 'Operations Team'
      }
    ]
  }

  const displayData = data || mockData

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success-600'
    if (score >= 75) return 'text-warning-600'
    return 'text-error-600'
  }

  const getScoreBackground = (score: number) => {
    if (score >= 90) return 'bg-success-50'
    if (score >= 75) return 'bg-warning-50'
    return 'bg-error-50'
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return (
          <svg className="w-4 h-4 text-success-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        )
      case 'down':
        return (
          <svg className="w-4 h-4 text-error-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-error-700 bg-error-100'
      case 'high': return 'text-orange-700 bg-orange-100'
      case 'medium': return 'text-warning-700 bg-warning-100'
      case 'low': return 'text-success-700 bg-success-100'
      default: return 'text-gray-700 bg-gray-100'
    }
  }

  const getDeadlineStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return 'text-success-700 bg-success-100'
      case 'at_risk': return 'text-warning-700 bg-warning-100'
      case 'overdue': return 'text-error-700 bg-error-100'
      default: return 'text-gray-700 bg-gray-100'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Overall Score */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Overview</h1>
          <p className="text-sm text-gray-600">
            Last updated: {formatDate(displayData.lastUpdated)} at {formatTime(displayData.lastUpdated)}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ComplianceBadge status={displayData.overallStatus} />
          <button
            onClick={onRefresh}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            title="Refresh data"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Overall Compliance Score */}
      <Card className={cn('border-l-4', getScoreBackground(displayData.overallScore))}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Overall Compliance Score</h3>
              <p className="text-sm text-gray-600">Aggregate compliance health indicator</p>
            </div>
            <div className="text-right">
              <div className={cn('text-3xl font-bold', getScoreColor(displayData.overallScore))}>
                {displayData.overallScore}%
              </div>
              <div className="text-sm text-gray-500">Target: 95%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayData.metrics.map((metric) => (
          <Card
            key={metric.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onMetricClick?.(metric)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-600">{metric.title}</h4>
                <div className="flex items-center gap-1">
                  {getTrendIcon(metric.trend)}
                  <span className={cn(
                    'text-xs font-medium',
                    metric.trend === 'up' ? 'text-success-600' : 
                    metric.trend === 'down' ? 'text-error-600' : 'text-gray-400'
                  )}>
                    {metric.trendValue > 0 ? '+' : ''}{metric.trendValue}%
                  </span>
                </div>
              </div>
              <div className="mb-2">
                <div className={cn('text-2xl font-bold', getScoreColor(metric.value))}>
                  {metric.value}%
                </div>
                <div className="text-xs text-gray-500">Target: {metric.target}%</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all',
                    metric.value >= 90 ? 'bg-success-500' :
                    metric.value >= 75 ? 'bg-warning-500' : 'bg-error-500'
                  )}
                  style={{ width: `${Math.min(metric.value, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-600">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Alerts and Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Alerts
              <Badge variant="destructive" className="text-xs">
                {displayData.recentAlerts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {displayData.recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onAlertClick?.(alert.id)}
                >
                  <div className="flex-shrink-0">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-gray-900 truncate">
                      {alert.title}
                    </h5>
                    <p className="text-xs text-gray-600 mt-1">
                      {alert.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTime(alert.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Upcoming Deadlines
              <Badge variant="warning" className="text-xs">
                {displayData.upcomingDeadlines.filter(d => d.daysRemaining <= 30).length} urgent
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {displayData.upcomingDeadlines.map((deadline) => (
                <div
                  key={deadline.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onDeadlineClick?.(deadline.id)}
                >
                  <div className="flex-shrink-0">
                    <Badge className={getDeadlineStatusColor(deadline.status)}>
                      {deadline.daysRemaining}d
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-gray-900 truncate">
                      {deadline.title}
                    </h5>
                    <p className="text-xs text-gray-600 mt-1">
                      Due: {formatDate(deadline.dueDate)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Assigned to: {deadline.assignee}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ComplianceOverview
