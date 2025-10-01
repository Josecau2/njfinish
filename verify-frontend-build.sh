#!/bin/bash
# verify-frontend-build.sh - Test only the frontend build

echo "🏗️ Testing frontend build only..."

# Clean first
echo "Cleaning build artifacts..."
rm -rf frontend/build frontend/dist node_modules/.vite 2>/dev/null

# Build just frontend
echo "Running frontend build..."
npm run build:frontend > frontend-build.log 2>&1

if [ $? -eq 0 ]; then
  echo "✅ Frontend build successful"

  # Check bundle size
  if [ -d "frontend/build" ]; then
    SIZE=$(du -sh frontend/build 2>/dev/null | cut -f1 || echo "Unknown")
    BUILD_DIR="frontend/build"
  elif [ -d "frontend/dist" ]; then
    SIZE=$(du -sh frontend/dist 2>/dev/null | cut -f1 || echo "Unknown")
    BUILD_DIR="frontend/dist"
  else
    SIZE="Unknown"
    BUILD_DIR="Not found"
  fi
  echo "📦 Bundle size: $SIZE"
  echo "📁 Build directory: $BUILD_DIR"

  # Check for warnings
  WARNINGS=$(grep -i "warning" frontend-build.log | wc -l)
  echo "⚠️  Warnings: $WARNINGS"

  if [ $WARNINGS -gt 10 ]; then
    echo "Too many warnings - review frontend-build.log"
    echo "Recent warnings:"
    grep -i "warning" frontend-build.log | tail -5
  fi

  # Check for critical errors (even if build succeeded)
  ERRORS=$(grep -i "error" frontend-build.log | wc -l)
  if [ $ERRORS -gt 0 ]; then
    echo "⚠️  Errors found (but build succeeded): $ERRORS"
    echo "Recent errors:"
    grep -i "error" frontend-build.log | tail -3
  fi

  # List generated files
  if [ -d "$BUILD_DIR" ]; then
    echo ""
    echo "📋 Generated files:"
    find "$BUILD_DIR" -type f -name "*.js" -o -name "*.css" -o -name "*.html" | head -10
  fi

else
  echo "❌ Frontend build failed"
  echo "Last 20 lines of build output:"
  tail -n 20 frontend-build.log
  exit 1
fi