import express from 'express'
import { auth, requirePermission } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import { CacheService } from '../config/redis'
import { logger } from '../utils/logger'

const router = express.Router()

// Get dashboard metrics
router.get('/metrics', auth, asyncHandler(async (req, res) => {
  const cacheKey = `dashboard:metrics:${req.user!.userId}`
  
  // Try to get from cache first
  const cachedData = await CacheService.getJSON(cacheKey)
  if (cachedData) {
    return res.json({
      success: true,
      data: cachedData,
      cached: true
    })
  }

  // Mock data - in production, this would come from database aggregations
  const metrics = {
    complianceScore: {
      current: 87,
      previous: 82,
      trend: 'up',
      change: 5
    },
    activeWorkflows: {
      count: 12,
      pending: 8,
      overdue: 2,
      completed: 45
    },
    pendingTasks: {
      count: 8,
      highPriority: 3,
      mediumPriority: 3,
      lowPriority: 2
    },
    riskLevel: {
      current: 'Medium',
      score: 65,
      previous: 75,
      trend: 'down',
      change: -10
    },
    regulatoryChanges: {
      thisMonth: 5,
      lastMonth: 3,
      pending: 2,
      implemented: 8
    },
    systemHealth: {
      status: 'healthy',
      uptime: 99.9,
      lastIncident: null,
      performance: 95
    }
  }

  // Cache for 5 minutes
  await CacheService.setJSON(cacheKey, metrics, 300)

  res.json({
    success: true,
    data: metrics,
    cached: false
  })
}))

// Get recent activities
router.get('/activities', auth, asyncHandler(async (req, res) => {
  const { limit = 10, offset = 0 } = req.query
  
  // Mock data - in production, this would come from activity logs
  const activities = [
    {
      id: '1',
      type: 'workflow_created',
      title: 'New compliance workflow created',
      description: 'Q4 Risk Assessment workflow has been created',
      user: 'John Smith',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      metadata: {
        workflowId: 'wf_001',
        priority: 'high'
      }
    },
    {
      id: '2',
      type: 'regulation_updated',
      title: 'RBI circular updated',
      description: 'RBI/2024/15 - KYC Guidelines have been updated',
      user: 'System',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      metadata: {
        regulationId: 'rbi_2024_15',
        impact: 'high'
      }
    },
    {
      id: '3',
      type: 'document_uploaded',
      title: 'Compliance document uploaded',
      description: 'AML Policy 2024 has been uploaded for review',
      user: 'Sarah Johnson',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      metadata: {
        documentId: 'doc_001',
        size: '2.5MB'
      }
    },
    {
      id: '4',
      type: 'risk_assessment',
      title: 'Risk assessment completed',
      description: 'Operational risk assessment for Q3 completed',
      user: 'Mike Wilson',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      metadata: {
        assessmentId: 'ra_001',
        score: 75
      }
    },
    {
      id: '5',
      type: 'workflow_approved',
      title: 'Workflow approved',
      description: 'KYC Documentation Review workflow has been approved',
      user: 'Admin',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      metadata: {
        workflowId: 'wf_002',
        approver: 'admin'
      }
    }
  ]

  const startIndex = parseInt(offset as string)
  const limitNum = parseInt(limit as string)
  const paginatedActivities = activities.slice(startIndex, startIndex + limitNum)

  res.json({
    success: true,
    data: {
      activities: paginatedActivities,
      total: activities.length,
      limit: limitNum,
      offset: startIndex
    }
  })
}))

// Get compliance summary
router.get('/compliance-summary', auth, requirePermission('compliance:read'), asyncHandler(async (req, res) => {
  // Mock data - in production, this would aggregate from compliance workflows
  const summary = {
    totalRequirements: 156,
    compliant: 135,
    nonCompliant: 12,
    partiallyCompliant: 9,
    complianceRate: 86.5,
    byCategory: {
      kyc: { total: 45, compliant: 42, rate: 93.3 },
      aml: { total: 38, compliant: 35, rate: 92.1 },
      operational: { total: 32, compliant: 28, rate: 87.5 },
      credit: { total: 25, compliant: 20, rate: 80.0 },
      market: { total: 16, compliant: 10, rate: 62.5 }
    },
    trends: {
      lastMonth: 84.2,
      twoMonthsAgo: 81.8,
      threeMonthsAgo: 79.5
    },
    upcomingDeadlines: [
      {
        requirement: 'Quarterly Risk Report',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'in_progress'
      },
      {
        requirement: 'AML Training Completion',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        status: 'not_started'
      }
    ]
  }

  res.json({
    success: true,
    data: summary
  })
}))

