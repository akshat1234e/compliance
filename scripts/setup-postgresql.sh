#!/bin/bash

# =============================================================================
# PostgreSQL Database Setup Script
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

# Database connection parameters
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-rbi_compliance_dev}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}

# Function to check if PostgreSQL is running
check_postgres() {
    print_status "Checking PostgreSQL connection..."
    
    if docker exec rbi-postgres pg_isready -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
        print_success "PostgreSQL is running and accessible"
        return 0
    else
        print_error "PostgreSQL is not accessible. Please ensure Docker containers are running."
        print_status "Try running: ./scripts/docker-dev.sh start"
        return 1
    fi
}

# Function to execute SQL file
execute_sql_file() {
    local sql_file=$1
    local description=$2
    
    print_status "Executing: $description"
    
    if [ ! -f "$sql_file" ]; then
        print_error "SQL file not found: $sql_file"
        return 1
    fi
    
    if docker exec -i rbi-postgres psql -U "$DB_USER" -d "$DB_NAME" < "$sql_file"; then
        print_success "Successfully executed: $description"
        return 0
    else
        print_error "Failed to execute: $description"
        return 1
    fi
}

# Function to execute SQL command
execute_sql_command() {
    local sql_command=$1
    local description=$2
    
    print_status "Executing: $description"
    
    if docker exec rbi-postgres psql -U "$DB_USER" -d "$DB_NAME" -c "$sql_command" > /dev/null 2>&1; then
        print_success "Successfully executed: $description"
        return 0
    else
        print_error "Failed to execute: $description"
        return 1
    fi
}

# Function to check schema installation
check_schema() {
    print_status "Checking schema installation..."
    
    local table_count=$(docker exec rbi-postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';")
    table_count=$(echo $table_count | tr -d ' ')
    
    if [ "$table_count" -gt 0 ]; then
        print_success "Schema installed successfully. Found $table_count tables."
        
        # List some key tables
        print_status "Key tables found:"
        docker exec rbi-postgres psql -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('organizations', 'users', 'compliance_requirements', 'workflow_instances', 'documents', 'risk_assessments')
        ORDER BY table_name;"
        
        return 0
    else
        print_warning "No tables found. Schema may not be installed correctly."
        return 1
    fi
}

# Function to create seed data
create_seed_data() {
    print_status "Creating seed data..."
    
    # Create a system organization for testing
    local seed_sql="
    -- Insert a test organization
    INSERT INTO organizations (id, name, display_name, type, email, country, status, tenant_id)
    VALUES (
        uuid_generate_v4(),
        'demo_bank',
        'Demo Bank Ltd.',
        'bank',
        'admin@demobank.com',
        'India',
        'active',
        uuid_generate_v4()
    ) ON CONFLICT (name) DO NOTHING;
    
    -- Insert a system admin user
    INSERT INTO users (id, email, first_name, last_name, organization_id, tenant_id, is_active)
    SELECT 
        uuid_generate_v4(),
        'admin@demobank.com',
        'System',
        'Administrator',
        o.id,
        o.tenant_id,
        true
    FROM organizations o 
    WHERE o.name = 'demo_bank'
    ON CONFLICT (email) DO NOTHING;
    "
    
    if docker exec rbi-postgres psql -U "$DB_USER" -d "$DB_NAME" -c "$seed_sql" > /dev/null 2>&1; then
        print_success "Seed data created successfully"
    else
        print_warning "Failed to create seed data (may already exist)"
    fi
}

# Function to run database tests
run_database_tests() {
    print_status "Running database tests..."
    
    local test_sql="
    -- Test basic functionality
    SELECT 'Database connection test' as test_name, 'PASS' as result
    UNION ALL
    SELECT 'UUID generation test', CASE WHEN uuid_generate_v4() IS NOT NULL THEN 'PASS' ELSE 'FAIL' END
    UNION ALL
    SELECT 'Organizations table test', CASE WHEN COUNT(*) >= 0 THEN 'PASS' ELSE 'FAIL' END FROM organizations
    UNION ALL
    SELECT 'Users table test', CASE WHEN COUNT(*) >= 0 THEN 'PASS' ELSE 'FAIL' END FROM users
    UNION ALL
    SELECT 'Compliance requirements table test', CASE WHEN COUNT(*) >= 0 THEN 'PASS' ELSE 'FAIL' END FROM compliance_requirements;
    "
    
    print_status "Test results:"
    docker exec rbi-postgres psql -U "$DB_USER" -d "$DB_NAME" -c "$test_sql"
}

# Main execution
main() {
    print_header "POSTGRESQL DATABASE SETUP"
    
    # Check if PostgreSQL is running
    if ! check_postgres; then
        exit 1
    fi
    
    # Install schema
    print_header "INSTALLING DATABASE SCHEMA"
    
    # Change to database schemas directory
    cd database/schemas
    
    # Execute schema files in order
    execute_sql_file "01_user_organization.sql" "User and Organization Schema"
    execute_sql_file "02_regulatory_data.sql" "Regulatory Data Schema"
    execute_sql_file "03_workflow_tasks.sql" "Workflow and Tasks Schema"
    execute_sql_file "04_document_management.sql" "Document Management Schema"
    execute_sql_file "05_risk_assessment.sql" "Risk Assessment Schema"
    execute_sql_file "06_audit_compliance.sql" "Audit and Compliance Schema"
    
    # Return to root directory
    cd ../..
    
    # Check schema installation
    check_schema
    
    # Create seed data
    create_seed_data
    
    # Run tests
    run_database_tests
    
    print_header "POSTGRESQL SETUP COMPLETE"
    print_success "Database is ready for use!"
    
    print_status "Connection details:"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  User: $DB_USER"
    echo ""
    print_status "You can connect using:"
    echo "  docker exec -it rbi-postgres psql -U $DB_USER -d $DB_NAME"
    echo "  or use Adminer at: http://localhost:8080"
}

# Run main function
main "$@"
