/**
 * Webhook Integration Service
 * Integrates webhook system with banking connectors and other services
 */

import { EventEmitter } from 'events';
import { WebhookManager } from './WebhookManager';
import { GatewayService } from './GatewayService';
import { DataTransformationEngine } from './DataTransformationEngine';
import { logger } from '@utils/logger';
import {
  BANKING_EVENTS,
  COMPLIANCE_EVENTS,
  RISK_EVENTS,
  REGULATORY_EVENTS,
  SYSTEM_EVENTS,
  WEBHOOK_EVENTS,
  getEventCategory,
  getEventPriority,
  BaseEventData,
  BankingEventData,
  ComplianceEventData,
  RiskEventData,
  RegulatoryEventData,
  SystemEventData,
  WebhookEventData,
} from '../types/webhookEvents';

export interface WebhookIntegrationConfig {
  enableAutoEvents: boolean;
  eventBufferSize: number;
  eventBatchSize: number;
  eventFlushInterval: number;
  enableEventFiltering: boolean;
  enableEventTransformation: boolean;
  defaultTransformationRuleId?: string;
}

export interface EventFilter {
  id: string;
  name: string;
  eventTypes: string[];
  conditions: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';
    value: any;
  }>;
  isActive: boolean;
}

export class WebhookIntegrationService extends EventEmitter {
  private webhookManager: WebhookManager;
  private gatewayService: GatewayService;
  private transformationEngine: DataTransformationEngine;
  private config: WebhookIntegrationConfig;
  private eventBuffer: Array<{ event: any; timestamp: Date }> = [];
  private eventFilters: Map<string, EventFilter> = new Map();
  private flushInterval?: NodeJS.Timeout;
  private isInitialized = false;

  constructor(
    webhookManager: WebhookManager,
    gatewayService: GatewayService,
    transformationEngine: DataTransformationEngine,
    config: Partial<WebhookIntegrationConfig> = {}
  ) {
    super();
    this.webhookManager = webhookManager;
    this.gatewayService = gatewayService;
    this.transformationEngine = transformationEngine;
    this.config = {
      enableAutoEvents: true,
      eventBufferSize: 1000,
      eventBatchSize: 10,
      eventFlushInterval: 5000, // 5 seconds
      enableEventFiltering: true,
      enableEventTransformation: false,
      ...config,
    };
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Webhook Integration Service already initialized');
      return;
    }

