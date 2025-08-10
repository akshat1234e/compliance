#!/bin/bash

# =============================================================================
# Complete Setup Script for RBI Compliance Platform
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_header "CHECKING PREREQUISITES"
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js found: $NODE_VERSION"
    else
        print_error "Node.js not found. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    # Check Python
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version)
        print_success "Python found: $PYTHON_VERSION"
    else
        print_error "Python 3 not found. Please install Python 3.9+ and try again."
        exit 1
    fi
    
    # Check Docker
    if command -v docker &> /dev/null; then
        if docker info &> /dev/null; then
            DOCKER_VERSION=$(docker --version)
            print_success "Docker found and running: $DOCKER_VERSION"
        else
            print_error "Docker found but not running. Please start Docker Desktop and try again."
            exit 1
        fi
    else
        print_error "Docker not found. Please install Docker Desktop and try again."
        exit 1
    fi
    
    # Check Git
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version)
        print_success "Git found: $GIT_VERSION"
    else
        print_error "Git not found. Please install Git and try again."
        exit 1
    fi
}

# Function to install dependencies
install_dependencies() {
    print_header "INSTALLING DEPENDENCIES"
    
    print_status "Installing root dependencies..."
    npm install
    
    print_status "Installing shared library dependencies..."
    npm install --workspace=shared/types
    npm install --workspace=shared/utils
    npm install --workspace=shared/constants
    
    print_success "Dependencies installed successfully!"
}

# Function to setup environment
setup_environment() {
    print_header "SETTING UP ENVIRONMENT"
    
    if [ ! -f ".env.development" ]; then
        print_status "Creating .env.development from template..."
        cp .env.example .env.development
        print_success ".env.development created"
    else
        print_warning ".env.development already exists, skipping..."
    fi
    
    print_status "Environment setup completed!"
}

# Function to start infrastructure
start_infrastructure() {
    print_header "STARTING INFRASTRUCTURE"
    
    print_status "Starting Docker infrastructure..."
    ./scripts/docker-dev.sh start
    
    print_status "Waiting for services to be ready..."
    sleep 15
    
    print_status "Setting up Kafka topics..."
    ./scripts/setup-kafka-topics.sh
    
    print_status "Setting up RabbitMQ queues..."
    ./scripts/setup-rabbitmq.sh
    
    print_status "Setting up Kong API Gateway..."
    ./scripts/setup-kong.sh
    
    print_success "Infrastructure setup completed!"
}

# Function to verify setup
verify_setup() {
    print_header "VERIFYING SETUP"
    
    print_status "Checking service health..."
    
    # Check PostgreSQL
    if docker exec rbi-postgres pg_isready -U postgres &> /dev/null; then
        print_success "PostgreSQL is healthy"
    else
        print_warning "PostgreSQL health check failed"
    fi
    
    # Check MongoDB
    if docker exec rbi-mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
        print_success "MongoDB is healthy"
    else
        print_warning "MongoDB health check failed"
    fi
    
    # Check Redis
    if docker exec rbi-redis redis-cli ping | grep -q "PONG"; then
        print_success "Redis is healthy"
    else
        print_warning "Redis health check failed"
    fi
    
    # Check Elasticsearch
    if curl -s http://localhost:9200/_cluster/health &> /dev/null; then
        print_success "Elasticsearch is healthy"
    else
        print_warning "Elasticsearch health check failed"
    fi
    
    # Check Kong
    if curl -s http://localhost:8001/ &> /dev/null; then
        print_success "Kong API Gateway is healthy"
    else
        print_warning "Kong API Gateway health check failed"
    fi
}

# Function to display summary
display_summary() {
    print_header "SETUP COMPLETE!"
    
    echo -e "${GREEN}🎉 RBI Compliance Platform development environment is ready!${NC}"
    echo ""
    echo -e "${BLUE}📋 Available Services:${NC}"
    echo "  • PostgreSQL: localhost:5432 (postgres/postgres)"
    echo "  • MongoDB: localhost:27017 (root/mongodb)"
    echo "  • Redis: localhost:6379"
    echo "  • Elasticsearch: localhost:9200"
    echo "  • Kafka: localhost:9092"
    echo "  • RabbitMQ: localhost:5672 (guest/guest)"
    echo "  • Kong Admin: http://localhost:8001"
    echo "  • Kong Proxy: http://localhost:8000"
    echo ""
    echo -e "${BLUE}🛠️ Development Tools:${NC}"
    echo "  • Adminer (PostgreSQL): http://localhost:8080"
    echo "  • Mongo Express: http://localhost:8081 (admin/admin)"
    echo "  • Redis Commander: http://localhost:8082"
    echo "  • Kibana: http://localhost:5601"
    echo "  • RabbitMQ Management: http://localhost:15672 (guest/guest)"
    echo ""
    echo -e "${BLUE}🚀 Next Steps:${NC}"
    echo "  1. Start developing services: npm run dev"
    echo "  2. View service logs: ./scripts/docker-dev.sh logs"
    echo "  3. Check service status: ./scripts/docker-dev.sh status"
    echo "  4. Read documentation: cat README.md"
    echo ""
    echo -e "${YELLOW}💡 Tip: Use './scripts/docker-dev.sh stop' to stop all services${NC}"
}

# Main execution
main() {
    print_header "RBI COMPLIANCE PLATFORM SETUP"
    echo -e "${BLUE}Starting complete setup process...${NC}"
    echo ""
    
    check_prerequisites
    install_dependencies
    setup_environment
    start_infrastructure
    verify_setup
    display_summary
}

# Run main function
main "$@"
