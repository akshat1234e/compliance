/**
 * Workflow Engine
 * Core engine for managing compliance workflows and process orchestration
 */

import { EventEmitter } from 'events';
import { logger } from '@utils/logger';
import { config } from '@config/index';
import {
  Workflow,
  WorkflowInstance,
  WorkflowStep,
  WorkflowExecution,
  WorkflowStatus,
  StepStatus,
  WorkflowContext,
  WorkflowDefinition,
} from '@types/workflow';

export interface WorkflowEngineOptions {
  maxConcurrentWorkflows?: number;
  defaultTimeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enablePersistence?: boolean;
  enableMetrics?: boolean;
}

export class WorkflowEngine extends EventEmitter {
  private workflows: Map<string, WorkflowInstance> = new Map();
  private definitions: Map<string, WorkflowDefinition> = new Map();
  private executionQueue: WorkflowExecution[] = [];
  private isProcessing = false;
  private options: Required<WorkflowEngineOptions>;
  private metrics = {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    averageExecutionTime: 0,
    activeWorkflows: 0,
  };

  constructor(options: WorkflowEngineOptions = {}) {
    super();
    this.options = {
      maxConcurrentWorkflows: options.maxConcurrentWorkflows || config.workflow.maxConcurrentWorkflows,
      defaultTimeout: options.defaultTimeout || config.workflow.defaultTimeout,
      retryAttempts: options.retryAttempts || config.workflow.retryAttempts,
      retryDelay: options.retryDelay || config.workflow.retryDelay,
      enablePersistence: options.enablePersistence ?? config.workflow.enablePersistence,
      enableMetrics: options.enableMetrics ?? config.workflow.enableMetrics,
    };
  }

  /**
   * Initialize the workflow engine
   */
  public async initialize(): Promise<void> {
    try {
      logger.info('Initializing Workflow Engine...');

      // Load workflow definitions
      await this.loadWorkflowDefinitions();

      // Restore persisted workflows if enabled
      if (this.options.enablePersistence) {
        await this.restorePersistedWorkflows();
      }

      // Start processing queue
      this.startProcessing();

      logger.info('Workflow Engine initialized successfully', {
        maxConcurrentWorkflows: this.options.maxConcurrentWorkflows,
        enablePersistence: this.options.enablePersistence,
        enableMetrics: this.options.enableMetrics,
      });

      this.emit('initialized');
    } catch (error) {
      logger.error('Failed to initialize Workflow Engine', error);
      throw error;
    }
  }

  /**
   * Register a workflow definition
   */
  public registerWorkflowDefinition(definition: WorkflowDefinition): void {
    this.definitions.set(definition.id, definition);
    logger.info('Workflow definition registered', {
      id: definition.id,
      name: definition.name,
      version: definition.version,
      steps: definition.steps.length,
    });
  }

