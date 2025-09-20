'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon,
  ClockIcon 
} from '@heroicons/react/24/outline'
// import { cn } from '@/lib/utils'
const cn = (...classes: string[]) => classes.filter(Boolean).join(' ')

const complianceItems = [
  {
    id: 1,
    title: 'RBI Circular DBOD.No.123/2024',
    description: 'New guidelines for digital lending platforms',
    status: 'compliant',
    dueDate: '2024-03-30',
    progress: 100,
    priority: 'high'
  },
  {
    id: 2,
    title: 'KYC Documentation Update',
    description: 'Enhanced customer verification requirements',
    status: 'in-progress',
    dueDate: '2024-04-15',
    progress: 75,
    priority: 'medium'
  },
  {
    id: 3,
    title: 'Risk Management Framework',
    description: 'Updated risk assessment procedures',
    status: 'pending',
    dueDate: '2024-04-01',
    progress: 25,
    priority: 'critical'
  },
  {
    id: 4,
    title: 'Data Privacy Compliance',
    description: 'GDPR and local data protection laws',
    status: 'overdue',
    dueDate: '2024-03-15',
    progress: 60,
    priority: 'high'
  },
]

const statusConfig = {
  compliant: { icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-100' },
  'in-progress': { icon: ClockIcon, color: 'text-blue-600', bg: 'bg-blue-100' },
  pending: { icon: ExclamationTriangleIcon, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  overdue: { icon: XCircleIcon, color: 'text-red-600', bg: 'bg-red-100' },
}

const priorityConfig = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700'
} as const

export default function CompliancePage() {
  const router = useRouter()
  const [filter, setFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true)
    
    // Simulate report generation
    setTimeout(() => {
      // Create and download a mock report
      const reportData = {
        title: 'Compliance Dashboard Report',
        generatedAt: new Date().toISOString(),
        summary: {
          totalItems: complianceItems.length,
          compliant: complianceItems.filter(item => item.status === 'compliant').length,
          pending: complianceItems.filter(item => item.status === 'pending').length,
          overdue: complianceItems.filter(item => item.status === 'overdue').length
        },
        items: complianceItems
      }
      
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setIsGeneratingReport(false)
    }, 3000)
  }

  const filteredItems = useMemo(() => 
    complianceItems.filter(item => filter === 'all' || item.status === filter),
    [filter]
  )

  const statusCounts = useMemo(() => ({
    compliant: complianceItems.filter(item => item.status === 'compliant').length,
    inProgress: complianceItems.filter(item => item.status === 'in-progress').length,
    pending: complianceItems.filter(item => item.status === 'pending').length,
    overdue: complianceItems.filter(item => item.status === 'overdue').length
  }), [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track regulatory compliance requirements and deadlines
          </p>
        </div>
        <button 
          onClick={handleGenerateReport}
          disabled={isGeneratingReport}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
        >
          {isGeneratingReport ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Compliant</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.compliant}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.inProgress}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <XCircleIcon className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.overdue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        {['all', 'compliant', 'in-progress', 'pending', 'overdue'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              filter === status
                ? "bg-brand-100 text-brand-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Compliance Items */}
      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-brand-600" />
        </div>
      ) : (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Compliance Requirements</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredItems.map((item) => {
            const config = statusConfig[item.status as keyof typeof statusConfig]
            const StatusIcon = config.icon
            return (
              <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className={cn("p-2 rounded-full", config.bg)}>
                        <StatusIcon className={cn("h-4 w-4", config.color)} />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Due:</span>
                        <span className="text-xs font-medium text-gray-900">{item.dueDate}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Priority:</span>
                        <span className={cn(
                          "text-xs font-medium px-2 py-1 rounded",
                          priorityConfig[item.priority as keyof typeof priorityConfig] || priorityConfig.medium
                        )}>
                          {item.priority}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{item.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-brand-600 h-2 rounded-full transition-all"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => router.push(`/dashboard/compliance/${item.id}`)}
                    className="ml-4 text-brand-600 hover:text-brand-700 text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}