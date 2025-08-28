/**
 * Webhook Controller
 * HTTP endpoints for webhook management
 */

import { Request, Response } from 'express';
import { WebhookManager, WebhookEndpoint } from '../services/WebhookManager';
import { logger } from '@utils/logger';

export class WebhookController {
  private webhookManager: WebhookManager;

  constructor(webhookManager: WebhookManager) {
    this.webhookManager = webhookManager;
  }

  // Endpoint Management
  public createEndpoint = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        name,
        url,
        secret,
        events,
        headers,
        timeout = 30000,
        retryPolicy = {
          maxAttempts: 3,
          backoffMultiplier: 2,
          initialDelay: 1000,
          maxDelay: 60000,
        },
        signatureHeader = 'X-Webhook-Signature',
        signatureAlgorithm = 'sha256',
      } = req.body;

      // Validation
      if (!name || !url || !secret || !events || !Array.isArray(events)) {
        res.status(400).json({
          error: 'Missing required fields: name, url, secret, events',
        });
        return;
      }

      if (events.length === 0) {
        res.status(400).json({
          error: 'At least one event type must be specified',
        });
        return;
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        res.status(400).json({
          error: 'Invalid URL format',
        });
        return;
      }

      const endpointId = await this.webhookManager.createEndpoint({
        name,
        url,
        secret,
        events,
        isActive: true,
        headers,
        timeout,
        retryPolicy,
        signatureHeader,
        signatureAlgorithm,
      });

      logger.info('Webhook endpoint created via API', {
        endpointId,
        name,
        url,
        events,
      });

      res.status(201).json({
        id: endpointId,
        message: 'Webhook endpoint created successfully',
      });
    } catch (error: any) {
      logger.error('Error creating webhook endpoint', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  };

  public getEndpoints = async (req: Request, res: Response): Promise<void> => {
    try {
      const endpoints = this.webhookManager.getAllEndpoints();
      
      res.json({
        endpoints: endpoints.map(endpoint => ({
          ...endpoint,
          secret: '***', // Hide secret in response
        })),
        total: endpoints.length,
      });
    } catch (error: any) {
      logger.error('Error fetching webhook endpoints', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  };

  public getEndpoint = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const endpoint = this.webhookManager.getEndpoint(id);

      if (!endpoint) {
        res.status(404).json({
          error: 'Webhook endpoint not found',
        });
        return;
      }

      res.json({
        ...endpoint,
        secret: '***', // Hide secret in response
      });
    } catch (error: any) {
      logger.error('Error fetching webhook endpoint', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  };

  public updateEndpoint = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Remove fields that shouldn't be updated via API
      delete updates.id;
      delete updates.createdAt;
      delete updates.failureCount;
      delete updates.successCount;

      await this.webhookManager.updateEndpoint(id, updates);

      logger.info('Webhook endpoint updated via API', {
        endpointId: id,
        updates,
      });

      res.json({
        message: 'Webhook endpoint updated successfully',
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({
          error: 'Webhook endpoint not found',
        });
      } else {
        logger.error('Error updating webhook endpoint', error);
        res.status(500).json({
          error: 'Internal server error',
          message: error.message,
        });
      }
    }
  };

  public deleteEndpoint = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      await this.webhookManager.deleteEndpoint(id);

      logger.info('Webhook endpoint deleted via API', {
        endpointId: id,
      });

      res.json({
        message: 'Webhook endpoint deleted successfully',
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({
          error: 'Webhook endpoint not found',
        });
      } else {
        logger.error('Error deleting webhook endpoint', error);
        res.status(500).json({
          error: 'Internal server error',
          message: error.message,
        });
      }
    }
  };

  // Event Publishing
  public publishEvent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { type, source, data, metadata } = req.body;

      if (!type || !source || !data) {
        res.status(400).json({
          error: 'Missing required fields: type, source, data',
        });
        return;
      }

      const eventId = await this.webhookManager.publishEvent({
        type,
        source,
        data,
        metadata,
      });

      logger.info('Event published via API', {
        eventId,
        type,
        source,
      });

      res.status(201).json({
        eventId,
        message: 'Event published successfully',
      });
    } catch (error: any) {
      logger.error('Error publishing event', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  };

  // Delivery Management
  public getDeliveries = async (req: Request, res: Response): Promise<void> => {
    try {
      const { webhookId, eventId, status, limit = 100 } = req.query;

      let deliveries;

      if (webhookId) {
        deliveries = this.webhookManager.getDeliveriesForEndpoint(
          webhookId as string,
          parseInt(limit as string)
        );
      } else if (eventId) {
        deliveries = this.webhookManager.getDeliveriesForEvent(eventId as string);
      } else if (status === 'pending') {
        deliveries = this.webhookManager.getPendingDeliveries();
      } else {
        // Get all deliveries (limited)
        deliveries = Array.from(this.webhookManager['deliveries'].values())
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, parseInt(limit as string));
      }

      res.json({
        deliveries,
        total: deliveries.length,
      });
    } catch (error: any) {
      logger.error('Error fetching deliveries', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  };

  public getDelivery = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const delivery = this.webhookManager.getDelivery(id);

      if (!delivery) {
        res.status(404).json({
          error: 'Delivery not found',
        });
        return;
      }

      res.json(delivery);
    } catch (error: any) {
      logger.error('Error fetching delivery', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  };

  // Testing
  public testEndpoint = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await this.webhookManager.testEndpoint(id);

      logger.info('Webhook endpoint tested via API', {
        endpointId: id,
        success: result.success,
        responseTime: result.responseTime,
      });

      res.json(result);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({
          error: 'Webhook endpoint not found',
        });
      } else {
        logger.error('Error testing webhook endpoint', error);
        res.status(500).json({
          error: 'Internal server error',
          message: error.message,
        });
      }
    }
  };

  // Statistics
  public getStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = this.webhookManager.getStats();
      res.json(stats);
    } catch (error: any) {
      logger.error('Error fetching webhook stats', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  };

  public getEndpointStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const stats = this.webhookManager.getEndpointStats(id);

      if (!stats) {
        res.status(404).json({
          error: 'Webhook endpoint not found',
        });
        return;
      }

      res.json({
        ...stats,
        endpoint: {
          ...stats.endpoint,
          secret: '***', // Hide secret in response
        },
      });
    } catch (error: any) {
      logger.error('Error fetching endpoint stats', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  };

  // Signature Validation Utility
  public validateSignature = async (req: Request, res: Response): Promise<void> => {
    try {
      const { payload, signature, secret, algorithm = 'sha256' } = req.body;

      if (!payload || !signature || !secret) {
        res.status(400).json({
          error: 'Missing required fields: payload, signature, secret',
        });
        return;
      }

      const isValid = this.webhookManager.validateSignature(
        payload,
        signature,
        secret,
        algorithm
      );

      res.json({
        valid: isValid,
      });
    } catch (error: any) {
      logger.error('Error validating signature', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  };
}

export default WebhookController;
