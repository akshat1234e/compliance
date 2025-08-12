#!/bin/bash

# RBI Compliance Platform - CDN Management Script
# Comprehensive CDN setup, optimization, and management

set -euo pipefail

# Make script executable
chmod +x "$0"

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
NAMESPACE="rbi-compliance"
AWS_REGION="ap-south-1"

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
RBI Compliance Platform - CDN Management Script

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    deploy          Deploy CDN infrastructure
    configure       Configure CDN settings
    optimize        Optimize assets for CDN
    purge           Purge CDN cache
    monitor         Show CDN monitoring dashboard
    test            Run CDN performance tests
    warm            Warm CDN cache
    status          Show CDN status
    cleanup         Remove CDN configurations
    help            Show this help message

Options:
    --environment   Environment (development|staging|production)
    --domain        Domain name (default: rbi-compliance.com)
    --bucket        S3 bucket name for static assets
    --distribution  CloudFront distribution ID
    --assets        Asset paths to purge (comma-separated)
    --dry-run       Show what would be done without executing
    --verbose       Enable verbose output

Examples:
    $0 deploy --environment production --domain rbi-compliance.com
    $0 optimize --assets js,css,images
    $0 purge --assets "/js/*,/css/*"
    $0 test --duration 300
    $0 warm --critical-assets-only

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

    # Check namespace
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_warning "Namespace $NAMESPACE does not exist, creating..."
        kubectl create namespace "$NAMESPACE"
    fi

    log_success "Prerequisites check completed"
}

# Deploy CDN infrastructure
deploy_cdn() {
    local environment=${1:-production}
    local domain=${2:-rbi-compliance.com}
    local bucket=${3:-rbi-compliance-static-assets}
    
    log_step "Deploying CDN infrastructure for $environment..."

    # Deploy CloudFront distribution
    log_info "Deploying CloudFront distribution..."
    aws cloudformation deploy \
        --template-file "$PROJECT_ROOT/infrastructure/cdn/cloudfront-distribution.yaml" \
        --stack-name "rbi-compliance-cdn-$environment" \
        --parameter-overrides \
            Environment="$environment" \
            DomainName="$domain" \
            S3BucketName="$bucket" \
        --capabilities CAPABILITY_IAM \
        --region "$AWS_REGION"

    # Get CloudFront distribution ID
    local distribution_id
    distribution_id=$(aws cloudformation describe-stacks \
        --stack-name "rbi-compliance-cdn-$environment" \
        --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
        --output text \
        --region "$AWS_REGION")

    log_info "CloudFront Distribution ID: $distribution_id"

    # Deploy asset optimization pipeline
    log_info "Deploying asset optimization pipeline..."
    aws cloudformation deploy \
        --template-file "$PROJECT_ROOT/infrastructure/cdn/asset-optimization-pipeline.yaml" \
        --stack-name "rbi-compliance-cdn-pipeline-$environment" \
        --parameter-overrides \
            Environment="$environment" \
            S3BucketName="$bucket" \
            CloudFrontDistributionId="$distribution_id" \
        --capabilities CAPABILITY_IAM \
        --region "$AWS_REGION"

    # Deploy Kubernetes CDN components
    log_info "Deploying Kubernetes CDN components..."
    kubectl apply -f "$PROJECT_ROOT/k8s/cdn/nginx-cdn-cache.yaml"
    kubectl apply -f "$PROJECT_ROOT/k8s/cdn/cdn-monitoring.yaml"

    # Update CDN configuration
    kubectl patch configmap cdn-config -n "$NAMESPACE" \
        --patch '{"data":{"cloudfront-distribution-id":"'$distribution_id'"}}'

    log_success "CDN infrastructure deployed successfully"
}

# Configure CDN settings
configure_cdn() {
    local cache_max_age=${1:-31536000}
    local enable_compression=${2:-true}
    
    log_step "Configuring CDN settings..."

    # Update NGINX configuration
    log_info "Updating NGINX CDN configuration..."
    
    # Create temporary config with updated settings
    local temp_config="/tmp/nginx-cdn-config.yaml"
    kubectl get configmap nginx-cdn-config -n "$NAMESPACE" -o yaml > "$temp_config"
    
    # Update cache settings
    sed -i "s/max-age=[0-9]*/max-age=$cache_max_age/g" "$temp_config"
    
    if [[ "$enable_compression" == "true" ]]; then
        sed -i "s/gzip off/gzip on/g" "$temp_config"
        sed -i "s/brotli off/brotli on/g" "$temp_config"
    fi
    
    # Apply updated configuration
    kubectl apply -f "$temp_config"
    
    # Restart NGINX pods to apply changes
    kubectl rollout restart deployment/nginx-cdn -n "$NAMESPACE"
    kubectl rollout status deployment/nginx-cdn -n "$NAMESPACE"

    log_success "CDN configuration updated successfully"
}

