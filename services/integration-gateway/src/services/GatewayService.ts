import axios from 'axios';
import { EventEmitter } from 'events';
import { GatewayConfig } from '../config/gatewayConfig';
import {
  CIBILConfig,
  CIBILConnector,
  FinacleConfig,
  FinacleConnector,
  FlexcubeConfig,
  FlexcubeConnector,
  RBIConfig,
  RBIConnector,
  TemenosConfig,
  TemenosConnector,
} from '../connectors';
import logger from '../utils/logger';
import { DataTransformationEngine } from './DataTransformationEngine';

export interface GatewayRequest {
  system: 'temenos' | 'finacle' | 'flexcube' | 'rbi' | 'cibil';
  operation: string;
  data: any;
  options?: {
    transformationRuleId?: string;
    timeout?: number;
    retries?: number;
  };
}

export interface GatewayResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    system: string;
    operation: string;
    processingTime: number;
    transformationApplied?: boolean;
  };
}

export class GatewayService extends EventEmitter {
  private config: GatewayConfig;
  private isInitialized = false;

  // Banking Core Connectors
  private temenosConnector?: TemenosConnector;
  private finacleConnector?: FinacleConnector;
  private flexcubeConnector?: FlexcubeConnector;
  private rbiConnector?: RBIConnector;
  private cibilConnector?: CIBILConnector;

  // Data Transformation Engine
  private transformationEngine: DataTransformationEngine;

  constructor() {
    super();
    this.config = new GatewayConfig();
    this.transformationEngine = new DataTransformationEngine();
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Gateway Service already initialized');
      return;
    }

