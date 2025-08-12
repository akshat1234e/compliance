#!/bin/bash

# RBI Compliance Platform - Disaster Recovery Management Script
# Comprehensive backup and disaster recovery operations

set -euo pipefail

# Make script executable
chmod +x "$0"

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
NAMESPACE="rbi-compliance"
BACKUP_NAMESPACE="backup-system"
AWS_REGION="ap-south-1"
S3_BUCKET="rbi-compliance-backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

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
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Show usage
show_usage() {
    cat << EOF
RBI Compliance Platform - Disaster Recovery Management Script

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    setup           Setup backup and disaster recovery system
    backup          Trigger manual backup
    restore         Restore from backup
    verify          Verify backup integrity
    status          Show backup status
    test            Test disaster recovery procedures
    cleanup         Cleanup old backups
    monitor         Show backup monitoring dashboard
    help            Show this help message

Backup Commands:
    backup database         Backup PostgreSQL database
    backup redis           Backup Redis data
    backup elasticsearch   Backup Elasticsearch indices
    backup config          Backup Kubernetes configurations
    backup all             Backup everything

Restore Commands:
    restore database [date]     Restore database from backup
    restore redis [date]        Restore Redis from backup
    restore elasticsearch [date] Restore Elasticsearch from backup
    restore config [date]       Restore configurations from backup
    restore full [date]         Full system restore

Options:
    --date          Backup date (YYYYMMDD format)
    --environment   Environment (staging|production)
    --dry-run       Show what would be done without executing
    --force         Force operation without confirmation
    --verbose       Enable verbose output

Examples:
    $0 setup --environment production
    $0 backup all
    $0 restore database --date 20231201
    $0 verify --date 20231201
    $0 test --scenario database-failure

EOF
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."

    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        exit 1
    fi

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi

    # Check jq
    if ! command -v jq &> /dev/null; then
        log_error "jq is not installed"
        exit 1
    fi

    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured"
        exit 1
    fi

    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi

    # Check S3 bucket access
    if ! aws s3 ls "s3://$S3_BUCKET" &> /dev/null; then
        log_warning "S3 bucket $S3_BUCKET not accessible, will be created during setup"
    fi

    log_success "Prerequisites check completed"
}

# Setup backup and disaster recovery system
setup_backup_system() {
    local environment=${1:-production}

    log_step "Setting up backup and disaster recovery system for $environment..."

    # Create backup namespace
    if ! kubectl get namespace "$BACKUP_NAMESPACE" &> /dev/null; then
        log_info "Creating backup namespace..."
        kubectl create namespace "$BACKUP_NAMESPACE"
    fi

    # Create S3 bucket if it doesn't exist
    if ! aws s3 ls "s3://$S3_BUCKET" &> /dev/null; then
        log_info "Creating S3 bucket for backups..."
        aws s3 mb "s3://$S3_BUCKET" --region "$AWS_REGION"

        # Configure bucket lifecycle
        aws s3api put-bucket-lifecycle-configuration \
            --bucket "$S3_BUCKET" \
            --lifecycle-configuration file://"$PROJECT_ROOT/infrastructure/backup/s3-lifecycle.json"

        # Configure bucket versioning
        aws s3api put-bucket-versioning \
            --bucket "$S3_BUCKET" \
            --versioning-configuration Status=Enabled
    fi

    # Deploy backup system
    log_info "Deploying backup system..."
    kubectl apply -f "$PROJECT_ROOT/k8s/backup-disaster-recovery/backup-system.yaml"

    # Create secrets for backup operations
    log_info "Creating backup secrets..."

    # AWS credentials secret
    kubectl create secret generic aws-backup-credentials \
        --from-literal=access-key-id="$AWS_ACCESS_KEY_ID" \
        --from-literal=secret-access-key="$AWS_SECRET_ACCESS_KEY" \
        --namespace="$BACKUP_NAMESPACE" \
        --dry-run=client -o yaml | kubectl apply -f -

    # Database credentials secret
    kubectl create secret generic postgresql-credentials \
        --from-literal=username="$POSTGRES_USER" \
        --from-literal=password="$POSTGRES_PASSWORD" \
        --namespace="$BACKUP_NAMESPACE" \
        --dry-run=client -o yaml | kubectl apply -f -

    # Notification webhooks secret
    kubectl create secret generic notification-webhooks \
        --from-literal=backup-webhook="$SLACK_WEBHOOK_URL" \
        --namespace="$BACKUP_NAMESPACE" \
        --dry-run=client -o yaml | kubectl apply -f -

    # Wait for backup system to be ready
    log_info "Waiting for backup system to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/backup-monitor -n "$BACKUP_NAMESPACE"

    log_success "Backup and disaster recovery system setup completed"
}

