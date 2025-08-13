#!/bin/bash

# =============================================================================
# RBI Compliance Platform - Quick Launch Script
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                    RBI COMPLIANCE MANAGEMENT PLATFORM                       ║"
echo "║                              Quick Launch                                    ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose and try again.${NC}"
    exit 1
fi

echo -e "${BLUE}🚀 Starting RBI Compliance Platform...${NC}\n"

# Create environment file if it doesn't exist
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}⚠️  Production environment file not found. Creating default configuration...${NC}"
    
    # Generate secure passwords
    POSTGRES_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    MONGODB_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    REDIS_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
    SESSION_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
    ENCRYPTION_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    
    cat > .env.production << EOF
# RBI Compliance Platform - Production Environment
NODE_ENV=production
APP_NAME=RBI Compliance Platform
APP_VERSION=1.0.0

# Database Configuration
POSTGRES_DB=rbi_compliance_prod
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$POSTGRES_PASS

MONGODB_DB=rbi_compliance_docs_prod
MONGODB_USER=root
MONGODB_PASSWORD=$MONGODB_PASS

REDIS_PASSWORD=$REDIS_PASS

# Security Configuration
JWT_SECRET=$JWT_SECRET
SESSION_SECRET=$SESSION_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY

# Kong Configuration
KONG_DB_PASSWORD=$POSTGRES_PASS

# Monitoring Configuration
GRAFANA_PASSWORD=admin123
ELASTICSEARCH_PASSWORD=elastic123

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_ML_PREDICTIONS=true
ENABLE_REAL_TIME_MONITORING=true
EOF
    
    echo -e "${GREEN}✅ Environment configuration created with secure passwords${NC}"
fi

# Start the platform
echo -e "${BLUE}🔧 Building and starting services...${NC}"

# Use development docker-compose if production doesn't exist
COMPOSE_FILE="docker-compose.yml"
if [ -f "docker-compose.prod.yml" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
fi

# Start infrastructure services first
echo -e "${BLUE}📊 Starting infrastructure services...${NC}"
docker-compose -f $COMPOSE_FILE up -d postgres mongodb redis elasticsearch

# Wait for databases
echo -e "${BLUE}⏳ Waiting for databases to initialize...${NC}"
sleep 30

# Start remaining services
echo -e "${BLUE}🚀 Starting application services...${NC}"
docker-compose -f $COMPOSE_FILE up -d

# Wait for services to be ready
echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
sleep 45

# Health check
echo -e "${BLUE}🔍 Running health checks...${NC}"

# Check if frontend is accessible
FRONTEND_READY=false
for i in {1..30}; do
    if curl -f -s http://localhost:3000 >/dev/null 2>&1; then
        FRONTEND_READY=true
        break
    fi
    sleep 2
done

# Display results
echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                           🎉 LAUNCH COMPLETE! 🎉                            ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝${NC}\n"

if [ "$FRONTEND_READY" = true ]; then
    echo -e "${GREEN}✅ Frontend Application: http://localhost:3000${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend Application: http://localhost:3000 (still starting...)${NC}"
fi

echo -e "${GREEN}✅ API Gateway: http://localhost:8000${NC}"
echo -e "${GREEN}✅ Kong Admin: http://localhost:8001${NC}"

# Check if monitoring services are available
if docker-compose -f $COMPOSE_FILE ps grafana | grep -q "Up"; then
    echo -e "${GREEN}✅ Grafana Dashboard: http://localhost:3001 (admin/admin123)${NC}"
fi

if docker-compose -f $COMPOSE_FILE ps prometheus | grep -q "Up"; then
    echo -e "${GREEN}✅ Prometheus: http://localhost:9090${NC}"
fi

echo -e "\n${BLUE}📋 Service Status:${NC}"
docker-compose -f $COMPOSE_FILE ps

echo -e "\n${YELLOW}📝 Next Steps:${NC}"
echo -e "   1. Open http://localhost:3000 in your browser"
echo -e "   2. Create your admin account"
echo -e "   3. Configure your organization settings"
echo -e "   4. Start managing compliance workflows"

echo -e "\n${BLUE}🛠️  Useful Commands:${NC}"
echo -e "   View logs: docker-compose -f $COMPOSE_FILE logs -f [service]"
echo -e "   Stop platform: docker-compose -f $COMPOSE_FILE down"
echo -e "   Restart service: docker-compose -f $COMPOSE_FILE restart [service]"

echo -e "\n${GREEN}🔐 Security Note:${NC}"
echo -e "   Default passwords have been generated in .env.production"
echo -e "   Please change them for production use!"

echo -e "\n${BLUE}📞 Support:${NC}"
echo -e "   Documentation: Check the README.md file"
echo -e "   Issues: Report any issues in the project repository"

echo -e "\n${GREEN}Happy Compliance Management! 🎯${NC}\n"
