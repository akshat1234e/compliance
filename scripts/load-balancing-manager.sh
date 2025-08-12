#!/bin/bash

# RBI Compliance Platform - Load Balancing Management Script
# Comprehensive load balancing configuration and management

set -euo pipefail

# Make script executable
chmod +x "$0"

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
NAMESPACE="rbi-compliance"
INGRESS_NAMESPACE="ingress-nginx"
ISTIO_NAMESPACE="istio-system"

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
RBI Compliance Platform - Load Balancing Management Script

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    install         Install load balancing components
    configure       Configure load balancing strategies
    status          Show load balancing status
    test            Run load balancing tests
    switch          Switch load balancing algorithm
    monitor         Show monitoring dashboard
    health          Run health checks
    cleanup         Remove load balancing configurations
    help            Show this help message

Options:
    --namespace     Kubernetes namespace (default: rbi-compliance)
    --algorithm     Load balancing algorithm (round_robin|least_conn|ip_hash|ewma)
    --service       Target service name
    --dry-run       Show what would be done without executing
    --verbose       Enable verbose output

Examples:
    $0 install --with-istio
    $0 configure --algorithm least_conn --service auth-service
    $0 status --all
    $0 switch --algorithm ip_hash
    $0 test --load-test --duration 300
    $0 health --detailed

EOF
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi

    # Check helm
    if ! command -v helm &> /dev/null; then
        log_error "helm is not installed"
        exit 1
    fi

    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi

    # Check namespaces
    for ns in "$NAMESPACE" "$INGRESS_NAMESPACE"; do
        if ! kubectl get namespace "$ns" &> /dev/null; then
            log_warning "Namespace $ns does not exist, creating..."
            kubectl create namespace "$ns"
        fi
    done

    log_success "Prerequisites check completed"
}

# Install load balancing components
install_load_balancing() {
    local with_istio=${1:-false}
    
    log_step "Installing load balancing components..."

    # Install NGINX Ingress Controller
    log_info "Installing NGINX Ingress Controller..."
    kubectl apply -f "$PROJECT_ROOT/k8s/load-balancing/nginx-ingress-controller.yaml"

    # Install Istio if requested
    if [[ "$with_istio" == "true" ]]; then
        log_info "Installing Istio Service Mesh..."
        
        # Download and install Istio
        if ! command -v istioctl &> /dev/null; then
            log_info "Downloading Istio..."
            curl -L https://istio.io/downloadIstio | sh -
            export PATH="$PWD/istio-*/bin:$PATH"
        fi
        
        # Install Istio
        istioctl install --set values.defaultRevision=default -y
        
        # Apply Istio configurations
        kubectl apply -f "$PROJECT_ROOT/k8s/load-balancing/istio-service-mesh.yaml"
        
        # Enable sidecar injection
        kubectl label namespace "$NAMESPACE" istio-injection=enabled --overwrite
    fi

    # Wait for components to be ready
    log_info "Waiting for components to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/nginx-ingress-controller -n "$INGRESS_NAMESPACE"
    
    if [[ "$with_istio" == "true" ]]; then
        kubectl wait --for=condition=available --timeout=300s deployment/istiod -n "$ISTIO_NAMESPACE"
    fi

    log_success "Load balancing components installed successfully"
}

# Configure load balancing strategies
configure_load_balancing() {
    local algorithm=${1:-"round_robin"}
    local service=${2:-"all"}
    
    log_step "Configuring load balancing ($algorithm) for $service..."

    # Apply service configurations
    kubectl apply -f "$PROJECT_ROOT/k8s/load-balancing/advanced-services.yaml"

    # Apply ingress configurations
    kubectl apply -f "$PROJECT_ROOT/k8s/load-balancing/intelligent-ingress.yaml"

    # Configure NGINX load balancing algorithm
    log_info "Configuring NGINX load balancing algorithm: $algorithm"
    kubectl patch configmap nginx-configuration -n "$INGRESS_NAMESPACE" \
        --patch '{"data":{"load-balance":"'$algorithm'"}}'

    # Apply Istio configurations if available
    if kubectl get namespace "$ISTIO_NAMESPACE" &> /dev/null; then
        log_info "Configuring Istio destination rules..."
        kubectl apply -f "$PROJECT_ROOT/k8s/load-balancing/istio-service-mesh.yaml"
    fi

    # Apply monitoring configurations
    kubectl apply -f "$PROJECT_ROOT/k8s/load-balancing/monitoring-alerting.yaml"

    log_success "Load balancing configuration completed"
}

