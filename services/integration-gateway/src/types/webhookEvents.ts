/**
 * Webhook Event Types
 * Defines standard event types for the RBI Compliance Platform
 */

// Banking Core System Events
export const BANKING_EVENTS = {
  // Customer Events
  CUSTOMER_CREATED: 'banking.customer.created',
  CUSTOMER_UPDATED: 'banking.customer.updated',
  CUSTOMER_DELETED: 'banking.customer.deleted',
  CUSTOMER_KYC_UPDATED: 'banking.customer.kyc_updated',
  CUSTOMER_STATUS_CHANGED: 'banking.customer.status_changed',

  // Account Events
  ACCOUNT_CREATED: 'banking.account.created',
  ACCOUNT_UPDATED: 'banking.account.updated',
  ACCOUNT_CLOSED: 'banking.account.closed',
  ACCOUNT_BLOCKED: 'banking.account.blocked',
  ACCOUNT_UNBLOCKED: 'banking.account.unblocked',
  ACCOUNT_BALANCE_UPDATED: 'banking.account.balance_updated',

  // Transaction Events
  TRANSACTION_CREATED: 'banking.transaction.created',
  TRANSACTION_AUTHORIZED: 'banking.transaction.authorized',
  TRANSACTION_REJECTED: 'banking.transaction.rejected',
  TRANSACTION_SETTLED: 'banking.transaction.settled',
  TRANSACTION_FAILED: 'banking.transaction.failed',
  TRANSACTION_REVERSED: 'banking.transaction.reversed',

  // Loan Events
  LOAN_APPLICATION_CREATED: 'banking.loan.application_created',
  LOAN_APPLICATION_APPROVED: 'banking.loan.application_approved',
  LOAN_APPLICATION_REJECTED: 'banking.loan.application_rejected',
  LOAN_DISBURSED: 'banking.loan.disbursed',
  LOAN_PAYMENT_RECEIVED: 'banking.loan.payment_received',
  LOAN_DEFAULTED: 'banking.loan.defaulted',
} as const;

// Compliance Events
export const COMPLIANCE_EVENTS = {
  // AML Events
  AML_ALERT_CREATED: 'compliance.aml.alert_created',
  AML_ALERT_RESOLVED: 'compliance.aml.alert_resolved',
  AML_CASE_OPENED: 'compliance.aml.case_opened',
  AML_CASE_CLOSED: 'compliance.aml.case_closed',
  AML_SAR_FILED: 'compliance.aml.sar_filed',

  // KYC Events
  KYC_VERIFICATION_STARTED: 'compliance.kyc.verification_started',
  KYC_VERIFICATION_COMPLETED: 'compliance.kyc.verification_completed',
  KYC_VERIFICATION_FAILED: 'compliance.kyc.verification_failed',
  KYC_DOCUMENT_UPLOADED: 'compliance.kyc.document_uploaded',
  KYC_DOCUMENT_VERIFIED: 'compliance.kyc.document_verified',
  KYC_DOCUMENT_REJECTED: 'compliance.kyc.document_rejected',

  // Regulatory Reporting Events
  REPORT_GENERATED: 'compliance.report.generated',
  REPORT_SUBMITTED: 'compliance.report.submitted',
  REPORT_APPROVED: 'compliance.report.approved',
  REPORT_REJECTED: 'compliance.report.rejected',
  REPORT_DEADLINE_APPROACHING: 'compliance.report.deadline_approaching',

  // Audit Events
  AUDIT_LOG_CREATED: 'compliance.audit.log_created',
  AUDIT_TRAIL_EXPORTED: 'compliance.audit.trail_exported',
  AUDIT_REVIEW_STARTED: 'compliance.audit.review_started',
  AUDIT_REVIEW_COMPLETED: 'compliance.audit.review_completed',
} as const;

// Risk Management Events
export const RISK_EVENTS = {
  // Risk Assessment Events
  RISK_ASSESSMENT_CREATED: 'risk.assessment.created',
  RISK_ASSESSMENT_UPDATED: 'risk.assessment.updated',
  RISK_SCORE_CALCULATED: 'risk.score.calculated',
  RISK_THRESHOLD_EXCEEDED: 'risk.threshold.exceeded',
  RISK_PROFILE_UPDATED: 'risk.profile.updated',

  // Credit Risk Events
  CREDIT_SCORE_UPDATED: 'risk.credit.score_updated',
  CREDIT_LIMIT_CHANGED: 'risk.credit.limit_changed',
  CREDIT_EXPOSURE_ALERT: 'risk.credit.exposure_alert',
  CREDIT_DEFAULT_PREDICTED: 'risk.credit.default_predicted',

  // Operational Risk Events
  OPERATIONAL_INCIDENT_CREATED: 'risk.operational.incident_created',
  OPERATIONAL_INCIDENT_RESOLVED: 'risk.operational.incident_resolved',
  OPERATIONAL_LOSS_RECORDED: 'risk.operational.loss_recorded',
  OPERATIONAL_CONTROL_FAILED: 'risk.operational.control_failed',

  // Market Risk Events
  MARKET_RISK_LIMIT_BREACHED: 'risk.market.limit_breached',
  MARKET_VOLATILITY_ALERT: 'risk.market.volatility_alert',
  MARKET_POSITION_UPDATED: 'risk.market.position_updated',
} as const;