    try {
      logger.info('Initializing Integration Gateway Service...');

      // Initialize transformation engine
      await this.transformationEngine.initialize();

      // Initialize banking core connectors based on configuration
      await this.initializeConnectors();

      this.isInitialized = true;
      logger.info('Integration Gateway Service initialized successfully');
      this.emit('initialized');

    } catch (error) {
      logger.error('Failed to initialize Integration Gateway Service', error);
      throw error;
    }
  }

  private async initializeConnectors(): Promise<void> {
    const connectorConfigs = this.config.getConnectorConfigs();

    // Initialize Temenos connector if configured
    if (connectorConfigs.temenos) {
      this.temenosConnector = new TemenosConnector(connectorConfigs.temenos as TemenosConfig);
      await this.temenosConnector.connect();
      logger.info('Temenos connector initialized');
    }

    // Initialize Finacle connector if configured
    if (connectorConfigs.finacle) {
      this.finacleConnector = new FinacleConnector(connectorConfigs.finacle as FinacleConfig);
      await this.finacleConnector.connect();
      logger.info('Finacle connector initialized');
    }

    // Initialize Flexcube connector if configured
    if (connectorConfigs.flexcube) {
      this.flexcubeConnector = new FlexcubeConnector(connectorConfigs.flexcube as FlexcubeConfig);
      await this.flexcubeConnector.connect();
      logger.info('Flexcube connector initialized');
    }

    // Initialize RBI connector if configured
    if (connectorConfigs.rbi) {
      this.rbiConnector = new RBIConnector(connectorConfigs.rbi as RBIConfig);
      await this.rbiConnector.connect();
      logger.info('RBI connector initialized');
    }

    // Initialize CIBIL connector if configured
    if (connectorConfigs.cibil) {
      this.cibilConnector = new CIBILConnector(connectorConfigs.cibil as CIBILConfig);
      await this.cibilConnector.connect();
      logger.info('CIBIL connector initialized');
    }
  }

  public async executeRequest(request: GatewayRequest): Promise<GatewayResponse> {
    if (!this.isInitialized) {
      throw new Error('Gateway Service not initialized');
    }

    const startTime = Date.now();

    try {
      const { system, operation, data, options } = request;

      logger.info('Executing gateway request', {
        system,
        operation,
        hasTransformationRule: !!options?.transformationRuleId,
      });

      let result: any;

      // Route to appropriate connector
      switch (system) {
        case 'temenos':
          if (!this.temenosConnector) {
            throw new Error('Temenos connector not initialized');
          }
          result = await this.temenosConnector.executeRequest({
            operation,
            application: data.application || 'CUSTOMER',
            data,
          });
          break;

        case 'finacle':
          if (!this.finacleConnector) {
            throw new Error('Finacle connector not initialized');
          }
          result = await this.finacleConnector.executeRequest({
            service: data.service || 'CustomerService',
            operation,
            data,
          });
          break;

        case 'flexcube':
          if (!this.flexcubeConnector) {
            throw new Error('Flexcube connector not initialized');
          }
          result = await this.flexcubeConnector.executeRequest({
            service: data.service || 'CustomerService',
            operation,
            data,
          });
          break;

        case 'rbi':
          if (!this.rbiConnector) {
            throw new Error('RBI connector not initialized');
          }
          result = await this.rbiConnector.executeRequest({
            endpoint: data.endpoint || '/api/v1/regulatory/circulars',
            method: data.method || 'GET',
            data: data.payload,
          });
          break;

        case 'cibil':
          if (!this.cibilConnector) {
            throw new Error('CIBIL connector not initialized');
          }
          result = await this.cibilConnector.executeRequest({
            requestType: data.requestType || 'CREDIT_REPORT',
            enquiryPurpose: data.enquiryPurpose || 'ACCOUNT_REVIEW',
            data: data.payload,
          });
          break;

        default:
          throw new Error(`Unsupported system: ${system}`);
      }

      // Apply data transformation if rule specified
      let transformedData = result.data;
      let transformationApplied = false;

      if (options?.transformationRuleId && result.data) {
        try {
          const transformationResult = await this.transformationEngine.transform({
            ruleId: options.transformationRuleId,
            sourceData: result.data,
            options: {
              validateInput: true,
              validateOutput: true,
              includeMetadata: true,
            },
          });

          if (transformationResult.success) {
            transformedData = transformationResult.transformedData;
            transformationApplied = true;
            logger.info('Data transformation applied successfully', {
              ruleId: options.transformationRuleId,
              system,
              operation,
            });
          } else {
            logger.warn('Data transformation failed', {
              ruleId: options.transformationRuleId,
              errors: transformationResult.errors,
            });
          }
        } catch (transformationError: any) {
          logger.error('Data transformation error', {
            ruleId: options.transformationRuleId,
            error: transformationError.message,
          });
        }
      }

      const processingTime = Date.now() - startTime;

      const response: GatewayResponse = {
        success: result.status === 'SUCCESS' || result.status === 'success',
        data: transformedData,
        error: result.status !== 'SUCCESS' && result.status !== 'success' ? result.errorMessage || result.responseMessage : undefined,
        metadata: {
          system,
          operation,
          processingTime,
          transformationApplied,
        },
      };

      logger.info('Gateway request completed', {
        system,
        operation,
        success: response.success,
        processingTime,
        transformationApplied,
      });

      this.emit('requestCompleted', {
        request,
        response,
        processingTime,
      });

      return response;

    } catch (error: any) {
      const processingTime = Date.now() - startTime;

      logger.error('Gateway request failed', {
        system: request.system,
        operation: request.operation,
        error: error.message,
        processingTime,
      });

      const errorResponse: GatewayResponse = {
        success: false,
        error: error.message,
        metadata: {
          system: request.system,
          operation: request.operation,
          processingTime,
        },
      };

      this.emit('requestFailed', {
        request,
        error: errorResponse,
        processingTime,
      });

      return errorResponse;
    }
  }

  // Legacy method for backward compatibility
  async routeRequest(serviceName: string, path: string, method: string, data?: any) {
    const serviceConfig = this.config.getServiceConfig(serviceName);

    if (!serviceConfig) {
      throw new Error(`Service ${serviceName} not configured`);
    }

    const url = `${serviceConfig.baseUrl}${path}`;
    logger.info(`Routing request to ${serviceName}: ${url}`);

    try {
      const response = await axios({
        method,
        url,
        data,
        headers: {
          'Content-Type': 'application/json',
          'X-Gateway-Service': 'integration-gateway'
        }
      });
      return response.data;
    } catch (error: any) {
      logger.error(`Error routing to ${serviceName}: ${error.message}`);
      throw error;
    }
  }

  // Connector Status Methods
  public getConnectorStatus(): Record<string, any> {
    return {
      temenos: this.temenosConnector?.getConnectionStatus(),
      finacle: this.finacleConnector?.getConnectionStatus(),
      flexcube: this.flexcubeConnector?.getConnectionStatus(),
      rbi: this.rbiConnector?.getConnectionStatus(),
      cibil: this.cibilConnector?.getConnectionStatus(),
    };
  }

  public async shutdown(): Promise<void> {
    logger.info('Shutting down Integration Gateway Service...');

    // Disconnect all connectors
    if (this.temenosConnector) {
      await this.temenosConnector.disconnect();
    }
    if (this.finacleConnector) {
      await this.finacleConnector.disconnect();
    }
    if (this.flexcubeConnector) {
      await this.flexcubeConnector.disconnect();
    }
    if (this.rbiConnector) {
      await this.rbiConnector.disconnect();
    }
    if (this.cibilConnector) {
      await this.cibilConnector.disconnect();
    }

    // Shutdown transformation engine
    await this.transformationEngine.shutdown();

    this.isInitialized = false;
    this.emit('shutdown');
    logger.info('Integration Gateway Service shutdown completed');
  }
}
