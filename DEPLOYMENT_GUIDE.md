# RBI Compliance Platform - Deployment Guide

This guide provides comprehensive instructions for deploying the RBI Compliance Platform in various environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Local Development](#local-development)
4. [Docker Deployment](#docker-deployment)
5. [Production Deployment](#production-deployment)
6. [Configuration Reference](#configuration-reference)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- **CPU**: 4+ cores recommended
- **Memory**: 8GB+ RAM recommended
- **Storage**: 50GB+ available space
- **Network**: Stable internet connection

### Software Requirements
- **Docker**: 20.10+ and Docker Compose 2.0+
- **Node.js**: 18+ (for local development)
- **Git**: Latest version
- **PostgreSQL**: 15+ (if not using Docker)
- **Redis**: 7+ (if not using Docker)

### External Dependencies
- **Banking Core Systems**: Temenos T24, Finacle, Flexcube (optional)
- **RBI API Access**: Valid API credentials (optional)
- **CIBIL Integration**: Valid API credentials (optional)
- **Cloud Storage**: AWS S3 or Azure Blob (for production)

## Environment Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd rbi-compliance-platform
```

### 2. Environment Configuration
```bash
# Copy environment templates
cp .env.example .env
cp services/integration-gateway/.env.example services/integration-gateway/.env
cp services/auth-service/.env.example services/auth-service/.env
cp frontend/.env.example frontend/.env.local
```

### 3. Configure Environment Variables
Edit the `.env` files with your specific configuration:

```bash
# Main .env file
NODE_ENV=production
DATABASE_URL=postgresql://rbi_user:rbi_password@localhost:5432/rbi_compliance
REDIS_URL=redis://:redis_password@localhost:6379

# Security
JWT_ACCESS_SECRET=your-super-secret-jwt-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-jwt-refresh-key-min-32-chars
ENCRYPTION_KEY=your-32-character-encryption-key

# External APIs (optional)
TEMENOS_API_URL=https://your-temenos-instance.com/api
FINACLE_API_URL=https://your-finacle-instance.com/api
RBI_API_URL=https://api.rbi.org.in
CIBIL_API_URL=https://api.cibil.com

# Cloud Storage (production)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=rbi-compliance-documents
```

## Local Development

### 1. Install Dependencies
```bash
# Install root dependencies
npm install

# Install service dependencies
cd services/integration-gateway && npm install && cd ../..
cd services/auth-service && npm install && cd ../..
cd frontend && npm install && cd ../..
```

### 2. Start Infrastructure Services
```bash
# Start PostgreSQL, Redis, and other infrastructure
docker-compose up -d postgres redis rabbitmq elasticsearch
```

### 3. Run Database Migrations
```bash
# Run migrations for all services
npm run migrate
```

### 4. Start Services in Development Mode
```bash
# Terminal 1: Integration Gateway
cd services/integration-gateway
npm run dev

# Terminal 2: Auth Service
cd services/auth-service
npm run dev

# Terminal 3: Frontend
cd frontend
npm run dev
```

### 5. Access the Application
- **Frontend**: http://localhost:3001
- **Integration Gateway**: http://localhost:3000
- **Auth Service**: http://localhost:3001

## Docker Deployment

### 1. Quick Start with Docker Compose
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 2. Individual Service Management
```bash
# Build specific service
docker-compose build integration-gateway

# Restart specific service
docker-compose restart integration-gateway

# Scale services
docker-compose up -d --scale integration-gateway=3
```

### 3. Database Initialization
```bash
# Run database migrations
docker-compose exec integration-gateway npm run migrate

# Seed initial data
docker-compose exec integration-gateway npm run seed
```

## Production Deployment

### 1. Pre-deployment Checklist
- [ ] Environment variables configured
- [ ] SSL certificates obtained
- [ ] Database backups configured
- [ ] Monitoring setup complete
- [ ] Security hardening applied
- [ ] Load balancer configured

### 2. Production Docker Compose
```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d

# Or with environment override
NODE_ENV=production docker-compose up -d
```

### 3. SSL/TLS Configuration
```bash
# Generate SSL certificates (Let's Encrypt example)
certbot certonly --standalone -d your-domain.com

# Update nginx configuration
cp nginx/nginx.prod.conf nginx/nginx.conf
```

### 4. Database Configuration
```bash
# Production PostgreSQL setup
docker run -d \
  --name rbi-postgres-prod \
  -e POSTGRES_DB=rbi_compliance \
  -e POSTGRES_USER=rbi_user \
  -e POSTGRES_PASSWORD=secure_password \
  -v postgres_prod_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:15-alpine
```

### 5. Backup Configuration
```bash
# Database backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U rbi_user rbi_compliance > $BACKUP_DIR/rbi_compliance_$DATE.sql
```

## Configuration Reference

### Service Ports
- **Frontend**: 3001
- **Integration Gateway**: 3000
- **Auth Service**: 3001
- **Document Service**: 3002
- **Workflow Service**: 3003
- **Compliance Service**: 3004

### Database Schema
```sql
-- Main databases
rbi_compliance          -- Primary application database
rbi_compliance_audit    -- Audit logs database
rbi_compliance_docs     -- Document metadata database
```

### Redis Key Patterns
```
auth:sessions:{sessionId}     -- User sessions
auth:blacklist:{tokenId}      -- Blacklisted tokens
cache:connectors:{id}         -- Connector status cache
cache:webhooks:{id}           -- Webhook delivery cache
```

### API Endpoints
```
GET  /health                  -- Health check
GET  /api/gateway/*          -- Gateway operations
GET  /api/auth/*             -- Authentication
GET  /api/webhooks/*         -- Webhook management
GET  /api/monitoring/*       -- System monitoring
```

## Monitoring & Maintenance

### 1. Health Checks
```bash
# Check all services
curl http://localhost:3000/health
curl http://localhost:3001/health

# Detailed health check
curl http://localhost:3000/api/monitoring/health
```

### 2. Log Management
```bash
# View service logs
docker-compose logs -f integration-gateway
docker-compose logs -f auth-service

# Log rotation setup
logrotate -d /etc/logrotate.d/rbi-compliance
```

### 3. Performance Monitoring
```bash
# Monitor resource usage
docker stats

# Database performance
docker-compose exec postgres psql -U rbi_user -d rbi_compliance -c "SELECT * FROM pg_stat_activity;"
```

### 4. Backup Procedures
```bash
# Daily backup script
#!/bin/bash
# Database backup
pg_dump -h localhost -U rbi_user rbi_compliance | gzip > /backups/db_$(date +%Y%m%d).sql.gz

# Document backup
tar -czf /backups/docs_$(date +%Y%m%d).tar.gz /app/uploads

# Configuration backup
tar -czf /backups/config_$(date +%Y%m%d).tar.gz .env* nginx/
```

## Troubleshooting

### Common Issues

#### 1. Service Won't Start
```bash
# Check logs
docker-compose logs service-name

# Check environment variables
docker-compose exec service-name env

# Restart service
docker-compose restart service-name
```

#### 2. Database Connection Issues
```bash
# Test database connection
docker-compose exec postgres psql -U rbi_user -d rbi_compliance -c "SELECT 1;"

# Check database logs
docker-compose logs postgres
```

#### 3. Authentication Problems
```bash
# Check JWT configuration
docker-compose exec auth-service node -e "console.log(process.env.JWT_ACCESS_SECRET)"

# Verify token generation
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@rbi-compliance.com","password":"demo123"}'
```

#### 4. Performance Issues
```bash
# Monitor resource usage
docker stats --no-stream

# Check database performance
docker-compose exec postgres psql -U rbi_user -d rbi_compliance -c "
  SELECT query, calls, total_time, mean_time 
  FROM pg_stat_statements 
  ORDER BY total_time DESC 
  LIMIT 10;"
```

### Emergency Procedures

#### 1. Service Recovery
```bash
# Stop all services
docker-compose down

# Remove containers and volumes (CAUTION: Data loss)
docker-compose down -v

# Rebuild and restart
docker-compose up -d --build
```

#### 2. Database Recovery
```bash
# Restore from backup
gunzip -c /backups/db_20240115.sql.gz | \
  docker-compose exec -T postgres psql -U rbi_user -d rbi_compliance
```

#### 3. Rollback Deployment
```bash
# Rollback to previous version
git checkout previous-tag
docker-compose down
docker-compose up -d --build
```

## Security Considerations

### 1. Network Security
- Use internal Docker networks
- Expose only necessary ports
- Implement proper firewall rules
- Use reverse proxy for SSL termination

### 2. Data Security
- Encrypt sensitive data at rest
- Use secure communication protocols
- Implement proper access controls
- Regular security audits

### 3. Operational Security
- Regular security updates
- Secure backup procedures
- Access logging and monitoring
- Incident response procedures

## Support and Maintenance

### Regular Maintenance Tasks
- [ ] Weekly: Check logs and performance metrics
- [ ] Monthly: Update dependencies and security patches
- [ ] Quarterly: Review and update configurations
- [ ] Annually: Security audit and penetration testing

### Contact Information
- **Technical Support**: support@rbi-compliance.com
- **Emergency Contact**: emergency@rbi-compliance.com
- **Documentation**: https://docs.rbi-compliance.com

For additional support, refer to the troubleshooting section or contact the technical support team.
