'use client'

import {
    ArrowTrendingDownIcon,
    ArrowTrendingUpIcon,
    CalendarIcon,
    ChartBarIcon,
    CheckCircleIcon,
    ClockIcon,
    DocumentChartBarIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

// Mock data for development
const mockAnalyticsData = {
  overview: {
    totalCompliance: 87,
    activeRisks: 12,
    completedTasks: 156,
    pendingTasks: 23,
    complianceScore: 8.7,
    riskScore: 6.2,
    trendsData: {
      compliance: [
        { month: 'Oct', score: 85 },
        { month: 'Nov', score: 86 },
        { month: 'Dec', score: 84 },
        { month: 'Jan', score: 87 }
      ],
      risk: [
        { month: 'Oct', score: 6.8 },
        { month: 'Nov', score: 6.5 },
        { month: 'Dec', score: 6.3 },
        { month: 'Jan', score: 6.2 }
      ]
    }
  },
  complianceByCategory: [
    { category: 'KYC/AML', completed: 45, total: 50, percentage: 90 },
    { category: 'Digital Payments', completed: 38, total: 42, percentage: 90.5 },
    { category: 'Risk Management', completed: 28, total: 35, percentage: 80 },
    { category: 'Audit & Reporting', completed: 32, total: 40, percentage: 80 },
    { category: 'Data Protection', completed: 25, total: 30, percentage: 83.3 }
  ],
  riskDistribution: [
    { level: 'High', count: 8, percentage: 33.3 },
    { level: 'Medium', count: 12, percentage: 50 },
    { level: 'Low', count: 4, percentage: 16.7 }
  ],
  recentActivity: [
    {
      id: '1',
      type: 'compliance_task',
      title: 'KYC Documentation Review Completed',
      timestamp: '2024-01-15T10:30:00Z',
      status: 'completed'
    },
    {
      id: '2',
      type: 'risk_assessment',
      title: 'Digital Payment Security Risk Updated',
      timestamp: '2024-01-15T09:15:00Z',
      status: 'updated'
    },
    {
      id: '3',
      type: 'regulatory_update',
      title: 'New RBI Circular on Digital Lending',
      timestamp: '2024-01-14T16:45:00Z',
      status: 'new'
    },
    {
      id: '4',
      type: 'compliance_task',
      title: 'Quarterly Risk Report Generation',
      timestamp: '2024-01-14T14:20:00Z',
      status: 'in_progress'
    }
  ],
  upcomingDeadlines: [
    {
      id: '1',
      title: 'Quarterly Compliance Report',
      dueDate: '2024-01-31',
      category: 'Reporting',
      priority: 'high'
    },
    {
      id: '2',
      title: 'KYC Process Audit',
      dueDate: '2024-02-05',
      category: 'Audit',
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Risk Assessment Review',
      dueDate: '2024-02-10',
      category: 'Risk Management',
      priority: 'medium'
    },
    {
      id: '4',
      title: 'Digital Payment Security Update',
      dueDate: '2024-02-15',
      category: 'Security',
      priority: 'high'
    }
  ]
}

const timeRanges = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' }
]

export default function AnalyticsPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d')

  // Fetch analytics data
  const { data: analytics = mockAnalyticsData, isLoading } = useQuery({
    queryKey: ['analytics', selectedTimeRange],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/analytics?timeRange=${selectedTimeRange}`)
        if (!response.ok) {
          throw new Error('API not available')
        }
        return await response.json()
      } catch (error) {
        console.log('Using mock data for analytics')
        return mockAnalyticsData
      }
    },
    staleTime: 5 * 60 * 1000,
  })

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'compliance_task':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'risk_assessment':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      case 'regulatory_update':
        return <DocumentChartBarIcon className="h-5 w-5 text-blue-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      updated: 'bg-blue-100 text-blue-800',
      new: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
    }
    return styles[status as keyof typeof styles] || styles.in_progress
  }

  const getPriorityBadge = (priority: string) => {
    const styles = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    }
    return styles[priority as keyof typeof styles] || styles.medium
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive compliance and risk analytics dashboard
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Compliance Score</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{analytics.overview.complianceScore}</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <ArrowTrendingUpIcon className="h-4 w-4 flex-shrink-0 self-center" />
                      <span className="sr-only">Increased by</span>
                      2.1%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Risk Score</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{analytics.overview.riskScore}</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <ArrowTrendingDownIcon className="h-4 w-4 flex-shrink-0 self-center" />
                      <span className="sr-only">Decreased by</span>
                      0.6%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed Tasks</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{analytics.overview.completedTasks}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Tasks</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{analytics.overview.pendingTasks}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance by Category */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance by Category</h3>
          <div className="space-y-4">
            {analytics.complianceByCategory.map((item: any) => (
              <div key={item.category}>
                <div className="flex justify-between text-sm font-medium text-gray-900">
                  <span>{item.category}</span>
                  <span>{item.completed}/{item.total} ({item.percentage.toFixed(1)}%)</span>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Distribution</h3>
          <div className="space-y-4">
            {analytics.riskDistribution.map((item: any) => (
              <div key={item.level} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    item.level === 'High' ? 'bg-red-500' :
                    item.level === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-900">{item.level} Risk</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{item.count} items</span>
                  <span className="text-sm font-medium text-gray-900">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="flow-root">
            <ul className="-mb-8">
              {analytics.recentActivity.map((activity: any, activityIdx: number) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {activityIdx !== analytics.recentActivity.length - 1 ? (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                          {getActivityIcon(activity.type)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-900">{activity.title}</p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(activity.status)}`}>
                            {activity.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time>{formatTimestamp(activity.timestamp)}</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Deadlines</h3>
          <div className="space-y-4">
            {analytics.upcomingDeadlines.map((deadline: any) => (
              <div key={deadline.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{deadline.title}</p>
                    <p className="text-xs text-gray-500">{deadline.category}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(deadline.priority)}`}>
                    {deadline.priority}
                  </span>
                  <span className="text-sm text-gray-500">{formatDate(deadline.dueDate)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trends Chart Placeholder */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance & Risk Trends</h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Chart Visualization</h3>
            <p className="mt-1 text-sm text-gray-500">
              Interactive charts will be displayed here with real data
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}