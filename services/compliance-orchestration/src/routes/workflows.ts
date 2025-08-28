/**
 * Workflow Routes
 * API endpoints for workflow management and orchestration
 */

import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { logger } from '@utils/logger';
import { asyncHandler } from '@middleware/errorHandler';
import { validateRequest } from '@middleware/validation';
import { WorkflowEngine } from '@engines/WorkflowEngine';
import {
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  WorkflowSearchRequest,
  WorkflowResponse,
  WorkflowDetailResponse,
  WorkflowListResponse,
  WorkflowStatus,
  Priority,
} from '@types/workflow';

const router = Router();

// Get workflow engine instance (this would be injected in a real application)
let workflowEngine: WorkflowEngine;

// Initialize workflow engine reference
export const setWorkflowEngine = (engine: WorkflowEngine) => {
  workflowEngine = engine;
};

/**
 * @route   POST /api/v1/workflows
 * @desc    Create a new workflow instance
 * @access  Private
 */
router.post(
  '/',
  [
    body('definitionId').notEmpty().withMessage('Workflow definition ID is required'),
    body('context').isObject().withMessage('Workflow context must be an object'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
    body('timeout').optional().isInt({ min: 1000 }).withMessage('Timeout must be at least 1000ms'),
    body('metadata').optional().isObject().withMessage('Metadata must be an object'),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const createRequest: CreateWorkflowRequest = req.body;
    
    logger.info('Creating new workflow', {
      definitionId: createRequest.definitionId,
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
    });

    try {
      const workflow = await workflowEngine.startWorkflow(
        createRequest.definitionId,
        {
          ...createRequest.context,
          userId: req.user?.id,
          organizationId: req.user?.organizationId,
        },
        {
          priority: createRequest.priority as Priority,
          timeout: createRequest.timeout,
          metadata: createRequest.metadata,
        }
      );

      const response: WorkflowResponse = {
        id: workflow.id,
        definitionId: workflow.definitionId,
        definitionName: workflow.definition.name,
        status: workflow.status,
        priority: workflow.priority as Priority,
        progress: {
          currentStep: workflow.currentStepIndex + 1,
          totalSteps: workflow.steps.length,
          percentage: Math.round(((workflow.currentStepIndex + 1) / workflow.steps.length) * 100),
        },
        createdAt: workflow.createdAt,
        startedAt: workflow.startedAt,
        completedAt: workflow.completedAt,
        estimatedCompletion: workflow.timeout ? 
          new Date(workflow.createdAt.getTime() + workflow.timeout) : undefined,
        initiatedBy: workflow.initiatedBy,
        assignedTo: workflow.assignedTo,
        metadata: workflow.metadata,
      };

      logger.info('Workflow created successfully', {
        workflowId: workflow.id,
        definitionId: workflow.definitionId,
      });

      res.status(201).json({
        success: true,
        data: response,
        message: 'Workflow created successfully',
      });
    } catch (error) {
      logger.error('Failed to create workflow', {
        definitionId: createRequest.definitionId,
        error: (error as Error).message,
      });

      res.status(400).json({
        success: false,
        error: (error as Error).message,
        message: 'Failed to create workflow',
      });
    }
  })
);

