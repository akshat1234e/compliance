'use client'

import { AppLayout } from '@/components/layout/AppLayout'
import { LoadingSpinner } from '@/components/ui/Loading'
import { RegulatoryOverview } from '@/components/regulatory/RegulatoryOverview'
import { complianceAPI } from '@/services/api'
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useQuery } from 'react-query'

export default function CompliancePage() {
  const { data: workflows, isLoading: workflowsLoading } = useQuery(
    'compliance-workflows',
    complianceAPI.getWorkflows
  )

  const { data: tasks, isLoading: tasksLoading } = useQuery(
    'compliance-tasks',
    complianceAPI.getTasks
  )

  const { data: reports, isLoading: reportsLoading } = useQuery(
    'compliance-reports',
    complianceAPI.getReports
  )

  const isLoading = workflowsLoading || tasksLoading || reportsLoading

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'failed':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Compliance Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage compliance workflows, tasks, and regulatory reporting
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Regulatory Overview */}
            <RegulatoryOverview />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Compliance Overview */}
              <div className="lg:col-span-3">
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance Overview</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <div className="text-center">
                      <div className="text-2xl font-semibold text-green-600">94%</div>
                      <div className="text-sm text-gray-500">Compliance Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-semibold text-blue-600">
                        {workflows?.length || 0}
                      </div>
                      <div className="text-sm text-gray-500">Active Workflows</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-semibold text-yellow-600">
                        {tasks?.filter((t: any) => t.status === 'pending').length || 0}
                      </div>
                      <div className="text-sm text-gray-500">Pending Tasks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-semibold text-purple-600">
                        {reports?.length || 0}
                      </div>
                      <div className="text-sm text-gray-500">Reports Generated</div>
                    </div>
                  </div>
                </div>
              </div>

            {/* Active Workflows */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Active Workflows</h3>
                {workflows && workflows.length > 0 ? (
                  <div className="space-y-3">
                    {workflows.slice(0, 5).map((workflow: any) => (
                      <div key={workflow.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{workflow.name}</h4>
                            <p className="text-sm text-gray-500">{workflow.description}</p>
                          </div>
                          <div className="flex items-center">
                            {getStatusIcon(workflow.status)}
                            <span className="ml-2 text-sm capitalize">{workflow.status}</span>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Last updated: {new Date(workflow.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No active workflows</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pending Tasks */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Tasks</h3>
                {tasks && tasks.length > 0 ? (
                  <div className="space-y-3">
                    {tasks
                      .filter((task: any) => task.status === 'pending')
                      .slice(0, 5)
                      .map((task: any) => (
                        <div key={task.id} className="border rounded-lg p-3">
                          <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                          <div className="mt-2 text-xs text-gray-500">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No pending tasks</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
