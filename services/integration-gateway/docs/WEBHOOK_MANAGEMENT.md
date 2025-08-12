# Webhook Management System

The Integration Gateway includes a comprehensive webhook management system that enables secure, reliable webhook delivery with advanced features like signature validation, retry mechanisms, event filtering, and real-time monitoring.

## Features

### 🔐 **Security**
- **Signature Validation**: HMAC-based signature validation (SHA256, SHA1, MD5)
- **API Key Authentication**: Secure API key-based authentication
- **Rate Limiting**: Configurable rate limiting per endpoint
- **SSL/TLS Support**: Secure webhook delivery over HTTPS

### 🔄 **Reliability**
- **Retry Mechanisms**: Configurable exponential backoff retry policies
- **Delivery Tracking**: Complete delivery history and status tracking
- **Error Handling**: Comprehensive error handling and logging
- **Circuit Breaker**: Automatic endpoint deactivation on repeated failures

### 📊 **Monitoring & Analytics**
- **Real-time Statistics**: Delivery success rates, response times, error rates
- **Event Filtering**: Advanced event filtering based on custom conditions
- **Performance Metrics**: Detailed performance monitoring and alerting
- **Audit Logging**: Complete audit trail for all webhook activities

### 🎯 **Event Management**
- **Auto Event Publishing**: Automatic event publishing from banking operations
- **Event Transformation**: Configurable data transformation for events
- **Event Buffering**: Efficient event batching and buffering
- **Event Categories**: Organized event types for banking, compliance, risk, and regulatory

## API Endpoints

### Webhook Endpoint Management

#### Create Webhook Endpoint
```http
POST /api/webhooks/endpoints
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Customer Events Webhook",
  "url": "https://your-app.com/webhooks/customer-events",
  "secret": "your-webhook-secret",
  "events": [
    "banking.customer.created",
    "banking.customer.updated",
    "banking.customer.kyc_updated"
  ],
  "timeout": 30000,
  "retryPolicy": {
    "maxAttempts": 3,
    "backoffMultiplier": 2,
    "initialDelay": 1000,
    "maxDelay": 60000
  },
  "signatureHeader": "X-Webhook-Signature",
  "signatureAlgorithm": "sha256",
  "headers": {
    "X-Custom-Header": "custom-value"
  }
}
```

#### List Webhook Endpoints
```http
GET /api/webhooks/endpoints
Authorization: Bearer <token>
```

#### Get Webhook Endpoint
```http
GET /api/webhooks/endpoints/{id}
Authorization: Bearer <token>
```

#### Update Webhook Endpoint
```http
PUT /api/webhooks/endpoints/{id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Updated Customer Events Webhook",
  "isActive": true,
  "events": [
    "banking.customer.created",
    "banking.customer.updated",
    "banking.customer.deleted"
  ]
}
```

#### Delete Webhook Endpoint
```http
DELETE /api/webhooks/endpoints/{id}
Authorization: Bearer <token>
```

#### Test Webhook Endpoint
```http
POST /api/webhooks/endpoints/{id}/test
Authorization: Bearer <token>
```

### Event Publishing

#### Publish Event
```http
POST /api/webhooks/events
Content-Type: application/json
Authorization: Bearer <token>

{
  "type": "banking.customer.created",
  "source": "temenos-connector",
  "data": {
    "customerId": "CUST123456",
    "customerName": "John Doe",
    "accountNumber": "ACC789012",
    "branchCode": "BR001",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "metadata": {
    "correlationId": "req-123",
    "userId": "user-456"
  }
}
```

### Delivery Management

#### Get Deliveries
```http
GET /api/webhooks/deliveries?webhookId={id}&status=pending&limit=100
Authorization: Bearer <token>
```

#### Get Delivery Details
```http
GET /api/webhooks/deliveries/{id}
Authorization: Bearer <token>
```

### Statistics

#### Get Overall Statistics
```http
GET /api/webhooks/stats
Authorization: Bearer <token>
```

#### Get Endpoint Statistics
```http
GET /api/webhooks/endpoints/{id}/stats
Authorization: Bearer <token>
```

## Event Types

### Banking Events
- `banking.customer.created` - New customer created
- `banking.customer.updated` - Customer information updated
- `banking.customer.kyc_updated` - Customer KYC status updated
- `banking.account.created` - New account opened
- `banking.account.closed` - Account closed
- `banking.transaction.created` - New transaction processed
- `banking.transaction.failed` - Transaction failed

