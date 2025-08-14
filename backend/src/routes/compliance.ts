import express from 'express'
import { auth, requirePermission } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import { body, validationResult } from 'express-validator'
import { logger } from '../utils/logger'

const router = express.Router()

// Get all workflows
router.get('/workflows', auth, requirePermission('compliance:read'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, priority, assignee, search } = req.query

  // Mock workflows data
  const workflows = [
    {
      id: 'wf_001',
      name: 'Q4 Risk Assessment',
      description: 'Quarterly risk assessment and compliance review process',
      status: 'active',
      priority: 'high',
      assignee: {
        id: 'user_001',
        name: 'John Smith',
        email: 'john.smith@bank.com'
      },
      creator: {
        id: 'user_002',
        name: 'Admin User',
        email: 'admin@bank.com'
      },
      dueDate: '2024-01-25',
      progress: 75,
      tasks: [
        { id: 'task_001', name: 'Data Collection', status: 'completed', progress: 100 },
        { id: 'task_002', name: 'Risk Analysis', status: 'in_progress', progress: 60 },
        { id: 'task_003', name: 'Report Generation', status: 'pending', progress: 0 }
      ],
      regulatoryReference: 'RBI-2024-13',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-15',
      tags: ['risk', 'quarterly', 'assessment']
    },
    {
      id: 'wf_002',
      name: 'KYC Documentation Review',
      description: 'Review and update KYC documentation procedures',
      status: 'active',
      priority: 'medium',
      assignee: {
        id: 'user_003',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@bank.com'
      },
      creator: {
        id: 'user_002',
        name: 'Admin User',
        email: 'admin@bank.com'
      },
      dueDate: '2024-01-20',
      progress: 45,
      tasks: [
        { id: 'task_004', name: 'Document Review', status: 'in_progress', progress: 70 },
        { id: 'task_005', name: 'Process Update', status: 'pending', progress: 0 },
        { id: 'task_006', name: 'Training Material', status: 'pending', progress: 0 }
      ],
      regulatoryReference: 'RBI-2024-15',
      createdAt: '2024-01-05',
      updatedAt: '2024-01-12',
      tags: ['kyc', 'documentation', 'review']
    },
    {
      id: 'wf_003',
      name: 'Compliance Training Update',
      description: 'Update compliance training materials and conduct sessions',
      status: 'completed',
      priority: 'low',
      assignee: {
        id: 'user_004',
        name: 'Mike Wilson',
        email: 'mike.wilson@bank.com'
      },
      creator: {
        id: 'user_002',
        name: 'Admin User',
        email: 'admin@bank.com'
      },
      dueDate: '2024-01-18',
      progress: 100,
      tasks: [
        { id: 'task_007', name: 'Material Update', status: 'completed', progress: 100 },
        { id: 'task_008', name: 'Session Conduct', status: 'completed', progress: 100 },
        { id: 'task_009', name: 'Assessment', status: 'completed', progress: 100 }
      ],
      regulatoryReference: null,
      createdAt: '2024-01-02',
      updatedAt: '2024-01-18',
      completedAt: '2024-01-18',
      tags: ['training', 'compliance', 'education']
    }
  ]

  // Apply filters
  let filteredWorkflows = workflows

  if (status) {
    filteredWorkflows = filteredWorkflows.filter(wf => wf.status === status)
  }

  if (priority) {
    filteredWorkflows = filteredWorkflows.filter(wf => wf.priority === priority)
  }

  if (assignee) {
    filteredWorkflows = filteredWorkflows.filter(wf => wf.assignee.id === assignee)
  }

  if (search) {
    const searchTerm = (search as string).toLowerCase()
    filteredWorkflows = filteredWorkflows.filter(wf =>
      wf.name.toLowerCase().includes(searchTerm) ||
      wf.description.toLowerCase().includes(searchTerm) ||
      wf.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    )
  }

  // Pagination
  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  const startIndex = (pageNum - 1) * limitNum
  const endIndex = startIndex + limitNum

  const paginatedWorkflows = filteredWorkflows.slice(startIndex, endIndex)

  res.json({
    success: true,
    data: {
      workflows: paginatedWorkflows,
      pagination: {
        current: pageNum,
        limit: limitNum,
        total: filteredWorkflows.length,
        pages: Math.ceil(filteredWorkflows.length / limitNum)
      }
    }
  })
}))

