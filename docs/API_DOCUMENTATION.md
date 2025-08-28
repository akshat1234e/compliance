# RBI Compliance Platform - API Documentation

Comprehensive API documentation for the RBI Compliance Platform with interactive examples and testing capabilities.

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Rate Limiting](#rate-limiting)
4. [Error Handling](#error-handling)
5. [Gateway API](#gateway-api)
6. [Authentication API](#authentication-api)
7. [Monitoring API](#monitoring-api)
8. [Webhook API](#webhook-api)
9. [Compliance API](#compliance-api)
10. [Regulatory API](#regulatory-api)
11. [Document API](#document-api)
12. [Risk API](#risk-api)
13. [SDK and Libraries](#sdk-and-libraries)
14. [Testing and Examples](#testing-and-examples)

## API Overview

### Base URLs

- **Production**: `https://api.rbi-compliance.com`
- **Staging**: `https://staging-api.rbi-compliance.com`
- **Development**: `http://localhost:3000`

### API Versioning

All APIs are versioned using URL path versioning:
```
https://api.rbi-compliance.com/v1/endpoint
```

Current version: **v1**

### Content Types

- **Request**: `application/json`
- **Response**: `application/json`
- **File Upload**: `multipart/form-data`

### HTTP Methods

- **GET**: Retrieve data
- **POST**: Create new resources
- **PUT**: Update existing resources
- **PATCH**: Partial updates
- **DELETE**: Remove resources

## Authentication

### JWT Bearer Token

All API requests require authentication using JWT Bearer tokens.

```http
Authorization: Bearer <your-jwt-token>
```

### Obtaining Access Tokens

#### Login Endpoint

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "role": "admin"
    }
  }
}
```

#### Token Refresh

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### OAuth 2.0 Flow

#### Authorization Code Flow

1. **Authorization Request**
```http
GET /oauth/authorize?response_type=code&client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=read write&state=STATE
```

2. **Token Exchange**
```http
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code=AUTH_CODE&client_id=CLIENT_ID&client_secret=CLIENT_SECRET&redirect_uri=REDIRECT_URI
```

## Rate Limiting

### Rate Limits

- **Standard Users**: 1000 requests per hour
- **Premium Users**: 5000 requests per hour
- **Enterprise Users**: 10000 requests per hour

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 3600 seconds.",
    "details": {
      "limit": 1000,
      "remaining": 0,
      "resetTime": "2024-01-01T12:00:00Z"
    }
  }
}
```

## Error Handling

### Standard Error Response

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "Additional error details"
    },
    "timestamp": "2024-01-01T12:00:00Z",
    "requestId": "req_123456789"
  }
}
```

### HTTP Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **409**: Conflict
- **422**: Validation Error
- **429**: Rate Limit Exceeded
- **500**: Internal Server Error

### Common Error Codes

- `INVALID_REQUEST`: Malformed request
- `AUTHENTICATION_FAILED`: Invalid credentials
- `AUTHORIZATION_FAILED`: Insufficient permissions
- `RESOURCE_NOT_FOUND`: Requested resource not found
- `VALIDATION_ERROR`: Request validation failed
- `RATE_LIMIT_EXCEEDED`: Too many requests

## Gateway API

### Get Connector Status

```http
GET /api/gateway/connectors/status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "temenos_t24",
      "name": "Temenos T24",
      "status": "online",
      "lastSync": "2024-01-01T12:00:00Z",
      "responseTime": 150,
      "errorRate": 0.01,
      "uptime": 99.9
    }
  ]
}
```

### Test Connector

```http
POST /api/gateway/connectors/{connectorId}/test
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "success",
    "responseTime": 120,
    "message": "Connection test successful"
  }
}
```

### Get Banking Data

```http
GET /api/gateway/banking/accounts
Authorization: Bearer <token>
Query Parameters:
- limit: number (default: 50)
- offset: number (default: 0)
- accountType: string
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "accountNumber": "1234567890",
        "accountType": "savings",
        "balance": 50000.00,
        "currency": "INR",
        "status": "active"
      }
    ],
    "pagination": {
      "total": 100,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

## Authentication API

### User Registration

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "analyst"
}
```

### Password Reset

```http
POST /api/auth/password-reset
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Logout

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

### Get User Profile

