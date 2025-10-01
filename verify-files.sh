#!/bin/bash
# save as: verify-files.sh

echo "🔍 Verifying file structure..."

REQUIRED_FILES=(
  "PROGRESS.md"
  ".ai/state.json"
  "AUDIT/AUDIT.md"
  "AUDIT/manifest.json"
  "CONTRIBUTING-UI.md"
  "frontend/src/styles/fixes.css"
  "frontend/src/layout/AppShell.tsx"
  "frontend/src/layout/AppShell.jsx"
  "frontend/src/components/ErrorBoundary.tsx"
  "frontend/src/components/ErrorBoundary.jsx"
  "frontend/src/components/AppHeader.tsx"
  "frontend/src/components/AppHeader.jsx"
  "frontend/src/components/AppSidebar.tsx"
  "frontend/src/components/AppSidebar.jsx"
  "frontend/src/components/PageContainer.tsx"
  "frontend/src/components/PageContainer.jsx"
  "frontend/src/components/LoadingSkeleton.tsx"
  "frontend/src/components/LoadingSkeleton.jsx"
  "frontend/src/components/AppModal.tsx"
  "frontend/src/components/AppModal.jsx"
  "frontend/src/components/TileCard.tsx"
  "frontend/src/components/TileCard.jsx"
  "frontend/src/components/ResponsiveTable.tsx"
  "frontend/src/components/ResponsiveTable.jsx"
  "frontend/src/ui-tokens.ts"
  "frontend/src/ui-tokens.js"
  "frontend/src/customization/contract.ts"
  "frontend/src/customization/load.ts"
  "frontend/src/theme/brand.ts"
  "tests/layout.a11y.spec.ts"
  "tests/modals.spec.ts"
  ".github/workflows/ui-audit.yml"
  "QA.md"
)

MISSING=()
FOUND=()

for file in "${REQUIRED_FILES[@]}"; do
  # Check if any extension version exists
  base="${file%.*}"
  if ls ${base}.* 2>/dev/null | grep -q .; then
    FOUND+=("$file")
    echo "✅ $file (or variant)"
  else
    MISSING+=("$file")
    echo "❌ $file"
  fi
done

echo ""
echo "Summary: ${#FOUND[@]} found, ${#MISSING[@]} missing"

if [ ${#MISSING[@]} -gt 0 ]; then
  echo ""
  echo "Missing files:"
  printf '%s\n' "${MISSING[@]}"
  exit 1
fi