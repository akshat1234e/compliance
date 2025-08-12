'use client'

import { useQuery } from 'react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { SystemHealthCard } from '@/components/dashboard/SystemHealthCard'
import { PerformanceChart } from '@/components/dashboard/PerformanceChart'
import { RecentAlertsPanel } from '@/components/dashboard/RecentAlertsPanel'
import { monitoringAPI } from '@/services/api'
import { LoadingSpinner } from '@/components/ui/Loading'

export default function MonitoringPage() {
  const { data: systemHealth, isLoading: healthLoading } = useQuery(
    'system-health',
    monitoringAPI.getSystemHealth,
    { refetchInterval: 30000 }
  )

  const { data: alerts, isLoading: alertsLoading } = useQuery(
    'monitoring-alerts',
    () => monitoringAPI.getAlerts(false),
    { refetchInterval: 30000 }
  )

  const isLoading = healthLoading || alertsLoading

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            System Monitoring
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Real-time system health and performance monitoring
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* System Health */}
            <div className="lg:col-span-1">
              <SystemHealthCard data={systemHealth} />
            </div>

            {/* Performance Chart */}
            <div className="lg:col-span-2">
              <PerformanceChart />
            </div>

            {/* Recent Alerts */}
            <div className="lg:col-span-3">
              <RecentAlertsPanel alerts={alerts} />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
