/**
 * Infosys Finacle Core Banking Integration Connector
 * Handles integration with Infosys Finacle core banking system
 */

import { logger } from '@utils/logger';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { EventEmitter } from 'events';

export interface FinacleConfig {
  baseUrl: string;
  username: string;
  password: string;
  bankId: string;
  branchCode: string;
  timeout: number;
  enableSSL: boolean;
  apiVersion: string;
  clientId?: string;
  clientSecret?: string;
}

export interface FinacleRequest {
  service: string;
  operation: string;
  version?: string;
  requestId?: string;
  data: Record<string, any>;
  options?: {
    async?: boolean;
    priority?: 'HIGH' | 'MEDIUM' | 'LOW';
    timeout?: number;
  };
}

export interface FinacleResponse {
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
  responseCode: string;
  responseMessage: string;
  data?: any;
  errors?: Array<{
    errorCode: string;
    errorMessage: string;
    fieldName?: string;
    severity: 'ERROR' | 'WARNING' | 'INFO';
  }>;
  requestId?: string;
  timestamp: string;
  processingTime?: number;
}

export interface FinacleCustomer {
  customerId: string;
  customerName: string;
  customerType: 'INDIVIDUAL' | 'CORPORATE' | 'JOINT';
  dateOfBirth?: string;
  gender?: 'M' | 'F' | 'O';
  maritalStatus?: string;
  nationality: string;
  occupation?: string;
  address: {
    addressType: 'PERMANENT' | 'CURRENT' | 'OFFICE';
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country: string;
    pinCode: string;
  }[];
  contactDetails: {
    phoneNumber?: string;
    mobileNumber?: string;
    emailId?: string;
    faxNumber?: string;
  };
  identificationDetails: {
    idType: string;
    idNumber: string;
    issueDate?: string;
    expiryDate?: string;
    issuingAuthority?: string;
  }[];
  kycDetails: {
    kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
    kycDate?: string;
    kycType?: string;
    riskCategory: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  relationshipManager?: string;
  branchCode: string;
  customerStatus: 'ACTIVE' | 'INACTIVE' | 'DORMANT' | 'DECEASED';
}

export interface FinacleAccount {
  accountNumber: string;
  customerId: string;
  accountType: string;
  productCode: string;
  currency: string;
  balance: {
    availableBalance: number;
    ledgerBalance: number;
    clearedBalance: number;
    unclearedBalance: number;
    reservedBalance: number;
  };
  accountStatus: 'ACTIVE' | 'DORMANT' | 'CLOSED' | 'BLOCKED' | 'FROZEN';
  openingDate: string;
  closingDate?: string;
  branchCode: string;
  interestRate?: number;
  maturityDate?: string;
  nomineeDetails?: {
    nomineeName: string;
    relationship: string;
    percentage: number;
  }[];
  operatingInstructions?: string;
  accountTitle: string;
  jointHolders?: string[];
}

export interface FinacleTransaction {
  transactionId: string;
  accountNumber: string;
  transactionType: 'DEBIT' | 'CREDIT';
  amount: number;
  currency: string;
  transactionDate: string;
  valueDate: string;
  description: string;
  reference: string;
  counterpartyAccount?: string;
  counterpartyName?: string;
  transactionCode: string;
  channelCode: string;
  branchCode: string;
  userId: string;
  authorizerId?: string;
  charges?: {
    chargeType: string;
    chargeAmount: number;
    chargeCurrency: string;
  }[];
  exchangeRate?: number;
  runningBalance: number;
  instrumentDetails?: {
    instrumentType: 'CHEQUE' | 'DD' | 'RTGS' | 'NEFT' | 'IMPS';
    instrumentNumber?: string;
    instrumentDate?: string;
    draweeBank?: string;
  };
}

export class FinacleConnector extends EventEmitter {
  private client: AxiosInstance;
  private config: FinacleConfig;
  private isConnected = false;
  private sessionId?: string;
  private lastActivity?: Date;

  constructor(finacleConfig: FinacleConfig) {
    super();
    this.config = finacleConfig;
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
        'X-API-Version': this.config.apiVersion,
      },
    };

