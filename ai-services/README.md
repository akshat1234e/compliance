# AI/ML Services

AI-powered regulatory intelligence and risk assessment services for the Enterprise RBI Compliance Management Platform.

## 🎯 Overview

The AI/ML Services provide comprehensive artificial intelligence capabilities for:

- **Natural Language Processing**: Advanced text analysis, entity recognition, and sentiment analysis
- **Regulatory Intelligence**: AI-powered regulatory document analysis and compliance checking
- **Risk Assessment**: Machine learning-based risk scoring and prediction
- **Document Processing**: Automated document analysis and classification
- **Predictive Analytics**: Time series forecasting and scenario analysis

## 🏗️ Architecture

### Core Components

1. **NLP Engine**: spaCy and Transformers-based natural language processing
2. **ML Models**: TensorFlow and PyTorch models for various AI tasks
3. **Document Processor**: Multi-format document analysis and text extraction
4. **Risk Analyzer**: Advanced risk assessment and prediction algorithms
5. **Regulatory Intelligence**: Specialized models for regulatory compliance analysis

### Key Features

- ✅ **Advanced NLP** with entity recognition and sentiment analysis
- ✅ **Document Processing** supporting PDF, Word, and text formats
- ✅ **Regulatory Analysis** with compliance checking and impact assessment
- ✅ **Risk Assessment** with ML-based scoring and prediction
- ✅ **Real-time Processing** with async API endpoints
- ✅ **Model Management** with hot-reloading and health monitoring
- ✅ **Scalable Architecture** with containerized deployment
- ✅ **Comprehensive Logging** and monitoring capabilities

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Docker and Docker Compose
- PostgreSQL 13+
- MongoDB 5+
- Redis 6+
- Elasticsearch 8+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ai-services

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment configuration
cp .env.example .env

# Configure your environment variables
nano .env

# Download required models
python -m spacy download en_core_web_sm

# Start services with Docker Compose
docker-compose up -d

# Run the application
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

### Development Setup

```bash
# Install development dependencies
pip install -e ".[dev]"

# Install pre-commit hooks
pre-commit install

# Run tests
pytest

# Run with hot reload
uvicorn src.main:app --reload

# Start Jupyter for development
docker-compose --profile dev up jupyter
```

## 📡 API Endpoints

### Health & Monitoring

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed component health
- `GET /health/ready` - Kubernetes readiness probe
- `GET /health/live` - Kubernetes liveness probe
- `GET /metrics` - System metrics

### Natural Language Processing

- `POST /api/v1/nlp/analyze` - Comprehensive text analysis
- `POST /api/v1/nlp/sentiment` - Sentiment analysis
- `POST /api/v1/nlp/entities` - Named entity recognition
- `POST /api/v1/nlp/similarity` - Text similarity calculation
- `POST /api/v1/nlp/batch` - Batch text processing

### Regulatory Intelligence

- `POST /api/v1/regulatory/analyze` - Regulatory document analysis
- `POST /api/v1/regulatory/compliance-check` - Compliance verification
- `POST /api/v1/regulatory/change-analysis` - Regulatory change analysis
- `GET /api/v1/regulatory/jurisdictions` - Supported jurisdictions

### Risk Assessment

- `POST /api/v1/risk/assess` - Comprehensive risk assessment
- `POST /api/v1/risk/predict` - Risk prediction and forecasting
- `POST /api/v1/risk/scenario-analysis` - Scenario analysis and stress testing
- `GET /api/v1/risk/risk-categories` - Available risk categories

### Document Processing

- `POST /api/v1/documents/analyze` - Document analysis
- `POST /api/v1/documents/classify` - Document classification
- `POST /api/v1/documents/upload` - Upload and analyze files
- `POST /api/v1/documents/extract-text` - Text extraction from files
- `GET /api/v1/documents/supported-formats` - Supported file formats

### Model Management

- `GET /api/v1/models` - List available models
- `GET /api/v1/models/{model_name}` - Get model information
- `POST /api/v1/models/reload` - Reload specific model
- `GET /api/v1/models/health/check` - Check model health
- `GET /api/v1/models/capabilities` - Get model capabilities

## 🤖 Machine Learning Models

### Pre-trained Models

#### spaCy NLP Model
- **Model**: `en_core_web_sm`
- **Capabilities**: Tokenization, POS tagging, NER, dependency parsing
- **Use Cases**: Entity extraction, text preprocessing, linguistic analysis

