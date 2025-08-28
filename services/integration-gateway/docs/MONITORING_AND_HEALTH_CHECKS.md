# Integration Monitoring and Health Checks

The Integration Gateway includes a comprehensive monitoring and health check system that provides real-time visibility into system health, performance metrics, and connector status.

## Features

### 🏥 **Health Check System**
- **Automated Health Checks**: Configurable health checks for all system components
- **Multiple Check Types**: HTTP, database, connector, service, and custom health checks
- **Real-time Monitoring**: Continuous monitoring with configurable intervals
- **Health Status Tracking**: Detailed health status with response times and error tracking

### 📊 **Performance Monitoring**
- **Connector Metrics**: Individual connector performance and reliability metrics
- **System Metrics**: CPU, memory, and overall system performance tracking
- **Response Time Analysis**: P50, P95, P99 response time percentiles
- **Throughput Monitoring**: Request rate and processing capacity tracking

### 🚨 **Alerting System**
- **Intelligent Alerts**: Configurable alerts based on performance thresholds
- **Alert Severity Levels**: Critical, high, medium, and low severity classifications
- **Alert Resolution**: Manual and automatic alert resolution tracking
- **Alert History**: Complete audit trail of all alerts and resolutions

### 📈 **Dashboard & Analytics**
- **Real-time Dashboard**: Comprehensive system overview with key metrics
- **Historical Data**: Configurable data retention for trend analysis
- **Performance Trends**: Visual representation of system performance over time
- **Connector Health Overview**: Status summary for all banking connectors

## API Endpoints

### Health Check Management

#### Get System Health
```http
GET /api/monitoring/health
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600000,
  "version": "1.0.0",
  "environment": "production",
  "checks": [
    {
      "id": "database",
      "name": "Database Connection",
      "status": "healthy",
      "responseTime": 15,
      "timestamp": "2024-01-15T10:30:00Z",
      "details": {
        "message": "Database connection is healthy"
      }
    }
  ],
  "summary": {
    "total": 5,
    "healthy": 4,
    "unhealthy": 0,
    "degraded": 1,
    "unknown": 0
  },
  "performance": {
    "averageResponseTime": 125,
    "totalRequests": 1500,
    "errorRate": 0.02,
    "memoryUsage": {
      "used": 134217728,
      "total": 268435456,
      "percentage": 50.0
    },
    "cpuUsage": 25.5
  }
}
```

#### Create Health Check
```http
POST /api/monitoring/health/checks
Content-Type: application/json
Authorization: Bearer <token>

{
  "id": "external-api",
  "name": "External API Health Check",
  "type": "http",
  "config": {
    "url": "https://api.external-service.com/health",
    "method": "GET",
    "expectedStatus": [200, 204],
    "timeout": 5000
  },
  "isEnabled": true,
  "tags": ["external", "api"]
}
```

#### Get Health Check Details
```http
GET /api/monitoring/health/checks/{id}
Authorization: Bearer <token>
```

### Connector Monitoring

#### Get All Connector Metrics
```http
GET /api/monitoring/connectors
Authorization: Bearer <token>
```

**Response:**
```json
{
  "connectors": [
    {
      "connectorId": "temenos",
      "connectorName": "Temenos T24",
      "status": "connected",
      "lastActivity": "2024-01-15T10:29:45Z",
      "connectionUptime": 3600000,
      "totalRequests": 1250,
      "successfulRequests": 1225,
      "failedRequests": 25,
      "averageResponseTime": 150,
      "lastResponseTime": 120,
      "errorRate": 0.02,
      "throughput": 20.8,
      "performance": {
        "p50ResponseTime": 130,
        "p95ResponseTime": 250,
        "p99ResponseTime": 400
      }
    }
  ],
  "total": 5
}
```

#### Get Specific Connector Metrics
```http
GET /api/monitoring/connectors/{connectorId}
Authorization: Bearer <token>
```

#### Record Connector Request
```http
POST /api/monitoring/connectors/record-request
Content-Type: application/json
Authorization: Bearer <token>

{
  "connectorId": "temenos",
  "success": true,
  "responseTime": 150
}
```

### System Metrics

#### Get System Metrics
```http
GET /api/monitoring/metrics/system?limit=100
Authorization: Bearer <token>
```

#### Get Performance Summary
```http
GET /api/monitoring/metrics/performance
Authorization: Bearer <token>
```

**Response:**
```json
{
  "averageResponseTime": 125,
  "errorRate": 0.02,
  "throughput": 85.5,
  "uptime": 3600000,
  "memoryUsage": 50.0,
  "cpuUsage": 25.5
}
```

### Alert Management

#### Get Alerts
```http
GET /api/monitoring/alerts?resolved=false
Authorization: Bearer <token>
```

**Response:**
```json
{
  "alerts": [
    {
      "id": "alert_1642248600_abc123",
      "type": "high_error_rate",
      "severity": "high",
      "title": "High Error Rate: Temenos Connector",
      "message": "Connector error rate is 8.50%",
      "source": "temenos",
      "timestamp": "2024-01-15T10:30:00Z",
      "resolved": false,
      "metadata": {
        "connectorId": "temenos",
        "errorRate": 0.085,
        "totalRequests": 1000,
        "failedRequests": 85
      }
    }
  ],
  "total": 1
}
```