```http
GET /api/auth/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "admin",
    "permissions": ["read", "write", "admin"],
    "lastLogin": "2024-01-01T12:00:00Z"
  }
}
```

## Monitoring API

### Get System Health

```http
GET /api/monitoring/health
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "services": {
      "database": "healthy",
      "cache": "healthy",
      "messageQueue": "healthy"
    },
    "metrics": {
      "cpuUsage": 45.2,
      "memoryUsage": 67.8,
      "diskUsage": 23.1
    }
  }
}
```

### Get Performance Metrics

```http
GET /api/monitoring/metrics
Authorization: Bearer <token>
Query Parameters:
- timeRange: string (1h, 24h, 7d, 30d)
- metric: string (cpu, memory, response_time)
```

### Get Alerts

```http
GET /api/monitoring/alerts
Authorization: Bearer <token>
Query Parameters:
- severity: string (critical, warning, info)
- status: string (active, resolved)
- limit: number
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "alert_123",
      "severity": "warning",
      "message": "High CPU usage detected",
      "timestamp": "2024-01-01T12:00:00Z",
      "status": "active",
      "source": "system_monitor"
    }
  ]
}
```

## Webhook API

### List Webhook Endpoints

```http
GET /api/webhooks/endpoints
Authorization: Bearer <token>
```

### Create Webhook Endpoint

```http
POST /api/webhooks/endpoints
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Transaction Notifications",
  "url": "https://your-app.com/webhooks/transactions",
  "events": ["transaction.created", "transaction.updated"],
  "secret": "your-webhook-secret",
  "isActive": true
}
```

### Get Webhook Deliveries

```http
GET /api/webhooks/deliveries
Authorization: Bearer <token>
Query Parameters:
- endpointId: string
- status: string (success, failed, pending)
- limit: number
```

### Retry Webhook Delivery

```http
POST /api/webhooks/deliveries/{deliveryId}/retry
Authorization: Bearer <token>
```

## Compliance API

### Get Workflows

```http
GET /api/compliance/workflows
Authorization: Bearer <token>
Query Parameters:
- status: string (active, completed, draft)
- assignee: string
- limit: number
```

### Create Workflow

```http
POST /api/compliance/workflows
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "KYC Compliance Workflow",
  "description": "Customer verification process",
  "steps": [
    {
      "name": "Document Collection",
      "assignee": "kyc_team",
      "dueDate": "2024-02-01T00:00:00Z"
    }
  ]
}
```

### Get Tasks

```http
GET /api/compliance/tasks
Authorization: Bearer <token>
Query Parameters:
- status: string (pending, in_progress, completed)
- assignee: string
- workflowId: string
```

### Update Task Status

```http
PATCH /api/compliance/tasks/{taskId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "completed",
  "notes": "Task completed successfully"
}
```

## Regulatory API

### Get RBI Circulars

```http
GET /api/regulatory/circulars
Authorization: Bearer <token>
Query Parameters:
- search: string
- status: string (pending, compliant, non_compliant)
- category: string
- priority: string (high, medium, low)
- limit: number
- offset: number
```

**Response:**
```json
{
  "success": true,
  "data": {
    "circulars": [
      {
        "id": "RBI/2024/001",
        "title": "Guidelines on Digital Payment Security",
        "category": "Digital Payments",
        "issuedDate": "2024-01-15",
        "effectiveDate": "2024-04-01",
        "priority": "high",
        "status": "pending",
        "complianceDeadline": "2024-03-31"
      }
    ],
    "pagination": {
      "total": 50,
      "limit": 20,
      "offset": 0
    }
  }
}
```

### Get Circular Details

```http
GET /api/regulatory/circulars/{circularId}
Authorization: Bearer <token>
```

### Update Circular Status

```http
PUT /api/regulatory/circulars/{circularId}/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "compliant",
  "notes": "All requirements implemented"
}
```

### Get Impact Analysis

```http
GET /api/regulatory/circulars/{circularId}/impact-analysis
Authorization: Bearer <token>
```

### Create Compliance Task

```http
POST /api/regulatory/compliance-tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "circularId": "RBI/2024/001",
  "title": "Implement multi-factor authentication",
  "description": "Add MFA to all digital payment interfaces",
  "assignee": "it_security_team",
  "dueDate": "2024-03-15T00:00:00Z",
  "priority": "high"
}
```