    try {
      logger.info('Initializing Webhook Integration Service...');

      // Set up event listeners for banking connectors
      this.setupBankingEventListeners();

      // Set up event listeners for gateway service
      this.setupGatewayEventListeners();

      // Set up event listeners for webhook manager
      this.setupWebhookEventListeners();

      // Start event buffer flushing
      this.startEventFlushing();

      // Load event filters
      await this.loadEventFilters();

      this.isInitialized = true;
      logger.info('Webhook Integration Service initialized successfully');
      this.emit('initialized');

    } catch (error) {
      logger.error('Failed to initialize Webhook Integration Service', error);
      throw error;
    }
  }

  private setupBankingEventListeners(): void {
    // Listen to gateway service events for banking operations
    this.gatewayService.on('requestCompleted', (data) => {
      this.handleBankingEvent(data);
    });

    this.gatewayService.on('requestFailed', (data) => {
      this.handleBankingErrorEvent(data);
    });
  }

  private setupGatewayEventListeners(): void {
    this.gatewayService.on('initialized', () => {
      this.publishEvent({
        type: SYSTEM_EVENTS.INTEGRATION_CONNECTED,
        source: 'integration-gateway',
        data: {
          component: 'gateway-service',
          status: 'initialized',
          timestamp: new Date().toISOString(),
        },
      });
    });

    this.gatewayService.on('connectionFailed', (error) => {
      this.publishEvent({
        type: SYSTEM_EVENTS.INTEGRATION_ERROR,
        source: 'integration-gateway',
        data: {
          component: 'gateway-service',
          error: error.message,
          severity: 'error',
          timestamp: new Date().toISOString(),
        },
      });
    });
  }

  private setupWebhookEventListeners(): void {
    this.webhookManager.on('endpointCreated', (endpoint) => {
      this.publishEvent({
        type: WEBHOOK_EVENTS.WEBHOOK_ENDPOINT_CREATED,
        source: 'webhook-manager',
        data: {
          webhookId: endpoint.id,
          endpointUrl: endpoint.url,
          events: endpoint.events,
          timestamp: new Date().toISOString(),
        },
      });
    });

    this.webhookManager.on('deliverySuccess', (data) => {
      this.publishEvent({
        type: WEBHOOK_EVENTS.WEBHOOK_DELIVERY_SUCCESS,
        source: 'webhook-manager',
        data: {
          webhookId: data.delivery.webhookId,
          deliveryId: data.delivery.id,
          eventId: data.delivery.eventId,
          endpointUrl: data.delivery.url,
          responseStatus: data.delivery.responseStatus,
          responseTime: data.responseTime,
          timestamp: new Date().toISOString(),
        },
      });
    });

    this.webhookManager.on('deliveryFailed', (data) => {
      this.publishEvent({
        type: WEBHOOK_EVENTS.WEBHOOK_DELIVERY_FAILED,
        source: 'webhook-manager',
        data: {
          webhookId: data.delivery.webhookId,
          deliveryId: data.delivery.id,
          eventId: data.delivery.eventId,
          endpointUrl: data.delivery.url,
          error: data.delivery.error,
          attempt: data.delivery.attempt,
          maxAttempts: data.delivery.maxAttempts,
          timestamp: new Date().toISOString(),
        },
      });
    });
  }

  private async handleBankingEvent(data: any): Promise<void> {
    const { request, response } = data;
    
    try {
      // Determine event type based on operation and system
      const eventType = this.mapOperationToEventType(request.system, request.operation);
      if (!eventType) return;

      // Create event data
      const eventData: BankingEventData = {
        timestamp: new Date().toISOString(),
        source: `${request.system}-connector`,
        version: '1.0',
        correlationId: data.correlationId,
        ...this.extractBankingEventData(request, response),
      };

      await this.publishEvent({
        type: eventType,
        source: eventData.source,
        data: eventData,
      });

    } catch (error: any) {
      logger.error('Error handling banking event', {
        error: error.message,
        request,
        response,
      });
    }
  }

  private async handleBankingErrorEvent(data: any): Promise<void> {
    const { request, error } = data;
    
    try {
      // Map to appropriate error event type
      let eventType = SYSTEM_EVENTS.INTEGRATION_ERROR;
      
      if (request.operation.includes('transaction')) {
        eventType = BANKING_EVENTS.TRANSACTION_FAILED;
      } else if (request.operation.includes('customer')) {
        eventType = SYSTEM_EVENTS.DATA_VALIDATION_FAILED;
      }

      const eventData: SystemEventData = {
        timestamp: new Date().toISOString(),
        source: `${request.system}-connector`,
        version: '1.0',
        component: request.system,
        severity: 'error',
        errorCode: error.statusCode?.toString(),
        errorMessage: error.error,
      };

      await this.publishEvent({
        type: eventType,
        source: eventData.source,
        data: eventData,
      });

    } catch (publishError: any) {
      logger.error('Error handling banking error event', {
        error: publishError.message,
        originalError: error,
        request,
      });
    }
  }

  private mapOperationToEventType(system: string, operation: string): string | null {
    const operationMap: Record<string, Record<string, string>> = {
      temenos: {
        'createCustomer': BANKING_EVENTS.CUSTOMER_CREATED,
        'updateCustomer': BANKING_EVENTS.CUSTOMER_UPDATED,
        'createAccount': BANKING_EVENTS.ACCOUNT_CREATED,
        'updateAccount': BANKING_EVENTS.ACCOUNT_UPDATED,
        'executeTransaction': BANKING_EVENTS.TRANSACTION_CREATED,
      },
      finacle: {
        'createCustomer': BANKING_EVENTS.CUSTOMER_CREATED,
        'updateCustomer': BANKING_EVENTS.CUSTOMER_UPDATED,
        'createAccount': BANKING_EVENTS.ACCOUNT_CREATED,
        'updateAccountStatus': BANKING_EVENTS.ACCOUNT_STATUS_CHANGED,
        'executeTransaction': BANKING_EVENTS.TRANSACTION_CREATED,
        'updateKYCStatus': BANKING_EVENTS.CUSTOMER_KYC_UPDATED,
      },
      flexcube: {
        'CreateCustomer': BANKING_EVENTS.CUSTOMER_CREATED,
        'ModifyCustomer': BANKING_EVENTS.CUSTOMER_UPDATED,
        'CreateAccount': BANKING_EVENTS.ACCOUNT_CREATED,
        'ProcessTransaction': BANKING_EVENTS.TRANSACTION_CREATED,
      },
      rbi: {
        'submitComplianceReport': COMPLIANCE_EVENTS.REPORT_SUBMITTED,
        'getRegulatoryCirculars': REGULATORY_EVENTS.RBI_CIRCULAR_PUBLISHED,
      },
      cibil: {
        'getCreditReport': RISK_EVENTS.CREDIT_SCORE_UPDATED,
        'getCommercialCreditReport': RISK_EVENTS.CREDIT_SCORE_UPDATED,
      },
    };

    return operationMap[system]?.[operation] || null;
  }

  private extractBankingEventData(request: any, response: any): Partial<BankingEventData> {
    const data: Partial<BankingEventData> = {};

    // Extract common fields from request data
    if (request.data) {
      data.customerId = request.data.customerId || request.data.customerNo;
      data.accountId = request.data.accountId || request.data.accountNo || request.data.accountNumber;
      data.transactionId = request.data.transactionId;
      data.amount = request.data.amount;
      data.currency = request.data.currency;
      data.branchCode = request.data.branchCode;
    }

    // Extract additional fields from response data
    if (response.data) {
      data.customerId = data.customerId || response.data.customerId;
      data.accountId = data.accountId || response.data.accountId;
      data.transactionId = data.transactionId || response.data.transactionId;
    }

    return data;
  }

  public async publishEvent(event: {
    type: string;
    source: string;
    data: any;
    metadata?: Record<string, any>;
  }): Promise<string | null> {
    try {
      // Apply event filtering if enabled
      if (this.config.enableEventFiltering && !this.shouldPublishEvent(event)) {
        logger.debug('Event filtered out', { eventType: event.type, source: event.source });
        return null;
      }

      // Apply event transformation if enabled
      let transformedData = event.data;
      if (this.config.enableEventTransformation && this.config.defaultTransformationRuleId) {
        try {
          const transformationResult = await this.transformationEngine.transform({
            ruleId: this.config.defaultTransformationRuleId,
            sourceData: event.data,
          });

          if (transformationResult.success) {
            transformedData = transformationResult.transformedData;
          }
        } catch (transformationError: any) {
          logger.warn('Event transformation failed', {
            error: transformationError.message,
            eventType: event.type,
          });
        }
      }

      // Add metadata
      const enrichedEvent = {
        ...event,
        data: transformedData,
        metadata: {
          category: getEventCategory(event.type),
          priority: getEventPriority(event.type),
          publishedAt: new Date().toISOString(),
          ...event.metadata,
        },
      };

      // Buffer the event if auto-events are enabled
      if (this.config.enableAutoEvents) {
        this.eventBuffer.push({
          event: enrichedEvent,
          timestamp: new Date(),
        });

        // Flush immediately if buffer is full
        if (this.eventBuffer.length >= this.config.eventBufferSize) {
          await this.flushEventBuffer();
        }
      }

      // Publish immediately for high-priority events
      if (enrichedEvent.metadata.priority === 'high' || enrichedEvent.metadata.priority === 'critical') {
        return await this.webhookManager.publishEvent(enrichedEvent);
      }

      return null;

    } catch (error: any) {
      logger.error('Error publishing event', {
        error: error.message,
        eventType: event.type,
        source: event.source,
      });
      return null;
    }
  }

  private shouldPublishEvent(event: any): boolean {
    // Check against active event filters
    for (const filter of this.eventFilters.values()) {
      if (!filter.isActive) continue;

      // Check if event type matches filter
      if (!filter.eventTypes.includes(event.type)) continue;

      // Check filter conditions
      const conditionsMet = filter.conditions.every(condition => {
        const fieldValue = this.getNestedValue(event.data, condition.field);
        return this.evaluateCondition(fieldValue, condition.operator, condition.value);
      });

      if (conditionsMet) {
        return false; // Event should be filtered out
      }
    }

    return true; // Event should be published
  }

  private evaluateCondition(fieldValue: any, operator: string, conditionValue: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === conditionValue;
      case 'contains':
        return String(fieldValue).includes(String(conditionValue));
      case 'startsWith':
        return String(fieldValue).startsWith(String(conditionValue));
      case 'endsWith':
        return String(fieldValue).endsWith(String(conditionValue));
      case 'greaterThan':
        return parseFloat(fieldValue) > parseFloat(conditionValue);
      case 'lessThan':
        return parseFloat(fieldValue) < parseFloat(conditionValue);
      default:
        return false;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private startEventFlushing(): void {
    this.flushInterval = setInterval(async () => {
      if (this.eventBuffer.length > 0) {
        await this.flushEventBuffer();
      }
    }, this.config.eventFlushInterval);
  }

  private async flushEventBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    try {
      const eventsToFlush = this.eventBuffer.splice(0, this.config.eventBatchSize);
      
      logger.debug('Flushing event buffer', { eventCount: eventsToFlush.length });

      // Publish events in batch
      const publishPromises = eventsToFlush.map(({ event }) =>
        this.webhookManager.publishEvent(event)
      );

      await Promise.allSettled(publishPromises);

      this.emit('eventsBatchPublished', {
        count: eventsToFlush.length,
        timestamp: new Date().toISOString(),
      });

    } catch (error: any) {
      logger.error('Error flushing event buffer', error);
    }
  }

  // Event Filter Management
  public async addEventFilter(filter: Omit<EventFilter, 'id'>): Promise<string> {
    const filterId = `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newFilter: EventFilter = {
      ...filter,
      id: filterId,
    };

    this.eventFilters.set(filterId, newFilter);
    
    logger.info('Event filter added', { filterId, name: filter.name });
    return filterId;
  }

  public async updateEventFilter(filterId: string, updates: Partial<EventFilter>): Promise<void> {
    const filter = this.eventFilters.get(filterId);
    if (!filter) {
      throw new Error(`Event filter not found: ${filterId}`);
    }

    const updatedFilter = { ...filter, ...updates, id: filterId };
    this.eventFilters.set(filterId, updatedFilter);
    
    logger.info('Event filter updated', { filterId });
  }

  public async deleteEventFilter(filterId: string): Promise<void> {
    if (!this.eventFilters.has(filterId)) {
      throw new Error(`Event filter not found: ${filterId}`);
    }

    this.eventFilters.delete(filterId);
    logger.info('Event filter deleted', { filterId });
  }

  public getEventFilters(): EventFilter[] {
    return Array.from(this.eventFilters.values());
  }

  // Statistics
  public getStats(): {
    eventBufferSize: number;
    eventFiltersCount: number;
    eventsPublishedToday: number;
    averageEventProcessingTime: number;
  } {
    // This would typically query a database for historical data
    return {
      eventBufferSize: this.eventBuffer.length,
      eventFiltersCount: this.eventFilters.size,
      eventsPublishedToday: 0, // TODO: Implement actual counting
      averageEventProcessingTime: 0, // TODO: Implement actual measurement
    };
  }

  private async loadEventFilters(): Promise<void> {
    // TODO: Load event filters from database
    logger.debug('Loading event filters from database...');
  }

  public async shutdown(): Promise<void> {
    logger.info('Shutting down Webhook Integration Service...');

    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    // Flush remaining events
    await this.flushEventBuffer();

    this.eventFilters.clear();
    this.eventBuffer = [];

    this.emit('shutdown');
    logger.info('Webhook Integration Service shutdown completed');
  }
}

export default WebhookIntegrationService;
