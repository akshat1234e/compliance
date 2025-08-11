/**
 * Workflow Service
 * Core service for managing workflow definitions, instances, and execution
 */

import { logger } from '@utils/logger';
import { DatabaseService } from '../database/DatabaseService';
import { WorkflowEngine } from '../engines/WorkflowEngine';
import { NotificationService } from './NotificationService';
import { TaskScheduler } from './TaskScheduler';

// Types
export interface WorkflowDefinition {
  id: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  workflowType: string;
  category: string;
  processDefinition: any;
  formSchema?: any;
  triggerType?: string;
  triggerConditions?: any;
  defaultSlaHours?: number;
  escalationRules?: any;
  defaultAssigneeType?: string;
  defaultAssigneeId?: string;
  assignmentRules?: any;
  organizationId: string;
  isSystemWorkflow: boolean;
  status: 'draft' | 'active' | 'inactive' | 'archived';
  isPublished: boolean;
  publishedAt?: Date;
  publishedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export interface WorkflowInstance {
  id: string;
  workflowDefinitionId: string;
  instanceName?: string;
  contextData: any;
  businessKey?: string;
  triggeredByUserId?: string;
  triggeredByEvent?: string;
  triggerData?: any;
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'suspended';
  currentStep?: string;
  progressPercentage: number;
  startedAt: Date;
  completedAt?: Date;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  slaHours?: number;
  isOverdue: boolean;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  taskType: string;
  workflowInstanceId?: string;
  workflowStepId?: string;
  parentTaskId?: string;
  assignedToUserId?: string;
  assignedToRoleId?: string;
  assignedToDepartmentId?: string;
  assignedByUserId?: string;
  assignedAt?: Date;
  taskData: any;
  instructions?: string;
  requiredActions?: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'cancelled' | 'delegated';
  completionPercentage: number;
  dueDate?: Date;
  startedAt?: Date;
  completedAt?: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours?: number;
  actualHours?: number;
  outcome?: string;
  outcomeReason?: string;
  outcomeData?: any;
  dependsOnTasks?: string[];
  blocksTasks?: string[];
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateWorkflowDefinitionRequest {
  name: string;
  displayName: string;
  description: string;
  workflowType: string;
  category: string;
  processDefinition: any;
  formSchema?: any;
  triggerType?: string;
  triggerConditions?: any;
  defaultSlaHours?: number;
  escalationRules?: any;
  defaultAssigneeType?: string;
  defaultAssigneeId?: string;
  assignmentRules?: any;
  organizationId: string;
}

export interface StartWorkflowRequest {
  workflowDefinitionId: string;
  instanceName?: string;
  contextData?: any;
  businessKey?: string;
  triggeredByUserId?: string;
  triggeredByEvent?: string;
  triggerData?: any;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: Date;
}

export interface UpdateTaskRequest {
  status?: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'cancelled' | 'delegated';
  completionPercentage?: number;
  taskData?: any;
  outcome?: string;
  outcomeReason?: string;
  outcomeData?: any;
  actualHours?: number;
}

export class WorkflowService {
  private databaseService: DatabaseService;
  private workflowEngine: WorkflowEngine;
  private notificationService: NotificationService;
  private taskScheduler: TaskScheduler;

  constructor() {
    this.databaseService = DatabaseService.getInstance();
    this.workflowEngine = new WorkflowEngine();
    this.notificationService = new NotificationService();
    this.taskScheduler = new TaskScheduler();
  }

  /**
   * Create a new workflow definition
   */
  async createWorkflowDefinition(request: CreateWorkflowDefinitionRequest, createdBy: string): Promise<WorkflowDefinition> {
    try {
      logger.info('Creating workflow definition', { name: request.name, createdBy });

      // Validate workflow definition
      await this.validateWorkflowDefinition(request.processDefinition);

      const workflowDefinition: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'> = {
        ...request,
        version: '1.0',
        status: 'draft',
        isSystemWorkflow: false,
        isPublished: false,
        createdBy,
      };

      const savedDefinition = await this.databaseService.postgres.createWorkflowDefinition(workflowDefinition);

      logger.info('Workflow definition created successfully', {
        id: savedDefinition.id,
        name: savedDefinition.name
      });

      return savedDefinition;
    } catch (error) {
      logger.error('Failed to create workflow definition', {
        error: (error as Error).message,
        request
      });
      throw error;
    }
  }

  /**
   * Update workflow definition
   */
  async updateWorkflowDefinition(
    id: string,
    updates: Partial<CreateWorkflowDefinitionRequest>,
    updatedBy: string
  ): Promise<WorkflowDefinition> {
    try {
      logger.info('Updating workflow definition', { id, updatedBy });

      const existingDefinition = await this.databaseService.postgres.getWorkflowDefinitionById(id);
      if (!existingDefinition) {
        throw new Error('Workflow definition not found');
      }

      if (existingDefinition.isPublished) {
        throw new Error('Cannot update published workflow definition');
      }

      if (updates.processDefinition) {
        await this.validateWorkflowDefinition(updates.processDefinition);
      }

      const updatedDefinition = await this.databaseService.postgres.updateWorkflowDefinition(id, {
        ...updates,
        updatedBy,
        updatedAt: new Date()
      });

      logger.info('Workflow definition updated successfully', { id });

      return updatedDefinition;
    } catch (error) {
      logger.error('Failed to update workflow definition', {
        error: (error as Error).message,
        id,
        updates
      });
      throw error;
    }
  }

  /**
   * Publish workflow definition
   */
  async publishWorkflowDefinition(id: string, publishedBy: string): Promise<WorkflowDefinition> {
    try {
      logger.info('Publishing workflow definition', { id, publishedBy });

      const definition = await this.databaseService.postgres.getWorkflowDefinitionById(id);
      if (!definition) {
        throw new Error('Workflow definition not found');
      }

      if (definition.isPublished) {
        throw new Error('Workflow definition is already published');
      }

      // Validate workflow definition before publishing
      await this.validateWorkflowDefinition(definition.processDefinition);

      const publishedDefinition = await this.databaseService.postgres.updateWorkflowDefinition(id, {
        status: 'active',
        isPublished: true,
        publishedAt: new Date(),
        publishedBy,
        updatedBy: publishedBy,
        updatedAt: new Date()
      });

      logger.info('Workflow definition published successfully', { id });

      return publishedDefinition;
    } catch (error) {
      logger.error('Failed to publish workflow definition', {
        error: (error as Error).message,
        id
      });
      throw error;
    }
  }

  /**
   * Start a new workflow instance
   */
  async startWorkflow(request: StartWorkflowRequest): Promise<WorkflowInstance> {
    try {
      logger.info('Starting workflow instance', {
        workflowDefinitionId: request.workflowDefinitionId,
        businessKey: request.businessKey
      });

      const definition = await this.databaseService.postgres.getWorkflowDefinitionById(request.workflowDefinitionId);
      if (!definition) {
        throw new Error('Workflow definition not found');
      }

      if (definition.status !== 'active' || !definition.isPublished) {
        throw new Error('Workflow definition is not active or published');
      }

      // Create workflow instance
      const instance: Omit<WorkflowInstance, 'id' | 'createdAt' | 'updatedAt'> = {
        workflowDefinitionId: request.workflowDefinitionId,
        instanceName: request.instanceName,
        contextData: request.contextData || {},
        businessKey: request.businessKey,
        triggeredByUserId: request.triggeredByUserId,
        triggeredByEvent: request.triggeredByEvent,
        triggerData: request.triggerData,
        status: 'running',
        progressPercentage: 0,
        startedAt: new Date(),
        dueDate: request.dueDate || this.calculateDueDate(definition.defaultSlaHours),
        priority: request.priority || 'medium',
        slaHours: definition.defaultSlaHours,
        isOverdue: false,
        organizationId: definition.organizationId,
        createdBy: request.triggeredByUserId
      };

      const savedInstance = await this.databaseService.postgres.createWorkflowInstance(instance);

      // Start workflow execution
      await this.workflowEngine.startWorkflow(savedInstance, definition);

      logger.info('Workflow instance started successfully', {
        instanceId: savedInstance.id,
        workflowDefinitionId: request.workflowDefinitionId
      });

      return savedInstance;
    } catch (error) {
      logger.error('Failed to start workflow instance', {
        error: (error as Error).message,
        request
      });
      throw error;
    }
  }

  /**
   * Get workflow instances with filtering and pagination
   */
  async getWorkflowInstances(
    organizationId: string,
    filters: {
      status?: string;
      workflowDefinitionId?: string;
      businessKey?: string;
      priority?: string;
      isOverdue?: boolean;
    } = {},
    pagination: { page: number; limit: number; sortBy?: string; sortOrder?: 'asc' | 'desc' } = { page: 1, limit: 20 }
  ): Promise<{ instances: WorkflowInstance[]; total: number }> {
    try {
      const result = await this.databaseService.postgres.getWorkflowInstances(
        organizationId,
        filters,
        pagination
      );

      return result;
    } catch (error) {
      logger.error('Failed to get workflow instances', {
        error: (error as Error).message,
        organizationId,
        filters
      });
      throw error;
    }
  }

  /**
   * Get workflow instance by ID
   */
  async getWorkflowInstanceById(id: string): Promise<WorkflowInstance | null> {
    try {
      return await this.databaseService.postgres.getWorkflowInstanceById(id);
    } catch (error) {
      logger.error('Failed to get workflow instance', {
        error: (error as Error).message,
        id
      });
      throw error;
    }
  }

  /**
   * Create a new task
   */
  async createTask(
    workflowInstanceId: string,
    taskData: {
      title: string;
      description?: string;
      taskType: string;
      workflowStepId?: string;
      assignedToUserId?: string;
      assignedToRoleId?: string;
      assignedToDepartmentId?: string;
      taskData?: any;
      instructions?: string;
      requiredActions?: string[];
      dueDate?: Date;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      estimatedHours?: number;
      dependsOnTasks?: string[];
    },
    createdBy: string
  ): Promise<Task> {
    try {
      logger.info('Creating task', {
        workflowInstanceId,
        title: taskData.title,
        createdBy
      });

      const workflowInstance = await this.getWorkflowInstanceById(workflowInstanceId);
      if (!workflowInstance) {
        throw new Error('Workflow instance not found');
      }

      const task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
        ...taskData,
        workflowInstanceId,
        taskData: taskData.taskData || {},
        status: 'pending',
        completionPercentage: 0,
        organizationId: workflowInstance.organizationId,
        createdBy
      };

      const savedTask = await this.databaseService.postgres.createTask(task);

      // Send task assignment notification
      if (savedTask.assignedToUserId) {
        await this.notificationService.sendTaskAssignmentNotification(savedTask);
      }

      logger.info('Task created successfully', {
        taskId: savedTask.id,
        workflowInstanceId
      });

      return savedTask;
    } catch (error) {
      logger.error('Failed to create task', {
        error: (error as Error).message,
        workflowInstanceId,
        taskData
      });
      throw error;
    }
  }

