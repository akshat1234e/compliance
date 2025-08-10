/**
 * Integration Engine
 * Core integration orchestration and management engine
 */

import { EventEmitter } from 'events';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { logger } from '@utils/logger';
import { config } from '@config/index';
import {
  Integration,
  IntegrationRequest,
  IntegrationResponse,
  IntegrationStatus,
  IntegrationType,
  ConnectionConfig,
} from '@types/integration';

export class IntegrationEngine extends EventEmitter {
  private isInitialized = false;
  private activeIntegrations: Map<string, Integration> = new Map();
  private httpClients: Map<string, AxiosInstance> = new Map();

  constructor() {
    super();
  }

  /**
   * Initialize the integration engine
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Integration engine already initialized');
      return;
    }

    try {
      logger.info('Initializing Integration Engine...');

      // Initialize HTTP clients for different systems
      await this.initializeHttpClients();

      // Load active integrations
      await this.loadActiveIntegrations();

      this.isInitialized = true;
      logger.info('Integration Engine initialized successfully');
      this.emit('initialized');
    } catch (error) {
      logger.error('Failed to initialize Integration Engine', error);
      throw error;
    }
  }

  /**
   * Execute integration request
   */
  public async executeIntegration(request: IntegrationRequest): Promise<IntegrationResponse> {
    const integrationId = this.generateIntegrationId();
    const startTime = Date.now();

    try {
      logger.info('Executing integration', {
        integrationId,
        type: request.type,
        system: request.system,
        operation: request.operation,
      });

      // Create integration instance
      const integration: Integration = {
        id: integrationId,
        type: request.type,
        system: request.system,
        operation: request.operation,
        status: IntegrationStatus.PROCESSING,
        startedAt: new Date(),
        requestData: request.data,
        metadata: request.metadata || {},
      };

      this.activeIntegrations.set(integrationId, integration);
      this.emit('integrationStarted', integration);

      // Execute based on integration type
      let response: any;
      switch (request.type) {
        case IntegrationType.BANKING_CORE:
          response = await this.executeBankingCoreIntegration(request);
          break;
        case IntegrationType.REGULATORY:
          response = await this.executeRegulatoryIntegration(request);
          break;
        case IntegrationType.THIRD_PARTY:
          response = await this.executeThirdPartyIntegration(request);
          break;
        case IntegrationType.INTERNAL:
          response = await this.executeInternalIntegration(request);
          break;
        default:
          throw new Error(`Unsupported integration type: ${request.type}`);
      }

      // Update integration status
      integration.status = IntegrationStatus.COMPLETED;
      integration.completedAt = new Date();
      integration.responseData = response;
      integration.processingTime = Date.now() - startTime;

      const integrationResponse: IntegrationResponse = {
        integrationId,
        status: IntegrationStatus.COMPLETED,
        data: response,
        processingTime: integration.processingTime,
        timestamp: new Date(),
      };

      logger.info('Integration completed', {
        integrationId,
        processingTime: integration.processingTime,
        status: integration.status,
      });

      this.emit('integrationCompleted', integration);
      return integrationResponse;
    } catch (error) {
      const integration = this.activeIntegrations.get(integrationId);
      if (integration) {
        integration.status = IntegrationStatus.FAILED;
        integration.completedAt = new Date();
        integration.error = (error as Error).message;
        integration.processingTime = Date.now() - startTime;
      }

      logger.error('Integration failed', {
        integrationId,
        error: (error as Error).message,
      });

      this.emit('integrationFailed', integration, error);
      throw error;
    }
  }

  /**
   * Execute banking core integration
   */
  private async executeBankingCoreIntegration(request: IntegrationRequest): Promise<any> {
    const { system, operation, data } = request;

    switch (system) {
      case 'temenos':
        return this.executeTemenosIntegration(operation, data);
      case 'finacle':
        return this.executeFinacleIntegration(operation, data);
      case 'flexcube':
        return this.executeFlexcubeIntegration(operation, data);
      case 'custom':
        return this.executeCustomCoreIntegration(operation, data);
      default:
        throw new Error(`Unsupported banking core system: ${system}`);
    }
  }