// Get risk overview
router.get('/risk-overview', auth, requirePermission('risk:read'), asyncHandler(async (req, res) => {
  // Mock data - in production, this would aggregate from risk assessments
  const riskOverview = {
    overallRiskScore: 65,
    riskTrend: 'decreasing',
    riskCategories: {
      operational: { score: 70, trend: 'stable', count: 15 },
      credit: { score: 60, trend: 'decreasing', count: 8 },
      market: { score: 75, trend: 'increasing', count: 12 },
      liquidity: { score: 55, trend: 'decreasing', count: 6 },
      compliance: { score: 45, trend: 'decreasing', count: 4 }
    },
    highRiskItems: [
      {
        id: 'risk_001',
        title: 'Cybersecurity Vulnerability',
        category: 'operational',
        score: 85,
        status: 'open',
        assignee: 'IT Security Team'
      },
      {
        id: 'risk_002',
        title: 'Regulatory Compliance Gap',
        category: 'compliance',
        score: 80,
        status: 'in_progress',
        assignee: 'Compliance Team'
      }
    ],
    recentAssessments: [
      {
        id: 'assessment_001',
        title: 'Q4 Operational Risk Assessment',
        completedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        score: 68,
        assessor: 'Risk Team'
      }
    ]
  }

  res.json({
    success: true,
    data: riskOverview
  })
}))

// Get notifications
router.get('/notifications', auth, asyncHandler(async (req, res) => {
  const { unreadOnly = false, limit = 20 } = req.query

  // Mock data - in production, this would come from notifications table
  const notifications = [
    {
      id: 'notif_001',
      type: 'regulation',
      title: 'New RBI Circular',
      message: 'RBI/2024/16 - Updated guidelines for digital lending',
      priority: 'high',
      read: false,
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      actionUrl: '/dashboard/regulatory/RBI-2024-16'
    },
    {
      id: 'notif_002',
      type: 'workflow',
      title: 'Workflow Approval Required',
      message: 'KYC Review workflow requires your approval',
      priority: 'medium',
      read: false,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      actionUrl: '/dashboard/compliance/workflow/kyc-review'
    },
    {
      id: 'notif_003',
      type: 'deadline',
      title: 'Upcoming Deadline',
      message: 'Risk assessment report due in 3 days',
      priority: 'medium',
      read: true,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      actionUrl: '/dashboard/risk/assessment/q4-report'
    },
    {
      id: 'notif_004',
      type: 'system',
      title: 'System Maintenance',
      message: 'Scheduled maintenance on Sunday 2 AM - 4 AM',
      priority: 'low',
      read: true,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      actionUrl: null
    }
  ]

  let filteredNotifications = notifications
  if (unreadOnly === 'true') {
    filteredNotifications = notifications.filter(n => !n.read)
  }

  const limitNum = parseInt(limit as string)
  const paginatedNotifications = filteredNotifications.slice(0, limitNum)

  res.json({
    success: true,
    data: {
      notifications: paginatedNotifications,
      unreadCount: notifications.filter(n => !n.read).length,
      total: filteredNotifications.length
    }
  })
}))

// Mark notification as read
router.patch('/notifications/:id/read', auth, asyncHandler(async (req, res) => {
  const { id } = req.params

  // In production, update notification in database
  logger.info(`Notification ${id} marked as read by user ${req.user!.userId}`)

  res.json({
    success: true,
    message: 'Notification marked as read'
  })
}))

// Get system status
router.get('/system-status', auth, asyncHandler(async (req, res) => {
  const systemStatus = {
    overall: 'healthy',
    services: {
      api: { status: 'healthy', responseTime: 45, uptime: 99.9 },
      database: { status: 'healthy', responseTime: 12, uptime: 99.8 },
      cache: { status: 'healthy', responseTime: 3, uptime: 99.9 },
      fileStorage: { status: 'healthy', responseTime: 25, uptime: 99.7 },
      emailService: { status: 'healthy', responseTime: 150, uptime: 99.5 }
    },
    metrics: {
      totalUsers: 1247,
      activeUsers: 89,
      totalWorkflows: 2156,
      activeWorkflows: 234,
      systemLoad: 45,
      memoryUsage: 67,
      diskUsage: 34
    },
    lastUpdated: new Date()
  }

  res.json({
    success: true,
    data: systemStatus
  })
}))

export default router
