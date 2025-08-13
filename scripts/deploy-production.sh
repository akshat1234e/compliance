#!/bin/bash

# =============================================================================
# RBI Compliance Platform - Production Deployment Script
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_ENV="${DEPLOYMENT_ENV:-production}"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

# Logging functions
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

log_step() {
    echo -e "\n${BLUE}==>${NC} $1"
}

# Error handling
handle_error() {
    log_error "Deployment failed at line $1"
    log_error "Rolling back changes..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" down || true
    exit 1
}

trap 'handle_error $LINENO' ERR

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker is not running"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if environment file exists
    if [[ ! -f "$PROJECT_ROOT/$ENV_FILE" ]]; then
        log_error "Environment file $ENV_FILE not found"
        log_info "Please create $ENV_FILE with production configuration"
        exit 1
    fi
    
    # Check if required directories exist
    local required_dirs=("frontend" "services" "database" "k8s")
    for dir in "${required_dirs[@]}"; do
        if [[ ! -d "$PROJECT_ROOT/$dir" ]]; then
            log_error "Required directory $dir not found"
            exit 1
        fi
    done
    
    log_success "Prerequisites check passed"
}

# Validate environment configuration
validate_environment() {
    log_step "Validating environment configuration..."
    
    # Source environment file
    set -a
    source "$PROJECT_ROOT/$ENV_FILE"
    set +a
    
    # Check required environment variables
    local required_vars=(
        "POSTGRES_PASSWORD"
        "MONGODB_PASSWORD"
        "REDIS_PASSWORD"
        "JWT_SECRET"
        "SESSION_SECRET"
        "ENCRYPTION_KEY"
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
    
    # Validate password strength
    if [[ ${#POSTGRES_PASSWORD} -lt 12 ]]; then
        log_error "POSTGRES_PASSWORD must be at least 12 characters long"
        exit 1
    fi
    
    if [[ ${#JWT_SECRET} -lt 32 ]]; then
        log_error "JWT_SECRET must be at least 32 characters long"
        exit 1
    fi
    
    log_success "Environment configuration validated"
}

# Build Docker images
build_images() {
    log_step "Building Docker images..."
    
    # Build frontend
    log_info "Building frontend image..."
    docker build -t rbi-compliance/frontend:latest \
        --target production \
        "$PROJECT_ROOT/frontend"
    
    # Build backend services
    local services=("auth-service" "compliance-service" "document-management" "risk-assessment" "reporting-analytics" "regulatory-intelligence" "integration-gateway" "compliance-orchestration")
    
    for service in "${services[@]}"; do
        if [[ -d "$PROJECT_ROOT/services/$service" ]]; then
            log_info "Building $service image..."
            docker build -t "rbi-compliance/$service:latest" \
                "$PROJECT_ROOT/services/$service"
        fi
    done
    
    # Build AI services
    if [[ -d "$PROJECT_ROOT/ai-services" ]]; then
        log_info "Building AI services image..."
        docker build -t rbi-compliance/ai-services:latest \
            "$PROJECT_ROOT/ai-services"
    fi
    
    log_success "Docker images built successfully"
}

# Setup databases
setup_databases() {
    log_step "Setting up databases..."
    
    # Start database services first
    docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" up -d postgres mongodb redis elasticsearch
    
    # Wait for databases to be ready
    log_info "Waiting for databases to be ready..."
    sleep 30
    
    # Run database migrations
    if [[ -f "$PROJECT_ROOT/scripts/migrate-database.sh" ]]; then
        log_info "Running database migrations..."
        bash "$PROJECT_ROOT/scripts/migrate-database.sh"
    fi
    
    # Seed initial data
    if [[ -d "$PROJECT_ROOT/database/seeds" ]]; then
        log_info "Seeding initial data..."
        # Add seeding logic here
    fi
    
    log_success "Databases setup completed"
}

# Deploy services
deploy_services() {
    log_step "Deploying services..."
    
    # Start all services
    docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 60
    
    log_success "Services deployed successfully"
}

# Run health checks
run_health_checks() {
    log_step "Running health checks..."
    
    local services=("frontend" "postgres" "mongodb" "redis" "elasticsearch" "kong")
    local failed_services=()
    
    for service in "${services[@]}"; do
        log_info "Checking health of $service..."
        
        if docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" ps "$service" | grep -q "Up (healthy)"; then
            log_success "$service is healthy"
        else
            log_warning "$service health check failed"
            failed_services+=("$service")
        fi
    done
    
    if [[ ${#failed_services[@]} -gt 0 ]]; then
        log_error "Health checks failed for: ${failed_services[*]}"
        return 1
    fi
    
    log_success "All health checks passed"
}

# Setup monitoring
setup_monitoring() {
    log_step "Setting up monitoring..."
    
    # Start monitoring services
    docker-compose -f "$PROJECT_ROOT/$DOCKER_COMPOSE_FILE" up -d prometheus grafana
    
    # Wait for monitoring services
    sleep 30
    
    log_success "Monitoring setup completed"
}

# Configure SSL/TLS
configure_ssl() {
    log_step "Configuring SSL/TLS..."
    
    # Check if SSL certificates exist
    if [[ -f "/etc/ssl/certs/rbi-compliance.crt" && -f "/etc/ssl/private/rbi-compliance.key" ]]; then
        log_info "SSL certificates found"
    else
        log_warning "SSL certificates not found. Using self-signed certificates for development."
        # Generate self-signed certificates for development
        mkdir -p "$PROJECT_ROOT/ssl"
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$PROJECT_ROOT/ssl/rbi-compliance.key" \
            -out "$PROJECT_ROOT/ssl/rbi-compliance.crt" \
            -subj "/C=IN/ST=Maharashtra/L=Mumbai/O=RBI Compliance/CN=rbi-compliance.com"
    fi
    
    log_success "SSL/TLS configuration completed"
}

# Setup backup
setup_backup() {
    log_step "Setting up backup system..."
    
    # Create backup directories
    mkdir -p "$PROJECT_ROOT/backups/database"
    mkdir -p "$PROJECT_ROOT/backups/files"
    
    # Setup backup cron job
    if command -v crontab &> /dev/null; then
        log_info "Setting up backup cron job..."
        (crontab -l 2>/dev/null; echo "0 2 * * * $PROJECT_ROOT/scripts/backup-system.sh") | crontab -
    fi
    
    log_success "Backup system setup completed"
}

# Final verification
final_verification() {
    log_step "Running final verification..."
    
    # Test frontend accessibility
    if curl -f -s http://localhost:3000/health.json > /dev/null; then
        log_success "Frontend is accessible"
    else
        log_error "Frontend is not accessible"
        return 1
    fi
    
    # Test API gateway
    if curl -f -s http://localhost:8000 > /dev/null; then
        log_success "API Gateway is accessible"
    else
        log_error "API Gateway is not accessible"
        return 1
    fi
    
    log_success "Final verification completed"
}

# Cleanup function
cleanup() {
    log_step "Cleaning up..."
    
    # Remove unused Docker images
    docker image prune -f
    
    # Remove unused volumes
    docker volume prune -f
    
    log_success "Cleanup completed"
}

# Main deployment function
main() {
    log_step "Starting RBI Compliance Platform deployment..."
    
    cd "$PROJECT_ROOT"
    
    check_prerequisites
    validate_environment
    configure_ssl
    build_images
    setup_databases
    deploy_services
    setup_monitoring
    setup_backup
    run_health_checks
    final_verification
    cleanup
    
    log_success "🎉 RBI Compliance Platform deployed successfully!"
    log_info "Frontend: http://localhost:3000"
    log_info "API Gateway: http://localhost:8000"
    log_info "Kong Admin: http://localhost:8001"
    log_info "Grafana: http://localhost:3001"
    log_info "Prometheus: http://localhost:9090"
    
    log_info "Please update your DNS records to point to this server"
    log_info "Configure your load balancer to use SSL termination"
    log_info "Set up proper backup and monitoring alerts"
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
