#!/bin/bash
# verify-actual-files.sh - Verify files that were actually implemented

echo "🔍 Verifying implemented file structure..."

CORE_FILES=(
  "PROGRESS.md"
  ".ai/state.json"
  "AUDIT/AUDIT.md"
  "AUDIT/manifest.json"
  "CONTRIBUTING-UI.md"
  "QA.md"
  ".github/workflows/ui-audit.yml"
)

FRONTEND_FILES=(
  "frontend/src/styles/fixes.css"
  "frontend/src/components/ErrorBoundary.jsx"
  "frontend/src/components/AppHeader.js"
  "frontend/src/components/AppSidebar.js"
  "frontend/src/components/AppContent.js"
  "frontend/src/components/PageContainer.jsx"
  "frontend/src/components/LoadingSkeleton.jsx"
  "frontend/src/components/AppModal.jsx"
  "frontend/src/components/TileCard.jsx"
  "frontend/src/components/ResponsiveTable.jsx"
  "frontend/src/ui-tokens.js"
)

TEST_FILES=(
  "tests/layout.a11y.spec.js"
  "tests/i18n.spec.js"
  "tests/modals.spec.js"
  "playwright.config.js"
)

SCRIPT_FILES=(
  "scripts/generate-manifest.mjs"
  "scripts/check-manifest.mjs"
)

MISSING=()
FOUND=()
TOTAL_FILES=0

check_files() {
  local files=("$@")
  for file in "${files[@]}"; do
    TOTAL_FILES=$((TOTAL_FILES + 1))
    if [[ -f "$file" ]]; then
      FOUND+=("$file")
      echo "✅ $file"
    else
      MISSING+=("$file")
      echo "❌ $file"
    fi
  done
}

echo ""
echo "=== Core Files ==="
check_files "${CORE_FILES[@]}"

echo ""
echo "=== Frontend Components ==="
check_files "${FRONTEND_FILES[@]}"

echo ""
echo "=== Test Files ==="
check_files "${TEST_FILES[@]}"

echo ""
echo "=== Script Files ==="
check_files "${SCRIPT_FILES[@]}"

echo ""
echo "Summary: ${#FOUND[@]}/${TOTAL_FILES} files found"

if [ ${#MISSING[@]} -gt 0 ]; then
  echo ""
  echo "❌ Missing critical files:"
  printf '%s\n' "${MISSING[@]}"
  echo ""
  echo "These files are required for the playbook implementation."
  exit 1
else
  echo "✅ All critical files present!"
fi