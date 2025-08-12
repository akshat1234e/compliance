/**
 * Oracle Flexcube Universal Banking Integration Connector
 * Handles integration with Oracle Flexcube core banking system
 */

import { logger } from '@utils/logger';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { EventEmitter } from 'events';
import { parseString } from 'xml2js';

export interface FlexcubeConfig {
  baseUrl: string;
  username: string;
  password: string;
  branchCode: string;
  sourceCode: string;
  timeout: number;
  enableSSL: boolean;
  soapVersion: '1.1' | '1.2';
  namespace: string;
  wsdlUrl?: string;
}

export interface FlexcubeRequest {
  service: string;
  operation: string;
  messageId?: string;
  data: Record<string, any>;
  options?: {
    async?: boolean;
    priority?: 'HIGH' | 'NORMAL' | 'LOW';
    timeout?: number;
    validateOnly?: boolean;
  };
}

export interface FlexcubeResponse {
  status: 'SUCCESS' | 'ERROR' | 'WARNING';
  errorCode?: string;
  errorMessage?: string;
  data?: any;
  warnings?: Array<{
    warningCode: string;
    warningMessage: string;
    fieldName?: string;
  }>;
  messageId?: string;
  timestamp: string;
  processingTime?: number;
}

export interface FlexcubeCustomer {
  customerNo: string;
  customerName: string;
  customerType: 'INDIVIDUAL' | 'CORPORATE';
  shortName: string;
  dateOfBirth?: string;
  nationality: string;
  language: string;
  addressDetails: {
    addressType: 'PERMANENT' | 'MAILING' | 'OFFICE';
    address1: string;
    address2?: string;
    address3?: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  }[];
  phoneDetails: {
    phoneType: 'HOME' | 'OFFICE' | 'MOBILE' | 'FAX';
    phoneNumber: string;
    isPrimary: boolean;
  }[];
  emailDetails: {
    emailType: 'PERSONAL' | 'BUSINESS';
    emailAddress: string;
    isPrimary: boolean;
  }[];
  identificationDetails: {
    idType: string;
    idNumber: string;
    issueDate?: string;
    expiryDate?: string;
    issuingCountry?: string;
  }[];
  kycDetails: {
    kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
    kycDate?: string;
    riskRating: 'LOW' | 'MEDIUM' | 'HIGH';
    pepStatus: boolean;
  };
  relationshipManager: string;
  branchCode: string;
  customerStatus: 'ACTIVE' | 'INACTIVE' | 'DORMANT' | 'DECEASED';
  creationDate: string;
  lastModifiedDate: string;
}

export interface FlexcubeAccount {
  accountNo: string;
  customerNo: string;
  accountClass: string;
  accountType: string;
  currency: string;
  balance: {
    bookBalance: number;
    availableBalance: number;
    clearedBalance: number;
    blockedAmount: number;
    overdraftLimit: number;
  };
  accountStatus: 'ACTIVE' | 'DORMANT' | 'CLOSED' | 'BLOCKED';
  openDate: string;
  closeDate?: string;
  maturityDate?: string;
  branchCode: string;
  productCode: string;
  interestRate?: number;
  accountTitle: string;
  operatingMode: string;
  jointHolders?: string[];
  nomineeDetails?: {
    nomineeName: string;
    relationship: string;
    percentage: number;
    nomineeAddress: string;
  }[];
  freezeDetails?: {
    freezeCode: string;
    freezeReason: string;
    freezeDate: string;
    freezeAmount?: number;
  }[];
}

export interface FlexcubeTransaction {
  transactionId: string;
  accountNo: string;
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
  authorizationStatus: 'AUTHORIZED' | 'UNAUTHORIZED' | 'REJECTED';
  charges?: {
    chargeCode: string;
    chargeAmount: number;
    chargeCurrency: string;
    chargeAccount: string;
  }[];
  exchangeRate?: number;
  runningBalance: number;
  instrumentDetails?: {
    instrumentType: 'CHEQUE' | 'DD' | 'TT' | 'MT' | 'SWIFT';
    instrumentNo?: string;
    instrumentDate?: string;
    draweeBank?: string;
    routingInfo?: string;
  };
  additionalInfo?: Record<string, string>;
}

export class FlexcubeConnector extends EventEmitter {
  private client: AxiosInstance;
  private config: FlexcubeConfig;
  private isConnected = false;
  private sessionToken?: string;
  private lastHeartbeat?: Date;

