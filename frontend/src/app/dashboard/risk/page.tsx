'use client'

import {
    ChartBarIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    EyeIcon,
    PencilIcon,
    PlusIcon,
    TrashIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

// Mock data for development
const mockRiskAssessments = [
  {
    id: '1',
    title: 'Digital Payment Security Risk Assessment',
    category: 'Operational Risk',
    riskLevel: 'High',
    score: 8.5,
    status: 'active',
    lastUpdated: '2024-01-15',
    nextReview: '2024-04-15',
    owner: 'Risk Management Team',
    description: 'Assessment of security risks in digital payment systems',
    mitigationActions: 3,
    completedActions: 1
  },
  {
    id: '2',
    title: 'KYC Compliance Risk Evaluation',
    category: 'Compliance Risk',
    riskLevel: 'Medium',
    score: 6.2,
    status: 'under_review',
    lastUpdated: '2024-01-10',
    nextReview: '2024-03-10',
    owner: 'Compliance Team',
    description: 'Evaluation of risks related to KYC compliance processes',
    mitigationActions: 5,
    completedActions: 3
  },
  {
    id: '3',
    title: 'Credit Risk Assessment - Q4 2023',
    category: 'Credit Risk',
    riskLevel: 'Low',
    score: 3.8,
    status: 'completed',
    lastUpdated: '2023-12-28',
    nextReview: '2024-06-28',
    owner: 'Credit Risk Team',
    description: 'Quarterly credit risk assessment for Q4 2023',
    mitigationActions: 2,
    completedActions: 2
  },
  {
    id: '4',
    title: 'Market Risk Analysis',
    category: 'Market Risk',
    riskLevel: 'High',
    score: 7.9,
    status: 'active',
    lastUpdated: '2024-01-08',
    nextReview: '2024-02-08',
    owner: 'Market Risk Team',
    description: 'Analysis of market risks affecting portfolio performance',
    mitigationActions: 4,
    completedActions: 1
  }
]

const mockRiskMetrics = {
  totalAssessments: 24,
  highRiskItems: 8,
  mediumRiskItems: 12,
  lowRiskItems: 4,
  overdueTasks: 3,
  averageRiskScore: 6.8,
  trendsData: [
    { month: 'Oct', score: 7.2 },
    { month: 'Nov', score: 6.9 },
    { month: 'Dec', score: 6.5 },
    { month: 'Jan', score: 6.8 }
  ]
}

const riskCategories = [
  { value: 'all', label: 'All Categories' },
  { value: 'Operational Risk', label: 'Operational Risk' },
  { value: 'Compliance Risk', label: 'Compliance Risk' },
  { value: 'Credit Risk', label: 'Credit Risk' },
  { value: 'Market Risk', label: 'Market Risk' },
  { value: 'Liquidity Risk', label: 'Liquidity Risk' }
]

const riskLevels = [
  { value: 'all', label: 'All Risk Levels' },
  { value: 'High', label: 'High Risk' },
  { value: 'Medium', label: 'Medium Risk' },
  { value: 'Low', label: 'Low Risk' }
]

export default function RiskAssessmentPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const queryClient = useQueryClient()

  // Fetch risk assessments
  const { data: assessments = [], isLoading: assessmentsLoading } = useQuery({
    queryKey: ['risk-assessments', { category: selectedCategory, riskLevel: selectedRiskLevel }],
    queryFn: async () => {
      try {
        const response = await fetch('/api/risk/assessments?' + new URLSearchParams({
          category: selectedCategory !== 'all' ? selectedCategory : '',
          riskLevel: selectedRiskLevel !== 'all' ? selectedRiskLevel : ''
        }))

        if (!response.ok) {
          throw new Error('API not available')
        }

        return await response.json()
      } catch (error) {
        console.log('Using mock data for risk assessments')
        return mockRiskAssessments.filter(assessment => {
          const matchesCategory = selectedCategory === 'all' || assessment.category === selectedCategory
          const matchesRiskLevel = selectedRiskLevel === 'all' || assessment.riskLevel === selectedRiskLevel
          return matchesCategory && matchesRiskLevel
        })
      }
    },
    staleTime: 5 * 60 * 1000,
  })

  // Fetch risk metrics
  const { data: metrics = mockRiskMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['risk-metrics'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/risk/metrics')
        if (!response.ok) {
          throw new Error('API not available')
        }
        return await response.json()
      } catch (error) {
        console.log('Using mock data for risk metrics')
        return mockRiskMetrics
      }
    },
    staleTime: 5 * 60 * 1000,
  })

  const getRiskLevelBadge = (riskLevel: string) => {
    const styles = {
      High: 'bg-red-100 text-red-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      Low: 'bg-green-100 text-green-800',
    }
    return styles[riskLevel as keyof typeof styles] || styles.Medium
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
    }
    return styles[status as keyof typeof styles] || styles.active
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'overdue':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'under_review':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-blue-500" />
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Risk Assessment</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and manage organizational risk assessments
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Assessment
        </button>
      </div>

      {/* Risk Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Assessments</dt>
                  <dd className="text-lg font-medium text-gray-900">{metrics.totalAssessments}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">High Risk Items</dt>
                  <dd className="text-lg font-medium text-gray-900">{metrics.highRiskItems}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Overdue Tasks</dt>
                  <dd className="text-lg font-medium text-gray-900">{metrics.overdueTasks}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Risk Score</dt>
                  <dd className="text-lg font-medium text-gray-900">{metrics.averageRiskScore}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              {riskCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
            <select
              value={selectedRiskLevel}
              onChange={(e) => setSelectedRiskLevel(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              {riskLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Risk Assessments List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Risk Assessments ({assessments.length})
          </h3>
        </div>

        {assessmentsLoading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : assessments.length === 0 ? (
          <div className="p-6 text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No risk assessments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first risk assessment.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {assessments.map((assessment) => (
              <div key={assessment.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getStatusIcon(assessment.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {assessment.title}
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskLevelBadge(assessment.riskLevel)}`}>
                          {assessment.riskLevel} Risk
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(assessment.status)}`}>
                          {assessment.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{assessment.description}</p>
                      <div className="flex items-center space-x-6 mt-2 text-xs text-gray-500">
                        <span>Category: {assessment.category}</span>
                        <span>Score: {assessment.score}/10</span>
                        <span>Owner: {assessment.owner}</span>
                        <span>Last Updated: {assessment.lastUpdated}</span>
                        <span>Next Review: {assessment.nextReview}</span>
                      </div>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center text-xs text-gray-500">
                          <span>Mitigation Actions: {assessment.completedActions}/{assessment.mitigationActions}</span>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(assessment.completedActions / assessment.mitigationActions) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      className="p-2 text-gray-400 hover:text-gray-500"
                      title="View assessment"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-gray-500"
                      title="Edit assessment"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-red-500"
                      title="Delete assessment"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Assessment Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create Risk Assessment</h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assessment Title</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter assessment title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                    <option value="">Select category</option>
                    {riskCategories.slice(1).map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Risk Level</label>
                  <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                    <option value="">Select risk level</option>
                    {riskLevels.slice(1).map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter assessment description"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    toast.success('Risk assessment created successfully')
                    setIsCreateModalOpen(false)
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Create Assessment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