### Compliance Events
- `compliance.aml.alert_created` - AML alert generated
- `compliance.kyc.verification_completed` - KYC verification completed
- `compliance.report.submitted` - Compliance report submitted
- `compliance.audit.review_started` - Audit review initiated

### Risk Events
- `risk.assessment.created` - Risk assessment performed
- `risk.threshold.exceeded` - Risk threshold breached
- `risk.credit.score_updated` - Credit score updated

### Regulatory Events
- `regulatory.rbi.circular_published` - RBI circular published
- `regulatory.compliance.deadline` - Compliance deadline approaching

### System Events
- `system.integration.connected` - Integration established
- `system.security.breach_detected` - Security breach detected
- `system.performance.threshold_exceeded` - Performance threshold exceeded

## Webhook Payload Format

All webhook payloads follow a consistent format:

```json
{
  "id": "event_1642248600_abc123",
  "type": "banking.customer.created",
  "source": "temenos-connector",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "customerId": "CUST123456",
    "customerName": "John Doe",
    "accountNumber": "ACC789012",
    "branchCode": "BR001"
  },
  "metadata": {
    "category": "banking",
    "priority": "medium",
    "correlationId": "req-123",
    "publishedAt": "2024-01-15T10:30:00Z"
  }
}
```

## Signature Validation

Webhooks include HMAC signatures for security validation:

### Signature Header
```
X-Webhook-Signature: sha256=a1b2c3d4e5f6...
```

### Validation Example (Node.js)
```javascript
const crypto = require('crypto');

function validateSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  const expected = `sha256=${expectedSignature}`;
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

## Configuration

### Environment Variables

```bash
# Webhook System Configuration
ENABLE_AUTO_WEBHOOK_EVENTS=true
WEBHOOK_EVENT_BUFFER_SIZE=1000
WEBHOOK_EVENT_BATCH_SIZE=10
WEBHOOK_EVENT_FLUSH_INTERVAL=5000
ENABLE_WEBHOOK_EVENT_FILTERING=true
ENABLE_WEBHOOK_EVENT_TRANSFORMATION=false

# Webhook API Keys
WEBHOOK_API_KEY_1=your-webhook-api-key-1
WEBHOOK_API_KEY_2=your-webhook-api-key-2

# Basic Webhook Settings
WEBHOOKS_ENABLE=true
WEBHOOKS_MAX_PAYLOAD_SIZE=5242880
WEBHOOKS_TIMEOUT=10000
WEBHOOKS_RETRY_ATTEMPTS=3
WEBHOOKS_RETRY_DELAY=1000
WEBHOOKS_ENABLE_SIGNATURE_VALIDATION=true
```

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "url",
      "message": "Valid URL is required",
      "value": "invalid-url"
    }
  ]
}
```

#### 401 Unauthorized
```json
{
  "error": "Invalid API key"
}
```

#### 429 Rate Limited
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests, please try again later",
  "retryAfter": 60
}
```

## Best Practices

### 1. **Endpoint Security**
- Use HTTPS endpoints only
- Validate webhook signatures
- Implement proper authentication
- Use strong, unique secrets

### 2. **Error Handling**
- Return appropriate HTTP status codes
- Implement idempotency for webhook handlers
- Handle duplicate deliveries gracefully
- Log webhook processing for debugging

### 3. **Performance**
- Process webhooks asynchronously
- Respond quickly (< 5 seconds)
- Implement proper timeout handling
- Use appropriate retry policies

### 4. **Monitoring**
- Monitor delivery success rates
- Set up alerts for failed deliveries
- Track response times
- Monitor endpoint health

## Troubleshooting

### Common Issues

1. **Webhook Not Receiving Events**
   - Check endpoint URL accessibility
   - Verify event type subscriptions
   - Check webhook endpoint status (active/inactive)
   - Review event filters

2. **Signature Validation Failures**
   - Verify secret key configuration
   - Check signature algorithm (sha256, sha1, md5)
   - Ensure payload is not modified
   - Validate signature header format

3. **High Failure Rates**
   - Check endpoint response times
   - Verify endpoint returns 2xx status codes
   - Review error logs for specific issues
   - Consider adjusting retry policies

4. **Performance Issues**
   - Monitor webhook processing times
   - Check for endpoint timeouts
   - Review event buffer and batch sizes
   - Consider implementing event filtering

For additional support, check the logs at `/api/webhooks/deliveries` for detailed delivery information and error messages.
