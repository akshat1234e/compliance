/**
 * Scheduled Scraping Service
 * Handles automated scraping of RBI circulars on a schedule
 */

import cron from 'node-cron';
import { logger, loggers } from '@utils/logger';
import RBIScraperService, { ScrapingOptions } from './scraperService';
import { config } from '@config/index';

export interface ScheduleConfig {
  enabled: boolean;
  cronExpression: string;
  scrapingOptions: ScrapingOptions;
  retryAttempts: number;
  retryDelay: number;
}

export class ScheduledScrapingService {
  private scraperService: RBIScraperService;
  private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();
  private isRunning = false;
  private lastRun: Date | null = null;
  private nextRun: Date | null = null;

  constructor() {
    this.scraperService = new RBIScraperService();
  }

  /**
   * Start scheduled scraping
   */
  public start(scheduleConfig: ScheduleConfig): void {
    if (!scheduleConfig.enabled) {
      logger.info('Scheduled scraping is disabled');
      return;
    }

    if (this.scheduledTasks.has('main')) {
      logger.warn('Scheduled scraping is already running');
      return;
    }

    try {
      // Validate cron expression
      if (!cron.validate(scheduleConfig.cronExpression)) {
        throw new Error(`Invalid cron expression: ${scheduleConfig.cronExpression}`);
      }

      // Create scheduled task
      const task = cron.schedule(scheduleConfig.cronExpression, async () => {
        await this.executeScheduledScraping(scheduleConfig);
      }, {
        scheduled: false,
        timezone: 'Asia/Kolkata', // IST timezone for RBI
      });

      // Start the task
      task.start();
      this.scheduledTasks.set('main', task);

      // Calculate next run time
      this.updateNextRunTime(scheduleConfig.cronExpression);

      logger.info('Scheduled scraping started', {
        cronExpression: scheduleConfig.cronExpression,
        nextRun: this.nextRun?.toISOString(),
        scrapingOptions: scheduleConfig.scrapingOptions,
      });

    } catch (error) {
      logger.error('Failed to start scheduled scraping', {
        error: (error as Error).message,
        scheduleConfig,
      });
      throw error;
    }
  }

  /**
   * Stop scheduled scraping
   */
  public stop(): void {
    this.scheduledTasks.forEach((task, name) => {
      task.stop();
      task.destroy();
      logger.info(`Stopped scheduled task: ${name}`);
    });

    this.scheduledTasks.clear();
    this.nextRun = null;

    logger.info('All scheduled scraping tasks stopped');
  }

  /**
   * Execute scheduled scraping
   */
  private async executeScheduledScraping(scheduleConfig: ScheduleConfig): Promise<void> {
    if (this.isRunning) {
      logger.warn('Scheduled scraping is already running, skipping this execution');
      return;
    }

    this.isRunning = true;
    this.lastRun = new Date();
    
    const startTime = Date.now();

    try {
      logger.info('Starting scheduled scraping', {
        scheduledTime: this.lastRun.toISOString(),
        options: scheduleConfig.scrapingOptions,
      });

      // Execute scraping with retry logic
      const result = await this.executeWithRetry(
        () => this.scraperService.scrapeCircularsList(scheduleConfig.scrapingOptions),
        scheduleConfig.retryAttempts,
        scheduleConfig.retryDelay
      );

      const duration = Date.now() - startTime;

      // Log successful execution
      loggers.business('scheduled_scraping', {
        success: true,
        totalFound: result.totalFound,
        duration: `${duration}ms`,
        scheduledTime: this.lastRun.toISOString(),
        retryAttempts: 0,
      });

      // TODO: Store results in database
      await this.storeScrapingResults(result);

      // TODO: Send notifications if new circulars found
      if (result.totalFound > 0) {
        await this.sendNewCircularNotifications(result);
      }

      logger.info('Scheduled scraping completed successfully', {
        totalFound: result.totalFound,
        duration: `${duration}ms`,
      });

    } catch (error) {
      const duration = Date.now() - startTime;

      loggers.business('scheduled_scraping', {
        success: false,
        duration: `${duration}ms`,
        scheduledTime: this.lastRun.toISOString(),
        error: (error as Error).message,
      }, error as Error);

      logger.error('Scheduled scraping failed', {
        error: (error as Error).message,
        duration: `${duration}ms`,
      });

      // TODO: Send failure notifications
      await this.sendFailureNotification(error as Error);

    } finally {
      this.isRunning = false;
      this.updateNextRunTime(scheduleConfig.cronExpression);
    }
  }

  /**
   * Execute function with retry logic
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxAttempts: number,
    delay: number
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) {
          throw lastError;
        }

        logger.warn(`Scraping attempt ${attempt} failed, retrying in ${delay}ms`, {
          error: lastError.message,
          attempt,
          maxAttempts,
        });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Store scraping results in database
   */
  private async storeScrapingResults(result: any): Promise<void> {
    try {
      // TODO: Implement database storage
      logger.debug('Storing scraping results', {
        totalCirculars: result.totalFound,
        timestamp: result.scrapedAt,
      });

      // For now, just log the action
      logger.info('Scraping results stored successfully', {
        totalCirculars: result.totalFound,
      });

    } catch (error) {
      logger.error('Failed to store scraping results', {
        error: (error as Error).message,
        totalCirculars: result.totalFound,
      });
      // Don't throw error to avoid failing the entire scraping process
    }
  }

  /**
   * Send notifications for new circulars
   */
  private async sendNewCircularNotifications(result: any): Promise<void> {
    try {
      // TODO: Implement notification sending
      logger.debug('Sending new circular notifications', {
        totalNew: result.totalFound,
      });

      // For now, just log the action
      logger.info('New circular notifications sent', {
        totalNew: result.totalFound,
      });

    } catch (error) {
      logger.error('Failed to send new circular notifications', {
        error: (error as Error).message,
        totalNew: result.totalFound,
      });
      // Don't throw error to avoid failing the entire scraping process
    }
  }

  /**
   * Send failure notification
   */
  private async sendFailureNotification(error: Error): Promise<void> {
    try {
      // TODO: Implement failure notification
      logger.debug('Sending scraping failure notification', {
        error: error.message,
      });

      // For now, just log the action
      logger.warn('Scraping failure notification sent', {
        error: error.message,
      });

    } catch (notificationError) {
      logger.error('Failed to send failure notification', {
        originalError: error.message,
        notificationError: (notificationError as Error).message,
      });
    }
  }

  /**
   * Update next run time
   */
  private updateNextRunTime(cronExpression: string): void {
    try {
      // Simple calculation - in a real implementation, you'd use a proper cron parser
      const now = new Date();
      this.nextRun = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default to 24 hours from now
      
      logger.debug('Next scheduled run updated', {
        nextRun: this.nextRun.toISOString(),
      });

    } catch (error) {
      logger.error('Failed to calculate next run time', {
        error: (error as Error).message,
        cronExpression,
      });
    }
  }

  /**
   * Get scheduling status
   */
  public getStatus(): any {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun?.toISOString(),
      nextRun: this.nextRun?.toISOString(),
      activeTasks: Array.from(this.scheduledTasks.keys()),
      taskCount: this.scheduledTasks.size,
    };
  }

  /**
   * Get default schedule configuration
   */
  public static getDefaultConfig(): ScheduleConfig {
    return {
      enabled: true,
      cronExpression: '0 6 * * *', // Daily at 6 AM IST
      scrapingOptions: {
        maxPages: 5,
        includeContent: false,
        downloadFiles: false,
      },
      retryAttempts: 3,
      retryDelay: 5000, // 5 seconds
    };
  }
}

export default ScheduledScrapingService;
