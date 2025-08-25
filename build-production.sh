#!/bin/bash

# Production Build Script for NJ Cabinets - Ubuntu/Linux
# This script handles the complete automated build and setup process

set -e  # Exit on any error

echo "🚀 Building NJ Cabinets for Production..."
echo "========================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_info() { echo -e "${BLUE}📝 $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Verify Node.js and npm
command -v node >/dev/null 2>&1 || { print_error "Node.js is required but not installed. Aborting."; exit 1; }
command -v npm >/dev/null 2>&1 || { print_error "npm is required but not installed. Aborting."; exit 1; }

print_info "Node.js: $(node --version)"
print_info "npm: $(npm --version)"

# Set production environment
export NODE_ENV=production
export BUILD_MODE=automatic

print_info "Installing backend dependencies..."
npm install --production --silent
print_status "Backend dependencies installed"

print_info "Building frontend..."
cd frontend
npm install --silent
npm run build --silent
cd ..
print_status "Frontend built successfully"

print_info "Setting up uploads directory..."
mkdir -p uploads/{images,manufacturer_catalogs,resources}
chmod -R 755 uploads/
print_status "Upload directories configured"

print_info "Creating logs directory..."
mkdir -p logs
chmod -R 755 logs/
print_status "Logs directory ready"

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    print_warning ".env file not found"
    if [ -f .env.example ]; then
        cp .env.example .env
        print_info "Created .env from .env.example"
    else
        cat > .env << EOL
NODE_ENV=production
PORT=8080
UPLOAD_PATH=./uploads
RESOURCES_UPLOAD_DIR=./uploads/resources
EOL
        print_info "Created basic .env file"
    fi
fi

print_status "Production build completed successfully!"
print_info "The app will automatically set up admin user and default data on first start"
print_info "Admin credentials: joseca@symmetricalwolf.com / admin123"
print_warning "Remember to change the admin password after first login!"

echo ""
print_info "To start the application:"
print_info "  npm start"
print_info "  OR"
print_info "  pm2 start index.js --name njcabinets"
