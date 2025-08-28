# RBI Compliance Platform - Troubleshooting Guide

Comprehensive troubleshooting guide for common issues, error resolution, and system optimization.

## Table of Contents

1. [General Troubleshooting](#general-troubleshooting)
2. [Authentication Issues](#authentication-issues)
3. [Banking Connector Problems](#banking-connector-problems)
4. [Performance Issues](#performance-issues)
5. [API and Integration Errors](#api-and-integration-errors)
6. [Database Issues](#database-issues)
7. [Frontend Application Problems](#frontend-application-problems)
8. [Monitoring and Alerts](#monitoring-and-alerts)
9. [Webhook Delivery Issues](#webhook-delivery-issues)
10. [System Administration](#system-administration)

## General Troubleshooting

### Basic Troubleshooting Steps

Before diving into specific issues, follow these general steps:

1. **Check System Status**
   ```bash
   # Check overall system health
   curl -X GET https://api.rbi-compliance.com/health
   
   # Check service status
   docker-compose ps
   kubectl get pods -n rbi-compliance
   ```

2. **Review Logs**
   ```bash
   # Application logs
   docker-compose logs -f integration-gateway
   docker-compose logs -f auth-service
   
   # System logs
   tail -f /var/log/rbi-compliance/application.log
   ```

3. **Verify Configuration**
   ```bash
   # Check environment variables
   docker-compose exec integration-gateway env | grep -E "(DATABASE|REDIS|JWT)"
   
   # Validate configuration files
   docker-compose config
   ```

4. **Test Network Connectivity**
   ```bash
   # Test database connection
   telnet postgres-host 5432
   
   # Test Redis connection
   redis-cli -h redis-host ping
   
   # Test external APIs
   curl -I https://api.rbi.org.in/health
   ```

### Common Error Patterns

#### Connection Timeouts
**Symptoms**: Requests timing out, slow response times
**Causes**: Network issues, overloaded services, database locks
**Solutions**:
- Increase timeout values in configuration
- Check network connectivity
- Monitor resource usage
- Review database performance

#### Memory Issues
**Symptoms**: Out of memory errors, application crashes
**Causes**: Memory leaks, insufficient resources, large data processing
**Solutions**:
- Increase memory allocation
- Monitor memory usage patterns
- Implement pagination for large datasets
- Review code for memory leaks

#### Authentication Failures
**Symptoms**: 401/403 errors, login failures
**Causes**: Expired tokens, invalid credentials, configuration issues
**Solutions**:
- Refresh authentication tokens
- Verify credentials and permissions
- Check authentication service status
- Review RBAC configuration

## Authentication Issues

### Login Problems

#### Issue: Cannot log in to the platform
**Error Messages**:
- "Invalid credentials"
- "Account locked"
- "Authentication service unavailable"

**Troubleshooting Steps**:

1. **Verify Credentials**
   ```bash
   # Test with demo credentials
   curl -X POST https://api.rbi-compliance.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"demo@rbi-compliance.com","password":"demo123"}'
   ```

2. **Check Account Status**
   ```sql
   -- Check user account in database
   SELECT id, email, is_active, locked_at, failed_attempts 
   FROM users 
   WHERE email = 'user@example.com';
   ```

3. **Reset Account**
   ```bash
   # Unlock user account
   docker-compose exec auth-service npm run unlock-user user@example.com
   
   # Reset password
   docker-compose exec auth-service npm run reset-password user@example.com
   ```

#### Issue: JWT Token Expired
**Error Messages**:
- "Token expired"
- "Invalid token"
- "Authentication required"

**Solutions**:
1. Refresh the token using refresh token
2. Re-authenticate to get new tokens
3. Check token expiration settings
4. Verify system clock synchronization

### Two-Factor Authentication Issues

#### Issue: 2FA code not working
**Troubleshooting**:
1. Check time synchronization on device
2. Verify 2FA secret key
3. Try backup codes if available
4. Reset 2FA if necessary

```bash
# Reset 2FA for user
docker-compose exec auth-service npm run reset-2fa user@example.com
```

### OAuth Integration Problems

#### Issue: OAuth flow failing
**Common Causes**:
- Incorrect redirect URIs
- Invalid client credentials
- Scope mismatches

**Solutions**:
1. Verify OAuth client configuration
2. Check redirect URI whitelist
3. Validate client credentials
4. Review requested scopes

## Banking Connector Problems

### Connector Status Issues

#### Issue: Connector showing as offline
**Diagnostic Steps**:

1. **Check Connector Health**
   ```bash
   # Test specific connector
   curl -X POST https://api.rbi-compliance.com/api/gateway/connectors/temenos_t24/test \
     -H "Authorization: Bearer <token>"
   ```

2. **Review Connector Logs**
   ```bash
   # Check connector-specific logs
   docker-compose logs -f integration-gateway | grep "temenos_t24"
   ```

3. **Verify Banking System Availability**
   ```bash
   # Test banking system endpoint
   curl -I https://banking-system.example.com/api/health
   ```

#### Issue: Authentication failures with banking systems
**Solutions**:
1. Verify API credentials
2. Check certificate validity
3. Review authentication method
4. Test with banking system directly

```bash
# Test banking system authentication
curl -X POST https://banking-system.example.com/api/auth \
  -H "Content-Type: application/json" \
  -d '{"username":"api_user","password":"api_password"}'
```

### Data Synchronization Issues

#### Issue: Data not syncing from banking systems
**Troubleshooting**:

1. **Check Sync Status**
   ```bash
   # View sync status
   curl -X GET https://api.rbi-compliance.com/api/gateway/sync/status \
     -H "Authorization: Bearer <token>"
   ```

2. **Review Data Transformation**
   ```bash
   # Check transformation logs
   docker-compose logs -f integration-gateway | grep "transformation"
   ```

3. **Validate Data Format**
   ```bash
   # Test data transformation
   curl -X POST https://api.rbi-compliance.com/api/gateway/transform/test \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"sourceData": {...}, "transformationRule": "..."}'
   ```

#### Issue: Duplicate data entries
**Causes**: Sync process running multiple times, missing deduplication
**Solutions**:
1. Implement proper deduplication logic
2. Check for duplicate sync processes
3. Review data keys and identifiers
4. Clean up duplicate entries

```sql
-- Find duplicate entries
SELECT account_number, COUNT(*) 
FROM accounts 
GROUP BY account_number 
HAVING COUNT(*) > 1;

-- Remove duplicates (keep latest)
DELETE FROM accounts a1 
USING accounts a2 
WHERE a1.id < a2.id 
AND a1.account_number = a2.account_number;
```

## Performance Issues

### Slow Response Times

#### Issue: API responses are slow
**Diagnostic Steps**:

1. **Monitor Response Times**
   ```bash
   # Check API performance
   curl -w "@curl-format.txt" -o /dev/null -s https://api.rbi-compliance.com/api/gateway/connectors/status
   ```

2. **Database Performance**
   ```sql
   -- Check slow queries
   SELECT query, calls, total_time, mean_time 
   FROM pg_stat_statements 
   ORDER BY total_time DESC 
   LIMIT 10;
   
   -- Check database connections
   SELECT count(*) FROM pg_stat_activity;
   ```

3. **Resource Usage**
   ```bash
   # Check system resources
   docker stats --no-stream
   
   # Check memory usage
   free -h
   
   # Check disk I/O
   iostat -x 1 5
   ```

#### Issue: High CPU usage
**Solutions**:
1. Identify CPU-intensive processes
2. Optimize database queries
3. Implement caching
4. Scale horizontally if needed

```bash
# Identify high CPU processes
top -p $(pgrep -d',' -f rbi-compliance)

# Check application-specific metrics
curl -X GET https://api.rbi-compliance.com/api/monitoring/metrics/cpu
```

### Memory Issues

#### Issue: Out of memory errors
**Troubleshooting**:

1. **Monitor Memory Usage**
   ```bash
   # Check memory usage by service
   docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
   ```

2. **Identify Memory Leaks**
   ```bash
   # Monitor memory over time
   while true; do
     docker stats --no-stream --format "{{.Container}}: {{.MemUsage}}"
     sleep 60
   done
   ```

3. **Optimize Memory Usage**
   - Increase memory limits
   - Implement pagination
   - Optimize data structures
   - Clear unused caches

### Database Performance

#### Issue: Slow database queries
**Optimization Steps**:

1. **Analyze Query Performance**
   ```sql
   -- Enable query logging
   ALTER SYSTEM SET log_min_duration_statement = 1000;
   SELECT pg_reload_conf();
   
   -- Analyze specific query
   EXPLAIN ANALYZE SELECT * FROM compliance_tasks WHERE status = 'pending';
   ```

2. **Add Missing Indexes**
   ```sql
   -- Create indexes for common queries
   CREATE INDEX idx_compliance_tasks_status ON compliance_tasks(status);
   CREATE INDEX idx_circulars_deadline ON rbi_circulars(compliance_deadline);
   ```

3. **Optimize Queries**
   ```sql
   -- Use LIMIT for large result sets
   SELECT * FROM audit_logs 
   WHERE created_at >= NOW() - INTERVAL '7 days' 
   ORDER BY created_at DESC 
   LIMIT 1000;
   ```

## API and Integration Errors

### HTTP Error Codes

#### 400 Bad Request
**Common Causes**:
- Invalid JSON format
- Missing required fields
- Invalid parameter values

**Example Fix**:
```bash
# Correct API call
curl -X POST https://api.rbi-compliance.com/api/compliance/workflows \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "KYC Workflow",
    "description": "Customer verification process",
    "steps": [...]
  }'
```

#### 401 Unauthorized
**Solutions**:
1. Check authentication token
2. Verify token hasn't expired
3. Ensure proper Authorization header

```bash
# Get new token
TOKEN=$(curl -X POST https://api.rbi-compliance.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  | jq -r '.data.accessToken')

# Use token in subsequent requests
curl -H "Authorization: Bearer $TOKEN" https://api.rbi-compliance.com/api/gateway/connectors/status
```

#### 429 Rate Limit Exceeded
**Solutions**:
1. Implement exponential backoff
2. Reduce request frequency
3. Request rate limit increase

```javascript
// Exponential backoff implementation
async function apiCallWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

### Integration Timeouts

#### Issue: External API calls timing out
**Solutions**:

1. **Increase Timeout Values**
   ```javascript
   // In application configuration
   const config = {
     timeout: 30000, // 30 seconds
     retries: 3,
     retryDelay: 1000
   };
   ```

2. **Implement Circuit Breaker**
   ```javascript
   const CircuitBreaker = require('opossum');
   
   const options = {
     timeout: 3000,
     errorThresholdPercentage: 50,
     resetTimeout: 30000
   };
   
   const breaker = new CircuitBreaker(apiCall, options);
   ```

3. **Use Async Processing**
   ```javascript
   // Queue long-running operations
   await queue.add('sync-banking-data', {
     connectorId: 'temenos_t24',
     syncType: 'full'
   });
   ```

## Database Issues

### Connection Problems

#### Issue: Database connection failures
**Error Messages**:
- "Connection refused"
- "Too many connections"
- "Connection timeout"

**Solutions**:

1. **Check Database Status**
   ```bash
   # Test database connection
   docker-compose exec postgres psql -U rbi_user -d rbi_compliance -c "SELECT 1;"
   
   # Check connection count
   docker-compose exec postgres psql -U rbi_user -d rbi_compliance -c "SELECT count(*) FROM pg_stat_activity;"
   ```

2. **Increase Connection Pool**
   ```javascript
   // Database configuration
   const dbConfig = {
     host: 'localhost',
     port: 5432,
     database: 'rbi_compliance',
     user: 'rbi_user',
     password: 'password',
     max: 20, // Increase pool size
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000
   };
   ```

3. **Kill Long-Running Queries**
   ```sql
   -- Find long-running queries
   SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
   FROM pg_stat_activity 
   WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
   
   -- Kill specific query
   SELECT pg_terminate_backend(pid);
   ```

### Data Integrity Issues

#### Issue: Data corruption or inconsistencies
**Diagnostic Steps**:

1. **Check Data Integrity**
   ```sql
   -- Check for orphaned records
   SELECT c.id FROM compliance_tasks c 
   LEFT JOIN workflows w ON c.workflow_id = w.id 
   WHERE w.id IS NULL;
   
   -- Validate foreign key constraints
   SELECT conname, conrelid::regclass 
   FROM pg_constraint 
   WHERE contype = 'f' AND NOT convalidated;
   ```

2. **Repair Data**
   ```sql
   -- Fix orphaned records
   DELETE FROM compliance_tasks 
   WHERE workflow_id NOT IN (SELECT id FROM workflows);
   
   -- Update inconsistent data
   UPDATE compliance_tasks 
   SET status = 'pending' 
   WHERE status IS NULL;
   ```

## Frontend Application Problems

### Loading Issues

#### Issue: Application not loading
**Troubleshooting Steps**:

1. **Check Browser Console**
   - Open browser developer tools
   - Look for JavaScript errors
   - Check network requests

2. **Verify API Connectivity**
   ```bash
   # Test API from browser
   fetch('https://api.rbi-compliance.com/health')
     .then(response => response.json())
     .then(data => console.log(data));
   ```

3. **Clear Browser Cache**
   - Clear browser cache and cookies
   - Try incognito/private mode
   - Disable browser extensions

#### Issue: Slow page loading
**Optimization Steps**:

1. **Enable Compression**
   ```nginx
   # Nginx configuration
   gzip on;
   gzip_types text/plain text/css application/json application/javascript;
   ```

2. **Optimize Bundle Size**
   ```bash
   # Analyze bundle size
   npm run build -- --analyze
   
   # Enable code splitting
   # Implement lazy loading for routes
   ```

3. **Use CDN**
   ```html
   <!-- Use CDN for static assets -->
   <link href="https://cdn.example.com/styles.css" rel="stylesheet">
   ```

### Authentication Issues in Frontend

#### Issue: User gets logged out frequently
**Solutions**:

1. **Implement Token Refresh**
   ```javascript
   // Automatic token refresh
   const refreshToken = async () => {
     try {
       const response = await fetch('/api/auth/refresh', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({ refreshToken: getRefreshToken() })
       });
       
       const data = await response.json();
       setAccessToken(data.accessToken);
     } catch (error) {
       // Redirect to login
       window.location.href = '/login';
     }
   };
   ```

2. **Handle Token Expiration**
   ```javascript
   // Axios interceptor for token refresh
   axios.interceptors.response.use(
     response => response,
     async error => {
       if (error.response?.status === 401) {
         await refreshToken();
         return axios.request(error.config);
       }
       return Promise.reject(error);
     }
   );
   ```

## Monitoring and Alerts

### Alert Configuration Issues

#### Issue: Not receiving alerts
**Troubleshooting**:

1. **Check Alert Configuration**
   ```bash
   # Verify alert rules
   curl -X GET https://api.rbi-compliance.com/api/monitoring/alerts/config \
     -H "Authorization: Bearer <token>"
   ```

2. **Test Notification Channels**
   ```bash
   # Test email notifications
   curl -X POST https://api.rbi-compliance.com/api/monitoring/alerts/test \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"type": "email", "recipient": "admin@example.com"}'
   ```

3. **Review Alert History**
   ```bash
   # Check recent alerts
   curl -X GET https://api.rbi-compliance.com/api/monitoring/alerts?limit=50 \
     -H "Authorization: Bearer <token>"
   ```

#### Issue: Too many false positive alerts
**Solutions**:
1. Adjust alert thresholds
2. Implement alert correlation
3. Add alert suppression rules
4. Use alert grouping

```yaml
# Alert configuration example
alerts:
  cpu_usage:
    threshold: 80
    duration: 5m
    severity: warning
  memory_usage:
    threshold: 90
    duration: 2m
    severity: critical
```

### Metrics Collection Issues

#### Issue: Missing metrics data
**Diagnostic Steps**:

1. **Check Metrics Endpoints**
   ```bash
   # Test metrics collection
   curl -X GET https://api.rbi-compliance.com/metrics
   ```

2. **Verify Prometheus Configuration**
   ```yaml
   # prometheus.yml
   scrape_configs:
     - job_name: 'rbi-compliance'
       static_configs:
         - targets: ['localhost:3000']
       scrape_interval: 30s
   ```

3. **Check Grafana Dashboards**
   - Verify data source configuration
   - Check query syntax
   - Review time ranges

## Webhook Delivery Issues

### Delivery Failures

#### Issue: Webhooks not being delivered
**Troubleshooting Steps**:

1. **Check Webhook Status**
   ```bash
   # View webhook delivery status
   curl -X GET https://api.rbi-compliance.com/api/webhooks/deliveries \
     -H "Authorization: Bearer <token>"
   ```

2. **Test Webhook Endpoint**
   ```bash
   # Test webhook URL manually
   curl -X POST https://your-app.com/webhooks/test \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

3. **Review Webhook Logs**
   ```bash
   # Check webhook delivery logs
   docker-compose logs -f integration-gateway | grep "webhook"
   ```

#### Issue: Webhook signature verification failing
**Solutions**:

1. **Verify Signature Calculation**
   ```javascript
   // Correct signature verification
   const crypto = require('crypto');
   
   const verifySignature = (payload, signature, secret) => {
     const expectedSignature = crypto
       .createHmac('sha256', secret)
       .update(payload)
       .digest('hex');
     
     return crypto.timingSafeEqual(
       Buffer.from(signature),
       Buffer.from(expectedSignature)
     );
   };
   ```

2. **Check Webhook Configuration**
   ```bash
   # Verify webhook secret
   curl -X GET https://api.rbi-compliance.com/api/webhooks/endpoints/{id} \
     -H "Authorization: Bearer <token>"
   ```

## System Administration

### Service Management

#### Issue: Service won't start
**Diagnostic Steps**:

1. **Check Service Status**
   ```bash
   # Docker Compose
   docker-compose ps
   docker-compose logs service-name
   
   # Kubernetes
   kubectl get pods -n rbi-compliance
   kubectl describe pod pod-name
   kubectl logs pod-name
   ```

2. **Check Dependencies**
   ```bash
   # Verify database is running
   docker-compose exec postgres pg_isready
   
   # Check Redis
   docker-compose exec redis redis-cli ping
   ```

3. **Review Configuration**
   ```bash
   # Validate configuration
   docker-compose config
   
   # Check environment variables
   docker-compose exec service-name env
   ```

### Backup and Recovery

#### Issue: Backup failures
**Solutions**:

1. **Test Backup Process**
   ```bash
   # Manual backup
   docker-compose exec postgres pg_dump -U rbi_user rbi_compliance > backup.sql
   
   # Verify backup
   head -n 20 backup.sql
   ```

2. **Automate Backups**
   ```bash
   #!/bin/bash
   # backup.sh
   DATE=$(date +%Y%m%d_%H%M%S)
   BACKUP_DIR="/backups"
   
   # Database backup
   docker-compose exec -T postgres pg_dump -U rbi_user rbi_compliance | gzip > $BACKUP_DIR/db_$DATE.sql.gz
   
   # File backup
   tar -czf $BACKUP_DIR/files_$DATE.tar.gz /app/uploads
   
   # Cleanup old backups
   find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
   ```

3. **Test Recovery**
   ```bash
   # Restore database
   gunzip -c backup.sql.gz | docker-compose exec -T postgres psql -U rbi_user -d rbi_compliance
   ```

---

## Getting Additional Help

If you're unable to resolve an issue using this guide:

1. **Check System Status**: https://status.rbi-compliance.com
2. **Search Knowledge Base**: https://docs.rbi-compliance.com
3. **Contact Support**: support@rbi-compliance.com
4. **Emergency Support**: emergency@rbi-compliance.com

When contacting support, please include:
- Error messages and logs
- Steps to reproduce the issue
- System configuration details
- Platform version information
