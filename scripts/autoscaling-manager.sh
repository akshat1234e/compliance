#!/bin/bash

# RBI Compliance Platform - Autoscaling Management Script
# Comprehensive autoscaling configuration and management

set -euo pipefail

# Make script executable
chmod +x "$0"

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
NAMESPACE="rbi-compliance"
CLUSTER_NAME="rbi-compliance-cluster"
REGION="ap-south-1"

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
RBI Compliance Platform - Autoscaling Management Script

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    install         Install all autoscaling components
    configure       Configure autoscaling for services
    status          Show autoscaling status
    scale           Manual scaling operations
    test            Run autoscaling tests
    monitor         Show monitoring dashboard
    cleanup         Remove autoscaling configurations
    help            Show this help message

Options:
    --namespace     Kubernetes namespace (default: rbi-compliance)
    --cluster       Cluster name (default: rbi-compliance-cluster)
    --region        AWS region (default: ap-south-1)
    --dry-run       Show what would be done without executing
    --verbose       Enable verbose output

Examples:
    $0 install --namespace rbi-compliance
    $0 configure --service auth-service
    $0 status --all
    $0 scale --service auth-service --replicas 10
    $0 test --load-test

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

    # Check namespace
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_warning "Namespace $NAMESPACE does not exist, creating..."
        kubectl create namespace "$NAMESPACE"
    fi

    log_success "Prerequisites check completed"
}

# Install autoscaling components
install_autoscaling() {
    log_step "Installing autoscaling components..."

    # Install Metrics Server
    log_info "Installing Metrics Server..."
    kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

    # Install VPA
    log_info "Installing Vertical Pod Autoscaler..."
    git clone https://github.com/kubernetes/autoscaler.git /tmp/autoscaler || true
    cd /tmp/autoscaler/vertical-pod-autoscaler
    ./hack/vpa-install.sh
    cd "$PROJECT_ROOT"

    # Install KEDA
    log_info "Installing KEDA..."
    helm repo add kedacore https://kedacore.github.io/charts
    helm repo update
    helm upgrade --install keda kedacore/keda \
        --namespace keda \
        --create-namespace \
        --set prometheus.metricServer.enabled=true \
        --set prometheus.operator.enabled=true

    # Install Cluster Autoscaler
    log_info "Installing Cluster Autoscaler..."
    kubectl apply -f "$PROJECT_ROOT/k8s/autoscaling/cluster-autoscaler.yaml"

    # Wait for components to be ready
    log_info "Waiting for components to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/metrics-server -n kube-system
    kubectl wait --for=condition=available --timeout=300s deployment/vpa-recommender -n vpa-system
    kubectl wait --for=condition=available --timeout=300s deployment/keda-operator -n keda
    kubectl wait --for=condition=available --timeout=300s deployment/cluster-autoscaler -n kube-system

    log_success "Autoscaling components installed successfully"
}

# Configure autoscaling for services
configure_autoscaling() {
    local service_name=${1:-"all"}

    log_step "Configuring autoscaling for $service_name..."

    if [[ "$service_name" == "all" || "$service_name" == "auth-service" ]]; then
        log_info "Configuring HPA for auth-service..."
        kubectl apply -f "$PROJECT_ROOT/k8s/autoscaling/hpa-auth-service.yaml"
    fi

    if [[ "$service_name" == "all" || "$service_name" == "compliance-service" ]]; then
        log_info "Configuring HPA for compliance-service..."
        kubectl apply -f "$PROJECT_ROOT/k8s/autoscaling/hpa-compliance-service.yaml"
    fi

    if [[ "$service_name" == "all" ]]; then
        log_info "Configuring VPA for all services..."
        kubectl apply -f "$PROJECT_ROOT/k8s/autoscaling/vpa-configurations.yaml"

        log_info "Configuring KEDA scalers..."
        kubectl apply -f "$PROJECT_ROOT/k8s/autoscaling/keda-scalers.yaml"

        log_info "Setting up monitoring..."
        kubectl apply -f "$PROJECT_ROOT/k8s/autoscaling/monitoring-dashboard.yaml"
    fi

    log_success "Autoscaling configuration completed for $service_name"
}