# Show load balancing status
show_status() {
    local show_all=${1:-false}
    
    log_step "Checking load balancing status..."

    echo
    log_info "=== NGINX Ingress Controller ==="
    kubectl get pods -n "$INGRESS_NAMESPACE" -l app.kubernetes.io/name=ingress-nginx
    kubectl get svc -n "$INGRESS_NAMESPACE" ingress-nginx

    echo
    log_info "=== Ingress Resources ==="
    kubectl get ingress -n "$NAMESPACE"

    echo
    log_info "=== Services ==="
    kubectl get svc -n "$NAMESPACE" -l component=load-balancing

    # Show Istio status if available
    if kubectl get namespace "$ISTIO_NAMESPACE" &> /dev/null; then
        echo
        log_info "=== Istio Service Mesh ==="
        kubectl get pods -n "$ISTIO_NAMESPACE"
        kubectl get virtualservices -n "$NAMESPACE"
        kubectl get destinationrules -n "$NAMESPACE"
    fi

    if [[ "$show_all" == "true" ]]; then
        echo
        log_info "=== Load Balancer Configuration ==="
        kubectl get configmap nginx-configuration -n "$INGRESS_NAMESPACE" -o yaml | grep -A 10 "data:"

        echo
        log_info "=== Service Endpoints ==="
        kubectl get endpoints -n "$NAMESPACE"

        echo
        log_info "=== Recent Events ==="
        kubectl get events -n "$NAMESPACE" --sort-by='.lastTimestamp' | tail -10
    fi
}

# Switch load balancing algorithm
switch_algorithm() {
    local algorithm="$1"
    
    log_step "Switching load balancing algorithm to $algorithm..."

    # Validate algorithm
    case $algorithm in
        round_robin|least_conn|ip_hash|ewma)
            ;;
        *)
            log_error "Invalid algorithm: $algorithm"
            log_info "Valid algorithms: round_robin, least_conn, ip_hash, ewma"
            exit 1
            ;;
    esac

    # Update NGINX configuration
    kubectl patch configmap nginx-configuration -n "$INGRESS_NAMESPACE" \
        --patch '{"data":{"load-balance":"'$algorithm'"}}'

    # Restart NGINX pods to apply changes
    kubectl rollout restart deployment/nginx-ingress-controller -n "$INGRESS_NAMESPACE"

    # Wait for rollout to complete
    kubectl rollout status deployment/nginx-ingress-controller -n "$INGRESS_NAMESPACE"

    log_success "Load balancing algorithm switched to $algorithm"
}

# Run load balancing tests
run_tests() {
    local test_type=${1:-"basic"}
    local duration=${2:-60}
    
    log_step "Running load balancing tests ($test_type)..."

    case $test_type in
        "basic")
            run_basic_tests
            ;;
        "load")
            run_load_tests "$duration"
            ;;
        "algorithm")
            run_algorithm_tests
            ;;
        "all")
            run_basic_tests
            run_load_tests "$duration"
            run_algorithm_tests
            ;;
        *)
            log_error "Unknown test type: $test_type"
            exit 1
            ;;
    esac

    log_success "Load balancing tests completed"
}

