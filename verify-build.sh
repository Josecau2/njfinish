#!/bin/bash
# verify-build.sh

echo "🏗️ Testing clean build..."

# Clean first
echo "Cleaning build artifacts..."
rm -rf frontend/build frontend/dist node_modules/.vite 2>/dev/null

# Build
echo "Running build..."
npm run build > build.log 2>&1

if [ $? -eq 0 ]; then
  echo "✅ Build successful"

  # Check bundle size
  if [ -d "frontend/build" ]; then
    SIZE=$(du -sh frontend/build 2>/dev/null | cut -f1 || echo "Unknown")
  elif [ -d "frontend/dist" ]; then
    SIZE=$(du -sh frontend/dist 2>/dev/null | cut -f1 || echo "Unknown")
  else
    SIZE="Unknown"
  fi
  echo "📦 Bundle size: $SIZE"

  # Check for warnings
  WARNINGS=$(grep -i "warning" build.log | wc -l)
  echo "⚠️  Warnings: $WARNINGS"

  if [ $WARNINGS -gt 10 ]; then
    echo "Too many warnings - review build.log"
    echo "Recent warnings:"
    grep -i "warning" build.log | tail -5
  fi

  # Check for critical errors (even if build succeeded)
  ERRORS=$(grep -i "error" build.log | wc -l)
  if [ $ERRORS -gt 0 ]; then
    echo "⚠️  Errors found (but build succeeded): $ERRORS"
    echo "Recent errors:"
    grep -i "error" build.log | tail -3
  fi

else
  echo "❌ Build failed"
  echo "Last 20 lines of build output:"
  tail -n 20 build.log
  exit 1
fi