/**
 * Notification Service
 * Real-time notification system for regulatory changes and compliance alerts
 */

import { logger, loggers } from '@utils/logger';
import { config } from '@config/index';

export interface NotificationRequest {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  recipients: NotificationRecipient[];
  data?: any;
  channels: NotificationChannel[];
  scheduledAt?: Date;
  expiresAt?: Date;
  metadata?: NotificationMetadata;
}

export interface NotificationRecipient {
  id: string;
  type: 'user' | 'role' | 'organization' | 'group';
  identifier: string; // user ID, role name, organization ID, etc.
  preferences?: NotificationPreferences;
}

export interface NotificationPreferences {
  channels: NotificationChannel[];
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quietHours?: {
    start: string; // HH:mm format
    end: string;
  };
  categories: string[];
}

export interface NotificationMetadata {
  source: string;
  circularId?: string;
  organizationId?: string;
  workflowId?: string;
  tags: string[];
  correlationId?: string;
}

export type NotificationType = 
  | 'regulatory_change'
  | 'compliance_deadline'
  | 'risk_alert'
  | 'workflow_update'
  | 'system_alert'
  | 'audit_notification'
  | 'approval_request'
  | 'document_update';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical' | 'urgent';

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app' | 'webhook' | 'slack' | 'teams';

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  channels: NotificationChannel[];
  subject: string;
  bodyTemplate: string;
  variables: string[];
  isActive: boolean;
}

export interface NotificationResult {
  id: string;
  status: 'sent' | 'failed' | 'pending' | 'scheduled';
  sentAt?: Date;
  deliveredAt?: Date;
  failureReason?: string;
  channelResults: ChannelResult[];
}

export interface ChannelResult {
  channel: NotificationChannel;
  status: 'sent' | 'failed' | 'pending';
  sentAt?: Date;
  deliveredAt?: Date;
  failureReason?: string;
  externalId?: string;
}

export interface NotificationStats {
  totalSent: number;
  totalFailed: number;
  totalPending: number;
  byChannel: Record<NotificationChannel, number>;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
  deliveryRate: number;
  averageDeliveryTime: number;
}

