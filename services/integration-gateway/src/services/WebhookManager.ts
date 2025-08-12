/**
 * Webhook Management System
 * Handles secure webhook delivery with signature validation, retry mechanisms, and monitoring
 */

import { logger } from '@utils/logger';
import axios, { AxiosRequestConfig } from 'axios';
import crypto from 'crypto';
import { EventEmitter } from 'events';

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  headers?: Record<string, string>;
  timeout: number;
  retryPolicy: {
    maxAttempts: number;
    backoffMultiplier: number;
    initialDelay: number;
    maxDelay: number;
  };
  signatureHeader: string;
  signatureAlgorithm: 'sha256' | 'sha1' | 'md5';
  createdAt: Date;
  updatedAt: Date;
  lastDeliveryAt?: Date;
  lastSuccessAt?: Date;
  failureCount: number;
  successCount: number;
}

export interface WebhookEvent {
  id: string;
  type: string;
  source: string;
  timestamp: Date;
  data: any;
  metadata?: Record<string, any>;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventId: string;
  url: string;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  attempt: number;
  maxAttempts: number;
  requestHeaders: Record<string, string>;
  requestBody: string;
  responseStatus?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  error?: string;
  deliveredAt?: Date;
  nextRetryAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookStats {
  totalEndpoints: number;
  activeEndpoints: number;
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  pendingDeliveries: number;
  averageResponseTime: number;
  successRate: number;
}

export class WebhookManager extends EventEmitter {
  private endpoints: Map<string, WebhookEndpoint> = new Map();
  private deliveries: Map<string, WebhookDelivery> = new Map();
  private retryQueue: WebhookDelivery[] = [];
  private isProcessing = false;
  private processingInterval?: NodeJS.Timeout;
  private maxConcurrentDeliveries = 10;
  private activeDeliveries = 0;

  constructor() {
    super();
    this.startRetryProcessor();
  }

  // Webhook Endpoint Management
  public async createEndpoint(endpoint: Omit<WebhookEndpoint, 'id' | 'createdAt' | 'updatedAt' | 'failureCount' | 'successCount'>): Promise<string> {
    const id = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newEndpoint: WebhookEndpoint = {
      ...endpoint,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      failureCount: 0,
      successCount: 0,
    };

    this.endpoints.set(id, newEndpoint);

    logger.info('Webhook endpoint created', {
      id,
      name: endpoint.name,
      url: endpoint.url,
      events: endpoint.events
    });

    this.emit('endpointCreated', newEndpoint);
    return id;
  }

