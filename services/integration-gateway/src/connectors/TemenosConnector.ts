/**
 * Temenos T24 Core Banking Integration Connector
 * Handles integration with Temenos T24 core banking system
 */

import { logger } from '@utils/logger';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { EventEmitter } from 'events';

export interface TemenosConfig {
  baseUrl: string;
  username: string;
  password: string;
  companyId: string;
  version: string;
  timeout: number;
  enableSSL: boolean;
  apiKey?: string;
}

export interface TemenosRequest {
  operation: string;
  application: string;
  version?: string;
  data: Record<string, any>;
  options?: {
    validate?: boolean;
    authorize?: boolean;
    commit?: boolean;
    enrichment?: string[];
  };
}

export interface TemenosResponse {
  status: 'success' | 'error' | 'warning';
  data?: any;
  errors?: Array<{
    code: string;
    message: string;
    field?: string;
    type: 'validation' | 'business' | 'system';
  }>;
  warnings?: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
  transactionId?: string;
  timestamp: string;
}

export interface CustomerData {
  customerId: string;
  customerName: string;
  customerType: 'INDIVIDUAL' | 'CORPORATE';
  dateOfBirth?: string;
  nationality?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  contactInfo?: {
    phone?: string;
    email?: string;
    mobile?: string;
  };
  kycStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  riskRating?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AccountData {
  accountId: string;
  customerId: string;
  accountType: string;
  currency: string;
  balance: number;
  availableBalance: number;
  status: 'ACTIVE' | 'DORMANT' | 'CLOSED' | 'BLOCKED';
  openDate: string;
  branchCode: string;
  productCode: string;
  interestRate?: number;
  overdraftLimit?: number;
}

export interface TransactionData {
  transactionId: string;
  accountId: string;
  transactionType: 'DEBIT' | 'CREDIT';
  amount: number;
  currency: string;
  valueDate: string;
  narrative: string;
  reference?: string;
  counterpartyAccount?: string;
  counterpartyName?: string;
  charges?: number;
  exchangeRate?: number;
}

export class TemenosConnector extends EventEmitter {
  private client: AxiosInstance;
  private config: TemenosConfig;
  private isConnected = false;
  private sessionToken?: string;
  private lastHeartbeat?: Date;

  constructor(temenosConfig: TemenosConfig) {
    super();
    this.config = temenosConfig;
    this.client = this.createHttpClient();
  }

  private createHttpClient(): AxiosInstance {
    const clientConfig: AxiosRequestConfig = {
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'RBI-Compliance-Platform/1.0',
      },
    };

    if (this.config.apiKey) {
      clientConfig.headers!['X-API-Key'] = this.config.apiKey;
    }

    const client = axios.create(clientConfig);

    // Request interceptor for authentication
    client.interceptors.request.use(
      (config) => {
        if (this.sessionToken) {
          config.headers!['Authorization'] = `Bearer ${this.sessionToken}`;
        }

        // Add company context
        config.headers!['X-Company-Id'] = this.config.companyId;
        config.headers!['X-T24-Version'] = this.config.version;

        logger.debug('Temenos request', {
          method: config.method,
          url: config.url,
          headers: config.headers,
        });

        return config;
      },
      (error) => {
        logger.error('Temenos request interceptor error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    client.interceptors.response.use(
      (response) => {
        logger.debug('Temenos response', {
          status: response.status,
          data: response.data,
        });
        return response;
      },
      (error) => {
        logger.error('Temenos response error', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });

        // Handle authentication errors
        if (error.response?.status === 401) {
          this.sessionToken = undefined;
          this.isConnected = false;
          this.emit('authenticationFailed', error);
        }

        return Promise.reject(error);
      }
    );

    return client;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.warn('Temenos connector already connected');
      return;
    }

    try {
      logger.info('Connecting to Temenos T24...', {
        baseUrl: this.config.baseUrl,
        companyId: this.config.companyId,
      });

      // Authenticate with T24
      const authResponse = await this.client.post('/api/v1/auth/login', {
        username: this.config.username,
        password: this.config.password,
        companyId: this.config.companyId,
      });

      this.sessionToken = authResponse.data.token;
      this.isConnected = true;
      this.lastHeartbeat = new Date();

      // Start heartbeat to maintain connection
      this.startHeartbeat();

      logger.info('Successfully connected to Temenos T24');
      this.emit('connected');

    } catch (error) {
      logger.error('Failed to connect to Temenos T24', error);
      this.emit('connectionFailed', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      if (this.sessionToken) {
        await this.client.post('/api/v1/auth/logout');
      }
    } catch (error) {
      logger.warn('Error during Temenos logout', error);
    }

    this.sessionToken = undefined;
    this.isConnected = false;
    this.lastHeartbeat = undefined;

    logger.info('Disconnected from Temenos T24');
    this.emit('disconnected');
  }

