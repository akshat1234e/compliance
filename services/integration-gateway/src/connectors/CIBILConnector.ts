/**
 * CIBIL (Credit Information Bureau India Limited) Integration Connector
 * Handles integration with CIBIL for credit score and report fetching
 */

import { logger } from '@utils/logger';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { EventEmitter } from 'events';
import { parseString } from 'xml2js';

export interface CIBILConfig {
  baseUrl: string;
  memberId: string;
  memberPassword: string;
  userId: string;
  userPassword: string;
  timeout: number;
  enableSSL: boolean;
  environment: 'sandbox' | 'production';
  certificatePath?: string;
  privateKeyPath?: string;
}

export interface CIBILRequest {
  requestType: 'CREDIT_REPORT' | 'CREDIT_SCORE' | 'COMMERCIAL_REPORT' | 'MONITORING';
  enquiryPurpose: string;
  data: any;
  options?: {
    format?: 'XML' | 'JSON';
    version?: string;
    timeout?: number;
  };
}

export interface CIBILResponse {
  status: 'SUCCESS' | 'ERROR' | 'WARNING';
  responseCode: string;
  responseMessage: string;
  data?: any;
  errors?: Array<{
    errorCode: string;
    errorMessage: string;
    fieldName?: string;
  }>;
  requestId: string;
  timestamp: string;
  processingTime?: number;
}

export interface CreditReportRequest {
  applicantType: 'INDIVIDUAL' | 'COMMERCIAL';
  enquiryPurpose: string;
  applicantDetails: {
    name: {
      firstName: string;
      middleName?: string;
      lastName: string;
    };
    dateOfBirth: string;
    gender: 'M' | 'F';
    identifiers: Array<{
      idType: 'PAN' | 'PASSPORT' | 'VOTER_ID' | 'DRIVING_LICENSE' | 'AADHAAR';
      idNumber: string;
    }>;
    addresses: Array<{
      addressType: 'PERMANENT' | 'CURRENT' | 'OFFICE';
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      pinCode: string;
    }>;
    phoneNumbers: Array<{
      phoneType: 'MOBILE' | 'LANDLINE';
      phoneNumber: string;
    }>;
    emailAddresses?: string[];
  };
  loanDetails?: {
    loanAmount: number;
    loanPurpose: string;
    loanType: string;
  };
}

export interface CreditReport {
  reportId: string;
  reportDate: string;
  applicantName: string;
  creditScore: number;
  scoreRange: {
    min: number;
    max: number;
  };
  scoreFactors: Array<{
    factor: string;
    impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    description: string;
  }>;
  creditSummary: {
    totalAccounts: number;
    activeAccounts: number;
    closedAccounts: number;
    totalCreditLimit: number;
    totalCurrentBalance: number;
    totalOverdueAmount: number;
  };
  accountDetails: Array<{
    accountNumber: string;
    accountType: string;
    ownershipType: string;
    dateOpened: string;
    dateClosed?: string;
    creditLimit: number;
    currentBalance: number;
    overdueAmount: number;
    paymentHistory: Array<{
      month: string;
      year: string;
      paymentStatus: string;
      daysOverdue: number;
    }>;
    lenderName: string;
    accountStatus: string;
  }>;
  enquiryDetails: Array<{
    enquiryDate: string;
    enquiringMember: string;
    enquiryPurpose: string;
    enquiryAmount: number;
  }>;
  publicRecords?: Array<{
    recordType: string;
    recordDate: string;
    amount: number;
    status: string;
    details: string;
  }>;
  alerts?: Array<{
    alertType: string;
    alertMessage: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
}

export interface CommercialCreditReport {
  reportId: string;
  reportDate: string;
  companyName: string;
  companyIdentifiers: {
    cin?: string;
    pan: string;
    gstin?: string;
  };
  creditRating: {
    rating: string;
    ratingScale: string;
    ratingDate: string;
    outlook: 'POSITIVE' | 'STABLE' | 'NEGATIVE';
  };
  financialSummary: {
    totalTurnover: number;
    netWorth: number;
    totalBorrowings: number;
    workingCapital: number;
  };
  creditFacilities: Array<{
    facilityType: string;
    sanctionedAmount: number;
    outstandingAmount: number;
    lenderName: string;
    facilityStatus: string;
    securityDetails?: string;
  }>;
  paymentBehavior: {
    overallRating: string;
    highCredit: number;
    averagePaymentDays: number;
    maxDelayDays: number;
  };
  legalCases?: Array<{
    caseType: string;
    caseStatus: string;
    amount: number;
    filingDate: string;
    court: string;
  }>;
}

export class CIBILConnector extends EventEmitter {
  private client: AxiosInstance;
  private config: CIBILConfig;
  private isConnected = false;
  private sessionId?: string;
  private lastActivity?: Date;

