/**
 * Workflow Analytics Component
 * Analytics and reporting for workflow performance and metrics
 */

import {
    Badge,
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    LoadingSpinner
} from '@/components/ui';
import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';

// Types
export interface WorkflowAnalyticsData {
  overview: {
    totalWorkflows: number;
    activeWorkflows: number;
    totalInstances: number;
    completedInstances: number;
    averageCompletionTime: number;
    onTimeCompletionRate: number;
  };
  performanceMetrics: {
    workflowId: string;
    workflowName: string;
    totalInstances: number;
    completedInstances: number;
    averageCompletionTime: number;
    onTimeRate: number;
    bottlenecks: string[];
  }[];
  taskMetrics: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    averageTaskTime: number;
    tasksByStatus: Record<string, number>;
    tasksByPriority: Record<string, number>;
  };
  timeAnalysis: {
    period: string;
    workflowsStarted: number;
    workflowsCompleted: number;
    averageTime: number;
  }[];
  bottleneckAnalysis: {
    stepName: string;
    workflowName: string;
    averageTime: number;
    frequency: number;
    impact: 'low' | 'medium' | 'high';
  }[];
  userProductivity: {
    userId: string;
    userName: string;
    tasksCompleted: number;
    averageTaskTime: number;
    onTimeRate: number;
    workloadScore: number;
  }[];
}

export interface WorkflowAnalyticsProps {
  workflows: any[];
  tasks: any[];
  dateRange?: {
    start: string;
    end: string;
  };
}