  constructor(flexcubeConfig: FlexcubeConfig) {
    super();
    this.config = flexcubeConfig;
    this.client = this.createHttpClient();
  }

  private createHttpClient(): AxiosInstance {
    const clientConfig: AxiosRequestConfig = {
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': '',
        'User-Agent': 'RBI-Compliance-Platform/1.0',
      },
    };

    const client = axios.create(clientConfig);

    // Request interceptor for SOAP envelope
    client.interceptors.request.use(
      (config) => {
        if (this.sessionToken) {
          config.headers!['X-Session-Token'] = this.sessionToken;
        }

        config.headers!['X-Branch-Code'] = this.config.branchCode;
        config.headers!['X-Source-Code'] = this.config.sourceCode;

        logger.debug('Flexcube request', {
          method: config.method,
          url: config.url,
          headers: config.headers,
        });

        return config;
      },
      (error) => {
        logger.error('Flexcube request interceptor error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    client.interceptors.response.use(
      (response) => {
        this.lastHeartbeat = new Date();

        logger.debug('Flexcube response', {
          status: response.status,
          data: response.data,
        });

        return response;
      },
      (error) => {
        logger.error('Flexcube response error', {
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
      logger.warn('Flexcube connector already connected');
      return;
    }

    try {
      logger.info('Connecting to Flexcube...', {
        baseUrl: this.config.baseUrl,
        branchCode: this.config.branchCode,
      });

      // Create SOAP authentication request
      const authSoapEnvelope = this.createSoapEnvelope('Authentication', 'Login', {
        username: this.config.username,
        password: this.config.password,
        branchCode: this.config.branchCode,
        sourceCode: this.config.sourceCode,
      });

      const response = await this.client.post('/FCUBSAccService', authSoapEnvelope);

      // Parse SOAP response
      const parsedResponse = await this.parseSoapResponse(response.data);

      if (parsedResponse.status === 'SUCCESS') {
        this.sessionToken = parsedResponse.data?.sessionToken;
        this.isConnected = true;
        this.lastHeartbeat = new Date();

        // Start heartbeat
        this.startHeartbeat();

        logger.info('Successfully connected to Flexcube');
        this.emit('connected');
      } else {
        throw new Error(`Authentication failed: ${parsedResponse.errorMessage}`);
      }

    } catch (error) {
      logger.error('Failed to connect to Flexcube', error);
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
        const logoutSoapEnvelope = this.createSoapEnvelope('Authentication', 'Logout', {
          sessionToken: this.sessionToken,
        });

        await this.client.post('/FCUBSAccService', logoutSoapEnvelope);
      }
    } catch (error) {
      logger.warn('Error during Flexcube logout', error);
    }

    this.sessionToken = undefined;
    this.isConnected = false;
    this.lastHeartbeat = undefined;

    logger.info('Disconnected from Flexcube');
    this.emit('disconnected');
  }

  private startHeartbeat(): void {
    setInterval(async () => {
      if (this.isConnected && this.sessionToken) {
        try {
          const heartbeatEnvelope = this.createSoapEnvelope('Common', 'Heartbeat', {
            sessionToken: this.sessionToken,
          });

          await this.client.post('/FCUBSAccService', heartbeatEnvelope);
          this.lastHeartbeat = new Date();
        } catch (error) {
          logger.warn('Flexcube heartbeat failed', error);
          this.isConnected = false;
          this.emit('connectionLost', error);
        }
      }
    }, 45000); // 45 seconds
  }

  public async executeRequest(request: FlexcubeRequest): Promise<FlexcubeResponse> {
    if (!this.isConnected) {
      throw new Error('Not connected to Flexcube');
    }

    const startTime = Date.now();

    try {
      const { service, operation, messageId, data, options } = request;

      // Create SOAP envelope
      const soapEnvelope = this.createSoapEnvelope(service, operation, {
        ...data,
        sessionToken: this.sessionToken,
        messageId: messageId || `MSG_${Date.now()}`,
        branchCode: this.config.branchCode,
        sourceCode: this.config.sourceCode,
        options: {
          async: options?.async || false,
          priority: options?.priority || 'NORMAL',
          validateOnly: options?.validateOnly || false,
        },
      });

      const response = await this.client.post('/FCUBSAccService', soapEnvelope);

      // Parse SOAP response
      const parsedResponse = await this.parseSoapResponse(response.data);
      const processingTime = Date.now() - startTime;

      const flexcubeResponse: FlexcubeResponse = {
        status: parsedResponse.status || 'SUCCESS',
        errorCode: parsedResponse.errorCode,
        errorMessage: parsedResponse.errorMessage,
        data: parsedResponse.data,
        warnings: parsedResponse.warnings || [],
        messageId: parsedResponse.messageId,
        timestamp: new Date().toISOString(),
        processingTime,
      };

      logger.info('Flexcube operation executed', {
        service,
        operation,
        status: flexcubeResponse.status,
        processingTime,
      });

      this.emit('operationExecuted', {
        request,
        response: flexcubeResponse,
      });

      return flexcubeResponse;

    } catch (error: any) {
      const processingTime = Date.now() - startTime;

      logger.error('Flexcube operation failed', {
        service: request.service,
        operation: request.operation,
        error: error.message,
        processingTime,
      });

      const errorResponse: FlexcubeResponse = {
        status: 'ERROR',
        errorCode: 'SYSTEM_ERROR',
        errorMessage: error.message,
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
  public async getCustomer(customerNo: string): Promise<FlexcubeCustomer | null> {
    const response = await this.executeRequest({
      service: 'CustomerService',
      operation: 'QueryCustomer',
      data: { customerNo },
    });

    if (response.status === 'SUCCESS' && response.data) {
      return this.mapFlexcubeCustomer(response.data);
    }

    return null;
  }

  public async createCustomer(customerData: Partial<FlexcubeCustomer>): Promise<FlexcubeResponse> {
    return await this.executeRequest({
      service: 'CustomerService',
      operation: 'CreateCustomer',
      data: this.mapCustomerToFlexcube(customerData),
    });
  }

  public async updateCustomer(customerNo: string, updates: Partial<FlexcubeCustomer>): Promise<FlexcubeResponse> {
    return await this.executeRequest({
      service: 'CustomerService',
      operation: 'ModifyCustomer',
      data: {
        customerNo,
        ...this.mapCustomerToFlexcube(updates),
      },
    });
  }

  // Account Operations
  public async getAccount(accountNo: string): Promise<FlexcubeAccount | null> {
    const response = await this.executeRequest({
      service: 'AccountService',
      operation: 'QueryAccount',
      data: { accountNo },
    });

    if (response.status === 'SUCCESS' && response.data) {
      return this.mapFlexcubeAccount(response.data);
    }

    return null;
  }

  public async getCustomerAccounts(customerNo: string): Promise<FlexcubeAccount[]> {
    const response = await this.executeRequest({
      service: 'AccountService',
      operation: 'QueryCustomerAccounts',
      data: { customerNo },
    });

    if (response.status === 'SUCCESS' && response.data?.accounts) {
      return response.data.accounts.map((account: any) => this.mapFlexcubeAccount(account));
    }

    return [];
  }

  public async createAccount(accountData: Partial<FlexcubeAccount>): Promise<FlexcubeResponse> {
    return await this.executeRequest({
      service: 'AccountService',
      operation: 'CreateAccount',
      data: this.mapAccountToFlexcube(accountData),
    });
  }

  // Transaction Operations
  public async getTransactions(
    accountNo: string,
    fromDate?: string,
    toDate?: string,
    maxRecords?: number
  ): Promise<FlexcubeTransaction[]> {
    const response = await this.executeRequest({
      service: 'TransactionService',
      operation: 'QueryTransactions',
      data: {
        accountNo,
        fromDate: fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        toDate: toDate || new Date().toISOString().split('T')[0],
        maxRecords: maxRecords || 100,
      },
    });

    if (response.status === 'SUCCESS' && response.data?.transactions) {
      return response.data.transactions.map((txn: any) => this.mapFlexcubeTransaction(txn));
    }

    return [];
  }

  public async executeTransaction(transactionData: {
    debitAccount: string;
    creditAccount: string;
    amount: number;
    currency: string;
    description: string;
    reference?: string;
    transactionCode: string;
    channelCode: string;
  }): Promise<FlexcubeResponse> {
    return await this.executeRequest({
      service: 'TransactionService',
      operation: 'ProcessTransaction',
      data: transactionData,
    });
  }

  public async getAccountBalance(accountNo: string): Promise<{
    bookBalance: number;
    availableBalance: number;
    clearedBalance: number;
    blockedAmount: number;
  } | null> {
    const response = await this.executeRequest({
      service: 'AccountService',
      operation: 'QueryBalance',
      data: { accountNo },
    });

    if (response.status === 'SUCCESS' && response.data) {
      return {
        bookBalance: parseFloat(response.data.bookBalance || '0'),
        availableBalance: parseFloat(response.data.availableBalance || '0'),
        clearedBalance: parseFloat(response.data.clearedBalance || '0'),
        blockedAmount: parseFloat(response.data.blockedAmount || '0'),
      };
    }

    return null;
  }

  // SOAP Helper Methods
  private createSoapEnvelope(service: string, operation: string, data: any): string {
    const soapAction = `${this.config.namespace}/${service}/${operation}`;

    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:fcub="${this.config.namespace}">
  <soap:Header>
    <fcub:RequestHeader>
      <fcub:Service>${service}</fcub:Service>
      <fcub:Operation>${operation}</fcub:Operation>
      <fcub:BranchCode>${this.config.branchCode}</fcub:BranchCode>
      <fcub:SourceCode>${this.config.sourceCode}</fcub:SourceCode>
      <fcub:MessageId>${data.messageId || 'MSG_' + Date.now()}</fcub:MessageId>
      <fcub:Timestamp>${new Date().toISOString()}</fcub:Timestamp>
      ${this.sessionToken ? `<fcub:SessionToken>${this.sessionToken}</fcub:SessionToken>` : ''}
    </fcub:RequestHeader>
  </soap:Header>
  <soap:Body>
    <fcub:${operation}Request>
      ${this.objectToXml(data)}
    </fcub:${operation}Request>
  </soap:Body>
</soap:Envelope>`;
  }

  private objectToXml(obj: any, prefix = 'fcub'): string {
    let xml = '';

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;

      if (typeof value === 'object' && !Array.isArray(value)) {
        xml += `<${prefix}:${key}>${this.objectToXml(value, prefix)}</${prefix}:${key}>`;
      } else if (Array.isArray(value)) {
        value.forEach(item => {
          xml += `<${prefix}:${key}>${typeof item === 'object' ? this.objectToXml(item, prefix) : item}</${prefix}:${key}>`;
        });
      } else {
        xml += `<${prefix}:${key}>${value}</${prefix}:${key}>`;
      }
    }

    return xml;
  }

  private async parseSoapResponse(soapXml: string): Promise<any> {
    return new Promise((resolve, reject) => {
      parseString(soapXml, { explicitArray: false, ignoreAttrs: true }, (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          const envelope = result['soap:Envelope'] || result.Envelope;
          const body = envelope['soap:Body'] || envelope.Body;
          const fault = body['soap:Fault'] || body.Fault;

          if (fault) {
            resolve({
              status: 'ERROR',
              errorCode: fault.faultcode || 'SOAP_FAULT',
              errorMessage: fault.faultstring || 'SOAP Fault occurred',
            });
            return;
          }

          // Extract response data
          const responseKey = Object.keys(body).find(key => key.includes('Response'));
          const responseData = responseKey ? body[responseKey] : body;

          resolve({
            status: responseData.Status || 'SUCCESS',
            errorCode: responseData.ErrorCode,
            errorMessage: responseData.ErrorMessage,
            data: responseData,
            messageId: responseData.MessageId,
            warnings: responseData.Warnings,
          });

        } catch (parseError) {
          reject(parseError);
        }
      });
    });
  }

  // Data Mapping Methods
  private mapFlexcubeCustomer(flexcubeData: any): FlexcubeCustomer {
    return {
      customerNo: flexcubeData.CustomerNo || flexcubeData.CUSTOMER_NO,
      customerName: flexcubeData.CustomerName || flexcubeData.CUSTOMER_NAME,
      customerType: flexcubeData.CustomerType || flexcubeData.CUSTOMER_TYPE || 'INDIVIDUAL',
      shortName: flexcubeData.ShortName || flexcubeData.SHORT_NAME || '',
      dateOfBirth: flexcubeData.DateOfBirth || flexcubeData.DATE_OF_BIRTH,
      nationality: flexcubeData.Nationality || flexcubeData.NATIONALITY || 'IN',
      language: flexcubeData.Language || flexcubeData.LANGUAGE || 'EN',
      addressDetails: this.mapFlexcubeAddresses(flexcubeData.AddressDetails || []),
      phoneDetails: this.mapFlexcubePhones(flexcubeData.PhoneDetails || []),
      emailDetails: this.mapFlexcubeEmails(flexcubeData.EmailDetails || []),
      identificationDetails: this.mapFlexcubeIdentifications(flexcubeData.IdentificationDetails || []),
      kycDetails: {
        kycStatus: flexcubeData.KycStatus || flexcubeData.KYC_STATUS || 'PENDING',
        kycDate: flexcubeData.KycDate || flexcubeData.KYC_DATE,
        riskRating: flexcubeData.RiskRating || flexcubeData.RISK_RATING || 'MEDIUM',
        pepStatus: flexcubeData.PepStatus || flexcubeData.PEP_STATUS || false,
      },
      relationshipManager: flexcubeData.RelationshipManager || flexcubeData.RM_CODE || '',
      branchCode: flexcubeData.BranchCode || flexcubeData.BRANCH_CODE || this.config.branchCode,
      customerStatus: flexcubeData.CustomerStatus || flexcubeData.CUSTOMER_STATUS || 'ACTIVE',
      creationDate: flexcubeData.CreationDate || flexcubeData.CREATION_DATE || '',
      lastModifiedDate: flexcubeData.LastModifiedDate || flexcubeData.LAST_MODIFIED_DATE || '',
    };
  }

  private mapCustomerToFlexcube(customerData: Partial<FlexcubeCustomer>): any {
    const flexcubeData: any = {};

    if (customerData.customerNo) flexcubeData.CustomerNo = customerData.customerNo;
    if (customerData.customerName) flexcubeData.CustomerName = customerData.customerName;
    if (customerData.customerType) flexcubeData.CustomerType = customerData.customerType;
    if (customerData.shortName) flexcubeData.ShortName = customerData.shortName;
    if (customerData.dateOfBirth) flexcubeData.DateOfBirth = customerData.dateOfBirth;
    if (customerData.nationality) flexcubeData.Nationality = customerData.nationality;
    if (customerData.language) flexcubeData.Language = customerData.language;
    if (customerData.branchCode) flexcubeData.BranchCode = customerData.branchCode;

    return flexcubeData;
  }

  private mapFlexcubeAccount(flexcubeData: any): FlexcubeAccount {
    return {
      accountNo: flexcubeData.AccountNo || flexcubeData.ACCOUNT_NO,
      customerNo: flexcubeData.CustomerNo || flexcubeData.CUSTOMER_NO,
      accountClass: flexcubeData.AccountClass || flexcubeData.ACCOUNT_CLASS,
      accountType: flexcubeData.AccountType || flexcubeData.ACCOUNT_TYPE,
      currency: flexcubeData.Currency || flexcubeData.CURRENCY || 'INR',
      balance: {
        bookBalance: parseFloat(flexcubeData.BookBalance || flexcubeData.BOOK_BALANCE || '0'),
        availableBalance: parseFloat(flexcubeData.AvailableBalance || flexcubeData.AVAILABLE_BALANCE || '0'),
        clearedBalance: parseFloat(flexcubeData.ClearedBalance || flexcubeData.CLEARED_BALANCE || '0'),
        blockedAmount: parseFloat(flexcubeData.BlockedAmount || flexcubeData.BLOCKED_AMOUNT || '0'),
        overdraftLimit: parseFloat(flexcubeData.OverdraftLimit || flexcubeData.OVERDRAFT_LIMIT || '0'),
      },
      accountStatus: flexcubeData.AccountStatus || flexcubeData.ACCOUNT_STATUS || 'ACTIVE',
      openDate: flexcubeData.OpenDate || flexcubeData.OPEN_DATE,
      closeDate: flexcubeData.CloseDate || flexcubeData.CLOSE_DATE,
      maturityDate: flexcubeData.MaturityDate || flexcubeData.MATURITY_DATE,
      branchCode: flexcubeData.BranchCode || flexcubeData.BRANCH_CODE,
      productCode: flexcubeData.ProductCode || flexcubeData.PRODUCT_CODE,
      interestRate: parseFloat(flexcubeData.InterestRate || flexcubeData.INTEREST_RATE || '0'),
      accountTitle: flexcubeData.AccountTitle || flexcubeData.ACCOUNT_TITLE || '',
      operatingMode: flexcubeData.OperatingMode || flexcubeData.OPERATING_MODE || '',
    };
  }

  private mapAccountToFlexcube(accountData: Partial<FlexcubeAccount>): any {
    const flexcubeData: any = {};

    if (accountData.customerNo) flexcubeData.CustomerNo = accountData.customerNo;
    if (accountData.accountClass) flexcubeData.AccountClass = accountData.accountClass;
    if (accountData.accountType) flexcubeData.AccountType = accountData.accountType;
    if (accountData.currency) flexcubeData.Currency = accountData.currency;
    if (accountData.branchCode) flexcubeData.BranchCode = accountData.branchCode;
    if (accountData.productCode) flexcubeData.ProductCode = accountData.productCode;
    if (accountData.accountTitle) flexcubeData.AccountTitle = accountData.accountTitle;

    return flexcubeData;
  }

  private mapFlexcubeTransaction(flexcubeData: any): FlexcubeTransaction {
    return {
      transactionId: flexcubeData.TransactionId || flexcubeData.TRANSACTION_ID,
      accountNo: flexcubeData.AccountNo || flexcubeData.ACCOUNT_NO,
      transactionType: flexcubeData.TransactionType || (parseFloat(flexcubeData.Amount || '0') >= 0 ? 'CREDIT' : 'DEBIT'),
      amount: Math.abs(parseFloat(flexcubeData.Amount || flexcubeData.AMOUNT || '0')),
      currency: flexcubeData.Currency || flexcubeData.CURRENCY || 'INR',
      transactionDate: flexcubeData.TransactionDate || flexcubeData.TRANSACTION_DATE,
      valueDate: flexcubeData.ValueDate || flexcubeData.VALUE_DATE,
      description: flexcubeData.Description || flexcubeData.DESCRIPTION || '',
      reference: flexcubeData.Reference || flexcubeData.REFERENCE,
      counterpartyAccount: flexcubeData.CounterpartyAccount || flexcubeData.COUNTERPARTY_ACCOUNT,
      counterpartyName: flexcubeData.CounterpartyName || flexcubeData.COUNTERPARTY_NAME,
      transactionCode: flexcubeData.TransactionCode || flexcubeData.TRANSACTION_CODE,
      channelCode: flexcubeData.ChannelCode || flexcubeData.CHANNEL_CODE,
      branchCode: flexcubeData.BranchCode || flexcubeData.BRANCH_CODE,
      userId: flexcubeData.UserId || flexcubeData.USER_ID,
      authorizationStatus: flexcubeData.AuthorizationStatus || flexcubeData.AUTH_STATUS || 'AUTHORIZED',
      runningBalance: parseFloat(flexcubeData.RunningBalance || flexcubeData.RUNNING_BALANCE || '0'),
      exchangeRate: parseFloat(flexcubeData.ExchangeRate || flexcubeData.EXCHANGE_RATE || '1'),
    };
  }

  private mapFlexcubeAddresses(addresses: any[]): FlexcubeCustomer['addressDetails'] {
    return addresses.map(addr => ({
      addressType: addr.AddressType || addr.ADDRESS_TYPE || 'PERMANENT',
      address1: addr.Address1 || addr.ADDRESS_1 || '',
      address2: addr.Address2 || addr.ADDRESS_2,
      address3: addr.Address3 || addr.ADDRESS_3,
      city: addr.City || addr.CITY || '',
      state: addr.State || addr.STATE || '',
      country: addr.Country || addr.COUNTRY || 'IN',
      zipCode: addr.ZipCode || addr.ZIP_CODE || '',
    }));
  }

  private mapFlexcubePhones(phones: any[]): FlexcubeCustomer['phoneDetails'] {
    return phones.map(phone => ({
      phoneType: phone.PhoneType || phone.PHONE_TYPE || 'HOME',
      phoneNumber: phone.PhoneNumber || phone.PHONE_NUMBER || '',
      isPrimary: phone.IsPrimary || phone.IS_PRIMARY || false,
    }));
  }

  private mapFlexcubeEmails(emails: any[]): FlexcubeCustomer['emailDetails'] {
    return emails.map(email => ({
      emailType: email.EmailType || email.EMAIL_TYPE || 'PERSONAL',
      emailAddress: email.EmailAddress || email.EMAIL_ADDRESS || '',
      isPrimary: email.IsPrimary || email.IS_PRIMARY || false,
    }));
  }

  private mapFlexcubeIdentifications(identifications: any[]): FlexcubeCustomer['identificationDetails'] {
    return identifications.map(id => ({
      idType: id.IdType || id.ID_TYPE,
      idNumber: id.IdNumber || id.ID_NUMBER,
      issueDate: id.IssueDate || id.ISSUE_DATE,
      expiryDate: id.ExpiryDate || id.EXPIRY_DATE,
      issuingCountry: id.IssuingCountry || id.ISSUING_COUNTRY,
    }));
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

export default FlexcubeConnector;
