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
            
        *)
            log_error "Unknown test scenario: $scenario"
            exit 1
            ;;
    esac

    log_success "Disaster recovery test completed"
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
