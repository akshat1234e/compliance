# Regulatory Intelligence Service - REST API Specification

## Overview

The Regulatory Intelligence Service provides comprehensive REST API endpoints for regulatory compliance management, including circular analysis, impact assessment, timeline mapping, and notification services.

**Base URL**: `https://api.compliance.platform/regulatory-intelligence/api/v1`

**Authentication**: Bearer Token (JWT)

**Content Type**: `application/json`

## API Endpoints Summary

### 1. Regulations Management (`/regulations`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/regulations` | List all regulations with pagination and filtering | Yes |
| GET | `/regulations/:id` | Get specific regulation details | Yes |
| POST | `/regulations/search` | Full-text search regulations | Yes |
| GET | `/regulations/:id/requirements` | Get compliance requirements for regulation | Yes |
| GET | `/regulations/:id/timeline` | Get regulatory timeline and deadlines | Yes |

### 2. RBI Circulars (`/circulars`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/circulars` | List RBI circulars with filtering | Yes |
| GET | `/circulars/:id` | Get circular details with AI analysis | Yes |
| POST | `/circulars` | Create new circular (admin only) | Yes |

### 3. Regulatory Changes (`/changes`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/changes` | List regulatory changes | Yes |
| GET | `/changes/:id` | Get change details with impact assessment | Yes |

### 4. Impact Analysis (`/impact`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/impact/analyze` | Perform AI-powered impact analysis | Yes |
| GET | `/impact/:assessmentId` | Get impact assessment results | Yes |
| GET | `/impact/summary/:organizationId` | Get organization impact summary | Yes |
| POST | `/impact/compare` | Compare multiple impact assessments | Yes |
| POST | `/impact/cache/clear` | Clear assessment cache (admin) | Yes |

### 5. Web Scraping (`/scraper`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/scraper/scrape` | Trigger manual scraping | Yes |
| GET | `/scraper/status` | Get scraping status and statistics | Yes |
| POST | `/scraper/download` | Download specific circular content | Yes |
| GET | `/scraper/test` | Test scraping connectivity | Yes |
| POST | `/scraper/reset-stats` | Reset scraping statistics | Yes |

### 6. NLP Parser (`/parser`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/parser/parse` | Parse single circular | Yes |
| POST | `/parser/parse/batch` | Parse multiple circulars (max 10) | Yes |
| POST | `/parser/extract` | Extract specific elements | Yes |
| POST | `/parser/analyze` | Analyze content only | Yes |

### 7. Notifications (`/notifications`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/notifications/send` | Send custom notification | Yes |
| POST | `/notifications/regulatory-change` | Send regulatory change alert | Yes |
| POST | `/notifications/compliance-deadline` | Send deadline notification | Yes |
| POST | `/notifications/risk-alert` | Send risk alert | Yes |
| GET | `/notifications/result/:notificationId` | Get notification status | Yes |
| GET | `/notifications/stats` | Get notification statistics | Yes |
| POST | `/notifications/process-scheduled` | Process scheduled notifications | Yes |
| POST | `/notifications/clear-history` | Clear notification history | Yes |

### 8. Timeline Mapping (`/timeline`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/timeline/generate` | Generate timeline from circular | Yes |
| GET | `/timeline/:timelineId` | Get timeline mapping | Yes |
| PATCH | `/timeline/:timelineId/events/:eventId/status` | Update event status | Yes |
| GET | `/timeline/stats/overview` | Get timeline statistics | Yes |
| GET | `/timeline/organization/:organizationId` | Get organization timeline | Yes |
| POST | `/timeline/cache/clear` | Clear timeline cache | Yes |

### 9. Health Monitoring (`/health`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Basic health check | No |
| GET | `/health/detailed` | Detailed health status | Yes |
| GET | `/health/ready` | Readiness probe | No |
| GET | `/health/live` | Liveness probe | No |

## Authentication & Authorization