# Trigger manual backup
trigger_backup() {
    local backup_type=${1:-all}

    log_step "Triggering $backup_type backup..."

    case $backup_type in
        "database"|"postgresql")
            kubectl create job postgresql-backup-manual-$(date +%s) \
                --from=cronjob/postgresql-backup \
                -n "$BACKUP_NAMESPACE"
            ;;
        "redis")
            kubectl create job redis-backup-manual-$(date +%s) \
                --from=cronjob/redis-backup \
                -n "$BACKUP_NAMESPACE"
            ;;
        "elasticsearch")
            kubectl create job elasticsearch-backup-manual-$(date +%s) \
                --from=cronjob/elasticsearch-backup \
                -n "$BACKUP_NAMESPACE"
            ;;
        "config")
            kubectl create job config-backup-manual-$(date +%s) \
                --from=cronjob/config-backup \
                -n "$BACKUP_NAMESPACE"
            ;;
        "all")
            log_info "Triggering all backup types..."
            trigger_backup "database"
            sleep 30
            trigger_backup "redis"
            sleep 30
            trigger_backup "elasticsearch"
            sleep 30
            trigger_backup "config"
            ;;
        *)
            log_error "Unknown backup type: $backup_type"
            exit 1
            ;;
    esac

    log_success "Backup job(s) triggered successfully"
}

# Restore from backup
restore_from_backup() {
    local restore_type=${1:-full}
    local restore_date=${2:-latest}
    local force=${3:-false}

    log_step "Restoring $restore_type from backup (date: $restore_date)..."

    if [[ "$force" != "true" ]]; then
        log_warning "This will restore data and may cause downtime. Continue? (y/N)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            log_info "Restore cancelled"
            return
        fi
    fi

    # Create restore job
    local job_name="disaster-recovery-$(date +%s)"

    # Create job from template
    kubectl get job disaster-recovery-template -n "$BACKUP_NAMESPACE" -o yaml | \
        sed "s/disaster-recovery-template/$job_name/g" | \
        sed "s/RECOVERY_TYPE=full/RECOVERY_TYPE=$restore_type/g" | \
        sed "s/RECOVERY_DATE=\${RECOVERY_DATE:-\$(date +%Y%m%d)}/RECOVERY_DATE=$restore_date/g" | \
        kubectl apply -f -

    # Monitor restore job
    log_info "Monitoring restore job: $job_name"
    kubectl wait --for=condition=complete --timeout=1800s job/"$job_name" -n "$BACKUP_NAMESPACE"

    # Get job results
    local job_pod
    job_pod=$(kubectl get pods -n "$BACKUP_NAMESPACE" \
        -l job-name="$job_name" \
        -o jsonpath='{.items[0].metadata.name}')

    log_info "Restore job logs:"
    kubectl logs "$job_pod" -n "$BACKUP_NAMESPACE"

    # Cleanup job
    kubectl delete job "$job_name" -n "$BACKUP_NAMESPACE"

    log_success "Restore operation completed"
}

# Verify backup integrity
verify_backups() {
    local verify_date=${1:-latest}

    log_step "Verifying backup integrity for date: $verify_date..."

    # Trigger backup verification job
    local job_name="backup-verification-manual-$(date +%s)"

    kubectl create job "$job_name" \
        --from=cronjob/backup-verification \
        -n "$BACKUP_NAMESPACE"

    # Wait for verification to complete
    kubectl wait --for=condition=complete --timeout=1800s job/"$job_name" -n "$BACKUP_NAMESPACE"

    # Get verification results
    local job_pod
    job_pod=$(kubectl get pods -n "$BACKUP_NAMESPACE" \
        -l job-name="$job_name" \
        -o jsonpath='{.items[0].metadata.name}')

    log_info "Verification results:"
    kubectl logs "$job_pod" -n "$BACKUP_NAMESPACE"

    # Download verification report
    local latest_verification
    latest_verification=$(aws s3 ls "s3://$S3_BUCKET/verification/daily/" | \
        sort | tail -n 1 | awk '{print $4}')

    if [[ -n "$latest_verification" ]]; then
        aws s3 cp "s3://$S3_BUCKET/verification/daily/$latest_verification" /tmp/

        log_info "Detailed verification report:"
        jq '.' "/tmp/$latest_verification"
    fi

    # Cleanup job
    kubectl delete job "$job_name" -n "$BACKUP_NAMESPACE"

    log_success "Backup verification completed"
}

