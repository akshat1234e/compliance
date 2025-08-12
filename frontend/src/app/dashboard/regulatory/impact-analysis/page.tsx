'use client'

import { useState } from 'react'
import { useQuery } from 'react-query'
import { useSearchParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { regulatoryAPI } from '@/services/api'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Button } from '@/components/ui/Button'
import { 
  ExclamationTriangleIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserGroupIcon,
  CogIcon,
  DocumentTextIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'

export default function ImpactAnalysisPage() {
  const searchParams = useSearchParams()
  const circularId = searchParams.get('circular')
  const [selectedCircular, setSelectedCircular] = useState(circularId || '')

  const { data: circulars, isLoading: circularsLoading } = useQuery(
    'regulatory-circulars-list',
    () => regulatoryAPI.getCirculars(),
    { enabled: !circularId }
  )

  const { data: impactAnalysis, isLoading: analysisLoading } = useQuery(
    ['impact-analysis', selectedCircular],
    () => regulatoryAPI.getImpactAnalysis(selectedCircular),
    { enabled: !!selectedCircular }
  )

  // Mock data for demonstration
  const mockImpactAnalysis = impactAnalysis || {
    circular: {
      id: selectedCircular || 'RBI/2024/001',
      title: 'Guidelines on Digital Payment Security Framework',
      category: 'Digital Payments',
      effectiveDate: '2024-04-01'
    },
    overallImpact: {
      level: 'high',
      score: 8.5,
      summary: 'Significant changes required across technology, processes, and compliance frameworks'
    },
    impactAreas: [
      {
        area: 'Technology Infrastructure',
        impact: 'high',
        score: 9.0,
        description: 'Major system upgrades required for multi-factor authentication and encryption',
        estimatedCost: 2500000,
        timeToImplement: 120,
        resources: ['IT Development Team', 'Security Architects', 'External Vendors'],
        risks: ['System downtime during implementation', 'Integration challenges with legacy systems']
      },
      {
        area: 'Operational Processes',
        impact: 'medium',
        score: 6.5,
        description: 'Process updates for fraud monitoring and customer notifications',
        estimatedCost: 500000,
        timeToImplement: 60,
        resources: ['Operations Team', 'Process Analysts', 'Training Team'],
        risks: ['Staff training requirements', 'Temporary process disruptions']
      },
      {
        area: 'Compliance Framework',
        impact: 'high',
        score: 8.0,
        description: 'New compliance monitoring and reporting mechanisms required',
        estimatedCost: 750000,
        timeToImplement: 90,
        resources: ['Compliance Team', 'Legal Team', 'Audit Team'],
        risks: ['Regulatory penalties for non-compliance', 'Audit findings']
      },
      {
        area: 'Customer Experience',
        impact: 'medium',
        score: 5.5,
        description: 'Customer communication and interface updates for new security measures',
        estimatedCost: 300000,
        timeToImplement: 45,
        resources: ['UX Team', 'Customer Service', 'Marketing Team'],
        risks: ['Customer confusion', 'Increased support queries']
      }
    ],
    recommendations: [
      {
        priority: 'high',
        action: 'Establish dedicated project team for implementation',
        timeline: '2 weeks',
        owner: 'Project Management Office'
      },
      {
        priority: 'high',
        action: 'Conduct detailed technical assessment of current systems',
        timeline: '4 weeks',
        owner: 'IT Architecture Team'
      },
      {
        priority: 'medium',
        action: 'Develop comprehensive staff training program',
        timeline: '6 weeks',
        owner: 'Human Resources'
      },
      {
        priority: 'medium',
        action: 'Create customer communication strategy',
        timeline: '3 weeks',
        owner: 'Marketing Team'
      }
    ],
    timeline: [
      { phase: 'Assessment & Planning', duration: 30, startDate: '2024-02-01', endDate: '2024-03-02' },
      { phase: 'System Development', duration: 60, startDate: '2024-03-03', endDate: '2024-05-02' },
      { phase: 'Testing & Validation', duration: 30, startDate: '2024-05-03', endDate: '2024-06-02' },
      { phase: 'Deployment & Training', duration: 20, startDate: '2024-06-03', endDate: '2024-06-23' }
    ],
    totalCost: 4050000,
    totalDuration: 140
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200'
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const isLoading = circularsLoading || analysisLoading

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Impact Analysis
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Analyze the impact of regulatory changes on your organization
            </p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">
            <Button variant="outline">
              Export Analysis
            </Button>
            <Button variant="primary">
              Generate Report
            </Button>
          </div>
        </div>

        {/* Circular Selection */}
        {!circularId && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Circular for Analysis</h3>
            <select
              value={selectedCircular}
              onChange={(e) => setSelectedCircular(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Choose a circular...</option>
              {circulars?.map((circular: any) => (
                <option key={circular.id} value={circular.id}>
                  {circular.id} - {circular.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : selectedCircular && mockImpactAnalysis ? (
          <>
            {/* Circular Info */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{mockImpactAnalysis.circular.title}</h3>
                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                    <span className="font-medium">{mockImpactAnalysis.circular.id}</span>
                    <span>•</span>
                    <span>{mockImpactAnalysis.circular.category}</span>
                    <span>•</span>
                    <span>Effective: {new Date(mockImpactAnalysis.circular.effectiveDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{mockImpactAnalysis.overallImpact.score}/10</div>
                  <div className={`text-sm font-medium capitalize ${getImpactColor(mockImpactAnalysis.overallImpact.level).split(' ')[0]}`}>
                    {mockImpactAnalysis.overallImpact.level} Impact
                  </div>
                </div>
              </div>
              <p className="mt-3 text-gray-700">{mockImpactAnalysis.overallImpact.summary}</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Estimated Cost</dt>
                        <dd className="text-lg font-medium text-gray-900">{formatCurrency(mockImpactAnalysis.totalCost)}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ClockIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Implementation Time</dt>
                        <dd className="text-lg font-medium text-gray-900">{mockImpactAnalysis.totalDuration} days</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Impact Areas</dt>
                        <dd className="text-lg font-medium text-gray-900">{mockImpactAnalysis.impactAreas.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Impact Areas */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Impact Areas</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {mockImpactAnalysis.impactAreas.map((area, index) => (
                  <div key={index} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <CogIcon className="h-5 w-5 text-gray-400" />
                          <h4 className="font-medium text-gray-900">{area.area}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getImpactColor(area.impact)}`}>
                            {area.impact} Impact
                          </span>
                          <span className="text-sm font-medium text-gray-600">Score: {area.score}/10</span>
                        </div>
                        
                        <p className="mt-2 text-sm text-gray-600">{area.description}</p>
                        
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                          <div>
                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Estimated Cost</dt>
                            <dd className="mt-1 text-sm font-medium text-gray-900">{formatCurrency(area.estimatedCost)}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Time to Implement</dt>
                            <dd className="mt-1 text-sm font-medium text-gray-900">{area.timeToImplement} days</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Resources Required</dt>
                            <dd className="mt-1 text-sm text-gray-900">{area.resources.join(', ')}</dd>
                          </div>
                        </div>
                        
                        {area.risks.length > 0 && (
                          <div className="mt-4">
                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Key Risks</dt>
                            <dd className="mt-1">
                              <ul className="text-sm text-gray-600 space-y-1">
                                {area.risks.map((risk, riskIndex) => (
                                  <li key={riskIndex} className="flex items-start">
                                    <span className="text-red-400 mr-2">•</span>
                                    {risk}
                                  </li>
                                ))}
                              </ul>
                            </dd>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recommendations</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {mockImpactAnalysis.recommendations.map((rec, index) => (
                  <div key={index} className="p-6">
                    <div className="flex items-start space-x-3">
                      <LightBulbIcon className="h-5 w-5 text-yellow-500 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900">{rec.action}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getPriorityColor(rec.priority)}`}>
                            {rec.priority} Priority
                          </span>
                        </div>
                        <div className="mt-2 flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            Timeline: {rec.timeline}
                          </div>
                          <div className="flex items-center">
                            <UserGroupIcon className="h-4 w-4 mr-1" />
                            Owner: {rec.owner}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Implementation Timeline */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Implementation Timeline</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {mockImpactAnalysis.timeline.map((phase, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-4 h-4 bg-indigo-600 rounded-full"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{phase.phase}</h4>
                          <span className="text-sm text-gray-500">{phase.duration} days</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {new Date(phase.startDate).toLocaleDateString()} - {new Date(phase.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          !isLoading && (
            <div className="text-center py-12">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No Analysis Available</h3>
              <p className="mt-1 text-sm text-gray-500">
                Select a circular to view its impact analysis.
              </p>
            </div>
          )
        )}
      </div>
    </AppLayout>
  )
}