### JWT Token Structure
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "organizationId": "org-uuid",
  "roles": ["compliance_manager", "admin"],
  "permissions": ["regulations:read", "regulations:write"],
  "iat": 1640995200,
  "exp": 1641081600
}
```

### Required Permissions

| Endpoint Group | Required Permissions |
|----------------|---------------------|
| Regulations | `regulations:read`, `regulations:write` |
| Impact Analysis | `compliance:read`, `impact:analyze` |
| Scraping | `scraper:execute`, `scraper:read` |
| Parser | `parser:execute`, `parser:read` |
| Notifications | `notifications:send`, `notifications:read` |
| Timeline | `timeline:create`, `timeline:read`, `timeline:write` |
| Admin Functions | `admin` |

## Request/Response Format

### Standard Response Structure
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "metadata": {
    "requestId": "req-uuid",
    "timestamp": "2024-01-15T10:30:00Z",
    "processingTime": "150ms"
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response Structure
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "organizationType",
        "message": "Must be one of: bank, nbfc, cooperative_bank"
      }
    ]
  },
  "metadata": {
    "requestId": "req-uuid",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## Rate Limiting

- **Default**: 100 requests per minute per user
- **Scraping endpoints**: 10 requests per minute
- **Analysis endpoints**: 20 requests per minute
- **Admin endpoints**: 50 requests per minute

Rate limit headers included in responses:
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Remaining requests in window
- `X-RateLimit-Reset`: Window reset time (Unix timestamp)

## Pagination

Query parameters for paginated endpoints:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sort`: Sort field (default: varies by endpoint)
- `order`: Sort order (`asc` or `desc`, default: `desc`)

## Filtering & Search

Common query parameters:
- `search`: Full-text search query
- `category`: Filter by category
- `status`: Filter by status
- `startDate`: Filter from date (ISO 8601)
- `endDate`: Filter to date (ISO 8601)
- `organizationId`: Filter by organization
- `priority`: Filter by priority level

## HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET, PATCH requests |
| 201 | Created | Successful POST requests |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 502 | Bad Gateway | Upstream service error |
| 503 | Service Unavailable | Service temporarily unavailable |

## Webhooks

The service supports webhook notifications for real-time events:

### Webhook Events
- `circular.published`: New RBI circular published
- `impact.assessed`: Impact assessment completed
- `deadline.approaching`: Compliance deadline approaching
- `risk.detected`: High-risk situation detected
- `timeline.updated`: Timeline event status changed

### Webhook Payload Structure
```json
{
  "event": "circular.published",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "circularId": "RBI/2024/001",
    "title": "Capital Adequacy Guidelines",
    "impactLevel": "high",
    "affectedOrganizations": ["org-uuid-1", "org-uuid-2"]
  },
  "metadata": {
    "source": "regulatory-intelligence-service",
    "version": "1.0"
  }
}
```

## SDK & Client Libraries

Official SDKs available for:
- **JavaScript/TypeScript**: `@compliance-platform/regulatory-intelligence-sdk`
- **Python**: `compliance-platform-regulatory-intelligence`
- **Java**: `com.compliance.platform.regulatory-intelligence`
- **C#**: `CompliancePlatform.RegulatoryIntelligence`

## API Versioning

- Current version: `v1`
- Version specified in URL path: `/api/v1/`
- Backward compatibility maintained for 12 months
- Deprecation notices provided 6 months in advance

## Security Considerations

1. **HTTPS Only**: All API calls must use HTTPS
2. **JWT Expiration**: Tokens expire after 24 hours
3. **Request Signing**: Optional HMAC request signing for high-security environments
4. **IP Whitelisting**: Available for enterprise customers
5. **Audit Logging**: All API calls are logged for compliance
6. **Data Encryption**: Sensitive data encrypted at rest and in transit

## Support & Documentation

- **API Documentation**: Available at `/docs` endpoint
- **OpenAPI Specification**: Available at `/openapi.json`
- **Postman Collection**: Available for download
- **Support**: support@compliance-platform.com
- **Status Page**: https://status.compliance-platform.com
