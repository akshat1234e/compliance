/**
 * Notification Controller for Regulatory Intelligence Service
 * Handles HTTP requests for notification operations
 */

import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { logger, loggers } from '@utils/logger';
import NotificationService, { NotificationRequest, NotificationRecipient } from '@services/notificationService';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Send custom notification
   */
  public sendNotification = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const {
      type,
      priority = 'medium',
      title,
      message,
      recipients,
      channels = ['email', 'in_app'],
      scheduledAt,
      expiresAt,
      data,
      metadata
    } = req.body;

    if (!type || !title || !message || !recipients || !Array.isArray(recipients)) {
      return res.status(400).json({
        success: false,
        error: 'type, title, message, and recipients array are required',
        timestamp: new Date().toISOString(),
      });
    }

    logger.info('Custom notification send requested', {
      type,
      priority,
      recipientCount: recipients.length,
      channels,
      userId: req.user?.id,
      requestId: req.requestId,
    });

    try {
      const notificationRequest: NotificationRequest = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        priority,
        title,
        message,
        recipients,
        channels,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        data,
        metadata: {
          source: 'manual',
          tags: ['custom', 'manual'],
          ...metadata,
        },
      };

      const result = await this.notificationService.sendNotification(notificationRequest);

      const duration = Date.now() - startTime;

      loggers.business('send_custom_notification', {
        requestId: req.requestId,
        userId: req.user?.id,
        notificationId: result.id,
        type,
        priority,
        status: result.status,
        duration: `${duration}ms`,
        success: true,
      });

      res.json({
        success: true,
        data: result,
        metadata: {
          processingDuration: `${duration}ms`,
          requestId: req.requestId,
          sentBy: req.user?.email,
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      
      loggers.business('send_custom_notification', {
        requestId: req.requestId,
        userId: req.user?.id,
        type,
        duration: `${duration}ms`,
        success: false,
        error: (error as Error).message,
      }, error as Error);

      throw error;
    }
  });

  /**
   * Send regulatory change notification
   */
  public sendRegulatoryChange = asyncHandler(async (req: Request, res: Response) => {
    const {
      circularId,
      circularTitle,
      impactLevel,
      affectedOrganizations,
      summary
    } = req.body;

    if (!circularId || !circularTitle || !impactLevel || !affectedOrganizations || !summary) {
      return res.status(400).json({
        success: false,
        error: 'circularId, circularTitle, impactLevel, affectedOrganizations, and summary are required',
        timestamp: new Date().toISOString(),
      });
    }

    logger.info('Regulatory change notification requested', {
      circularId,
      impactLevel,
      affectedOrganizationCount: affectedOrganizations.length,
      userId: req.user?.id,
      requestId: req.requestId,
    });

    try {
      const result = await this.notificationService.sendRegulatoryChangeNotification(
        circularId,
        circularTitle,
        impactLevel,
        affectedOrganizations,
        summary
      );

      loggers.business('send_regulatory_change_notification', {
        requestId: req.requestId,
        userId: req.user?.id,
        circularId,
        impactLevel,
        notificationId: result.id,
        status: result.status,
        success: true,
      });

      res.json({
        success: true,
        data: result,
        message: 'Regulatory change notification sent successfully',
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      loggers.business('send_regulatory_change_notification', {
        requestId: req.requestId,
        userId: req.user?.id,
        circularId,
        success: false,
        error: (error as Error).message,
      }, error as Error);

      throw error;
    }
  });

  /**
   * Send compliance deadline notification
   */
  public sendComplianceDeadline = asyncHandler(async (req: Request, res: Response) => {
    const {
      organizationId,
      requirementTitle,
      deadline,
      daysRemaining
    } = req.body;

    if (!organizationId || !requirementTitle || !deadline) {
      return res.status(400).json({
        success: false,
        error: 'organizationId, requirementTitle, and deadline are required',
        timestamp: new Date().toISOString(),
      });
    }

    logger.info('Compliance deadline notification requested', {
      organizationId,
      requirementTitle,
      deadline,
      daysRemaining,
      userId: req.user?.id,
      requestId: req.requestId,
    });

    try {
      const deadlineDate = new Date(deadline);
      const calculatedDaysRemaining = daysRemaining || 
        Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      const result = await this.notificationService.sendComplianceDeadlineNotification(
        organizationId,
        requirementTitle,
        deadlineDate,
        calculatedDaysRemaining
      );

      loggers.business('send_compliance_deadline_notification', {
        requestId: req.requestId,
        userId: req.user?.id,
        organizationId,
        requirementTitle,
        daysRemaining: calculatedDaysRemaining,
        notificationId: result.id,
        status: result.status,
        success: true,
      });

      res.json({
        success: true,
        data: result,
        message: 'Compliance deadline notification sent successfully',
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      loggers.business('send_compliance_deadline_notification', {
        requestId: req.requestId,
        userId: req.user?.id,
        organizationId,
        success: false,
        error: (error as Error).message,
      }, error as Error);

      throw error;
    }
  });

  /**
   * Send risk alert notification
   */
  public sendRiskAlert = asyncHandler(async (req: Request, res: Response) => {
    const {
      organizationId,
      riskType,
      riskLevel,
      description,
      recommendations = []
    } = req.body;

    if (!organizationId || !riskType || !riskLevel || !description) {
      return res.status(400).json({
        success: false,
        error: 'organizationId, riskType, riskLevel, and description are required',
        timestamp: new Date().toISOString(),
      });
    }

    logger.info('Risk alert notification requested', {
      organizationId,
      riskType,
      riskLevel,
      userId: req.user?.id,
      requestId: req.requestId,
    });

    try {
      const result = await this.notificationService.sendRiskAlertNotification(
        organizationId,
        riskType,
        riskLevel,
        description,
        recommendations
      );

      loggers.business('send_risk_alert_notification', {
        requestId: req.requestId,
        userId: req.user?.id,
        organizationId,
        riskType,
        riskLevel,
        notificationId: result.id,
        status: result.status,
        success: true,
      });

      res.json({
        success: true,
        data: result,
        message: 'Risk alert notification sent successfully',
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      loggers.business('send_risk_alert_notification', {
        requestId: req.requestId,
        userId: req.user?.id,
        organizationId,
        riskType,
        riskLevel,
        success: false,
        error: (error as Error).message,
      }, error as Error);

      throw error;
    }
  });

  /**
   * Get notification result by ID
   */
  public getNotificationResult = asyncHandler(async (req: Request, res: Response) => {
    const { notificationId } = req.params;

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        error: 'notificationId is required',
        timestamp: new Date().toISOString(),
      });
    }

    logger.info('Notification result requested', {
      notificationId,
      userId: req.user?.id,
      requestId: req.requestId,
    });

    try {
      const result = this.notificationService.getNotificationResult(notificationId);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Notification not found',
          timestamp: new Date().toISOString(),
        });
      }

      loggers.business('get_notification_result', {
        requestId: req.requestId,
        userId: req.user?.id,
        notificationId,
        success: true,
      });

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      loggers.business('get_notification_result', {
        requestId: req.requestId,
        userId: req.user?.id,
        notificationId,
        success: false,
        error: (error as Error).message,
      }, error as Error);

      throw error;
    }
  });

  /**
   * Get notification statistics
   */
  public getNotificationStats = asyncHandler(async (req: Request, res: Response) => {
    logger.info('Notification statistics requested', {
      userId: req.user?.id,
      requestId: req.requestId,
    });

    try {
      const stats = this.notificationService.getNotificationStats();

      loggers.business('get_notification_stats', {
        requestId: req.requestId,
        userId: req.user?.id,
        success: true,
      });

      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      loggers.business('get_notification_stats', {
        requestId: req.requestId,
        userId: req.user?.id,
        success: false,
        error: (error as Error).message,
      }, error as Error);

      throw error;
    }
  });

  /**
   * Process scheduled notifications
   */
  public processScheduled = asyncHandler(async (req: Request, res: Response) => {
    logger.info('Scheduled notification processing requested', {
      userId: req.user?.id,
      requestId: req.requestId,
    });

    try {
      await this.notificationService.processScheduledNotifications();

      loggers.business('process_scheduled_notifications', {
        requestId: req.requestId,
        userId: req.user?.id,
        success: true,
      });

      res.json({
        success: true,
        message: 'Scheduled notifications processed successfully',
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      loggers.business('process_scheduled_notifications', {
        requestId: req.requestId,
        userId: req.user?.id,
        success: false,
        error: (error as Error).message,
      }, error as Error);

      throw error;
    }
  });

  /**
   * Clear notification history
   */
  public clearHistory = asyncHandler(async (req: Request, res: Response) => {
    logger.info('Notification history clear requested', {
      userId: req.user?.id,
      requestId: req.requestId,
    });

    try {
      this.notificationService.clearHistory();

      loggers.business('clear_notification_history', {
        requestId: req.requestId,
        userId: req.user?.id,
        success: true,
      });

      res.json({
        success: true,
        message: 'Notification history cleared successfully',
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      loggers.business('clear_notification_history', {
        requestId: req.requestId,
        userId: req.user?.id,
        success: false,
        error: (error as Error).message,
      }, error as Error);

      throw error;
    }
  });
}

export default NotificationController;
