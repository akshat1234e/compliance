'use client'

import { useState } from 'react'
import { useQuery } from 'react-query'
import { useParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { regulatoryAPI } from '@/services/api'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Button } from '@/components/ui/Button'
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon,
  TagIcon,
  ChartBarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function CircularDetailPage() {
  const params = useParams()
  const router = useRouter()
  const circularId = params.id as string
  const [activeTab, setActiveTab] = useState('overview')

  const { data: circular, isLoading } = useQuery(
    ['regulatory-circular', circularId],
    () => regulatoryAPI.getCircular(circularId),
    { enabled: !!circularId }
  )

  const { data: impactAnalysis } = useQuery(
    ['impact-analysis', circularId],
    () => regulatoryAPI.getImpactAnalysis(circularId),
    { enabled: !!circularId }
  )

  // Mock data for demonstration
  const mockCircular = circular || {
    id: circularId,
    title: 'Guidelines on Digital Payment Security Framework',
    category: 'Digital Payments',
    issuedDate: '2024-01-15',
    effectiveDate: '2024-04-01',
    priority: 'high',
    status: 'pending',
    description: 'New guidelines for enhancing security in digital payment systems including multi-factor authentication, encryption standards, and fraud detection mechanisms.',
    impactLevel: 'high',
    complianceDeadline: '2024-03-31',
    issuingAuthority: 'Reserve Bank of India',
    circularNumber: 'RBI/2024-25/001',
    applicableTo: ['Commercial Banks', 'Payment Banks', 'Small Finance Banks', 'NBFCs'],
    keyRequirements: [
      'Implementation of multi-factor authentication for all digital transactions',
      'Adoption of end-to-end encryption for payment data',
      'Real-time fraud monitoring and detection systems',
      'Customer notification mechanisms for suspicious activities',
      'Regular security audits and penetration testing'
    ],
    complianceActions: [
      {
        id: 1,
        action: 'Conduct security assessment',
        status: 'completed',
        assignee: 'Security Team',
        dueDate: '2024-02-15',
        completedDate: '2024-02-10'
      },
      {
        id: 2,
        action: 'Implement multi-factor authentication',
        status: 'in_progress',
        assignee: 'IT Development Team',
        dueDate: '2024-03-15',
        progress: 65
      },
      {
        id: 3,
        action: 'Update fraud detection systems',
        status: 'pending',
        assignee: 'Risk Management Team',
        dueDate: '2024-03-25'
      }
    ],
    attachments: [
      { name: 'RBI_Digital_Payment_Guidelines_2024.pdf', size: '2.4 MB', type: 'pdf' },
      { name: 'Implementation_Checklist.xlsx', size: '156 KB', type: 'excel' },
      { name: 'FAQ_Document.pdf', size: '890 KB', type: 'pdf' }
    ]
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'in_progress':
        return <ChartBarIcon className="h-5 w-5 text-blue-500" />
      case 'non_compliant':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'in_progress':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'non_compliant':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50'
      case 'low':
        return 'text-green-600 bg-green-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: DocumentTextIcon },
    { id: 'requirements', name: 'Requirements', icon: CheckCircleIcon },
    { id: 'compliance', name: 'Compliance Actions', icon: ChartBarIcon },
    { id: 'impact', name: 'Impact Analysis', icon: ExclamationTriangleIcon },
    { id: 'attachments', name: 'Attachments', icon: DocumentTextIcon }
  ]

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{mockCircular.title}</h1>
            <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
              <span className="font-medium">{mockCircular.id}</span>
              <span>•</span>
              <span>{mockCircular.category}</span>
              <span>•</span>
              <span>Issued: {new Date(mockCircular.issuedDate).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              Export Report
            </Button>
            <Button variant="primary">
              Update Status
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-blue-500">
            <div className="p-5">
              <div className="flex items-center">
                <CalendarIcon className="h-6 w-6 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Effective Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(mockCircular.effectiveDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-red-500">
            <div className="p-5">
              <div className="flex items-center">
                <ClockIcon className="h-6 w-6 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Compliance Deadline</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(mockCircular.complianceDeadline).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-yellow-500">
            <div className="p-5">
              <div className="flex items-center">
                <TagIcon className="h-6 w-6 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Priority</p>
                  <p className={`text-lg font-semibold capitalize ${getPriorityColor(mockCircular.priority).split(' ')[0]}`}>
                    {mockCircular.priority}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-green-500">
            <div className="p-5">
              <div className="flex items-center">
                {getStatusIcon(mockCircular.status)}
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className={`text-lg font-semibold capitalize ${getStatusColor(mockCircular.status).split(' ')[0]}`}>
                    {mockCircular.status.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-700">{mockCircular.description}</p>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Circular Details</h4>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Circular Number:</dt>
                        <dd className="text-sm font-medium text-gray-900">{mockCircular.circularNumber}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Issuing Authority:</dt>
                        <dd className="text-sm font-medium text-gray-900">{mockCircular.issuingAuthority}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Impact Level:</dt>
                        <dd className="text-sm font-medium text-gray-900 capitalize">{mockCircular.impactLevel}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Applicable To</h4>
                    <div className="space-y-2">
                      {mockCircular.applicableTo.map((entity, index) => (
                        <div key={index} className="flex items-center">
                          <UserGroupIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-700">{entity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'requirements' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Key Requirements</h3>
                <div className="space-y-3">
                  {mockCircular.keyRequirements.map((requirement, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-2 w-2 bg-indigo-600 rounded-full"></div>
                      </div>
                      <p className="ml-3 text-sm text-gray-700">{requirement}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'compliance' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance Actions</h3>
                <div className="space-y-4">
                  {mockCircular.complianceActions.map((action) => (
                    <div key={action.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(action.status)}
                            <h4 className="font-medium text-gray-900">{action.action}</h4>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            <p>Assignee: {action.assignee}</p>
                            <p>Due Date: {new Date(action.dueDate).toLocaleDateString()}</p>
                            {action.completedDate && (
                              <p>Completed: {new Date(action.completedDate).toLocaleDateString()}</p>
                            )}
                          </div>
                          {action.progress && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Progress</span>
                                <span className="font-medium">{action.progress}%</span>
                              </div>
                              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${action.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                        <span className={`ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(action.status)}`}>
                          {action.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'impact' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Impact Analysis</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-yellow-800">
                        High Impact Regulatory Change
                      </h4>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>This circular requires significant changes to existing systems and processes:</p>
                        <ul className="mt-2 list-disc list-inside space-y-1">
                          <li>Technology infrastructure updates required</li>
                          <li>Staff training and process changes needed</li>
                          <li>Compliance monitoring systems to be enhanced</li>
                          <li>Customer communication and notification updates</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Link href={`/dashboard/regulatory/impact-analysis?circular=${circularId}`}>
                    <Button variant="primary">
                      View Detailed Impact Analysis
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {activeTab === 'attachments' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Attachments</h3>
                <div className="space-y-3">
                  {mockCircular.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-6 w-6 text-gray-400 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">{attachment.name}</p>
                          <p className="text-sm text-gray-500">{attachment.size} • {attachment.type.toUpperCase()}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