  /**
   * Start a new workflow instance
   */
  public async startWorkflow(
    definitionId: string,
    context: WorkflowContext,
    options: {
      priority?: 'low' | 'medium' | 'high' | 'critical';
      timeout?: number;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<WorkflowInstance> {
    const definition = this.definitions.get(definitionId);
    if (!definition) {
      throw new Error(`Workflow definition not found: ${definitionId}`);
    }

    const instance: WorkflowInstance = {
      id: this.generateWorkflowId(),
      definitionId,
      definition,
      status: WorkflowStatus.PENDING,
      context,
      currentStepIndex: 0,
      steps: definition.steps.map(step => ({
        ...step,
        status: StepStatus.PENDING,
        startedAt: undefined,
        completedAt: undefined,
        error: undefined,
        retryCount: 0,
      })),
      createdAt: new Date(),
      startedAt: undefined,
      completedAt: undefined,
      priority: options.priority || 'medium',
      timeout: options.timeout || this.options.defaultTimeout,
      metadata: options.metadata || {},
      executionHistory: [],
    };

    this.workflows.set(instance.id, instance);
    this.metrics.activeWorkflows++;

    // Queue for execution
    this.queueExecution({
      workflowId: instance.id,
      type: 'start',
      timestamp: new Date(),
    });

    logger.info('Workflow instance created', {
      workflowId: instance.id,
      definitionId,
      priority: instance.priority,
      stepsCount: instance.steps.length,
    });

    this.emit('workflowCreated', instance);
    return instance;
  }

  /**
   * Get workflow instance by ID
   */
  public getWorkflow(workflowId: string): WorkflowInstance | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * Get all active workflows
   */
  public getActiveWorkflows(): WorkflowInstance[] {
    return Array.from(this.workflows.values()).filter(
      workflow => workflow.status === WorkflowStatus.RUNNING || workflow.status === WorkflowStatus.PENDING
    );
  }

  /**
   * Pause a workflow
   */
  public async pauseWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (workflow.status !== WorkflowStatus.RUNNING) {
      throw new Error(`Cannot pause workflow in status: ${workflow.status}`);
    }

    workflow.status = WorkflowStatus.PAUSED;
    workflow.pausedAt = new Date();

    logger.info('Workflow paused', { workflowId });
    this.emit('workflowPaused', workflow);
  }

  /**
   * Resume a paused workflow
   */
  public async resumeWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (workflow.status !== WorkflowStatus.PAUSED) {
      throw new Error(`Cannot resume workflow in status: ${workflow.status}`);
    }

    workflow.status = WorkflowStatus.RUNNING;
    workflow.resumedAt = new Date();

    // Queue for execution
    this.queueExecution({
      workflowId,
      type: 'resume',
      timestamp: new Date(),
    });

    logger.info('Workflow resumed', { workflowId });
    this.emit('workflowResumed', workflow);
  }

  /**
   * Cancel a workflow
   */
  public async cancelWorkflow(workflowId: string, reason?: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (workflow.status === WorkflowStatus.COMPLETED || workflow.status === WorkflowStatus.CANCELLED) {
      throw new Error(`Cannot cancel workflow in status: ${workflow.status}`);
    }

    workflow.status = WorkflowStatus.CANCELLED;
    workflow.completedAt = new Date();
    workflow.error = reason || 'Workflow cancelled by user';

    // Cancel current step if running
    const currentStep = workflow.steps[workflow.currentStepIndex];
    if (currentStep && currentStep.status === StepStatus.RUNNING) {
      currentStep.status = StepStatus.CANCELLED;
      currentStep.completedAt = new Date();
      currentStep.error = 'Cancelled due to workflow cancellation';
    }

    this.metrics.activeWorkflows--;

    logger.info('Workflow cancelled', { workflowId, reason });
    this.emit('workflowCancelled', workflow);
  }

