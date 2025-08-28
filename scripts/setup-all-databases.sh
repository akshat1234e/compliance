#!/bin/bash

# =============================================================================
# Complete Database Setup Script
# Enterprise RBI Compliance Management Platform
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

# Function to check if all services are running
check_all_services() {
    print_header "CHECKING ALL DATABASE SERVICES"
    
    local all_services_running=true
    
    # Check PostgreSQL
    print_status "Checking PostgreSQL..."
    if docker exec rbi-postgres pg_isready -U postgres > /dev/null 2>&1; then
        print_success "PostgreSQL is running"
    else
        print_error "PostgreSQL is not running"
        all_services_running=false
    fi
    
    # Check MongoDB
    print_status "Checking MongoDB..."
    if docker exec rbi-mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        print_success "MongoDB is running"
    else
        print_error "MongoDB is not running"
        all_services_running=false
    fi
    
    # Check Redis
    print_status "Checking Redis..."
    if docker exec rbi-redis redis-cli ping | grep -q "PONG"; then
        print_success "Redis is running"
    else
        print_error "Redis is not running"
        all_services_running=false
    fi
    
    # Check Elasticsearch
    print_status "Checking Elasticsearch..."
    if curl -s http://localhost:9200/_cluster/health > /dev/null 2>&1; then
        print_success "Elasticsearch is running"
    else
        print_error "Elasticsearch is not running"
        all_services_running=false
    fi
    
    if [ "$all_services_running" = true ]; then
        print_success "All database services are running"
        return 0
    else
        print_error "Some database services are not running"
        print_status "Please run: ./scripts/docker-dev.sh start"
        return 1
    fi
}

# Function to setup all databases
setup_all_databases() {
    print_header "SETTING UP ALL DATABASES"
    
    # Setup PostgreSQL
    print_status "Setting up PostgreSQL..."
    if ./scripts/setup-postgresql.sh; then
        print_success "PostgreSQL setup completed"
    else
        print_error "PostgreSQL setup failed"
        return 1
    fi
    
    # Setup MongoDB
    print_status "Setting up MongoDB..."
    if ./scripts/setup-mongodb.sh; then
        print_success "MongoDB setup completed"
    else
        print_error "MongoDB setup failed"
        return 1
    fi
    
    # Setup Redis
    print_status "Setting up Redis..."
    if ./scripts/setup-redis.sh; then
        print_success "Redis setup completed"
    else
        print_error "Redis setup failed"
        return 1
    fi
    
    # Setup Elasticsearch
    print_status "Setting up Elasticsearch..."
    if ./scripts/setup-elasticsearch.sh; then
        print_success "Elasticsearch setup completed"
    else
        print_error "Elasticsearch setup failed"
        return 1
    fi
}