## Document API

### Upload Document

```http
POST /api/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary-file-data>
category: "compliance"
tags: "kyc,customer-verification"
```

### Get Documents

```http
GET /api/documents
Authorization: Bearer <token>
Query Parameters:
- category: string
- tags: string (comma-separated)
- search: string
- limit: number
```

### Get Document Content

```http
GET /api/documents/{documentId}/content
Authorization: Bearer <token>
```

### Search Documents

```http
POST /api/documents/search
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "compliance policy",
  "filters": {
    "category": "policy",
    "dateRange": {
      "from": "2024-01-01",
      "to": "2024-12-31"
    }
  }
}
```

## Risk API

### Get Risk Assessments

```http
GET /api/risk/assessments
Authorization: Bearer <token>
```

### Create Risk Assessment

```http
POST /api/risk/assessments
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Credit Risk Assessment",
  "type": "credit_risk",
  "scope": "customer_portfolio",
  "assessmentDate": "2024-01-01T00:00:00Z"
}
```

### Get Risk Metrics

```http
GET /api/risk/metrics
Authorization: Bearer <token>
Query Parameters:
- riskType: string (credit, operational, market)
- timeRange: string (1m, 3m, 6m, 1y)
```

## SDK and Libraries

### JavaScript/Node.js SDK

```bash
npm install @rbi-compliance/sdk
```

```javascript
import { RBIComplianceClient } from '@rbi-compliance/sdk';

const client = new RBIComplianceClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.rbi-compliance.com'
});

// Get connector status
const connectors = await client.gateway.getConnectorStatus();

// Get RBI circulars
const circulars = await client.regulatory.getCirculars({
  status: 'pending',
  limit: 10
});
```

### Python SDK

```bash
pip install rbi-compliance-sdk
```

```python
from rbi_compliance import RBIComplianceClient

client = RBIComplianceClient(
    api_key='your-api-key',
    base_url='https://api.rbi-compliance.com'
)

# Get system health
health = client.monitoring.get_health()

# Create compliance task
task = client.compliance.create_task({
    'title': 'Review KYC documents',
    'assignee': 'compliance_team',
    'due_date': '2024-02-01T00:00:00Z'
})
```

### cURL Examples

#### Get Connector Status
```bash
curl -X GET \
  https://api.rbi-compliance.com/api/gateway/connectors/status \
  -H 'Authorization: Bearer your-jwt-token' \
  -H 'Content-Type: application/json'
```

#### Create Webhook Endpoint
```bash
curl -X POST \
  https://api.rbi-compliance.com/api/webhooks/endpoints \
  -H 'Authorization: Bearer your-jwt-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Transaction Alerts",
    "url": "https://your-app.com/webhooks",
    "events": ["transaction.created"]
  }'
```

## Testing and Examples

### Postman Collection

Download our comprehensive Postman collection:
- [RBI Compliance API Collection](https://api.rbi-compliance.com/postman/collection.json)

### Interactive API Explorer

Access our interactive API documentation:
- [API Explorer](https://api.rbi-compliance.com/docs)

### Test Environment

Use our test environment for development:
- **Base URL**: `https://test-api.rbi-compliance.com`
- **Test Credentials**: Available in developer portal

### Sample Applications

Explore sample applications demonstrating API usage:
- [Node.js Sample App](https://github.com/rbi-compliance/nodejs-sample)
- [Python Sample App](https://github.com/rbi-compliance/python-sample)
- [React Dashboard](https://github.com/rbi-compliance/react-dashboard)

### Webhooks Testing

Test webhook endpoints using our webhook testing tool:
- [Webhook Tester](https://api.rbi-compliance.com/webhook-tester)

---

## Support and Resources

### Developer Support
- **Email**: developers@rbi-compliance.com
- **Documentation**: https://docs.rbi-compliance.com
- **Status Page**: https://status.rbi-compliance.com

### Community
- **Developer Forum**: https://community.rbi-compliance.com
- **GitHub**: https://github.com/rbi-compliance
- **Stack Overflow**: Tag `rbi-compliance`

### Updates and Changelog
- **API Changelog**: https://api.rbi-compliance.com/changelog
- **Breaking Changes**: https://api.rbi-compliance.com/breaking-changes
- **Migration Guides**: https://docs.rbi-compliance.com/migrations