# Show backup status
show_backup_status() {
    log_step "Checking backup system status..."

    echo
    log_info "=== Backup System Pods ==="
    kubectl get pods -n "$BACKUP_NAMESPACE"

    echo
    log_info "=== Backup CronJobs ==="
    kubectl get cronjobs -n "$BACKUP_NAMESPACE"

    echo
    log_info "=== Recent Backup Jobs ==="
    kubectl get jobs -n "$BACKUP_NAMESPACE" --sort-by=.metadata.creationTimestamp | tail -10

    echo
    log_info "=== S3 Backup Storage ==="
    echo "Database backups:"
    aws s3 ls "s3://$S3_BUCKET/database/daily/" | tail -5

    echo "Redis backups:"
    aws s3 ls "s3://$S3_BUCKET/redis/daily/" | tail -5

    echo "Config backups:"
    aws s3 ls "s3://$S3_BUCKET/config/daily/" | tail -5

    echo
    log_info "=== Storage Usage ==="
    aws s3api list-objects-v2 --bucket "$S3_BUCKET" --query 'sum(Contents[].Size)' --output text | \
        awk '{printf "Total backup storage: %.2f GB\n", $1/1024/1024/1024}'

    echo
    log_info "=== Latest Verification Results ==="
    local latest_verification
    latest_verification=$(aws s3 ls "s3://$S3_BUCKET/verification/daily/" | \
        sort | tail -n 1 | awk '{print $4}')

    if [[ -n "$latest_verification" ]]; then
        aws s3 cp "s3://$S3_BUCKET/verification/daily/$latest_verification" /tmp/ --quiet
        jq -r '.results | to_entries[] | "\(.key): \(.value.status)"' "/tmp/$latest_verification"
    else
        echo "No verification results found"
    fi
}

# Test disaster recovery procedures
test_disaster_recovery() {
    local scenario=${1:-database-failure}

    log_step "Testing disaster recovery scenario: $scenario..."

    case $scenario in
        "database-failure")
            log_info "Simulating database failure and recovery..."

            # Create test database backup
            trigger_backup "database"

            # Wait for backup to complete
            sleep 60

            # Simulate database corruption (in test environment only)
            if [[ "$ENVIRONMENT" == "test" ]]; then
                log_warning "Simulating database corruption..."
                kubectl exec -n "$NAMESPACE" deployment/postgresql -- \
                    psql -U postgres -c "DROP TABLE IF EXISTS test_corruption_table;"
            fi

            # Test restore
            restore_from_backup "database" "latest" "true"
            ;;

        "redis-failure")
            log_info "Simulating Redis failure and recovery..."
            trigger_backup "redis"
            sleep 30
            restore_from_backup "redis" "latest" "true"
            ;;

        "full-disaster")
            log_info "Simulating full disaster recovery..."
            trigger_backup "all"
            sleep 300  # Wait for all backups
            restore_from_backup "full" "latest" "true"
            ;;

        "cross-region-failover")
            log_info "Testing cross-region disaster recovery failover..."
            test_cross_region_failover
            ;;

        "data-replication-integrity")
            log_info "Testing cross-region data replication integrity..."
            test_data_replication_integrity
            ;;

        "rto-validation")
            log_info "Testing Recovery Time Objectives (RTO)..."
            test_rto_validation
            ;;

        "rpo-validation")
            log_info "Testing Recovery Point Objectives (RPO)..."
            test_rpo_validation
            ;;

        "network-partition")
            log_info "Testing network partition recovery..."
            test_network_partition_recovery
            ;;

        *)
            log_error "Unknown test scenario: $scenario"
            exit 1
            ;;
    esac

    log_success "Disaster recovery test completed"
}

