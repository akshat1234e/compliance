'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { WorkflowBuilder } from '@/components/workflow/WorkflowBuilder'

const workflows = [
  {
    id: 1,
    name: 'RBI Circular Review Process',
    description: 'Automated workflow for reviewing and implementing RBI circulars',
    status: 'active',
    instances: 5,
    completionRate: 92,
    avgDuration: '2.5 hours',
    lastRun: '2024-03-20 14:30',
    category: 'Regulatory'
  },
  {
    id: 2,
    name: 'KYC Document Verification',
    description: 'Multi-step customer verification and document approval process',
    status: 'active',
    instances: 12,
    completionRate: 88,
    avgDuration: '45 minutes',
    lastRun: '2024-03-20 16:15',
    category: 'Compliance'
  },
  {
    id: 3,
    name: 'Risk Assessment Workflow',
    description: 'Comprehensive risk evaluation and mitigation planning',
    status: 'paused',
    instances: 3,
    completionRate: 95,
    avgDuration: '1.2 hours',
    lastRun: '2024-03-19 11:20',
    category: 'Risk Management'
  },
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active': return <PlayIcon className="h-4 w-4 text-green-500" />
    case 'paused': return <PauseIcon className="h-4 w-4 text-yellow-500" />
    case 'completed': return <CheckCircleIcon className="h-4 w-4 text-blue-500" />
    default: return <StopIcon className="h-4 w-4 text-gray-500" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700'
    case 'paused': return 'bg-yellow-100 text-yellow-700'
    case 'completed': return 'bg-blue-100 text-blue-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

export default function WorkflowsPage() {
  const router = useRouter()
  const [workflowData, setWorkflowData] = useState(workflows)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Memoized calculations
  const activeWorkflowsCount = useMemo(() => 
    workflowData.filter(w => w.status === 'active').length, 
    [workflowData]
  )
  
  const totalInstances = useMemo(() => 
    workflowData.reduce((sum, w) => sum + w.instances, 0), 
    [workflowData]
  )
  
  const avgCompletionRate = useMemo(() => 
    workflowData.length > 0 
      ? Math.round(workflowData.reduce((sum, w) => sum + w.completionRate, 0) / workflowData.length)
      : 0, 
    [workflowData]
  )

  // Constants for workflow simulation
  const INSTANCE_CHANGE_RANGE = 3
  const COMPLETION_RATE_CHANGE_RANGE = 6
  const MIN_COMPLETION_RATE = 85
  const MAX_COMPLETION_RATE = 98
  const UPDATE_INTERVAL_MS = 10000

  // Simulate real-time updates with useCallback
  const updateWorkflowData = useCallback(() => {
    setWorkflowData(prev => prev.map(workflow => ({
      ...workflow,
      instances: Math.max(0, workflow.instances + Math.floor(Math.random() * INSTANCE_CHANGE_RANGE) - 1),
      completionRate: Math.max(
        MIN_COMPLETION_RATE, 
        Math.min(
          MAX_COMPLETION_RATE, 
          workflow.completionRate + Math.floor(Math.random() * COMPLETION_RATE_CHANGE_RANGE) - 3
        )
      )
    })))
    setLastUpdate(new Date())
  }, [])

  useEffect(() => {
    const interval = setInterval(updateWorkflowData, UPDATE_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [updateWorkflowData])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflow Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Design, monitor, and manage compliance workflows
          </p>
        </div>
        <button 
          onClick={() => router.push('/dashboard/workflows/create')}
          className="flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Workflow
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        <div 
          onClick={() => router.push('/dashboard/workflows/active')}
          onKeyDown={(e) => e.key === 'Enter' && router.push('/dashboard/workflows/active')}
          tabIndex={0}
          role="button"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <div className="flex items-center">
            <PlayIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Workflows</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeWorkflowsCount}
              </p>
            </div>
          </div>
        </div>
        <div 
          onClick={() => router.push('/dashboard/workflows/instances')}
          onKeyDown={(e) => e.key === 'Enter' && router.push('/dashboard/workflows/instances')}
          tabIndex={0}
          role="button"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Running Instances</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalInstances}
              </p>
            </div>
          </div>
        </div>
        <div 
          onClick={() => router.push('/dashboard/workflows/analytics')}
          onKeyDown={(e) => e.key === 'Enter' && router.push('/dashboard/workflows/analytics')}
          tabIndex={0}
          role="button"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {avgCompletionRate}%
              </p>
            </div>
          </div>
        </div>
        <div 
          onClick={() => router.push('/dashboard/workflows/issues')}
          onKeyDown={(e) => e.key === 'Enter' && router.push('/dashboard/workflows/issues')}
          tabIndex={0}
          role="button"
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Issues</p>
              <p className="text-2xl font-bold text-gray-900">2</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Workflows</h3>
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {workflowData.map((workflow) => (
            <div key={workflow.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(workflow.status)}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{workflow.name}</h4>
                      <p className="text-sm text-gray-500">{workflow.description}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <span className="text-xs text-gray-500">Status</span>
                      <div className={`mt-1 px-2 py-1 text-xs font-medium rounded ${getStatusColor(workflow.status)}`}>
                        {workflow.status}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Instances</span>
                      <p className="mt-1 text-sm font-medium text-gray-900">{workflow.instances}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Completion</span>
                      <p className="mt-1 text-sm font-medium text-gray-900">{workflow.completionRate}%</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Duration</span>
                      <p className="mt-1 text-sm font-medium text-gray-900">{workflow.avgDuration}</p>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => router.push(`/dashboard/workflows/${workflow.id}`)}
                  className="ml-4 text-brand-600 hover:text-brand-700 text-sm font-medium"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <WorkflowBuilder />
    </div>
  )
}