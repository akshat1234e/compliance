#!/bin/bash

# =============================================================================
# RBI Compliance Platform - Service Testing Script
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
echo "║                    RBI COMPLIANCE PLATFORM - SERVICE TEST                   ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Test Frontend
echo -e "${BLUE}🌐 Testing Frontend...${NC}"
if [ -f "frontend/package.json" ]; then
    echo -e "${GREEN}✅ Frontend package.json exists${NC}"
    if [ -f "frontend/src/app/page.tsx" ]; then
        echo -e "${GREEN}✅ Frontend main page exists${NC}"
    else
        echo -e "${RED}❌ Frontend main page missing${NC}"
    fi
    if [ -f "frontend/next.config.js" ]; then
        echo -e "${GREEN}✅ Next.js config exists${NC}"
    else
        echo -e "${RED}❌ Next.js config missing${NC}"
    fi
else
    echo -e "${RED}❌ Frontend package.json missing${NC}"
fi

# Test Auth Service
echo -e "\n${BLUE}🔐 Testing Auth Service...${NC}"
if [ -f "services/auth-service/package.json" ]; then
    echo -e "${GREEN}✅ Auth service package.json exists${NC}"
    if [ -f "services/auth-service/src/index.ts" ]; then
        echo -e "${GREEN}✅ Auth service main file exists${NC}"
    else
        echo -e "${RED}❌ Auth service main file missing${NC}"
    fi
    if [ -f "services/auth-service/tsconfig.json" ]; then
        echo -e "${GREEN}✅ Auth service TypeScript config exists${NC}"
    else
        echo -e "${RED}❌ Auth service TypeScript config missing${NC}"
    fi
else
    echo -e "${RED}❌ Auth service package.json missing${NC}"
fi

# Test Other Services
echo -e "\n${BLUE}🔧 Testing Other Services...${NC}"
services=("compliance-orchestration" "document-management" "regulatory-intelligence" "reporting-analytics" "risk-assessment" "integration-gateway")

for service in "${services[@]}"; do
    if [ -f "services/$service/package.json" ]; then
        echo -e "${GREEN}✅ $service package.json exists${NC}"
    else
        echo -e "${YELLOW}⚠️  $service package.json missing${NC}"
    fi
done

# Test Scripts
echo -e "\n${BLUE}📜 Testing Scripts...${NC}"
scripts=("launch.sh" "launch-dev.sh")

for script in "${scripts[@]}"; do
    if [ -f "$script" ]; then
        echo -e "${GREEN}✅ $script exists${NC}"
        if [ -x "$script" ]; then
            echo -e "${GREEN}✅ $script is executable${NC}"
        else
            echo -e "${YELLOW}⚠️  $script is not executable${NC}"
        fi
    else
        echo -e "${RED}❌ $script missing${NC}"
    fi
done

# Test Configuration Files
echo -e "\n${BLUE}⚙️  Testing Configuration Files...${NC}"
configs=("docker-compose.yml" "package.json" ".env.example")

for config in "${configs[@]}"; do
    if [ -f "$config" ]; then
        echo -e "${GREEN}✅ $config exists${NC}"
    else
        echo -e "${YELLOW}⚠️  $config missing${NC}"
    fi
done

echo -e "\n${GREEN}🎉 Service testing completed!${NC}"
echo -e "\n${BLUE}📋 Next Steps:${NC}"
echo -e "   1. Install dependencies: npm install"
echo -e "   2. Start frontend: npm run dev"
echo -e "   3. Start auth service: cd services/auth-service && npm install && npm run dev"
echo -e "   4. Open browser: http://localhost:3000"

echo -e "\n${YELLOW}📝 Notes:${NC}"
echo -e "   - Frontend should be accessible at http://localhost:3000"
echo -e "   - Auth service should be accessible at http://localhost:3001"
echo -e "   - Health check: http://localhost:3001/health"
echo -e "   - Test page: http://localhost:3000/test"