    const client = axios.create(clientConfig);

    // Request interceptor
    client.interceptors.request.use(
      (config) => {
        if (this.sessionId) {
          config.headers!['X-Session-Id'] = this.sessionId;
        }

        config.headers!['X-Bank-Id'] = this.config.bankId;
        config.headers!['X-Branch-Code'] = this.config.branchCode;

        if (this.config.clientId) {
          config.headers!['X-Client-Id'] = this.config.clientId;
        }

        logger.debug('Finacle request', {
          method: config.method,
          url: config.url,
          headers: config.headers,
        });

        return config;
      },
      (error) => {
        logger.error('Finacle request interceptor error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    client.interceptors.response.use(
      (response) => {
        this.lastActivity = new Date();

        logger.debug('Finacle response', {
          status: response.status,
          data: response.data,
        });

        return response;
      },
      (error) => {
        logger.error('Finacle response error', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });

        // Handle session expiry
        if (error.response?.status === 401 || error.response?.data?.responseCode === 'SESSION_EXPIRED') {
          this.sessionId = undefined;
          this.isConnected = false;
          this.emit('sessionExpired', error);
        }

        return Promise.reject(error);
      }
    );

    return client;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.warn('Finacle connector already connected');
      return;
    }

    try {
      logger.info('Connecting to Finacle...', {
        baseUrl: this.config.baseUrl,
        bankId: this.config.bankId,
      });

      const authPayload: any = {
        username: this.config.username,
        password: this.config.password,
        bankId: this.config.bankId,
        branchCode: this.config.branchCode,
      };

      if (this.config.clientId && this.config.clientSecret) {
        authPayload.clientId = this.config.clientId;
        authPayload.clientSecret = this.config.clientSecret;
      }

      const response = await this.client.post('/services/authentication/login', authPayload);

      if (response.data.status === 'SUCCESS') {
        this.sessionId = response.data.sessionId;
        this.isConnected = true;
        this.lastActivity = new Date();

        // Start session monitoring
        this.startSessionMonitoring();

        logger.info('Successfully connected to Finacle');
        this.emit('connected');
      } else {
        throw new Error(`Authentication failed: ${response.data.responseMessage}`);
      }

    } catch (error) {
      logger.error('Failed to connect to Finacle', error);
      this.emit('connectionFailed', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      if (this.sessionId) {
        await this.client.post('/services/authentication/logout', {
          sessionId: this.sessionId,
        });
      }
    } catch (error) {
      logger.warn('Error during Finacle logout', error);
    }

    this.sessionId = undefined;
    this.isConnected = false;
    this.lastActivity = undefined;

    logger.info('Disconnected from Finacle');
    this.emit('disconnected');
  }

  private startSessionMonitoring(): void {
    setInterval(async () => {
      if (this.isConnected && this.sessionId) {
        try {
          // Send heartbeat to keep session alive
          await this.client.post('/services/common/heartbeat', {
            sessionId: this.sessionId,
          });
        } catch (error) {
          logger.warn('Finacle session heartbeat failed', error);
          this.isConnected = false;
          this.emit('connectionLost', error);
        }
      }
    }, 60000); // 1 minute
  }

