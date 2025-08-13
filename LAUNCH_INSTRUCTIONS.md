# 🚀 RBI Compliance Platform - Launch Instructions

## 🎯 Quick Launch Options

### Option 1: Full Production Launch (Recommended)

```bash
# Make scripts executable
chmod +x *.sh scripts/*.sh

# Launch the complete platform with Docker
./launch.sh
```

**What this does:**
- ✅ Checks system requirements
- ✅ Generates secure passwords automatically
- ✅ Starts all services with Docker Compose
- ✅ Sets up databases and runs migrations
- ✅ Configures monitoring and logging
- ✅ Runs health checks
- ✅ Opens the website at http://localhost:3000

### Option 2: Development Launch (Lightweight)

```bash
# Launch development version without Docker
./launch-dev.sh
```

**What this does:**
- ✅ Checks Node.js installation
- ✅ Installs dependencies
- ✅ Creates development configuration
- ✅ Starts Next.js development server
- ✅ Opens the website at http://localhost:3000

### Option 3: Manual Launch

```bash
# Install dependencies
npm install
cd frontend && npm install && cd ..

# Start development server
cd frontend && npm run dev
```

## 🌐 Access Your Platform

After successful launch, you can access:

| Service | URL | Description |
|---------|-----|-------------|
| **Main Website** | http://localhost:3000 | RBI Compliance Platform Frontend |
| **API Gateway** | http://localhost:8000 | Backend API Services |
| **Admin Panel** | http://localhost:8001 | Kong API Gateway Admin |
| **Monitoring** | http://localhost:3001 | Grafana Dashboard (admin/admin123) |
| **Metrics** | http://localhost:9090 | Prometheus Metrics |
| **Health Check** | http://localhost:3000/api/health | System Health Status |

## 📋 System Requirements

### Minimum Requirements
- **OS**: macOS, Linux, or Windows with WSL2
- **RAM**: 8GB (16GB recommended for full platform)
- **Storage**: 20GB free space
- **CPU**: 2 cores (4 cores recommended)
- **Software**: 
  - Docker 20.10+ (for full platform)
  - Node.js 18+ (for development)
  - npm 8+

### For Development Only
- **RAM**: 4GB minimum
- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher

## 🔧 Troubleshooting

### Common Issues & Solutions

#### 1. "Docker not found" or "Docker not running"
```bash
# Install Docker Desktop from https://docker.com
# Start Docker Desktop application
# Verify: docker --version
```

#### 2. "Port already in use"
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 ./launch-dev.sh
```

#### 3. "Permission denied"
```bash
# Make scripts executable
chmod +x *.sh scripts/*.sh

# If still issues, run with bash
bash launch.sh
```

#### 4. "Node.js version too old"
```bash
# Install Node.js 18+ from https://nodejs.org
# Or use nvm:
nvm install 18
nvm use 18
```

#### 5. "npm install fails"
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🎨 What You'll See

When the platform launches successfully, you'll see a beautiful landing page with:

- **🎉 Welcome Message**: RBI Compliance Platform header
- **✅ Status Indicators**: Frontend, Backend, AI/ML services
- **🚀 Success Confirmation**: "Platform is running successfully!"
- **📊 Feature Overview**: Compliance management capabilities

## 🔄 Managing the Platform

### Start/Stop Commands

```bash
# Start the platform
./launch.sh

# Stop all services
npm run prod:down
# or
docker-compose -f docker-compose.prod.yml down

# Restart a specific service
docker-compose -f docker-compose.prod.yml restart frontend

# View logs
npm run prod:logs
# or
docker-compose -f docker-compose.prod.yml logs -f

# Check service status
npm run prod:status
```

### Development Commands

```bash
# Start development server
./launch-dev.sh

# Install all dependencies
npm run install:all

# Run tests
npm test

# Build for production
npm run build
```

## 🔐 Security Notes

### Default Credentials
- **Grafana**: admin / admin123
- **Database passwords**: Auto-generated in .env.production
- **API Keys**: Configure in .env.production

### For Production Use
1. **Change default passwords**
2. **Configure SSL certificates**
3. **Set up proper firewall rules**
4. **Configure backup strategies**
5. **Set up monitoring alerts**

## 📞 Getting Help

### If Something Goes Wrong

1. **Check the logs**:
   ```bash
   npm run prod:logs
   ```

2. **Verify system requirements**:
   ```bash
   docker --version
   node --version
   npm --version
   ```

3. **Check service health**:
   ```bash
   curl http://localhost:3000/api/health
   ```

4. **Restart services**:
   ```bash
   npm run prod:down
   npm run prod:up
   ```

### Support Resources
- **Documentation**: Check README.md and DEPLOYMENT.md
- **Health Status**: Visit http://localhost:3000/api/health
- **Service Logs**: Use `npm run prod:logs`
- **System Status**: Use `npm run prod:status`

## 🎉 Success Indicators

You'll know the platform is working when:

- ✅ No error messages during launch
- ✅ Website loads at http://localhost:3000
- ✅ Health check returns "ok" status
- ✅ All Docker containers are "Up" (if using Docker)
- ✅ You see the RBI Compliance Platform welcome page

## 🚀 Next Steps

After successful launch:

1. **🌐 Open the website**: http://localhost:3000
2. **👤 Create admin account**: Follow the setup wizard
3. **🏢 Configure organization**: Set up your compliance settings
4. **📋 Start workflows**: Begin managing compliance tasks
5. **📊 Monitor performance**: Check Grafana dashboards

---

**Happy Compliance Management!** 🎯

*The RBI Compliance Platform is now ready to help you manage regulatory compliance efficiently and effectively.*
