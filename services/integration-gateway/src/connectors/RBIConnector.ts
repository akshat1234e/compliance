/**
 * RBI (Reserve Bank of India) Regulatory API Integration Connector
 * Handles integration with RBI APIs for regulatory data fetching and submission
 */

import { logger } from '@utils/logger';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { EventEmitter } from 'events';

export interface RBIConfig {
  baseUrl: string;
  apiKey: string;
  clientId: string;
  clientSecret: string;
  timeout: number;
  enableSSL: boolean;
  environment: 'sandbox' | 'production';
  certificatePath?: string;
  privateKeyPath?: string;
}

export interface RBIRequest {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  params?: Record<string, string>;
  headers?: Record<string, string>;
  options?: {
    timeout?: number;
    retries?: number;
    validateResponse?: boolean;
  };
}

export interface RBIResponse {
  status: 'SUCCESS' | 'ERROR' | 'WARNING';
  statusCode: number;
  message?: string;
  data?: any;
  errors?: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
  metadata?: {
    requestId: string;
    timestamp: string;
    processingTime: number;
    rateLimit?: {
      remaining: number;
      reset: number;
    };
  };
}

export interface RegulatoryCircular {
  circularId: string;
  circularNumber: string;
  title: string;
  category: string;
  subCategory?: string;
  issueDate: string;
  effectiveDate: string;
  expiryDate?: string;
  status: 'ACTIVE' | 'SUPERSEDED' | 'WITHDRAWN';
  content: string;
  attachments?: Array<{
    fileName: string;
    fileType: string;
    downloadUrl: string;
    size: number;
  }>;
  tags: string[];
  applicableTo: string[];
  supersedes?: string[];
  amendedBy?: string[];
  relatedCirculars?: string[];
}

export interface ComplianceReport {
  reportId: string;
  reportType: string;
  reportingPeriod: {
    from: string;
    to: string;
  };
  submissionDate: string;
  dueDate: string;
  status: 'DRAFT' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'UNDER_REVIEW';
  bankCode: string;
  branchCode?: string;
  data: Record<string, any>;
  validationErrors?: Array<{
    field: string;
    error: string;
    severity: 'ERROR' | 'WARNING';
  }>;
  submittedBy: string;
  reviewedBy?: string;
  comments?: string;
}

export interface MasterDirective {
  directiveId: string;
  title: string;
  category: string;
  issueDate: string;
  lastUpdated: string;
  version: string;
  status: 'CURRENT' | 'SUPERSEDED';
  chapters: Array<{
    chapterNumber: string;
    title: string;
    content: string;
    lastUpdated: string;
  }>;
  annexures?: Array<{
    annexureNumber: string;
    title: string;
    content: string;
    downloadUrl?: string;
  }>;
  applicableTo: string[];
  keywords: string[];
}

export interface RegulatoryUpdate {
  updateId: string;
  type: 'CIRCULAR' | 'DIRECTIVE' | 'NOTIFICATION' | 'GUIDELINE';
  title: string;
  summary: string;
  publishDate: string;
  effectiveDate: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  impactAssessment?: {
    affectedAreas: string[];
    complianceActions: string[];
    timeline: string;
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  documentUrl: string;
  relatedDocuments?: string[];
}

export class RBIConnector extends EventEmitter {
  private client: AxiosInstance;
  private config: RBIConfig;
  private isConnected = false;
  private accessToken?: string;
  private tokenExpiry?: Date;
  private rateLimitInfo?: {
    remaining: number;
    reset: number;
  };

  constructor(rbiConfig: RBIConfig) {
    super();
    this.config = rbiConfig;
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
        'X-Client-Id': this.config.clientId,
      },
    };