  public async executeRequest(request: FinacleRequest): Promise<FinacleResponse> {
    if (!this.isConnected) {
      throw new Error('Not connected to Finacle');
    }

    const startTime = Date.now();

    try {
      const { service, operation, version, requestId, data, options } = request;

      const requestPayload = {
        header: {
          service,
          operation,
          version: version || this.config.apiVersion,
          requestId: requestId || `REQ_${Date.now()}`,
          timestamp: new Date().toISOString(),
          bankId: this.config.bankId,
          branchCode: this.config.branchCode,
          userId: this.config.username,
          sessionId: this.sessionId,
          options: {
            async: options?.async || false,
            priority: options?.priority || 'MEDIUM',
            timeout: options?.timeout || this.config.timeout,
          },
        },
        body: data,
      };

      const response = await this.client.post(`/services/${service}/${operation}`, requestPayload);

      const processingTime = Date.now() - startTime;

      const finacleResponse: FinacleResponse = {
        status: response.data.header?.status || 'SUCCESS',
        responseCode: response.data.header?.responseCode || '0000',
        responseMessage: response.data.header?.responseMessage || 'Success',
        data: response.data.body,
        errors: response.data.header?.errors || [],
        requestId: response.data.header?.requestId,
        timestamp: new Date().toISOString(),
        processingTime,
      };

      logger.info('Finacle operation executed', {
        service,
        operation,
        status: finacleResponse.status,
        responseCode: finacleResponse.responseCode,
        processingTime,
      });

      this.emit('operationExecuted', {
        request,
        response: finacleResponse,
      });

      return finacleResponse;

    } catch (error: any) {
      const processingTime = Date.now() - startTime;

      logger.error('Finacle operation failed', {
        service: request.service,
        operation: request.operation,
        error: error.message,
        processingTime,
      });

      const errorResponse: FinacleResponse = {
        status: 'FAILURE',
        responseCode: error.response?.data?.header?.responseCode || 'SYSTEM_ERROR',
        responseMessage: error.response?.data?.header?.responseMessage || error.message,
        errors: error.response?.data?.header?.errors || [{
          errorCode: 'SYSTEM_ERROR',
          errorMessage: error.message,
          severity: 'ERROR',
        }],
        timestamp: new Date().toISOString(),
        processingTime,
      };

      this.emit('operationFailed', {
        request,
        error: errorResponse,
      });

      return errorResponse;
    }
  }

  // Customer Operations
  public async getCustomer(customerId: string): Promise<FinacleCustomer | null> {
    const response = await this.executeRequest({
      service: 'CustomerService',
      operation: 'getCustomerDetails',
      data: { customerId },
    });

    if (response.status === 'SUCCESS' && response.data) {
      return this.mapFinacleCustomer(response.data);
    }

    return null;
  }

  public async createCustomer(customerData: Partial<FinacleCustomer>): Promise<FinacleResponse> {
    return await this.executeRequest({
      service: 'CustomerService',
      operation: 'createCustomer',
      data: this.mapCustomerToFinacle(customerData),
    });
  }

  public async updateCustomer(customerId: string, updates: Partial<FinacleCustomer>): Promise<FinacleResponse> {
    return await this.executeRequest({
      service: 'CustomerService',
      operation: 'updateCustomer',
      data: {
        customerId,
        ...this.mapCustomerToFinacle(updates),
      },
    });
  }

  public async searchCustomers(criteria: {
    customerName?: string;
    mobileNumber?: string;
    emailId?: string;
    idNumber?: string;
    accountNumber?: string;
  }): Promise<FinacleCustomer[]> {
    const response = await this.executeRequest({
      service: 'CustomerService',
      operation: 'searchCustomers',
      data: criteria,
    });

    if (response.status === 'SUCCESS' && response.data?.customers) {
      return response.data.customers.map((customer: any) => this.mapFinacleCustomer(customer));
    }

    return [];
  }

  // Account Operations
  public async getAccount(accountNumber: string): Promise<FinacleAccount | null> {
    const response = await this.executeRequest({
      service: 'AccountService',
      operation: 'getAccountDetails',
      data: { accountNumber },
    });

    if (response.status === 'SUCCESS' && response.data) {
      return this.mapFinacleAccount(response.data);
    }

    return null;
  }

  public async getCustomerAccounts(customerId: string): Promise<FinacleAccount[]> {
    const response = await this.executeRequest({
      service: 'AccountService',
      operation: 'getCustomerAccounts',
      data: { customerId },
    });

    if (response.status === 'SUCCESS' && response.data?.accounts) {
      return response.data.accounts.map((account: any) => this.mapFinacleAccount(account));
    }

    return [];
  }

  public async createAccount(accountData: Partial<FinacleAccount>): Promise<FinacleResponse> {
    return await this.executeRequest({
      service: 'AccountService',
      operation: 'createAccount',
      data: this.mapAccountToFinacle(accountData),
    });
  }