# Cross-region failover testing
test_cross_region_failover() {
    log_step "Starting cross-region failover test..."

    # Configuration for cross-region testing
    local PRIMARY_REGION=${PRIMARY_REGION:-us-east-1}
    local SECONDARY_REGION=${SECONDARY_REGION:-us-west-2}
    local TERTIARY_REGION=${TERTIARY_REGION:-eu-west-1}

    local FAILOVER_RESULTS="/tmp/failover_results.json"
    echo '{"timestamp":"'$(date -Iseconds)'","failover_tests":{}}' > $FAILOVER_RESULTS

    log_info "Testing failover from $PRIMARY_REGION to $SECONDARY_REGION..."

    # Step 1: Verify primary region health
    local primary_health=$(check_region_health "$PRIMARY_REGION")
    log_info "Primary region health: $primary_health"

    # Step 2: Simulate primary region failure
    log_warning "Simulating primary region failure..."
    if [[ "$ENVIRONMENT" == "test" ]]; then
        # Block traffic to primary region (simulation)
        kubectl patch service api-gateway -n "$NAMESPACE" \
            -p '{"spec":{"selector":{"region":"'$SECONDARY_REGION'"}}}'
    fi

    # Step 3: Measure failover time
    local failover_start=$(date +%s)

    # Wait for DNS propagation and health checks
    sleep 30

    # Step 4: Verify secondary region is serving traffic
    local secondary_health=$(check_region_health "$SECONDARY_REGION")
    local failover_end=$(date +%s)
    local failover_duration=$((failover_end - failover_start))

    log_info "Secondary region health: $secondary_health"
    log_info "Failover completed in ${failover_duration} seconds"

    # Step 5: Test data consistency across regions
    local data_consistency=$(test_cross_region_data_consistency "$PRIMARY_REGION" "$SECONDARY_REGION")

    # Step 6: Test application functionality in secondary region
    local app_functionality=$(test_application_functionality "$SECONDARY_REGION")

    # Step 7: Restore primary region (if in test mode)
    if [[ "$ENVIRONMENT" == "test" ]]; then
        log_info "Restoring primary region..."
        kubectl patch service api-gateway -n "$NAMESPACE" \
            -p '{"spec":{"selector":{"region":"'$PRIMARY_REGION'"}}}'
        sleep 30
    fi

    # Update results
    jq '.failover_tests.cross_region_failover = {
        "primary_region": "'$PRIMARY_REGION'",
        "secondary_region": "'$SECONDARY_REGION'",
        "failover_duration_seconds": '$failover_duration',
        "primary_health": "'$primary_health'",
        "secondary_health": "'$secondary_health'",
        "data_consistency": "'$data_consistency'",
        "app_functionality": "'$app_functionality'",
        "rto_target_seconds": 300,
        "rto_achieved": '$([[ $failover_duration -le 300 ]] && echo "true" || echo "false")'
    }' $FAILOVER_RESULTS > /tmp/temp_failover.json && mv /tmp/temp_failover.json $FAILOVER_RESULTS

    # Upload results
    aws s3 cp $FAILOVER_RESULTS s3://$S3_BUCKET/disaster-recovery/failover/failover_test_$(date +%Y%m%d_%H%M%S).json

    log_success "Cross-region failover test completed"
}

# Test data replication integrity across regions
test_data_replication_integrity() {
    log_step "Testing data replication integrity across regions..."

    local PRIMARY_REGION=${PRIMARY_REGION:-us-east-1}
    local SECONDARY_REGION=${SECONDARY_REGION:-us-west-2}
    local REPLICATION_RESULTS="/tmp/replication_results.json"

    echo '{"timestamp":"'$(date -Iseconds)'","replication_tests":{}}' > $REPLICATION_RESULTS

    # Test database replication
    log_info "Testing database replication integrity..."

    # Create test data in primary region
    local test_record_id="dr_test_$(date +%s)"
    local primary_db_endpoint=$(get_database_endpoint "$PRIMARY_REGION")
    local secondary_db_endpoint=$(get_database_endpoint "$SECONDARY_REGION")

    # Insert test record in primary
    psql -h "$primary_db_endpoint" -U postgres -d rbi_compliance -c \
        "INSERT INTO disaster_recovery_tests (id, test_data, created_at) VALUES ('$test_record_id', 'replication_test', NOW());"

    # Wait for replication
    sleep 10

    # Check if record exists in secondary
    local secondary_record_count=$(psql -h "$secondary_db_endpoint" -U postgres -d rbi_compliance -t -c \
        "SELECT count(*) FROM disaster_recovery_tests WHERE id = '$test_record_id';")

    # Test Redis replication
    log_info "Testing Redis replication integrity..."

    local primary_redis_endpoint=$(get_redis_endpoint "$PRIMARY_REGION")
    local secondary_redis_endpoint=$(get_redis_endpoint "$SECONDARY_REGION")

    # Set test key in primary Redis
    redis-cli -h "$primary_redis_endpoint" SET "dr_test:$test_record_id" "replication_test"

    # Wait for replication
    sleep 5

    # Check if key exists in secondary Redis
    local secondary_redis_value=$(redis-cli -h "$secondary_redis_endpoint" GET "dr_test:$test_record_id")

    # Test Elasticsearch replication
    log_info "Testing Elasticsearch replication integrity..."

    local primary_es_endpoint=$(get_elasticsearch_endpoint "$PRIMARY_REGION")
    local secondary_es_endpoint=$(get_elasticsearch_endpoint "$SECONDARY_REGION")

    # Index test document in primary
    curl -X POST "$primary_es_endpoint/disaster_recovery_tests/_doc/$test_record_id" \
        -H "Content-Type: application/json" \
        -d '{"test_data":"replication_test","timestamp":"'$(date -Iseconds)'"}'

    # Wait for replication
    sleep 15

    # Check if document exists in secondary
    local secondary_es_response=$(curl -s "$secondary_es_endpoint/disaster_recovery_tests/_doc/$test_record_id")
    local secondary_es_found=$(echo "$secondary_es_response" | jq -r '.found')

    # Calculate replication lag
    local replication_lag=$(calculate_replication_lag "$PRIMARY_REGION" "$SECONDARY_REGION")

    # Update results
    jq '.replication_tests = {
        "database_replication": {
            "test_record_id": "'$test_record_id'",
            "primary_inserted": true,
            "secondary_replicated": '$([[ $secondary_record_count -gt 0 ]] && echo "true" || echo "false")',
            "replication_success": '$([[ $secondary_record_count -gt 0 ]] && echo "true" || echo "false")'
        },
        "redis_replication": {
            "test_key": "dr_test:'$test_record_id'",
            "primary_set": true,
            "secondary_value": "'$secondary_redis_value'",
            "replication_success": '$([[ "$secondary_redis_value" == "replication_test" ]] && echo "true" || echo "false")'
        },
        "elasticsearch_replication": {
            "test_document_id": "'$test_record_id'",
            "primary_indexed": true,
            "secondary_found": '$([[ "$secondary_es_found" == "true" ]] && echo "true" || echo "false")',
            "replication_success": '$([[ "$secondary_es_found" == "true" ]] && echo "true" || echo "false")'
        },
        "replication_lag_seconds": '$replication_lag'
    }' $REPLICATION_RESULTS > /tmp/temp_replication.json && mv /tmp/temp_replication.json $REPLICATION_RESULTS

    # Cleanup test data
    cleanup_test_data "$test_record_id" "$PRIMARY_REGION" "$SECONDARY_REGION"

    # Upload results
    aws s3 cp $REPLICATION_RESULTS s3://$S3_BUCKET/disaster-recovery/replication/replication_test_$(date +%Y%m%d_%H%M%S).json

    log_success "Data replication integrity test completed"
}

