/**
 * Task Scheduler Service
 * Manages scheduled tasks, recurring jobs, and workflow automation
 */

import { EventEmitter } from 'events';
import * as cron from 'node-cron';
import Queue from 'bull';
import { logger } from '@utils/logger';
import { config } from '@config/index';
import {
  ScheduledTask,
  TaskSchedule,
  TaskExecution,
  TaskStatus,
  RecurringJob,
  JobExecution,
} from '@types/scheduler';

export interface TaskSchedulerOptions {
  concurrency?: number;
  defaultDelay?: number;
  maxRetries?: number;
  backoffStrategy?: 'fixed' | 'exponential' | 'linear';
  enableCleanup?: boolean;
  cleanupInterval?: number;
}

export class TaskScheduler extends EventEmitter {
  private taskQueue: Queue.Queue;
  private scheduledTasks: Map<string, ScheduledTask> = new Map();
  private cronJobs: Map<string, cron.ScheduledTask> = new Map();
  private recurringJobs: Map<string, RecurringJob> = new Map();
  private options: Required<TaskSchedulerOptions>;
  private isInitialized = false;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(options: TaskSchedulerOptions = {}) {
    super();
    this.options = {
      concurrency: options.concurrency || config.scheduler.concurrency,
      defaultDelay: options.defaultDelay || config.scheduler.defaultDelay,
      maxRetries: options.maxRetries || config.scheduler.maxRetries,
      backoffStrategy: options.backoffStrategy || (config.scheduler.backoffStrategy as any),
      enableCleanup: options.enableCleanup ?? config.scheduler.enableCleanup,
      cleanupInterval: options.cleanupInterval || config.scheduler.cleanupInterval,
    };

    // Initialize Bull queue for task processing
    this.taskQueue = new Queue('compliance-tasks', {
      redis: {
        host: config.database.redis.host,
        port: config.database.redis.port,
        password: config.database.redis.password,
        db: config.database.redis.db,
      },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: this.options.maxRetries,
        backoff: {
          type: this.options.backoffStrategy,
          delay: this.options.defaultDelay,
        },
      },
    });
  }

  /**
   * Initialize the task scheduler
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Task scheduler already initialized');
      return;
    }

    try {
      logger.info('Initializing Task Scheduler...');

      // Set up queue processing
      this.setupQueueProcessing();

      // Set up queue event handlers
      this.setupQueueEventHandlers();

      // Load existing scheduled tasks
      await this.loadScheduledTasks();

      // Start cleanup timer if enabled
      if (this.options.enableCleanup) {
        this.startCleanupTimer();
      }

      this.isInitialized = true;
      logger.info('Task Scheduler initialized successfully', {
        concurrency: this.options.concurrency,
        maxRetries: this.options.maxRetries,
        backoffStrategy: this.options.backoffStrategy,
      });

      this.emit('initialized');
    } catch (error) {
      logger.error('Failed to initialize Task Scheduler', error);
      throw error;
    }
  }

  /**
   * Schedule a one-time task
   */
  public async scheduleTask(task: Omit<ScheduledTask, 'id' | 'status' | 'createdAt'>): Promise<string> {
    const taskId = this.generateTaskId();
    const scheduledTask: ScheduledTask = {
      id: taskId,
      ...task,
      status: TaskStatus.SCHEDULED,
      createdAt: new Date(),
    };

    this.scheduledTasks.set(taskId, scheduledTask);

    // Calculate delay
    const delay = task.scheduledAt ? task.scheduledAt.getTime() - Date.now() : 0;

    // Add to queue
    const job = await this.taskQueue.add(
      'execute-task',
      {
        taskId,
        taskData: task.data,
        taskType: task.type,
      },
      {
        delay: Math.max(0, delay),
        priority: this.getPriority(task.priority),
        jobId: taskId,
      }
    );

    logger.info('Task scheduled', {
      taskId,
      type: task.type,
      scheduledAt: task.scheduledAt,
      delay: `${delay}ms`,
      priority: task.priority,
    });

    this.emit('taskScheduled', scheduledTask);
    return taskId;
  }

  /**
   * Schedule a recurring job
   */
  public scheduleRecurringJob(job: Omit<RecurringJob, 'id' | 'createdAt' | 'lastRun' | 'nextRun' | 'runCount'>): string {
    const jobId = this.generateJobId();
    const recurringJob: RecurringJob = {
      id: jobId,
      ...job,
      createdAt: new Date(),
      runCount: 0,
      nextRun: this.calculateNextRun(job.schedule),
    };

    this.recurringJobs.set(jobId, recurringJob);

    // Create cron job
    const cronJob = cron.schedule(
      job.schedule,
      async () => {
        await this.executeRecurringJob(jobId);
      },
      {
        scheduled: job.isActive,
        timezone: job.timezone || 'UTC',
      }
    );

    this.cronJobs.set(jobId, cronJob);

    logger.info('Recurring job scheduled', {
      jobId,
      name: job.name,
      schedule: job.schedule,
      timezone: job.timezone,
      isActive: job.isActive,
    });

    this.emit('recurringJobScheduled', recurringJob);
    return jobId;
  }

  /**
   * Cancel a scheduled task
   */
  public async cancelTask(taskId: string): Promise<boolean> {
    const task = this.scheduledTasks.get(taskId);
    if (!task) {
      logger.warn('Task not found for cancellation', { taskId });
      return false;
    }

    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.FAILED) {
      logger.warn('Cannot cancel completed or failed task', { taskId, status: task.status });
      return false;
    }

    // Remove from queue
    const job = await this.taskQueue.getJob(taskId);
    if (job) {
      await job.remove();
    }

    // Update task status
    task.status = TaskStatus.CANCELLED;
    task.completedAt = new Date();

    logger.info('Task cancelled', { taskId });
    this.emit('taskCancelled', task);
    return true;
  }

  /**
   * Cancel a recurring job
   */
  public cancelRecurringJob(jobId: string): boolean {
    const job = this.recurringJobs.get(jobId);
    const cronJob = this.cronJobs.get(jobId);

    if (!job || !cronJob) {
      logger.warn('Recurring job not found for cancellation', { jobId });
      return false;
    }

    // Stop cron job
    cronJob.stop();
    cronJob.destroy();

    // Remove from maps
    this.recurringJobs.delete(jobId);
    this.cronJobs.delete(jobId);

    logger.info('Recurring job cancelled', { jobId, name: job.name });
    this.emit('recurringJobCancelled', job);
    return true;
  }

  /**
   * Pause a recurring job
   */
  public pauseRecurringJob(jobId: string): boolean {
    const job = this.recurringJobs.get(jobId);
    const cronJob = this.cronJobs.get(jobId);

    if (!job || !cronJob) {
      logger.warn('Recurring job not found for pausing', { jobId });
      return false;
    }

    cronJob.stop();
    job.isActive = false;

    logger.info('Recurring job paused', { jobId, name: job.name });
    this.emit('recurringJobPaused', job);
    return true;
  }

  /**
   * Resume a recurring job
   */
  public resumeRecurringJob(jobId: string): boolean {
    const job = this.recurringJobs.get(jobId);
    const cronJob = this.cronJobs.get(jobId);

    if (!job || !cronJob) {
      logger.warn('Recurring job not found for resuming', { jobId });
      return false;
    }

    cronJob.start();
    job.isActive = true;
    job.nextRun = this.calculateNextRun(job.schedule);

    logger.info('Recurring job resumed', { jobId, name: job.name });
    this.emit('recurringJobResumed', job);
    return true;
  }

  /**
   * Get task status
   */
  public getTask(taskId: string): ScheduledTask | undefined {
    return this.scheduledTasks.get(taskId);
  }

  /**
   * Get recurring job
   */
  public getRecurringJob(jobId: string): RecurringJob | undefined {
    return this.recurringJobs.get(jobId);
  }

  /**
   * Get all scheduled tasks
   */
  public getAllTasks(): ScheduledTask[] {
    return Array.from(this.scheduledTasks.values());
  }

  /**
   * Get all recurring jobs
   */
  public getAllRecurringJobs(): RecurringJob[] {
    return Array.from(this.recurringJobs.values());
  }

  /**
   * Get queue statistics
   */
  public async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.taskQueue.getWaiting(),
      this.taskQueue.getActive(),
      this.taskQueue.getCompleted(),
      this.taskQueue.getFailed(),
      this.taskQueue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  /**
   * Setup queue processing
   */
  private setupQueueProcessing(): void {
    this.taskQueue.process('execute-task', this.options.concurrency, async (job) => {
      const { taskId, taskData, taskType } = job.data;
      
      logger.info('Processing task', {
        taskId,
        taskType,
        attempt: job.attemptsMade + 1,
        maxAttempts: job.opts.attempts,
      });

      try {
        const result = await this.executeTask(taskId, taskType, taskData);
        
        // Update task status
        const task = this.scheduledTasks.get(taskId);
        if (task) {
          task.status = TaskStatus.COMPLETED;
          task.completedAt = new Date();
          task.result = result;
        }

        logger.info('Task completed successfully', { taskId, taskType });
        this.emit('taskCompleted', task, result);
        
        return result;
      } catch (error) {
        logger.error('Task execution failed', {
          taskId,
          taskType,
          error: (error as Error).message,
          attempt: job.attemptsMade + 1,
        });

        // Update task status on final failure
        if (job.attemptsMade + 1 >= (job.opts.attempts || 1)) {
          const task = this.scheduledTasks.get(taskId);
          if (task) {
            task.status = TaskStatus.FAILED;
            task.completedAt = new Date();
            task.error = (error as Error).message;
          }
          this.emit('taskFailed', task, error);
        }

        throw error;
      }
    });
  }

  /**
   * Setup queue event handlers
   */
  private setupQueueEventHandlers(): void {
    this.taskQueue.on('completed', (job, result) => {
      logger.debug('Queue job completed', {
        jobId: job.id,
        processingTime: job.processedOn ? Date.now() - job.processedOn : 0,
      });
    });

    this.taskQueue.on('failed', (job, error) => {
      logger.error('Queue job failed', {
        jobId: job.id,
        error: error.message,
        attemptsMade: job.attemptsMade,
        maxAttempts: job.opts.attempts,
      });
    });

    this.taskQueue.on('stalled', (job) => {
      logger.warn('Queue job stalled', {
        jobId: job.id,
        processingTime: job.processedOn ? Date.now() - job.processedOn : 0,
      });
    });
  }

  /**
   * Execute a task
   */
  private async executeTask(taskId: string, taskType: string, taskData: any): Promise<any> {
    // Task execution logic based on type
    switch (taskType) {
      case 'workflow_trigger':
        return this.executeWorkflowTrigger(taskData);
      case 'notification':
        return this.executeNotification(taskData);
      case 'data_sync':
        return this.executeDataSync(taskData);
      case 'report_generation':
        return this.executeReportGeneration(taskData);
      case 'compliance_check':
        return this.executeComplianceCheck(taskData);
      case 'deadline_reminder':
        return this.executeDeadlineReminder(taskData);
      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }
  }

  /**
   * Execute workflow trigger task
   */
  private async executeWorkflowTrigger(data: any): Promise<any> {
    // Implementation for triggering workflows
    logger.info('Executing workflow trigger', { workflowId: data.workflowId });
    return { triggered: true, workflowId: data.workflowId };
  }

  /**
   * Execute notification task
   */
  private async executeNotification(data: any): Promise<any> {
    // Implementation for sending notifications
    logger.info('Executing notification', { type: data.type, recipients: data.recipients?.length });
    return { sent: true, notificationId: `notif_${Date.now()}` };
  }

  /**
   * Execute data sync task
   */
  private async executeDataSync(data: any): Promise<any> {
    // Implementation for data synchronization
    logger.info('Executing data sync', { source: data.source, target: data.target });
    return { synced: true, recordCount: data.recordCount || 0 };
  }

  /**
   * Execute report generation task
   */
  private async executeReportGeneration(data: any): Promise<any> {
    // Implementation for report generation
    logger.info('Executing report generation', { reportType: data.reportType });
    return { generated: true, reportId: `report_${Date.now()}` };
  }

  /**
   * Execute compliance check task
   */
  private async executeComplianceCheck(data: any): Promise<any> {
    // Implementation for compliance checking
    logger.info('Executing compliance check', { checkType: data.checkType });
    return { checked: true, violations: data.violations || [] };
  }

  /**
   * Execute deadline reminder task
   */
  private async executeDeadlineReminder(data: any): Promise<any> {
    // Implementation for deadline reminders
    logger.info('Executing deadline reminder', { deadline: data.deadline });
    return { reminded: true, recipientCount: data.recipients?.length || 0 };
  }

  /**
   * Execute recurring job
   */
  private async executeRecurringJob(jobId: string): Promise<void> {
    const job = this.recurringJobs.get(jobId);
    if (!job || !job.isActive) {
      return;
    }

    try {
      logger.info('Executing recurring job', { jobId, name: job.name });

      // Create task execution for the recurring job
      const taskId = await this.scheduleTask({
        name: `${job.name} - ${new Date().toISOString()}`,
        type: job.taskType,
        data: job.taskData,
        priority: job.priority || 'medium',
        scheduledAt: new Date(),
      });

      // Update job statistics
      job.runCount++;
      job.lastRun = new Date();
      job.nextRun = this.calculateNextRun(job.schedule);

      logger.info('Recurring job executed', {
        jobId,
        name: job.name,
        runCount: job.runCount,
        nextRun: job.nextRun,
        taskId,
      });

      this.emit('recurringJobExecuted', job, taskId);
    } catch (error) {
      logger.error('Recurring job execution failed', {
        jobId,
        name: job.name,
        error: (error as Error).message,
      });

      this.emit('recurringJobFailed', job, error);
    }
  }

  /**
   * Calculate next run time for cron schedule
   */
  private calculateNextRun(schedule: string): Date {
    // Simple implementation - in production, use a proper cron parser
    const now = new Date();
    return new Date(now.getTime() + 60000); // Default to 1 minute from now
  }

  /**
   * Get priority value for Bull queue
   */
  private getPriority(priority: string): number {
    switch (priority) {
      case 'critical': return 10;
      case 'high': return 5;
      case 'medium': return 0;
      case 'low': return -5;
      default: return 0;
    }
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load existing scheduled tasks
   */
  private async loadScheduledTasks(): Promise<void> {
    // Load tasks from persistence layer
    logger.info('Loading scheduled tasks...');
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.options.cleanupInterval);
  }

  /**
   * Perform cleanup of completed/failed tasks
   */
  private performCleanup(): void {
    const now = Date.now();
    const cleanupThreshold = 24 * 60 * 60 * 1000; // 24 hours

    let cleanedCount = 0;
    for (const [taskId, task] of this.scheduledTasks.entries()) {
      if (
        (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.FAILED) &&
        task.completedAt &&
        now - task.completedAt.getTime() > cleanupThreshold
      ) {
        this.scheduledTasks.delete(taskId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info('Cleanup completed', { cleanedTasks: cleanedCount });
    }
  }

  /**
   * Shutdown the task scheduler
   */
  public async shutdown(): Promise<void> {
    logger.info('Shutting down Task Scheduler...');

    // Stop cleanup timer
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // Stop all cron jobs
    for (const [jobId, cronJob] of this.cronJobs.entries()) {
      cronJob.stop();
      cronJob.destroy();
    }

    // Close task queue
    await this.taskQueue.close();

    this.isInitialized = false;
    this.emit('shutdown');
    logger.info('Task Scheduler shutdown completed');
  }
}

export default TaskScheduler;