  public async updateAccountStatus(accountNumber: string, status: string, reason?: string): Promise<FinacleResponse> {
    return await this.executeRequest({
      service: 'AccountService',
      operation: 'updateAccountStatus',
      data: {
        accountNumber,
        accountStatus: status,
        reason,
      },
    });
  }

  // Transaction Operations
  public async getTransactions(
    accountNumber: string,
    fromDate?: string,
    toDate?: string,
    maxRecords?: number
  ): Promise<FinacleTransaction[]> {
    const response = await this.executeRequest({
      service: 'TransactionService',
      operation: 'getAccountTransactions',
      data: {
        accountNumber,
        fromDate: fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        toDate: toDate || new Date().toISOString().split('T')[0],
        maxRecords: maxRecords || 100,
      },
    });

    if (response.status === 'SUCCESS' && response.data?.transactions) {
      return response.data.transactions.map((txn: any) => this.mapFinacleTransaction(txn));
    }

    return [];
  }

  public async executeTransaction(transactionData: {
    fromAccount: string;
    toAccount: string;
    amount: number;
    currency: string;
    description: string;
    reference?: string;
    transactionCode: string;
    channelCode: string;
  }): Promise<FinacleResponse> {
    return await this.executeRequest({
      service: 'TransactionService',
      operation: 'executeTransaction',
      data: transactionData,
    });
  }

  public async getAccountBalance(accountNumber: string): Promise<{
    availableBalance: number;
    ledgerBalance: number;
    clearedBalance: number;
    unclearedBalance: number;
  } | null> {
    const response = await this.executeRequest({
      service: 'AccountService',
      operation: 'getAccountBalance',
      data: { accountNumber },
    });

    if (response.status === 'SUCCESS' && response.data) {
      return {
        availableBalance: parseFloat(response.data.availableBalance || '0'),
        ledgerBalance: parseFloat(response.data.ledgerBalance || '0'),
        clearedBalance: parseFloat(response.data.clearedBalance || '0'),
        unclearedBalance: parseFloat(response.data.unclearedBalance || '0'),
      };
    }

    return null;
  }

  // Compliance Operations
  public async getKYCDetails(customerId: string): Promise<any> {
    const response = await this.executeRequest({
      service: 'ComplianceService',
      operation: 'getKYCDetails',
      data: { customerId },
    });

    return response.data || null;
  }

  public async updateKYCStatus(customerId: string, kycStatus: string, kycDate?: string): Promise<FinacleResponse> {
    return await this.executeRequest({
      service: 'ComplianceService',
      operation: 'updateKYCStatus',
      data: {
        customerId,
        kycStatus,
        kycDate: kycDate || new Date().toISOString().split('T')[0],
      },
    });
  }

  public async getAMLAlerts(customerId?: string, fromDate?: string, toDate?: string): Promise<any[]> {
    const response = await this.executeRequest({
      service: 'ComplianceService',
      operation: 'getAMLAlerts',
      data: {
        customerId,
        fromDate: fromDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        toDate: toDate || new Date().toISOString().split('T')[0],
      },
    });

    return response.data?.alerts || [];
  }

