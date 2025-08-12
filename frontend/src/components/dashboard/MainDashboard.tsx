'use client'

import { LoadingSpinner } from '@/components/ui/Loading'
import { StatsCard } from '@/components/ui/StatsCard'
import { complianceAPI, gatewayAPI, monitoringAPI, webhookAPI } from '@/services/api'
import {
    ChartBarIcon,
    CheckCircleIcon,
    ClockIcon,
    CogIcon,
    ExclamationTriangleIcon,
    ServerIcon
} from '@heroicons/react/24/outline'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useQuery } from 'react-query'
import { ConnectorStatusGrid } from './ConnectorStatusGrid'
import { PerformanceChart } from './PerformanceChart'
import { RecentAlertsPanel } from './RecentAlertsPanel'
import { SystemHealthCard } from './SystemHealthCard'
import { WebhookActivityPanel } from './WebhookActivityPanel'

export function MainDashboard() {
  const [refreshInterval, setRefreshInterval] = useState(30000) // 30 seconds

  // Fetch dashboard data
  const { data: dashboardData, isLoading: isDashboardLoading, error: dashboardError } = useQuery(
    'dashboard-summary',
    monitoringAPI.getDashboardSummary,
    {
      refetchInterval: refreshInterval,
      onError: (error: any) => {
        toast.error('Failed to load dashboard data')
      }
    }
  )

  const { data: connectorStatus, isLoading: isConnectorLoading } = useQuery(
    'connector-status',
    gatewayAPI.getConnectorStatus,
    {
      refetchInterval: refreshInterval,
    }
  )

  const { data: webhookStats, isLoading: isWebhookLoading } = useQuery(
    'webhook-stats',
    webhookAPI.getStats,
    {
      refetchInterval: refreshInterval,
    }
  )

  const { data: complianceData, isLoading: isComplianceLoading } = useQuery(
    'compliance-overview',
    complianceAPI.getReports,
    {
      refetchInterval: 60000, // 1 minute
    }
  )

  const isLoading = isDashboardLoading || isConnectorLoading || isWebhookLoading || isComplianceLoading

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    )
  }

  if (dashboardError) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading dashboard</h3>
          <p className="mt-1 text-sm text-gray-500">Please try refreshing the page</p>
        </div>
      </AppLayout>
    )
  }

  const stats = [
    {
      name: 'System Health',
      value: dashboardData?.system?.status || 'unknown',
      icon: dashboardData?.system?.status === 'healthy' ? CheckCircleIcon : ExclamationTriangleIcon,
      color: dashboardData?.system?.status === 'healthy' ? 'green' : 'red',
      change: '+2.1%',
      changeType: 'positive' as const,
    },
    {
      name: 'Active Connectors',
      value: `${dashboardData?.connectors?.connectedConnectors || 0}/${dashboardData?.connectors?.totalConnectors || 0}`,
      icon: ServerIcon,
      color: 'blue',
      change: '+4.3%',
      changeType: 'positive' as const,
    },
    {
      name: 'Open Alerts',
      value: dashboardData?.alerts?.total || 0,
      icon: ExclamationTriangleIcon,
      color: dashboardData?.alerts?.critical > 0 ? 'red' : dashboardData?.alerts?.high > 0 ? 'yellow' : 'green',
      change: '-12.5%',
      changeType: 'negative' as const,
    },
    {
      name: 'Avg Response Time',
      value: `${Math.round(dashboardData?.performance?.averageResponseTime || 0)}ms`,
      icon: ClockIcon,
      color: 'purple',
      change: '-5.2%',
      changeType: 'positive' as const,
    },
    {
      name: 'Webhook Deliveries',
      value: webhookStats?.totalDeliveries || 0,
      icon: CogIcon,
      color: 'indigo',
      change: '+8.1%',
      changeType: 'positive' as const,
    },
    {
      name: 'Compliance Score',
      value: '94%',
      icon: ChartBarIcon,
      color: 'green',
      change: '+1.2%',
      changeType: 'positive' as const,
    },
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Dashboard Overview
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Real-time monitoring and management of your RBI compliance platform
            </p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value={10000}>Refresh every 10s</option>
              <option value={30000}>Refresh every 30s</option>
              <option value={60000}>Refresh every 1m</option>
              <option value={300000}>Refresh every 5m</option>
            </select>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((stat) => (
            <StatsCard key={stat.name} {...stat} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {/* System Health */}
          <div className="xl:col-span-1">
            <SystemHealthCard data={dashboardData} />
          </div>

          {/* Performance Chart */}
          <div className="xl:col-span-2">
            <PerformanceChart />
          </div>

          {/* Connector Status */}
          <div className="xl:col-span-2">
            <ConnectorStatusGrid connectors={connectorStatus} />
          </div>

          {/* Recent Alerts */}
          <div className="xl:col-span-1">
            <RecentAlertsPanel alerts={dashboardData?.alerts} />
          </div>

          {/* Webhook Activity */}
          <div className="xl:col-span-1">
            <WebhookActivityPanel stats={webhookStats} />
          </div>

          {/* Compliance Overview */}
          <div className="xl:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-green-600">94%</div>
                  <div className="text-sm text-gray-500">Compliance Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-blue-600">12</div>
                  <div className="text-sm text-gray-500">Active Workflows</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-yellow-600">5</div>
                  <div className="text-sm text-gray-500">Pending Tasks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-purple-600">28</div>
                  <div className="text-sm text-gray-500">Reports Generated</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Run Health Check
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Test Connectors
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Generate Report
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              View Logs
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