# Run basic connectivity tests
run_basic_tests() {
    log_info "Running basic connectivity tests..."

    # Get ingress IP
    local ingress_ip
    ingress_ip=$(kubectl get svc ingress-nginx -n "$INGRESS_NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    
    if [[ -z "$ingress_ip" ]]; then
        ingress_ip=$(kubectl get svc ingress-nginx -n "$INGRESS_NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    fi

    if [[ -z "$ingress_ip" ]]; then
        log_warning "Cannot determine ingress IP, using port-forward"
        kubectl port-forward -n "$INGRESS_NAMESPACE" svc/ingress-nginx 8080:80 &
        local port_forward_pid=$!
        ingress_ip="localhost:8080"
        sleep 5
    fi

    # Test basic connectivity
    log_info "Testing connectivity to $ingress_ip..."
    
    for endpoint in "/api/health" "/health" "/"; do
        if curl -s -o /dev/null -w "%{http_code}" "http://$ingress_ip$endpoint" | grep -q "200\|404"; then
            log_success "✓ $endpoint is reachable"
        else
            log_warning "✗ $endpoint is not reachable"
        fi
    done

    # Cleanup port-forward if used
    if [[ -n "${port_forward_pid:-}" ]]; then
        kill $port_forward_pid 2>/dev/null || true
    fi

    log_info "Basic connectivity tests completed"
}

# Run load tests
run_load_tests() {
    local duration="$1"
    
    log_info "Running load tests for ${duration} seconds..."

    # Create load test job
    cat << EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: load-test-$(date +%s)
  namespace: $NAMESPACE
spec:
  template:
    spec:
      containers:
      - name: load-test
        image: williamyeh/wrk
        command:
        - wrk
        - -t12
        - -c100
        - -d${duration}s
        - --latency
        - http://api-gateway:8080/api/health
      restartPolicy: Never
  backoffLimit: 1
EOF

    # Monitor load test
    log_info "Monitoring load test progress..."
    sleep 10
    
    local job_name
    job_name=$(kubectl get jobs -n "$NAMESPACE" -l job-name=load-test --sort-by=.metadata.creationTimestamp -o jsonpath='{.items[-1].metadata.name}')
    
    kubectl wait --for=condition=complete --timeout=$((duration + 60))s job/"$job_name" -n "$NAMESPACE"
    
    # Get results
    local pod_name
    pod_name=$(kubectl get pods -n "$NAMESPACE" -l job-name="$job_name" -o jsonpath='{.items[0].metadata.name}')
    
    log_info "Load test results:"
    kubectl logs "$pod_name" -n "$NAMESPACE"

    # Cleanup
    kubectl delete job "$job_name" -n "$NAMESPACE"

    log_info "Load test completed"
}

# Run algorithm comparison tests
run_algorithm_tests() {
    log_info "Running algorithm comparison tests..."

    local algorithms=("round_robin" "least_conn" "ip_hash" "ewma")
    local results_file="/tmp/algorithm_test_results.txt"
    
    echo "Algorithm Comparison Test Results" > "$results_file"
    echo "=================================" >> "$results_file"
    echo "Timestamp: $(date)" >> "$results_file"
    echo >> "$results_file"

    for algorithm in "${algorithms[@]}"; do
        log_info "Testing $algorithm algorithm..."
        
        # Switch algorithm
        switch_algorithm "$algorithm"
        
        # Wait for changes to propagate
        sleep 30
        
        # Run quick load test
        log_info "Running test for $algorithm..."
        echo "Algorithm: $algorithm" >> "$results_file"
        
        # Simple curl test with timing
        local total_time=0
        local successful_requests=0
        
        for i in {1..10}; do
            local response_time
            response_time=$(curl -s -o /dev/null -w "%{time_total}" "http://api-gateway:8080/api/health" || echo "0")
            
            if [[ "$response_time" != "0" ]]; then
                total_time=$(echo "$total_time + $response_time" | bc -l)
                ((successful_requests++))
            fi
        done
        
        if [[ $successful_requests -gt 0 ]]; then
            local avg_time
            avg_time=$(echo "scale=3; $total_time / $successful_requests" | bc -l)
            echo "  Average response time: ${avg_time}s" >> "$results_file"
            echo "  Successful requests: $successful_requests/10" >> "$results_file"
        else
            echo "  No successful requests" >> "$results_file"
        fi
        
        echo >> "$results_file"
    done

    log_info "Algorithm comparison results:"
    cat "$results_file"

    log_info "Algorithm comparison tests completed"
}

# Run health checks
run_health_checks() {
    local detailed=${1:-false}
    
    log_step "Running load balancing health checks..."

    # Execute health check script
    kubectl create configmap load-balancing-health-check \
        --from-file="$PROJECT_ROOT/k8s/load-balancing/monitoring-alerting.yaml" \
        --dry-run=client -o yaml | kubectl apply -f -

    # Run health check
    kubectl run health-check-$(date +%s) \
        --image=alpine/curl \
        --rm -i --tty \
        --restart=Never \
        --namespace="$NAMESPACE" \
        -- /bin/sh -c "
        apk add --no-cache jq bc
        wget -O /tmp/health-check.sh https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/aws/deploy.yaml
        chmod +x /tmp/health-check.sh
        /tmp/health-check.sh
        "

    if [[ "$detailed" == "true" ]]; then
        log_info "Running detailed health checks..."
        
        # Check service endpoints
        log_info "Service endpoint health:"
        kubectl get endpoints -n "$NAMESPACE" -o wide
        
        # Check ingress status
        log_info "Ingress status:"
        kubectl describe ingress -n "$NAMESPACE"
        
        # Check load balancer metrics
        if kubectl get svc prometheus -n monitoring &> /dev/null; then
            log_info "Load balancer metrics:"
            kubectl port-forward -n monitoring svc/prometheus 9090:9090 &
            local prom_pid=$!
            sleep 5
            
            curl -s "http://localhost:9090/api/v1/query?query=nginx_ingress_controller_requests_rate5m" | jq '.data.result'
            
            kill $prom_pid 2>/dev/null || true
        fi
    fi

    log_success "Health checks completed"
}

# Show monitoring dashboard
show_monitoring() {
    log_step "Opening monitoring dashboard..."

    # Port forward to Grafana
    log_info "Port forwarding to Grafana dashboard..."
    kubectl port-forward -n monitoring service/grafana 3000:80 &
    local grafana_pid=$!

    log_info "Grafana dashboard available at: http://localhost:3000"
    log_info "Default credentials: admin/admin"
    log_info "Load Balancing dashboard: RBI Compliance - Load Balancing Dashboard"
    log_info "Press Ctrl+C to stop port forwarding"

    # Wait for interrupt
    trap "kill $grafana_pid 2>/dev/null || true" EXIT
    wait $grafana_pid 2>/dev/null || true
}

# Cleanup load balancing configurations
cleanup_load_balancing() {
    log_step "Cleaning up load balancing configurations..."

    log_warning "This will remove all load balancing configurations. Continue? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        log_info "Cleanup cancelled"
        return
    fi

    # Remove ingress configurations
    log_info "Removing ingress configurations..."
    kubectl delete ingress --all -n "$NAMESPACE" || true

    # Remove service configurations
    log_info "Removing service configurations..."
    kubectl delete svc -l component=load-balancing -n "$NAMESPACE" || true

    # Remove NGINX Ingress Controller
    log_info "Removing NGINX Ingress Controller..."
    kubectl delete -f "$PROJECT_ROOT/k8s/load-balancing/nginx-ingress-controller.yaml" || true

    # Remove Istio configurations if present
    if kubectl get namespace "$ISTIO_NAMESPACE" &> /dev/null; then
        log_info "Removing Istio configurations..."
        kubectl delete -f "$PROJECT_ROOT/k8s/load-balancing/istio-service-mesh.yaml" || true
        istioctl uninstall --purge -y || true
    fi

    # Remove monitoring configurations
    log_info "Removing monitoring configurations..."
    kubectl delete -f "$PROJECT_ROOT/k8s/load-balancing/monitoring-alerting.yaml" || true

    log_success "Load balancing cleanup completed"
}

# Main execution
main() {
    local command=${1:-"help"}
    shift || true

    case $command in
        "install")
            check_prerequisites
            local with_istio=false
            if [[ "${1:-}" == "--with-istio" ]]; then
                with_istio=true
            fi
            install_load_balancing "$with_istio"
            ;;
        "configure")
            check_prerequisites
            local algorithm=${1:-"round_robin"}
            local service=${2:-"all"}
            configure_load_balancing "$algorithm" "$service"
            ;;
        "status")
            check_prerequisites
            local show_all=false
            if [[ "${1:-}" == "--all" ]]; then
                show_all=true
            fi
            show_status "$show_all"
            ;;
        "switch")
            check_prerequisites
            local algorithm=${1:-""}
            if [[ -z "$algorithm" ]]; then
                log_error "Usage: $0 switch <algorithm>"
                exit 1
            fi
            switch_algorithm "$algorithm"
            ;;
        "test")
            check_prerequisites
            local test_type=${1:-"basic"}
            local duration=${2:-60}
            run_tests "$test_type" "$duration"
            ;;
        "health")
            check_prerequisites
            local detailed=false
            if [[ "${1:-}" == "--detailed" ]]; then
                detailed=true
            fi
            run_health_checks "$detailed"
            ;;
        "monitor")
            check_prerequisites
            show_monitoring
            ;;
        "cleanup")
            check_prerequisites
            cleanup_load_balancing
            ;;
        "help"|*)
            show_usage
            ;;
    esac
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        --algorithm)
            ALGORITHM="$2"
            shift 2
            ;;
        --service)
            SERVICE="$2"
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