  /**
   * Update task
   */
  async updateTask(id: string, updates: UpdateTaskRequest, updatedBy: string): Promise<Task> {
    try {
      logger.info('Updating task', { id, updatedBy });

      const existingTask = await this.databaseService.postgres.getTaskById(id);
      if (!existingTask) {
        throw new Error('Task not found');
      }

      const updatedTask = await this.databaseService.postgres.updateTask(id, {
        ...updates,
        updatedBy,
        updatedAt: new Date(),
        ...(updates.status === 'completed' && !existingTask.completedAt ? { completedAt: new Date() } : {}),
        ...(updates.status === 'in_progress' && !existingTask.startedAt ? { startedAt: new Date() } : {})
      });

      // Continue workflow execution if task is completed
      if (updates.status === 'completed') {
        await this.workflowEngine.completeTask(updatedTask);
      }

      // Send status update notification
      await this.notificationService.sendTaskStatusUpdateNotification(updatedTask, existingTask.status);

      logger.info('Task updated successfully', { id });

      return updatedTask;
    } catch (error) {
      logger.error('Failed to update task', {
        error: (error as Error).message,
        id,
        updates
      });
      throw error;
    }
  }

  /**
   * Get tasks with filtering and pagination
   */
  async getTasks(
    organizationId: string,
    filters: {
      status?: string;
      priority?: string;
      assignedToUserId?: string;
      workflowInstanceId?: string;
      taskType?: string;
    } = {},
    pagination: { page: number; limit: number; sortBy?: string; sortOrder?: 'asc' | 'desc' } = { page: 1, limit: 20 }
  ): Promise<{ tasks: Task[]; total: number }> {
    try {
      const result = await this.databaseService.postgres.getTasks(
        organizationId,
        filters,
        pagination
      );

      return result;
    } catch (error) {
      logger.error('Failed to get tasks', {
        error: (error as Error).message,
        organizationId,
        filters
      });
      throw error;
    }
  }