    // Add SSL certificate if provided
    if (this.config.certificatePath && this.config.privateKeyPath) {
      // In production, you would load actual certificates
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
        if (this.accessToken) {
          config.headers!['Authorization'] = `Bearer ${this.accessToken}`;
        }

        config.headers!['X-API-Key'] = this.config.apiKey;
        config.headers!['X-Environment'] = this.config.environment;

        logger.debug('RBI API request', {
          method: config.method,
          url: config.url,
          headers: config.headers,
        });

        return config;
      },
      (error) => {
        logger.error('RBI API request interceptor error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    client.interceptors.response.use(
      (response) => {
        // Update rate limit info
        if (response.headers['x-ratelimit-remaining']) {
          this.rateLimitInfo = {
            remaining: parseInt(response.headers['x-ratelimit-remaining']),
            reset: parseInt(response.headers['x-ratelimit-reset']),
          };
        }

        logger.debug('RBI API response', {
          status: response.status,
          headers: response.headers,
          data: response.data,
        });

        return response;
      },
      (error) => {
        logger.error('RBI API response error', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });

        // Handle authentication errors
        if (error.response?.status === 401) {
          this.accessToken = undefined;
          this.tokenExpiry = undefined;
          this.isConnected = false;
          this.emit('authenticationFailed', error);
        }

        // Handle rate limiting
        if (error.response?.status === 429) {
          this.emit('rateLimitExceeded', {
            retryAfter: error.response.headers['retry-after'],
            rateLimitInfo: this.rateLimitInfo,
          });
        }

        return Promise.reject(error);
      }
    );

