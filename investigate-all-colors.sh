#!/bin/bash
# COMPREHENSIVE COLOR INVESTIGATION SCRIPT
# This script will find EVERY instance of hardcoded colors

echo "=== STARTING COMPREHENSIVE COLOR INVESTIGATION ==="
echo ""

cd frontend/src

echo "1. FINDING ALL HARDCODED BACKGROUNDS..."
echo "----------------------------------------"
grep -r 'bg="[a-z]' --include="*.jsx" --include="*.js" -n | grep -v node_modules | wc -l
echo "files with hardcoded bg found"
echo ""

echo "2. FINDING ALL HARDCODED COLORS..."
echo "----------------------------------------"
grep -r 'color="[a-z]' --include="*.jsx" --include="*.js" -n | grep -v node_modules | wc -l
echo "files with hardcoded color found"
echo ""

echo "3. FINDING ALL HARDCODED BORDER COLORS..."
echo "----------------------------------------"
grep -r 'borderColor="[a-z]' --include="*.jsx" --include="*.js" -n | grep -v node_modules | wc -l
echo "files with hardcoded borderColor found"
echo ""

echo "4. FINDING INLINE STYLES WITH COLORS..."
echo "----------------------------------------"
grep -r 'style={{.*background' --include="*.jsx" --include="*.js" -n | grep -v node_modules | wc -l
echo "files with inline background styles found"
echo ""

echo "5. FINDING ALL FILES WITHOUT useColorModeValue..."
echo "----------------------------------------"
find . -name "*.jsx" -type f | while read file; do
  if grep -qE 'bg="|color="|borderColor="' "$file" 2>/dev/null; then
    if ! grep -q "useColorModeValue" "$file" 2>/dev/null; then
      echo "$file"
    fi
  fi
done > /tmp/no-dark-mode-files.txt

cat /tmp/no-dark-mode-files.txt | wc -l
echo "files with colors but NO dark mode support"
echo ""

echo "=== FILES WITHOUT DARK MODE ==="
cat /tmp/no-dark-mode-files.txt | head -50
echo ""

echo "6. CREATING DETAILED COLOR REPORT..."
echo "----------------------------------------"
grep -r 'bg="\|color="\|borderColor="' --include="*.jsx" --include="*.js" -n | \
  grep -v node_modules | \
  grep -v useColorModeValue > /tmp/all-hardcoded-colors.txt

wc -l /tmp/all-hardcoded-colors.txt
echo ""

echo "=== INVESTIGATION COMPLETE ==="
echo "Reports saved to:"
echo "  /tmp/no-dark-mode-files.txt"
echo "  /tmp/all-hardcoded-colors.txt"