  /**
   * Execute a workflow step
   */
  private async executeStep(workflow: WorkflowInstance, step: WorkflowStep): Promise<void> {
    const startTime = Date.now();

    try {
      step.status = StepStatus.RUNNING;
      step.startedAt = new Date();

      logger.info('Executing workflow step', {
        workflowId: workflow.id,
        stepId: step.id,
        stepType: step.type,
        stepName: step.name,
      });

      // Execute step based on type
      let result: any;
      switch (step.type) {
        case 'task':
          result = await this.executeTaskStep(workflow, step);
          break;
        case 'approval':
          result = await this.executeApprovalStep(workflow, step);
          break;
        case 'notification':
          result = await this.executeNotificationStep(workflow, step);
          break;
        case 'condition':
          result = await this.executeConditionStep(workflow, step);
          break;
        case 'parallel':
          result = await this.executeParallelStep(workflow, step);
          break;
        case 'delay':
          result = await this.executeDelayStep(workflow, step);
          break;
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      step.status = StepStatus.COMPLETED;
      step.completedAt = new Date();
      step.result = result;

      // Update workflow context with step result
      if (result && typeof result === 'object') {
        workflow.context = { ...workflow.context, ...result };
      }

      const duration = Date.now() - startTime;
      logger.info('Workflow step completed', {
        workflowId: workflow.id,
        stepId: step.id,
        duration: `${duration}ms`,
      });

      this.emit('stepCompleted', workflow, step);
    } catch (error) {
      step.status = StepStatus.FAILED;
      step.completedAt = new Date();
      step.error = (error as Error).message;
      step.retryCount++;

      const duration = Date.now() - startTime;
      logger.error('Workflow step failed', {
        workflowId: workflow.id,
        stepId: step.id,
        error: (error as Error).message,
        retryCount: step.retryCount,
        duration: `${duration}ms`,
      });

      this.emit('stepFailed', workflow, step, error);

      // Check if we should retry
      if (step.retryCount < this.options.retryAttempts && step.retryable !== false) {
        logger.info('Retrying workflow step', {
          workflowId: workflow.id,
          stepId: step.id,
          retryCount: step.retryCount,
        });

        // Reset step status for retry
        step.status = StepStatus.PENDING;
        step.startedAt = undefined;
        step.completedAt = undefined;
        step.error = undefined;

        // Schedule retry with delay
        setTimeout(() => {
          this.queueExecution({
            workflowId: workflow.id,
            type: 'retry_step',
            stepIndex: workflow.currentStepIndex,
            timestamp: new Date(),
          });
        }, this.options.retryDelay);

        return;
      }

      // No more retries, fail the workflow
      throw error;
    }
  }

  /**
   * Execute task step
   */
  private async executeTaskStep(workflow: WorkflowInstance, step: WorkflowStep): Promise<any> {
    // Implementation for task execution
    // This would integrate with the task management system
    return { taskId: `task_${Date.now()}`, status: 'created' };
  }

  /**
   * Execute approval step
   */
  private async executeApprovalStep(workflow: WorkflowInstance, step: WorkflowStep): Promise<any> {
    // Implementation for approval process
    // This would integrate with the approval system
    return { approvalId: `approval_${Date.now()}`, status: 'pending' };
  }

  /**
   * Execute notification step
   */
  private async executeNotificationStep(workflow: WorkflowInstance, step: WorkflowStep): Promise<any> {
    // Implementation for sending notifications
    return { notificationId: `notification_${Date.now()}`, status: 'sent' };
  }

  /**
   * Execute condition step
   */
  private async executeConditionStep(workflow: WorkflowInstance, step: WorkflowStep): Promise<any> {
    // Implementation for conditional logic
    const condition = step.config?.condition;
    if (!condition) {
      throw new Error('Condition step requires condition configuration');
    }

    // Evaluate condition against workflow context
    const result = this.evaluateCondition(condition, workflow.context);
    return { conditionResult: result };
  }

  /**
   * Execute parallel step
   */
  private async executeParallelStep(workflow: WorkflowInstance, step: WorkflowStep): Promise<any> {
    // Implementation for parallel execution
    const parallelSteps = step.config?.steps || [];
    const results = await Promise.all(
      parallelSteps.map((parallelStep: WorkflowStep) => this.executeStep(workflow, parallelStep))
    );
    return { parallelResults: results };
  }

  /**
   * Execute delay step
   */
  private async executeDelayStep(workflow: WorkflowInstance, step: WorkflowStep): Promise<any> {
    const delay = step.config?.delay || 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    return { delayed: delay };
  }

  /**
   * Evaluate condition
   */
  private evaluateCondition(condition: string, context: WorkflowContext): boolean {
    // Simple condition evaluation - in production, use a proper expression evaluator
    try {
      // Replace context variables in condition
      let evaluatedCondition = condition;
      Object.entries(context).forEach(([key, value]) => {
        evaluatedCondition = evaluatedCondition.replace(
          new RegExp(`\\$\\{${key}\\}`, 'g'),
          JSON.stringify(value)
        );
      });

      // Evaluate the condition (be careful with eval in production)
      return new Function('return ' + evaluatedCondition)();
    } catch (error) {
      logger.error('Failed to evaluate condition', { condition, context, error });
      return false;
    }
  }

  /**
   * Process workflow execution
   */
  private async processWorkflow(workflow: WorkflowInstance): Promise<void> {
    try {
      workflow.status = WorkflowStatus.RUNNING;
      if (!workflow.startedAt) {
        workflow.startedAt = new Date();
      }

      while (workflow.currentStepIndex < workflow.steps.length) {
        const currentStep = workflow.steps[workflow.currentStepIndex];

        // Check if workflow is paused
        if (workflow.status === WorkflowStatus.PAUSED) {
          return;
        }

        // Check timeout
        if (this.isWorkflowTimedOut(workflow)) {
          throw new Error('Workflow execution timed out');
        }

        // Execute current step
        await this.executeStep(workflow, currentStep);

        // Move to next step
        workflow.currentStepIndex++;
      }

      // Workflow completed successfully
      workflow.status = WorkflowStatus.COMPLETED;
      workflow.completedAt = new Date();
      this.metrics.activeWorkflows--;
      this.metrics.successfulExecutions++;

      const duration = workflow.completedAt.getTime() - workflow.startedAt!.getTime();
      this.updateAverageExecutionTime(duration);

      logger.info('Workflow completed successfully', {
        workflowId: workflow.id,
        duration: `${duration}ms`,
        stepsCompleted: workflow.steps.length,
      });

      this.emit('workflowCompleted', workflow);
    } catch (error) {
      workflow.status = WorkflowStatus.FAILED;
      workflow.completedAt = new Date();
      workflow.error = (error as Error).message;
      this.metrics.activeWorkflows--;
      this.metrics.failedExecutions++;

      logger.error('Workflow execution failed', {
        workflowId: workflow.id,
        error: (error as Error).message,
        currentStep: workflow.currentStepIndex,
      });

      this.emit('workflowFailed', workflow, error);
    }
  }

  /**
   * Queue workflow execution
   */
  private queueExecution(execution: WorkflowExecution): void {
    this.executionQueue.push(execution);
    this.processQueue();
  }

  /**
   * Start processing execution queue
   */
  private startProcessing(): void {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.processQueue();
  }

  /**
   * Process execution queue
   */
  private async processQueue(): Promise<void> {
    while (this.executionQueue.length > 0 && this.getActiveWorkflows().length < this.options.maxConcurrentWorkflows) {
      const execution = this.executionQueue.shift();
      if (!execution) continue;

      const workflow = this.workflows.get(execution.workflowId);
      if (!workflow) continue;

      try {
        this.metrics.totalExecutions++;
        await this.processWorkflow(workflow);
      } catch (error) {
        logger.error('Failed to process workflow', {
          workflowId: execution.workflowId,
          error: (error as Error).message,
        });
      }
    }

    // Schedule next processing cycle
    setTimeout(() => this.processQueue(), 1000);
  }

  /**
   * Check if workflow has timed out
   */
  private isWorkflowTimedOut(workflow: WorkflowInstance): boolean {
    if (!workflow.startedAt || !workflow.timeout) return false;
    return Date.now() - workflow.startedAt.getTime() > workflow.timeout;
  }

  /**
   * Update average execution time metric
   */
  private updateAverageExecutionTime(duration: number): void {
    const totalExecutions = this.metrics.successfulExecutions;
    this.metrics.averageExecutionTime = 
      (this.metrics.averageExecutionTime * (totalExecutions - 1) + duration) / totalExecutions;
  }

  /**
   * Generate unique workflow ID
   */
  private generateWorkflowId(): string {
    return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load workflow definitions
   */
  private async loadWorkflowDefinitions(): Promise<void> {
    // Load predefined workflow definitions
    // This would typically load from database or configuration files
    logger.info('Loading workflow definitions...');
  }

  /**
   * Restore persisted workflows
   */
  private async restorePersistedWorkflows(): Promise<void> {
    if (!this.options.enablePersistence) return;
    // Restore workflows from persistence layer
    logger.info('Restoring persisted workflows...');
  }

  /**
   * Get engine metrics
   */
  public getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Shutdown the workflow engine
   */
  public async shutdown(): Promise<void> {
    logger.info('Shutting down Workflow Engine...');
    this.isProcessing = false;
    
    // Wait for active workflows to complete or timeout
    const activeWorkflows = this.getActiveWorkflows();
    if (activeWorkflows.length > 0) {
      logger.info(`Waiting for ${activeWorkflows.length} active workflows to complete...`);
      // In production, implement graceful shutdown with timeout
    }

    this.emit('shutdown');
    logger.info('Workflow Engine shutdown completed');
  }
}

export default WorkflowEngine;