# Optimize assets for CDN
optimize_assets() {
    local asset_types=${1:-"js,css,images"}
    
    log_step "Optimizing assets for CDN ($asset_types)..."

    # Trigger asset optimization pipeline
    log_info "Triggering asset optimization pipeline..."
    
    local pipeline_name
    pipeline_name=$(aws cloudformation describe-stacks \
        --stack-name "rbi-compliance-cdn-pipeline-production" \
        --query 'Stacks[0].Outputs[?OutputKey==`PipelineName`].OutputValue' \
        --output text \
        --region "$AWS_REGION")

    if [[ -n "$pipeline_name" ]]; then
        aws codepipeline start-pipeline-execution \
            --name "$pipeline_name" \
            --region "$AWS_REGION"
        
        log_info "Pipeline execution started: $pipeline_name"
        
        # Monitor pipeline execution
        local execution_id
        execution_id=$(aws codepipeline list-pipeline-executions \
            --pipeline-name "$pipeline_name" \
            --max-items 1 \
            --query 'pipelineExecutionSummaries[0].pipelineExecutionId' \
            --output text \
            --region "$AWS_REGION")
        
        log_info "Monitoring pipeline execution: $execution_id"
        
        # Wait for completion (with timeout)
        local timeout=1800  # 30 minutes
        local elapsed=0
        
        while [[ $elapsed -lt $timeout ]]; do
            local status
            status=$(aws codepipeline get-pipeline-execution \
                --pipeline-name "$pipeline_name" \
                --pipeline-execution-id "$execution_id" \
                --query 'pipelineExecution.status' \
                --output text \
                --region "$AWS_REGION")
            
            case $status in
                "Succeeded")
                    log_success "Asset optimization completed successfully"
                    return 0
                    ;;
                "Failed"|"Cancelled"|"Stopped")
                    log_error "Asset optimization failed with status: $status"
                    return 1
                    ;;
                "InProgress")
                    log_info "Pipeline still running... ($elapsed/$timeout seconds)"
                    sleep 30
                    elapsed=$((elapsed + 30))
                    ;;
            esac
        done
        
        log_warning "Pipeline execution timeout reached"
    else
        log_error "Could not find asset optimization pipeline"
        return 1
    fi
}