const WorkflowAnalytics: React.FC<WorkflowAnalyticsProps> = ({
  workflows,
  tasks,
  dateRange
}) => {
  const [analyticsData, setAnalyticsData] = useState<WorkflowAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'completion' | 'efficiency' | 'bottlenecks' | 'users'>('completion');

  // Generate mock analytics data
  useEffect(() => {
    const generateAnalytics = () => {
      const mockData: WorkflowAnalyticsData = {
        overview: {
          totalWorkflows: workflows.length,
          activeWorkflows: workflows.filter(w => w.status === 'active').length,
          totalInstances: workflows.reduce((sum, w) => sum + w.totalInstances, 0),
          completedInstances: workflows.reduce((sum, w) => sum + w.completedInstances, 0),
          averageCompletionTime: 72,
          onTimeCompletionRate: 85
        },
        performanceMetrics: workflows.map(workflow => ({
          workflowId: workflow.id,
          workflowName: workflow.name,
          totalInstances: workflow.totalInstances,
          completedInstances: workflow.completedInstances,
          averageCompletionTime: workflow.averageCompletionTime,
          onTimeRate: Math.random() * 30 + 70, // 70-100%
          bottlenecks: ['Review Step', 'Approval Process'].slice(0, Math.floor(Math.random() * 2) + 1)
        })),
        taskMetrics: {
          totalTasks: tasks.length,
          completedTasks: tasks.filter(t => t.status === 'completed').length,
          overdueTasks: tasks.filter(t => t.status === 'overdue').length,
          averageTaskTime: 24,
          tasksByStatus: {
            pending: tasks.filter(t => t.status === 'pending').length,
            in_progress: tasks.filter(t => t.status === 'in_progress').length,
            completed: tasks.filter(t => t.status === 'completed').length,
            overdue: tasks.filter(t => t.status === 'overdue').length
          },
          tasksByPriority: {
            low: tasks.filter(t => t.priority === 'low').length,
            medium: tasks.filter(t => t.priority === 'medium').length,
            high: tasks.filter(t => t.priority === 'high').length,
            critical: tasks.filter(t => t.priority === 'critical').length
          }
        },
        timeAnalysis: [
          { period: 'Week 1', workflowsStarted: 12, workflowsCompleted: 8, averageTime: 68 },
          { period: 'Week 2', workflowsStarted: 15, workflowsCompleted: 12, averageTime: 72 },
          { period: 'Week 3', workflowsStarted: 18, workflowsCompleted: 15, averageTime: 75 },
          { period: 'Week 4', workflowsStarted: 14, workflowsCompleted: 16, averageTime: 69 }
        ],
        bottleneckAnalysis: [
          {
            stepName: 'Manager Approval',
            workflowName: 'Document Approval Process',
            averageTime: 48,
            frequency: 23,
            impact: 'high'
          },
          {
            stepName: 'Risk Assessment',
            workflowName: 'RBI Circular Review Process',
            averageTime: 36,
            frequency: 18,
            impact: 'medium'
          },
          {
            stepName: 'Stakeholder Review',
            workflowName: 'Compliance Assessment Workflow',
            averageTime: 24,
            frequency: 15,
            impact: 'medium'
          },
          {
            stepName: 'Final Verification',
            workflowName: 'Audit Planning & Execution',
            averageTime: 12,
            frequency: 8,
            impact: 'low'
          }
        ],
        userProductivity: [
          {
            userId: 'user-001',
            userName: 'John Smith',
            tasksCompleted: 24,
            averageTaskTime: 18,
            onTimeRate: 92,
            workloadScore: 85
          },
          {
            userId: 'user-002',
            userName: 'Sarah Johnson',
            tasksCompleted: 31,
            averageTaskTime: 22,
            onTimeRate: 88,
            workloadScore: 78
          },
          {
            userId: 'user-003',
            userName: 'Mike Wilson',
            tasksCompleted: 19,
            averageTaskTime: 28,
            onTimeRate: 76,
            workloadScore: 92
          },
          {
            userId: 'user-004',
            userName: 'Emily Davis',
            tasksCompleted: 27,
            averageTaskTime: 20,
            onTimeRate: 94,
            workloadScore: 82
          }
        ]
      };

      setAnalyticsData(mockData);
      setLoading(false);
    };

    // Simulate API call delay
    setTimeout(generateAnalytics, 1000);
  }, [workflows, tasks, selectedPeriod]);

  // Utility functions
  const getImpactBadgeVariant = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'secondary';
    }
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`;
  };

  const formatHours = (hours: number) => {
    if (hours < 24) {
      return `${hours}h`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No analytics data available
          </h3>
          <p className="text-gray-600">
            Analytics will be available once you have workflow data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Workflow Analytics</h2>
          <p className="text-gray-600 mt-1">Performance insights and metrics for your workflows</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="outline" size="sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Workflows</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData.overview.totalWorkflows}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {analyticsData.overview.activeWorkflows} active
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPercentage((analyticsData.overview.completedInstances / analyticsData.overview.totalInstances) * 100)}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {analyticsData.overview.completedInstances} of {analyticsData.overview.totalInstances}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Completion Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatHours(analyticsData.overview.averageCompletionTime)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {formatPercentage(analyticsData.overview.onTimeCompletionRate)} on time
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Task Efficiency</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPercentage((analyticsData.taskMetrics.completedTasks / analyticsData.taskMetrics.totalTasks) * 100)}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {analyticsData.taskMetrics.overdueTasks} overdue
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metric Selection */}
      <div className="flex items-center gap-2">
        {[
          { id: 'completion', label: 'Completion Analysis', icon: '✅' },
          { id: 'efficiency', label: 'Efficiency Metrics', icon: '⚡' },
          { id: 'bottlenecks', label: 'Bottleneck Analysis', icon: '🚧' },
          { id: 'users', label: 'User Productivity', icon: '👥' }
        ].map((metric) => (
          <button
            key={metric.id}
            onClick={() => setSelectedMetric(metric.id as any)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
              selectedMetric === metric.id
                ? 'bg-brand-100 text-brand-700 border border-brand-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            )}
          >
            <span>{metric.icon}</span>
            {metric.label}
          </button>
        ))}
      </div>

      {/* Content based on selected metric */}
      {selectedMetric === 'completion' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.performanceMetrics.map((workflow) => (
                  <div key={workflow.workflowId} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{workflow.workflowName}</h4>
                      <Badge variant="outline">
                        {formatPercentage(workflow.onTimeRate)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Instances:</span>
                        <div className="font-medium">{workflow.totalInstances}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Completed:</span>
                        <div className="font-medium">{workflow.completedInstances}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Avg. Time:</span>
                        <div className="font-medium">{formatHours(workflow.averageCompletionTime)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Time Trend Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.timeAnalysis.map((period) => (
                  <div key={period.period} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium text-gray-900">{period.period}</div>
                      <div className="text-sm text-gray-600">
                        Started: {period.workflowsStarted} | Completed: {period.workflowsCompleted}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-blue-600">
                        {formatHours(period.averageTime)}
                      </div>
                      <div className="text-xs text-gray-600">avg. time</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedMetric === 'efficiency' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analyticsData.taskMetrics.tasksByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'w-3 h-3 rounded-full',
                        status === 'completed' ? 'bg-green-500' :
                        status === 'in_progress' ? 'bg-blue-500' :
                        status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                      )}></div>
                      <span className="capitalize text-gray-700">{status.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{count}</span>
                      <span className="text-sm text-gray-600">
                        ({formatPercentage((count / analyticsData.taskMetrics.totalTasks) * 100)})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Priority Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analyticsData.taskMetrics.tasksByPriority).map(([priority, count]) => (
                  <div key={priority} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        priority === 'critical' ? 'destructive' :
                        priority === 'high' ? 'warning' :
                        priority === 'medium' ? 'primary' : 'secondary'
                      } className="text-xs">
                        {priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{count}</span>
                      <span className="text-sm text-gray-600">
                        ({formatPercentage((count / analyticsData.taskMetrics.totalTasks) * 100)})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedMetric === 'bottlenecks' && (
        <Card>
          <CardHeader>
            <CardTitle>Bottleneck Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.bottleneckAnalysis.map((bottleneck, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{bottleneck.stepName}</h4>
                      <p className="text-sm text-gray-600">{bottleneck.workflowName}</p>
                    </div>
                    <Badge variant={getImpactBadgeVariant(bottleneck.impact)}>
                      {bottleneck.impact} impact
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Avg. Time:</span>
                      <div className="font-medium">{formatHours(bottleneck.averageTime)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Frequency:</span>
                      <div className="font-medium">{bottleneck.frequency} times</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Impact:</span>
                      <div className="font-medium capitalize">{bottleneck.impact}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedMetric === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle>User Productivity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.userProductivity.map((user) => (
                <div key={user.userId} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{user.userName}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        Workload: {user.workloadScore}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Tasks Done:</span>
                      <div className="font-medium">{user.tasksCompleted}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Avg. Time:</span>
                      <div className="font-medium">{formatHours(user.averageTaskTime)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">On-Time Rate:</span>
                      <div className="font-medium">{formatPercentage(user.onTimeRate)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Efficiency:</span>
                      <div className={cn(
                        'font-medium',
                        user.onTimeRate > 90 ? 'text-green-600' :
                        user.onTimeRate > 80 ? 'text-yellow-600' : 'text-red-600'
                      )}>
                        {user.onTimeRate > 90 ? 'High' : user.onTimeRate > 80 ? 'Medium' : 'Low'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WorkflowAnalytics;
