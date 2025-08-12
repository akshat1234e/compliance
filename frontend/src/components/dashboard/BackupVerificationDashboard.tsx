'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  DocumentChartBarIcon,
  ServerIcon,
  DatabaseIcon
} from '@heroicons/react/24/outline'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface BackupVerificationResult {
  id: string
  timestamp: string
  overall_status: 'PASS' | 'FAIL'
  total_tests: number
  passed_tests: number
  failed_tests: number
  success_rate: number
  test_suites: {
    database_integrity?: {
      status: string
      table_count: number
      constraint_count: number
      index_count: number
      orphaned_records: number
      passed: boolean
    }
    redis_integrity?: {
      status: string
      key_count: number
      memory_usage: string
      session_keys: number
      cache_keys: number
      passed: boolean
    }
    performance_tests?: {
      postgresql_restore_seconds: number
      redis_restore_seconds: number
      postgresql_passed: boolean
      redis_passed: boolean
      passed: boolean
    }
    cross_system_validation?: {
      user_count_db: number
      session_count_redis: number
      consistency_ratio: number
      consistency_passed: boolean
      passed: boolean
    }
  }
}

interface BackupVerificationDashboardProps {
  className?: string
}

export function BackupVerificationDashboard({ className }: BackupVerificationDashboardProps) {
  const [verificationResults, setVerificationResults] = useState<BackupVerificationResult[]>([])
  const [latestResult, setLatestResult] = useState<BackupVerificationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Mock data for demonstration
  const mockResults: BackupVerificationResult[] = [
    {
      id: '1',
      timestamp: '2024-01-15T08:00:00Z',
      overall_status: 'PASS',
      total_tests: 4,
      passed_tests: 4,
      failed_tests: 0,
      success_rate: 100,
      test_suites: {
        database_integrity: {
          status: 'success',
          table_count: 45,
          constraint_count: 128,
          index_count: 67,
          orphaned_records: 0,
          passed: true
        },
        redis_integrity: {
          status: 'success',
          key_count: 15420,
          memory_usage: '256MB',
          session_keys: 1250,
          cache_keys: 14170,
          passed: true
        },
        performance_tests: {
          postgresql_restore_seconds: 245,
          redis_restore_seconds: 35,
          postgresql_passed: true,
          redis_passed: true,
          passed: true
        },
        cross_system_validation: {
          user_count_db: 8500,
          session_count_redis: 1250,
          consistency_ratio: 0.15,
          consistency_passed: true,
          passed: true
        }
      }
    },
    {
      id: '2',
      timestamp: '2024-01-14T08:00:00Z',
      overall_status: 'FAIL',
      total_tests: 4,
      passed_tests: 3,
      failed_tests: 1,
      success_rate: 75,
      test_suites: {
        database_integrity: {
          status: 'success',
          table_count: 45,
          constraint_count: 128,
          index_count: 67,
          orphaned_records: 0,
          passed: true
        },
        redis_integrity: {
          status: 'success',
          key_count: 15380,
          memory_usage: '254MB',
          session_keys: 1180,
          cache_keys: 14200,
          passed: true
        },
        performance_tests: {
          postgresql_restore_seconds: 320,
          redis_restore_seconds: 42,
          postgresql_passed: false,
          redis_passed: true,
          passed: false
        },
        cross_system_validation: {
          user_count_db: 8480,
          session_count_redis: 1180,
          consistency_ratio: 0.14,
          consistency_passed: true,
          passed: true
        }
      }
    }
  ]

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      setLoading(true)
      // In real implementation, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setVerificationResults(mockResults)
      setLatestResult(mockResults[0])
      setLoading(false)
    }

    fetchData()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 2000))
    setRefreshing(false)
  }

  const getStatusIcon = (status: 'PASS' | 'FAIL') => {
    return status === 'PASS' 
      ? <CheckCircleIcon className="h-5 w-5 text-green-500" />
      : <XCircleIcon className="h-5 w-5 text-red-500" />
  }

  const getStatusBadge = (passed: boolean) => {
    return (
      <Badge variant={passed ? 'success' : 'destructive'}>
        {passed ? 'PASS' : 'FAIL'}
      </Badge>
    )
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  // Prepare chart data
  const chartData = verificationResults.map(result => ({
    date: new Date(result.timestamp).toLocaleDateString(),
    success_rate: result.success_rate,
    total_tests: result.total_tests,
    passed_tests: result.passed_tests,
    failed_tests: result.failed_tests
  })).reverse()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Backup Verification Dashboard</h2>
          <p className="text-gray-600">Automated backup testing and validation results</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Latest Result Summary */}
      {latestResult && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overall Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(latestResult.overall_status)}
                    <span className="text-2xl font-bold">
                      {latestResult.overall_status}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    {latestResult.success_rate}%
                  </p>
                </div>
                <DocumentChartBarIcon className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tests Passed</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {latestResult.passed_tests}/{latestResult.total_tests}
                  </p>
                </div>
                <CheckCircleIcon className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Last Run</p>
                  <p className="text-sm font-bold text-gray-900">
                    {formatTimestamp(latestResult.timestamp)}
                  </p>
                </div>
                <ClockIcon className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Test Suites Status */}
      {latestResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DatabaseIcon className="h-5 w-5" />
                Database Integrity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {latestResult.test_suites.database_integrity ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    {getStatusBadge(latestResult.test_suites.database_integrity.passed)}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Tables:</span>
                      <span className="ml-2 font-medium">{latestResult.test_suites.database_integrity.table_count}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Constraints:</span>
                      <span className="ml-2 font-medium">{latestResult.test_suites.database_integrity.constraint_count}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Indexes:</span>
                      <span className="ml-2 font-medium">{latestResult.test_suites.database_integrity.index_count}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Orphaned:</span>
                      <span className={`ml-2 font-medium ${latestResult.test_suites.database_integrity.orphaned_records === 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {latestResult.test_suites.database_integrity.orphaned_records}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No data available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ServerIcon className="h-5 w-5" />
                Redis Integrity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {latestResult.test_suites.redis_integrity ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    {getStatusBadge(latestResult.test_suites.redis_integrity.passed)}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Keys:</span>
                      <span className="ml-2 font-medium">{latestResult.test_suites.redis_integrity.key_count.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Memory:</span>
                      <span className="ml-2 font-medium">{latestResult.test_suites.redis_integrity.memory_usage}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Sessions:</span>
                      <span className="ml-2 font-medium">{latestResult.test_suites.redis_integrity.session_keys.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Cache:</span>
                      <span className="ml-2 font-medium">{latestResult.test_suites.redis_integrity.cache_keys.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Metrics */}
      {latestResult?.test_suites.performance_tests && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Restore Performance</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>PostgreSQL Restore</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{latestResult.test_suites.performance_tests.postgresql_restore_seconds}s</span>
                      {getStatusBadge(latestResult.test_suites.performance_tests.postgresql_passed)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Redis Restore</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{latestResult.test_suites.performance_tests.redis_restore_seconds}s</span>
                      {getStatusBadge(latestResult.test_suites.performance_tests.redis_passed)}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">Performance Thresholds</h4>
                <div className="space-y-3 text-sm text-gray-600">
                  <div>PostgreSQL: ≤ 300 seconds</div>
                  <div>Redis: ≤ 60 seconds</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historical Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Historical Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="success_rate" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Success Rate (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default BackupVerificationDashboard