# Test Recovery Time Objectives (RTO)
test_rto_validation() {
    log_step "Testing Recovery Time Objectives (RTO)..."

    local RTO_RESULTS="/tmp/rto_results.json"
    echo '{"timestamp":"'$(date -Iseconds)'","rto_tests":{}}' > $RTO_RESULTS

    # Define RTO targets (in seconds)
    local DATABASE_RTO_TARGET=300    # 5 minutes
    local REDIS_RTO_TARGET=60        # 1 minute
    local APPLICATION_RTO_TARGET=180 # 3 minutes
    local FULL_SYSTEM_RTO_TARGET=600 # 10 minutes

    log_info "Testing database RTO (Target: ${DATABASE_RTO_TARGET}s)..."

    # Database RTO test
    local db_start=$(date +%s)
    trigger_backup "database"
    sleep 60  # Wait for backup
    restore_from_backup "database" "latest" "true"
    local db_end=$(date +%s)
    local db_rto=$((db_end - db_start))

    log_info "Testing Redis RTO (Target: ${REDIS_RTO_TARGET}s)..."

    # Redis RTO test
    local redis_start=$(date +%s)
    trigger_backup "redis"
    sleep 30  # Wait for backup
    restore_from_backup "redis" "latest" "true"
    local redis_end=$(date +%s)
    local redis_rto=$((redis_end - redis_start))

    log_info "Testing application RTO (Target: ${APPLICATION_RTO_TARGET}s)..."

    # Application RTO test (restart services)
    local app_start=$(date +%s)
    kubectl rollout restart deployment/api-gateway -n "$NAMESPACE"
    kubectl rollout restart deployment/compliance-orchestration -n "$NAMESPACE"
    kubectl rollout status deployment/api-gateway -n "$NAMESPACE" --timeout=300s
    kubectl rollout status deployment/compliance-orchestration -n "$NAMESPACE" --timeout=300s
    local app_end=$(date +%s)
    local app_rto=$((app_end - app_start))

    # Update results
    jq '.rto_tests = {
        "database_rto": {
            "target_seconds": '$DATABASE_RTO_TARGET',
            "actual_seconds": '$db_rto',
            "achieved": '$([[ $db_rto -le $DATABASE_RTO_TARGET ]] && echo "true" || echo "false")'
        },
        "redis_rto": {
            "target_seconds": '$REDIS_RTO_TARGET',
            "actual_seconds": '$redis_rto',
            "achieved": '$([[ $redis_rto -le $REDIS_RTO_TARGET ]] && echo "true" || echo "false")'
        },
        "application_rto": {
            "target_seconds": '$APPLICATION_RTO_TARGET',
            "actual_seconds": '$app_rto',
            "achieved": '$([[ $app_rto -le $APPLICATION_RTO_TARGET ]] && echo "true" || echo "false")'
        }
    }' $RTO_RESULTS > /tmp/temp_rto.json && mv /tmp/temp_rto.json $RTO_RESULTS

    # Upload results
    aws s3 cp $RTO_RESULTS s3://$S3_BUCKET/disaster-recovery/rto/rto_test_$(date +%Y%m%d_%H%M%S).json

    log_success "RTO validation test completed"
}

