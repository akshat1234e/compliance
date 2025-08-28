# RBI Compliance Platform - Kubernetes Configuration

This directory contains the complete Kubernetes configuration for deploying the RBI Compliance Platform in a production-ready environment.

## 📁 Directory Structure

```
k8s/
├── cluster/
│   └── namespace.yaml              # Namespace definitions
├── config/
│   ├── configmaps.yaml            # Application configuration
│   └── secrets.yaml               # Sensitive configuration
├── database/
│   ├── postgres.yaml              # PostgreSQL deployment
│   └── redis.yaml                 # Redis deployment
├── apps/
│   ├── integration-gateway.yaml   # Integration Gateway service
│   ├── auth-service.yaml          # Authentication service
│   └── frontend.yaml              # Frontend application
├── networking/
│   └── ingress.yaml               # Ingress and load balancer
├── rbac/
│   └── rbac.yaml                  # Role-based access control
├── monitoring/
│   └── prometheus.yaml            # Monitoring configuration
├── deploy.sh                      # Deployment script
└── README.md                      # This file
```

## 🚀 Quick Start

### Prerequisites

1. **Kubernetes Cluster**: v1.20+ with at least 3 nodes
2. **kubectl**: Configured to access your cluster
3. **Helm**: v3.0+ for package management
4. **Storage Class**: Fast SSD storage class configured
5. **Load Balancer**: Cloud provider load balancer or MetalLB

### One-Command Deployment

```bash
# Make the script executable and deploy
chmod +x deploy.sh
./deploy.sh deploy
```

### Manual Step-by-Step Deployment

```bash
# 1. Create namespaces
kubectl apply -f cluster/namespace.yaml

# 2. Setup RBAC
kubectl apply -f rbac/rbac.yaml

# 3. Deploy configuration
kubectl apply -f config/configmaps.yaml
kubectl apply -f config/secrets.yaml

# 4. Deploy databases
kubectl apply -f database/postgres.yaml
kubectl apply -f database/redis.yaml

# 5. Deploy applications
kubectl apply -f apps/auth-service.yaml
kubectl apply -f apps/integration-gateway.yaml
kubectl apply -f apps/frontend.yaml

# 6. Setup networking
kubectl apply -f networking/ingress.yaml

# 7. Deploy monitoring
kubectl apply -f monitoring/prometheus.yaml
```

## 🏗️ Architecture Overview

### Namespaces

- **rbi-compliance**: Production environment
- **rbi-compliance-staging**: Staging environment
- **rbi-compliance-dev**: Development environment
- **rbi-compliance-monitoring**: Monitoring and observability

### Components

#### **Database Layer**
- **PostgreSQL**: Primary database with backup and monitoring
- **Redis**: Caching and session storage with sentinel for HA
- **Persistent Storage**: SSD-backed storage for performance

#### **Application Layer**
- **Auth Service**: JWT-based authentication and authorization
- **Integration Gateway**: Core API gateway and banking integrations
- **Frontend**: React/Next.js web application

#### **Infrastructure Layer**
- **Ingress Controller**: NGINX with SSL termination
- **Load Balancer**: Cloud provider or MetalLB
- **Monitoring**: Prometheus, Grafana, and AlertManager

### Resource Requirements

#### **Minimum Requirements**
- **Nodes**: 3 nodes (2 CPU, 4GB RAM each)
- **Storage**: 200GB SSD storage
- **Network**: 1Gbps bandwidth

#### **Recommended Production**
- **Nodes**: 5+ nodes (4 CPU, 8GB RAM each)
- **Storage**: 500GB+ SSD storage
- **Network**: 10Gbps bandwidth

## 🔧 Configuration

### Environment Variables

Key configuration is managed through ConfigMaps and Secrets:

#### **ConfigMaps**
- `rbi-compliance-config`: Application settings
- `nginx-config`: NGINX configuration
- `postgres-config`: PostgreSQL settings
- `redis-config`: Redis configuration

#### **Secrets**
- `rbi-compliance-secrets`: Application secrets
- `postgres-secret`: Database credentials
- `redis-secret`: Cache credentials
- `tls-secret`: SSL certificates

### Customization

#### **Resource Limits**
Adjust resource requests and limits in deployment files:

```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "250m"
  limits:
    memory: "1Gi"
    cpu: "500m"
```

#### **Scaling Configuration**
Modify HPA settings for auto-scaling:

```yaml
spec:
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

#### **Storage Configuration**
Update storage class and sizes:

```yaml
spec:
  storageClassName: fast-ssd
  resources:
    requests:
      storage: 100Gi