  private startHeartbeat(): void {
    setInterval(async () => {
      if (this.isConnected) {
        try {
          await this.client.get('/api/v1/health');
          this.lastHeartbeat = new Date();
        } catch (error) {
          logger.warn('Temenos heartbeat failed', error);
          this.isConnected = false;
          this.emit('connectionLost', error);
        }
      }
    }, 30000); // 30 seconds
  }

  public async executeRequest(request: TemenosRequest): Promise<TemenosResponse> {
    if (!this.isConnected) {
      throw new Error('Not connected to Temenos T24');
    }

    try {
      const { operation, application, version, data, options } = request;

      const requestPayload = {
        application,
        version: version || this.config.version,
        operation,
        data,
        options: {
          validate: options?.validate ?? true,
          authorize: options?.authorize ?? false,
          commit: options?.commit ?? true,
          enrichment: options?.enrichment || [],
        },
      };

      const response = await this.client.post('/api/v1/execute', requestPayload);

      const temenosResponse: TemenosResponse = {
        status: response.data.status || 'success',
        data: response.data.result,
        errors: response.data.errors || [],
        warnings: response.data.warnings || [],
        transactionId: response.data.transactionId,
        timestamp: new Date().toISOString(),
      };

      logger.info('Temenos operation executed', {
        operation,
        application,
        status: temenosResponse.status,
        transactionId: temenosResponse.transactionId,
      });

      this.emit('operationExecuted', {
        request,
        response: temenosResponse,
      });

      return temenosResponse;

    } catch (error: any) {
      logger.error('Temenos operation failed', {
        operation: request.operation,
        application: request.application,
        error: error.message,
      });

      const errorResponse: TemenosResponse = {
        status: 'error',
        errors: [{
          code: error.response?.data?.errorCode || 'SYSTEM_ERROR',
          message: error.response?.data?.message || error.message,
          type: 'system',
        }],
        timestamp: new Date().toISOString(),
      };

      this.emit('operationFailed', {
        request,
        error: errorResponse,
      });

      return errorResponse;
    }
  }

  // Customer Operations
  public async getCustomer(customerId: string): Promise<CustomerData | null> {
    const response = await this.executeRequest({
      operation: 'READ',
      application: 'CUSTOMER',
      data: { customerId },
    });

    if (response.status === 'success' && response.data) {
      return this.mapTemenosCustomer(response.data);
    }

    return null;
  }

  public async createCustomer(customerData: Partial<CustomerData>): Promise<TemenosResponse> {
    return await this.executeRequest({
      operation: 'INPUT',
      application: 'CUSTOMER',
      data: this.mapCustomerToTemenos(customerData),
      options: { validate: true, authorize: false, commit: true },
    });
  }

  public async updateCustomer(customerId: string, updates: Partial<CustomerData>): Promise<TemenosResponse> {
    return await this.executeRequest({
      operation: 'INPUT',
      application: 'CUSTOMER',
      data: {
        customerId,
        ...this.mapCustomerToTemenos(updates),
      },
      options: { validate: true, authorize: false, commit: true },
    });
  }

  // Account Operations
  public async getAccount(accountId: string): Promise<AccountData | null> {
    const response = await this.executeRequest({
      operation: 'READ',
      application: 'ACCOUNT',
      data: { accountId },
    });

    if (response.status === 'success' && response.data) {
      return this.mapTemenosAccount(response.data);
    }

    return null;
  }

  public async getCustomerAccounts(customerId: string): Promise<AccountData[]> {
    const response = await this.executeRequest({
      operation: 'LIST',
      application: 'ACCOUNT',
      data: { customerId },
    });

    if (response.status === 'success' && response.data?.accounts) {
      return response.data.accounts.map((acc: any) => this.mapTemenosAccount(acc));
    }

    return [];
  }

  public async createAccount(accountData: Partial<AccountData>): Promise<TemenosResponse> {
    return await this.executeRequest({
      operation: 'INPUT',
      application: 'ACCOUNT',
      data: this.mapAccountToTemenos(accountData),
      options: { validate: true, authorize: true, commit: false },
    });
  }

