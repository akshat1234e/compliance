#!/bin/bash

# RBI Compliance Platform - Kubernetes Deployment Script
# This script deploys the RBI Compliance Platform to a Kubernetes cluster

set -euo pipefail

# Make script executable
chmod +x "$0"

# Configuration
NAMESPACE="rbi-compliance"
STAGING_NAMESPACE="rbi-compliance-staging"
DEV_NAMESPACE="rbi-compliance-dev"
MONITORING_NAMESPACE="rbi-compliance-monitoring"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi

    # Check if helm is installed
    if ! command -v helm &> /dev/null; then
        log_error "helm is not installed. Please install helm first."
        exit 1
    fi

    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Create namespaces
create_namespaces() {
    log_info "Creating namespaces..."

    kubectl apply -f cluster/namespace.yaml

    # Wait for namespaces to be ready
    kubectl wait --for=condition=Active namespace/$NAMESPACE --timeout=60s
    kubectl wait --for=condition=Active namespace/$STAGING_NAMESPACE --timeout=60s
    kubectl wait --for=condition=Active namespace/$DEV_NAMESPACE --timeout=60s
    kubectl wait --for=condition=Active namespace/$MONITORING_NAMESPACE --timeout=60s

    log_success "Namespaces created successfully"
}

# Setup RBAC
setup_rbac() {
    log_info "Setting up RBAC..."

    kubectl apply -f rbac/rbac.yaml

    log_success "RBAC configured successfully"
}

# Deploy secrets and configmaps
deploy_config() {
    log_info "Deploying configuration..."

    # Apply ConfigMaps
    kubectl apply -f config/configmaps.yaml

    # Apply Secrets (in production, these should be managed by external secret management)
    log_warning "Applying secrets from YAML files. In production, use external secret management!"
    kubectl apply -f config/secrets.yaml

    log_success "Configuration deployed successfully"
}

# Deploy databases
deploy_databases() {
    log_info "Deploying databases..."

    # Deploy PostgreSQL
    kubectl apply -f database/postgres.yaml

    # Deploy Redis
    kubectl apply -f database/redis.yaml

    # Wait for databases to be ready
    log_info "Waiting for databases to be ready..."
    kubectl wait --for=condition=Ready pod -l app=postgres -n $NAMESPACE --timeout=300s
    kubectl wait --for=condition=Ready pod -l app=redis -n $NAMESPACE --timeout=300s

    log_success "Databases deployed successfully"
}

# Deploy applications
deploy_applications() {
    log_info "Deploying applications..."

    # Deploy auth service first
    kubectl apply -f apps/auth-service.yaml

    # Wait for auth service to be ready
    kubectl wait --for=condition=Available deployment/auth-service -n $NAMESPACE --timeout=300s

    # Deploy integration gateway
    kubectl apply -f apps/integration-gateway.yaml

    # Wait for integration gateway to be ready
    kubectl wait --for=condition=Available deployment/integration-gateway -n $NAMESPACE --timeout=300s

    # Deploy frontend
    kubectl apply -f apps/frontend.yaml

    # Wait for frontend to be ready
    kubectl wait --for=condition=Available deployment/frontend -n $NAMESPACE --timeout=300s

    log_success "Applications deployed successfully"
}

# Setup networking
setup_networking() {
    log_info "Setting up networking..."

    # Install nginx-ingress if not present
    if ! kubectl get namespace ingress-nginx &> /dev/null; then
        log_info "Installing nginx-ingress controller..."
        helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
        helm repo update
        helm install ingress-nginx ingress-nginx/ingress-nginx \
            --create-namespace \
            --namespace ingress-nginx \
            --set controller.service.type=LoadBalancer

        # Wait for ingress controller to be ready
        kubectl wait --namespace ingress-nginx \
            --for=condition=ready pod \
            --selector=app.kubernetes.io/component=controller \
            --timeout=300s
    fi

    # Install cert-manager if not present
    if ! kubectl get namespace cert-manager &> /dev/null; then
        log_info "Installing cert-manager..."
        helm repo add jetstack https://charts.jetstack.io
        helm repo update
        helm install cert-manager jetstack/cert-manager \
            --namespace cert-manager \
            --create-namespace \
            --version v1.10.0 \
            --set installCRDs=true

        # Wait for cert-manager to be ready
        kubectl wait --namespace cert-manager \
            --for=condition=ready pod \
            --selector=app.kubernetes.io/instance=cert-manager \
            --timeout=300s
    fi

    # Apply ingress configuration
    kubectl apply -f networking/ingress.yaml

    log_success "Networking configured successfully"
}