```

## 🔐 Security

### Network Policies

Network policies are configured to:
- Isolate namespaces
- Restrict pod-to-pod communication
- Allow only necessary traffic flows
- Block unauthorized external access

### RBAC Configuration

Role-based access control includes:
- **Service Accounts**: For application pods
- **Roles**: Namespace-scoped permissions
- **ClusterRoles**: Cluster-wide permissions
- **Bindings**: Associate roles with accounts

### Pod Security

Security measures implemented:
- **Non-root containers**: All containers run as non-root
- **Read-only filesystems**: Where possible
- **Security contexts**: Restricted capabilities
- **Pod security policies**: Enforce security standards

## 📊 Monitoring

### Prometheus Configuration

Monitoring stack includes:
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization and dashboards
- **AlertManager**: Alert routing and notification
- **Node Exporter**: System metrics
- **Application Metrics**: Custom application metrics

### Key Metrics

Monitored metrics include:
- **System**: CPU, memory, disk, network
- **Application**: Response times, error rates, throughput
- **Database**: Connection pools, query performance
- **Business**: Compliance scores, task completion rates

### Alerting Rules

Configured alerts for:
- High resource usage (CPU > 80%, Memory > 85%)
- Service downtime
- Database connectivity issues
- High error rates (> 5%)
- API latency (> 1 second)

## 🔄 Operations

### Deployment Commands

```bash
# Deploy to production
./deploy.sh deploy

# Verify deployment
./deploy.sh verify

# Clean up resources
./deploy.sh cleanup

# Check pod status
kubectl get pods -n rbi-compliance

# View logs
kubectl logs -f deployment/integration-gateway -n rbi-compliance

# Scale deployment
kubectl scale deployment integration-gateway --replicas=5 -n rbi-compliance
```

### Health Checks

```bash
# Check application health
kubectl get pods -n rbi-compliance
kubectl get services -n rbi-compliance
kubectl get ingress -n rbi-compliance

# Test connectivity
kubectl exec -it deployment/integration-gateway -n rbi-compliance -- curl http://localhost:3000/health

# Database connectivity
kubectl exec -it deployment/postgres -n rbi-compliance -- psql -U rbi_user -d rbi_compliance -c "SELECT 1;"
```

### Backup and Recovery

```bash
# Database backup (automated via CronJob)
kubectl get cronjob -n rbi-compliance

# Manual backup
kubectl exec -it deployment/postgres -n rbi-compliance -- pg_dump -U rbi_user rbi_compliance > backup.sql

# Restore from backup
kubectl exec -i deployment/postgres -n rbi-compliance -- psql -U rbi_user -d rbi_compliance < backup.sql
```

## 🚨 Troubleshooting

### Common Issues

#### **Pods Not Starting**
```bash
# Check pod status and events
kubectl describe pod <pod-name> -n rbi-compliance

# Check logs
kubectl logs <pod-name> -n rbi-compliance

# Check resource constraints
kubectl top pods -n rbi-compliance
```

#### **Service Connectivity Issues**
```bash
# Test service connectivity
kubectl exec -it <pod-name> -n rbi-compliance -- nslookup <service-name>

# Check service endpoints
kubectl get endpoints -n rbi-compliance

# Test port connectivity
kubectl exec -it <pod-name> -n rbi-compliance -- telnet <service-name> <port>
```

#### **Ingress Issues**
```bash
# Check ingress status
kubectl describe ingress rbi-compliance-ingress -n rbi-compliance

# Check ingress controller logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller

# Test SSL certificates
kubectl describe certificate rbi-compliance-tls -n rbi-compliance
```

### Performance Issues

#### **High CPU/Memory Usage**
```bash
# Check resource usage
kubectl top pods -n rbi-compliance
kubectl top nodes

# Scale up if needed
kubectl scale deployment <deployment-name> --replicas=<new-count> -n rbi-compliance
```

#### **Database Performance**
```bash
# Check database metrics
kubectl exec -it deployment/postgres -n rbi-compliance -- psql -U rbi_user -d rbi_compliance -c "SELECT * FROM pg_stat_activity;"

# Check slow queries
kubectl logs deployment/postgres -n rbi-compliance | grep "slow query"
```

## 🔄 Updates and Maintenance

### Rolling Updates

```bash
# Update application image
kubectl set image deployment/integration-gateway integration-gateway=rbi-compliance/integration-gateway:1.1.0 -n rbi-compliance

# Check rollout status
kubectl rollout status deployment/integration-gateway -n rbi-compliance

# Rollback if needed
kubectl rollout undo deployment/integration-gateway -n rbi-compliance
```

### Configuration Updates

```bash
# Update ConfigMap
kubectl apply -f config/configmaps.yaml

# Restart deployments to pick up changes
kubectl rollout restart deployment/integration-gateway -n rbi-compliance
```

### Certificate Renewal

```bash
# Check certificate status
kubectl describe certificate rbi-compliance-tls -n rbi-compliance

# Force certificate renewal
kubectl delete certificate rbi-compliance-tls -n rbi-compliance
kubectl apply -f networking/ingress.yaml
```

## 📚 Additional Resources

### Documentation Links
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Prometheus Operator](https://prometheus-operator.dev/)
- [Cert-Manager](https://cert-manager.io/)

### Support
- **Technical Support**: devops@rbi-compliance.com
- **Emergency Support**: emergency@rbi-compliance.com
- **Documentation**: https://docs.rbi-compliance.com

---

**Note**: This configuration is designed for production use. Ensure you review and customize the settings according to your specific requirements and security policies before deployment.