  /**
   * Get task by ID
   */
  async getTaskById(id: string): Promise<Task | null> {
    try {
      return await this.databaseService.postgres.getTaskById(id);
    } catch (error) {
      logger.error('Failed to get task', {
        error: (error as Error).message,
        id
      });
      throw error;
    }
  }

  /**
   * Get workflow analytics
   */
  async getWorkflowAnalytics(
    organizationId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<{
    overview: any;
    performanceMetrics: any[];
    taskMetrics: any;
    timeAnalysis: any[];
    bottleneckAnalysis: any[];
    userProductivity: any[];
  }> {
    try {
      logger.info('Getting workflow analytics', { organizationId });

      const [
        workflowStats,
        taskStats,
        performanceData,
        bottleneckData,
        userProductivityData
      ] = await Promise.all([
        this.databaseService.postgres.getWorkflowStatistics(organizationId, dateRange),
        this.databaseService.postgres.getTaskStatistics(organizationId, dateRange),
        this.databaseService.postgres.getWorkflowPerformanceMetrics(organizationId, dateRange),
        this.databaseService.postgres.getWorkflowBottlenecks(organizationId, dateRange),
        this.databaseService.postgres.getUserProductivityMetrics(organizationId, dateRange)
      ]);

      return {
        overview: workflowStats,
        performanceMetrics: performanceData,
        taskMetrics: taskStats,
        timeAnalysis: [], // Would be calculated from historical data
        bottleneckAnalysis: bottleneckData,
        userProductivity: userProductivityData
      };
    } catch (error) {
      logger.error('Failed to get workflow analytics', {
        error: (error as Error).message,
        organizationId
      });
      throw error;
    }
  }

  /**
   * Test workflow definition
   */
  async testWorkflow(workflowDefinition: any, testData: any): Promise<{
    success: boolean;
    results: any;
    errors?: string[];
  }> {
    try {
      logger.info('Testing workflow definition');

      // Validate workflow definition
      await this.validateWorkflowDefinition(workflowDefinition);

      // Run workflow simulation
      const results = await this.workflowEngine.simulateWorkflow(workflowDefinition, testData);

      return {
        success: true,
        results
      };
    } catch (error) {
      logger.error('Workflow test failed', {
        error: (error as Error).message
      });

      return {
        success: false,
        results: null,
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Private helper methods
   */
  private async validateWorkflowDefinition(processDefinition: any): Promise<void> {
    // Validate that workflow has start and end nodes
    const nodes = processDefinition.nodes || [];
    const hasStart = nodes.some((node: any) => node.type === 'start');
    const hasEnd = nodes.some((node: any) => node.type === 'end');

    if (!hasStart) {
      throw new Error('Workflow must have a start node');
    }

    if (!hasEnd) {
      throw new Error('Workflow must have an end node');
    }

    // Validate node connections
    for (const node of nodes) {
      if (node.type !== 'end' && (!node.connections || node.connections.length === 0)) {
        throw new Error(`Node "${node.title}" must have at least one connection`);
      }
    }

    // Additional validation logic would go here
  }

  private calculateDueDate(slaHours?: number): Date | undefined {
    if (!slaHours) return undefined;

    const now = new Date();
    return new Date(now.getTime() + slaHours * 60 * 60 * 1000);
  }

  /**
   * Get workflow definitions with filtering and pagination
   */
  async getWorkflowDefinitions(
    organizationId: string,
    filters: {
      status?: string;
      category?: string;
      workflowType?: string;
      search?: string;
    } = {},
    pagination: { page: number; limit: number; sortBy?: string; sortOrder?: 'asc' | 'desc' } = { page: 1, limit: 20 }
  ): Promise<{ definitions: WorkflowDefinition[]; total: number }> {
    try {
      const result = await this.databaseService.postgres.getWorkflowDefinitions(
        organizationId,
        filters,
        pagination
      );

      return result;
    } catch (error) {
      logger.error('Failed to get workflow definitions', {
        error: (error as Error).message,
        organizationId,
        filters
      });
      throw error;
    }
  }

  /**
   * Get workflow definition by ID
   */
  async getWorkflowDefinitionById(id: string): Promise<WorkflowDefinition | null> {
    try {
      return await this.databaseService.postgres.getWorkflowDefinitionById(id);
    } catch (error) {
      logger.error('Failed to get workflow definition', {
        error: (error as Error).message,
        id
      });
      throw error;
    }
  }

  /**
   * Get workflow templates
   */
  async getWorkflowTemplates(filters: {
    category?: string;
    complexity?: string;
    search?: string;
  } = {}): Promise<any[]> {
    try {
      // Mock templates for now - in real implementation, this would query the database
      const templates = [
        {
          id: 'template-001',
          name: 'RBI Circular Review & Implementation',
          description: 'Complete workflow for reviewing and implementing RBI circulars',
          category: 'compliance',
          complexity: 'moderate',
          estimatedDuration: '3-5 days',
          steps: 8,
          tags: ['rbi', 'circular', 'review', 'implementation'],
          processDefinition: {
            nodes: [
              { id: 'start', type: 'start', title: 'Start', position: { x: 100, y: 100 } },
              { id: 'review', type: 'task', title: 'Initial Review', position: { x: 300, y: 100 } },
              { id: 'approval', type: 'approval', title: 'Manager Approval', position: { x: 500, y: 100 } },
              { id: 'end', type: 'end', title: 'End', position: { x: 700, y: 100 } }
            ]
          }
        }
      ];

      let filteredTemplates = templates;

      if (filters.category && filters.category !== 'all') {
        filteredTemplates = filteredTemplates.filter(t => t.category === filters.category);
      }

      if (filters.complexity && filters.complexity !== 'all') {
        filteredTemplates = filteredTemplates.filter(t => t.complexity === filters.complexity);
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredTemplates = filteredTemplates.filter(t =>
          t.name.toLowerCase().includes(searchTerm) ||
          t.description.toLowerCase().includes(searchTerm) ||
          t.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      return filteredTemplates;
    } catch (error) {
      logger.error('Failed to get workflow templates', {
        error: (error as Error).message,
        filters
      });
      throw error;
    }
  }

  /**
   * Create workflow definition from template
   */
  async createWorkflowFromTemplate(
    templateId: string,
    customizations: {
      name: string;
      displayName: string;
      description?: string;
      organizationId: string;
    },
    createdBy: string
  ): Promise<WorkflowDefinition> {
    try {
      logger.info('Creating workflow from template', { templateId, createdBy });

      // Get template (mock for now)
      const templates = await this.getWorkflowTemplates();
      const template = templates.find(t => t.id === templateId);

      if (!template) {
        throw new Error('Template not found');
      }

      // Create workflow definition from template
      const workflowDefinition = await this.createWorkflowDefinition({
        name: customizations.name,
        displayName: customizations.displayName,
        description: customizations.description || template.description,
        workflowType: template.category,
        category: template.category,
        processDefinition: template.processDefinition,
        organizationId: customizations.organizationId
      }, createdBy);

      logger.info('Workflow created from template successfully', {
        templateId,
        workflowDefinitionId: workflowDefinition.id
      });

      return workflowDefinition;
    } catch (error) {
      logger.error('Failed to create workflow from template', {
        error: (error as Error).message,
        templateId
      });
      throw error;
    }
  }

  /**
   * Add comment to task
   */
  async addTaskComment(
    taskId: string,
    commentData: {
      commentText: string;
      commentType?: string;
      isInternal?: boolean;
      authorUserId: string;
      organizationId: string;
    }
  ): Promise<any> {
    try {
      logger.info('Adding task comment', { taskId, authorUserId: commentData.authorUserId });

      const comment = {
        id: `comment_${Date.now()}`,
        taskId,
        ...commentData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // In real implementation, this would save to database
      // const savedComment = await this.databaseService.postgres.createTaskComment(comment);

      logger.info('Task comment added successfully', { taskId, commentId: comment.id });

      return comment;
    } catch (error) {
      logger.error('Failed to add task comment', {
        error: (error as Error).message,
        taskId
      });
      throw error;
    }
  }
}

export default WorkflowService;