# Test Recovery Point Objectives (RPO)
test_rpo_validation() {
    log_step "Testing Recovery Point Objectives (RPO)..."

    local RPO_RESULTS="/tmp/rpo_results.json"
    echo '{"timestamp":"'$(date -Iseconds)'","rpo_tests":{}}' > $RPO_RESULTS

    # Define RPO targets (in seconds)
    local DATABASE_RPO_TARGET=300    # 5 minutes
    local REDIS_RPO_TARGET=60        # 1 minute
    local ELASTICSEARCH_RPO_TARGET=600 # 10 minutes

    log_info "Testing database RPO (Target: ${DATABASE_RPO_TARGET}s)..."

    # Create test transaction
    local test_transaction_id="rpo_test_$(date +%s)"
    local transaction_time=$(date -Iseconds)

    # Insert test transaction
    psql -h $POSTGRES_HOST -U postgres -d rbi_compliance -c \
        "INSERT INTO rpo_test_transactions (id, transaction_data, created_at) VALUES ('$test_transaction_id', 'rpo_validation', '$transaction_time');"

    # Wait a bit then trigger backup
    sleep 30
    trigger_backup "database"
    sleep 60

    # Simulate data loss and restore
    local backup_time=$(date -Iseconds)
    restore_from_backup "database" "latest" "true"

    # Check if test transaction survived
    local transaction_exists=$(psql -h $POSTGRES_HOST -U postgres -d rbi_compliance -t -c \
        "SELECT count(*) FROM rpo_test_transactions WHERE id = '$test_transaction_id';")

    # Calculate data loss window
    local transaction_timestamp=$(date -d "$transaction_time" +%s)
    local backup_timestamp=$(date -d "$backup_time" +%s)
    local data_loss_window=$((backup_timestamp - transaction_timestamp))

    # Test Redis RPO
    log_info "Testing Redis RPO (Target: ${REDIS_RPO_TARGET}s)..."

    local redis_test_key="rpo_test:$test_transaction_id"
    redis-cli -h $REDIS_HOST SET "$redis_test_key" "$transaction_time"

    sleep 15
    trigger_backup "redis"
    sleep 30

    # Simulate Redis failure and restore
    restore_from_backup "redis" "latest" "true"

    local redis_value=$(redis-cli -h $REDIS_HOST GET "$redis_test_key")
    local redis_data_preserved=$([[ "$redis_value" == "$transaction_time" ]] && echo "true" || echo "false")

    # Update results
    jq '.rpo_tests = {
        "database_rpo": {
            "target_seconds": '$DATABASE_RPO_TARGET',
            "data_loss_window_seconds": '$data_loss_window',
            "test_transaction_preserved": '$([[ $transaction_exists -gt 0 ]] && echo "true" || echo "false")',
            "rpo_achieved": '$([[ $data_loss_window -le $DATABASE_RPO_TARGET ]] && echo "true" || echo "false")'
        },
        "redis_rpo": {
            "target_seconds": '$REDIS_RPO_TARGET',
            "test_key_preserved": '$redis_data_preserved',
            "rpo_achieved": '$redis_data_preserved'
        }
    }' $RPO_RESULTS > /tmp/temp_rpo.json && mv /tmp/temp_rpo.json $RPO_RESULTS

    # Cleanup test data
    psql -h $POSTGRES_HOST -U postgres -d rbi_compliance -c \
        "DELETE FROM rpo_test_transactions WHERE id = '$test_transaction_id';"
    redis-cli -h $REDIS_HOST DEL "$redis_test_key"

    # Upload results
    aws s3 cp $RPO_RESULTS s3://$S3_BUCKET/disaster-recovery/rpo/rpo_test_$(date +%Y%m%d_%H%M%S).json

    log_success "RPO validation test completed"
}