/**
 * @route   GET /api/v1/workflows
 * @desc    Get workflows with filtering and pagination
 * @access  Private
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(Object.values(WorkflowStatus)).withMessage('Invalid status'),
    query('priority').optional().isIn(Object.values(Priority)).withMessage('Invalid priority'),
    query('sortBy').optional().isIn(['createdAt', 'startedAt', 'completedAt', 'priority']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Invalid sort order'),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const searchRequest: WorkflowSearchRequest = {
      query: req.query.query as string,
      status: req.query.status ? [req.query.status as WorkflowStatus] : undefined,
      priority: req.query.priority ? [req.query.priority as Priority] : undefined,
      definitionId: req.query.definitionId as string,
      initiatedBy: req.query.initiatedBy as string,
      assignedTo: req.query.assignedTo as string,
      createdAfter: req.query.createdAfter ? new Date(req.query.createdAfter as string) : undefined,
      createdBefore: req.query.createdBefore ? new Date(req.query.createdBefore as string) : undefined,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      sortBy: req.query.sortBy as string || 'createdAt',
      sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc',
    };

    logger.info('Fetching workflows', {
      filters: searchRequest,
      userId: req.user?.id,
    });

    // Get workflows (this would typically query a database)
    const allWorkflows = workflowEngine.getActiveWorkflows();
    
    // Apply filters
    let filteredWorkflows = allWorkflows;
    
    if (searchRequest.status) {
      filteredWorkflows = filteredWorkflows.filter(w => 
        searchRequest.status!.includes(w.status)
      );
    }
    
    if (searchRequest.priority) {
      filteredWorkflows = filteredWorkflows.filter(w => 
        searchRequest.priority!.includes(w.priority as Priority)
      );
    }

    // Apply pagination
    const total = filteredWorkflows.length;
    const totalPages = Math.ceil(total / searchRequest.limit!);
    const startIndex = (searchRequest.page! - 1) * searchRequest.limit!;
    const endIndex = startIndex + searchRequest.limit!;
    const paginatedWorkflows = filteredWorkflows.slice(startIndex, endIndex);

    // Convert to response format
    const workflows: WorkflowResponse[] = paginatedWorkflows.map(workflow => ({
      id: workflow.id,
      definitionId: workflow.definitionId,
      definitionName: workflow.definition.name,
      status: workflow.status,
      priority: workflow.priority as Priority,
      progress: {
        currentStep: workflow.currentStepIndex + 1,
        totalSteps: workflow.steps.length,
        percentage: Math.round(((workflow.currentStepIndex + 1) / workflow.steps.length) * 100),
      },
      createdAt: workflow.createdAt,
      startedAt: workflow.startedAt,
      completedAt: workflow.completedAt,
      estimatedCompletion: workflow.timeout ? 
        new Date(workflow.createdAt.getTime() + workflow.timeout) : undefined,
      initiatedBy: workflow.initiatedBy,
      assignedTo: workflow.assignedTo,
      metadata: workflow.metadata,
    }));

    const response: WorkflowListResponse = {
      workflows,
      pagination: {
        page: searchRequest.page!,
        limit: searchRequest.limit!,
        total,
        totalPages,
      },
      filters: searchRequest,
    };

    res.json({
      success: true,
      data: response,
      message: 'Workflows retrieved successfully',
    });
  })
);

/**
 * @route   GET /api/v1/workflows/:id
 * @desc    Get workflow by ID with full details
 * @access  Private
 */
router.get(
  '/:id',
  [
    param('id').notEmpty().withMessage('Workflow ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const workflowId = req.params.id;

    logger.info('Fetching workflow details', {
      workflowId,
      userId: req.user?.id,
    });

    const workflow = workflowEngine.getWorkflow(workflowId);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found',
        message: `Workflow with ID ${workflowId} not found`,
      });
    }

    const response: WorkflowDetailResponse = {
      id: workflow.id,
      definitionId: workflow.definitionId,
      definitionName: workflow.definition.name,
      status: workflow.status,
      priority: workflow.priority as Priority,
      progress: {
        currentStep: workflow.currentStepIndex + 1,
        totalSteps: workflow.steps.length,
        percentage: Math.round(((workflow.currentStepIndex + 1) / workflow.steps.length) * 100),
      },
      createdAt: workflow.createdAt,
      startedAt: workflow.startedAt,
      completedAt: workflow.completedAt,
      estimatedCompletion: workflow.timeout ? 
        new Date(workflow.createdAt.getTime() + workflow.timeout) : undefined,
      initiatedBy: workflow.initiatedBy,
      assignedTo: workflow.assignedTo,
      metadata: workflow.metadata,
      definition: workflow.definition,
      context: workflow.context,
      steps: workflow.steps,
      executionHistory: workflow.executionHistory,
    };

    res.json({
      success: true,
      data: response,
      message: 'Workflow details retrieved successfully',
    });
  })
);

/**
 * @route   PUT /api/v1/workflows/:id
 * @desc    Update workflow
 * @access  Private
 */