// Get specific workflow
router.get('/workflows/:id', auth, requirePermission('compliance:read'), asyncHandler(async (req, res) => {
  const { id } = req.params

  // Mock workflow data
  const workflow = {
    id: id,
    name: 'Q4 Risk Assessment',
    description: 'Quarterly risk assessment and compliance review process',
    status: 'active',
    priority: 'high',
    assignee: {
      id: 'user_001',
      name: 'John Smith',
      email: 'john.smith@bank.com',
      department: 'Risk Management'
    },
    creator: {
      id: 'user_002',
      name: 'Admin User',
      email: 'admin@bank.com'
    },
    dueDate: '2024-01-25',
    progress: 75,
    tasks: [
      {
        id: 'task_001',
        name: 'Data Collection',
        description: 'Collect all relevant risk data from various departments',
        status: 'completed',
        progress: 100,
        assignee: 'John Smith',
        dueDate: '2024-01-10',
        completedDate: '2024-01-09',
        documents: ['risk_data_q4.xlsx', 'market_data.pdf']
      },
      {
        id: 'task_002',
        name: 'Risk Analysis',
        description: 'Analyze collected data and identify risk patterns',
        status: 'in_progress',
        progress: 60,
        assignee: 'John Smith',
        dueDate: '2024-01-20',
        documents: ['analysis_draft.docx']
      },
      {
        id: 'task_003',
        name: 'Report Generation',
        description: 'Generate comprehensive risk assessment report',
        status: 'pending',
        progress: 0,
        assignee: 'John Smith',
        dueDate: '2024-01-25',
        documents: []
      }
    ],
    regulatoryReference: {
      id: 'RBI-2024-13',
      title: 'RBI/2024/13 - Liquidity Risk Management'
    },
    documents: [
      {
        id: 'doc_001',
        name: 'Risk Assessment Template',
        type: 'template',
        uploadedBy: 'Admin User',
        uploadedAt: '2024-01-01'
      }
    ],
    comments: [
      {
        id: 'comment_001',
        author: 'John Smith',
        message: 'Data collection completed ahead of schedule',
        timestamp: '2024-01-09T10:30:00Z'
      },
      {
        id: 'comment_002',
        author: 'Admin User',
        message: 'Great progress! Please ensure analysis includes market risk factors',
        timestamp: '2024-01-10T14:15:00Z'
      }
    ],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15',
    tags: ['risk', 'quarterly', 'assessment']
  }

  res.json({
    success: true,
    data: workflow
  })
}))

// Create new workflow
router.post('/workflows', auth, requirePermission('compliance:write'), [
  body('name').trim().isLength({ min: 3, max: 100 }),
  body('description').trim().isLength({ min: 10, max: 500 }),
  body('priority').isIn(['low', 'medium', 'high']),
  body('assigneeId').isMongoId(),
  body('dueDate').isISO8601()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    })
  }

  const { name, description, priority, assigneeId, dueDate, regulatoryReference, tags } = req.body

  // Mock workflow creation
  const newWorkflow = {
    id: `wf_${Date.now()}`,
    name,
    description,
    status: 'active',
    priority,
    assignee: {
      id: assigneeId,
      name: 'Assigned User', // In production, fetch from database
      email: 'user@bank.com'
    },
    creator: {
      id: req.user!.userId,
      name: 'Current User', // In production, fetch from database
      email: req.user!.email
    },
    dueDate,
    progress: 0,
    tasks: [],
    regulatoryReference,
    documents: [],
    comments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: tags || []
  }

  logger.info(`New workflow created: ${newWorkflow.id} by user ${req.user!.userId}`)

  res.status(201).json({
    success: true,
    message: 'Workflow created successfully',
    data: newWorkflow
  })
}))

