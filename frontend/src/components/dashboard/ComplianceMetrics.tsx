/**
 * ComplianceMetrics Component
 * Build KPI dashboard with benchmark comparisons and trend analysis
 */

import React from 'react'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  StatCard,
  Badge,
  Button,
  LoadingSpinner
} from '@/components/ui'
import { cn } from '@/lib/utils'

// Types
export interface MetricData {
  id: string
  name: string
  value: number
  target: number
  benchmark: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  trendPeriod: string
  status: 'excellent' | 'good' | 'warning' | 'critical'
  description: string
  category: 'compliance' | 'risk' | 'operational' | 'financial'
  historicalData: Array<{
    period: string
    value: number
    target: number
  }>
}

export interface BenchmarkComparison {
  metric: string
  ourValue: number
  industryAverage: number
  topQuartile: number
  bottomQuartile: number
  ranking: 'top' | 'above_average' | 'average' | 'below_average'
  percentile: number
}

export interface ComplianceMetricsProps {
  metrics?: MetricData[]
  benchmarks?: BenchmarkComparison[]
  loading?: boolean
  timeRange?: '7d' | '30d' | '90d' | '1y'
  onTimeRangeChange?: (range: string) => void
  onMetricClick?: (metric: MetricData) => void
  onRefresh?: () => void
}