  // Transaction Operations
  public async getTransactions(accountId: string, fromDate?: string, toDate?: string): Promise<TransactionData[]> {
    const response = await this.executeRequest({
      operation: 'LIST',
      application: 'STMT.ENTRY',
      data: {
        accountId,
        fromDate: fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        toDate: toDate || new Date().toISOString().split('T')[0],
      },
    });

    if (response.status === 'success' && response.data?.transactions) {
      return response.data.transactions.map((txn: any) => this.mapTemenosTransaction(txn));
    }

    return [];
  }

  public async executeTransaction(transactionData: Partial<TransactionData>): Promise<TemenosResponse> {
    return await this.executeRequest({
      operation: 'INPUT',
      application: 'FUNDS.TRANSFER',
      data: this.mapTransactionToTemenos(transactionData),
      options: { validate: true, authorize: true, commit: false },
    });
  }

  // Compliance Operations
  public async getComplianceData(customerId: string): Promise<any> {
    const response = await this.executeRequest({
      operation: 'READ',
      application: 'CRS.CUSTOMER',
      data: { customerId },
    });

    return response.data || null;
  }

  public async updateComplianceStatus(customerId: string, status: any): Promise<TemenosResponse> {
    return await this.executeRequest({
      operation: 'INPUT',
      application: 'CRS.CUSTOMER',
      data: {
        customerId,
        complianceStatus: status,
      },
    });
  }

  // Data Mapping Methods
  private mapTemenosCustomer(temenosData: any): CustomerData {
    return {
      customerId: temenosData.customerId || temenosData.CUSTOMER_ID,
      customerName: temenosData.customerName || temenosData.SHORT_NAME,
      customerType: temenosData.customerType || temenosData.CUSTOMER_TYPE || 'INDIVIDUAL',
      dateOfBirth: temenosData.dateOfBirth || temenosData.DATE_OF_BIRTH,
      nationality: temenosData.nationality || temenosData.NATIONALITY,
      address: {
        line1: temenosData.address1 || temenosData.ADDRESS_1 || '',
        line2: temenosData.address2 || temenosData.ADDRESS_2,
        city: temenosData.city || temenosData.TOWN_COUNTRY || '',
        state: temenosData.state || temenosData.POST_CODE || '',
        country: temenosData.country || temenosData.COUNTRY || '',
        postalCode: temenosData.postalCode || temenosData.POST_CODE || '',
      },
      contactInfo: {
        phone: temenosData.phone || temenosData.PHONE_1,
        email: temenosData.email || temenosData.EMAIL_1,
        mobile: temenosData.mobile || temenosData.SMS_1,
      },
      kycStatus: this.mapKycStatus(temenosData.kycStatus || temenosData.KYC_STATUS),
      riskRating: this.mapRiskRating(temenosData.riskRating || temenosData.RISK_RATING),
    };
  }

  private mapCustomerToTemenos(customerData: Partial<CustomerData>): any {
    const temenosData: any = {};

    if (customerData.customerId) temenosData.CUSTOMER_ID = customerData.customerId;
    if (customerData.customerName) temenosData.SHORT_NAME = customerData.customerName;
    if (customerData.customerType) temenosData.CUSTOMER_TYPE = customerData.customerType;
    if (customerData.dateOfBirth) temenosData.DATE_OF_BIRTH = customerData.dateOfBirth;
    if (customerData.nationality) temenosData.NATIONALITY = customerData.nationality;

    if (customerData.address) {
      if (customerData.address.line1) temenosData.ADDRESS_1 = customerData.address.line1;
      if (customerData.address.line2) temenosData.ADDRESS_2 = customerData.address.line2;
      if (customerData.address.city) temenosData.TOWN_COUNTRY = customerData.address.city;
      if (customerData.address.country) temenosData.COUNTRY = customerData.address.country;
      if (customerData.address.postalCode) temenosData.POST_CODE = customerData.address.postalCode;
    }

    if (customerData.contactInfo) {
      if (customerData.contactInfo.phone) temenosData.PHONE_1 = customerData.contactInfo.phone;
      if (customerData.contactInfo.email) temenosData.EMAIL_1 = customerData.contactInfo.email;
      if (customerData.contactInfo.mobile) temenosData.SMS_1 = customerData.contactInfo.mobile;
    }

    return temenosData;
  }