    return client;
  }

  public async connect(): Promise<void> {
    if (this.isConnected && this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      logger.warn('RBI connector already connected with valid token');
      return;
    }

    try {
      logger.info('Connecting to RBI API...', {
        baseUrl: this.config.baseUrl,
        environment: this.config.environment,
      });

      // OAuth 2.0 Client Credentials flow
      const authResponse = await this.client.post('/oauth/token', {
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: 'regulatory_data compliance_reporting master_directives',
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      this.accessToken = authResponse.data.access_token;
      this.tokenExpiry = new Date(Date.now() + (authResponse.data.expires_in * 1000));
      this.isConnected = true;

      // Schedule token refresh
      this.scheduleTokenRefresh(authResponse.data.expires_in);

      logger.info('Successfully connected to RBI API', {
        tokenExpiry: this.tokenExpiry,
        scope: authResponse.data.scope,
      });

      this.emit('connected');

    } catch (error) {
      logger.error('Failed to connect to RBI API', error);
      this.emit('connectionFailed', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      if (this.accessToken) {
        await this.client.post('/oauth/revoke', {
          token: this.accessToken,
          token_type_hint: 'access_token',
        });
      }
    } catch (error) {
      logger.warn('Error during RBI API token revocation', error);
    }

    this.accessToken = undefined;
    this.tokenExpiry = undefined;
    this.isConnected = false;
    this.rateLimitInfo = undefined;

    logger.info('Disconnected from RBI API');
    this.emit('disconnected');
  }

  private scheduleTokenRefresh(expiresIn: number): void {
    // Refresh token 5 minutes before expiry
    const refreshTime = (expiresIn - 300) * 1000;

    setTimeout(async () => {
      if (this.isConnected) {
        try {
          await this.connect();
        } catch (error) {
          logger.error('Failed to refresh RBI API token', error);
          this.emit('tokenRefreshFailed', error);
        }
      }
    }, refreshTime);
  }

  public async executeRequest(request: RBIRequest): Promise<RBIResponse> {
    if (!this.isConnected) {
      throw new Error('Not connected to RBI API');
    }

    const startTime = Date.now();

    try {
      const { endpoint, method, data, params, headers, options } = request;

      const requestConfig: AxiosRequestConfig = {
        method,
        url: endpoint,
        data,
        params,
        headers: {
          ...headers,
          'X-Request-ID': `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        },
        timeout: options?.timeout || this.config.timeout,
      };

      let response;
      let retries = options?.retries || 0;

      while (retries >= 0) {
        try {
          response = await this.client.request(requestConfig);
          break;
        } catch (error: any) {
          if (retries > 0 && (error.code === 'ECONNRESET' || error.response?.status >= 500)) {
            retries--;
            await new Promise(resolve => setTimeout(resolve, 1000 * (options?.retries! - retries)));
            continue;
          }
          throw error;
        }
      }

      const processingTime = Date.now() - startTime;

      const rbiResponse: RBIResponse = {
        status: response!.data.status || 'SUCCESS',
        statusCode: response!.status,
        message: response!.data.message,
        data: response!.data.data || response!.data,
        errors: response!.data.errors || [],
        metadata: {
          requestId: response!.headers['x-request-id'] || requestConfig.headers!['X-Request-ID'],
          timestamp: new Date().toISOString(),
          processingTime,
          rateLimit: this.rateLimitInfo,
        },
      };

      logger.info('RBI API operation executed', {
        endpoint,
        method,
        status: rbiResponse.status,
        statusCode: rbiResponse.statusCode,
        processingTime,
      });

      this.emit('operationExecuted', {
        request,
        response: rbiResponse,
      });

      return rbiResponse;

    } catch (error: any) {
      const processingTime = Date.now() - startTime;

      logger.error('RBI API operation failed', {
        endpoint: request.endpoint,
        method: request.method,
        error: error.message,
        processingTime,
      });

      const errorResponse: RBIResponse = {
        status: 'ERROR',
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || error.message,
        errors: error.response?.data?.errors || [{
          code: error.response?.data?.error_code || 'SYSTEM_ERROR',
          message: error.response?.data?.error_description || error.message,
        }],
        metadata: {
          requestId: `ERR_${Date.now()}`,
          timestamp: new Date().toISOString(),
          processingTime,
        },
      };

      this.emit('operationFailed', {
        request,
        error: errorResponse,
      });

      return errorResponse;
    }
  }

  // Regulatory Circulars Operations
  public async getRegulatoryCirculars(params?: {
    category?: string;
    fromDate?: string;
    toDate?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<RegulatoryCircular[]> {
    const response = await this.executeRequest({
      endpoint: '/api/v1/regulatory/circulars',
      method: 'GET',
      params: params as Record<string, string>,
    });

    if (response.status === 'SUCCESS' && response.data?.circulars) {
      return response.data.circulars.map((circular: any) => this.mapRegulatoryCircular(circular));
    }

    return [];
  }

  public async getRegulatoryCircular(circularId: string): Promise<RegulatoryCircular | null> {
    const response = await this.executeRequest({
      endpoint: `/api/v1/regulatory/circulars/${circularId}`,
      method: 'GET',
    });

    if (response.status === 'SUCCESS' && response.data) {
      return this.mapRegulatoryCircular(response.data);
    }

    return null;
  }

  public async searchRegulatoryCirculars(query: {
    searchText?: string;
    category?: string;
    tags?: string[];
    dateRange?: {
      from: string;
      to: string;
    };
  }): Promise<RegulatoryCircular[]> {
    const response = await this.executeRequest({
      endpoint: '/api/v1/regulatory/circulars/search',
      method: 'POST',
      data: query,
    });

    if (response.status === 'SUCCESS' && response.data?.results) {
      return response.data.results.map((circular: any) => this.mapRegulatoryCircular(circular));
    }

    return [];
  }

  // Master Directives Operations
  public async getMasterDirectives(category?: string): Promise<MasterDirective[]> {
    const response = await this.executeRequest({
      endpoint: '/api/v1/regulatory/master-directives',
      method: 'GET',
      params: category ? { category } : undefined,
    });

    if (response.status === 'SUCCESS' && response.data?.directives) {
      return response.data.directives.map((directive: any) => this.mapMasterDirective(directive));
    }

    return [];
  }

  public async getMasterDirective(directiveId: string): Promise<MasterDirective | null> {
    const response = await this.executeRequest({
      endpoint: `/api/v1/regulatory/master-directives/${directiveId}`,
      method: 'GET',
    });

    if (response.status === 'SUCCESS' && response.data) {
      return this.mapMasterDirective(response.data);
    }

    return null;
  }

  // Compliance Reporting Operations
  public async submitComplianceReport(report: Partial<ComplianceReport>): Promise<RBIResponse> {
    return await this.executeRequest({
      endpoint: '/api/v1/compliance/reports',
      method: 'POST',
      data: this.mapComplianceReportToRBI(report),
    });
  }

  public async getComplianceReport(reportId: string): Promise<ComplianceReport | null> {
    const response = await this.executeRequest({
      endpoint: `/api/v1/compliance/reports/${reportId}`,
      method: 'GET',
    });

    if (response.status === 'SUCCESS' && response.data) {
      return this.mapComplianceReport(response.data);
    }

    return null;
  }

  public async getComplianceReports(params?: {
    reportType?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<ComplianceReport[]> {
    const response = await this.executeRequest({
      endpoint: '/api/v1/compliance/reports',
      method: 'GET',
      params: params as Record<string, string>,
    });

    if (response.status === 'SUCCESS' && response.data?.reports) {
      return response.data.reports.map((report: any) => this.mapComplianceReport(report));
    }

    return [];
  }

  public async updateComplianceReport(reportId: string, updates: Partial<ComplianceReport>): Promise<RBIResponse> {
    return await this.executeRequest({
      endpoint: `/api/v1/compliance/reports/${reportId}`,
      method: 'PUT',
      data: this.mapComplianceReportToRBI(updates),
    });
  }

  public async validateComplianceReport(report: Partial<ComplianceReport>): Promise<RBIResponse> {
    return await this.executeRequest({
      endpoint: '/api/v1/compliance/reports/validate',
      method: 'POST',
      data: this.mapComplianceReportToRBI(report),
    });
  }

  // Regulatory Updates Operations
  public async getRegulatoryUpdates(params?: {
    type?: string;
    category?: string;
    urgency?: string;
    fromDate?: string;
    toDate?: string;
    limit?: number;
  }): Promise<RegulatoryUpdate[]> {
    const response = await this.executeRequest({
      endpoint: '/api/v1/regulatory/updates',
      method: 'GET',
      params: params as Record<string, string>,
    });

    if (response.status === 'SUCCESS' && response.data?.updates) {
      return response.data.updates.map((update: any) => this.mapRegulatoryUpdate(update));
    }

    return [];
  }

  public async subscribeToUpdates(subscription: {
    categories: string[];
    urgencyLevels: string[];
    notificationMethod: 'EMAIL' | 'WEBHOOK' | 'BOTH';
    webhookUrl?: string;
    emailAddress?: string;
  }): Promise<RBIResponse> {
    return await this.executeRequest({
      endpoint: '/api/v1/regulatory/updates/subscribe',
      method: 'POST',
      data: subscription,
    });
  }

  // Data Mapping Methods
  private mapRegulatoryCircular(rbiData: any): RegulatoryCircular {
    return {
      circularId: rbiData.circular_id || rbiData.id,
      circularNumber: rbiData.circular_number || rbiData.number,
      title: rbiData.title,
      category: rbiData.category,
      subCategory: rbiData.sub_category,
      issueDate: rbiData.issue_date,
      effectiveDate: rbiData.effective_date,
      expiryDate: rbiData.expiry_date,
      status: rbiData.status || 'ACTIVE',
      content: rbiData.content || rbiData.text,
      attachments: rbiData.attachments?.map((att: any) => ({
        fileName: att.file_name || att.name,
        fileType: att.file_type || att.type,
        downloadUrl: att.download_url || att.url,
        size: att.size || 0,
      })) || [],
      tags: rbiData.tags || [],
      applicableTo: rbiData.applicable_to || [],
      supersedes: rbiData.supersedes || [],
      amendedBy: rbiData.amended_by || [],
      relatedCirculars: rbiData.related_circulars || [],
    };
  }

  private mapMasterDirective(rbiData: any): MasterDirective {
    return {
      directiveId: rbiData.directive_id || rbiData.id,
      title: rbiData.title,
      category: rbiData.category,
      issueDate: rbiData.issue_date,
      lastUpdated: rbiData.last_updated,
      version: rbiData.version,
      status: rbiData.status || 'CURRENT',
      chapters: rbiData.chapters?.map((chapter: any) => ({
        chapterNumber: chapter.chapter_number || chapter.number,
        title: chapter.title,
        content: chapter.content,
        lastUpdated: chapter.last_updated,
      })) || [],
      annexures: rbiData.annexures?.map((annexure: any) => ({
        annexureNumber: annexure.annexure_number || annexure.number,
        title: annexure.title,
        content: annexure.content,
        downloadUrl: annexure.download_url,
      })) || [],
      applicableTo: rbiData.applicable_to || [],
      keywords: rbiData.keywords || [],
    };
  }

  private mapComplianceReport(rbiData: any): ComplianceReport {
    return {
      reportId: rbiData.report_id || rbiData.id,
      reportType: rbiData.report_type || rbiData.type,
      reportingPeriod: {
        from: rbiData.reporting_period?.from || rbiData.period_from,
        to: rbiData.reporting_period?.to || rbiData.period_to,
      },
      submissionDate: rbiData.submission_date,
      dueDate: rbiData.due_date,
      status: rbiData.status || 'DRAFT',
      bankCode: rbiData.bank_code,
      branchCode: rbiData.branch_code,
      data: rbiData.report_data || rbiData.data || {},
      validationErrors: rbiData.validation_errors?.map((error: any) => ({
        field: error.field,
        error: error.message || error.error,
        severity: error.severity || 'ERROR',
      })) || [],
      submittedBy: rbiData.submitted_by,
      reviewedBy: rbiData.reviewed_by,
      comments: rbiData.comments,
    };
  }

  private mapComplianceReportToRBI(report: Partial<ComplianceReport>): any {
    const rbiData: any = {};

    if (report.reportType) rbiData.report_type = report.reportType;
    if (report.reportingPeriod) {
      rbiData.reporting_period = {
        from: report.reportingPeriod.from,
        to: report.reportingPeriod.to,
      };
    }
    if (report.bankCode) rbiData.bank_code = report.bankCode;
    if (report.branchCode) rbiData.branch_code = report.branchCode;
    if (report.data) rbiData.report_data = report.data;
    if (report.submittedBy) rbiData.submitted_by = report.submittedBy;
    if (report.comments) rbiData.comments = report.comments;

    return rbiData;
  }

  private mapRegulatoryUpdate(rbiData: any): RegulatoryUpdate {
    return {
      updateId: rbiData.update_id || rbiData.id,
      type: rbiData.type,
      title: rbiData.title,
      summary: rbiData.summary,
      publishDate: rbiData.publish_date,
      effectiveDate: rbiData.effective_date,
      urgency: rbiData.urgency || 'MEDIUM',
      category: rbiData.category,
      impactAssessment: rbiData.impact_assessment ? {
        affectedAreas: rbiData.impact_assessment.affected_areas || [],
        complianceActions: rbiData.impact_assessment.compliance_actions || [],
        timeline: rbiData.impact_assessment.timeline,
        riskLevel: rbiData.impact_assessment.risk_level || 'MEDIUM',
      } : undefined,
      documentUrl: rbiData.document_url,
      relatedDocuments: rbiData.related_documents || [],
    };
  }

  public getConnectionStatus(): {
    isConnected: boolean;
    tokenExpiry?: Date;
    rateLimitInfo?: {
      remaining: number;
      reset: number;
    };
  } {
    return {
      isConnected: this.isConnected,
      tokenExpiry: this.tokenExpiry,
      rateLimitInfo: this.rateLimitInfo,
    };
  }

  public async getAPIStatus(): Promise<{
    status: 'OPERATIONAL' | 'DEGRADED' | 'DOWN';
    version: string;
    lastUpdated: string;
    services: Record<string, 'UP' | 'DOWN'>;
  }> {
    try {
      const response = await this.executeRequest({
        endpoint: '/api/v1/status',
        method: 'GET',
      });

      return response.data || {
        status: 'OPERATIONAL',
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        services: {},
      };
    } catch (error) {
      return {
        status: 'DOWN',
        version: 'unknown',
        lastUpdated: new Date().toISOString(),
        services: {},
      };
    }
  }
}

export default RBIConnector;
