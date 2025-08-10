/**
 * Notification Service
 * Manages multi-channel notifications for compliance workflows
 */

import { EventEmitter } from 'events';
import nodemailer from 'nodemailer';
import axios from 'axios';
import { logger } from '@utils/logger';
import { config } from '@config/index';
import {
  Notification,
  NotificationChannel,
  NotificationTemplate,
  NotificationStatus,
  NotificationPriority,
  EmailNotification,
  SlackNotification,
  TeamsNotification,
  InAppNotification,
} from '@types/notification';

export interface NotificationServiceOptions {
  enableEmail?: boolean;
  enableSlack?: boolean;
  enableTeams?: boolean;
  enableInApp?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

export class NotificationService extends EventEmitter {
  private emailTransporter?: nodemailer.Transporter;
  private templates: Map<string, NotificationTemplate> = new Map();
  private notifications: Map<string, Notification> = new Map();
  private options: Required<NotificationServiceOptions>;
  private isInitialized = false;

  constructor(options: NotificationServiceOptions = {}) {
    super();
    this.options = {
      enableEmail: options.enableEmail ?? config.notifications.email.enabled,
      enableSlack: options.enableSlack ?? config.notifications.slack.enabled,
      enableTeams: options.enableTeams ?? config.notifications.teams.enabled,
      enableInApp: options.enableInApp ?? config.notifications.inApp.enabled,
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 5000,
    };
  }

  /**
   * Initialize the notification service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Notification service already initialized');
      return;
    }

    try {
      logger.info('Initializing Notification Service...');

      // Initialize email transporter
      if (this.options.enableEmail) {
        await this.initializeEmailTransporter();
      }

      // Load notification templates
      await this.loadNotificationTemplates();

      // Validate external service configurations
      await this.validateExternalServices();

      this.isInitialized = true;
      logger.info('Notification Service initialized successfully', {
        enableEmail: this.options.enableEmail,
        enableSlack: this.options.enableSlack,
        enableTeams: this.options.enableTeams,
        enableInApp: this.options.enableInApp,
      });

      this.emit('initialized');
    } catch (error) {
      logger.error('Failed to initialize Notification Service', error);
      throw error;
    }
  }

  /**
   * Send a notification
   */
  public async sendNotification(notification: Omit<Notification, 'id' | 'status' | 'createdAt' | 'attempts'>): Promise<string> {
    const notificationId = this.generateNotificationId();
    const fullNotification: Notification = {
      id: notificationId,
      ...notification,
      status: NotificationStatus.PENDING,
      createdAt: new Date(),
      attempts: 0,
    };

    this.notifications.set(notificationId, fullNotification);

    logger.info('Sending notification', {
      notificationId,
      type: notification.type,
      channels: notification.channels,
      recipients: notification.recipients.length,
      priority: notification.priority,
    });

    // Process notification asynchronously
    this.processNotification(fullNotification).catch((error) => {
      logger.error('Failed to process notification', {
        notificationId,
        error: (error as Error).message,
      });
    });

    this.emit('notificationQueued', fullNotification);
    return notificationId;
  }

  /**
   * Send email notification
   */
  public async sendEmail(emailNotification: Omit<EmailNotification, 'id' | 'status' | 'createdAt' | 'attempts'>): Promise<string> {
    return this.sendNotification({
      ...emailNotification,
      channels: [NotificationChannel.EMAIL],
      type: emailNotification.type || 'email',
      priority: emailNotification.priority || NotificationPriority.MEDIUM,
    });
  }

  /**
   * Send Slack notification
   */
  public async sendSlackNotification(slackNotification: Omit<SlackNotification, 'id' | 'status' | 'createdAt' | 'attempts'>): Promise<string> {
    return this.sendNotification({
      ...slackNotification,
      channels: [NotificationChannel.SLACK],
      type: slackNotification.type || 'slack',
      priority: slackNotification.priority || NotificationPriority.MEDIUM,
    });
  }

  /**
   * Send Teams notification
   */
  public async sendTeamsNotification(teamsNotification: Omit<TeamsNotification, 'id' | 'status' | 'createdAt' | 'attempts'>): Promise<string> {
    return this.sendNotification({
      ...teamsNotification,
      channels: [NotificationChannel.TEAMS],
      type: teamsNotification.type || 'teams',
      priority: teamsNotification.priority || NotificationPriority.MEDIUM,
    });
  }