#### Resolve Alert
```http
POST /api/monitoring/alerts/{alertId}/resolve
Authorization: Bearer <token>
```

### Dashboard

#### Get Dashboard Summary
```http
GET /api/monitoring/dashboard
Authorization: Bearer <token>
```

**Response:**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "system": {
    "status": "healthy",
    "uptime": 3600000,
    "version": "1.0.0",
    "environment": "production"
  },
  "connectors": {
    "totalConnectors": 5,
    "connectedConnectors": 4,
    "disconnectedConnectors": 0,
    "errorConnectors": 0,
    "degradedConnectors": 1,
    "overallHealth": "degraded"
  },
  "performance": {
    "averageResponseTime": 125,
    "errorRate": 0.02,
    "throughput": 85.5,
    "uptime": 3600000,
    "memoryUsage": 50.0,
    "cpuUsage": 25.5
  },
  "alerts": {
    "total": 3,
    "critical": 0,
    "high": 1,
    "medium": 2,
    "low": 0
  },
  "healthChecks": {
    "total": 8,
    "healthy": 6,
    "unhealthy": 0,
    "degraded": 2
  }
}
```

## Health Check Types

### 1. **HTTP Health Checks**
Monitor external HTTP endpoints and APIs.

```json
{
  "type": "http",
  "config": {
    "url": "https://api.example.com/health",
    "method": "GET",
    "headers": {
      "Authorization": "Bearer token"
    },
    "expectedStatus": [200, 204],
    "timeout": 5000
  }
}
```

### 2. **Database Health Checks**
Monitor database connectivity and performance.

```json
{
  "type": "database",
  "config": {
    "customCheck": "function() { /* database check logic */ }"
  }
}
```

### 3. **Connector Health Checks**
Monitor banking connector status and connectivity.

```json
{
  "type": "connector",
  "config": {
    "customCheck": "function() { /* connector check logic */ }"
  }
}
```

### 4. **Custom Health Checks**
Implement custom health check logic.

```json
{
  "type": "custom",
  "config": {
    "customCheck": "async function() { return { status: 'healthy', ... }; }"
  }
}
```

## Monitoring Configuration

### Environment Variables

```bash
# Health Check Configuration
HEALTH_CHECK_INTERVAL=30000          # Health check interval (ms)
HEALTH_CHECK_TIMEOUT=10000           # Health check timeout (ms)
ENABLE_HEALTH_ALERTS=true            # Enable health check alerts

# Monitoring Configuration
METRICS_RETENTION_DAYS=7             # Metrics retention period
ENABLE_MONITORING_ALERTS=true        # Enable monitoring alerts
PERFORMANCE_RESPONSE_TIME_THRESHOLD=5000    # Response time threshold (ms)
PERFORMANCE_ERROR_RATE_THRESHOLD=0.05       # Error rate threshold (5%)
PERFORMANCE_THROUGHPUT_THRESHOLD=100        # Throughput threshold (req/min)

# Connector Health Monitoring
ENABLE_CONNECTOR_AUTO_HEALTH_CHECKS=true    # Auto-register connector health checks
ENABLE_CONNECTOR_PERFORMANCE_MONITORING=true # Enable connector performance tracking
```

## Alert Types and Thresholds

### System Alerts
- **High Memory Usage**: Memory usage > 85%
- **High CPU Usage**: CPU usage > 80%
- **High Error Rate**: Error rate > configured threshold
- **Slow Response Times**: Average response time > threshold

### Connector Alerts
- **Connector Down**: Consecutive health check failures
- **High Connector Error Rate**: Connector-specific error rate > threshold
- **Slow Connector Response**: Connector response time > threshold

### Custom Alerts
- **Custom Conditions**: Based on custom metrics and thresholds
- **Business Logic Alerts**: Application-specific alert conditions

## Best Practices

### 1. **Health Check Design**
- Keep health checks lightweight and fast
- Test critical dependencies only
- Use appropriate timeouts
- Implement graceful degradation

### 2. **Monitoring Strategy**
- Monitor key business metrics
- Set appropriate alert thresholds
- Implement alert fatigue prevention
- Use alert escalation policies

### 3. **Performance Optimization**
- Monitor resource usage trends
- Implement performance baselines
- Use caching for expensive operations
- Optimize database queries

### 4. **Alert Management**
- Prioritize alerts by business impact
- Implement alert correlation
- Use runbooks for common issues
- Track alert resolution times

## Troubleshooting

### Common Issues

1. **Health Checks Failing**
   - Check network connectivity
   - Verify authentication credentials
   - Review timeout settings
   - Check service dependencies

2. **High Memory Usage**
   - Review memory leak patterns
   - Check for large object retention
   - Monitor garbage collection
   - Optimize data structures

3. **Performance Degradation**
   - Analyze response time trends
   - Check database performance
   - Review connector health
   - Monitor resource utilization

4. **Alert Fatigue**
   - Review alert thresholds
   - Implement alert correlation
   - Use alert suppression rules
   - Prioritize critical alerts

For detailed troubleshooting guides and runbooks, refer to the operational documentation.
