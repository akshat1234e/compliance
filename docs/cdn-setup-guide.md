# CDN Setup for Static Assets - Implementation Guide

This document provides comprehensive guidance on setting up and managing a high-performance Content Delivery Network (CDN) for the RBI Compliance Platform static assets.

## 📊 Overview

The CDN system provides:

- **AWS CloudFront**: Global edge locations for optimal performance
- **NGINX Caching Layer**: Kubernetes-based intelligent caching
- **Asset Optimization Pipeline**: Automated compression and optimization
- **Multi-tier Caching Strategy**: Optimized cache policies for different asset types
- **Real-time Monitoring**: Performance metrics and alerting
- **Automated Cache Management**: Warming, purging, and invalidation

## 🏗️ Architecture Components

### 1. AWS CloudFront Distribution

**Purpose**: Global content delivery with edge caching and SSL termination.

**Key Features**:
- Multiple origins (S3, API Gateway, Application)
- Intelligent cache behaviors by asset type
- Geographic restrictions and security
- Custom error pages and SSL/TLS
- WAF integration for security

**Cache Policies**:
```yaml
# JavaScript/CSS - Long cache with versioning
DefaultTTL: 2592000   # 30 days
MaxTTL: 31536000      # 1 year
QueryStrings: ['v', 'version', 'hash']

# Images - Medium cache
DefaultTTL: 604800    # 7 days
MaxTTL: 31536000      # 1 year
QueryStrings: ['w', 'h', 'q', 'format']

# Fonts - Very long cache
DefaultTTL: 31536000  # 1 year
MaxTTL: 31536000      # 1 year

# Documents - Short cache with authentication
DefaultTTL: 300       # 5 minutes
MaxTTL: 3600          # 1 hour
RequiresAuth: true
```

### 2. NGINX Caching Layer

**Purpose**: Kubernetes-based intelligent caching with advanced features.

**Key Features**:
- Multiple cache zones for different content types
- Compression (Gzip and Brotli)
- Rate limiting and security headers
- Cache purging and statistics
- Health checks and monitoring

**Cache Zones**:
```yaml
# Static assets cache
static_cache:
  size: 100MB
  max_size: 10GB
  inactive: 7d

# Images cache
images_cache:
  size: 50MB
  max_size: 5GB
  inactive: 30d

# API cache
api_cache:
  size: 10MB
  max_size: 1GB
  inactive: 1h
```

### 3. Asset Optimization Pipeline

**Purpose**: Automated optimization and deployment of static assets.

**Optimization Steps**:
1. **JavaScript Minification**: Terser with compression and mangling
2. **CSS Optimization**: CleanCSS with minification
3. **Image Optimization**: ImageMin with format conversion
4. **Compression**: Gzip and Brotli pre-compression
5. **Responsive Images**: Multiple size variants
6. **Modern Formats**: WebP and AVIF generation

**Pipeline Stages**:
```yaml
Source → Build → Optimize → Deploy → Invalidate
  ↓        ↓        ↓         ↓         ↓
GitHub   CodeBuild  Asset    S3      CloudFront
         Project   Processing Upload  Invalidation
```

## 🚀 Asset Optimization Strategies

### JavaScript Optimization

```bash
# Minification and compression
terser input.js --compress --mangle --output output.min.js
brotli -k output.min.js
gzip -k output.min.js

# Cache headers
Cache-Control: public, max-age=31536000, immutable
Content-Encoding: br, gzip
```

### CSS Optimization

```bash
# Minification and optimization
cleancss -o output.min.css input.css
brotli -k output.min.css
gzip -k output.min.css

# Cache headers
Cache-Control: public, max-age=31536000, immutable
Content-Encoding: br, gzip
```

### Image Optimization

```bash
# Format optimization
imagemin input.png --out-dir=output/
cwebp input.jpg -o output.webp -q 85
avifenc input.jpg output.avif --quality 85

# Responsive variants
convert input.jpg -resize 320x240 output-small.jpg
convert input.jpg -resize 768x576 output-medium.jpg
convert input.jpg -resize 1200x900 output-large.jpg
convert input.jpg -resize 1920x1440 output-xlarge.jpg

# Cache headers
Cache-Control: public, max-age=2592000
Vary: Accept
```

