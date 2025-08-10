#!/bin/bash

# =============================================================================
# Database Migration Management Script
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

# Migration directory
MIGRATION_DIR="database/migrations"

# Function to check database connection
check_database() {
    print_status "Checking database connection..."
    
    if docker exec rbi-postgres pg_isready -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
        print_success "Database is accessible"
        return 0
    else
        print_error "Database is not accessible"
        return 1
    fi
}

# Function to create migration tracking table
create_migration_table() {
    print_status "Creating migration tracking table..."
    
    local create_table_sql="
    CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        version VARCHAR(20) NOT NULL UNIQUE,
        description TEXT,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        applied_by VARCHAR(100) DEFAULT current_user,
        checksum VARCHAR(64),
        execution_time_ms INTEGER,
        rollback_sql TEXT
    );
    
    CREATE INDEX IF NOT EXISTS idx_schema_migrations_version ON schema_migrations(version);
    CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at ON schema_migrations(applied_at);
    "
    
    if docker exec rbi-postgres psql -U "$DB_USER" -d "$DB_NAME" -c "$create_table_sql" > /dev/null 2>&1; then
        print_success "Migration tracking table ready"
    else
        print_error "Failed to create migration tracking table"
        return 1
    fi
}

# Function to get current schema version
get_current_version() {
    local version=$(docker exec rbi-postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COALESCE(MAX(version), '000') 
        FROM schema_migrations 
        WHERE applied_at IS NOT NULL;
    " 2>/dev/null | tr -d ' ')
    
    echo "$version"
}

# Function to get available migrations
get_available_migrations() {
    if [ -d "$MIGRATION_DIR" ]; then
        ls "$MIGRATION_DIR"/*.sql 2>/dev/null | sort | sed 's/.*\///g' | sed 's/\.sql$//g'
    fi
}

# Function to get pending migrations
get_pending_migrations() {
    local current_version=$(get_current_version)
    local available_migrations=$(get_available_migrations)
    
    for migration in $available_migrations; do
        local migration_version=$(echo "$migration" | cut -d'_' -f1)
        if [ "$migration_version" \> "$current_version" ]; then
            echo "$migration"
        fi
    done
}

# Function to apply a single migration
apply_migration() {
    local migration_file=$1
    local migration_version=$(echo "$migration_file" | cut -d'_' -f1)
    local migration_name=$(echo "$migration_file" | sed 's/^[0-9]*_//g')
    
    print_status "Applying migration $migration_version: $migration_name"
    
    local start_time=$(date +%s%3N)
    
    # Check if migration is already applied
    local applied_count=$(docker exec rbi-postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*) FROM schema_migrations WHERE version = '$migration_version';
    " 2>/dev/null | tr -d ' ')
    
    if [ "$applied_count" -gt 0 ]; then
        print_warning "Migration $migration_version already applied, skipping"
        return 0
    fi
    
    # Apply the migration
    if docker exec -i rbi-postgres psql -U "$DB_USER" -d "$DB_NAME" < "$MIGRATION_DIR/$migration_file.sql"; then
        local end_time=$(date +%s%3N)
        local execution_time=$((end_time - start_time))
        
        # Record successful migration
        docker exec rbi-postgres psql -U "$DB_USER" -d "$DB_NAME" -c "
            INSERT INTO schema_migrations (version, description, execution_time_ms) 
            VALUES ('$migration_version', '$migration_name', $execution_time)
            ON CONFLICT (version) DO UPDATE SET 
                applied_at = CURRENT_TIMESTAMP,
                execution_time_ms = $execution_time;
        " > /dev/null 2>&1
        
        print_success "Migration $migration_version applied successfully (${execution_time}ms)"
        return 0
    else
        print_error "Failed to apply migration $migration_version"
        return 1
    fi
}

# Function to show migration status
show_status() {
    print_header "MIGRATION STATUS"
    
    local current_version=$(get_current_version)
    print_status "Current schema version: $current_version"
    
    print_status "Applied migrations:"
    docker exec rbi-postgres psql -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            version,
            description,
            applied_at,
            execution_time_ms || 'ms' as execution_time
        FROM schema_migrations 
        ORDER BY version;
    "
    
    local pending_migrations=$(get_pending_migrations)
    if [ -n "$pending_migrations" ]; then
        print_warning "Pending migrations:"
        for migration in $pending_migrations; do
            echo "  - $migration"
        done
    else
        print_success "No pending migrations"
    fi
}

# Function to migrate to latest version
migrate_up() {
    print_header "MIGRATING DATABASE TO LATEST VERSION"
    
    local pending_migrations=$(get_pending_migrations)
    
    if [ -z "$pending_migrations" ]; then
        print_success "Database is already up to date"
        return 0
    fi
    
    print_status "Found $(echo "$pending_migrations" | wc -w) pending migration(s)"
    
    for migration in $pending_migrations; do
        if ! apply_migration "$migration"; then
            print_error "Migration failed, stopping"
            return 1
        fi
    done
    
    print_success "All migrations applied successfully"
    show_status
}

# Function to create a new migration
create_migration() {
    local description=$1
    
    if [ -z "$description" ]; then
        print_error "Migration description is required"
        echo "Usage: $0 create \"Description of the migration\""
        return 1
    fi
    
    # Get next version number
    local current_version=$(get_current_version)
    local next_version=$(printf "%03d" $((10#$current_version + 1)))
    
    # Create migration filename
    local migration_name=$(echo "$description" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/_/g' | sed 's/__*/_/g' | sed 's/^_\|_$//g')
    local migration_file="${next_version}_${migration_name}.sql"
    
    # Create migration file
    cat > "$MIGRATION_DIR/$migration_file" << EOF
-- =============================================================================
-- MIGRATION $next_version: $(echo "$description" | tr '[:lower:]' '[:upper:]')
-- Enterprise RBI Compliance Management Platform
-- =============================================================================

-- Migration metadata
-- Version: $next_version
-- Description: $description
-- Author: $(whoami)
-- Date: $(date +%Y-%m-%d)

-- =============================================================================
-- MIGRATION UP
-- =============================================================================

-- Record this migration
INSERT INTO schema_migrations (version, description, checksum) 
VALUES ('$next_version', '$description', 'checksum_$next_version')
ON CONFLICT (version) DO NOTHING;

-- Add your migration SQL here
-- Example:
-- ALTER TABLE users ADD COLUMN new_field VARCHAR(100);
-- CREATE INDEX idx_users_new_field ON users(new_field);

-- =============================================================================
-- MIGRATION DOWN (for rollback)
-- =============================================================================

-- Add rollback SQL here (commented out)
-- Example:
-- DROP INDEX IF EXISTS idx_users_new_field;
-- ALTER TABLE users DROP COLUMN IF EXISTS new_field;
-- DELETE FROM schema_migrations WHERE version = '$next_version';
EOF

    print_success "Created migration file: $MIGRATION_DIR/$migration_file"
    print_status "Edit the file to add your migration SQL"
}

# Function to show help
show_help() {
    echo "Database Migration Management Script"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  status              Show current migration status"
    echo "  up                  Apply all pending migrations"
    echo "  create \"description\" Create a new migration file"
    echo "  help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 status"
    echo "  $0 up"
    echo "  $0 create \"Add user preferences table\""
}

# Main execution
main() {
    local command=${1:-status}
    
    case "$command" in
        "status")
            if check_database && create_migration_table; then
                show_status
            fi
            ;;
        "up")
            if check_database && create_migration_table; then
                migrate_up
            fi
            ;;
        "create")
            create_migration "$2"
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
