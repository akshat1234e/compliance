#!/bin/bash

# =============================================================================
# RBI Compliance Platform - Production Startup Script
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

# Logging functions
log_header() {
    echo -e "\n${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}\n"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Error handling
handle_error() {
    log_error "Startup failed at line $1"
    log_error "Stopping services..."
    docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" down || true
    exit 1
}

trap 'handle_error $LINENO' ERR

# Check if running as root
check_user() {
    if [[ $EUID -eq 0 ]]; then
        log_warning "Running as root. Consider using a non-root user for better security."
    fi
}

# Check system requirements
check_system_requirements() {
    log_header "Checking System Requirements"
    
    # Check available memory
    local available_memory=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    if [[ $available_memory -lt 4096 ]]; then
        log_warning "Available memory is ${available_memory}MB. Recommended: 4GB+"
    else
        log_success "Available memory: ${available_memory}MB"
    fi
    
    # Check available disk space
    local available_disk=$(df -h / | awk 'NR==2{print $4}' | sed 's/G//')
    if [[ ${available_disk%.*} -lt 20 ]]; then
        log_warning "Available disk space is ${available_disk}GB. Recommended: 20GB+"
    else
        log_success "Available disk space: ${available_disk}GB"
    fi
    
    # Check CPU cores
    local cpu_cores=$(nproc)
    if [[ $cpu_cores -lt 2 ]]; then
        log_warning "CPU cores: $cpu_cores. Recommended: 2+"
    else
        log_success "CPU cores: $cpu_cores"
    fi
}

# Load and validate environment
load_environment() {
    log_header "Loading Environment Configuration"
    
    cd "$PROJECT_ROOT"
    
    if [[ ! -f "$ENV_FILE" ]]; then
        log_error "Environment file $ENV_FILE not found"
        log_info "Please create $ENV_FILE with production configuration"
        exit 1
    fi
    
    # Load environment variables
    set -a
    source "$ENV_FILE"
    set +a
    
    log_success "Environment configuration loaded"
    
    # Validate critical environment variables
    local required_vars=(
        "POSTGRES_PASSWORD"
        "MONGODB_PASSWORD"
        "REDIS_PASSWORD"
        "JWT_SECRET"
        "SESSION_SECRET"
    )
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "Missing required environment variables:"
        printf '%s\n' "${missing_vars[@]}"
        exit 1
    fi
    
    log_success "Environment validation passed"
}

# Setup directories
setup_directories() {
    log_header "Setting Up Directories"
    
    # Create necessary directories
    local directories=(
        "logs"
        "backups"
        "ssl"
        "uploads"
        "temp"
    )
    
    for dir in "${directories[@]}"; do
        if [[ ! -d "$PROJECT_ROOT/$dir" ]]; then
            mkdir -p "$PROJECT_ROOT/$dir"
            log_info "Created directory: $dir"
        fi
    done
    
    # Set proper permissions
    chmod 755 "$PROJECT_ROOT/logs"
    chmod 700 "$PROJECT_ROOT/ssl"
    chmod 755 "$PROJECT_ROOT/uploads"
    chmod 755 "$PROJECT_ROOT/temp"
    
    log_success "Directories setup completed"
}

# Pull latest images
pull_images() {
    log_header "Pulling Latest Docker Images"
    
    docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" pull
    
    log_success "Docker images updated"
}

# Start infrastructure services
start_infrastructure() {
    log_header "Starting Infrastructure Services"
    
    # Start databases first
    log_info "Starting database services..."
    docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" up -d postgres mongodb redis elasticsearch
    
    # Wait for databases to be ready
    log_info "Waiting for databases to be ready..."
    sleep 30
    
    # Start message queue services
    log_info "Starting message queue services..."
    docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" up -d zookeeper kafka rabbitmq
    
    # Wait for message queues
    sleep 20
    
    # Start API gateway
    log_info "Starting API gateway..."
    docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" up -d kong-database
    sleep 10
    docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" up -d kong
    
    log_success "Infrastructure services started"
}

# Run database migrations
run_migrations() {
    log_header "Running Database Migrations"
    
    if [[ -f "$PROJECT_ROOT/scripts/migrate-database.sh" ]]; then
        log_info "Running database migrations..."
        bash "$PROJECT_ROOT/scripts/migrate-database.sh"
        log_success "Database migrations completed"
    else
        log_warning "Migration script not found, skipping migrations"
    fi
}

# Start application services
start_applications() {
    log_header "Starting Application Services"
    
    # Start backend services
    log_info "Starting backend services..."
    docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" up -d \
        auth-service \
        compliance-service \
        document-management \
        risk-assessment \
        reporting-analytics \
        regulatory-intelligence \
        integration-gateway \
        compliance-orchestration \
        ai-services
    
    # Wait for backend services
    sleep 30
    
    # Start frontend
    log_info "Starting frontend..."
    docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" up -d frontend
    
    log_success "Application services started"
}

# Start monitoring services
start_monitoring() {
    log_header "Starting Monitoring Services"
    
    docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" up -d prometheus grafana
    
    log_success "Monitoring services started"
}

# Health checks
run_health_checks() {
    log_header "Running Health Checks"
    
    local max_attempts=30
    local attempt=1
    
    # Check frontend health
    log_info "Checking frontend health..."
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s http://localhost:3000/api/health > /dev/null; then
            log_success "Frontend is healthy"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            log_error "Frontend health check failed after $max_attempts attempts"
            return 1
        fi
        
        log_info "Attempt $attempt/$max_attempts: Frontend not ready, waiting..."
        sleep 5
        ((attempt++))
    done
    
    # Check API gateway
    log_info "Checking API gateway health..."
    attempt=1
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s http://localhost:8000 > /dev/null; then
            log_success "API Gateway is healthy"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            log_error "API Gateway health check failed after $max_attempts attempts"
            return 1
        fi
        
        log_info "Attempt $attempt/$max_attempts: API Gateway not ready, waiting..."
        sleep 5
        ((attempt++))
    done
    
    # Check database connections
    log_info "Checking database connections..."
    if docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" exec -T postgres pg_isready -U postgres > /dev/null; then
        log_success "PostgreSQL is healthy"
    else
        log_error "PostgreSQL health check failed"
        return 1
    fi
    
    log_success "All health checks passed"
}

# Display service information
display_service_info() {
    log_header "Service Information"
    
    echo -e "${GREEN}🎉 RBI Compliance Platform is now running!${NC}\n"
    
    echo -e "${BLUE}Frontend Application:${NC}"
    echo -e "  URL: http://localhost:3000"
    echo -e "  Health: http://localhost:3000/api/health\n"
    
    echo -e "${BLUE}API Gateway:${NC}"
    echo -e "  URL: http://localhost:8000"
    echo -e "  Admin: http://localhost:8001\n"
    
    echo -e "${BLUE}Monitoring:${NC}"
    echo -e "  Grafana: http://localhost:3001"
    echo -e "  Prometheus: http://localhost:9090\n"
    
    echo -e "${BLUE}Database Access:${NC}"
    echo -e "  PostgreSQL: localhost:5432"
    echo -e "  MongoDB: localhost:27017"
    echo -e "  Redis: localhost:6379"
    echo -e "  Elasticsearch: localhost:9200\n"
    
    echo -e "${YELLOW}Next Steps:${NC}"
    echo -e "  1. Configure your domain and SSL certificates"
    echo -e "  2. Set up proper firewall rules"
    echo -e "  3. Configure backup schedules"
    echo -e "  4. Set up monitoring alerts"
    echo -e "  5. Review security settings\n"
    
    echo -e "${BLUE}Useful Commands:${NC}"
    echo -e "  View logs: docker-compose -f $DOCKER_COMPOSE_FILE logs -f [service]"
    echo -e "  Stop services: docker-compose -f $DOCKER_COMPOSE_FILE down"
    echo -e "  Restart service: docker-compose -f $DOCKER_COMPOSE_FILE restart [service]"
    echo -e "  Check status: docker-compose -f $DOCKER_COMPOSE_FILE ps\n"
}

# Main function
main() {
    log_header "RBI Compliance Platform - Production Startup"
    
    check_user
    check_system_requirements
    load_environment
    setup_directories
    pull_images
    start_infrastructure
    run_migrations
    start_applications
    start_monitoring
    run_health_checks
    display_service_info
    
    log_success "Startup completed successfully!"
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