  /**
   * Send in-app notification
   */
  public async sendInAppNotification(inAppNotification: Omit<InAppNotification, 'id' | 'status' | 'createdAt' | 'attempts'>): Promise<string> {
    return this.sendNotification({
      ...inAppNotification,
      channels: [NotificationChannel.IN_APP],
      type: inAppNotification.type || 'in_app',
      priority: inAppNotification.priority || NotificationPriority.MEDIUM,
    });
  }

  /**
   * Get notification by ID
   */
  public getNotification(notificationId: string): Notification | undefined {
    return this.notifications.get(notificationId);
  }

  /**
   * Get notifications by status
   */
  public getNotificationsByStatus(status: NotificationStatus): Notification[] {
    return Array.from(this.notifications.values()).filter(n => n.status === status);
  }

  /**
   * Retry failed notification
   */
  public async retryNotification(notificationId: string): Promise<boolean> {
    const notification = this.notifications.get(notificationId);
    if (!notification) {
      logger.warn('Notification not found for retry', { notificationId });
      return false;
    }

    if (notification.status !== NotificationStatus.FAILED) {
      logger.warn('Cannot retry notification that is not failed', {
        notificationId,
        status: notification.status,
      });
      return false;
    }

    notification.status = NotificationStatus.PENDING;
    notification.attempts = 0;
    notification.error = undefined;

    logger.info('Retrying notification', { notificationId });
    await this.processNotification(notification);
    return true;
  }

  /**
   * Cancel pending notification
   */
  public cancelNotification(notificationId: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (!notification) {
      logger.warn('Notification not found for cancellation', { notificationId });
      return false;
    }

    if (notification.status !== NotificationStatus.PENDING) {
      logger.warn('Cannot cancel notification that is not pending', {
        notificationId,
        status: notification.status,
      });
      return false;
    }

    notification.status = NotificationStatus.CANCELLED;
    notification.completedAt = new Date();

    logger.info('Notification cancelled', { notificationId });
    this.emit('notificationCancelled', notification);
    return true;
  }

  /**
   * Process notification through all channels
   */
  private async processNotification(notification: Notification): Promise<void> {
    try {
      notification.status = NotificationStatus.PROCESSING;
      notification.startedAt = new Date();
      notification.attempts++;

      const results: Array<{ channel: NotificationChannel; success: boolean; error?: string }> = [];

      // Process each channel
      for (const channel of notification.channels) {
        try {
          await this.sendToChannel(notification, channel);
          results.push({ channel, success: true });
          logger.debug('Notification sent successfully', {
            notificationId: notification.id,
            channel,
          });
        } catch (error) {
          const errorMessage = (error as Error).message;
          results.push({ channel, success: false, error: errorMessage });
          logger.error('Failed to send notification to channel', {
            notificationId: notification.id,
            channel,
            error: errorMessage,
          });
        }
      }

      // Update notification status based on results
      const successfulChannels = results.filter(r => r.success).length;
      const totalChannels = results.length;

      if (successfulChannels === totalChannels) {
        notification.status = NotificationStatus.SENT;
        notification.completedAt = new Date();
        this.emit('notificationSent', notification);
      } else if (successfulChannels > 0) {
        notification.status = NotificationStatus.PARTIAL;
        notification.completedAt = new Date();
        this.emit('notificationPartial', notification, results);
      } else {
        // All channels failed
        if (notification.attempts < this.options.retryAttempts) {
          // Schedule retry
          setTimeout(() => {
            this.processNotification(notification);
          }, this.options.retryDelay);
          notification.status = NotificationStatus.RETRYING;
        } else {
          notification.status = NotificationStatus.FAILED;
          notification.completedAt = new Date();
          notification.error = 'All channels failed after maximum retry attempts';
          this.emit('notificationFailed', notification, results);
        }
      }

      notification.channelResults = results;
    } catch (error) {
      notification.status = NotificationStatus.FAILED;
      notification.completedAt = new Date();
      notification.error = (error as Error).message;

      logger.error('Notification processing failed', {
        notificationId: notification.id,
        error: (error as Error).message,
      });

      this.emit('notificationFailed', notification, error);
    }
  }

