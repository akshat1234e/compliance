import {
  CIBILConfig,
  FinacleConfig,
  FlexcubeConfig,
  RBIConfig,
  TemenosConfig,
} from '../connectors';
import { ServiceConfig } from '../types';

export interface ConnectorConfigs {
  temenos?: TemenosConfig;
  finacle?: FinacleConfig;
  flexcube?: FlexcubeConfig;
  rbi?: RBIConfig;
  cibil?: CIBILConfig;
}

export class GatewayConfig {
  private services: Record<string, ServiceConfig>;
  private connectors: ConnectorConfigs;

  constructor() {
    this.services = {
      compliance: {
        name: 'compliance-orchestration',
        baseUrl: process.env['COMPLIANCE_SERVICE_URL'] || 'http://localhost:3001',
        routes: ['/workflows', '/tasks']
      },
      risk: {
        name: 'risk-assessment',
        baseUrl: process.env['RISK_SERVICE_URL'] || 'http://localhost:3002',
        routes: ['/assessments', '/scores']
      },
      regulatory: {
        name: 'regulatory-intelligence',
        baseUrl: process.env['REGULATORY_SERVICE_URL'] || 'http://localhost:3003',
        routes: ['/circulars', '/updates']
      },
      document: {
        name: 'document-management',
        baseUrl: process.env['DOCUMENT_SERVICE_URL'] || 'http://localhost:3004',
        routes: ['/documents', '/templates']
      },
      reporting: {
        name: 'reporting-analytics',
        baseUrl: process.env['REPORTING_SERVICE_URL'] || 'http://localhost:3005',
        routes: ['/reports', '/dashboards']
      }
    };

    // Initialize connector configurations from environment variables
    this.connectors = this.initializeConnectorConfigs();
  }

  private initializeConnectorConfigs(): ConnectorConfigs {
    const configs: ConnectorConfigs = {};

    // Temenos Configuration
    if (process.env['TEMENOS_ENABLED'] === 'true') {
      configs.temenos = {
        baseUrl: process.env['TEMENOS_BASE_URL'] || 'http://localhost:9089',
        username: process.env['TEMENOS_USERNAME'] || '',
        password: process.env['TEMENOS_PASSWORD'] || '',
        companyId: process.env['TEMENOS_COMPANY'] || 'BNK',
        timeout: parseInt(process.env['TEMENOS_TIMEOUT'] || '30000'),
        enableSSL: process.env['TEMENOS_SSL'] === 'true',
        version: process.env['TEMENOS_API_VERSION'] || 'v1.0.0',
      };
    }

    // Finacle Configuration
    if (process.env['FINACLE_ENABLED'] === 'true') {
      configs.finacle = {
        baseUrl: process.env['FINACLE_BASE_URL'] || 'http://localhost:8080',
        username: process.env['FINACLE_USERNAME'] || '',
        password: process.env['FINACLE_PASSWORD'] || '',
        bankId: process.env['FINACLE_BANK_ID'] || '',
        branchCode: process.env['FINACLE_BRANCH_CODE'] || '',
        timeout: parseInt(process.env['FINACLE_TIMEOUT'] || '30000'),
        enableSSL: process.env['FINACLE_SSL'] === 'true',
        apiVersion: process.env['FINACLE_API_VERSION'] || 'v1.0',
      };
    }

    // Flexcube Configuration
    if (process.env['FLEXCUBE_ENABLED'] === 'true') {
      configs.flexcube = {
        baseUrl: process.env['FLEXCUBE_BASE_URL'] || 'http://localhost:7001',
        username: process.env['FLEXCUBE_USERNAME'] || '',
        password: process.env['FLEXCUBE_PASSWORD'] || '',
        branchCode: process.env['FLEXCUBE_BRANCH_CODE'] || '',
        sourceCode: process.env['FLEXCUBE_SOURCE_CODE'] || '',
        timeout: parseInt(process.env['FLEXCUBE_TIMEOUT'] || '30000'),
        enableSSL: process.env['FLEXCUBE_SSL'] === 'true',
        soapVersion: (process.env['FLEXCUBE_SOAP_VERSION'] as '1.1' | '1.2') || '1.2',
        namespace: process.env['FLEXCUBE_NAMESPACE'] || 'http://fcubs.ofss.com/',
      };
    }

    // RBI Configuration
    if (process.env['RBI_ENABLED'] === 'true') {
      configs.rbi = {
        baseUrl: process.env['RBI_BASE_URL'] || 'https://api.rbi.org.in',
        apiKey: process.env['RBI_API_KEY'] || '',
        clientId: process.env['RBI_CLIENT_ID'] || '',
        clientSecret: process.env['RBI_CLIENT_SECRET'] || '',
        timeout: parseInt(process.env['RBI_TIMEOUT'] || '30000'),
        enableSSL: process.env['RBI_SSL'] !== 'false',
        environment: (process.env['RBI_ENVIRONMENT'] as 'sandbox' | 'production') || 'sandbox',
      };
    }

    // CIBIL Configuration
    if (process.env['CIBIL_ENABLED'] === 'true') {
      configs.cibil = {
        baseUrl: process.env['CIBIL_BASE_URL'] || 'https://connect.cibil.com',
        memberId: process.env['CIBIL_MEMBER_ID'] || '',
        memberPassword: process.env['CIBIL_MEMBER_PASSWORD'] || '',
        userId: process.env['CIBIL_USER_ID'] || '',
        userPassword: process.env['CIBIL_USER_PASSWORD'] || '',
        timeout: parseInt(process.env['CIBIL_TIMEOUT'] || '30000'),
        enableSSL: process.env['CIBIL_SSL'] !== 'false',
        environment: (process.env['CIBIL_ENVIRONMENT'] as 'sandbox' | 'production') || 'sandbox',
      };
    }

    return configs;
  }

  getServiceConfig(serviceName: string): ServiceConfig | undefined {
    return this.services[serviceName];
  }

  getAllServices(): Record<string, ServiceConfig> {
    return this.services;
  }

  getConnectorConfigs(): ConnectorConfigs {
    return this.connectors;
  }

  getConnectorConfig(connectorName: keyof ConnectorConfigs): any {
    return this.connectors[connectorName];
  }

  isConnectorEnabled(connectorName: keyof ConnectorConfigs): boolean {
    return this.connectors[connectorName] != null;
  }
}