export class NotificationService {
  private templates: Map<string, NotificationTemplate> = new Map();
  private pendingNotifications: Map<string, NotificationRequest> = new Map();
  private notificationHistory: Map<string, NotificationResult> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
    logger.info('Notification Service initialized');
  }

  /**
   * Send notification to recipients
   */
  public async sendNotification(request: NotificationRequest): Promise<NotificationResult> {
    const startTime = Date.now();

    try {
      loggers.business('notification_send_started', {
        notificationId: request.id,
        type: request.type,
        priority: request.priority,
        recipientCount: request.recipients.length,
        channels: request.channels,
      });

      // Validate notification request
      this.validateNotificationRequest(request);

      // Check if notification should be scheduled
      if (request.scheduledAt && request.scheduledAt > new Date()) {
        return this.scheduleNotification(request);
      }

      // Process recipients and apply preferences
      const processedRecipients = await this.processRecipients(request.recipients);

      // Send to each channel
      const channelResults: ChannelResult[] = [];
      
      for (const channel of request.channels) {
        try {
          const result = await this.sendToChannel(request, processedRecipients, channel);
          channelResults.push(result);
        } catch (error) {
          channelResults.push({
            channel,
            status: 'failed',
            failureReason: (error as Error).message,
          });
        }
      }

      // Determine overall status
      const overallStatus = this.determineOverallStatus(channelResults);

      const result: NotificationResult = {
        id: request.id,
        status: overallStatus,
        sentAt: new Date(),
        channelResults,
      };

      // Store result
      this.notificationHistory.set(request.id, result);

      const processingTime = Date.now() - startTime;

      loggers.business('notification_send_completed', {
        notificationId: request.id,
        status: overallStatus,
        channelCount: channelResults.length,
        successfulChannels: channelResults.filter(r => r.status === 'sent').length,
        processingTime: `${processingTime}ms`,
      });

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      loggers.business('notification_send_failed', {
        notificationId: request.id,
        processingTime: `${processingTime}ms`,
        error: (error as Error).message,
      }, error as Error);

      throw error;
    }
  }

  /**
   * Send regulatory change notification
   */
  public async sendRegulatoryChangeNotification(
    circularId: string,
    circularTitle: string,
    impactLevel: string,
    affectedOrganizations: string[],
    summary: string
  ): Promise<NotificationResult> {
    const notification: NotificationRequest = {
      id: `reg_change_${circularId}_${Date.now()}`,
      type: 'regulatory_change',
      priority: this.mapImpactToPriority(impactLevel),
      title: `New RBI Circular: ${circularTitle}`,
      message: `A new RBI circular has been published with ${impactLevel} impact. ${summary}`,
      recipients: affectedOrganizations.map(orgId => ({
        id: orgId,
        type: 'organization',
        identifier: orgId,
      })),
      channels: ['email', 'in_app', 'push'],
      data: {
        circularId,
        circularTitle,
        impactLevel,
        summary,
        actionRequired: impactLevel === 'high' || impactLevel === 'critical',
      },
      metadata: {
        source: 'regulatory-intelligence-service',
        circularId,
        tags: ['regulatory', 'circular', 'rbi', impactLevel],
      },
    };

    return this.sendNotification(notification);
  }

  /**
   * Send compliance deadline notification
   */
  public async sendComplianceDeadlineNotification(
    organizationId: string,
    requirementTitle: string,
    deadline: Date,
    daysRemaining: number
  ): Promise<NotificationResult> {
    const urgency = daysRemaining <= 7 ? 'urgent' : daysRemaining <= 30 ? 'high' : 'medium';
    
    const notification: NotificationRequest = {
      id: `deadline_${organizationId}_${Date.now()}`,
      type: 'compliance_deadline',
      priority: urgency,
      title: `Compliance Deadline Approaching: ${requirementTitle}`,
      message: `You have ${daysRemaining} days remaining to complete: ${requirementTitle}. Deadline: ${deadline.toLocaleDateString()}`,
      recipients: [{
        id: organizationId,
        type: 'organization',
        identifier: organizationId,
      }],
      channels: urgency === 'urgent' ? ['email', 'sms', 'in_app', 'push'] : ['email', 'in_app'],
      data: {
        requirementTitle,
        deadline: deadline.toISOString(),
        daysRemaining,
        urgency,
      },
      metadata: {
        source: 'compliance-orchestration-service',
        organizationId,
        tags: ['compliance', 'deadline', urgency],
      },
    };

    return this.sendNotification(notification);
  }

  /**
   * Send risk alert notification
   */
  public async sendRiskAlertNotification(
    organizationId: string,
    riskType: string,
    riskLevel: string,
    description: string,
    recommendations: string[]
  ): Promise<NotificationResult> {
    const notification: NotificationRequest = {
      id: `risk_alert_${organizationId}_${Date.now()}`,
      type: 'risk_alert',
      priority: riskLevel === 'critical' ? 'critical' : riskLevel === 'high' ? 'high' : 'medium',
      title: `${riskLevel.toUpperCase()} Risk Alert: ${riskType}`,
      message: `${description}\n\nRecommended Actions:\n${recommendations.map(r => `• ${r}`).join('\n')}`,
      recipients: [{
        id: organizationId,
        type: 'organization',
        identifier: organizationId,
      }],
      channels: riskLevel === 'critical' ? ['email', 'sms', 'in_app', 'push'] : ['email', 'in_app'],
      data: {
        riskType,
        riskLevel,
        description,
        recommendations,
      },
      metadata: {
        source: 'risk-assessment-service',
        organizationId,
        tags: ['risk', 'alert', riskLevel, riskType],
      },
    };

    return this.sendNotification(notification);
  }

  /**
   * Schedule notification for later delivery
   */
  private async scheduleNotification(request: NotificationRequest): Promise<NotificationResult> {
    this.pendingNotifications.set(request.id, request);

    logger.info('Notification scheduled', {
      notificationId: request.id,
      scheduledAt: request.scheduledAt?.toISOString(),
    });

    return {
      id: request.id,
      status: 'scheduled',
      channelResults: [],
    };
  }

  /**
   * Process recipients and apply preferences
   */
  private async processRecipients(recipients: NotificationRecipient[]): Promise<NotificationRecipient[]> {
    // TODO: In production, fetch user preferences from database
    // For now, return recipients as-is
    return recipients;
  }

  /**
   * Send notification to specific channel
   */
  private async sendToChannel(
    request: NotificationRequest,
    recipients: NotificationRecipient[],
    channel: NotificationChannel
  ): Promise<ChannelResult> {
    const startTime = Date.now();

    try {
      switch (channel) {
        case 'email':
          return await this.sendEmail(request, recipients);
        case 'sms':
          return await this.sendSMS(request, recipients);
        case 'push':
          return await this.sendPushNotification(request, recipients);
        case 'in_app':
          return await this.sendInAppNotification(request, recipients);
        case 'webhook':
          return await this.sendWebhook(request, recipients);
        case 'slack':
          return await this.sendSlackNotification(request, recipients);
        case 'teams':
          return await this.sendTeamsNotification(request, recipients);
        default:
          throw new Error(`Unsupported notification channel: ${channel}`);
      }
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.error(`Failed to send notification via ${channel}`, {
        notificationId: request.id,
        channel,
        processingTime: `${processingTime}ms`,
        error: (error as Error).message,
      });

      return {
        channel,
        status: 'failed',
        failureReason: (error as Error).message,
      };
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(request: NotificationRequest, recipients: NotificationRecipient[]): Promise<ChannelResult> {
    // TODO: Implement actual email sending (e.g., using SendGrid, AWS SES)
    logger.info('Sending email notification', {
      notificationId: request.id,
      recipientCount: recipients.length,
      subject: request.title,
    });

    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      channel: 'email',
      status: 'sent',
      sentAt: new Date(),
      externalId: `email_${Date.now()}`,
    };
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(request: NotificationRequest, recipients: NotificationRecipient[]): Promise<ChannelResult> {
    // TODO: Implement actual SMS sending (e.g., using Twilio, AWS SNS)
    logger.info('Sending SMS notification', {
      notificationId: request.id,
      recipientCount: recipients.length,
    });

    // Simulate SMS sending
    await new Promise(resolve => setTimeout(resolve, 50));

    return {
      channel: 'sms',
      status: 'sent',
      sentAt: new Date(),
      externalId: `sms_${Date.now()}`,
    };
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(request: NotificationRequest, recipients: NotificationRecipient[]): Promise<ChannelResult> {
    // TODO: Implement actual push notification (e.g., using Firebase Cloud Messaging)
    logger.info('Sending push notification', {
      notificationId: request.id,
      recipientCount: recipients.length,
    });

    // Simulate push notification
    await new Promise(resolve => setTimeout(resolve, 30));

    return {
      channel: 'push',
      status: 'sent',
      sentAt: new Date(),
      externalId: `push_${Date.now()}`,
    };
  }

  /**
   * Send in-app notification
   */
  private async sendInAppNotification(request: NotificationRequest, recipients: NotificationRecipient[]): Promise<ChannelResult> {
    // TODO: Store in database for in-app display
    logger.info('Sending in-app notification', {
      notificationId: request.id,
      recipientCount: recipients.length,
    });

    return {
      channel: 'in_app',
      status: 'sent',
      sentAt: new Date(),
    };
  }

  /**
   * Send webhook notification
   */
  private async sendWebhook(request: NotificationRequest, recipients: NotificationRecipient[]): Promise<ChannelResult> {
    // TODO: Implement webhook sending
    logger.info('Sending webhook notification', {
      notificationId: request.id,
      recipientCount: recipients.length,
    });

    return {
      channel: 'webhook',
      status: 'sent',
      sentAt: new Date(),
    };
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(request: NotificationRequest, recipients: NotificationRecipient[]): Promise<ChannelResult> {
    // TODO: Implement Slack integration
    logger.info('Sending Slack notification', {
      notificationId: request.id,
      recipientCount: recipients.length,
    });

    return {
      channel: 'slack',
      status: 'sent',
      sentAt: new Date(),
    };
  }

  /**
   * Send Teams notification
   */
  private async sendTeamsNotification(request: NotificationRequest, recipients: NotificationRecipient[]): Promise<ChannelResult> {
    // TODO: Implement Teams integration
    logger.info('Sending Teams notification', {
      notificationId: request.id,
      recipientCount: recipients.length,
    });

    return {
      channel: 'teams',
      status: 'sent',
      sentAt: new Date(),
    };
  }

  // Helper methods
  private validateNotificationRequest(request: NotificationRequest): void {
    if (!request.id || !request.type || !request.title || !request.message) {
      throw new Error('Missing required notification fields');
    }

    if (!request.recipients || request.recipients.length === 0) {
      throw new Error('At least one recipient is required');
    }

    if (!request.channels || request.channels.length === 0) {
      throw new Error('At least one notification channel is required');
    }
  }

  private mapImpactToPriority(impactLevel: string): NotificationPriority {
    switch (impactLevel.toLowerCase()) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  }

  private determineOverallStatus(channelResults: ChannelResult[]): 'sent' | 'failed' | 'pending' {
    const sentCount = channelResults.filter(r => r.status === 'sent').length;
    const failedCount = channelResults.filter(r => r.status === 'failed').length;

    if (sentCount > 0) return 'sent';
    if (failedCount === channelResults.length) return 'failed';
    return 'pending';
  }

  private initializeDefaultTemplates(): void {
    // TODO: Load templates from database or configuration
    const defaultTemplates: NotificationTemplate[] = [
      {
        id: 'regulatory_change_template',
        name: 'Regulatory Change Notification',
        type: 'regulatory_change',
        channels: ['email', 'in_app'],
        subject: 'New RBI Circular: {{circularTitle}}',
        bodyTemplate: 'A new RBI circular has been published: {{circularTitle}}. Impact Level: {{impactLevel}}. Summary: {{summary}}',
        variables: ['circularTitle', 'impactLevel', 'summary'],
        isActive: true,
      },
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * Get notification statistics
   */
  public getNotificationStats(): NotificationStats {
    const results = Array.from(this.notificationHistory.values());
    
    const totalSent = results.filter(r => r.status === 'sent').length;
    const totalFailed = results.filter(r => r.status === 'failed').length;
    const totalPending = results.filter(r => r.status === 'pending').length;

    // Calculate delivery rate
    const deliveryRate = totalSent + totalFailed > 0 ? totalSent / (totalSent + totalFailed) : 0;

    // TODO: Calculate more detailed statistics
    return {
      totalSent,
      totalFailed,
      totalPending,
      byChannel: {} as Record<NotificationChannel, number>,
      byType: {} as Record<NotificationType, number>,
      byPriority: {} as Record<NotificationPriority, number>,
      deliveryRate,
      averageDeliveryTime: 0,
    };
  }

  /**
   * Get notification result by ID
   */
  public getNotificationResult(notificationId: string): NotificationResult | undefined {
    return this.notificationHistory.get(notificationId);
  }

  /**
   * Process scheduled notifications
   */
  public async processScheduledNotifications(): Promise<void> {
    const now = new Date();
    const readyNotifications = Array.from(this.pendingNotifications.values())
      .filter(notification =>
        notification.scheduledAt && notification.scheduledAt <= now
      );

    for (const notification of readyNotifications) {
      try {
        await this.sendNotification(notification);
        this.pendingNotifications.delete(notification.id);
      } catch (error) {
        logger.error('Failed to process scheduled notification', {
          notificationId: notification.id,
          error: (error as Error).message,
        });
      }
    }
  }

  /**
   * Clear notification history
   */
  public clearHistory(): void {
    this.notificationHistory.clear();
    logger.info('Notification history cleared');
  }
}

export default NotificationService;