  /**
   * Send notification to specific channel
   */
  private async sendToChannel(notification: Notification, channel: NotificationChannel): Promise<void> {
    switch (channel) {
      case NotificationChannel.EMAIL:
        await this.sendEmailChannel(notification);
        break;
      case NotificationChannel.SLACK:
        await this.sendSlackChannel(notification);
        break;
      case NotificationChannel.TEAMS:
        await this.sendTeamsChannel(notification);
        break;
      case NotificationChannel.IN_APP:
        await this.sendInAppChannel(notification);
        break;
      case NotificationChannel.SMS:
        await this.sendSMSChannel(notification);
        break;
      case NotificationChannel.WEBHOOK:
        await this.sendWebhookChannel(notification);
        break;
      default:
        throw new Error(`Unsupported notification channel: ${channel}`);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailChannel(notification: Notification): Promise<void> {
    if (!this.options.enableEmail || !this.emailTransporter) {
      throw new Error('Email notifications are not enabled or configured');
    }

    const template = notification.templateId ? this.templates.get(notification.templateId) : null;
    const subject = template?.subject || notification.title;
    const content = template ? this.renderTemplate(template.content, notification.data) : notification.message;

    const mailOptions = {
      from: config.notifications.email.from,
      to: notification.recipients.join(', '),
      subject,
      html: content,
      attachments: notification.attachments?.map(att => ({
        filename: att.filename,
        path: att.url,
      })),
    };

    await this.emailTransporter.sendMail(mailOptions);
  }

  /**
   * Send Slack notification
   */
  private async sendSlackChannel(notification: Notification): Promise<void> {
    if (!this.options.enableSlack || !config.notifications.slack.webhookUrl) {
      throw new Error('Slack notifications are not enabled or configured');
    }

    const payload = {
      channel: config.notifications.slack.channel,
      text: notification.title,
      attachments: [
        {
          color: this.getSlackColor(notification.priority),
          fields: [
            {
              title: 'Message',
              value: notification.message,
              short: false,
            },
            {
              title: 'Priority',
              value: notification.priority,
              short: true,
            },
            {
              title: 'Type',
              value: notification.type,
              short: true,
            },
          ],
          ts: Math.floor(notification.createdAt.getTime() / 1000),
        },
      ],
    };

    await axios.post(config.notifications.slack.webhookUrl, payload);
  }

  /**
   * Send Teams notification
   */
  private async sendTeamsChannel(notification: Notification): Promise<void> {
    if (!this.options.enableTeams || !config.notifications.teams.webhookUrl) {
      throw new Error('Teams notifications are not enabled or configured');
    }

    const payload = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: this.getTeamsColor(notification.priority),
      summary: notification.title,
      sections: [
        {
          activityTitle: notification.title,
          activitySubtitle: notification.type,
          facts: [
            {
              name: 'Priority',
              value: notification.priority,
            },
            {
              name: 'Created',
              value: notification.createdAt.toISOString(),
            },
          ],
          text: notification.message,
        },
      ],
    };

    await axios.post(config.notifications.teams.webhookUrl, payload);
  }

  /**
   * Send in-app notification
   */
  private async sendInAppChannel(notification: Notification): Promise<void> {
    if (!this.options.enableInApp) {
      throw new Error('In-app notifications are not enabled');
    }

    // Store in-app notification in database or cache
    // This would typically integrate with a real-time system like Socket.IO
    logger.info('In-app notification stored', {
      notificationId: notification.id,
      recipients: notification.recipients,
    });
  }

  /**
   * Send SMS notification
   */
  private async sendSMSChannel(notification: Notification): Promise<void> {
    // Implementation for SMS notifications
    // This would integrate with SMS providers like Twilio, AWS SNS, etc.
    throw new Error('SMS notifications not implemented');
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookChannel(notification: Notification): Promise<void> {
    // Implementation for webhook notifications
    const webhookUrl = notification.data?.webhookUrl;
    if (!webhookUrl) {
      throw new Error('Webhook URL not provided');
    }

    const payload = {
      notificationId: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      recipients: notification.recipients,
      data: notification.data,
      timestamp: notification.createdAt.toISOString(),
    };

    await axios.post(webhookUrl, payload, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Compliance-Orchestration-Service/1.0',
      },
    });
  }

  /**
   * Initialize email transporter
   */
  private async initializeEmailTransporter(): Promise<void> {
    if (!config.notifications.email.smtp.host) {
      logger.warn('Email SMTP configuration not found, email notifications will be disabled');
      return;
    }

    this.emailTransporter = nodemailer.createTransporter({
      host: config.notifications.email.smtp.host,
      port: config.notifications.email.smtp.port,
      secure: config.notifications.email.smtp.secure,
      auth: config.notifications.email.smtp.auth.user ? {
        user: config.notifications.email.smtp.auth.user,
        pass: config.notifications.email.smtp.auth.pass,
      } : undefined,
    });

    // Verify connection
    await this.emailTransporter.verify();
    logger.info('Email transporter initialized successfully');
  }