  private mapTemenosAccount(temenosData: any): AccountData {
    return {
      accountId: temenosData.accountId || temenosData.ACCOUNT_ID,
      customerId: temenosData.customerId || temenosData.CUSTOMER_ID,
      accountType: temenosData.accountType || temenosData.CATEGORY,
      currency: temenosData.currency || temenosData.CURRENCY,
      balance: parseFloat(temenosData.balance || temenosData.WORKING_BALANCE || '0'),
      availableBalance: parseFloat(temenosData.availableBalance || temenosData.ONLINE_ACTUAL_BAL || '0'),
      status: this.mapAccountStatus(temenosData.status || temenosData.ACCOUNT_STATUS),
      openDate: temenosData.openDate || temenosData.OPENING_DATE,
      branchCode: temenosData.branchCode || temenosData.CO_CODE,
      productCode: temenosData.productCode || temenosData.CATEGORY,
      interestRate: parseFloat(temenosData.interestRate || temenosData.INTEREST_RATE || '0'),
      overdraftLimit: parseFloat(temenosData.overdraftLimit || temenosData.LIMIT || '0'),
    };
  }

  private mapAccountToTemenos(accountData: Partial<AccountData>): any {
    const temenosData: any = {};

    if (accountData.customerId) temenosData.CUSTOMER_ID = accountData.customerId;
    if (accountData.accountType) temenosData.CATEGORY = accountData.accountType;
    if (accountData.currency) temenosData.CURRENCY = accountData.currency;
    if (accountData.branchCode) temenosData.CO_CODE = accountData.branchCode;
    if (accountData.productCode) temenosData.CATEGORY = accountData.productCode;

    return temenosData;
  }

  private mapTemenosTransaction(temenosData: any): TransactionData {
    return {
      transactionId: temenosData.transactionId || temenosData.TRANSACTION_ID,
      accountId: temenosData.accountId || temenosData.ACCOUNT_ID,
      transactionType: parseFloat(temenosData.amount || temenosData.AMOUNT_LCY || '0') >= 0 ? 'CREDIT' : 'DEBIT',
      amount: Math.abs(parseFloat(temenosData.amount || temenosData.AMOUNT_LCY || '0')),
      currency: temenosData.currency || temenosData.CURRENCY || 'INR',
      valueDate: temenosData.valueDate || temenosData.VALUE_DATE,
      narrative: temenosData.narrative || temenosData.NARRATIVE || '',
      reference: temenosData.reference || temenosData.THEIR_REFERENCE,
      counterpartyAccount: temenosData.counterpartyAccount,
      counterpartyName: temenosData.counterpartyName,
      charges: parseFloat(temenosData.charges || '0'),
      exchangeRate: parseFloat(temenosData.exchangeRate || '1'),
    };
  }

  private mapTransactionToTemenos(transactionData: Partial<TransactionData>): any {
    const temenosData: any = {};

    if (transactionData.accountId) temenosData.DEBIT_ACCOUNT_NO = transactionData.accountId;
    if (transactionData.counterpartyAccount) temenosData.CREDIT_ACCOUNT_NO = transactionData.counterpartyAccount;
    if (transactionData.amount) temenosData.DEBIT_AMOUNT = transactionData.amount.toString();
    if (transactionData.currency) temenosData.DEBIT_CURRENCY = transactionData.currency;
    if (transactionData.narrative) temenosData.PAYMENT_DETAILS = transactionData.narrative;
    if (transactionData.reference) temenosData.THEIR_REFERENCE = transactionData.reference;

    return temenosData;
  }

  private mapKycStatus(status: string): 'PENDING' | 'VERIFIED' | 'REJECTED' {
    switch (status?.toUpperCase()) {
      case 'VERIFIED':
      case 'COMPLETE':
      case 'APPROVED':
        return 'VERIFIED';
      case 'REJECTED':
      case 'DECLINED':
        return 'REJECTED';
      default:
        return 'PENDING';
    }
  }

  private mapRiskRating(rating: string): 'LOW' | 'MEDIUM' | 'HIGH' {
    switch (rating?.toUpperCase()) {
      case 'LOW':
      case '1':
        return 'LOW';
      case 'HIGH':
      case '3':
        return 'HIGH';
      default:
        return 'MEDIUM';
    }
  }

  private mapAccountStatus(status: string): 'ACTIVE' | 'DORMANT' | 'CLOSED' | 'BLOCKED' {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
      case 'LIVE':
        return 'ACTIVE';
      case 'DORMANT':
      case 'INACTIVE':
        return 'DORMANT';
      case 'CLOSED':
        return 'CLOSED';
      case 'BLOCKED':
      case 'SUSPENDED':
        return 'BLOCKED';
      default:
        return 'ACTIVE';
    }
  }

  public getConnectionStatus(): {
    isConnected: boolean;
    lastHeartbeat?: Date;
    sessionToken?: string;
  } {
    return {
      isConnected: this.isConnected,
      lastHeartbeat: this.lastHeartbeat,
      sessionToken: this.sessionToken ? '***' : undefined,
    };
  }
}

export default TemenosConnector;
