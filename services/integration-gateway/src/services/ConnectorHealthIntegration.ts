/**
 * Connector Health Integration
 * Integrates banking connectors with health check and monitoring systems
 */

import { EventEmitter } from 'events';
import { HealthCheckService } from './HealthCheckService';
import { MonitoringService } from './MonitoringService';
import { GatewayService } from './GatewayService';
import logger from '../utils/logger';

export interface ConnectorHealthConfig {
  enableAutoRegistration: boolean;
  healthCheckInterval: number;
  connectionTimeout: number;
  enablePerformanceMonitoring: boolean;
}

export class ConnectorHealthIntegration extends EventEmitter {
  private healthCheckService: HealthCheckService;
  private monitoringService: MonitoringService;
  private gatewayService: GatewayService;
  private config: ConnectorHealthConfig;
  private registeredConnectors: Set<string> = new Set();

  constructor(
    healthCheckService: HealthCheckService,
    monitoringService: MonitoringService,
    gatewayService: GatewayService,
    config: Partial<ConnectorHealthConfig> = {}
  ) {
    super();
    this.healthCheckService = healthCheckService;
    this.monitoringService = monitoringService;
    this.gatewayService = gatewayService;
    this.config = {
      enableAutoRegistration: true,
      healthCheckInterval: 30000, // 30 seconds
      connectionTimeout: 10000, // 10 seconds
      enablePerformanceMonitoring: true,
      ...config,
    };
  }

  public async initialize(): Promise<void> {
    try {
      logger.info('Initializing Connector Health Integration...');

      // Set up gateway service listeners
      this.setupGatewayListeners();

      // Register health checks for existing connectors
      if (this.config.enableAutoRegistration) {
        await this.registerConnectorHealthChecks();
      }

      logger.info('Connector Health Integration initialized successfully');
      this.emit('initialized');

    } catch (error) {
      logger.error('Failed to initialize Connector Health Integration', error);
      throw error;
    }
  }

  private setupGatewayListeners(): void {
    // Listen for gateway service events
    this.gatewayService.on('requestCompleted', (data) => {
      if (this.config.enablePerformanceMonitoring) {
        this.recordConnectorRequest(data, true);
      }
    });

    this.gatewayService.on('requestFailed', (data) => {
      if (this.config.enablePerformanceMonitoring) {
        this.recordConnectorRequest(data, false);
      }
    });

    // Listen for connector connection events
    this.gatewayService.on('connectorConnected', (connectorInfo) => {
      this.handleConnectorConnected(connectorInfo);
    });

    this.gatewayService.on('connectorDisconnected', (connectorInfo) => {
      this.handleConnectorDisconnected(connectorInfo);
    });
  }

  private async registerConnectorHealthChecks(): Promise<void> {
    const connectorStatus = this.gatewayService.getConnectorStatus();

    for (const [connectorName, status] of Object.entries(connectorStatus)) {
      if (status && !this.registeredConnectors.has(connectorName)) {
        await this.registerConnectorHealthCheck(connectorName, status);
      }
    }
  }

  private async registerConnectorHealthCheck(connectorName: string, connectorStatus: any): Promise<void> {
    try {
      const healthCheckId = `connector_${connectorName}`;
      
      await this.healthCheckService.registerHealthCheck({
        id: healthCheckId,
        name: `${connectorName.toUpperCase()} Connector Health`,
        type: 'connector',
        config: {
          customCheck: async () => {
            return await this.performConnectorHealthCheck(connectorName);
          },
          timeout: this.config.connectionTimeout,
        },
        isEnabled: true,
        tags: ['connector', connectorName, 'banking'],
      });

      this.registeredConnectors.add(connectorName);
      
      logger.info('Connector health check registered', {
        connectorName,
        healthCheckId,
      });

    } catch (error: any) {
      logger.error('Failed to register connector health check', {
        connectorName,
        error: error.message,
      });
    }
  }

  private async performConnectorHealthCheck(connectorName: string): Promise<any> {
    const startTime = Date.now();

    try {
      // Get connector status from gateway service
      const connectorStatus = this.gatewayService.getConnectorStatus();
      const status = connectorStatus[connectorName];

      if (!status) {
        return {
          id: `connector_${connectorName}`,
          name: `${connectorName.toUpperCase()} Connector Health`,
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          timestamp: new Date(),
          details: {
            error: 'Connector not found or not initialized',
          },
        };
      }

      // Perform basic connectivity test based on connector type
      const testResult = await this.testConnectorConnectivity(connectorName, status);
      
      return {
        id: `connector_${connectorName}`,
        name: `${connectorName.toUpperCase()} Connector Health`,
        status: testResult.success ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
        details: {
          message: testResult.message,
          metadata: {
            connectorStatus: status,
            lastActivity: status.lastActivity,
            connectionUptime: status.connectionUptime,
            ...testResult.metadata,
          },
        },
      };

    } catch (error: any) {
      return {
        id: `connector_${connectorName}`,
        name: `${connectorName.toUpperCase()} Connector Health`,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
        details: {
          error: error.message,
          metadata: {
            errorType: error.constructor.name,
          },
        },
      };
    }
  }