### Font Optimization

```bash
# Font subsetting and compression
pyftsubset font.ttf --output-file=font-subset.woff2 --flavor=woff2

# Cache headers
Cache-Control: public, max-age=31536000, immutable
Access-Control-Allow-Origin: *
```

## 📈 Performance Optimization

### Cache Hit Ratio Targets

| Asset Type | Target Hit Ratio | Cache Duration | Reasoning |
|------------|------------------|----------------|-----------|
| JavaScript | >95% | 1 year | Versioned, immutable |
| CSS | >95% | 1 year | Versioned, immutable |
| Images | >85% | 30 days | Moderate changes |
| Fonts | >98% | 1 year | Rarely change |
| Documents | >70% | 5 minutes | Dynamic, authenticated |
| API Responses | >60% | 1 hour | Reference data only |

### Response Time Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Cache Hit | <50ms | 95th percentile |
| Cache Miss | <500ms | 95th percentile |
| First Byte | <200ms | Global average |
| Full Load | <2s | Complete page |

### Bandwidth Optimization

```yaml
# Compression ratios achieved
JavaScript: 70-80% reduction
CSS: 60-70% reduction
Images: 40-60% reduction (WebP/AVIF)
Fonts: 30-50% reduction (WOFF2)

# Total bandwidth savings: 60-70%
```

## 🛠️ Implementation Guide

### 1. Deploy CDN Infrastructure

```bash
# Deploy complete CDN infrastructure
./scripts/cdn-manager.sh deploy --environment production --domain rbi-compliance.com

# Deploy with custom settings
./scripts/cdn-manager.sh deploy \
  --environment production \
  --domain rbi-compliance.com \
  --bucket rbi-compliance-static-assets
```

### 2. Configure CDN Settings

```bash
# Configure cache settings
./scripts/cdn-manager.sh configure --cache-max-age 31536000 --enable-compression true

# Update NGINX configuration
kubectl apply -f k8s/cdn/nginx-cdn-cache.yaml
```

### 3. Optimize and Deploy Assets

```bash
# Optimize all asset types
./scripts/cdn-manager.sh optimize --assets js,css,images,fonts

# Optimize specific assets
./scripts/cdn-manager.sh optimize --assets js,css
```

### 4. Cache Management

```bash
# Purge specific assets
./scripts/cdn-manager.sh purge --assets "/js/*,/css/*"

# Purge all cache
./scripts/cdn-manager.sh purge --assets "/*"

# Warm critical assets
./scripts/cdn-manager.sh warm --critical-assets-only

# Warm all assets
./scripts/cdn-manager.sh warm
```

### 5. Performance Testing

```bash
# Run performance tests
./scripts/cdn-manager.sh test --duration 300

# Monitor performance
./scripts/cdn-manager.sh monitor
```

## 📊 Monitoring and Alerting

### Key Metrics

#### Cache Performance
```promql
# Cache hit ratio
cdn:cache_hit_ratio = 
  sum(rate(nginx_http_requests_total{cache_status="HIT"}[5m])) /
  sum(rate(nginx_http_requests_total[5m])) * 100

# Response time percentiles
cdn:response_time_p95 = 
  histogram_quantile(0.95, 
    sum(rate(nginx_http_request_duration_seconds_bucket[5m])) by (le)
  )

# Error rate
cdn:error_rate = 
  sum(rate(nginx_http_requests_total{status=~"5.."}[5m])) /
  sum(rate(nginx_http_requests_total[5m])) * 100

# Bandwidth usage
cdn:bandwidth_usage = 
  sum(rate(nginx_http_response_size_bytes[5m])) * 8
```

#### CloudFront Metrics
```promql
# CloudFront request rate
sum(rate(cloudfront_requests_total[5m])) by (cache_status)

# CloudFront error rate
sum(rate(cloudfront_requests_total{status=~"4..|5.."}[5m])) /
sum(rate(cloudfront_requests_total[5m])) * 100

# Origin latency
cloudfront_origin_latency_seconds
```

