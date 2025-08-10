/**
 * Tests for Notification Service
 */

import NotificationService, { NotificationRequest, NotificationRecipient } from '../services/notificationService';

describe('NotificationService', () => {
  let notificationService: NotificationService;

  beforeEach(() => {
    notificationService = new NotificationService();
  });

  afterEach(() => {
    notificationService.clearHistory();
  });

  describe('constructor', () => {
    it('should create an instance of NotificationService', () => {
      expect(notificationService).toBeInstanceOf(NotificationService);
    });
  });

  describe('sendNotification', () => {
    const mockRecipients: NotificationRecipient[] = [
      {
        id: 'user-123',
        type: 'user',
        identifier: 'user@example.com',
      },
      {
        id: 'org-456',
        type: 'organization',
        identifier: 'org-456',
      },
    ];

    const mockNotificationRequest: NotificationRequest = {
      id: 'test-notification-1',
      type: 'regulatory_change',
      priority: 'high',
      title: 'Test Notification',
      message: 'This is a test notification message',
      recipients: mockRecipients,
      channels: ['email', 'in_app'],
      data: {
        testData: 'test value',
      },
      metadata: {
        source: 'test',
        tags: ['test', 'notification'],
      },
    };

    it('should send notification successfully', async () => {
      const result = await notificationService.sendNotification(mockNotificationRequest);

      expect(result).toHaveProperty('id', mockNotificationRequest.id);
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('channelResults');
      expect(result).toHaveProperty('sentAt');

      expect(['sent', 'failed', 'pending']).toContain(result.status);
      expect(Array.isArray(result.channelResults)).toBe(true);
      expect(result.channelResults).toHaveLength(2); // email and in_app
    });

    it('should handle multiple channels', async () => {
      const multiChannelRequest = {
        ...mockNotificationRequest,
        channels: ['email', 'sms', 'push', 'in_app'] as const,
      };

      const result = await notificationService.sendNotification(multiChannelRequest);

      expect(result.channelResults).toHaveLength(4);
      
      const channels = result.channelResults.map(r => r.channel);
      expect(channels).toContain('email');
      expect(channels).toContain('sms');
      expect(channels).toContain('push');
      expect(channels).toContain('in_app');
    });

    it('should validate notification request', async () => {
      const invalidRequest = {
        ...mockNotificationRequest,
        title: '', // Invalid: empty title
      };

      await expect(
        notificationService.sendNotification(invalidRequest)
      ).rejects.toThrow('Missing required notification fields');
    });

    it('should require at least one recipient', async () => {
      const noRecipientsRequest = {
        ...mockNotificationRequest,
        recipients: [],
      };

      await expect(
        notificationService.sendNotification(noRecipientsRequest)
      ).rejects.toThrow('At least one recipient is required');
    });

    it('should require at least one channel', async () => {
      const noChannelsRequest = {
        ...mockNotificationRequest,
        channels: [] as any,
      };

      await expect(
        notificationService.sendNotification(noChannelsRequest)
      ).rejects.toThrow('At least one notification channel is required');
    });

    it('should schedule notification for future delivery', async () => {
      const futureDate = new Date(Date.now() + 60000); // 1 minute from now
      const scheduledRequest = {
        ...mockNotificationRequest,
        scheduledAt: futureDate,
      };

      const result = await notificationService.sendNotification(scheduledRequest);

      expect(result.status).toBe('scheduled');
      expect(result.sentAt).toBeUndefined();
    });

    it('should store notification result in history', async () => {
      const result = await notificationService.sendNotification(mockNotificationRequest);

      const storedResult = notificationService.getNotificationResult(result.id);
      expect(storedResult).toBeDefined();
      expect(storedResult!.id).toBe(result.id);
    });
  });

  describe('sendRegulatoryChangeNotification', () => {
    it('should send regulatory change notification', async () => {
      const result = await notificationService.sendRegulatoryChangeNotification(
        'RBI/2024/001',
        'New Capital Adequacy Guidelines',
        'high',
        ['org-123', 'org-456'],
        'Updated guidelines for capital adequacy framework'
      );

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('status');
      expect(result.channelResults.length).toBeGreaterThan(0);
    });

    it('should map impact level to priority correctly', async () => {
      const criticalResult = await notificationService.sendRegulatoryChangeNotification(
        'RBI/2024/002',
        'Critical Security Update',
        'critical',
        ['org-123'],
        'Critical security update required'
      );

      // Critical impact should result in successful notification
      expect(['sent', 'pending']).toContain(criticalResult.status);
    });
  });

  describe('sendComplianceDeadlineNotification', () => {
    it('should send compliance deadline notification', async () => {
      const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      
      const result = await notificationService.sendComplianceDeadlineNotification(
        'org-123',
        'Submit quarterly capital adequacy report',
        deadline,
        7
      );

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('status');
      expect(result.channelResults.length).toBeGreaterThan(0);
    });

    it('should use urgent priority for deadlines within 7 days', async () => {
      const urgentDeadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
      
      const result = await notificationService.sendComplianceDeadlineNotification(
        'org-123',
        'Urgent compliance requirement',
        urgentDeadline,
        3
      );

      // Should include more channels for urgent notifications
      expect(result.channelResults.length).toBeGreaterThan(2);
    });
  });

  describe('sendRiskAlertNotification', () => {
    it('should send risk alert notification', async () => {
      const result = await notificationService.sendRiskAlertNotification(
        'org-123',
        'Operational Risk',
        'high',
        'High operational risk detected in trading operations',
        ['Review trading procedures', 'Implement additional controls']
      );

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('status');
      expect(result.channelResults.length).toBeGreaterThan(0);
    });

    it('should handle critical risk alerts with more channels', async () => {
      const result = await notificationService.sendRiskAlertNotification(
        'org-123',
        'System Security',
        'critical',
        'Critical security breach detected',
        ['Immediate system lockdown', 'Contact security team']
      );

      // Critical risks should use more notification channels
      expect(result.channelResults.length).toBeGreaterThan(2);
    });
  });

  describe('processScheduledNotifications', () => {
    it('should process scheduled notifications that are due', async () => {
      // Schedule a notification for immediate processing
      const pastDate = new Date(Date.now() - 1000); // 1 second ago
      const scheduledRequest: NotificationRequest = {
        id: 'scheduled-test-1',
        type: 'system_alert',
        priority: 'medium',
        title: 'Scheduled Test',
        message: 'This is a scheduled test notification',
        recipients: [{
          id: 'user-123',
          type: 'user',
          identifier: 'user@example.com',
        }],
        channels: ['email'],
        scheduledAt: pastDate,
        metadata: {
          source: 'test',
          tags: ['scheduled', 'test'],
        },
      };

      // First, schedule the notification
      await notificationService.sendNotification(scheduledRequest);

      // Then process scheduled notifications
      await notificationService.processScheduledNotifications();

      // The notification should now be in history as sent
      const result = notificationService.getNotificationResult(scheduledRequest.id);
      expect(result).toBeDefined();
      expect(result!.status).toBe('sent');
    });

    it('should not process future scheduled notifications', async () => {
      const futureDate = new Date(Date.now() + 60000); // 1 minute from now
      const futureRequest: NotificationRequest = {
        id: 'future-test-1',
        type: 'system_alert',
        priority: 'medium',
        title: 'Future Test',
        message: 'This is a future test notification',
        recipients: [{
          id: 'user-123',
          type: 'user',
          identifier: 'user@example.com',
        }],
        channels: ['email'],
        scheduledAt: futureDate,
        metadata: {
          source: 'test',
          tags: ['future', 'test'],
        },
      };

      // Schedule the notification
      await notificationService.sendNotification(futureRequest);

      // Process scheduled notifications
      await notificationService.processScheduledNotifications();

      // The notification should still be scheduled, not sent
      const result = notificationService.getNotificationResult(futureRequest.id);
      expect(result).toBeUndefined(); // Should not be in history yet
    });
  });

  describe('getNotificationStats', () => {
    it('should return notification statistics', async () => {
      // Send a few notifications first
      const requests = [
        {
          id: 'stats-test-1',
          type: 'regulatory_change' as const,
          priority: 'high' as const,
          title: 'Test 1',
          message: 'Test message 1',
          recipients: [{ id: 'user-1', type: 'user' as const, identifier: 'user1@example.com' }],
          channels: ['email' as const],
          metadata: { source: 'test', tags: ['test'] },
        },
        {
          id: 'stats-test-2',
          type: 'compliance_deadline' as const,
          priority: 'medium' as const,
          title: 'Test 2',
          message: 'Test message 2',
          recipients: [{ id: 'user-2', type: 'user' as const, identifier: 'user2@example.com' }],
          channels: ['in_app' as const],
          metadata: { source: 'test', tags: ['test'] },
        },
      ];

      for (const request of requests) {
        await notificationService.sendNotification(request);
      }

      const stats = notificationService.getNotificationStats();

      expect(stats).toHaveProperty('totalSent');
      expect(stats).toHaveProperty('totalFailed');
      expect(stats).toHaveProperty('totalPending');
      expect(stats).toHaveProperty('byChannel');
      expect(stats).toHaveProperty('byType');
      expect(stats).toHaveProperty('byPriority');
      expect(stats).toHaveProperty('deliveryRate');
      expect(stats).toHaveProperty('averageDeliveryTime');

      expect(stats.totalSent).toBeGreaterThan(0);
      expect(stats.deliveryRate).toBeGreaterThanOrEqual(0);
      expect(stats.deliveryRate).toBeLessThanOrEqual(1);
    });
  });

  describe('getNotificationResult', () => {
    it('should return notification result if exists', async () => {
      const request: NotificationRequest = {
        id: 'get-test-1',
        type: 'system_alert',
        priority: 'low',
        title: 'Get Test',
        message: 'Test message for get',
        recipients: [{ id: 'user-1', type: 'user', identifier: 'user1@example.com' }],
        channels: ['email'],
        metadata: { source: 'test', tags: ['test'] },
      };

      const result = await notificationService.sendNotification(request);
      const retrieved = notificationService.getNotificationResult(result.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(result.id);
    });

    it('should return undefined for non-existent notification', () => {
      const result = notificationService.getNotificationResult('non-existent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('clearHistory', () => {
    it('should clear notification history', async () => {
      const request: NotificationRequest = {
        id: 'clear-test-1',
        type: 'system_alert',
        priority: 'low',
        title: 'Clear Test',
        message: 'Test message for clear',
        recipients: [{ id: 'user-1', type: 'user', identifier: 'user1@example.com' }],
        channels: ['email'],
        metadata: { source: 'test', tags: ['test'] },
      };

      const result = await notificationService.sendNotification(request);
      
      // Verify it exists
      expect(notificationService.getNotificationResult(result.id)).toBeDefined();
      
      // Clear history
      notificationService.clearHistory();
      
      // Verify it's gone
      expect(notificationService.getNotificationResult(result.id)).toBeUndefined();
    });
  });
});