# Show autoscaling status
show_status() {
    local show_all=${1:-false}

    log_step "Checking autoscaling status..."

    echo
    log_info "=== Horizontal Pod Autoscalers ==="
    kubectl get hpa -n "$NAMESPACE" -o wide

    echo
    log_info "=== Vertical Pod Autoscalers ==="
    kubectl get vpa -n "$NAMESPACE" -o wide

    echo
    log_info "=== KEDA ScaledObjects ==="
    kubectl get scaledobjects -n "$NAMESPACE" -o wide

    echo
    log_info "=== Cluster Autoscaler Status ==="
    kubectl get nodes -o wide
    kubectl logs -n kube-system deployment/cluster-autoscaler --tail=10

    if [[ "$show_all" == "true" ]]; then
        echo
        log_info "=== Pod Resource Usage ==="
        kubectl top pods -n "$NAMESPACE"

        echo
        log_info "=== Node Resource Usage ==="
        kubectl top nodes

        echo
        log_info "=== Recent Scaling Events ==="
        kubectl get events -n "$NAMESPACE" --field-selector reason=SuccessfulRescale --sort-by='.lastTimestamp' | tail -10
    fi
}

# Manual scaling operations
manual_scale() {
    local service_name="$1"
    local replicas="$2"

    log_step "Manually scaling $service_name to $replicas replicas..."

    # Check if HPA exists and disable it temporarily
    if kubectl get hpa "$service_name-hpa" -n "$NAMESPACE" &> /dev/null; then
        log_warning "HPA exists for $service_name, scaling deployment directly"
        kubectl patch hpa "$service_name-hpa" -n "$NAMESPACE" -p '{"spec":{"minReplicas":'$replicas',"maxReplicas":'$replicas'}}'
    else
        kubectl scale deployment "$service_name" -n "$NAMESPACE" --replicas="$replicas"
    fi

    # Wait for scaling to complete
    kubectl wait --for=condition=available --timeout=300s deployment/"$service_name" -n "$NAMESPACE"

    log_success "Successfully scaled $service_name to $replicas replicas"
}

# Run autoscaling tests
run_tests() {
    local test_type=${1:-"basic"}

    log_step "Running autoscaling tests ($test_type)..."

    case $test_type in
        "basic")
            run_basic_tests
            ;;
        "load")
            run_load_tests
            ;;
        "stress")
            run_stress_tests
            ;;
        "all")
            run_basic_tests
            run_load_tests
            run_stress_tests
            ;;
        *)
            log_error "Unknown test type: $test_type"
            exit 1
            ;;
    esac

    log_success "Autoscaling tests completed"
}

# Run basic autoscaling tests
run_basic_tests() {
    log_info "Running basic autoscaling tests..."

    # Test HPA functionality
    log_info "Testing HPA scaling..."

    # Create test load
    kubectl run load-generator \
        --image=busybox \
        --restart=Never \
        --rm -i --tty \
        --namespace="$NAMESPACE" \
        -- /bin/sh -c "while true; do wget -q -O- http://auth-service:8080/health; done" &

    LOAD_PID=$!

    # Monitor scaling for 5 minutes
    for i in {1..10}; do
        echo "Monitoring iteration $i/10"
        kubectl get hpa -n "$NAMESPACE"
        kubectl get pods -n "$NAMESPACE" | grep auth-service
        sleep 30
    done

    # Stop load generator
    kill $LOAD_PID 2>/dev/null || true

    log_info "Basic HPA test completed"
}

# Run load tests
run_load_tests() {
    log_info "Running load tests..."

    # Apply load test configuration
    cat << EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: load-test
  namespace: $NAMESPACE
spec:
  replicas: 5
  selector:
    matchLabels:
      app: load-test
  template:
    metadata:
      labels:
        app: load-test
    spec:
      containers:
      - name: load-test
        image: busybox
        command:
        - /bin/sh
        - -c
        - |
          while true; do
            for i in {1..100}; do
              wget -q -O- http://auth-service:8080/api/health &
            done
            wait
            sleep 1
          done
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
EOF

    # Monitor for 10 minutes
    log_info "Monitoring load test for 10 minutes..."
    for i in {1..20}; do
        echo "Load test monitoring $i/20"
        kubectl get hpa -n "$NAMESPACE"
        kubectl top pods -n "$NAMESPACE" | grep auth-service
        sleep 30
    done

    # Cleanup
    kubectl delete deployment load-test -n "$NAMESPACE"

    log_info "Load test completed"
}