  private async testConnectorConnectivity(connectorName: string, status: any): Promise<{
    success: boolean;
    message: string;
    metadata?: Record<string, any>;
  }> {
    try {
      // Perform a lightweight test operation based on connector type
      switch (connectorName) {
        case 'temenos':
          return await this.testTemenosConnectivity();
        case 'finacle':
          return await this.testFinacleConnectivity();
        case 'flexcube':
          return await this.testFlexcubeConnectivity();
        case 'rbi':
          return await this.testRBIConnectivity();
        case 'cibil':
          return await this.testCIBILConnectivity();
        default:
          return {
            success: status.isConnected || false,
            message: status.isConnected ? 'Connector is connected' : 'Connector is disconnected',
            metadata: {
              connectionStatus: status.isConnected,
            },
          };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Connectivity test failed: ${error.message}`,
        metadata: {
          error: error.message,
        },
      };
    }
  }

  private async testTemenosConnectivity(): Promise<{ success: boolean; message: string; metadata?: Record<string, any> }> {
    try {
      // Perform a simple API status check
      const response = await this.gatewayService.executeRequest({
        system: 'temenos',
        operation: 'getSystemInfo',
        data: {},
        options: { timeout: this.config.connectionTimeout },
      });

      return {
        success: response.success,
        message: response.success ? 'Temenos connection healthy' : 'Temenos connection failed',
        metadata: {
          responseTime: response.metadata?.processingTime,
          lastError: response.error,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Temenos connectivity test failed: ${error.message}`,
      };
    }
  }

  private async testFinacleConnectivity(): Promise<{ success: boolean; message: string; metadata?: Record<string, any> }> {
    try {
      const response = await this.gatewayService.executeRequest({
        system: 'finacle',
        operation: 'ping',
        data: {},
        options: { timeout: this.config.connectionTimeout },
      });

      return {
        success: response.success,
        message: response.success ? 'Finacle connection healthy' : 'Finacle connection failed',
        metadata: {
          responseTime: response.metadata?.processingTime,
          lastError: response.error,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Finacle connectivity test failed: ${error.message}`,
      };
    }
  }

  private async testFlexcubeConnectivity(): Promise<{ success: boolean; message: string; metadata?: Record<string, any> }> {
    try {
      const response = await this.gatewayService.executeRequest({
        system: 'flexcube',
        operation: 'GetSystemStatus',
        data: {},
        options: { timeout: this.config.connectionTimeout },
      });

      return {
        success: response.success,
        message: response.success ? 'Flexcube connection healthy' : 'Flexcube connection failed',
        metadata: {
          responseTime: response.metadata?.processingTime,
          lastError: response.error,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Flexcube connectivity test failed: ${error.message}`,
      };
    }
  }

  private async testRBIConnectivity(): Promise<{ success: boolean; message: string; metadata?: Record<string, any> }> {
    try {
      const response = await this.gatewayService.executeRequest({
        system: 'rbi',
        operation: 'getAPIStatus',
        data: {},
        options: { timeout: this.config.connectionTimeout },
      });

      return {
        success: response.success,
        message: response.success ? 'RBI API connection healthy' : 'RBI API connection failed',
        metadata: {
          responseTime: response.metadata?.processingTime,
          lastError: response.error,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `RBI API connectivity test failed: ${error.message}`,
      };
    }
  }

  private async testCIBILConnectivity(): Promise<{ success: boolean; message: string; metadata?: Record<string, any> }> {
    try {
      const response = await this.gatewayService.executeRequest({
        system: 'cibil',
        operation: 'ping',
        data: {},
        options: { timeout: this.config.connectionTimeout },
      });

      return {
        success: response.success,
        message: response.success ? 'CIBIL connection healthy' : 'CIBIL connection failed',
        metadata: {
          responseTime: response.metadata?.processingTime,
          lastError: response.error,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `CIBIL connectivity test failed: ${error.message}`,
      };
    }
  }

  private recordConnectorRequest(data: any, success: boolean): void {
    const { request, response } = data;
    const connectorId = request.system;
    const responseTime = response?.metadata?.processingTime || 0;

    this.monitoringService.recordConnectorRequest(connectorId, success, responseTime);
  }

  private handleConnectorConnected(connectorInfo: any): void {
    logger.info('Connector connected', connectorInfo);
    
    if (this.config.enableAutoRegistration && !this.registeredConnectors.has(connectorInfo.name)) {
      this.registerConnectorHealthCheck(connectorInfo.name, connectorInfo.status);
    }
  }

  private handleConnectorDisconnected(connectorInfo: any): void {
    logger.warn('Connector disconnected', connectorInfo);
    // Health checks will automatically detect the disconnection
  }

  public async shutdown(): Promise<void> {
    logger.info('Shutting down Connector Health Integration...');
    
    this.registeredConnectors.clear();
    
    this.emit('shutdown');
    logger.info('Connector Health Integration shutdown completed');
  }
}

export default ConnectorHealthIntegration;