### Critical Alerts

#### High Priority
```yaml
# Low cache hit ratio
- alert: CDNLowCacheHitRatio
  expr: cdn:cache_hit_ratio < 70
  for: 5m
  severity: warning

# High response time
- alert: CDNHighResponseTime
  expr: cdn:response_time_p95 > 1
  for: 3m
  severity: warning

# High error rate
- alert: CDNHighErrorRate
  expr: cdn:error_rate > 5
  for: 2m
  severity: critical

# Cache storage full
- alert: CDNCacheStorageFull
  expr: (nginx_cache_size_bytes / nginx_cache_max_size_bytes) * 100 > 90
  for: 5m
  severity: warning
```

### Performance Dashboard

The Grafana dashboard includes:
- **Request Rate**: Real-time request volume by status
- **Cache Hit Ratio**: Cache efficiency metrics
- **Response Time Distribution**: Latency percentiles
- **Bandwidth Usage**: Data transfer rates
- **Error Rate Analysis**: Error breakdown by type
- **Geographic Distribution**: Global performance map
- **Asset Type Performance**: Performance by content type

## 🔧 Cache Strategies by Asset Type

### Static Assets (JS/CSS)
```yaml
Strategy: Aggressive caching with versioning
Cache-Control: public, max-age=31536000, immutable
Versioning: Query parameter (?v=hash)
Compression: Brotli + Gzip
Optimization: Minification, tree-shaking
```

### Images
```yaml
Strategy: Medium-term caching with format optimization
Cache-Control: public, max-age=2592000
Formats: WebP, AVIF fallbacks
Responsive: Multiple size variants
Optimization: Lossless compression
```

### Fonts
```yaml
Strategy: Very long caching with CORS
Cache-Control: public, max-age=31536000, immutable
CORS: Access-Control-Allow-Origin: *
Formats: WOFF2 preferred
Optimization: Subsetting, compression
```

### Documents
```yaml
Strategy: Short caching with authentication
Cache-Control: private, max-age=300
Authentication: Required for access
Security: Signed URLs for sensitive content
Optimization: PDF compression
```

### API Responses
```yaml
Strategy: Selective caching for reference data
Cache-Control: public, max-age=3600
Scope: /api/reference, /api/config, /api/metadata
Bypass: POST, PUT, DELETE, authenticated requests
Optimization: JSON compression
```

## 🔒 Security Features

### SSL/TLS Configuration
```yaml
# CloudFront SSL settings
MinimumProtocolVersion: TLSv1.2_2021
SSLSupportMethod: sni-only
CipherSuite: Modern cipher suites only

# NGINX SSL settings
ssl_protocols: TLSv1.2 TLSv1.3
ssl_ciphers: ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256
```

### Security Headers
```yaml
# Comprehensive security headers
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
Referrer-Policy: strict-origin-when-cross-origin
```

### WAF Protection
```yaml
# AWS WAF rules
- AWSManagedRulesCommonRuleSet
- AWSManagedRulesKnownBadInputsRuleSet
- Custom rate limiting: 2000 req/min per IP
- Geographic restrictions: Configurable
```

## 📚 Best Practices

### 1. Asset Organization
- Use consistent versioning for cache busting
- Implement proper file naming conventions
- Organize assets by type and frequency of change
- Use CDN-friendly URLs without query parameters when possible

### 2. Cache Optimization
- Set appropriate cache headers for each asset type
- Use immutable cache for versioned assets
- Implement cache warming for critical assets
- Monitor cache hit ratios and optimize accordingly

### 3. Performance Monitoring
- Set up comprehensive monitoring and alerting
- Regular performance testing and optimization
- Monitor global performance from different regions
- Track user experience metrics

### 4. Security
- Always use HTTPS for all CDN traffic
- Implement proper CORS policies
- Use signed URLs for sensitive content
- Regular security audits and updates

---

This CDN setup ensures the RBI Compliance Platform delivers optimal performance for static assets while maintaining security and compliance requirements for financial services.
