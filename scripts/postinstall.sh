#!/bin/bash

# Post-install script for production deployment
# This runs automatically after npm install in production

if [ "$NODE_ENV" = "production" ]; then
    echo "🔧 Running post-install production setup..."
    
    # Create required directories
    mkdir -p uploads/{images,manufacturer_catalogs,resources}
    mkdir -p logs
    
    # Set permissions if on Unix-like system
    if [ "$(uname)" != "MINGW64_NT"* ] && [ "$(uname)" != "MSYS_NT"* ]; then
        chmod -R 755 uploads/ 2>/dev/null || true
        chmod -R 755 logs/ 2>/dev/null || true
    fi
    
    # Build frontend if it exists and hasn't been built
    if [ -d "frontend" ] && [ ! -d "frontend/build" ]; then
        echo "🏗️  Building frontend..."
        cd frontend
        npm install --silent 2>/dev/null || true
        npm run build --silent 2>/dev/null || true
        cd ..
    fi
    
    echo "✅ Post-install setup completed"
fi