#### Sentence Transformers
- **Model**: `all-MiniLM-L6-v2`
- **Capabilities**: Text embeddings, semantic similarity
- **Use Cases**: Document similarity, clustering, search

#### HuggingFace Transformers
- **Sentiment Analysis**: `cardiffnlp/twitter-roberta-base-sentiment-latest`
- **Named Entity Recognition**: `dbmdz/bert-large-cased-finetuned-conll03-english`
- **Text Classification**: Custom fine-tuned models

### Custom Models

#### Risk Assessment Models
- **Type**: Ensemble models (XGBoost, LightGBM, Neural Networks)
- **Features**: Financial ratios, operational metrics, regulatory scores
- **Output**: Risk scores, probability distributions, confidence intervals

#### Regulatory Intelligence Models
- **Type**: Fine-tuned BERT models
- **Training Data**: Regulatory documents, compliance guidelines
- **Output**: Compliance scores, requirement extraction, impact assessment

## 🔧 Configuration

### Environment Variables

```bash
# Application
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=info
API_HOST=0.0.0.0
API_PORT=8000

# Security
SECRET_KEY=your-secret-key
JWT_SECRET=your-jwt-secret

# Databases
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=ai_services
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=ai_services

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=password

ELASTICSEARCH_HOST=localhost
ELASTICSEARCH_PORT=9200

# ML Models
MODEL_CACHE_DIR=./models/cache
HUGGINGFACE_CACHE_DIR=./models/huggingface
SPACY_MODEL=en_core_web_sm
SENTENCE_TRANSFORMER_MODEL=all-MiniLM-L6-v2

# Features
FEATURE_ADVANCED_NLP=true
FEATURE_DEEP_LEARNING=true
FEATURE_REAL_TIME_PROCESSING=true
```

## 📊 Performance & Monitoring

### Metrics

- **Request Metrics**: Request count, duration, error rates
- **Model Metrics**: Prediction accuracy, inference time, memory usage
- **System Metrics**: CPU usage, memory consumption, disk I/O
- **Cache Metrics**: Hit rates, miss rates, eviction rates

### Health Checks

- **Database Connectivity**: PostgreSQL, MongoDB, Redis, Elasticsearch
- **Model Status**: Model loading status, health checks
- **API Endpoints**: Response time, availability
- **Resource Usage**: Memory, CPU, disk space

### Logging

- **Structured Logging**: JSON format with correlation IDs
- **Log Levels**: DEBUG, INFO, WARNING, ERROR, CRITICAL
- **Log Rotation**: Daily rotation with compression
- **Centralized Logging**: Integration with ELK stack

## 🔐 Security

### Authentication & Authorization
- JWT-based API authentication
- Role-based access control
- API key authentication for service-to-service calls
- Rate limiting and request throttling

### Data Security
- Input validation and sanitization
- Secure model storage and loading
- Encrypted data transmission
- Privacy-preserving analytics

### Compliance
- GDPR compliance for data processing
- Audit logging for all operations
- Data retention policies
- Secure model deployment

## 🐳 Docker Deployment

### Production Deployment

```bash
# Build production image
docker build -t ai-services:latest .

# Run with production configuration
docker run -d \
  --name ai-services \
  -p 8000:8000 \
  -e ENVIRONMENT=production \
  -e POSTGRES_HOST=postgres \
  -e MONGODB_URI=mongodb://mongodb:27017 \
  -e REDIS_HOST=redis \
  -e ELASTICSEARCH_HOST=elasticsearch \
  ai-services:latest
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-services
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-services
  template:
    metadata:
      labels:
        app: ai-services
    spec:
      containers:
      - name: ai-services
        image: ai-services:latest
        ports:
        - containerPort: 8000
        env:
        - name: ENVIRONMENT
          value: "production"
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
```

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test categories
pytest -m "unit"
pytest -m "integration"
pytest -m "ml"
```

### Integration Tests

```bash
# Run integration tests
pytest -m "integration"

# Test specific endpoints
pytest tests/test_nlp_endpoints.py
pytest tests/test_risk_assessment.py
```

### Load Testing

```bash
# Install locust
pip install locust

# Run load tests
locust -f tests/load_tests.py --host=http://localhost:8000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development Guidelines

- Follow PEP 8 style guidelines
- Write comprehensive tests
- Document new features
- Use type hints
- Add logging for important operations

## 📄 License

This project is proprietary software. All rights reserved.

---

**AI/ML Services** - Intelligent regulatory compliance and risk assessment platform powered by advanced machine learning.