# Purge CDN cache
purge_cache() {
    local assets=${1:-"/*"}
    
    log_step "Purging CDN cache for: $assets"

    # Get CloudFront distribution ID
    local distribution_id
    distribution_id=$(kubectl get configmap cdn-config -n "$NAMESPACE" \
        -o jsonpath='{.data.cloudfront-distribution-id}')

    if [[ -n "$distribution_id" ]]; then
        # Create CloudFront invalidation
        log_info "Creating CloudFront invalidation..."
        
        # Convert comma-separated assets to array
        IFS=',' read -ra asset_array <<< "$assets"
        
        # Create invalidation batch
        local invalidation_batch='{"Paths":{"Quantity":'${#asset_array[@]}',"Items":['
        for i in "${!asset_array[@]}"; do
            invalidation_batch+='"'${asset_array[i]}'"'
            if [[ $i -lt $((${#asset_array[@]} - 1)) ]]; then
                invalidation_batch+=','
            fi
        done
        invalidation_batch+=']},"CallerReference":"'$(date +%s)'"}'
        
        local invalidation_id
        invalidation_id=$(aws cloudfront create-invalidation \
            --distribution-id "$distribution_id" \
            --invalidation-batch "$invalidation_batch" \
            --query 'Invalidation.Id' \
            --output text \
            --region "$AWS_REGION")
        
        log_info "CloudFront invalidation created: $invalidation_id"
        
        # Purge NGINX cache
        log_info "Purging NGINX cache..."
        for asset in "${asset_array[@]}"; do
            kubectl exec -n "$NAMESPACE" deployment/nginx-cdn -- \
                curl -s "http://localhost:8080/purge$asset" || true
        done
        
        log_success "Cache purge completed"
    else
        log_error "CloudFront distribution ID not found"
        return 1
    fi
}

# Warm CDN cache
warm_cache() {
    local critical_only=${1:-false}
    
    log_step "Warming CDN cache..."

    # Define critical assets
    local critical_assets=(
        "/js/app.min.js"
        "/css/app.min.css"
        "/images/logo.png"
        "/fonts/roboto.woff2"
        "/manifest.json"
    )
    
    # Define all assets (if not critical only)
    local all_assets=(
        "${critical_assets[@]}"
        "/js/vendor.min.js"
        "/css/vendor.min.css"
        "/images/banner.jpg"
        "/images/icons/favicon.ico"
        "/fonts/opensans.woff2"
    )
    
    local assets_to_warm
    if [[ "$critical_only" == "true" ]]; then
        assets_to_warm=("${critical_assets[@]}")
        log_info "Warming critical assets only"
    else
        assets_to_warm=("${all_assets[@]}")
        log_info "Warming all assets"
    fi
    
    local cdn_base_url
    cdn_base_url=$(kubectl get configmap cdn-config -n "$NAMESPACE" \
        -o jsonpath='{.data.cdn-base-url}')
    
    # Warm cache by requesting each asset
    for asset in "${assets_to_warm[@]}"; do
        log_info "Warming: $asset"
        
        local response_code
        response_code=$(curl -s -o /dev/null -w "%{http_code}" "$cdn_base_url$asset" || echo "000")
        
        if [[ "$response_code" == "200" ]]; then
            log_success "✓ $asset (HTTP $response_code)"
        else
            log_warning "✗ $asset (HTTP $response_code)"
        fi
        
        sleep 0.5  # Rate limiting
    done
    
    log_success "Cache warming completed"
}

# Run CDN performance tests
run_performance_tests() {
    local duration=${1:-300}
    
    log_step "Running CDN performance tests for ${duration} seconds..."

    # Check if k6 is available
    if ! command -v k6 &> /dev/null; then
        log_info "k6 not found locally, using Kubernetes job..."
        
        # Create performance test job
        kubectl create job cdn-performance-test-$(date +%s) \
            --from=cronjob/cdn-performance-test \
            -n "$NAMESPACE"
        
        # Wait for job completion
        kubectl wait --for=condition=complete \
            --timeout=${duration}s \
            job/cdn-performance-test-$(date +%s) \
            -n "$NAMESPACE"
        
        # Get job results
        local job_pod
        job_pod=$(kubectl get pods -n "$NAMESPACE" \
            -l job-name=cdn-performance-test-$(date +%s) \
            -o jsonpath='{.items[0].metadata.name}')
        
        log_info "Performance test results:"
        kubectl logs "$job_pod" -n "$NAMESPACE"
    else
        # Run k6 test locally
        log_info "Running k6 performance test locally..."
        
        local cdn_base_url
        cdn_base_url=$(kubectl get configmap cdn-config -n "$NAMESPACE" \
            -o jsonpath='{.data.cdn-base-url}')
        
        CDN_BASE_URL="$cdn_base_url" k6 run \
            --duration "${duration}s" \
            --vus 50 \
            "$PROJECT_ROOT/k8s/cdn/performance-test.js"
    fi
    
    log_success "Performance tests completed"
}

# Show CDN status
show_status() {
    local detailed=${1:-false}
    
    log_step "Checking CDN status..."

    echo
    log_info "=== CloudFront Distribution ==="
    local distribution_id
    distribution_id=$(kubectl get configmap cdn-config -n "$NAMESPACE" \
        -o jsonpath='{.data.cloudfront-distribution-id}' 2>/dev/null || echo "Not configured")
    
    if [[ "$distribution_id" != "Not configured" ]]; then
        aws cloudfront get-distribution \
            --id "$distribution_id" \
            --query 'Distribution.{Id:Id,Status:Status,DomainName:DomainName,Enabled:Enabled}' \
            --output table \
            --region "$AWS_REGION"
    else
        echo "CloudFront distribution not configured"
    fi

    echo
    log_info "=== NGINX CDN Pods ==="
    kubectl get pods -n "$NAMESPACE" -l app=nginx-cdn

    echo
    log_info "=== CDN Services ==="
    kubectl get svc -n "$NAMESPACE" -l component=caching

    if [[ "$detailed" == "true" ]]; then
        echo
        log_info "=== Cache Statistics ==="
        kubectl exec -n "$NAMESPACE" deployment/nginx-cdn -- \
            curl -s "http://localhost:8080/cache-stats" | jq '.' || echo "Cache stats not available"

        echo
        log_info "=== Recent CDN Metrics ==="
        # Query Prometheus for CDN metrics (if available)
        if kubectl get svc prometheus -n monitoring &> /dev/null; then
            kubectl port-forward -n monitoring svc/prometheus 9090:9090 &
            local prom_pid=$!
            sleep 3
            
            echo "Cache Hit Ratio:"
            curl -s "http://localhost:9090/api/v1/query?query=cdn:cache_hit_ratio" | \
                jq -r '.data.result[0].value[1] // "N/A"' | \
                awk '{printf "%.2f%%\n", $1}'
            
            echo "Response Time (95th percentile):"
            curl -s "http://localhost:9090/api/v1/query?query=cdn:response_time_p95" | \
                jq -r '.data.result[0].value[1] // "N/A"' | \
                awk '{printf "%.3fs\n", $1}'
            
            kill $prom_pid 2>/dev/null || true
        fi
    fi
}

# Show monitoring dashboard
show_monitoring() {
    log_step "Opening CDN monitoring dashboard..."

    # Port forward to Grafana
    log_info "Port forwarding to Grafana dashboard..."
    kubectl port-forward -n monitoring service/grafana 3000:80 &
    local grafana_pid=$!

    log_info "Grafana dashboard available at: http://localhost:3000"
    log_info "Default credentials: admin/admin"
    log_info "CDN dashboard: RBI Compliance - CDN Performance Dashboard"
    log_info "Press Ctrl+C to stop port forwarding"

    # Wait for interrupt
    trap "kill $grafana_pid 2>/dev/null || true" EXIT
    wait $grafana_pid 2>/dev/null || true
}

# Cleanup CDN configurations
cleanup_cdn() {
    log_step "Cleaning up CDN configurations..."

    log_warning "This will remove all CDN configurations. Continue? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        log_info "Cleanup cancelled"
        return
    fi

    # Remove Kubernetes resources
    log_info "Removing Kubernetes CDN resources..."
    kubectl delete -f "$PROJECT_ROOT/k8s/cdn/nginx-cdn-cache.yaml" || true
    kubectl delete -f "$PROJECT_ROOT/k8s/cdn/cdn-monitoring.yaml" || true

    # Remove CloudFormation stacks
    log_info "Removing CloudFormation stacks..."
    aws cloudformation delete-stack \
        --stack-name "rbi-compliance-cdn-pipeline-production" \
        --region "$AWS_REGION" || true
    
    aws cloudformation delete-stack \
        --stack-name "rbi-compliance-cdn-production" \
        --region "$AWS_REGION" || true

    log_success "CDN cleanup completed"
}

# Main execution
main() {
    local command=${1:-"help"}
    shift || true

    case $command in
        "deploy")
            check_prerequisites
            local environment=${1:-production}
            local domain=${2:-rbi-compliance.com}
            local bucket=${3:-rbi-compliance-static-assets}
            deploy_cdn "$environment" "$domain" "$bucket"
            ;;
        "configure")
            check_prerequisites
            local cache_max_age=${1:-31536000}
            local enable_compression=${2:-true}
            configure_cdn "$cache_max_age" "$enable_compression"
            ;;
        "optimize")
            check_prerequisites
            local asset_types=${1:-"js,css,images"}
            optimize_assets "$asset_types"
            ;;
        "purge")
            check_prerequisites
            local assets=${1:-"/*"}
            purge_cache "$assets"
            ;;
        "warm")
            check_prerequisites
            local critical_only=${1:-false}
            warm_cache "$critical_only"
            ;;
        "test")
            check_prerequisites
            local duration=${1:-300}
            run_performance_tests "$duration"
            ;;
        "status")
            check_prerequisites
            local detailed=${1:-false}
            show_status "$detailed"
            ;;
        "monitor")
            check_prerequisites
            show_monitoring
            ;;
        "cleanup")
            check_prerequisites
            cleanup_cdn
            ;;
        "help"|*)
            show_usage
            ;;
    esac
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --domain)
            DOMAIN="$2"
            shift 2
            ;;
        --bucket)
            BUCKET="$2"
            shift 2
            ;;
        --distribution)
            DISTRIBUTION_ID="$2"
            shift 2
            ;;
        --assets)
            ASSETS="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
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