# Run stress tests
run_stress_tests() {
    log_info "Running stress tests..."

    # Create high CPU load
    kubectl run cpu-stress \
        --image=progrium/stress \
        --restart=Never \
        --rm -i --tty \
        --namespace="$NAMESPACE" \
        --overrides='{"spec":{"containers":[{"name":"cpu-stress","image":"progrium/stress","args":["--cpu","4","--timeout","300s"],"resources":{"requests":{"cpu":"2000m","memory":"1Gi"}}}]}}' &

    STRESS_PID=$!

    # Monitor VPA recommendations
    for i in {1..10}; do
        echo "Stress test monitoring $i/10"
        kubectl get vpa -n "$NAMESPACE"
        kubectl describe vpa -n "$NAMESPACE" | grep -A 10 "Recommendation:"
        sleep 30
    done

    # Wait for stress test to complete
    wait $STRESS_PID 2>/dev/null || true

    log_info "Stress test completed"
}

# Show monitoring dashboard
show_monitoring() {
    log_step "Opening monitoring dashboard..."

    # Port forward to Grafana
    log_info "Port forwarding to Grafana dashboard..."
    kubectl port-forward -n monitoring service/grafana 3000:80 &
    GRAFANA_PID=$!

    log_info "Grafana dashboard available at: http://localhost:3000"
    log_info "Default credentials: admin/admin"
    log_info "Press Ctrl+C to stop port forwarding"

    # Wait for interrupt
    trap "kill $GRAFANA_PID 2>/dev/null || true" EXIT
    wait $GRAFANA_PID 2>/dev/null || true
}

# Cleanup autoscaling configurations
cleanup_autoscaling() {
    log_step "Cleaning up autoscaling configurations..."

    log_warning "This will remove all autoscaling configurations. Continue? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        log_info "Cleanup cancelled"
        return
    fi

    # Remove HPA configurations
    log_info "Removing HPA configurations..."
    kubectl delete hpa --all -n "$NAMESPACE" || true

    # Remove VPA configurations
    log_info "Removing VPA configurations..."
    kubectl delete vpa --all -n "$NAMESPACE" || true

    # Remove KEDA configurations
    log_info "Removing KEDA configurations..."
    kubectl delete scaledobjects --all -n "$NAMESPACE" || true

    # Remove monitoring configurations
    log_info "Removing monitoring configurations..."
    kubectl delete configmap autoscaling-dashboard -n "$NAMESPACE" || true
    kubectl delete prometheusrule autoscaling-comprehensive-alerts -n "$NAMESPACE" || true

    log_success "Autoscaling cleanup completed"
}

# Main execution
main() {
    local command=${1:-"help"}
    shift || true

    case $command in
        "install")
            check_prerequisites
            install_autoscaling
            ;;
        "configure")
            check_prerequisites
            local service_name=${1:-"all"}
            configure_autoscaling "$service_name"
            ;;
        "status")
            check_prerequisites
            local show_all=${1:-false}
            show_status "$show_all"
            ;;
        "scale")
            check_prerequisites
            local service_name=${1:-""}
            local replicas=${2:-""}
            if [[ -z "$service_name" || -z "$replicas" ]]; then
                log_error "Usage: $0 scale <service-name> <replicas>"
                exit 1
            fi
            manual_scale "$service_name" "$replicas"
            ;;
        "test")
            check_prerequisites
            local test_type=${1:-"basic"}
            run_tests "$test_type"
            ;;
        "monitor")
            check_prerequisites
            show_monitoring
            ;;
        "cleanup")
            check_prerequisites
            cleanup_autoscaling
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
        --cluster)
            CLUSTER_NAME="$2"
            shift 2
            ;;
        --region)
            REGION="$2"
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
