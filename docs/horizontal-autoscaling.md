# Horizontal Auto-Scaling Configuration Guide

This document provides comprehensive guidance on horizontal auto-scaling configuration for the RBI Compliance Platform, including HPA, VPA, Cluster Autoscaler, and KEDA implementations.

## 📊 Overview

The horizontal auto-scaling system provides:

- **Horizontal Pod Autoscaler (HPA)**: Scales pods based on CPU, memory, and custom metrics
- **Vertical Pod Autoscaler (VPA)**: Optimizes resource requests and limits
- **Cluster Autoscaler**: Automatically scales Kubernetes nodes
- **KEDA**: Event-driven autoscaling based on external metrics
- **Comprehensive Monitoring**: Real-time scaling metrics and alerts

## 🏗️ Architecture Components

### 1. Horizontal Pod Autoscaler (HPA)

**Purpose**: Automatically scales the number of pods based on observed metrics.

**Key Features**:
- Multi-metric scaling (CPU, memory, custom metrics)
- Configurable scaling behavior
- Stabilization windows to prevent flapping
- Support for external metrics

**Configuration Example**:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: auth-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: auth-service
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "100"
```

### 2. Vertical Pod Autoscaler (VPA)

**Purpose**: Automatically adjusts CPU and memory requests/limits for containers.

**Key Features**:
- Automatic resource optimization
- Historical usage analysis
- Multiple update modes (Off, Initial, Auto)
- Resource policy controls

**Configuration Example**:
```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: auth-service-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: auth-service
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: auth-service
      minAllowed:
        cpu: 100m
        memory: 128Mi
      maxAllowed:
        cpu: 2000m
        memory: 4Gi
```

### 3. Cluster Autoscaler

**Purpose**: Automatically scales the number of nodes in the cluster.

**Key Features**:
- Node group auto-discovery
- Multiple scaling strategies
- Resource-aware scaling
- Integration with cloud providers

**Configuration Example**:
```yaml
command:
- ./cluster-autoscaler
- --cloud-provider=aws
- --node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled
- --scale-down-enabled=true
- --scale-down-delay-after-add=10m
- --scale-down-unneeded-time=10m
- --scale-down-utilization-threshold=0.5
- --max-nodes-total=100
```

### 4. KEDA (Kubernetes Event-driven Autoscaling)

**Purpose**: Scales applications based on external events and metrics.

**Key Features**:
- 50+ built-in scalers
- Scale-to-zero capability
- External metrics integration
- Event-driven scaling

**Configuration Example**:
```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: auth-service-redis-scaler
spec:
  scaleTargetRef:
    name: auth-service
  minReplicaCount: 3
  maxReplicaCount: 20
  triggers:
  - type: redis
    metadata:
      address: redis:6379
      listName: auth_requests_queue
      listLength: "10"
```

## 🚀 Service-Specific Scaling Configurations

### Authentication Service

**Scaling Strategy**: High availability with fast scale-up for authentication spikes

```yaml
# HPA Configuration
minReplicas: 3
maxReplicas: 20
targetCPU: 70%
targetMemory: 80%
scaleUpPolicy: 100% in 30s
scaleDownPolicy: 50% in 60s

# Custom Metrics
- http_requests_per_second: 100 req/s
- http_request_duration: 200ms
- redis_queue_depth: 50 items
```

**Scaling Behavior**:
- **Scale Up**: Aggressive (100% increase every 30s)
- **Scale Down**: Conservative (50% decrease every 60s)
- **Stabilization**: 5 minutes down, 1 minute up

### Compliance Service

**Scaling Strategy**: Moderate scaling optimized for compliance workload patterns

```yaml
# HPA Configuration
minReplicas: 2
maxReplicas: 15
targetCPU: 60%
targetMemory: 75%
scaleUpPolicy: 50% in 60s
scaleDownPolicy: 25% in 120s

# Custom Metrics
- compliance_tasks_pending: 20 tasks
- document_processing_queue: 10 documents
```

**Scaling Behavior**:
- **Scale Up**: Moderate (50% increase every 60s)
- **Scale Down**: Very conservative (25% decrease every 120s)
- **Stabilization**: 10 minutes down, 2 minutes up

### Integration Gateway

**Scaling Strategy**: Rapid scaling for integration spikes with high maximum

```yaml
# HPA Configuration
minReplicas: 3
maxReplicas: 25
targetCPU: 75%
targetMemory: 80%
scaleUpPolicy: 200% in 30s
scaleDownPolicy: 30% in 60s