# Deploy monitoring
deploy_monitoring() {
    log_info "Deploying monitoring stack..."

    # Install Prometheus Operator if not present
    if ! helm list -n $MONITORING_NAMESPACE | grep -q prometheus-operator; then
        log_info "Installing Prometheus Operator..."
        helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
        helm repo update
        helm install prometheus-operator prometheus-community/kube-prometheus-stack \
            --namespace $MONITORING_NAMESPACE \
            --create-namespace \
            --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
            --set prometheus.prometheusSpec.podMonitorSelectorNilUsesHelmValues=false
    fi

    # Apply custom Prometheus configuration
    kubectl apply -f monitoring/prometheus.yaml

    log_success "Monitoring stack deployed successfully"
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."

    # Check pod status
    log_info "Checking pod status..."
    kubectl get pods -n $NAMESPACE

    # Check service status
    log_info "Checking service status..."
    kubectl get services -n $NAMESPACE

    # Check ingress status
    log_info "Checking ingress status..."
    kubectl get ingress -n $NAMESPACE

    # Run health checks
    log_info "Running health checks..."

    # Check if all deployments are ready
    if kubectl get deployments -n $NAMESPACE -o jsonpath='{.items[*].status.conditions[?(@.type=="Available")].status}' | grep -q False; then
        log_warning "Some deployments are not ready. Please check the status."
    else
        log_success "All deployments are ready"
    fi

    # Get external IP
    EXTERNAL_IP=$(kubectl get service ingress-nginx-controller -n ingress-nginx -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    if [ -n "$EXTERNAL_IP" ]; then
        log_success "External IP: $EXTERNAL_IP"
        log_info "You can access the application at: https://$EXTERNAL_IP"
        log_info "Make sure to update your DNS records to point to this IP"
    else
        log_warning "External IP not yet assigned. Please check the LoadBalancer service."
    fi
}

# Cleanup function
cleanup() {
    log_info "Cleaning up resources..."

    # Delete applications
    kubectl delete -f apps/ --ignore-not-found=true

    # Delete databases
    kubectl delete -f database/ --ignore-not-found=true

    # Delete networking
    kubectl delete -f networking/ --ignore-not-found=true

    # Delete configuration
    kubectl delete -f config/ --ignore-not-found=true

    # Delete RBAC
    kubectl delete -f rbac/ --ignore-not-found=true

    # Delete namespaces
    kubectl delete -f cluster/namespace.yaml --ignore-not-found=true

    log_success "Cleanup completed"
}

# Main deployment function
deploy() {
    log_info "Starting RBI Compliance Platform deployment..."

    check_prerequisites
    create_namespaces
    setup_rbac
    deploy_config
    deploy_databases
    deploy_applications
    setup_networking
    deploy_monitoring
    verify_deployment

    log_success "RBI Compliance Platform deployed successfully!"
    log_info "Please check the verification output above for any issues."
}

# Help function
show_help() {
    echo "RBI Compliance Platform - Kubernetes Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy     Deploy the complete platform (default)"
    echo "  cleanup    Remove all platform resources"
    echo "  verify     Verify the current deployment"
    echo "  help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy    # Deploy the platform"
    echo "  $0 cleanup   # Remove all resources"
    echo "  $0 verify    # Check deployment status"
}

# Main script logic
case "${1:-deploy}" in
    deploy)
        deploy
        ;;
    cleanup)
        cleanup
        ;;
    verify)
        verify_deployment
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