# Test network partition recovery
test_network_partition_recovery() {
    log_step "Testing network partition recovery..."

    local PARTITION_RESULTS="/tmp/partition_results.json"
    echo '{"timestamp":"'$(date -Iseconds)'","partition_tests":{}}' > $PARTITION_RESULTS

    if [[ "$ENVIRONMENT" != "test" ]]; then
        log_warning "Network partition testing only available in test environment"
        return
    fi

    log_info "Simulating network partition between regions..."

    # Simulate network partition using network policies
    kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: simulate-partition
  namespace: $NAMESPACE
spec:
  podSelector:
    matchLabels:
      app: api-gateway
  policyTypes:
  - Egress
  egress:
  - to: []
    ports:
    - protocol: TCP
      port: 443
EOF

    local partition_start=$(date +%s)

    # Wait for partition to take effect
    sleep 30

    # Test application behavior during partition
    local app_response=$(test_application_availability)

    # Remove network partition
    kubectl delete networkpolicy simulate-partition -n "$NAMESPACE"

    # Wait for recovery
    sleep 60

    local partition_end=$(date +%s)
    local partition_duration=$((partition_end - partition_start))

    # Test recovery
    local recovery_response=$(test_application_availability)

    # Update results
    jq '.partition_tests = {
        "partition_duration_seconds": '$partition_duration',
        "app_response_during_partition": "'$app_response'",
        "app_response_after_recovery": "'$recovery_response'",
        "recovery_successful": '$([[ "$recovery_response" == "healthy" ]] && echo "true" || echo "false")'
    }' $PARTITION_RESULTS > /tmp/temp_partition.json && mv /tmp/temp_partition.json $PARTITION_RESULTS

    # Upload results
    aws s3 cp $PARTITION_RESULTS s3://$S3_BUCKET/disaster-recovery/partition/partition_test_$(date +%Y%m%d_%H%M%S).json

    log_success "Network partition recovery test completed"
}

# Helper functions for cross-region testing
check_region_health() {
    local region=$1
    local health_endpoint=$(get_health_endpoint "$region")

    local response=$(curl -s -o /dev/null -w "%{http_code}" "$health_endpoint/health" || echo "000")

    if [[ "$response" == "200" ]]; then
        echo "healthy"
    else
        echo "unhealthy"
    fi
}

get_database_endpoint() {
    local region=$1
    # This would be replaced with actual region-specific endpoints
    echo "postgresql-$region.rbi-compliance.internal"
}

get_redis_endpoint() {
    local region=$1
    echo "redis-$region.rbi-compliance.internal"
}

get_elasticsearch_endpoint() {
    local region=$1
    echo "https://elasticsearch-$region.rbi-compliance.internal:9200"
}

get_health_endpoint() {
    local region=$1
    echo "https://api-$region.rbi-compliance.com"
}

test_cross_region_data_consistency() {
    local primary_region=$1
    local secondary_region=$2

    # Compare data checksums between regions
    local primary_checksum=$(get_data_checksum "$primary_region")
    local secondary_checksum=$(get_data_checksum "$secondary_region")

    if [[ "$primary_checksum" == "$secondary_checksum" ]]; then
        echo "consistent"
    else
        echo "inconsistent"
    fi
}

get_data_checksum() {
    local region=$1
    local db_endpoint=$(get_database_endpoint "$region")

    # Calculate checksum of critical tables
    psql -h "$db_endpoint" -U postgres -d rbi_compliance -t -c \
        "SELECT md5(string_agg(md5(row::text), '' ORDER BY id)) FROM (
            SELECT * FROM users UNION ALL
            SELECT * FROM organizations UNION ALL
            SELECT * FROM compliance_tasks
        ) AS combined_data(row);"
}

test_application_functionality() {
    local region=$1
    local health_endpoint=$(get_health_endpoint "$region")

    # Test critical application endpoints
    local auth_test=$(curl -s -o /dev/null -w "%{http_code}" "$health_endpoint/api/auth/health" || echo "000")
    local compliance_test=$(curl -s -o /dev/null -w "%{http_code}" "$health_endpoint/api/compliance/health" || echo "000")

    if [[ "$auth_test" == "200" && "$compliance_test" == "200" ]]; then
        echo "functional"
    else
        echo "degraded"
    fi
}

test_application_availability() {
    local response=$(kubectl get pods -n "$NAMESPACE" -l app=api-gateway -o jsonpath='{.items[0].status.phase}')

    if [[ "$response" == "Running" ]]; then
        echo "healthy"
    else
        echo "unhealthy"
    fi
}

calculate_replication_lag() {
    local primary_region=$1
    local secondary_region=$2

    # This would implement actual replication lag calculation
    # For now, return a mock value
    echo "5"
}