// Regulatory Events
export const REGULATORY_EVENTS = {
  // RBI Events
  RBI_CIRCULAR_PUBLISHED: 'regulatory.rbi.circular_published',
  RBI_DIRECTIVE_UPDATED: 'regulatory.rbi.directive_updated',
  RBI_COMPLIANCE_DEADLINE: 'regulatory.rbi.compliance_deadline',
  RBI_PENALTY_IMPOSED: 'regulatory.rbi.penalty_imposed',

  // SEBI Events
  SEBI_REGULATION_UPDATED: 'regulatory.sebi.regulation_updated',
  SEBI_DISCLOSURE_REQUIRED: 'regulatory.sebi.disclosure_required',

  // IRDAI Events
  IRDAI_GUIDELINE_PUBLISHED: 'regulatory.irdai.guideline_published',
  IRDAI_COMPLIANCE_UPDATE: 'regulatory.irdai.compliance_update',

  // General Regulatory Events
  REGULATION_CHANGE_DETECTED: 'regulatory.general.change_detected',
  COMPLIANCE_REQUIREMENT_ADDED: 'regulatory.general.requirement_added',
  REGULATORY_FILING_DUE: 'regulatory.general.filing_due',
} as const;

// System Events
export const SYSTEM_EVENTS = {
  // Integration Events
  INTEGRATION_CONNECTED: 'system.integration.connected',
  INTEGRATION_DISCONNECTED: 'system.integration.disconnected',
  INTEGRATION_ERROR: 'system.integration.error',
  INTEGRATION_SYNC_COMPLETED: 'system.integration.sync_completed',

  // Data Events
  DATA_SYNC_STARTED: 'system.data.sync_started',
  DATA_SYNC_COMPLETED: 'system.data.sync_completed',
  DATA_SYNC_FAILED: 'system.data.sync_failed',
  DATA_TRANSFORMATION_COMPLETED: 'system.data.transformation_completed',
  DATA_VALIDATION_FAILED: 'system.data.validation_failed',

  // Security Events
  SECURITY_BREACH_DETECTED: 'system.security.breach_detected',
  UNAUTHORIZED_ACCESS_ATTEMPT: 'system.security.unauthorized_access',
  AUTHENTICATION_FAILED: 'system.security.authentication_failed',
  PERMISSION_DENIED: 'system.security.permission_denied',

  // Performance Events
  PERFORMANCE_THRESHOLD_EXCEEDED: 'system.performance.threshold_exceeded',
  SYSTEM_OVERLOAD_DETECTED: 'system.performance.overload_detected',
  RESPONSE_TIME_DEGRADED: 'system.performance.response_time_degraded',

  // Maintenance Events
  MAINTENANCE_STARTED: 'system.maintenance.started',
  MAINTENANCE_COMPLETED: 'system.maintenance.completed',
  BACKUP_COMPLETED: 'system.maintenance.backup_completed',
  BACKUP_FAILED: 'system.maintenance.backup_failed',
} as const;

// Webhook System Events
export const WEBHOOK_EVENTS = {
  // Webhook Management Events
  WEBHOOK_ENDPOINT_CREATED: 'webhook.endpoint.created',
  WEBHOOK_ENDPOINT_UPDATED: 'webhook.endpoint.updated',
  WEBHOOK_ENDPOINT_DELETED: 'webhook.endpoint.deleted',
  WEBHOOK_ENDPOINT_ACTIVATED: 'webhook.endpoint.activated',
  WEBHOOK_ENDPOINT_DEACTIVATED: 'webhook.endpoint.deactivated',

  // Webhook Delivery Events
  WEBHOOK_DELIVERY_SUCCESS: 'webhook.delivery.success',
  WEBHOOK_DELIVERY_FAILED: 'webhook.delivery.failed',
  WEBHOOK_DELIVERY_RETRY: 'webhook.delivery.retry',
  WEBHOOK_DELIVERY_ABANDONED: 'webhook.delivery.abandoned',

  // Webhook Testing Events
  WEBHOOK_TEST_STARTED: 'webhook.test.started',
  WEBHOOK_TEST_COMPLETED: 'webhook.test.completed',
  WEBHOOK_TEST_FAILED: 'webhook.test.failed',
} as const;

