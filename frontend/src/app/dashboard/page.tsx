'use client'

import SmartComplianceAssistant from '@/components/ai/SmartComplianceAssistant'
import DataTable, { Column } from '@/components/dashboard/DataTable'
import {
  ActiveWorkflowsCard,
  ComplianceScoreCard,
  MetricCardsGrid,
  PendingTasksCard,
  RiskLevelCard
} from '@/components/dashboard/MetricCard'
import { ComplianceBadge, ProgressBadge, RiskBadge } from '@/components/ui/StatusBadge'
import {
  CalendarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'

// Mock data types
interface RegulatoryChange {
  id: string
  title: string
  date: string
  impact: 'high' | 'medium' | 'low'
  status: 'compliant' | 'non-compliant' | 'pending'
  description: string
}

interface Workflow {
  id: string
  name: string
  assignee: string
  dueDate: string
  progress: number
  priority: 'high' | 'medium' | 'low'
  status: 'active' | 'completed' | 'overdue'
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [selectedRows, setSelectedRows] = useState<string[]>([])

  // Mock data - in real app, this would come from API
  const [dashboardData, setDashboardData] = useState({
    metrics: {
      complianceScore: 87,
      activeWorkflows: 12,
      pendingTasks: 8,
      riskLevel: 'Medium' as const,
      riskScore: 65
    },
    regulatoryChanges: [
      {
        id: '1',
        title: 'RBI/2024/15 - Updated KYC Guidelines',
        date: '2024-01-15',
        impact: 'high' as const,
        status: 'pending' as const,
        description: 'New customer identification requirements'
      },
      {
        id: '2',
        title: 'RBI/2024/14 - Digital Payment Security',
        date: '2024-01-12',
        impact: 'medium' as const,
        status: 'compliant' as const,
        description: 'Enhanced security measures for digital transactions'
      },
      {
        id: '3',
        title: 'RBI/2024/13 - Liquidity Risk Management',
        date: '2024-01-10',
        impact: 'high' as const,
        status: 'non-compliant' as const,
        description: 'Updated liquidity coverage ratio requirements'
      }
    ] as RegulatoryChange[],
    workflows: [
      {
        id: '1',
        name: 'Q4 Risk Assessment',
        assignee: 'John Smith',
        dueDate: '2024-01-25',
        progress: 75,
        priority: 'high' as const,
        status: 'active' as const
      },
      {
        id: '2',
        name: 'KYC Documentation Review',
        assignee: 'Sarah Johnson',
        dueDate: '2024-01-20',
        progress: 45,
        priority: 'medium' as const,
        status: 'active' as const
      },
      {
        id: '3',
        name: 'Compliance Training Update',
        assignee: 'Mike Wilson',
        dueDate: '2024-01-18',
        progress: 90,
        priority: 'low' as const,
        status: 'active' as const
      }
    ] as Workflow[]
  })

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Table columns for regulatory changes
  const regulatoryColumns: Column<RegulatoryChange>[] = [
    {
      key: 'title',
      title: 'Regulation Title',
      sortable: true,
      render: (value, record) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{record.description}</div>
        </div>
      )
    },
    {
      key: 'date',
      title: 'Date',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'impact',
      title: 'Impact Level',
      render: (value) => <RiskBadge level={value} />
    },
    {
      key: 'status',
      title: 'Status',
      render: (value) => <ComplianceBadge status={value} />
    }
  ]

  // Table columns for workflows
  const workflowColumns: Column<Workflow>[] = [
    {
      key: 'name',
      title: 'Workflow Name',
      sortable: true,
      render: (value) => (
        <div className="font-medium text-gray-900">{value}</div>
      )
    },
    {
      key: 'assignee',
      title: 'Assignee',
      render: (value) => (
        <div className="flex items-center">
          <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
          {value}
        </div>
      )
    },
    {
      key: 'dueDate',
      title: 'Due Date',
      sortable: true,
      render: (value) => (
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
          {new Date(value).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'progress',
      title: 'Progress',
      render: (value) => (
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full"
              style={{ width: `${value}%` }}
            ></div>
          </div>
          <ProgressBadge percentage={value} size="sm" />
        </div>
      )
    },
    {
      key: 'priority',
      title: 'Priority',
      render: (value) => <RiskBadge level={value} text={`${value} Priority`} />
    }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compliance Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Monitor your organization's compliance status and regulatory requirements
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select className="form-input text-sm">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>Last year</option>
          </select>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium">
            Export Report
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <MetricCardsGrid>
        <ComplianceScoreCard
          score={dashboardData.metrics.complianceScore}
          change={{ value: 5, type: 'increase', period: 'last month' }}
          loading={loading}
        />
        <ActiveWorkflowsCard
          count={dashboardData.metrics.activeWorkflows}
          change={{ value: 2, type: 'increase', period: 'last week' }}
          loading={loading}
        />
        <PendingTasksCard
          count={dashboardData.metrics.pendingTasks}
          change={{ value: 3, type: 'decrease', period: 'last week' }}
          loading={loading}
        />
        <RiskLevelCard
          level={dashboardData.metrics.riskLevel}
          score={dashboardData.metrics.riskScore}
          change={{ value: 10, type: 'decrease', period: 'last month' }}
          loading={loading}
        />
      </MetricCardsGrid>

      {/* Content Grid with AI Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Regulatory Changes */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
              Recent Regulatory Changes
            </h2>
            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All
            </button>
          </div>

          <DataTable
            columns={regulatoryColumns}
            data={dashboardData.regulatoryChanges}
            loading={loading}
            actions={{
              view: (record) => console.log('View', record),
              edit: (record) => console.log('Edit', record)
            }}
          />
        </div>

        {/* Active Workflows */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <ChartBarIcon className="h-5 w-5 text-gray-400 mr-2" />
              Active Workflows
            </h2>
            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All
            </button>
          </div>

          <DataTable
            columns={workflowColumns}
            data={dashboardData.workflows}
            loading={loading}
            rowSelection={{
              selectedRowKeys: selectedRows,
              onChange: (keys) => setSelectedRows(keys)
            }}
            actions={{
              view: (record) => console.log('View workflow', record),
              edit: (record) => console.log('Edit workflow', record)
            }}
          />
        </div>

        {/* Smart Compliance Assistant */}
        <div className="lg:row-span-2">
          <SmartComplianceAssistant
            position="panel"
            showPredictions={true}
            showOptimizations={true}
            showGuidance={true}
            className="h-full"
          />
        </div>
      </div>

      {/* AI Insights Panel */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200 p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Compliance Insights</h3>
            <div className="space-y-3">
              <div className="bg-white rounded-md p-4 border border-primary-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">High Priority Alert</p>
                    <p className="text-sm text-gray-600">
                      New RBI circular requires immediate attention for KYC compliance
                    </p>
                  </div>
                  <button className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700">
                    Review
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-md p-4 border border-warning-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Compliance Prediction</p>
                    <p className="text-sm text-gray-600">
                      Risk assessment deadline approaching in 3 days
                    </p>
                  </div>
                  <button className="px-3 py-1 bg-warning-600 text-white rounded text-sm hover:bg-warning-700">
                    Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
