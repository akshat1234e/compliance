# 🚀 RBI Compliance Platform - Deployment Guide

## Quick Start

### 🎯 One-Click Launch

The fastest way to get the RBI Compliance Platform running:

```bash
# Make the launch script executable
chmod +x launch.sh

# Launch the platform
./launch.sh
```

This will:
- ✅ Check system requirements
- ✅ Generate secure environment configuration
- ✅ Start all services with Docker Compose
- ✅ Run health checks
- ✅ Display access URLs

### 🌐 Access Your Platform

After successful launch:

- **Frontend Application**: http://localhost:3000
- **API Gateway**: http://localhost:8000
- **Kong Admin**: http://localhost:8001
- **Grafana Dashboard**: http://localhost:3001 (admin/admin123)
- **Prometheus**: http://localhost:9090

## 📋 System Requirements

### Minimum Requirements
- **OS**: Linux, macOS, or Windows with WSL2
- **RAM**: 8GB (16GB recommended)
- **Storage**: 20GB free space
- **CPU**: 2 cores (4 cores recommended)
- **Docker**: 20.10+ with Docker Compose

### Recommended for Production
- **RAM**: 16GB+
- **Storage**: 100GB+ SSD
- **CPU**: 4+ cores
- **Network**: Stable internet connection

## 🔧 Installation Methods

### Method 1: Quick Launch (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd rbi-compliance-platform

# Launch the platform
./launch.sh
```

### Method 2: Manual Setup

```bash
# 1. Install dependencies
npm run install:all

# 2. Create environment file
cp .env.example .env.production
# Edit .env.production with your configuration

# 3. Start infrastructure
npm run prod:up

# 4. Run migrations
npm run migrate

# 5. Check health
npm run health:check
```

### Method 3: Production Deployment

```bash
# Full production deployment with all checks
npm run deploy:prod
```

## 🔐 Security Configuration

### Environment Variables

The platform requires several environment variables for secure operation:

```bash
# Database Passwords (Auto-generated)
POSTGRES_PASSWORD=<secure-password>
MONGODB_PASSWORD=<secure-password>
REDIS_PASSWORD=<secure-password>

# Security Keys (Auto-generated)
JWT_SECRET=<64-character-secret>
SESSION_SECRET=<64-character-secret>
ENCRYPTION_KEY=<32-character-key>

# External API Keys (Configure manually)
RBI_API_KEY=your_rbi_api_key
SEBI_API_KEY=your_sebi_api_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
```

### SSL/TLS Configuration

For production deployment:

1. **Obtain SSL certificates** from a trusted CA
2. **Place certificates** in the `ssl/` directory:
   - `ssl/rbi-compliance.crt`
   - `ssl/rbi-compliance.key`
3. **Update environment** variables:
   ```bash
   SSL_CERT_PATH=/app/ssl/rbi-compliance.crt
   SSL_KEY_PATH=/app/ssl/rbi-compliance.key
   ```

## 🗄️ Database Setup

### Automatic Setup

The launch script automatically:
- Creates databases
- Runs migrations
- Sets up indexes
- Seeds initial data

### Manual Database Operations

```bash
# Run migrations
npm run migrate

# Backup databases
npm run backup

# View database status
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d rbi_compliance_prod -c "\dt"
```

## 📊 Monitoring & Logging

### Built-in Monitoring

- **Grafana**: Real-time dashboards at http://localhost:3001
- **Prometheus**: Metrics collection at http://localhost:9090
- **Health Checks**: Automated service health monitoring

### Log Management

```bash
# View all logs
npm run prod:logs

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f frontend

# View real-time logs
docker-compose -f docker-compose.prod.yml logs -f --tail=100
```

## 🔄 Service Management

### Common Commands

```bash
# Check service status
npm run prod:status

# Restart a service
docker-compose -f docker-compose.prod.yml restart frontend

# Scale a service
docker-compose -f docker-compose.prod.yml up -d --scale auth-service=3

# Stop all services
npm run prod:down

# Start all services
npm run prod:up
```

### Health Checks

```bash
# Quick health check
npm run health:check

# Detailed health check
curl http://localhost:3000/api/health | jq
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
lsof -i :3000

# Kill the process
kill -9 <PID>
```

#### 2. Database Connection Issues
```bash
# Check database status
docker-compose -f docker-compose.prod.yml ps postgres

# Restart database
docker-compose -f docker-compose.prod.yml restart postgres
```

#### 3. Memory Issues
```bash
# Check memory usage
docker stats

# Increase Docker memory limit in Docker Desktop
```

#### 4. Permission Issues
```bash
# Fix script permissions
chmod +x scripts/*.sh
chmod +x launch.sh
```

### Debug Mode

Enable debug logging:

```bash
# Set debug environment
export DEBUG=true

# View detailed logs
npm run prod:logs | grep ERROR
```

## 🔄 Updates & Maintenance

### Updating the Platform

```bash
# Pull latest changes
git pull origin main

# Rebuild images
npm run prod:build

# Restart services
npm run prod:down && npm run prod:up
```

### Backup Strategy

```bash
# Manual backup
npm run backup

# Automated backups are configured via cron
# Check: crontab -l
```

## 🌐 Production Deployment

### Domain Configuration

1. **Update environment variables**:
   ```bash
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   CORS_ORIGIN=https://yourdomain.com
   ```

2. **Configure reverse proxy** (Nginx/Apache)
3. **Set up SSL termination**
4. **Configure firewall rules**

### Load Balancing

For high availability:

1. **Deploy multiple instances**
2. **Configure load balancer**
3. **Set up health checks**
4. **Configure session persistence**

## 📞 Support

### Getting Help

- **Documentation**: Check the main README.md
- **Logs**: Use `npm run prod:logs` for debugging
- **Health Status**: Visit http://localhost:3000/api/health
- **Issues**: Report bugs in the project repository

### Performance Tuning

- **Database**: Tune PostgreSQL configuration
- **Caching**: Configure Redis appropriately
- **Resources**: Adjust Docker resource limits
- **Monitoring**: Set up alerts in Grafana

---

## 🎉 Success!

If you see the green success message, your RBI Compliance Platform is ready!

**Next Steps:**
1. 🌐 Open http://localhost:3000
2. 👤 Create your admin account
3. 🏢 Configure organization settings
4. 📋 Start managing compliance workflows
5. 📊 Monitor performance in Grafana

**Happy Compliance Management!** 🎯