router.put(
  '/:id',
  [
    param('id').notEmpty().withMessage('Workflow ID is required'),
    body('context').optional().isObject().withMessage('Context must be an object'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
    body('timeout').optional().isInt({ min: 1000 }).withMessage('Timeout must be at least 1000ms'),
    body('metadata').optional().isObject().withMessage('Metadata must be an object'),
    body('assignedTo').optional().isArray().withMessage('AssignedTo must be an array'),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const workflowId = req.params.id;
    const updateRequest: UpdateWorkflowRequest = req.body;

    logger.info('Updating workflow', {
      workflowId,
      updates: Object.keys(updateRequest),
      userId: req.user?.id,
    });

    const workflow = workflowEngine.getWorkflow(workflowId);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found',
        message: `Workflow with ID ${workflowId} not found`,
      });
    }

    // Update workflow properties
    if (updateRequest.context) {
      workflow.context = { ...workflow.context, ...updateRequest.context };
    }
    
    if (updateRequest.priority) {
      workflow.priority = updateRequest.priority as Priority;
    }
    
    if (updateRequest.timeout) {
      workflow.timeout = updateRequest.timeout;
    }
    
    if (updateRequest.metadata) {
      workflow.metadata = { ...workflow.metadata, ...updateRequest.metadata };
    }
    
    if (updateRequest.assignedTo) {
      workflow.assignedTo = updateRequest.assignedTo;
    }

    const response: WorkflowResponse = {
      id: workflow.id,
      definitionId: workflow.definitionId,
      definitionName: workflow.definition.name,
      status: workflow.status,
      priority: workflow.priority as Priority,
      progress: {
        currentStep: workflow.currentStepIndex + 1,
        totalSteps: workflow.steps.length,
        percentage: Math.round(((workflow.currentStepIndex + 1) / workflow.steps.length) * 100),
      },
      createdAt: workflow.createdAt,
      startedAt: workflow.startedAt,
      completedAt: workflow.completedAt,
      estimatedCompletion: workflow.timeout ? 
        new Date(workflow.createdAt.getTime() + workflow.timeout) : undefined,
      initiatedBy: workflow.initiatedBy,
      assignedTo: workflow.assignedTo,
      metadata: workflow.metadata,
    };

    logger.info('Workflow updated successfully', { workflowId });

    res.json({
      success: true,
      data: response,
      message: 'Workflow updated successfully',
    });
  })
);

/**
 * @route   POST /api/v1/workflows/:id/pause
 * @desc    Pause a running workflow
 * @access  Private
 */
router.post(
  '/:id/pause',
  [
    param('id').notEmpty().withMessage('Workflow ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const workflowId = req.params.id;

    logger.info('Pausing workflow', {
      workflowId,
      userId: req.user?.id,
    });

    try {
      await workflowEngine.pauseWorkflow(workflowId);

      res.json({
        success: true,
        message: 'Workflow paused successfully',
      });
    } catch (error) {
      logger.error('Failed to pause workflow', {
        workflowId,
        error: (error as Error).message,
      });

      res.status(400).json({
        success: false,
        error: (error as Error).message,
        message: 'Failed to pause workflow',
      });
    }
  })
);

/**
 * @route   POST /api/v1/workflows/:id/resume
 * @desc    Resume a paused workflow
 * @access  Private
 */
router.post(
  '/:id/resume',
  [
    param('id').notEmpty().withMessage('Workflow ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const workflowId = req.params.id;

    logger.info('Resuming workflow', {
      workflowId,
      userId: req.user?.id,
    });

    try {
      await workflowEngine.resumeWorkflow(workflowId);

      res.json({
        success: true,
        message: 'Workflow resumed successfully',
      });
    } catch (error) {
      logger.error('Failed to resume workflow', {
        workflowId,
        error: (error as Error).message,
      });

      res.status(400).json({
        success: false,
        error: (error as Error).message,
        message: 'Failed to resume workflow',
      });
    }
  })
);

/**
 * @route   POST /api/v1/workflows/:id/cancel
 * @desc    Cancel a workflow
 * @access  Private
 */
router.post(
  '/:id/cancel',
  [
    param('id').notEmpty().withMessage('Workflow ID is required'),
    body('reason').optional().isString().withMessage('Reason must be a string'),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const workflowId = req.params.id;
    const reason = req.body.reason;

    logger.info('Cancelling workflow', {
      workflowId,
      reason,
      userId: req.user?.id,
    });

    try {
      await workflowEngine.cancelWorkflow(workflowId, reason);

      res.json({
        success: true,
        message: 'Workflow cancelled successfully',
      });
    } catch (error) {
      logger.error('Failed to cancel workflow', {
        workflowId,
        error: (error as Error).message,
      });

      res.status(400).json({
        success: false,
        error: (error as Error).message,
        message: 'Failed to cancel workflow',
      });
    }
  })
);

/**
 * @route   GET /api/v1/workflows/metrics
 * @desc    Get workflow metrics and statistics
 * @access  Private
 */
router.get(
  '/metrics',
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Fetching workflow metrics', {
      userId: req.user?.id,
    });

    const metrics = workflowEngine.getMetrics();

    res.json({
      success: true,
      data: metrics,
      message: 'Workflow metrics retrieved successfully',
    });
  })
);

export default router;