  // Data Mapping Methods
  private mapFinacleCustomer(finacleData: any): FinacleCustomer {
    return {
      customerId: finacleData.customerId || finacleData.CUST_ID,
      customerName: finacleData.customerName || finacleData.CUST_NAME,
      customerType: finacleData.customerType || finacleData.CUST_TYPE || 'INDIVIDUAL',
      dateOfBirth: finacleData.dateOfBirth || finacleData.DATE_OF_BIRTH,
      gender: finacleData.gender || finacleData.GENDER,
      maritalStatus: finacleData.maritalStatus || finacleData.MARITAL_STATUS,
      nationality: finacleData.nationality || finacleData.NATIONALITY || 'IN',
      occupation: finacleData.occupation || finacleData.OCCUPATION,
      address: this.mapFinacleAddresses(finacleData.addresses || finacleData.ADDRESS_DETAILS || []),
      contactDetails: {
        phoneNumber: finacleData.phoneNumber || finacleData.PHONE_NUMBER,
        mobileNumber: finacleData.mobileNumber || finacleData.MOBILE_NUMBER,
        emailId: finacleData.emailId || finacleData.EMAIL_ID,
        faxNumber: finacleData.faxNumber || finacleData.FAX_NUMBER,
      },
      identificationDetails: this.mapFinacleIdentifications(finacleData.identifications || finacleData.ID_DETAILS || []),
      kycDetails: {
        kycStatus: finacleData.kycStatus || finacleData.KYC_STATUS || 'PENDING',
        kycDate: finacleData.kycDate || finacleData.KYC_DATE,
        kycType: finacleData.kycType || finacleData.KYC_TYPE,
        riskCategory: finacleData.riskCategory || finacleData.RISK_CATEGORY || 'MEDIUM',
      },
      relationshipManager: finacleData.relationshipManager || finacleData.RM_ID,
      branchCode: finacleData.branchCode || finacleData.BRANCH_CODE || this.config.branchCode,
      customerStatus: finacleData.customerStatus || finacleData.CUST_STATUS || 'ACTIVE',
    };
  }

  private mapCustomerToFinacle(customerData: Partial<FinacleCustomer>): any {
    const finacleData: any = {};

    if (customerData.customerId) finacleData.CUST_ID = customerData.customerId;
    if (customerData.customerName) finacleData.CUST_NAME = customerData.customerName;
    if (customerData.customerType) finacleData.CUST_TYPE = customerData.customerType;
    if (customerData.dateOfBirth) finacleData.DATE_OF_BIRTH = customerData.dateOfBirth;
    if (customerData.gender) finacleData.GENDER = customerData.gender;
    if (customerData.nationality) finacleData.NATIONALITY = customerData.nationality;
    if (customerData.branchCode) finacleData.BRANCH_CODE = customerData.branchCode;

    if (customerData.contactDetails) {
      if (customerData.contactDetails.phoneNumber) finacleData.PHONE_NUMBER = customerData.contactDetails.phoneNumber;
      if (customerData.contactDetails.mobileNumber) finacleData.MOBILE_NUMBER = customerData.contactDetails.mobileNumber;
      if (customerData.contactDetails.emailId) finacleData.EMAIL_ID = customerData.contactDetails.emailId;
    }

    return finacleData;
  }

  private mapFinacleAccount(finacleData: any): FinacleAccount {
    return {
      accountNumber: finacleData.accountNumber || finacleData.ACCT_NUM,
      customerId: finacleData.customerId || finacleData.CUST_ID,
      accountType: finacleData.accountType || finacleData.ACCT_TYPE,
      productCode: finacleData.productCode || finacleData.PROD_CODE,
      currency: finacleData.currency || finacleData.ACCT_CRNCY_CODE || 'INR',
      balance: {
        availableBalance: parseFloat(finacleData.availableBalance || finacleData.AVAIL_BAL || '0'),
        ledgerBalance: parseFloat(finacleData.ledgerBalance || finacleData.LEDGER_BAL || '0'),
        clearedBalance: parseFloat(finacleData.clearedBalance || finacleData.CLEARED_BAL || '0'),
        unclearedBalance: parseFloat(finacleData.unclearedBalance || finacleData.UNCLEARED_BAL || '0'),
        reservedBalance: parseFloat(finacleData.reservedBalance || finacleData.RESERVED_BAL || '0'),
      },
      accountStatus: finacleData.accountStatus || finacleData.ACCT_STATUS || 'ACTIVE',
      openingDate: finacleData.openingDate || finacleData.ACCT_OPEN_DATE,
      closingDate: finacleData.closingDate || finacleData.ACCT_CLOSE_DATE,
      branchCode: finacleData.branchCode || finacleData.BRANCH_CODE,
      interestRate: parseFloat(finacleData.interestRate || finacleData.INT_RATE || '0'),
      maturityDate: finacleData.maturityDate || finacleData.MATURITY_DATE,
      accountTitle: finacleData.accountTitle || finacleData.ACCT_NAME || '',
      operatingInstructions: finacleData.operatingInstructions || finacleData.OPERATING_INSTRUCTIONS,
    };
  }

