// =============================================================================
// API CONSTANTS
// =============================================================================

export const API_VERSIONS = {
  V1: 'v1',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const API_ENDPOINTS = {
  REGULATORY: {
    BASE: '/api/v1/regulations',
    CHANGES: '/api/v1/regulations/changes',
    IMPACT_ANALYSIS: '/api/v1/regulations/impact-analysis',
    TIMELINE: '/api/v1/regulations/timeline',
  },
  COMPLIANCE: {
    BASE: '/api/v1/compliance',
    WORKFLOWS: '/api/v1/workflows',
    TASKS: '/api/v1/compliance/tasks',
    APPROVALS: '/api/v1/approvals',
  },
  DOCUMENTS: {
    BASE: '/api/v1/documents',
    UPLOAD: '/api/v1/documents/upload',
    CLASSIFY: '/api/v1/documents/classify',
    TEMPLATES: '/api/v1/templates',
  },
  REPORTS: {
    BASE: '/api/v1/reports',
    GENERATE: '/api/v1/reports/generate',
    SCHEDULE: '/api/v1/reports/schedule',
    ANALYTICS: '/api/v1/analytics',
  },
  RISK: {
    BASE: '/api/v1/risk',
    ASSESS: '/api/v1/risk/assess',
    PREDICTIONS: '/api/v1/risk/predictions',
    SCENARIOS: '/api/v1/risk/scenarios',
  },
  INTEGRATIONS: {
    BASE: '/api/v1/integrations',
    BANKS: '/api/v1/integrations/banks',
    CONFIGURE: '/api/v1/integrations/configure',
  },
} as const;