// All event types combined
export const ALL_EVENT_TYPES = {
  ...BANKING_EVENTS,
  ...COMPLIANCE_EVENTS,
  ...RISK_EVENTS,
  ...REGULATORY_EVENTS,
  ...SYSTEM_EVENTS,
  ...WEBHOOK_EVENTS,
} as const;

// Event categories for grouping
export const EVENT_CATEGORIES = {
  BANKING: 'banking',
  COMPLIANCE: 'compliance',
  RISK: 'risk',
  REGULATORY: 'regulatory',
  SYSTEM: 'system',
  WEBHOOK: 'webhook',
} as const;

// Event priority levels
export const EVENT_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

// Event data schemas for validation
export interface BaseEventData {
  timestamp: string;
  source: string;
  version: string;
  correlationId?: string;
  userId?: string;
  organizationId?: string;
}

export interface BankingEventData extends BaseEventData {
  customerId?: string;
  accountId?: string;
  transactionId?: string;
  amount?: number;
  currency?: string;
  branchCode?: string;
}

export interface ComplianceEventData extends BaseEventData {
  caseId?: string;
  alertId?: string;
  reportId?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  complianceOfficerId?: string;
  regulatoryRequirement?: string;
}

export interface RiskEventData extends BaseEventData {
  riskType: 'credit' | 'operational' | 'market' | 'liquidity';
  riskScore?: number;
  threshold?: number;
  assessmentId?: string;
  mitigationActions?: string[];
}

export interface RegulatoryEventData extends BaseEventData {
  regulator: 'rbi' | 'sebi' | 'irdai' | 'other';
  circularId?: string;
  directiveId?: string;
  effectiveDate?: string;
  complianceDeadline?: string;
  impactLevel?: 'low' | 'medium' | 'high';
}

export interface SystemEventData extends BaseEventData {
  component: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  errorCode?: string;
  errorMessage?: string;
  performanceMetrics?: Record<string, number>;
}

export interface WebhookEventData extends BaseEventData {
  webhookId?: string;
  deliveryId?: string;
  endpointUrl?: string;
  eventType?: string;
  deliveryAttempt?: number;
  responseStatus?: number;
  responseTime?: number;
}

// Type guards for event data
export const isEventType = (eventType: string): eventType is keyof typeof ALL_EVENT_TYPES => {
  return Object.values(ALL_EVENT_TYPES).includes(eventType as any);
};

export const getEventCategory = (eventType: string): string | null => {
  if (eventType.startsWith('banking.')) return EVENT_CATEGORIES.BANKING;
  if (eventType.startsWith('compliance.')) return EVENT_CATEGORIES.COMPLIANCE;
  if (eventType.startsWith('risk.')) return EVENT_CATEGORIES.RISK;
  if (eventType.startsWith('regulatory.')) return EVENT_CATEGORIES.REGULATORY;
  if (eventType.startsWith('system.')) return EVENT_CATEGORIES.SYSTEM;
  if (eventType.startsWith('webhook.')) return EVENT_CATEGORIES.WEBHOOK;
  return null;
};

export const getEventPriority = (eventType: string): string => {
  // Define priority mapping based on event types
  const highPriorityEvents = [
    COMPLIANCE_EVENTS.AML_ALERT_CREATED,
    RISK_EVENTS.RISK_THRESHOLD_EXCEEDED,
    SYSTEM_EVENTS.SECURITY_BREACH_DETECTED,
    BANKING_EVENTS.TRANSACTION_FAILED,
  ];

  const criticalEvents = [
    SYSTEM_EVENTS.SECURITY_BREACH_DETECTED,
    COMPLIANCE_EVENTS.AML_SAR_FILED,
    RISK_EVENTS.CREDIT_DEFAULT_PREDICTED,
  ];

  if (criticalEvents.includes(eventType as any)) return EVENT_PRIORITIES.CRITICAL;
  if (highPriorityEvents.includes(eventType as any)) return EVENT_PRIORITIES.HIGH;
  if (eventType.includes('alert') || eventType.includes('failed') || eventType.includes('rejected')) {
    return EVENT_PRIORITIES.HIGH;
  }
  if (eventType.includes('created') || eventType.includes('updated')) {
    return EVENT_PRIORITIES.MEDIUM;
  }
  return EVENT_PRIORITIES.LOW;
};