  /**
   * Load notification templates
   */
  private async loadNotificationTemplates(): Promise<void> {
    // Load templates from database or file system
    // For now, create some default templates
    const defaultTemplates: NotificationTemplate[] = [
      {
        id: 'workflow_started',
        name: 'Workflow Started',
        subject: 'Workflow Started: {{workflowName}}',
        content: '<h2>Workflow Started</h2><p>The workflow "{{workflowName}}" has been started.</p>',
        type: 'workflow',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'workflow_completed',
        name: 'Workflow Completed',
        subject: 'Workflow Completed: {{workflowName}}',
        content: '<h2>Workflow Completed</h2><p>The workflow "{{workflowName}}" has been completed successfully.</p>',
        type: 'workflow',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'task_assigned',
        name: 'Task Assigned',
        subject: 'New Task Assigned: {{taskName}}',
        content: '<h2>Task Assigned</h2><p>You have been assigned a new task: "{{taskName}}"</p><p>Due Date: {{dueDate}}</p>',
        type: 'task',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });

    logger.info('Notification templates loaded', { count: this.templates.size });
  }

  /**
   * Validate external service configurations
   */
  private async validateExternalServices(): Promise<void> {
    const validations: Promise<void>[] = [];

    // Validate Slack configuration
    if (this.options.enableSlack && config.notifications.slack.webhookUrl) {
      validations.push(this.validateSlackWebhook());
    }

    // Validate Teams configuration
    if (this.options.enableTeams && config.notifications.teams.webhookUrl) {
      validations.push(this.validateTeamsWebhook());
    }

    await Promise.allSettled(validations);
  }

  /**
   * Validate Slack webhook
   */
  private async validateSlackWebhook(): Promise<void> {
    try {
      await axios.post(config.notifications.slack.webhookUrl!, {
        text: 'Compliance Orchestration Service - Connection Test',
      });
      logger.info('Slack webhook validation successful');
    } catch (error) {
      logger.warn('Slack webhook validation failed', { error: (error as Error).message });
    }
  }

  /**
   * Validate Teams webhook
   */
  private async validateTeamsWebhook(): Promise<void> {
    try {
      await axios.post(config.notifications.teams.webhookUrl!, {
        text: 'Compliance Orchestration Service - Connection Test',
      });
      logger.info('Teams webhook validation successful');
    } catch (error) {
      logger.warn('Teams webhook validation failed', { error: (error as Error).message });
    }
  }

  /**
   * Render template with data
   */
  private renderTemplate(template: string, data: Record<string, any>): string {
    let rendered = template;
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    });
    return rendered;
  }

  /**
   * Get Slack color based on priority
   */
  private getSlackColor(priority: NotificationPriority): string {
    switch (priority) {
      case NotificationPriority.CRITICAL: return 'danger';
      case NotificationPriority.HIGH: return 'warning';
      case NotificationPriority.MEDIUM: return 'good';
      case NotificationPriority.LOW: return '#36a64f';
      default: return 'good';
    }
  }

  /**
   * Get Teams color based on priority
   */
  private getTeamsColor(priority: NotificationPriority): string {
    switch (priority) {
      case NotificationPriority.CRITICAL: return 'FF0000';
      case NotificationPriority.HIGH: return 'FF8C00';
      case NotificationPriority.MEDIUM: return '32CD32';
      case NotificationPriority.LOW: return '87CEEB';
      default: return '32CD32';
    }
  }

  /**
   * Generate unique notification ID
   */
  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get notification statistics
   */
  public getStats(): {
    total: number;
    pending: number;
    processing: number;
    sent: number;
    failed: number;
    cancelled: number;
  } {
    const notifications = Array.from(this.notifications.values());
    return {
      total: notifications.length,
      pending: notifications.filter(n => n.status === NotificationStatus.PENDING).length,
      processing: notifications.filter(n => n.status === NotificationStatus.PROCESSING).length,
      sent: notifications.filter(n => n.status === NotificationStatus.SENT).length,
      failed: notifications.filter(n => n.status === NotificationStatus.FAILED).length,
      cancelled: notifications.filter(n => n.status === NotificationStatus.CANCELLED).length,
    };
  }

  /**
   * Shutdown the notification service
   */
  public async shutdown(): Promise<void> {
    logger.info('Shutting down Notification Service...');

    // Close email transporter
    if (this.emailTransporter) {
      this.emailTransporter.close();
    }

    this.isInitialized = false;
    this.emit('shutdown');
    logger.info('Notification Service shutdown completed');
  }
}

export default NotificationService;
