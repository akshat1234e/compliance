# Multi-stage build for Document Management Service
FROM node:18-alpine AS builder

# Install system dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install system dependencies and Tesseract OCR
RUN apk add --no-cache \
    dumb-init \
    cairo \
    jpeg \
    pango \
    musl \
    giflib \
    pixman \
    pangomm \
    libjpeg-turbo \
    freetype \
    tesseract-ocr \
    tesseract-ocr-data-eng \
    poppler-utils \
    imagemagick

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S documents -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create necessary directories
RUN mkdir -p logs uploads temp thumbnails quarantine && \
    chown -R documents:nodejs /app

# Switch to non-root user
USER documents

# Expose port
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3004/health', (res) => { \
        process.exit(res.statusCode === 200 ? 0 : 1) \
    }).on('error', () => process.exit(1))"

# Start the application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]

# Labels for metadata
LABEL maintainer="Compliance Platform Team"
LABEL service="document-management"
LABEL version="1.0.0"
LABEL description="Intelligent document processing and storage service"