  constructor(cibilConfig: CIBILConfig) {
    super();
    this.config = cibilConfig;
    this.client = this.createHttpClient();
  }

  private createHttpClient(): AxiosInstance {
    const clientConfig: AxiosRequestConfig = {
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/xml',
        'Accept': 'application/xml',
        'User-Agent': 'RBI-Compliance-Platform/1.0',
      },
    };

    // Add SSL certificate if provided
    if (this.config.certificatePath && this.config.privateKeyPath) {
      clientConfig.httpsAgent = {
        cert: this.config.certificatePath,
        key: this.config.privateKeyPath,
        rejectUnauthorized: this.config.enableSSL,
      };
    }

    const client = axios.create(clientConfig);

    // Request interceptor
    client.interceptors.request.use(
      (config) => {
        if (this.sessionId) {
          config.headers!['X-Session-Id'] = this.sessionId;
        }

        config.headers!['X-Member-Id'] = this.config.memberId;
        config.headers!['X-Environment'] = this.config.environment;

        logger.debug('CIBIL request', {
          method: config.method,
          url: config.url,
          headers: config.headers,
        });

        return config;
      },
      (error) => {
        logger.error('CIBIL request interceptor error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    client.interceptors.response.use(
      (response) => {
        this.lastActivity = new Date();

        logger.debug('CIBIL response', {
          status: response.status,
          headers: response.headers,
          data: response.data,
        });

        return response;
      },
      (error) => {
        logger.error('CIBIL response error', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });

        // Handle authentication errors
        if (error.response?.status === 401) {
          this.sessionId = undefined;
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
      logger.warn('CIBIL connector already connected');
      return;
    }

    try {
      logger.info('Connecting to CIBIL...', {
        baseUrl: this.config.baseUrl,
        memberId: this.config.memberId,
        environment: this.config.environment,
      });

      // CIBIL uses XML-based authentication
      const authXml = this.createAuthenticationXML();

      const response = await this.client.post('/authenticate', authXml);

      // Parse XML response
      const parsedResponse = await this.parseXMLResponse(response.data);

      if (parsedResponse.status === 'SUCCESS') {
        this.sessionId = parsedResponse.sessionId;
        this.isConnected = true;
        this.lastActivity = new Date();

        logger.info('Successfully connected to CIBIL');
        this.emit('connected');
      } else {
        throw new Error(`Authentication failed: ${parsedResponse.message}`);
      }

    } catch (error) {
      logger.error('Failed to connect to CIBIL', error);
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
        const logoutXml = this.createLogoutXML();
        await this.client.post('/logout', logoutXml);
      }
    } catch (error) {
      logger.warn('Error during CIBIL logout', error);
    }

    this.sessionId = undefined;
    this.isConnected = false;
    this.lastActivity = undefined;

    logger.info('Disconnected from CIBIL');
    this.emit('disconnected');
  }

  public async executeRequest(request: CIBILRequest): Promise<CIBILResponse> {
    if (!this.isConnected) {
      throw new Error('Not connected to CIBIL');
    }

    const startTime = Date.now();

    try {
      const { requestType, enquiryPurpose, data, options } = request;

      // Create XML request based on type
      let xmlRequest: string;
      switch (requestType) {
        case 'CREDIT_REPORT':
          xmlRequest = this.createCreditReportXML(data, enquiryPurpose);
          break;
        case 'CREDIT_SCORE':
          xmlRequest = this.createCreditScoreXML(data, enquiryPurpose);
          break;
        case 'COMMERCIAL_REPORT':
          xmlRequest = this.createCommercialReportXML(data, enquiryPurpose);
          break;
        default:
          throw new Error(`Unsupported request type: ${requestType}`);
      }

      const response = await this.client.post('/inquiry', xmlRequest, {
        timeout: options?.timeout || this.config.timeout,
      });

      // Parse XML response
      const parsedResponse = await this.parseXMLResponse(response.data);
      const processingTime = Date.now() - startTime;

      const cibilResponse: CIBILResponse = {
        status: parsedResponse.status || 'SUCCESS',
        responseCode: parsedResponse.responseCode || '0',
        responseMessage: parsedResponse.responseMessage || 'Success',
        data: parsedResponse.data,
        errors: parsedResponse.errors || [],
        requestId: parsedResponse.requestId || `REQ_${Date.now()}`,
        timestamp: new Date().toISOString(),
        processingTime,
      };

      logger.info('CIBIL operation executed', {
        requestType,
        status: cibilResponse.status,
        responseCode: cibilResponse.responseCode,
        processingTime,
      });

      this.emit('operationExecuted', {
        request,
        response: cibilResponse,
      });

      return cibilResponse;

    } catch (error: any) {
      const processingTime = Date.now() - startTime;

      logger.error('CIBIL operation failed', {
        requestType: request.requestType,
        error: error.message,
        processingTime,
      });

      const errorResponse: CIBILResponse = {
        status: 'ERROR',
        responseCode: 'SYSTEM_ERROR',
        responseMessage: error.message,
        errors: [{
          errorCode: 'SYSTEM_ERROR',
          errorMessage: error.message,
        }],
        requestId: `ERR_${Date.now()}`,
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

  // Credit Report Operations
  public async getCreditReport(requestData: CreditReportRequest): Promise<CreditReport | null> {
    const response = await this.executeRequest({
      requestType: 'CREDIT_REPORT',
      enquiryPurpose: requestData.enquiryPurpose,
      data: requestData,
    });

    if (response.status === 'SUCCESS' && response.data) {
      return this.mapCreditReport(response.data);
    }

    return null;
  }

  public async getCreditScore(requestData: Partial<CreditReportRequest>): Promise<{
    creditScore: number;
    scoreRange: { min: number; max: number };
    scoreFactors: Array<{ factor: string; impact: string; description: string }>;
  } | null> {
    const response = await this.executeRequest({
      requestType: 'CREDIT_SCORE',
      enquiryPurpose: requestData.enquiryPurpose || 'ACCOUNT_REVIEW',
      data: requestData,
    });

    if (response.status === 'SUCCESS' && response.data) {
      return {
        creditScore: response.data.creditScore || 0,
        scoreRange: response.data.scoreRange || { min: 300, max: 900 },
        scoreFactors: response.data.scoreFactors || [],
      };
    }

    return null;
  }

  public async getCommercialCreditReport(companyData: {
    companyName: string;
    companyIdentifiers: {
      cin?: string;
      pan: string;
      gstin?: string;
    };
    enquiryPurpose: string;
  }): Promise<CommercialCreditReport | null> {
    const response = await this.executeRequest({
      requestType: 'COMMERCIAL_REPORT',
      enquiryPurpose: companyData.enquiryPurpose,
      data: companyData,
    });

    if (response.status === 'SUCCESS' && response.data) {
      return this.mapCommercialCreditReport(response.data);
    }

    return null;
  }

  // XML Helper Methods
  private createAuthenticationXML(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<CIBIL_REQUEST>
  <HEADER>
    <MEMBER_ID>${this.config.memberId}</MEMBER_ID>
    <MEMBER_PASSWORD>${this.config.memberPassword}</MEMBER_PASSWORD>
    <USER_ID>${this.config.userId}</USER_ID>
    <USER_PASSWORD>${this.config.userPassword}</USER_PASSWORD>
    <REQUEST_TYPE>AUTHENTICATION</REQUEST_TYPE>
    <REQUEST_TIME>${new Date().toISOString()}</REQUEST_TIME>
  </HEADER>
</CIBIL_REQUEST>`;
  }

  private createLogoutXML(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<CIBIL_REQUEST>
  <HEADER>
    <SESSION_ID>${this.sessionId}</SESSION_ID>
    <REQUEST_TYPE>LOGOUT</REQUEST_TYPE>
    <REQUEST_TIME>${new Date().toISOString()}</REQUEST_TIME>
  </HEADER>
</CIBIL_REQUEST>`;
  }

  private createCreditReportXML(data: CreditReportRequest, enquiryPurpose: string): string {
    const applicant = data.applicantDetails;

    return `<?xml version="1.0" encoding="UTF-8"?>
<CIBIL_REQUEST>
  <HEADER>
    <SESSION_ID>${this.sessionId}</SESSION_ID>
    <MEMBER_ID>${this.config.memberId}</MEMBER_ID>
    <REQUEST_TYPE>CREDIT_REPORT</REQUEST_TYPE>
    <REQUEST_TIME>${new Date().toISOString()}</REQUEST_TIME>
    <ENQUIRY_PURPOSE>${enquiryPurpose}</ENQUIRY_PURPOSE>
  </HEADER>
  <APPLICANT_DETAILS>
    <APPLICANT_TYPE>${data.applicantType}</APPLICANT_TYPE>
    <NAME>
      <FIRST_NAME>${applicant.name.firstName}</FIRST_NAME>
      ${applicant.name.middleName ? `<MIDDLE_NAME>${applicant.name.middleName}</MIDDLE_NAME>` : ''}
      <LAST_NAME>${applicant.name.lastName}</LAST_NAME>
    </NAME>
    <DATE_OF_BIRTH>${applicant.dateOfBirth}</DATE_OF_BIRTH>
    <GENDER>${applicant.gender}</GENDER>
    <IDENTIFIERS>
      ${applicant.identifiers.map(id => `
        <IDENTIFIER>
          <ID_TYPE>${id.idType}</ID_TYPE>
          <ID_NUMBER>${id.idNumber}</ID_NUMBER>
        </IDENTIFIER>
      `).join('')}
    </IDENTIFIERS>
    <ADDRESSES>
      ${applicant.addresses.map(addr => `
        <ADDRESS>
          <ADDRESS_TYPE>${addr.addressType}</ADDRESS_TYPE>
          <ADDRESS_LINE1>${addr.addressLine1}</ADDRESS_LINE1>
          ${addr.addressLine2 ? `<ADDRESS_LINE2>${addr.addressLine2}</ADDRESS_LINE2>` : ''}
          <CITY>${addr.city}</CITY>
          <STATE>${addr.state}</STATE>
          <PIN_CODE>${addr.pinCode}</PIN_CODE>
        </ADDRESS>
      `).join('')}
    </ADDRESSES>
    <PHONE_NUMBERS>
      ${applicant.phoneNumbers.map(phone => `
        <PHONE>
          <PHONE_TYPE>${phone.phoneType}</PHONE_TYPE>
          <PHONE_NUMBER>${phone.phoneNumber}</PHONE_NUMBER>
        </PHONE>
      `).join('')}
    </PHONE_NUMBERS>
    ${applicant.emailAddresses ? `
      <EMAIL_ADDRESSES>
        ${applicant.emailAddresses.map(email => `<EMAIL>${email}</EMAIL>`).join('')}
      </EMAIL_ADDRESSES>
    ` : ''}
  </APPLICANT_DETAILS>
  ${data.loanDetails ? `
    <LOAN_DETAILS>
      <LOAN_AMOUNT>${data.loanDetails.loanAmount}</LOAN_AMOUNT>
      <LOAN_PURPOSE>${data.loanDetails.loanPurpose}</LOAN_PURPOSE>
      <LOAN_TYPE>${data.loanDetails.loanType}</LOAN_TYPE>
    </LOAN_DETAILS>
  ` : ''}
</CIBIL_REQUEST>`;
  }

  private createCreditScoreXML(data: Partial<CreditReportRequest>, enquiryPurpose: string): string {
    const applicant = data.applicantDetails!;

    return `<?xml version="1.0" encoding="UTF-8"?>
<CIBIL_REQUEST>
  <HEADER>
    <SESSION_ID>${this.sessionId}</SESSION_ID>
    <MEMBER_ID>${this.config.memberId}</MEMBER_ID>
    <REQUEST_TYPE>CREDIT_SCORE</REQUEST_TYPE>
    <REQUEST_TIME>${new Date().toISOString()}</REQUEST_TIME>
    <ENQUIRY_PURPOSE>${enquiryPurpose}</ENQUIRY_PURPOSE>
  </HEADER>
  <APPLICANT_DETAILS>
    <NAME>
      <FIRST_NAME>${applicant.name.firstName}</FIRST_NAME>
      <LAST_NAME>${applicant.name.lastName}</LAST_NAME>
    </NAME>
    <DATE_OF_BIRTH>${applicant.dateOfBirth}</DATE_OF_BIRTH>
    <IDENTIFIERS>
      ${applicant.identifiers.map(id => `
        <IDENTIFIER>
          <ID_TYPE>${id.idType}</ID_TYPE>
          <ID_NUMBER>${id.idNumber}</ID_NUMBER>
        </IDENTIFIER>
      `).join('')}
    </IDENTIFIERS>
  </APPLICANT_DETAILS>
</CIBIL_REQUEST>`;
  }

  private createCommercialReportXML(data: any, enquiryPurpose: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<CIBIL_REQUEST>
  <HEADER>
    <SESSION_ID>${this.sessionId}</SESSION_ID>
    <MEMBER_ID>${this.config.memberId}</MEMBER_ID>
    <REQUEST_TYPE>COMMERCIAL_REPORT</REQUEST_TYPE>
    <REQUEST_TIME>${new Date().toISOString()}</REQUEST_TIME>
    <ENQUIRY_PURPOSE>${enquiryPurpose}</ENQUIRY_PURPOSE>
  </HEADER>
  <COMPANY_DETAILS>
    <COMPANY_NAME>${data.companyName}</COMPANY_NAME>
    <COMPANY_IDENTIFIERS>
      ${data.companyIdentifiers.cin ? `<CIN>${data.companyIdentifiers.cin}</CIN>` : ''}
      <PAN>${data.companyIdentifiers.pan}</PAN>
      ${data.companyIdentifiers.gstin ? `<GSTIN>${data.companyIdentifiers.gstin}</GSTIN>` : ''}
    </COMPANY_IDENTIFIERS>
  </COMPANY_DETAILS>
</CIBIL_REQUEST>`;
  }

  private async parseXMLResponse(xmlData: string): Promise<any> {
    return new Promise((resolve, reject) => {
      parseString(xmlData, { explicitArray: false, ignoreAttrs: true }, (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          const response = result.CIBIL_RESPONSE || result;
          const header = response.HEADER || {};
          const body = response.BODY || response;

          resolve({
            status: header.STATUS || 'SUCCESS',
            responseCode: header.RESPONSE_CODE || '0',
            responseMessage: header.RESPONSE_MESSAGE || 'Success',
            sessionId: header.SESSION_ID,
            requestId: header.REQUEST_ID,
            data: body,
            errors: header.ERRORS ? (Array.isArray(header.ERRORS) ? header.ERRORS : [header.ERRORS]) : [],
          });

        } catch (parseError) {
          reject(parseError);
        }
      });
    });
  }

  // Data Mapping Methods
  private mapCreditReport(cibilData: any): CreditReport {
    return {
      reportId: cibilData.REPORT_ID || `RPT_${Date.now()}`,
      reportDate: cibilData.REPORT_DATE || new Date().toISOString().split('T')[0],
      applicantName: cibilData.APPLICANT_NAME || '',
      creditScore: parseInt(cibilData.CREDIT_SCORE || '0'),
      scoreRange: {
        min: parseInt(cibilData.SCORE_RANGE?.MIN || '300'),
        max: parseInt(cibilData.SCORE_RANGE?.MAX || '900'),
      },
      scoreFactors: this.mapScoreFactors(cibilData.SCORE_FACTORS || []),
      creditSummary: {
        totalAccounts: parseInt(cibilData.CREDIT_SUMMARY?.TOTAL_ACCOUNTS || '0'),
        activeAccounts: parseInt(cibilData.CREDIT_SUMMARY?.ACTIVE_ACCOUNTS || '0'),
        closedAccounts: parseInt(cibilData.CREDIT_SUMMARY?.CLOSED_ACCOUNTS || '0'),
        totalCreditLimit: parseFloat(cibilData.CREDIT_SUMMARY?.TOTAL_CREDIT_LIMIT || '0'),
        totalCurrentBalance: parseFloat(cibilData.CREDIT_SUMMARY?.TOTAL_CURRENT_BALANCE || '0'),
        totalOverdueAmount: parseFloat(cibilData.CREDIT_SUMMARY?.TOTAL_OVERDUE_AMOUNT || '0'),
      },
      accountDetails: this.mapAccountDetails(cibilData.ACCOUNT_DETAILS || []),
      enquiryDetails: this.mapEnquiryDetails(cibilData.ENQUIRY_DETAILS || []),
      publicRecords: this.mapPublicRecords(cibilData.PUBLIC_RECORDS || []),
      alerts: this.mapAlerts(cibilData.ALERTS || []),
    };
  }

  private mapCommercialCreditReport(cibilData: any): CommercialCreditReport {
    return {
      reportId: cibilData.REPORT_ID || `CRPT_${Date.now()}`,
      reportDate: cibilData.REPORT_DATE || new Date().toISOString().split('T')[0],
      companyName: cibilData.COMPANY_NAME || '',
      companyIdentifiers: {
        cin: cibilData.COMPANY_IDENTIFIERS?.CIN,
        pan: cibilData.COMPANY_IDENTIFIERS?.PAN || '',
        gstin: cibilData.COMPANY_IDENTIFIERS?.GSTIN,
      },
      creditRating: {
        rating: cibilData.CREDIT_RATING?.RATING || '',
        ratingScale: cibilData.CREDIT_RATING?.RATING_SCALE || '',
        ratingDate: cibilData.CREDIT_RATING?.RATING_DATE || '',
        outlook: cibilData.CREDIT_RATING?.OUTLOOK || 'STABLE',
      },
      financialSummary: {
        totalTurnover: parseFloat(cibilData.FINANCIAL_SUMMARY?.TOTAL_TURNOVER || '0'),
        netWorth: parseFloat(cibilData.FINANCIAL_SUMMARY?.NET_WORTH || '0'),
        totalBorrowings: parseFloat(cibilData.FINANCIAL_SUMMARY?.TOTAL_BORROWINGS || '0'),
        workingCapital: parseFloat(cibilData.FINANCIAL_SUMMARY?.WORKING_CAPITAL || '0'),
      },
      creditFacilities: this.mapCreditFacilities(cibilData.CREDIT_FACILITIES || []),
      paymentBehavior: {
        overallRating: cibilData.PAYMENT_BEHAVIOR?.OVERALL_RATING || '',
        highCredit: parseFloat(cibilData.PAYMENT_BEHAVIOR?.HIGH_CREDIT || '0'),
        averagePaymentDays: parseInt(cibilData.PAYMENT_BEHAVIOR?.AVERAGE_PAYMENT_DAYS || '0'),
        maxDelayDays: parseInt(cibilData.PAYMENT_BEHAVIOR?.MAX_DELAY_DAYS || '0'),
      },
      legalCases: this.mapLegalCases(cibilData.LEGAL_CASES || []),
    };
  }

  private mapScoreFactors(factors: any[]): CreditReport['scoreFactors'] {
    return factors.map(factor => ({
      factor: factor.FACTOR || factor.factor || '',
      impact: factor.IMPACT || factor.impact || 'NEUTRAL',
      description: factor.DESCRIPTION || factor.description || '',
    }));
  }

  private mapAccountDetails(accounts: any[]): CreditReport['accountDetails'] {
    return accounts.map(account => ({
      accountNumber: account.ACCOUNT_NUMBER || account.accountNumber || '',
      accountType: account.ACCOUNT_TYPE || account.accountType || '',
      ownershipType: account.OWNERSHIP_TYPE || account.ownershipType || '',
      dateOpened: account.DATE_OPENED || account.dateOpened || '',
      dateClosed: account.DATE_CLOSED || account.dateClosed,
      creditLimit: parseFloat(account.CREDIT_LIMIT || account.creditLimit || '0'),
      currentBalance: parseFloat(account.CURRENT_BALANCE || account.currentBalance || '0'),
      overdueAmount: parseFloat(account.OVERDUE_AMOUNT || account.overdueAmount || '0'),
      paymentHistory: this.mapPaymentHistory(account.PAYMENT_HISTORY || account.paymentHistory || []),
      lenderName: account.LENDER_NAME || account.lenderName || '',
      accountStatus: account.ACCOUNT_STATUS || account.accountStatus || '',
    }));
  }

  private mapPaymentHistory(history: any[]): CreditReport['accountDetails'][0]['paymentHistory'] {
    return history.map(payment => ({
      month: payment.MONTH || payment.month || '',
      year: payment.YEAR || payment.year || '',
      paymentStatus: payment.PAYMENT_STATUS || payment.paymentStatus || '',
      daysOverdue: parseInt(payment.DAYS_OVERDUE || payment.daysOverdue || '0'),
    }));
  }

  private mapEnquiryDetails(enquiries: any[]): CreditReport['enquiryDetails'] {
    return enquiries.map(enquiry => ({
      enquiryDate: enquiry.ENQUIRY_DATE || enquiry.enquiryDate || '',
      enquiringMember: enquiry.ENQUIRING_MEMBER || enquiry.enquiringMember || '',
      enquiryPurpose: enquiry.ENQUIRY_PURPOSE || enquiry.enquiryPurpose || '',
      enquiryAmount: parseFloat(enquiry.ENQUIRY_AMOUNT || enquiry.enquiryAmount || '0'),
    }));
  }

  private mapPublicRecords(records: any[]): CreditReport['publicRecords'] {
    return records.map(record => ({
      recordType: record.RECORD_TYPE || record.recordType || '',
      recordDate: record.RECORD_DATE || record.recordDate || '',
      amount: parseFloat(record.AMOUNT || record.amount || '0'),
      status: record.STATUS || record.status || '',
      details: record.DETAILS || record.details || '',
    }));
  }

  private mapAlerts(alerts: any[]): CreditReport['alerts'] {
    return alerts.map(alert => ({
      alertType: alert.ALERT_TYPE || alert.alertType || '',
      alertMessage: alert.ALERT_MESSAGE || alert.alertMessage || '',
      severity: alert.SEVERITY || alert.severity || 'LOW',
    }));
  }

  private mapCreditFacilities(facilities: any[]): CommercialCreditReport['creditFacilities'] {
    return facilities.map(facility => ({
      facilityType: facility.FACILITY_TYPE || facility.facilityType || '',
      sanctionedAmount: parseFloat(facility.SANCTIONED_AMOUNT || facility.sanctionedAmount || '0'),
      outstandingAmount: parseFloat(facility.OUTSTANDING_AMOUNT || facility.outstandingAmount || '0'),
      lenderName: facility.LENDER_NAME || facility.lenderName || '',
      facilityStatus: facility.FACILITY_STATUS || facility.facilityStatus || '',
      securityDetails: facility.SECURITY_DETAILS || facility.securityDetails,
    }));
  }

  private mapLegalCases(cases: any[]): CommercialCreditReport['legalCases'] {
    return cases.map(legalCase => ({
      caseType: legalCase.CASE_TYPE || legalCase.caseType || '',
      caseStatus: legalCase.CASE_STATUS || legalCase.caseStatus || '',
      amount: parseFloat(legalCase.AMOUNT || legalCase.amount || '0'),
      filingDate: legalCase.FILING_DATE || legalCase.filingDate || '',
      court: legalCase.COURT || legalCase.court || '',
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

export default CIBILConnector;
