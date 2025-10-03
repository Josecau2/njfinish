#!/bin/bash

# Script to find all hardcoded colors in the frontend codebase
# This finds colors that are NOT using useColorModeValue or semantic tokens

echo "=========================================="
echo "Finding ALL hardcoded colors in the app"
echo "=========================================="
echo ""

# Function to search and display results
search_pattern() {
    local pattern=$1
    local description=$2
    local results=$(grep -rn "$pattern" frontend/src --include="*.jsx" --include="*.js" --include="*.css" --include="*.scss" 2>/dev/null | \
        grep -v "useColorModeValue" | \
        grep -v "// " | \
        grep -v "const.*=" | \
        grep -v "import " | \
        grep -v "colorScheme" | \
        grep -v "node_modules" | \
        wc -l)

    if [ "$results" -gt 0 ]; then
        echo "[$results] $description"
    fi
}

echo "=== Scanning for hardcoded colors... ==="
echo ""

# 1. Find bg="white" or bg='white'
echo "1. Hardcoded bg=\"white\" or bg='white':"
grep -rn 'bg=["'\'']\(white\|#fff\|#ffffff\)["'\'']' frontend/src --include="*.jsx" --include="*.js" | \
    grep -v "useColorModeValue" | \
    grep -v "//" | \
    wc -l | xargs echo "   Found:"
echo ""

# 2. Find bg="gray.XX"
echo "2. Hardcoded bg=\"gray.XX\" (not using useColorModeValue):"
grep -rn 'bg=["'\'']\(gray\.[0-9]\+\)["'\'']' frontend/src --include="*.jsx" --include="*.js" | \
    grep -v "useColorModeValue" | \
    grep -v "//" | \
    wc -l | xargs echo "   Found:"
echo ""

# 3. Find color="gray.XX" or color="white"
echo "3. Hardcoded color=\"...\" (not using useColorModeValue):"
grep -rn 'color=["'\'']\(white\|gray\.[0-9]\+\|#[0-9a-fA-F]\+\)["'\'']' frontend/src --include="*.jsx" --include="*.js" | \
    grep -v "useColorModeValue" | \
    grep -v "colorScheme" | \
    grep -v "//" | \
    wc -l | xargs echo "   Found:"
echo ""

# 4. Find borderColor hardcoded
echo "4. Hardcoded borderColor:"
grep -rn 'borderColor=["'\'']\(white\|gray\.[0-9]\+\|#[0-9a-fA-F]\+\)["'\'']' frontend/src --include="*.jsx" --include="*.js" | \
    grep -v "useColorModeValue" | \
    grep -v "//" | \
    wc -l | xargs echo "   Found:"
echo ""

# 5. Find CSS background-color
echo "5. CSS background-color: (white, #fff, gray colors):"
grep -rn 'background-color:\s*\(white\|#fff\|#f[0-9a-fA-F]\{5\}\|rgb.*255.*255.*255\)' frontend/src --include="*.css" --include="*.scss" --include="*.jsx" --include="*.js" | \
    grep -v "var(--" | \
    grep -v "//" | \
    wc -l | xargs echo "   Found:"
echo ""

# 6. Find CSS background: (not using var)
echo "6. CSS background: (white, #fff, linear-gradient with hardcoded colors):"
grep -rn 'background:\s*\(white\|#fff\|#f[0-9a-fA-F]\{5\}\|linear-gradient\)' frontend/src --include="*.css" --include="*.scss" --include="*.jsx" --include="*.js" | \
    grep -v "var(--" | \
    grep -v "//" | \
    wc -l | xargs echo "   Found:"
echo ""

# 7. Find inline style objects with backgroundColor
echo "7. Inline style objects with backgroundColor:"
grep -rn 'backgroundColor:\s*["'\'']\(white\|#fff\|#f[0-9a-fA-F]\{5\}\)["'\'']' frontend/src --include="*.jsx" --include="*.js" | \
    grep -v "useColorModeValue" | \
    grep -v "//" | \
    wc -l | xargs echo "   Found:"
echo ""

echo "=========================================="
echo "DETAILED RESULTS:"
echo "=========================================="
echo ""

echo "=== 1. HARDCODED bg=\"white\" or bg='white' ==="
grep -rn 'bg=["'\'']\(white\|#fff\|#ffffff\)["'\'']' frontend/src --include="*.jsx" --include="*.js" | \
    grep -v "useColorModeValue" | \
    grep -v "//" | \
    head -20
echo ""

echo "=== 2. HARDCODED bg=\"gray.XX\" ==="
grep -rn 'bg=["'\'']\(gray\.[0-9]\+\)["'\'']' frontend/src --include="*.jsx" --include="*.js" | \
    grep -v "useColorModeValue" | \
    grep -v "//" | \
    head -20
echo ""

echo "=== 3. HARDCODED color=\"...\" ==="
grep -rn 'color=["'\'']\(white\|gray\.[0-9]\+\|#[0-9a-fA-F]\+\)["'\'']' frontend/src --include="*.jsx" --include="*.js" | \
    grep -v "useColorModeValue" | \
    grep -v "colorScheme" | \
    grep -v "//" | \
    head -20
echo ""

echo "=== 4. HARDCODED borderColor ==="
grep -rn 'borderColor=["'\'']\(white\|gray\.[0-9]\+\|#[0-9a-fA-F]\+\)["'\'']' frontend/src --include="*.jsx" --include="*.js" | \
    grep -v "useColorModeValue" | \
    grep -v "//" | \
    head -20
echo ""

echo "=== 5. CSS background-color: white/light ==="
grep -rn 'background-color:\s*\(white\|#fff\|#f[0-9a-fA-F]\{5\}\)' frontend/src --include="*.css" --include="*.scss" | \
    grep -v "var(--" | \
    grep -v "//" | \
    head -20
echo ""

echo "=== 6. CSS background: (hardcoded) ==="
grep -rn 'background:\s*\(white\|#fff\|#f[0-9a-fA-F]\{5\}\|linear-gradient\)' frontend/src --include="*.css" --include="*.scss" | \
    grep -v "var(--" | \
    grep -v "//" | \
    head -20
echo ""

echo "=========================================="
echo "Search complete!"
echo "=========================================="
