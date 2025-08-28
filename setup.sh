#!/bin/bash

# RBI Compliance Platform Setup Script
# This script sets up the complete development environment

set -e

echo "🚀 Setting up RBI Compliance Management Platform..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if required tools are installed
check_requirements() {
    print_info "Checking system requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
        exit 1
    fi
    print_status "Node.js $(node -v) is installed"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed."
        exit 1
    fi
    print_status "npm $(npm -v) is installed"
    
    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        print_status "Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1) is installed"
        DOCKER_AVAILABLE=true
    else
        print_warning "Docker is not installed. You'll need to set up databases manually."
        DOCKER_AVAILABLE=false
    fi
    
    # Check Docker Compose (optional)
    if command -v docker-compose &> /dev/null; then
        print_status "Docker Compose $(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1) is installed"
        DOCKER_COMPOSE_AVAILABLE=true
    else
        print_warning "Docker Compose is not installed."
        DOCKER_COMPOSE_AVAILABLE=false
    fi
}

# Install backend dependencies
setup_backend() {
    print_info "Setting up backend..."
    
    cd backend
    
    # Install dependencies
    print_info "Installing backend dependencies..."
    npm install
    
    # Create necessary directories
    mkdir -p uploads logs
    
    # Copy environment file
    if [ ! -f .env ]; then
        cp .env.example .env 2>/dev/null || cp .env .env.backup
        print_status "Environment file created/updated"
    fi
    
    cd ..
    print_status "Backend setup completed"
}

# Install frontend dependencies
setup_frontend() {
    print_info "Setting up frontend..."
    
    cd frontend
    
    # Install dependencies
    print_info "Installing frontend dependencies..."
    npm install
    
    # Create environment file if it doesn't exist
    if [ ! -f .env.local ]; then
        cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=RBI Compliance Platform
NEXT_PUBLIC_APP_VERSION=1.0.0
EOF
        print_status "Frontend environment file created"
    fi
    
    cd ..
    print_status "Frontend setup completed"
}

# Setup databases with Docker
setup_databases() {
    if [ "$DOCKER_AVAILABLE" = true ] && [ "$DOCKER_COMPOSE_AVAILABLE" = true ]; then
        print_info "Setting up databases with Docker..."
        
        # Start only database services
        docker-compose up -d mongodb redis
        
        print_info "Waiting for databases to be ready..."
        sleep 10
        
        print_status "Databases are running"
        print_info "MongoDB: mongodb://localhost:27017"
        print_info "Redis: redis://localhost:6379"
    else
        print_warning "Docker not available. Please set up MongoDB and Redis manually:"
        print_info "MongoDB: Install and run on port 27017"
        print_info "Redis: Install and run on port 6379"
    fi
}

# Build applications
build_applications() {
    print_info "Building applications..."
    
    # Build backend
    cd backend
    npm run build
    cd ..
    print_status "Backend built successfully"
    
    # Build frontend
    cd frontend
    npm run build
    cd ..
    print_status "Frontend built successfully"
}

# Start development servers
start_development() {
    print_info "Starting development servers..."
    
    # Create a simple start script
    cat > start-dev.sh << 'EOF'
#!/bin/bash

# Start development servers
echo "🚀 Starting RBI Compliance Platform Development Servers..."

# Function to kill background processes on exit
cleanup() {
    echo "Stopping servers..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting backend server..."
cd backend && npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 5

# Start frontend
echo "Starting frontend server..."
cd frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 Development servers started!"
echo "📊 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5000"
echo "📚 API Docs: http://localhost:5000/api/v1"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for background processes
wait
EOF

    chmod +x start-dev.sh
    print_status "Development start script created: ./start-dev.sh"
}

# Create production start script
create_production_script() {
    cat > start-prod.sh << 'EOF'
#!/bin/bash

# Start production servers with Docker
echo "🚀 Starting RBI Compliance Platform (Production Mode)..."

# Start all services
docker-compose up -d

echo ""
echo "🎉 Production servers started!"
echo "📊 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5000"
echo "💾 MongoDB: mongodb://localhost:27017"
echo "🔴 Redis: redis://localhost:6379"
echo ""
echo "To stop: docker-compose down"
echo "To view logs: docker-compose logs -f"
EOF

    chmod +x start-prod.sh
    print_status "Production start script created: ./start-prod.sh"
}

# Create useful scripts
create_utility_scripts() {
    print_info "Creating utility scripts..."
    
    # Database reset script
    cat > reset-db.sh << 'EOF'
#!/bin/bash
echo "🗑️  Resetting databases..."
docker-compose down -v
docker-compose up -d mongodb redis
echo "✅ Databases reset completed"
EOF
    chmod +x reset-db.sh
    
    # Logs script
    cat > logs.sh << 'EOF'
#!/bin/bash
if [ "$1" = "backend" ]; then
    docker-compose logs -f backend
elif [ "$1" = "frontend" ]; then
    docker-compose logs -f frontend
else
    docker-compose logs -f
fi
EOF
    chmod +x logs.sh
    
    print_status "Utility scripts created"
}

# Main setup function
main() {
    echo ""
    print_info "Starting setup process..."
    echo ""
    
    check_requirements
    echo ""
    
    setup_backend
    echo ""
    
    setup_frontend
    echo ""
    
    setup_databases
    echo ""
    
    build_applications
    echo ""
    
    start_development
    echo ""
    
    create_production_script
    echo ""
    
    create_utility_scripts
    echo ""
    
    print_status "🎉 Setup completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Start development: ./start-dev.sh"
    echo "2. Or start with Docker: ./start-prod.sh"
    echo "3. Open browser: http://localhost:3000"
    echo ""
    echo "📚 Useful commands:"
    echo "• View logs: ./logs.sh [backend|frontend]"
    echo "• Reset databases: ./reset-db.sh"
    echo "• Stop Docker services: docker-compose down"
    echo ""
    echo "🔧 Default credentials:"
    echo "• Create account at: http://localhost:3000/register"
    echo "• Or use API directly: http://localhost:5000/api/v1"
    echo ""
}

# Run main function
main