  public async updateEndpoint(id: string, updates: Partial<WebhookEndpoint>): Promise<void> {
    const endpoint = this.endpoints.get(id);
    if (!endpoint) {
      throw new Error(`Webhook endpoint not found: ${id}`);
    }

    const updatedEndpoint: WebhookEndpoint = {
      ...endpoint,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    this.endpoints.set(id, updatedEndpoint);

    logger.info('Webhook endpoint updated', { id, updates });
    this.emit('endpointUpdated', updatedEndpoint);
  }

  public async deleteEndpoint(id: string): Promise<void> {
    const endpoint = this.endpoints.get(id);
    if (!endpoint) {
      throw new Error(`Webhook endpoint not found: ${id}`);
    }

    this.endpoints.delete(id);

    // Cancel pending deliveries for this endpoint
    this.retryQueue = this.retryQueue.filter(delivery => delivery.webhookId !== id);

    logger.info('Webhook endpoint deleted', { id });
    this.emit('endpointDeleted', id);
  }

  public getEndpoint(id: string): WebhookEndpoint | undefined {
    return this.endpoints.get(id);
  }

  public getAllEndpoints(): WebhookEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  public getEndpointsByEvent(eventType: string): WebhookEndpoint[] {
    return Array.from(this.endpoints.values())
      .filter(endpoint => endpoint.isActive && endpoint.events.includes(eventType));
  }

  // Event Publishing
  public async publishEvent(event: Omit<WebhookEvent, 'id' | 'timestamp'>): Promise<string> {
    const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const webhookEvent: WebhookEvent = {
      ...event,
      id: eventId,
      timestamp: new Date(),
    };

    logger.info('Publishing webhook event', {
      eventId,
      type: event.type,
      source: event.source
    });

    // Find all endpoints that should receive this event
    const targetEndpoints = this.getEndpointsByEvent(event.type);

    if (targetEndpoints.length === 0) {
      logger.debug('No active endpoints found for event type', { eventType: event.type });
      return eventId;
    }

    // Create deliveries for each target endpoint
    const deliveries = await Promise.all(
      targetEndpoints.map(endpoint => this.createDelivery(endpoint, webhookEvent))
    );

    logger.info('Webhook deliveries created', {
      eventId,
      deliveryCount: deliveries.length,
      endpoints: targetEndpoints.map(e => e.name)
    });

    this.emit('eventPublished', {
      event: webhookEvent,
      deliveries: deliveries.length,
    });

    return eventId;
  }

  // Delivery Management
  private async createDelivery(endpoint: WebhookEndpoint, event: WebhookEvent): Promise<string> {
    const deliveryId = `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const payload = {
      id: event.id,
      type: event.type,
      source: event.source,
      timestamp: event.timestamp.toISOString(),
      data: event.data,
      metadata: event.metadata,
    };

    const requestBody = JSON.stringify(payload);
    const signature = this.generateSignature(requestBody, endpoint.secret, endpoint.signatureAlgorithm);

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'RBI-Compliance-Platform-Webhook/1.0',
      'X-Webhook-Event-Type': event.type,
      'X-Webhook-Event-Id': event.id,
      'X-Webhook-Delivery-Id': deliveryId,
      'X-Webhook-Timestamp': event.timestamp.toISOString(),
      [endpoint.signatureHeader]: signature,
      ...endpoint.headers,
    };

    const delivery: WebhookDelivery = {
      id: deliveryId,
      webhookId: endpoint.id,
      eventId: event.id,
      url: endpoint.url,
      status: 'pending',
      attempt: 0,
      maxAttempts: endpoint.retryPolicy.maxAttempts,
      requestHeaders,
      requestBody,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.deliveries.set(deliveryId, delivery);
    this.retryQueue.push(delivery);

    return deliveryId;
  }

  private generateSignature(payload: string, secret: string, algorithm: string): string {
    const hmac = crypto.createHmac(algorithm, secret);
    hmac.update(payload);
    return `${algorithm}=${hmac.digest('hex')}`;
  }

  // Retry Processing
  private startRetryProcessor(): void {
    this.processingInterval = setInterval(() => {
      if (!this.isProcessing && this.retryQueue.length > 0 && this.activeDeliveries < this.maxConcurrentDeliveries) {
        this.processRetryQueue();
      }
    }, 1000); // Check every second
  }

  private async processRetryQueue(): Promise<void> {
    if (this.isProcessing || this.activeDeliveries >= this.maxConcurrentDeliveries) {
      return;
    }

    this.isProcessing = true;

    try {
      const now = new Date();
      const readyDeliveries = this.retryQueue.filter(delivery =>
        delivery.status === 'pending' ||
        (delivery.status === 'retrying' && delivery.nextRetryAt && delivery.nextRetryAt <= now)
      );

      const deliveriesToProcess = readyDeliveries.slice(0, this.maxConcurrentDeliveries - this.activeDeliveries);

      if (deliveriesToProcess.length > 0) {
        await Promise.all(
          deliveriesToProcess.map(delivery => this.executeDelivery(delivery))
        );
      }
    } catch (error) {
      logger.error('Error processing retry queue', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async executeDelivery(delivery: WebhookDelivery): Promise<void> {
    this.activeDeliveries++;

    try {
      const endpoint = this.endpoints.get(delivery.webhookId);
      if (!endpoint) {
        logger.warn('Endpoint not found for delivery', { deliveryId: delivery.id, webhookId: delivery.webhookId });
        this.removeFromRetryQueue(delivery.id);
        return;
      }

      if (!endpoint.isActive) {
        logger.debug('Skipping delivery for inactive endpoint', { deliveryId: delivery.id, webhookId: delivery.webhookId });
        this.removeFromRetryQueue(delivery.id);
        return;
      }

      delivery.attempt++;
      delivery.status = delivery.attempt > 1 ? 'retrying' : 'pending';
      delivery.updatedAt = new Date();

      logger.info('Executing webhook delivery', {
        deliveryId: delivery.id,
        webhookId: delivery.webhookId,
        url: delivery.url,
        attempt: delivery.attempt,
        maxAttempts: delivery.maxAttempts,
      });

      const startTime = Date.now();

      const config: AxiosRequestConfig = {
        method: 'POST',
        url: delivery.url,
        headers: delivery.requestHeaders,
        data: delivery.requestBody,
        timeout: endpoint.timeout,
        validateStatus: () => true, // Don't throw on non-2xx status codes
      };

      const response = await axios(config);
      const responseTime = Date.now() - startTime;

      delivery.responseStatus = response.status;
      delivery.responseHeaders = response.headers as Record<string, string>;
      delivery.responseBody = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      delivery.deliveredAt = new Date();
      delivery.updatedAt = new Date();

      if (response.status >= 200 && response.status < 300) {
        // Success
        delivery.status = 'success';
        endpoint.successCount++;
        endpoint.lastSuccessAt = new Date();
        endpoint.lastDeliveryAt = new Date();

        this.removeFromRetryQueue(delivery.id);

        logger.info('Webhook delivery successful', {
          deliveryId: delivery.id,
          webhookId: delivery.webhookId,
          status: response.status,
          responseTime,
        });

        this.emit('deliverySuccess', {
          delivery,
          endpoint,
          responseTime,
        });
      } else {
        // HTTP error
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error: any) {
      await this.handleDeliveryFailure(delivery, error);
    } finally {
      this.activeDeliveries--;
    }
  }

  private async handleDeliveryFailure(delivery: WebhookDelivery, error: any): Promise<void> {
    const endpoint = this.endpoints.get(delivery.webhookId)!;

    delivery.error = error.message;
    delivery.updatedAt = new Date();
    endpoint.failureCount++;
    endpoint.lastDeliveryAt = new Date();

    logger.warn('Webhook delivery failed', {
      deliveryId: delivery.id,
      webhookId: delivery.webhookId,
      attempt: delivery.attempt,
      maxAttempts: delivery.maxAttempts,
      error: error.message,
    });

    if (delivery.attempt >= delivery.maxAttempts) {
      // Max attempts reached, mark as failed
      delivery.status = 'failed';
      this.removeFromRetryQueue(delivery.id);

      logger.error('Webhook delivery permanently failed', {
        deliveryId: delivery.id,
        webhookId: delivery.webhookId,
        attempts: delivery.attempt,
      });

      this.emit('deliveryFailed', {
        delivery,
        endpoint,
        error,
      });
    } else {
      // Schedule retry
      delivery.status = 'retrying';
      const delay = this.calculateRetryDelay(delivery.attempt, endpoint.retryPolicy);
      delivery.nextRetryAt = new Date(Date.now() + delay);

      logger.info('Webhook delivery scheduled for retry', {
        deliveryId: delivery.id,
        webhookId: delivery.webhookId,
        nextRetryAt: delivery.nextRetryAt,
        delay,
      });

      this.emit('deliveryRetry', {
        delivery,
        endpoint,
        nextRetryAt: delivery.nextRetryAt,
      });
    }

    this.deliveries.set(delivery.id, delivery);
    this.endpoints.set(endpoint.id, endpoint);
  }

  private calculateRetryDelay(attempt: number, retryPolicy: WebhookEndpoint['retryPolicy']): number {
    const delay = retryPolicy.initialDelay * Math.pow(retryPolicy.backoffMultiplier, attempt - 1);
    return Math.min(delay, retryPolicy.maxDelay);
  }

  private removeFromRetryQueue(deliveryId: string): void {
    this.retryQueue = this.retryQueue.filter(delivery => delivery.id !== deliveryId);
  }

  // Delivery Queries
  public getDelivery(id: string): WebhookDelivery | undefined {
    return this.deliveries.get(id);
  }

  public getDeliveriesForEndpoint(webhookId: string, limit = 100): WebhookDelivery[] {
    return Array.from(this.deliveries.values())
      .filter(delivery => delivery.webhookId === webhookId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  public getDeliveriesForEvent(eventId: string): WebhookDelivery[] {
    return Array.from(this.deliveries.values())
      .filter(delivery => delivery.eventId === eventId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public getPendingDeliveries(): WebhookDelivery[] {
    return Array.from(this.deliveries.values())
      .filter(delivery => delivery.status === 'pending' || delivery.status === 'retrying');
  }

  // Statistics
  public getStats(): WebhookStats {
    const endpoints = Array.from(this.endpoints.values());
    const deliveries = Array.from(this.deliveries.values());

    const totalEndpoints = endpoints.length;
    const activeEndpoints = endpoints.filter(e => e.isActive).length;
    const totalDeliveries = deliveries.length;
    const successfulDeliveries = deliveries.filter(d => d.status === 'success').length;
    const failedDeliveries = deliveries.filter(d => d.status === 'failed').length;
    const pendingDeliveries = deliveries.filter(d => d.status === 'pending' || d.status === 'retrying').length;

    // Calculate average response time for successful deliveries
    const successfulWithTiming = deliveries.filter(d =>
      d.status === 'success' && d.deliveredAt && d.createdAt
    );
    const averageResponseTime = successfulWithTiming.length > 0
      ? successfulWithTiming.reduce((sum, d) =>
          sum + (d.deliveredAt!.getTime() - d.createdAt.getTime()), 0
        ) / successfulWithTiming.length
      : 0;

    const successRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;

    return {
      totalEndpoints,
      activeEndpoints,
      totalDeliveries,
      successfulDeliveries,
      failedDeliveries,
      pendingDeliveries,
      averageResponseTime,
      successRate,
    };
  }

  public getEndpointStats(webhookId: string): {
    endpoint: WebhookEndpoint;
    deliveries: {
      total: number;
      successful: number;
      failed: number;
      pending: number;
    };
    recentDeliveries: WebhookDelivery[];
  } | null {
    const endpoint = this.endpoints.get(webhookId);
    if (!endpoint) {
      return null;
    }

    const endpointDeliveries = this.getDeliveriesForEndpoint(webhookId);
    const recentDeliveries = endpointDeliveries.slice(0, 10);

    return {
      endpoint,
      deliveries: {
        total: endpointDeliveries.length,
        successful: endpointDeliveries.filter(d => d.status === 'success').length,
        failed: endpointDeliveries.filter(d => d.status === 'failed').length,
        pending: endpointDeliveries.filter(d => d.status === 'pending' || d.status === 'retrying').length,
      },
      recentDeliveries,
    };
  }

  // Webhook Testing
  public async testEndpoint(webhookId: string): Promise<{
    success: boolean;
    responseTime: number;
    status?: number;
    error?: string;
  }> {
    const endpoint = this.endpoints.get(webhookId);
    if (!endpoint) {
      throw new Error(`Webhook endpoint not found: ${webhookId}`);
    }

    const testEvent: WebhookEvent = {
      id: `test_${Date.now()}`,
      type: 'webhook.test',
      source: 'webhook-manager',
      timestamp: new Date(),
      data: {
        message: 'This is a test webhook delivery',
        timestamp: new Date().toISOString(),
      },
    };

    const payload = JSON.stringify({
      id: testEvent.id,
      type: testEvent.type,
      source: testEvent.source,
      timestamp: testEvent.timestamp.toISOString(),
      data: testEvent.data,
    });

    const signature = this.generateSignature(payload, endpoint.secret, endpoint.signatureAlgorithm);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'RBI-Compliance-Platform-Webhook/1.0',
      'X-Webhook-Event-Type': testEvent.type,
      'X-Webhook-Event-Id': testEvent.id,
      'X-Webhook-Test': 'true',
      'X-Webhook-Timestamp': testEvent.timestamp.toISOString(),
      [endpoint.signatureHeader]: signature,
      ...endpoint.headers,
    };

    const startTime = Date.now();

    try {
      const response = await axios({
        method: 'POST',
        url: endpoint.url,
        headers,
        data: payload,
        timeout: endpoint.timeout,
        validateStatus: () => true,
      });

      const responseTime = Date.now() - startTime;

      logger.info('Webhook test completed', {
        webhookId,
        url: endpoint.url,
        status: response.status,
        responseTime,
      });

      return {
        success: response.status >= 200 && response.status < 300,
        responseTime,
        status: response.status,
      };

    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      logger.warn('Webhook test failed', {
        webhookId,
        url: endpoint.url,
        error: error.message,
        responseTime,
      });

      return {
        success: false,
        responseTime,
        error: error.message,
      };
    }
  }

  // Signature Validation (for incoming webhooks)
  public validateSignature(
    payload: string,
    signature: string,
    secret: string,
    algorithm: 'sha256' | 'sha1' | 'md5' = 'sha256'
  ): boolean {
    const expectedSignature = this.generateSignature(payload, secret, algorithm);

    // Use crypto.timingSafeEqual to prevent timing attacks
    const expectedBuffer = Buffer.from(expectedSignature);
    const actualBuffer = Buffer.from(signature);

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  }

  // Cleanup and Maintenance
  public async cleanupOldDeliveries(olderThanDays = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [id, delivery] of this.deliveries.entries()) {
      if (delivery.createdAt < cutoffDate && delivery.status !== 'pending' && delivery.status !== 'retrying') {
        this.deliveries.delete(id);
        cleanedCount++;
      }
    }

    logger.info('Cleaned up old webhook deliveries', {
      cleanedCount,
      olderThanDays,
      remainingDeliveries: this.deliveries.size
    });

    return cleanedCount;
  }

  public async shutdown(): Promise<void> {
    logger.info('Shutting down Webhook Manager...');

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    // Wait for active deliveries to complete
    while (this.activeDeliveries > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.endpoints.clear();
    this.deliveries.clear();
    this.retryQueue = [];

    this.emit('shutdown');
    logger.info('Webhook Manager shutdown completed');
  }
}

export default WebhookManager;
