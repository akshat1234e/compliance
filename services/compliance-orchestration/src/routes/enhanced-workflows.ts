/**
 * Enhanced Workflow Routes
 * API endpoints for enhanced workflow management with full CRUD operations
 */

import { asyncHandler } from '@middleware/errorHandler';
import { validateRequest } from '@middleware/validation';
import { logger } from '@utils/logger';
import { Request, Response, Router } from 'express';
import { body, param, query } from 'express-validator';
import WorkflowService from '../services/WorkflowService';

const router = Router();
const workflowService = new WorkflowService();

/**
 * @route   POST /api/v1/workflow-definitions
 * @desc    Create a new workflow definition
 * @access  Private
 */
router.post(
  '/definitions',
  [
    body('name').notEmpty().withMessage('Workflow name is required'),
    body('displayName').notEmpty().withMessage('Display name is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('workflowType').notEmpty().withMessage('Workflow type is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('processDefinition').isObject().withMessage('Process definition must be an object'),
    body('formSchema').optional().isObject().withMessage('Form schema must be an object'),
    body('triggerType').optional().isString().withMessage('Trigger type must be a string'),
    body('triggerConditions').optional().isObject().withMessage('Trigger conditions must be an object'),
    body('defaultSlaHours').optional().isInt({ min: 1 }).withMessage('SLA hours must be positive'),
    body('escalationRules').optional().isObject().withMessage('Escalation rules must be an object'),
    body('defaultAssigneeType').optional().isString().withMessage('Assignee type must be a string'),
    body('defaultAssigneeId').optional().isString().withMessage('Assignee ID must be a string'),
    body('assignmentRules').optional().isObject().withMessage('Assignment rules must be an object'),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const createRequest = {
      ...req.body,
      organizationId: req.user?.organizationId
    };

    logger.info('Creating workflow definition', {
      name: createRequest.name,
      createdBy: req.user?.id
    });

    const workflowDefinition = await workflowService.createWorkflowDefinition(
      createRequest,
      req.user?.id!
    );

    res.status(201).json({
      success: true,
      data: workflowDefinition,
      message: 'Workflow definition created successfully'
    });
  })
);

/**
 * @route   GET /api/v1/workflow-definitions
 * @desc    Get workflow definitions with filtering and pagination
 * @access  Private
 */
router.get(
  '/definitions',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    query('status').optional().isIn(['draft', 'active', 'inactive', 'archived']).withMessage('Invalid status'),
    query('category').optional().isString().withMessage('Category must be a string'),
    query('workflowType').optional().isString().withMessage('Workflow type must be a string'),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      status: req.query.status as string,
      category: req.query.category as string,
      workflowType: req.query.workflowType as string,
      search: req.query.search as string
    };

    const pagination = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      sortBy: req.query.sortBy as string || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
    };

    const result = await workflowService.getWorkflowDefinitions(
      req.user?.organizationId!,
      filters,
      pagination
    );

    res.json({
      success: true,
      data: result,
      message: 'Workflow definitions retrieved successfully'
    });
  })
);

/**
 * @route   GET /api/v1/workflow-definitions/:id
 * @desc    Get workflow definition by ID
 * @access  Private
 */
router.get(
  '/definitions/:id',
  [
    param('id').notEmpty().withMessage('Workflow definition ID is required')
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const workflowDefinition = await workflowService.getWorkflowDefinitionById(req.params.id);

    if (!workflowDefinition) {
      return res.status(404).json({
        success: false,
        error: 'Workflow definition not found',
        message: 'The requested workflow definition does not exist'
      });
    }

    res.json({
      success: true,
      data: workflowDefinition,
      message: 'Workflow definition retrieved successfully'
    });
  })
);

/**
 * @route   PUT /api/v1/workflow-definitions/:id
 * @desc    Update workflow definition
 * @access  Private
 */
router.put(
  '/definitions/:id',
  [
    param('id').notEmpty().withMessage('Workflow definition ID is required'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('displayName').optional().notEmpty().withMessage('Display name cannot be empty'),
    body('description').optional().notEmpty().withMessage('Description cannot be empty'),
    body('processDefinition').optional().isObject().withMessage('Process definition must be an object'),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const workflowDefinition = await workflowService.updateWorkflowDefinition(
      req.params.id,
      req.body,
      req.user?.id!
    );

    res.json({
      success: true,
      data: workflowDefinition,
      message: 'Workflow definition updated successfully'
    });
  })
);

/**
 * @route   POST /api/v1/workflow-definitions/:id/publish
 * @desc    Publish workflow definition
 * @access  Private
 */
router.post(
  '/definitions/:id/publish',
  [
    param('id').notEmpty().withMessage('Workflow definition ID is required')
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const workflowDefinition = await workflowService.publishWorkflowDefinition(
      req.params.id,
      req.user?.id!
    );

    res.json({
      success: true,
      data: workflowDefinition,
      message: 'Workflow definition published successfully'
    });
  })
);