// Update workflow
router.put('/workflows/:id', auth, requirePermission('compliance:write'), [
  body('name').optional().trim().isLength({ min: 3, max: 100 }),
  body('description').optional().trim().isLength({ min: 10, max: 500 }),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('status').optional().isIn(['active', 'completed', 'cancelled', 'on_hold']),
  body('assigneeId').optional().isMongoId(),
  body('dueDate').optional().isISO8601()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    })
  }

  const { id } = req.params
  const updateData = req.body

  logger.info(`Workflow ${id} updated by user ${req.user!.userId}`)

  res.json({
    success: true,
    message: 'Workflow updated successfully',
    data: {
      id,
      ...updateData,
      updatedAt: new Date(),
      updatedBy: req.user!.userId
    }
  })
}))

// Add task to workflow
router.post('/workflows/:id/tasks', auth, requirePermission('compliance:write'), [
  body('name').trim().isLength({ min: 3, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('assignee').optional().trim(),
  body('dueDate').optional().isISO8601()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    })
  }

  const { id } = req.params
  const { name, description, assignee, dueDate } = req.body

  const newTask = {
    id: `task_${Date.now()}`,
    name,
    description,
    status: 'pending',
    progress: 0,
    assignee,
    dueDate,
    createdAt: new Date(),
    createdBy: req.user!.userId
  }

  logger.info(`New task added to workflow ${id} by user ${req.user!.userId}`)

  res.status(201).json({
    success: true,
    message: 'Task added successfully',
    data: newTask
  })
}))

// Update task status
router.patch('/workflows/:workflowId/tasks/:taskId', auth, requirePermission('compliance:write'), [
  body('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled']),
  body('progress').optional().isInt({ min: 0, max: 100 })
], asyncHandler(async (req, res) => {
  const { workflowId, taskId } = req.params
  const { status, progress, notes } = req.body

  logger.info(`Task ${taskId} in workflow ${workflowId} updated by user ${req.user!.userId}`)

  res.json({
    success: true,
    message: 'Task updated successfully',
    data: {
      taskId,
      workflowId,
      status,
      progress,
      notes,
      updatedAt: new Date(),
      updatedBy: req.user!.userId
    }
  })
}))

// Add comment to workflow
router.post('/workflows/:id/comments', auth, requirePermission('compliance:write'), [
  body('message').trim().isLength({ min: 1, max: 1000 })
], asyncHandler(async (req, res) => {
  const { id } = req.params
  const { message } = req.body

  const newComment = {
    id: `comment_${Date.now()}`,
    workflowId: id,
    author: req.user!.userId,
    message,
    timestamp: new Date()
  }

  logger.info(`Comment added to workflow ${id} by user ${req.user!.userId}`)

  res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    data: newComment
  })
}))

// Get workflow templates
router.get('/templates', auth, requirePermission('compliance:read'), asyncHandler(async (req, res) => {
  const templates = [
    {
      id: 'template_001',
      name: 'Risk Assessment Template',
      description: 'Standard template for quarterly risk assessments',
      category: 'Risk Management',
      tasks: [
        { name: 'Data Collection', description: 'Collect relevant risk data' },
        { name: 'Risk Analysis', description: 'Analyze collected data' },
        { name: 'Report Generation', description: 'Generate assessment report' }
      ],
      estimatedDuration: 14, // days
      requiredRoles: ['risk_manager', 'compliance_officer']
    },
    {
      id: 'template_002',
      name: 'KYC Review Template',
      description: 'Template for KYC documentation review processes',
      category: 'KYC',
      tasks: [
        { name: 'Document Review', description: 'Review existing KYC documents' },
        { name: 'Gap Analysis', description: 'Identify compliance gaps' },
        { name: 'Process Update', description: 'Update KYC processes' }
      ],
      estimatedDuration: 10, // days
      requiredRoles: ['compliance_officer']
    }
  ]

  res.json({
    success: true,
    data: templates
  })
}))

export default router
