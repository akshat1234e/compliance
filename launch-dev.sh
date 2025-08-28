#!/bin/bash

# =============================================================================
# RBI Compliance Platform - Development Launch Script
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                    RBI COMPLIANCE MANAGEMENT PLATFORM                       ║"
echo "║                           Development Launch                                 ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if Node.js is installed
if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ and try again.${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18+ is required. Current version: $(node --version)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node --version) detected${NC}"

# Check if npm is installed
if ! command -v npm >/dev/null 2>&1; then
    echo -e "${RED}❌ npm is not installed. Please install npm and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm $(npm --version) detected${NC}"

# Sync environment files
echo -e "${PURPLE}🔄 Synchronizing environment configuration...${NC}"
if [ ! -f ".env.development" ]; then
    echo -e "${YELLOW}⚠️  Development environment file not found. Creating from example...${NC}"
    cp .env.example .env.development
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    npm install
fi

# Install frontend dependencies
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
    cd frontend && npm install && cd ..
fi

# Create a simple development environment file
if [ ! -f ".env.development" ]; then
    echo -e "${YELLOW}⚠️  Development environment file not found. Creating default configuration...${NC}"

    cat > .env.development << EOF
# RBI Compliance Platform - Development Environment
NODE_ENV=development
APP_NAME=RBI Compliance Platform
APP_VERSION=1.0.0

# Frontend Configuration
NEXT_PUBLIC_APP_NAME=RBI Compliance Platform
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ENVIRONMENT=development

# Development Database URLs (using SQLite for simplicity)
DATABASE_URL=sqlite:./dev.db
MONGODB_URI=mongodb://localhost:27017/rbi_compliance_dev
REDIS_URL=redis://localhost:6379

# Development Security (not for production!)
JWT_SECRET=development_jwt_secret_key_not_for_production
SESSION_SECRET=development_session_secret_not_for_production
ENCRYPTION_KEY=dev_encryption_key_32_chars_long

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_ML_PREDICTIONS=false
ENABLE_REAL_TIME_MONITORING=true
DEBUG=true
EOF

    echo -e "${GREEN}✅ Development environment configuration created${NC}"
fi

# Create a simple package.json for the frontend if it doesn't exist
if [ ! -f "frontend/package.json" ]; then
    echo -e "${BLUE}📝 Creating frontend package.json...${NC}"

    cat > frontend/package.json << EOF
{
  "name": "rbi-compliance-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "@types/node": "20.0.0",
    "@types/react": "18.2.0",
    "@types/react-dom": "18.2.0",
    "typescript": "5.0.0"
  }
}
EOF
fi

# Start the development server
echo -e "${BLUE}🚀 Starting development server...${NC}"

# Check if we can start the frontend
if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
    echo -e "${BLUE}🌐 Starting frontend development server...${NC}"

    # Start frontend in background
    cd frontend

    # Create a simple Next.js app structure if it doesn't exist
    if [ ! -f "next.config.js" ]; then
        echo -e "${BLUE}📝 Creating Next.js configuration...${NC}"

        cat > next.config.js << EOF
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true,
  },
}

module.exports = nextConfig
EOF
    fi

    # Create basic app structure
    mkdir -p src/app

    if [ ! -f "src/app/page.tsx" ]; then
        cat > src/app/page.tsx << EOF
'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '3rem',
        borderRadius: '1rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '1rem'
        }}>
          🎉 RBI Compliance Platform
        </h1>
        <p style={{
          fontSize: '1.2rem',
          color: '#6b7280',
          marginBottom: '2rem'
        }}>
          Enterprise Compliance Management System
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '0.5rem' }}>
            <h3 style={{ color: '#059669', marginBottom: '0.5rem' }}>✅ Frontend</h3>
            <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>React + Next.js</p>
          </div>
          <div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '0.5rem' }}>
            <h3 style={{ color: '#0ea5e9', marginBottom: '0.5rem' }}>🔧 Backend</h3>
            <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>Node.js + TypeScript</p>
          </div>
          <div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '0.5rem' }}>
            <h3 style={{ color: '#8b5cf6', marginBottom: '0.5rem' }}>🤖 AI/ML</h3>
            <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>Predictive Analytics</p>
          </div>
        </div>
        <div style={{
          padding: '1rem',
          background: '#ecfdf5',
          borderRadius: '0.5rem',
          border: '1px solid #d1fae5'
        }}>
          <p style={{ color: '#065f46', margin: 0 }}>
            🚀 <strong>Platform is running successfully!</strong><br/>
            Ready for compliance management workflows.
          </p>
        </div>
      </div>
    </div>
  )
}
EOF
    fi

    if [ ! -f "src/app/layout.tsx" ]; then
        cat > src/app/layout.tsx << EOF
export const metadata = {
  title: 'RBI Compliance Platform',
  description: 'Enterprise Compliance Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
EOF
    fi

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        npm install
    fi

    echo -e "${GREEN}✅ Starting Next.js development server...${NC}"
    echo -e "${BLUE}🌐 Frontend will be available at: http://localhost:3000${NC}"

    # Start the development server
    npm run dev

else
    echo -e "${RED}❌ Frontend directory not found or invalid${NC}"
    exit 1
fi