const ComplianceMetrics: React.FC<ComplianceMetricsProps> = ({
  metrics,
  benchmarks,
  loading = false,
  timeRange = '30d',
  onTimeRangeChange,
  onMetricClick,
  onRefresh
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all')

  // Mock data for demonstration
  const mockMetrics: MetricData[] = [
    {
      id: 'compliance_rate',
      name: 'Overall Compliance Rate',
      value: 94.5,
      target: 95.0,
      benchmark: 89.2,
      unit: '%',
      trend: 'up',
      trendValue: 2.3,
      trendPeriod: 'vs last month',
      status: 'good',
      description: 'Percentage of compliance requirements met',
      category: 'compliance',
      historicalData: [
        { period: '2024-01', value: 92.1, target: 95.0 },
        { period: '2024-02', value: 93.8, target: 95.0 },
        { period: '2024-03', value: 94.5, target: 95.0 }
      ]
    },
    {
      id: 'regulatory_violations',
      name: 'Regulatory Violations',
      value: 3,
      target: 0,
      benchmark: 8.5,
      unit: 'count',
      trend: 'down',
      trendValue: -2,
      trendPeriod: 'vs last month',
      status: 'warning',
      description: 'Number of regulatory violations this period',
      category: 'compliance',
      historicalData: [
        { period: '2024-01', value: 7, target: 0 },
        { period: '2024-02', value: 5, target: 0 },
        { period: '2024-03', value: 3, target: 0 }
      ]
    },
    {
      id: 'risk_score',
      name: 'Composite Risk Score',
      value: 6.8,
      target: 5.0,
      benchmark: 7.2,
      unit: '/10',
      trend: 'stable',
      trendValue: 0.1,
      trendPeriod: 'vs last month',
      status: 'warning',
      description: 'Overall risk assessment score',
      category: 'risk',
      historicalData: [
        { period: '2024-01', value: 7.1, target: 5.0 },
        { period: '2024-02', value: 6.9, target: 5.0 },
        { period: '2024-03', value: 6.8, target: 5.0 }
      ]
    },
    {
      id: 'audit_findings',
      name: 'Open Audit Findings',
      value: 12,
      target: 5,
      benchmark: 18.3,
      unit: 'count',
      trend: 'down',
      trendValue: -3,
      trendPeriod: 'vs last month',
      status: 'warning',
      description: 'Number of unresolved audit findings',
      category: 'compliance',
      historicalData: [
        { period: '2024-01', value: 18, target: 5 },
        { period: '2024-02', value: 15, target: 5 },
        { period: '2024-03', value: 12, target: 5 }
      ]
    },
    {
      id: 'training_completion',
      name: 'Compliance Training Completion',
      value: 87.2,
      target: 90.0,
      benchmark: 82.1,
      unit: '%',
      trend: 'up',
      trendValue: 4.1,
      trendPeriod: 'vs last month',
      status: 'good',
      description: 'Percentage of staff completed compliance training',
      category: 'operational',
      historicalData: [
        { period: '2024-01', value: 79.5, target: 90.0 },
        { period: '2024-02', value: 83.1, target: 90.0 },
        { period: '2024-03', value: 87.2, target: 90.0 }
      ]
    },
    {
      id: 'incident_response_time',
      name: 'Incident Response Time',
      value: 2.4,
      target: 2.0,
      benchmark: 3.1,
      unit: 'hours',
      trend: 'down',
      trendValue: -0.3,
      trendPeriod: 'vs last month',
      status: 'good',
      description: 'Average time to respond to compliance incidents',
      category: 'operational',
      historicalData: [
        { period: '2024-01', value: 3.1, target: 2.0 },
        { period: '2024-02', value: 2.7, target: 2.0 },
        { period: '2024-03', value: 2.4, target: 2.0 }
      ]
    }
  ]

  const mockBenchmarks: BenchmarkComparison[] = [
    {
      metric: 'Compliance Rate',
      ourValue: 94.5,
      industryAverage: 89.2,
      topQuartile: 96.8,
      bottomQuartile: 84.1,
      ranking: 'above_average',
      percentile: 75
    },
    {
      metric: 'Risk Score',
      ourValue: 6.8,
      industryAverage: 7.2,
      topQuartile: 5.1,
      bottomQuartile: 8.9,
      ranking: 'above_average',
      percentile: 68
    },
    {
      metric: 'Training Completion',
      ourValue: 87.2,
      industryAverage: 82.1,
      topQuartile: 92.5,
      bottomQuartile: 76.8,
      ranking: 'above_average',
      percentile: 72
    }
  ]

  const displayMetrics = metrics || mockMetrics
  const displayBenchmarks = benchmarks || mockBenchmarks

  const categories = [
    { id: 'all', name: 'All Metrics', count: displayMetrics.length },
    { id: 'compliance', name: 'Compliance', count: displayMetrics.filter(m => m.category === 'compliance').length },
    { id: 'risk', name: 'Risk', count: displayMetrics.filter(m => m.category === 'risk').length },
    { id: 'operational', name: 'Operational', count: displayMetrics.filter(m => m.category === 'operational').length },
    { id: 'financial', name: 'Financial', count: displayMetrics.filter(m => m.category === 'financial').length }
  ]

  const timeRanges = [
    { id: '7d', name: '7 Days' },
    { id: '30d', name: '30 Days' },
    { id: '90d', name: '90 Days' },
    { id: '1y', name: '1 Year' }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-success-600 bg-success-50'
      case 'good': return 'text-success-600 bg-success-50'
      case 'warning': return 'text-warning-600 bg-warning-50'
      case 'critical': return 'text-error-600 bg-error-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return (
          <svg className="w-4 h-4 text-success-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        )
      case 'down':
        return (
          <svg className="w-4 h-4 text-error-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  const getRankingColor = (ranking: string) => {
    switch (ranking) {
      case 'top': return 'text-success-700 bg-success-100'
      case 'above_average': return 'text-success-600 bg-success-50'
      case 'average': return 'text-warning-600 bg-warning-50'
      case 'below_average': return 'text-error-600 bg-error-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const filteredMetrics = selectedCategory === 'all' 
    ? displayMetrics 
    : displayMetrics.filter(m => m.category === selectedCategory)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Compliance Metrics</h2>
          <p className="text-sm text-gray-600">
            KPI dashboard with benchmark comparisons and trend analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => onTimeRangeChange?.(e.target.value)}
            className="text-sm border rounded-md px-3 py-1"
          >
            {timeRanges.map((range) => (
              <option key={range.id} value={range.id}>
                {range.name}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 overflow-x-auto">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
              selectedCategory === category.id
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {category.name}
            <Badge variant="secondary" className="text-xs">
              {category.count}
            </Badge>
          </button>
        ))}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMetrics.map((metric) => (
          <Card
            key={metric.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onMetricClick?.(metric)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-600">{metric.name}</h4>
                <Badge className={getStatusColor(metric.status)}>
                  {metric.status}
                </Badge>
              </div>
              
              <div className="mb-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {metric.value}
                  </span>
                  <span className="text-sm text-gray-500">{metric.unit}</span>
                </div>
                <div className="text-xs text-gray-500">
                  Target: {metric.target}{metric.unit} | Benchmark: {metric.benchmark}{metric.unit}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                {getTrendIcon(metric.trend)}
                <span className={cn(
                  'text-sm font-medium',
                  metric.trend === 'up' ? 'text-success-600' : 
                  metric.trend === 'down' ? 'text-error-600' : 'text-gray-400'
                )}>
                  {metric.trendValue > 0 ? '+' : ''}{metric.trendValue}
                  {metric.unit === '%' ? 'pp' : metric.unit}
                </span>
                <span className="text-xs text-gray-500">{metric.trendPeriod}</span>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress to Target</span>
                  <span>{((metric.value / metric.target) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={cn(
                      'h-2 rounded-full transition-all',
                      metric.value >= metric.target ? 'bg-success-500' :
                      metric.value >= metric.target * 0.8 ? 'bg-warning-500' : 'bg-error-500'
                    )}
                    style={{ 
                      width: `${Math.min((metric.value / metric.target) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>

              <p className="text-xs text-gray-600">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Benchmark Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Industry Benchmark Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayBenchmarks.map((benchmark, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{benchmark.metric}</h4>
                  <div className="flex items-center gap-2">
                    <Badge className={getRankingColor(benchmark.ranking)}>
                      {benchmark.ranking.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {benchmark.percentile}th percentile
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Our Value</span>
                    <p className="font-semibold text-brand-600">{benchmark.ourValue}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Industry Avg</span>
                    <p className="font-semibold text-gray-900">{benchmark.industryAverage}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Top Quartile</span>
                    <p className="font-semibold text-success-600">{benchmark.topQuartile}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Bottom Quartile</span>
                    <p className="font-semibold text-error-600">{benchmark.bottomQuartile}</p>
                  </div>
                </div>

                {/* Benchmark Visualization */}
                <div className="mt-3">
                  <div className="relative h-2 bg-gray-200 rounded-full">
                    {/* Bottom Quartile */}
                    <div 
                      className="absolute h-2 bg-error-200 rounded-l-full"
                      style={{ width: '25%' }}
                    />
                    {/* Below Average */}
                    <div 
                      className="absolute h-2 bg-warning-200"
                      style={{ left: '25%', width: '25%' }}
                    />
                    {/* Above Average */}
                    <div 
                      className="absolute h-2 bg-success-200"
                      style={{ left: '50%', width: '25%' }}
                    />
                    {/* Top Quartile */}
                    <div 
                      className="absolute h-2 bg-success-300 rounded-r-full"
                      style={{ left: '75%', width: '25%' }}
                    />
                    {/* Our Position */}
                    <div 
                      className="absolute w-3 h-3 bg-brand-600 rounded-full border-2 border-white transform -translate-y-0.5"
                      style={{ 
                        left: `${benchmark.percentile}%`,
                        transform: 'translateX(-50%) translateY(-25%)'
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Bottom 25%</span>
                    <span>Industry Average</span>
                    <span>Top 25%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ComplianceMetrics