  private mapAccountToFinacle(accountData: Partial<FinacleAccount>): any {
    const finacleData: any = {};

    if (accountData.customerId) finacleData.CUST_ID = accountData.customerId;
    if (accountData.accountType) finacleData.ACCT_TYPE = accountData.accountType;
    if (accountData.productCode) finacleData.PROD_CODE = accountData.productCode;
    if (accountData.currency) finacleData.ACCT_CRNCY_CODE = accountData.currency;
    if (accountData.branchCode) finacleData.BRANCH_CODE = accountData.branchCode;
    if (accountData.accountTitle) finacleData.ACCT_NAME = accountData.accountTitle;

    return finacleData;
  }

  private mapFinacleTransaction(finacleData: any): FinacleTransaction {
    return {
      transactionId: finacleData.transactionId || finacleData.TXN_ID,
      accountNumber: finacleData.accountNumber || finacleData.ACCT_NUM,
      transactionType: finacleData.transactionType || (parseFloat(finacleData.TXN_AMT || '0') >= 0 ? 'CREDIT' : 'DEBIT'),
      amount: Math.abs(parseFloat(finacleData.amount || finacleData.TXN_AMT || '0')),
      currency: finacleData.currency || finacleData.TXN_CRNCY_CODE || 'INR',
      transactionDate: finacleData.transactionDate || finacleData.TXN_DATE,
      valueDate: finacleData.valueDate || finacleData.VALUE_DATE,
      description: finacleData.description || finacleData.TXN_DESC || '',
      reference: finacleData.reference || finacleData.TXN_REF_NUM,
      counterpartyAccount: finacleData.counterpartyAccount || finacleData.COUNTER_ACCT,
      counterpartyName: finacleData.counterpartyName || finacleData.COUNTER_NAME,
      transactionCode: finacleData.transactionCode || finacleData.TXN_CODE,
      channelCode: finacleData.channelCode || finacleData.CHANNEL_CODE,
      branchCode: finacleData.branchCode || finacleData.BRANCH_CODE,
      userId: finacleData.userId || finacleData.USER_ID,
      authorizerId: finacleData.authorizerId || finacleData.AUTH_USER_ID,
      runningBalance: parseFloat(finacleData.runningBalance || finacleData.RUNNING_BAL || '0'),
      exchangeRate: parseFloat(finacleData.exchangeRate || finacleData.EXCHANGE_RATE || '1'),
    };
  }

  private mapFinacleAddresses(addresses: any[]): FinacleCustomer['address'] {
    return addresses.map(addr => ({
      addressType: addr.addressType || addr.ADDR_TYPE || 'PERMANENT',
      addressLine1: addr.addressLine1 || addr.ADDR_LINE_1 || '',
      addressLine2: addr.addressLine2 || addr.ADDR_LINE_2,
      city: addr.city || addr.CITY || '',
      state: addr.state || addr.STATE || '',
      country: addr.country || addr.COUNTRY || 'IN',
      pinCode: addr.pinCode || addr.PIN_CODE || '',
    }));
  }

  private mapFinacleIdentifications(identifications: any[]): FinacleCustomer['identificationDetails'] {
    return identifications.map(id => ({
      idType: id.idType || id.ID_TYPE,
      idNumber: id.idNumber || id.ID_NUMBER,
      issueDate: id.issueDate || id.ISSUE_DATE,
      expiryDate: id.expiryDate || id.EXPIRY_DATE,
      issuingAuthority: id.issuingAuthority || id.ISSUING_AUTHORITY,
    }));
  }

  public getConnectionStatus(): {
    isConnected: boolean;
    lastActivity?: Date;
    sessionId?: string;
  } {
    return {
      isConnected: this.isConnected,
      lastActivity: this.lastActivity,
      sessionId: this.sessionId ? '***' : undefined,
    };
  }
}

export default FinacleConnector;
