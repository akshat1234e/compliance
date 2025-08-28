/**
 * Notification routes for Regulatory Intelligence Service
 */

import { Router } from 'express';
import { validateSchema } from '@middleware/validation';
import { requirePermission } from '@middleware/auth';
import { businessOperationLogger } from '@middleware/requestLogger';
import NotificationController from '@controllers/notificationController';
import Joi from 'joi';

const router = Router();
const notificationController = new NotificationController();

// Validation schemas
const sendNotificationSchema = Joi.object({
  type: Joi.string().valid(
    'regulatory_change',
    'compliance_deadline',
    'risk_alert',
    'workflow_update',
    'system_alert',
    'audit_notification',
    'approval_request',
    'document_update'
  ).required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical', 'urgent').default('medium'),
  title: Joi.string().required().max(200),
  message: Joi.string().required().max(2000),
  recipients: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      type: Joi.string().valid('user', 'role', 'organization', 'group').required(),
      identifier: Joi.string().required(),
      preferences: Joi.object({
        channels: Joi.array().items(
          Joi.string().valid('email', 'sms', 'push', 'in_app', 'webhook', 'slack', 'teams')
        ).optional(),
        frequency: Joi.string().valid('immediate', 'hourly', 'daily', 'weekly').optional(),
        quietHours: Joi.object({
          start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
          end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        }).optional(),
        categories: Joi.array().items(Joi.string()).optional(),
      }).optional(),
    })
  ).min(1).required(),
  channels: Joi.array().items(
    Joi.string().valid('email', 'sms', 'push', 'in_app', 'webhook', 'slack', 'teams')
  ).min(1).default(['email', 'in_app']),
  scheduledAt: Joi.date().iso().optional(),
  expiresAt: Joi.date().iso().optional(),
  data: Joi.object().optional(),
  metadata: Joi.object({
    source: Joi.string().optional(),
    circularId: Joi.string().optional(),
    organizationId: Joi.string().optional(),
    workflowId: Joi.string().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    correlationId: Joi.string().optional(),
  }).optional(),
});

const regulatoryChangeSchema = Joi.object({
  circularId: Joi.string().required(),
  circularTitle: Joi.string().required().max(500),
  impactLevel: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
  affectedOrganizations: Joi.array().items(Joi.string()).min(1).required(),
  summary: Joi.string().required().max(1000),
});

const complianceDeadlineSchema = Joi.object({
  organizationId: Joi.string().uuid().required(),
  requirementTitle: Joi.string().required().max(200),
  deadline: Joi.date().iso().required(),
  daysRemaining: Joi.number().integer().min(0).optional(),
});

const riskAlertSchema = Joi.object({
  organizationId: Joi.string().uuid().required(),
  riskType: Joi.string().required().max(100),
  riskLevel: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
  description: Joi.string().required().max(1000),
  recommendations: Joi.array().items(Joi.string().max(200)).optional(),
});

// Send custom notification
router.post('/send',
  validateSchema(sendNotificationSchema),
  requirePermission(['notifications:send', 'admin']),
  businessOperationLogger('send_notification'),
  notificationController.sendNotification
);

// Send regulatory change notification
router.post('/regulatory-change',
  validateSchema(regulatoryChangeSchema),
  requirePermission(['notifications:send', 'admin', 'regulatory:notify']),
  businessOperationLogger('send_regulatory_change_notification'),
  notificationController.sendRegulatoryChange
);

// Send compliance deadline notification
router.post('/compliance-deadline',
  validateSchema(complianceDeadlineSchema),
  requirePermission(['notifications:send', 'admin', 'compliance:notify']),
  businessOperationLogger('send_compliance_deadline_notification'),
  notificationController.sendComplianceDeadline
);

// Send risk alert notification
router.post('/risk-alert',
  validateSchema(riskAlertSchema),
  requirePermission(['notifications:send', 'admin', 'risk:notify']),
  businessOperationLogger('send_risk_alert_notification'),
  notificationController.sendRiskAlert
);

// Get notification result by ID
router.get('/result/:notificationId',
  requirePermission(['notifications:read', 'admin']),
  businessOperationLogger('get_notification_result'),
  notificationController.getNotificationResult
);

// Get notification statistics
router.get('/stats',
  requirePermission(['notifications:read', 'admin']),
  businessOperationLogger('get_notification_stats'),
  notificationController.getNotificationStats
);

// Process scheduled notifications (admin/system only)
router.post('/process-scheduled',
  requirePermission(['admin', 'system']),
  businessOperationLogger('process_scheduled_notifications'),
  notificationController.processScheduled
);

// Clear notification history (admin only)
router.post('/clear-history',
  requirePermission(['admin']),
  businessOperationLogger('clear_notification_history'),
  notificationController.clearHistory
);

export default router;