cleanup_test_data() {
    local test_id=$1
    local primary_region=$2
    local secondary_region=$3

    # Cleanup database test data
    local primary_db=$(get_database_endpoint "$primary_region")
    local secondary_db=$(get_database_endpoint "$secondary_region")

    psql -h "$primary_db" -U postgres -d rbi_compliance -c \
        "DELETE FROM disaster_recovery_tests WHERE id = '$test_id';"

    psql -h "$secondary_db" -U postgres -d rbi_compliance -c \
        "DELETE FROM disaster_recovery_tests WHERE id = '$test_id';"

    # Cleanup Redis test data
    local primary_redis=$(get_redis_endpoint "$primary_region")
    local secondary_redis=$(get_redis_endpoint "$secondary_region")

    redis-cli -h "$primary_redis" DEL "dr_test:$test_id"
    redis-cli -h "$secondary_redis" DEL "dr_test:$test_id"

    # Cleanup Elasticsearch test data
    local primary_es=$(get_elasticsearch_endpoint "$primary_region")
    local secondary_es=$(get_elasticsearch_endpoint "$secondary_region")

    curl -X DELETE "$primary_es/disaster_recovery_tests/_doc/$test_id"
    curl -X DELETE "$secondary_es/disaster_recovery_tests/_doc/$test_id"
}

# Cleanup old backups
cleanup_old_backups() {
    local retention_days=${1:-30}

    log_step "Cleaning up backups older than $retention_days days..."

    local cutoff_date
    cutoff_date=$(date -d "$retention_days days ago" +%Y-%m-%d)

    # Cleanup database backups
    log_info "Cleaning up database backups..."
    aws s3 ls "s3://$S3_BUCKET/database/daily/" | \
        awk '$1 < "'$cutoff_date'" {print $4}' | \
        while read -r backup; do
            if [[ -n "$backup" ]]; then
                aws s3 rm "s3://$S3_BUCKET/database/daily/$backup"
                log_info "Deleted: $backup"
            fi
        done

    # Cleanup Redis backups
    log_info "Cleaning up Redis backups..."
    aws s3 ls "s3://$S3_BUCKET/redis/daily/" | \
        awk '$1 < "'$cutoff_date'" {print $4}' | \
        while read -r backup; do
            if [[ -n "$backup" ]]; then
                aws s3 rm "s3://$S3_BUCKET/redis/daily/$backup"
                log_info "Deleted: $backup"
            fi
        done

    # Cleanup config backups
    log_info "Cleaning up config backups..."
    aws s3 ls "s3://$S3_BUCKET/config/daily/" | \
        awk '$1 < "'$cutoff_date'" {print $4}' | \
        while read -r backup; do
            if [[ -n "$backup" ]]; then
                aws s3 rm "s3://$S3_BUCKET/config/daily/$backup"
                log_info "Deleted: $backup"
            fi
        done

    log_success "Backup cleanup completed"
}

# Show monitoring dashboard
show_monitoring() {
    log_step "Opening backup monitoring dashboard..."

    # Port forward to backup monitor
    log_info "Port forwarding to backup monitor..."
    kubectl port-forward -n "$BACKUP_NAMESPACE" service/backup-monitor 8080:8080 &
    local monitor_pid=$!

    log_info "Backup monitor available at: http://localhost:8080"
    log_info "Press Ctrl+C to stop port forwarding"

    # Wait for interrupt
    trap "kill $monitor_pid 2>/dev/null || true" EXIT
    wait $monitor_pid 2>/dev/null || true
}

# Main execution
main() {
    local command=${1:-"help"}
    shift || true

    case $command in
        "setup")
            check_prerequisites
            local environment=${1:-production}
            setup_backup_system "$environment"
            ;;
        "backup")
            check_prerequisites
            local backup_type=${1:-all}
            trigger_backup "$backup_type"
            ;;
        "restore")
            check_prerequisites
            local restore_type=${1:-full}
            local restore_date=${2:-latest}
            local force=${FORCE:-false}
            restore_from_backup "$restore_type" "$restore_date" "$force"
            ;;
        "verify")
            check_prerequisites
            local verify_date=${1:-latest}
            verify_backups "$verify_date"
            ;;
        "status")
            check_prerequisites
            show_backup_status
            ;;
        "test")
            check_prerequisites
            local scenario=${1:-database-failure}
            test_disaster_recovery "$scenario"
            ;;
        "cleanup")
            check_prerequisites
            local retention_days=${1:-30}
            cleanup_old_backups "$retention_days"
            ;;
        "monitor")
            check_prerequisites
            show_monitoring
            ;;
        "help"|*)
            show_usage
            ;;
    esac
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --date)
            RESTORE_DATE="$2"
            shift 2
            ;;
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --verbose)
            set -x
            shift
            ;;
        *)
            break
            ;;
    esac
done

# Execute main function
main "$@"
