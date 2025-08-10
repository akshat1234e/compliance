# Document Management Service

Intelligent document processing and storage service for compliance management in the Enterprise RBI Compliance Management Platform.

## 🎯 Overview

The Document Management Service provides comprehensive document lifecycle management with:

- **Intelligent Processing**: OCR, text extraction, and metadata analysis
- **Multi-Format Support**: PDF, Word, Excel, PowerPoint, images, and text files
- **Cloud Storage**: Support for AWS S3, Azure Blob, Google Cloud, and local storage
- **Advanced Search**: Full-text search with Elasticsearch integration
- **Document Classification**: Automatic categorization using AI and rules
- **Version Control**: Complete document versioning and audit trails
- **Security**: Encryption, access controls, and compliance features

## 🏗️ Architecture

### Core Components

1. **Document Processor**: OCR, text extraction, and metadata analysis
2. **Storage Manager**: Multi-cloud storage abstraction layer
3. **OCR Service**: Optical character recognition for images and scanned documents
4. **Classification Service**: Automatic document categorization
5. **Search Engine**: Elasticsearch-powered full-text search
6. **Version Manager**: Document versioning and change tracking

### Key Features

- ✅ **Multi-Format Processing** with OCR and text extraction
- ✅ **Cloud Storage Support** (AWS, Azure, GCP, MinIO, Local)
- ✅ **Advanced Search** with Elasticsearch integration
- ✅ **Document Classification** with AI and rule-based categorization
- ✅ **Version Control** with complete audit trails
- ✅ **Thumbnail Generation** for visual document previews
- ✅ **Security Features** including encryption and access controls
- ✅ **Compliance Tools** for regulatory document management

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 13+
- MongoDB 5+
- Redis 6+
- Elasticsearch 8+
- Tesseract OCR (for text extraction)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd services/document-management

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Configure your environment variables
nano .env

# Build the application
npm run build

# Start the service
npm start
```

### Development

```bash
# Start in development mode with hot reload
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format
```

## 📡 API Endpoints

### Documents

- `GET /api/v1/documents` - List documents with filtering
- `GET /api/v1/documents/:id` - Get document details
- `PUT /api/v1/documents/:id` - Update document
- `DELETE /api/v1/documents/:id` - Delete document
- `GET /api/v1/documents/:id/download` - Download document
- `GET /api/v1/documents/:id/preview` - Preview document

### Upload & Processing

- `POST /api/v1/upload` - Upload documents
- `GET /api/v1/upload/status/:processingId` - Get processing status
- `POST /api/v1/upload/bulk` - Bulk upload documents
- `POST /api/v1/upload/url` - Upload from URL

### Search

- `GET /api/v1/search` - Search documents
- `POST /api/v1/search/advanced` - Advanced search with filters
- `GET /api/v1/search/suggestions` - Get search suggestions
- `GET /api/v1/search/facets` - Get search facets

### Templates

- `GET /api/v1/templates` - List document templates
- `POST /api/v1/templates` - Create template
- `GET /api/v1/templates/:id` - Get template details
- `PUT /api/v1/templates/:id` - Update template

### Analytics

- `GET /api/v1/analytics/overview` - Get analytics overview
- `GET /api/v1/analytics/usage` - Get usage statistics
- `GET /api/v1/analytics/processing` - Get processing metrics

### Health & Monitoring

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health with dependencies

## 🔧 Configuration

### Environment Variables

Key configuration options:

```bash
# Application
NODE_ENV=development
PORT=3004

# Storage
STORAGE_PROVIDER=local
LOCAL_UPLOAD_PATH=./uploads
MAX_FILE_SIZE=104857600

# Processing
ENABLE_OCR=true
ENABLE_CLASSIFICATION=true
ENABLE_THUMBNAILS=true
SUPPORTED_FORMATS=pdf,doc,docx,xls,xlsx,jpg,png

# OCR
OCR_ENGINE=tesseract
OCR_LANGUAGES=eng
OCR_CONFIDENCE=0.7

# Database
POSTGRES_HOST=localhost
MONGODB_URI=mongodb://localhost:27017
REDIS_HOST=localhost
ELASTICSEARCH_NODE=http://localhost:9200
```

## 📄 Supported File Formats

### Documents
- **PDF**: Full text extraction and OCR for scanned PDFs
- **Microsoft Word**: .doc, .docx with metadata extraction
- **Microsoft Excel**: .xls, .xlsx with sheet processing
- **Microsoft PowerPoint**: .ppt, .pptx with slide content
- **Text Files**: .txt, .csv with encoding detection

### Images
- **JPEG/JPG**: OCR text extraction
- **PNG**: OCR text extraction
- **TIFF**: Multi-page OCR processing
- **BMP**: Basic OCR support

## 🔍 Document Processing Pipeline

1. **Upload**: File validation and virus scanning
2. **Storage**: Secure storage with encryption
3. **Processing**: Text extraction, OCR, metadata analysis
4. **Classification**: Automatic categorization
5. **Indexing**: Full-text search indexing
6. **Thumbnails**: Visual preview generation
7. **Completion**: Processing status updates

## 🏷️ Document Classification

### Automatic Categories

- **Regulatory Circular**: RBI circulars and regulatory documents
- **Compliance Report**: Compliance status and audit reports
- **Audit Document**: Internal and external audit materials
- **Policy Document**: Organizational policies and procedures
- **Training Material**: Educational and training content
- **Legal Document**: Contracts, agreements, legal notices
- **Financial Statement**: Financial reports and statements

### Classification Rules

- Pattern-based classification using regex
- Content analysis for document type detection
- Metadata-based categorization
- AI-powered classification (optional)

## 🔐 Security Features

### Access Control
- Role-based permissions (read, write, delete, admin)
- Organization-based data isolation
- Document-level access controls
- Audit logging for all operations

### Data Protection
- AES-256 encryption for stored documents
- Secure file upload with validation
- Virus scanning integration
- Data retention policies

## 📊 Monitoring & Analytics

### Metrics Tracked
- Document upload and processing statistics
- Storage usage and growth trends
- Processing performance and success rates
- User activity and access patterns
- Search query analytics

### Health Monitoring
- Service health checks
- Database connectivity
- Storage provider status
- Processing queue status
- System resource usage

## 🐳 Docker Deployment

### Build Image

```bash
# Build Docker image
docker build -t document-management:latest .

# Run container
docker run -p 3004:3004 \
  -e NODE_ENV=production \
  -e POSTGRES_HOST=postgres \
  -e MONGODB_URI=mongodb://mongodb:27017 \
  -e REDIS_HOST=redis \
  -e ELASTICSEARCH_NODE=http://elasticsearch:9200 \
  document-management:latest
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

---

**Document Management Service** - Intelligent document processing for enterprise compliance management.