  /**
   * Execute Temenos integration
   */
  private async executeT24Integration(operation: string, data: any): Promise<any> {
    const client = this.httpClients.get('temenos');
    if (!client) {
      throw new Error('Temenos client not initialized');
    }

    // Mock Temenos T24 integration
    const response = await client.post(`/api/${operation}`, data);
    return response.data;
  }

  /**
   * Execute Finacle integration
   */
  private async executeFinacleIntegration(operation: string, data: any): Promise<any> {
    const client = this.httpClients.get('finacle');
    if (!client) {
      throw new Error('Finacle client not initialized');
    }

    // Mock Finacle integration
    const response = await client.post(`/services/${operation}`, data);
    return response.data;
  }

  /**
   * Execute Flexcube integration
   */
  private async executeFlexcubeIntegration(operation: string, data: any): Promise<any> {
    const client = this.httpClients.get('flexcube');
    if (!client) {
      throw new Error('Flexcube client not initialized');
    }

    // Mock Flexcube integration
    const response = await client.post(`/flexcube/${operation}`, data);
    return response.data;
  }

  /**
   * Execute custom core integration
   */
  private async executeCustomCoreIntegration(operation: string, data: any): Promise<any> {
    const client = this.httpClients.get('custom');
    if (!client) {
      throw new Error('Custom core client not initialized');
    }

    // Mock custom core integration
    const response = await client.post(`/${operation}`, data);
    return response.data;
  }

  /**
   * Execute regulatory integration
   */
  private async executeRegulatoryIntegration(request: IntegrationRequest): Promise<any> {
    const { system, operation, data } = request;

    switch (system) {
      case 'rbi':
        return this.executeRBIIntegration(operation, data);
      case 'sebi':
        return this.executeSEBIIntegration(operation, data);
      case 'irdai':
        return this.executeIRDAIIntegration(operation, data);
      default:
        throw new Error(`Unsupported regulatory system: ${system}`);
    }
  }