# Custom Metrics
- banking_api_requests_per_second: 50 req/s
- integration_queue_depth: 100 items
```

**Scaling Behavior**:
- **Scale Up**: Very aggressive (200% increase every 30s)
- **Scale Down**: Moderate (30% decrease every 60s)
- **Stabilization**: 3 minutes down, 30 seconds up

### API Gateway

**Scaling Strategy**: Maximum scaling capacity for frontend traffic

```yaml
# HPA Configuration
minReplicas: 3
maxReplicas: 30
targetCPU: 70%
targetMemory: 75%
scaleUpPolicy: 300% in 15s
scaleDownPolicy: 50% in 60s

# Custom Metrics
- gateway_requests_per_second: 200 req/s
- gateway_active_connections: 500 connections
- gateway_response_time_p95: 100ms
```

**Scaling Behavior**:
- **Scale Up**: Extremely aggressive (300% increase every 15s)
- **Scale Down**: Moderate (50% decrease every 60s)
- **Stabilization**: 5 minutes down, 30 seconds up

## 📈 Scaling Metrics and Thresholds

### Resource Metrics

| Service | CPU Target | Memory Target | Min Replicas | Max Replicas |
|---------|------------|---------------|--------------|--------------|
| Auth Service | 70% | 80% | 3 | 20 |
| Compliance Service | 60% | 75% | 2 | 15 |
| Integration Gateway | 75% | 80% | 3 | 25 |
| API Gateway | 70% | 75% | 3 | 30 |
| Document Processor | 80% | 85% | 0 | 10 |

### Custom Metrics

| Metric | Service | Threshold | Scaler Type |
|--------|---------|-----------|-------------|
| http_requests_per_second | Auth Service | 100 req/s | HPA |
| compliance_tasks_pending | Compliance Service | 20 tasks | HPA |
| banking_api_requests_per_second | Integration Gateway | 50 req/s | HPA |
| redis_queue_depth | Auth Service | 50 items | KEDA |
| kafka_consumer_lag | Compliance Service | 20 messages | KEDA |
| sqs_queue_length | Document Processor | 5 messages | KEDA |

### External Metrics

| Metric | Source | Threshold | Action |
|--------|--------|-----------|--------|
| Banking API Rate Limit | External API | 80% | Scale Integration Gateway |
| Database Connection Pool | PostgreSQL | 80% | Scale Database Pods |
| Redis Memory Usage | Redis | 85% | Scale Redis Cluster |
| S3 Upload Queue | AWS SQS | 10 messages | Scale Document Processor |

## 🛠️ Implementation Guide

### 1. Installing Autoscaling Components

```bash
# Install all autoscaling components
./scripts/autoscaling-manager.sh install

# Install specific components
kubectl apply -f k8s/autoscaling/hpa-auth-service.yaml
kubectl apply -f k8s/autoscaling/vpa-configurations.yaml
kubectl apply -f k8s/autoscaling/cluster-autoscaler.yaml
kubectl apply -f k8s/autoscaling/keda-scalers.yaml
```

### 2. Configuring Service Autoscaling

```bash
# Configure autoscaling for all services
./scripts/autoscaling-manager.sh configure all

# Configure specific service
./scripts/autoscaling-manager.sh configure auth-service

# Manual scaling
./scripts/autoscaling-manager.sh scale auth-service 10
```

### 3. Monitoring Autoscaling

```bash
# Check autoscaling status
./scripts/autoscaling-manager.sh status

# Detailed status with metrics
./scripts/autoscaling-manager.sh status --all

# Open monitoring dashboard
./scripts/autoscaling-manager.sh monitor
```

### 4. Testing Autoscaling

```bash
# Run basic autoscaling tests
./scripts/autoscaling-manager.sh test basic

# Run load tests
./scripts/autoscaling-manager.sh test load

# Run comprehensive tests
./scripts/autoscaling-manager.sh test all
```

## 📊 Monitoring and Alerting

### Key Metrics to Monitor

#### HPA Metrics
```promql
# Current vs desired replicas
kube_horizontalpodautoscaler_status_current_replicas
kube_horizontalpodautoscaler_status_desired_replicas

# CPU and memory utilization
kube_horizontalpodautoscaler_status_current_metrics_average_utilization