/**
 * @route   POST /api/v1/workflow-definitions/:id/test
 * @desc    Test workflow definition
 * @access  Private
 */
router.post(
  '/definitions/:id/test',
  [
    param('id').notEmpty().withMessage('Workflow definition ID is required'),
    body('testData').optional().isObject().withMessage('Test data must be an object')
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const workflowDefinition = await workflowService.getWorkflowDefinitionById(req.params.id);

    if (!workflowDefinition) {
      return res.status(404).json({
        success: false,
        error: 'Workflow definition not found',
        message: 'The requested workflow definition does not exist'
      });
    }

    const testResult = await workflowService.testWorkflow(
      workflowDefinition.processDefinition,
      req.body.testData || {}
    );

    res.json({
      success: true,
      data: testResult,
      message: 'Workflow test completed'
    });
  })
);

/**
 * @route   POST /api/v1/workflows
 * @desc    Start a new workflow instance
 * @access  Private
 */
router.post(
  '/',
  [
    body('workflowDefinitionId').notEmpty().withMessage('Workflow definition ID is required'),
    body('instanceName').optional().isString().withMessage('Instance name must be a string'),
    body('contextData').optional().isObject().withMessage('Context data must be an object'),
    body('businessKey').optional().isString().withMessage('Business key must be a string'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
    body('dueDate').optional().isISO8601().withMessage('Due date must be valid ISO date'),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const startRequest = {
      ...req.body,
      triggeredByUserId: req.user?.id,
      triggeredByEvent: 'manual_start'
    };

    logger.info('Starting workflow instance', {
      workflowDefinitionId: startRequest.workflowDefinitionId,
      triggeredBy: req.user?.id
    });

    const workflowInstance = await workflowService.startWorkflow(startRequest);

    res.status(201).json({
      success: true,
      data: workflowInstance,
      message: 'Workflow instance started successfully'
    });
  })
);

/**
 * @route   GET /api/v1/workflows
 * @desc    Get workflow instances with filtering and pagination
 * @access  Private
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    query('status').optional().isIn(['running', 'completed', 'failed', 'cancelled', 'suspended']).withMessage('Invalid status'),
    query('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
    query('workflowDefinitionId').optional().isString().withMessage('Workflow definition ID must be string'),
    query('businessKey').optional().isString().withMessage('Business key must be string'),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      status: req.query.status as string,
      workflowDefinitionId: req.query.workflowDefinitionId as string,
      businessKey: req.query.businessKey as string,
      priority: req.query.priority as string,
      isOverdue: req.query.isOverdue === 'true'
    };

    const pagination = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      sortBy: req.query.sortBy as string || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
    };

    const result = await workflowService.getWorkflowInstances(
      req.user?.organizationId!,
      filters,
      pagination
    );

    res.json({
      success: true,
      data: result,
      message: 'Workflow instances retrieved successfully'
    });
  })
);

/**
 * @route   GET /api/v1/workflows/:id
 * @desc    Get workflow instance by ID
 * @access  Private
 */
router.get(
  '/:id',
  [
    param('id').notEmpty().withMessage('Workflow instance ID is required')
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const workflowInstance = await workflowService.getWorkflowInstanceById(req.params.id);

    if (!workflowInstance) {
      return res.status(404).json({
        success: false,
        error: 'Workflow instance not found',
        message: 'The requested workflow instance does not exist'
      });
    }

    res.json({
      success: true,
      data: workflowInstance,
      message: 'Workflow instance retrieved successfully'
    });
  })
);

/**
 * @route   POST /api/v1/workflows/:id/tasks
 * @desc    Create a new task in workflow instance
 * @access  Private
 */
router.post(
  '/:id/tasks',
  [
    param('id').notEmpty().withMessage('Workflow instance ID is required'),
    body('title').notEmpty().withMessage('Task title is required'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('taskType').notEmpty().withMessage('Task type is required'),
    body('assignedToUserId').optional().isString().withMessage('Assigned user ID must be string'),
    body('assignedToRoleId').optional().isString().withMessage('Assigned role ID must be string'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
    body('dueDate').optional().isISO8601().withMessage('Due date must be valid ISO date'),
    body('estimatedHours').optional().isFloat({ min: 0 }).withMessage('Estimated hours must be positive'),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const task = await workflowService.createTask(
      req.params.id,
      req.body,
      req.user?.id!
    );

    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully'
    });
  })
);

/**
 * @route   GET /api/v1/tasks
 * @desc    Get tasks with filtering and pagination
 * @access  Private
 */