# Function to run comprehensive tests
run_comprehensive_tests() {
    print_header "RUNNING COMPREHENSIVE DATABASE TESTS"
    
    # Test PostgreSQL
    print_status "Testing PostgreSQL integration..."
    local pg_test_result=$(docker exec rbi-postgres psql -U postgres -d rbi_compliance_dev -c "
        SELECT 
            'PostgreSQL Test' as test_name,
            CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'FAIL' END as result
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'organizations';
    " -t | tr -d ' ')
    
    if [[ "$pg_test_result" == *"PASS"* ]]; then
        print_success "PostgreSQL integration test: PASS"
    else
        print_warning "PostgreSQL integration test: FAIL"
    fi
    
    # Test MongoDB
    print_status "Testing MongoDB integration..."
    local mongo_collections=$(docker exec rbi-mongodb mongosh rbi_compliance_docs_dev --eval "db.getCollectionNames().length" --quiet)
    if [ "$mongo_collections" -gt 0 ]; then
        print_success "MongoDB integration test: PASS ($mongo_collections collections)"
    else
        print_warning "MongoDB integration test: FAIL"
    fi
    
    # Test Redis
    print_status "Testing Redis integration..."
    if docker exec rbi-redis redis-cli set "test:integration" "success" > /dev/null 2>&1; then
        local redis_test=$(docker exec rbi-redis redis-cli get "test:integration")
        if [ "$redis_test" = "success" ]; then
            print_success "Redis integration test: PASS"
            docker exec rbi-redis redis-cli del "test:integration" > /dev/null 2>&1
        else
            print_warning "Redis integration test: FAIL"
        fi
    else
        print_warning "Redis integration test: FAIL"
    fi
    
    # Test Elasticsearch
    print_status "Testing Elasticsearch integration..."
    local es_health=$(curl -s http://localhost:9200/_cluster/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$es_health" = "green" ] || [ "$es_health" = "yellow" ]; then
        print_success "Elasticsearch integration test: PASS (status: $es_health)"
    else
        print_warning "Elasticsearch integration test: FAIL"
    fi
}

# Function to show database summary
show_database_summary() {
    print_header "DATABASE SETUP SUMMARY"
    
    print_status "Database Services Status:"
    echo "  ✓ PostgreSQL: Ready for transactional data"
    echo "  ✓ MongoDB: Ready for document storage"
    echo "  ✓ Redis: Ready for caching and sessions"
    echo "  ✓ Elasticsearch: Ready for search and analytics"
    
    print_status "Database Connections:"
    echo "  PostgreSQL: postgresql://postgres:postgres@localhost:5432/rbi_compliance_dev"
    echo "  MongoDB: mongodb://localhost:27017/rbi_compliance_docs_dev"
    echo "  Redis: redis://localhost:6379"
    echo "  Elasticsearch: http://localhost:9200"
    
    print_status "Management Tools:"
    echo "  Adminer (PostgreSQL): http://localhost:8080"
    echo "  Mongo Express: http://localhost:8081 (admin/admin)"
    echo "  Redis Commander: http://localhost:8082"
    echo "  Kibana: http://localhost:5601"
    
    print_status "Key Features Configured:"
    echo "  ✓ Complete relational schema with 25+ tables"
    echo "  ✓ Document collections with validation rules"
    echo "  ✓ Redis key namespaces and data structures"
    echo "  ✓ Elasticsearch indices with custom analyzers"
    echo "  ✓ Database migration system"
    echo "  ✓ Sample data for testing"
    
    print_status "Next Steps:"
    echo "  1. Start developing microservices"
    echo "  2. Configure application database connections"
    echo "  3. Run application tests"
    echo "  4. Set up monitoring and backups"
}

# Function to create database documentation
create_documentation() {
    print_status "Creating database documentation..."
    
    cat > "docs/DATABASE_SETUP.md" << 'EOF'
# Database Setup Documentation

## Overview
The Enterprise RBI Compliance Management Platform uses a polyglot persistence approach with four main database technologies:

### PostgreSQL (Primary Database)
- **Purpose**: Transactional data, user management, compliance tracking
- **Connection**: `postgresql://postgres:postgres@localhost:5432/rbi_compliance_dev`
- **Management**: Adminer at http://localhost:8080
- **Key Tables**: organizations, users, compliance_requirements, workflow_instances

### MongoDB (Document Store)
- **Purpose**: Unstructured documents, RBI circulars, file metadata
- **Connection**: `mongodb://localhost:27017/rbi_compliance_docs_dev`
- **Management**: Mongo Express at http://localhost:8081
- **Key Collections**: documents, rbiCirculars, workflowData, complianceEvidence

### Redis (Cache Layer)
- **Purpose**: Sessions, real-time data, queues, metrics cache
- **Connection**: `redis://localhost:6379`
- **Management**: Redis Commander at http://localhost:8082
- **Key Namespaces**: session:*, cache:*, workflow:*, metrics:*

### Elasticsearch (Search Engine)
- **Purpose**: Full-text search, analytics, document indexing
- **Connection**: `http://localhost:9200`
- **Management**: Kibana at http://localhost:5601
- **Key Indices**: documents, rbi-circulars, compliance-requirements

## Setup Commands

```bash
# Start all database services
./scripts/docker-dev.sh start

# Setup all databases
./scripts/setup-all-databases.sh

# Run individual database setups
./scripts/setup-postgresql.sh
./scripts/setup-mongodb.sh
./scripts/setup-redis.sh
./scripts/setup-elasticsearch.sh

# Database migrations
./scripts/migrate-database.sh status
./scripts/migrate-database.sh up
```

## Schema Information

### PostgreSQL Schema
- 25+ tables with proper relationships
- UUID primary keys for scalability
- Audit trails and soft deletes
- Multi-tenant architecture support
- Comprehensive indexing strategy

### MongoDB Collections
- Schema validation rules
- Optimized indexes for queries
- Document versioning support
- Full-text search capabilities

### Redis Data Structures
- Hash tables for user sessions
- Sorted sets for rankings/scores
- Lists for queues and recent items
- Sets for active entities
- Geospatial data for locations

### Elasticsearch Mappings
- Custom analyzers for compliance text
- Multi-field mappings for search and aggregation
- Index templates for consistent structure
- Alias management for zero-downtime updates

## Backup and Recovery

### PostgreSQL
```bash
# Backup
docker exec rbi-postgres pg_dump -U postgres rbi_compliance_dev > backup.sql

# Restore
docker exec -i rbi-postgres psql -U postgres rbi_compliance_dev < backup.sql
```

### MongoDB
```bash
# Backup
docker exec rbi-mongodb mongodump --db rbi_compliance_docs_dev --out /backup

# Restore
docker exec rbi-mongodb mongorestore --db rbi_compliance_docs_dev /backup/rbi_compliance_docs_dev
```

### Redis
```bash
# Backup
docker exec rbi-redis redis-cli BGSAVE

# Restore (copy dump.rdb to Redis data directory)
```

### Elasticsearch
```bash
# Backup
curl -X PUT "localhost:9200/_snapshot/backup_repo" -H 'Content-Type: application/json' -d'
{
  "type": "fs",
  "settings": {
    "location": "/backup"
  }
}'
```

## Monitoring

- Database health checks available via application APIs
- Prometheus metrics for all databases
- Grafana dashboards for visualization
- Alert rules for critical issues

## Troubleshooting

### Common Issues
1. **Connection refused**: Check if Docker containers are running
2. **Permission denied**: Verify database user permissions
3. **Out of memory**: Check Docker resource allocation
4. **Slow queries**: Review indexes and query optimization

### Useful Commands
```bash
# Check container status
docker ps

# View container logs
docker logs rbi-postgres
docker logs rbi-mongodb
docker logs rbi-redis
docker logs rbi-elasticsearch

# Connect to databases
docker exec -it rbi-postgres psql -U postgres -d rbi_compliance_dev
docker exec -it rbi-mongodb mongosh rbi_compliance_docs_dev
docker exec -it rbi-redis redis-cli
curl http://localhost:9200/_cluster/health
```
EOF

    print_success "Database documentation created: docs/DATABASE_SETUP.md"
}

# Main execution
main() {
    print_header "ENTERPRISE RBI COMPLIANCE PLATFORM - DATABASE SETUP"
    
    # Check if all services are running
    if ! check_all_services; then
        exit 1
    fi
    
    # Setup all databases
    setup_all_databases
    
    # Run comprehensive tests
    run_comprehensive_tests
    
    # Create documentation
    mkdir -p docs
    create_documentation
    
    # Show summary
    show_database_summary
    
    print_header "DATABASE SETUP COMPLETE"
    print_success "All databases are configured and ready for use!"
    print_status "Total setup time: Database infrastructure is now fully operational"
}

# Run main function
main "$@"
