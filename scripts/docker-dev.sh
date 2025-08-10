#!/bin/bash

# =============================================================================
# Docker Development Environment Management Script
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    fi
}

# Function to start development environment
start_dev() {
    print_status "Starting RBI Compliance Platform development environment..."
    check_docker
    
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
    
    print_status "Waiting for services to be healthy..."
    sleep 10
    
    # Check service health
    print_status "Checking service health..."
    docker-compose ps
    
    print_success "Development environment started successfully!"
    print_status "Available services:"
    echo "  - PostgreSQL: localhost:5432 (admin: postgres/postgres)"
    echo "  - MongoDB: localhost:27017 (admin: root/mongodb)"
    echo "  - Redis: localhost:6379"
    echo "  - Elasticsearch: localhost:9200"
    echo "  - Kafka: localhost:9092"
    echo "  - RabbitMQ: localhost:5672 (management: localhost:15672, guest/guest)"
    echo ""
    echo "  Development Tools:"
    echo "  - Adminer (PostgreSQL): http://localhost:8080"
    echo "  - Mongo Express: http://localhost:8081 (admin/admin)"
    echo "  - Redis Commander: http://localhost:8082"
    echo "  - Kibana: http://localhost:5601"
}

# Function to stop development environment
stop_dev() {
    print_status "Stopping RBI Compliance Platform development environment..."
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
    print_success "Development environment stopped successfully!"
}

# Function to restart development environment
restart_dev() {
    print_status "Restarting RBI Compliance Platform development environment..."
    stop_dev
    start_dev
}

# Function to view logs
logs_dev() {
    if [ -z "$1" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
    else
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f "$1"
    fi
}

# Function to clean up development environment
clean_dev() {
    print_warning "This will remove all containers, volumes, and data. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Cleaning up development environment..."
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v --remove-orphans
        docker system prune -f
        print_success "Development environment cleaned up successfully!"
    else
        print_status "Cleanup cancelled."
    fi
}

# Function to show status
status_dev() {
    print_status "RBI Compliance Platform development environment status:"
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps
}

# Main script logic
case "$1" in
    start)
        start_dev
        ;;
    stop)
        stop_dev
        ;;
    restart)
        restart_dev
        ;;
    logs)
        logs_dev "$2"
        ;;
    status)
        status_dev
        ;;
    clean)
        clean_dev
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs [service]|status|clean}"
        echo ""
        echo "Commands:"
        echo "  start    - Start the development environment"
        echo "  stop     - Stop the development environment"
        echo "  restart  - Restart the development environment"
        echo "  logs     - View logs (optionally for a specific service)"
        echo "  status   - Show status of all services"
        echo "  clean    - Clean up all containers and volumes"
        exit 1
        ;;
esac