router.get(
  '/tasks',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    query('status').optional().isIn(['pending', 'in_progress', 'completed', 'rejected', 'cancelled', 'delegated']).withMessage('Invalid status'),
    query('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
    query('assignedToUserId').optional().isString().withMessage('Assigned user ID must be string'),
    query('workflowInstanceId').optional().isString().withMessage('Workflow instance ID must be string'),
    query('taskType').optional().isString().withMessage('Task type must be string'),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      status: req.query.status as string,
      priority: req.query.priority as string,
      assignedToUserId: req.query.assignedToUserId as string,
      workflowInstanceId: req.query.workflowInstanceId as string,
      taskType: req.query.taskType as string
    };

    const pagination = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      sortBy: req.query.sortBy as string || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
    };

    const result = await workflowService.getTasks(
      req.user?.organizationId!,
      filters,
      pagination
    );

    res.json({
      success: true,
      data: result,
      message: 'Tasks retrieved successfully'
    });
  })
);

/**
 * @route   GET /api/v1/tasks/:id
 * @desc    Get task by ID
 * @access  Private
 */
router.get(
  '/tasks/:id',
  [
    param('id').notEmpty().withMessage('Task ID is required')
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const task = await workflowService.getTaskById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
        message: 'The requested task does not exist'
      });
    }

    res.json({
      success: true,
      data: task,
      message: 'Task retrieved successfully'
    });
  })
);

/**
 * @route   PUT /api/v1/tasks/:id
 * @desc    Update task
 * @access  Private
 */
router.put(
  '/tasks/:id',
  [
    param('id').notEmpty().withMessage('Task ID is required'),
    body('status').optional().isIn(['pending', 'in_progress', 'completed', 'rejected', 'cancelled', 'delegated']).withMessage('Invalid status'),
    body('completionPercentage').optional().isInt({ min: 0, max: 100 }).withMessage('Completion percentage must be 0-100'),
    body('taskData').optional().isObject().withMessage('Task data must be an object'),
    body('outcome').optional().isString().withMessage('Outcome must be a string'),
    body('outcomeReason').optional().isString().withMessage('Outcome reason must be a string'),
    body('actualHours').optional().isFloat({ min: 0 }).withMessage('Actual hours must be positive'),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const task = await workflowService.updateTask(
      req.params.id,
      req.body,
      req.user?.id!
    );

    res.json({
      success: true,
      data: task,
      message: 'Task updated successfully'
    });
  })
);

/**
 * @route   POST /api/v1/tasks/:id/comments
 * @desc    Add comment to task
 * @access  Private
 */
router.post(
  '/tasks/:id/comments',
  [
    param('id').notEmpty().withMessage('Task ID is required'),
    body('commentText').notEmpty().withMessage('Comment text is required'),
    body('commentType').optional().isIn(['general', 'status_update', 'question', 'resolution']).withMessage('Invalid comment type'),
    body('isInternal').optional().isBoolean().withMessage('Is internal must be boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const comment = await workflowService.addTaskComment(
      req.params.id,
      {
        ...req.body,
        authorUserId: req.user?.id,
        organizationId: req.user?.organizationId
      }
    );

    res.status(201).json({
      success: true,
      data: comment,
      message: 'Comment added successfully'
    });
  })
);

/**
 * @route   GET /api/v1/analytics/workflows
 * @desc    Get workflow analytics
 * @access  Private
 */
router.get(
  '/analytics',
  [
    query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO date'),
    query('endDate').optional().isISO8601().withMessage('End date must be valid ISO date'),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const dateRange = req.query.startDate && req.query.endDate ? {
      start: new Date(req.query.startDate as string),
      end: new Date(req.query.endDate as string)
    } : undefined;

    const analytics = await workflowService.getWorkflowAnalytics(
      req.user?.organizationId!,
      dateRange
    );

    res.json({
      success: true,
      data: analytics,
      message: 'Workflow analytics retrieved successfully'
    });
  })
);

/**
 * @route   GET /api/v1/workflow-templates
 * @desc    Get workflow templates
 * @access  Private
 */
router.get(
  '/templates',
  [
    query('category').optional().isString().withMessage('Category must be a string'),
    query('complexity').optional().isIn(['simple', 'moderate', 'complex']).withMessage('Invalid complexity'),
    query('search').optional().isString().withMessage('Search must be a string'),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      category: req.query.category as string,
      complexity: req.query.complexity as string,
      search: req.query.search as string
    };

    const templates = await workflowService.getWorkflowTemplates(filters);

    res.json({
      success: true,
      data: templates,
      message: 'Workflow templates retrieved successfully'
    });
  })
);

/**
 * @route   POST /api/v1/workflow-templates/:id/use
 * @desc    Create workflow definition from template
 * @access  Private
 */
router.post(
  '/templates/:id/use',
  [
    param('id').notEmpty().withMessage('Template ID is required'),
    body('name').notEmpty().withMessage('Workflow name is required'),
    body('displayName').notEmpty().withMessage('Display name is required'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('customizations').optional().isObject().withMessage('Customizations must be an object'),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const workflowDefinition = await workflowService.createWorkflowFromTemplate(
      req.params.id,
      {
        ...req.body,
        organizationId: req.user?.organizationId
      },
      req.user?.id!
    );

    res.status(201).json({
      success: true,
      data: workflowDefinition,
      message: 'Workflow definition created from template successfully'
    });
  })
);

export default router;