# Scaling events
increase(kube_horizontalpodautoscaler_status_last_scale_time[5m])
```

#### VPA Metrics
```promql
# Resource recommendations
vpa_recommendation_cpu_cores
vpa_recommendation_memory_bytes

# Recommendation updates
vpa_last_recommendation_time
```

#### Cluster Autoscaler Metrics
```promql
# Node count and utilization
cluster_autoscaler_nodes_count
cluster_autoscaler_unschedulable_pods_count

# Scaling events
cluster_autoscaler_scaled_up_nodes_total
cluster_autoscaler_scaled_down_nodes_total
```

#### KEDA Metrics
```promql
# ScaledObject status
keda_scaled_object_current_replicas
keda_scaled_object_max_replicas

# Scaler errors
keda_scaler_errors_total
```

### Critical Alerts

#### High Priority Alerts
```yaml
# HPA at maximum replicas
- alert: HPAMaxReplicasReached
  expr: kube_horizontalpodautoscaler_status_current_replicas >= kube_horizontalpodautoscaler_spec_max_replicas
  for: 5m
  severity: critical

# Cluster at maximum nodes
- alert: ClusterMaxNodesReached
  expr: cluster_autoscaler_nodes_count >= cluster_autoscaler_max_nodes_count * 0.95
  for: 5m
  severity: critical

# High unschedulable pods
- alert: UnschedulablePodsHigh
  expr: cluster_autoscaler_unschedulable_pods_count > 10
  for: 5m
  severity: critical
```

#### Warning Alerts
```yaml
# High resource utilization
- alert: HPAHighCPUUtilization
  expr: kube_horizontalpodautoscaler_status_current_metrics_average_utilization{metric_name="cpu"} > 85
  for: 10m
  severity: warning

# Frequent scaling
- alert: HPAFrequentScaling
  expr: increase(kube_horizontalpodautoscaler_status_last_scale_time[30m]) > 5
  for: 5m
  severity: warning
```

## 🔧 Troubleshooting

### Common Issues

#### 1. HPA Not Scaling
**Symptoms**: Pods not scaling despite high resource usage
**Solutions**:
- Check metrics server is running
- Verify resource requests are set
- Check HPA conditions and events
- Validate custom metrics availability

#### 2. VPA Not Updating Resources
**Symptoms**: Resource recommendations not applied
**Solutions**:
- Check VPA admission controller
- Verify update policy settings
- Check resource policy constraints
- Review VPA events and logs

#### 3. Cluster Autoscaler Not Adding Nodes
**Symptoms**: Pods remain unschedulable
**Solutions**:
- Check node group configuration
- Verify IAM permissions
- Check resource quotas
- Review autoscaler logs

#### 4. KEDA Scaling Issues
**Symptoms**: External metrics not triggering scaling
**Solutions**:
- Verify scaler configuration
- Check authentication credentials
- Test external metric connectivity
- Review KEDA operator logs

### Debugging Commands

```bash
# Check HPA status
kubectl describe hpa <hpa-name> -n rbi-compliance

# Check VPA recommendations
kubectl describe vpa <vpa-name> -n rbi-compliance

# Check cluster autoscaler logs
kubectl logs -n kube-system deployment/cluster-autoscaler

# Check KEDA scaler status
kubectl describe scaledobject <scaledobject-name> -n rbi-compliance

# Check metrics availability
kubectl top pods -n rbi-compliance
kubectl top nodes

# Check scaling events
kubectl get events -n rbi-compliance --field-selector reason=SuccessfulRescale
```

## 📚 Best Practices

### 1. Resource Configuration
- Always set resource requests and limits
- Use VPA recommendations for optimal sizing
- Monitor resource utilization trends
- Implement resource quotas

### 2. Scaling Policies
- Configure appropriate stabilization windows
- Use conservative scale-down policies
- Implement PodDisruptionBudgets
- Test scaling behavior under load

### 3. Monitoring and Alerting
- Monitor all scaling components
- Set up comprehensive alerting
- Regular performance reviews
- Capacity planning based on trends

### 4. Testing and Validation
- Regular autoscaling tests
- Load testing for scaling validation
- Chaos engineering for resilience
- Performance benchmarking

---

This horizontal auto-scaling system ensures the RBI Compliance Platform can automatically adapt to varying workloads while maintaining optimal performance and cost efficiency.