  /**
   * Execute RBI integration
   */
  private async executeRBIIntegration(operation: string, data: any): Promise<any> {
    const client = this.httpClients.get('rbi');
    if (!client) {
      throw new Error('RBI client not initialized');
    }

    // Mock RBI integration
    return {
      status: 'success',
      operation,
      data: {
        submissionId: `RBI_${Date.now()}`,
        status: 'submitted',
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Execute SEBI integration
   */
  private async executeSEBIIntegration(operation: string, data: any): Promise<any> {
    // Mock SEBI integration
    return {
      status: 'success',
      operation,
      data: {
        submissionId: `SEBI_${Date.now()}`,
        status: 'submitted',
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Execute IRDAI integration
   */
  private async executeIRDAIIntegration(operation: string, data: any): Promise<any> {
    // Mock IRDAI integration
    return {
      status: 'success',
      operation,
      data: {
        submissionId: `IRDAI_${Date.now()}`,
        status: 'submitted',
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Execute third-party integration
   */
  private async executeThirdPartyIntegration(request: IntegrationRequest): Promise<any> {
    const { system, operation, data } = request;

    switch (system) {
      case 'cibil':
        return this.executeCIBILIntegration(operation, data);
      default:
        throw new Error(`Unsupported third-party system: ${system}`);
    }
  }

  /**
   * Execute CIBIL integration
   */
  private async executeCIBILIntegration(operation: string, data: any): Promise<any> {
    // Mock CIBIL integration
    return {
      status: 'success',
      operation,
      data: {
        reportId: `CIBIL_${Date.now()}`,
        score: 750,
        status: 'active',
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Execute internal service integration
   */
  private async executeInternalIntegration(request: IntegrationRequest): Promise<any> {
    const { system, operation, data } = request;
    const client = this.httpClients.get(system);
    
    if (!client) {
      throw new Error(`Internal service client not found: ${system}`);
    }

    const response = await client.post(`/api/v1/${operation}`, data);
    return response.data;
  }

  /**
   * Initialize HTTP clients
   */
  private async initializeHttpClients(): Promise<void> {
    // Banking core clients
    if (config.bankingCores.temenos.enabled) {
      this.httpClients.set('temenos', this.createHttpClient({
        baseURL: config.bankingCores.temenos.baseUrl,
        timeout: config.bankingCores.temenos.timeout,
        auth: {
          username: config.bankingCores.temenos.username!,
          password: config.bankingCores.temenos.password!,
        },
      }));
    }

    if (config.bankingCores.finacle.enabled) {
      this.httpClients.set('finacle', this.createHttpClient({
        baseURL: config.bankingCores.finacle.baseUrl,
        timeout: config.bankingCores.finacle.timeout,
        auth: {
          username: config.bankingCores.finacle.username!,
          password: config.bankingCores.finacle.password!,
        },
      }));
    }

    if (config.bankingCores.flexcube.enabled) {
      this.httpClients.set('flexcube', this.createHttpClient({
        baseURL: config.bankingCores.flexcube.baseUrl,
        timeout: config.bankingCores.flexcube.timeout,
        auth: {
          username: config.bankingCores.flexcube.username!,
          password: config.bankingCores.flexcube.password!,
        },
      }));
    }

    // Regulatory clients
    if (config.thirdParty.rbi.enabled) {
      this.httpClients.set('rbi', this.createHttpClient({
        baseURL: config.thirdParty.rbi.baseUrl,
        timeout: config.thirdParty.rbi.timeout,
        headers: {
          'X-API-Key': config.thirdParty.rbi.apiKey,
        },
      }));
    }

    // Internal service clients
    Object.entries(config.services).forEach(([serviceName, serviceConfig]) => {
      this.httpClients.set(serviceName, this.createHttpClient({
        baseURL: serviceConfig.baseUrl,
        timeout: serviceConfig.timeout,
        headers: {
          'X-API-Key': serviceConfig.apiKey,
        },
      }));
    });

    logger.info('HTTP clients initialized', { count: this.httpClients.size });
  }

  /**
   * Create HTTP client with common configuration
   */
  private createHttpClient(config: AxiosRequestConfig): AxiosInstance {
    const client = axios.create(config);

    // Request interceptor
    client.interceptors.request.use(
      (config) => {
        logger.debug('HTTP request', {
          method: config.method,
          url: config.url,
          baseURL: config.baseURL,
        });
        return config;
      },
      (error) => {
        logger.error('HTTP request error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    client.interceptors.response.use(
      (response) => {
        logger.debug('HTTP response', {
          status: response.status,
          statusText: response.statusText,
          url: response.config.url,
        });
        return response;
      },
      (error) => {
        logger.error('HTTP response error', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );

    return client;
  }

  /**
   * Load active integrations
   */
  private async loadActiveIntegrations(): Promise<void> {
    // Load integrations from database
    logger.info('Active integrations loaded');
  }

  /**
   * Generate integration ID
   */
  private generateIntegrationId(): string {
    return `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get integration by ID
   */
  public getIntegration(integrationId: string): Integration | undefined {
    return this.activeIntegrations.get(integrationId);
  }

  /**
   * Get all active integrations
   */
  public getActiveIntegrations(): Integration[] {
    return Array.from(this.activeIntegrations.values());
  }

  /**
   * Shutdown the integration engine
   */
  public async shutdown(): Promise<void> {
    logger.info('Shutting down Integration Engine...');
    this.isInitialized = false;
    this.emit('shutdown');
    logger.info('Integration Engine shutdown completed');
  }
}

export default IntegrationEngine;
