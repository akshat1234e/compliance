# =============================================================================
# Regulatory Intelligence Service Dockerfile
# Enterprise RBI Compliance Management Platform
# =============================================================================

# Use Node.js 18 Alpine as base image
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# =============================================================================
# Dependencies stage
# =============================================================================
FROM base AS dependencies

# Copy package files
COPY package*.json ./
COPY ../../shared/types/package*.json ../../shared/types/
COPY ../../shared/utils/package*.json ../../shared/utils/
COPY ../../shared/constants/package*.json ../../shared/constants/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# =============================================================================
# Development dependencies stage
# =============================================================================
FROM base AS dev-dependencies

# Copy package files
COPY package*.json ./
COPY ../../shared/types/package*.json ../../shared/types/
COPY ../../shared/utils/package*.json ../../shared/utils/
COPY ../../shared/constants/package*.json ../../shared/constants/

# Install all dependencies (including dev)
RUN npm ci && npm cache clean --force

# =============================================================================
# Build stage
# =============================================================================
FROM dev-dependencies AS build

# Copy source code
COPY . .
COPY ../../shared/ ../../shared/

# Copy TypeScript configuration
COPY tsconfig*.json ./

# Build the application
RUN npm run build

# =============================================================================
# Production stage
# =============================================================================
FROM base AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy production dependencies
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --from=build --chown=nodejs:nodejs /app/package*.json ./

# Create logs directory
RUN mkdir -p logs && chown nodejs:nodejs logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/index.js"]

# =============================================================================
# Development stage
# =============================================================================
FROM dev-dependencies AS development

# Copy source code
COPY . .
COPY ../../shared/ ../../shared/

# Create logs directory
RUN mkdir -p logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Start in development mode
CMD ["npm", "run", "dev"]
