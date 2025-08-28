import { NextRequest, NextResponse } from 'next/server'

// Mock data for analytics
const mockAnalyticsData = {
  overview: {
    totalCompliance: 87,
    activeRisks: 12,
    completedTasks: 156,
    pendingTasks: 23,
    complianceScore: 8.7,
    riskScore: 6.2,
    trendsData: {
      compliance: [
        { month: 'Oct', score: 85 },
        { month: 'Nov', score: 86 },
        { month: 'Dec', score: 84 },
        { month: 'Jan', score: 87 }
      ],
      risk: [
        { month: 'Oct', score: 6.8 },
        { month: 'Nov', score: 6.5 },
        { month: 'Dec', score: 6.3 },
        { month: 'Jan', score: 6.2 }
      ]
    }
  },
  complianceByCategory: [
    { category: 'KYC/AML', completed: 45, total: 50, percentage: 90 },
    { category: 'Digital Payments', completed: 38, total: 42, percentage: 90.5 },
    { category: 'Risk Management', completed: 28, total: 35, percentage: 80 },
    { category: 'Audit & Reporting', completed: 32, total: 40, percentage: 80 },
    { category: 'Data Protection', completed: 25, total: 30, percentage: 83.3 }
  ],
  riskDistribution: [
    { level: 'High', count: 8, percentage: 33.3 },
    { level: 'Medium', count: 12, percentage: 50 },
    { level: 'Low', count: 4, percentage: 16.7 }
  ],
  recentActivity: [
    {
      id: '1',
      type: 'compliance_task',
      title: 'KYC Documentation Review Completed',
      timestamp: '2024-01-15T10:30:00Z',
      status: 'completed',
      user: 'Compliance Team'
    },
    {
      id: '2',
      type: 'risk_assessment',
      title: 'Digital Payment Security Risk Updated',
      timestamp: '2024-01-15T09:15:00Z',
      status: 'updated',
      user: 'Risk Management Team'
    },
    {
      id: '3',
      type: 'regulatory_update',
      title: 'New RBI Circular on Digital Lending',
      timestamp: '2024-01-14T16:45:00Z',
      status: 'new',
      user: 'System'
    },
    {
      id: '4',
      type: 'compliance_task',
      title: 'Quarterly Risk Report Generation',
      timestamp: '2024-01-14T14:20:00Z',
      status: 'in_progress',
      user: 'Reporting Team'
    }
  ],
  upcomingDeadlines: [
    {
      id: '1',
      title: 'Quarterly Compliance Report',
      dueDate: '2024-01-31',
      category: 'Reporting',
      priority: 'high',
      assignee: 'Compliance Team'
    },
    {
      id: '2',
      title: 'KYC Process Audit',
      dueDate: '2024-02-05',
      category: 'Audit',
      priority: 'medium',
      assignee: 'Audit Team'
    },
    {
      id: '3',
      title: 'Risk Assessment Review',
      dueDate: '2024-02-10',
      category: 'Risk Management',
      priority: 'medium',
      assignee: 'Risk Management Team'
    },
    {
      id: '4',
      title: 'Digital Payment Security Update',
      dueDate: '2024-02-15',
      category: 'Security',
      priority: 'high',
      assignee: 'Security Team'
    }
  ],
  performanceMetrics: {
    complianceEfficiency: 92.5,
    riskMitigationRate: 78.3,
    taskCompletionRate: 87.1,
    averageResolutionTime: 3.2, // days
    regulatoryUpdatesProcessed: 24,
    documentsManaged: 156
  },
  departmentPerformance: [
    { department: 'Compliance', score: 92, tasks: 45, completed: 41 },
    { department: 'Risk Management', score: 88, tasks: 32, completed: 28 },
    { department: 'Audit', score: 85, tasks: 28, completed: 24 },
    { department: 'Legal', score: 90, tasks: 20, completed: 18 },
    { department: 'Operations', score: 87, tasks: 35, completed: 30 }
  ]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d'
    const department = searchParams.get('department') || ''
    const metric = searchParams.get('metric') || ''

    // In a real implementation, you would filter and aggregate data based on parameters
    let analytics = { ...mockAnalyticsData }

    // Simulate time range filtering
    if (timeRange === '7d') {
      analytics.overview.completedTasks = 45
      analytics.overview.pendingTasks = 8
      analytics.recentActivity = analytics.recentActivity.slice(0, 2)
    } else if (timeRange === '90d') {
      analytics.overview.completedTasks = 420
      analytics.overview.pendingTasks = 67
    } else if (timeRange === '1y') {
      analytics.overview.completedTasks = 1680
      analytics.overview.pendingTasks = 234
    }

    // Simulate department filtering
    if (department) {
      const deptData = analytics.departmentPerformance.find(d =>
        d.department.toLowerCase() === department.toLowerCase()
      )
      if (deptData) {
        analytics.overview.completedTasks = deptData.completed
        analytics.overview.pendingTasks = deptData.tasks - deptData.completed
        analytics.overview.complianceScore = deptData.score / 10
      }
    }

    // Add metadata
    const metadata = {
      timeRange,
      department: department || 'all',
      metric: metric || 'all',
      lastUpdated: new Date().toISOString(),
      dataPoints: analytics.overview.completedTasks + analytics.overview.pendingTasks
    }

    return NextResponse.json({
      success: true,
      data: analytics,
      metadata
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}
