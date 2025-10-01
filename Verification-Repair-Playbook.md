# Verification & Repair Playbook — Post-Implementation Audit

**Purpose:** Systematically test, verify, and repair all UI playbook implementations
**Use:** Run this AFTER the main playbook was executed to catch all issues
**Branch:** `njnewui`

> ## Verification Protocol
> Test each deliverable in order. Do NOT skip to fixes. Document ALL issues first, then repair in priority order.

---

## 0) Pre-Verification Setup

### 0.1 Create Verification Tracking

```bash
# Create verification log
cat > VERIFICATION.md << 'EOF'
# VERIFICATION LOG

## Status Legend
- ✅ PASS - Works as specified
- ⚠️ PARTIAL - Works but has issues
- ❌ FAIL - Broken or missing
- ⏭️ SKIP - Not applicable

## Verification Results

### Step 0: Memory & Progress
- [ ] PROGRESS.md exists and readable
- [ ] .ai/state.json exists and valid JSON
- [ ] AUDIT/AUDIT.md exists
- [ ] AUDIT/manifest.json exists and valid JSON

### Step 1: Baseline & Guardrails
- [ ] CONTRIBUTING-UI.md exists
- [ ] Guardrails documented

### Step 2: Global CSS
- [ ] src/styles/fixes.css exists
- [ ] Imported in main entry file
- [ ] No horizontal overflow on any page

### Step 3: App Shell
- [ ] src/layout/AppShell exists
- [ ] Has proper min-width: 0
- [ ] Renders without errors

### Step 3.5: Error Boundary
- [ ] src/components/ErrorBoundary exists
- [ ] Wraps app in main entry
- [ ] Catches errors gracefully

### Step 4: Header & Toolbar
- [ ] src/components/AppHeader exists
- [ ] Height is 60px
- [ ] Sticky behavior works
- [ ] All IconButtons >= 44x44px

### Step 5: Sidebar
- [ ] src/components/AppSidebar exists
- [ ] Expands/collapses on desktop
- [ ] Mobile drawer works
- [ ] State persists in localStorage

### Step 6: Page Container
- [ ] src/components/PageContainer exists
- [ ] Used across pages
- [ ] Proper padding tokens

### Step 6.5: Loading Skeletons
- [ ] src/components/LoadingSkeleton exists
- [ ] Used in async routes

### Step 7: Modals
- [ ] src/components/AppModal exists (or standard pattern)
- [ ] Mobile full-screen
- [ ] Scroll inside modal

### Step 8: Grids & Tiles
- [ ] src/components/TileCard exists
- [ ] Responsive grid works
- [ ] No clipping

### Step 8.2: Tables
- [ ] src/components/ResponsiveTable exists
- [ ] Cards on mobile
- [ ] Scrollable on desktop

### Step 9: Icons & Tap Targets
- [ ] src/ui-tokens file exists
- [ ] Icons use standard sizes
- [ ] All interactive elements >= 44x44

### Step 10: Dark Mode
- [ ] Dark mode toggle works
- [ ] Contrast acceptable
- [ ] Borders visible in dark mode

### Step 10.2: Reduced Motion
- [ ] CSS media query present
- [ ] Animations respect preference

### Step 11: Customization
- [ ] src/customization/ structure exists
- [ ] Loads safely with fallbacks
- [ ] Only affects: brand, PDF, auth pages

### Step 12: Audit System
- [ ] AUDIT/manifest.json comprehensive
- [ ] src/audit/routeRegistrar exists
- [ ] src/routes/__audit__/ playground exists

### Step 13: Tests
- [ ] tests/layout.a11y.spec.ts exists
- [ ] tests/i18n.spec.ts exists
- [ ] tests/modals.spec.ts exists
- [ ] Playwright installed

### Step 14: CI
- [ ] .github/workflows/ui-audit.yml exists
- [ ] CI runs successfully

### Step 15: QA Matrix
- [ ] QA.md exists
- [ ] All items testable

---

## Issues Found
(Document all issues here before fixing)

## Fixes Applied
(Document each fix with before/after)
EOF

cat > .verification-state.json << 'EOF'
{
  "started": "",
  "current_check": 0,
  "issues_found": [],
  "fixes_applied": [],
  "status": "not_started"
}
EOF

git add VERIFICATION.md .verification-state.json
git commit -m "AI: init verification tracking [verify-0]"
```

---

## Phase 1: File Structure Verification

### Test 1.1: All Required Files Exist

```bash
#!/bin/bash
# save as: verify-files.sh

echo "🔍 Verifying file structure..."

REQUIRED_FILES=(
  "PROGRESS.md"
  ".ai/state.json"
  "AUDIT/AUDIT.md"
  "AUDIT/manifest.json"
  "CONTRIBUTING-UI.md"
  "src/styles/fixes.css"
  "src/layout/AppShell.tsx"
  "src/layout/AppShell.jsx"
  "src/components/ErrorBoundary.tsx"
  "src/components/ErrorBoundary.jsx"
  "src/components/AppHeader.tsx"
  "src/components/AppHeader.jsx"
  "src/components/AppSidebar.tsx"
  "src/components/AppSidebar.jsx"
  "src/components/PageContainer.tsx"
  "src/components/PageContainer.jsx"
  "src/components/LoadingSkeleton.tsx"
  "src/components/LoadingSkeleton.jsx"
  "src/components/AppModal.tsx"
  "src/components/AppModal.jsx"
  "src/components/TileCard.tsx"
  "src/components/TileCard.jsx"
  "src/components/ResponsiveTable.tsx"
  "src/components/ResponsiveTable.jsx"
  "src/ui-tokens.ts"
  "src/ui-tokens.js"
  "src/customization/contract.ts"
  "src/customization/load.ts"
  "src/theme/brand.ts"
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
```

**Run it:**
```bash
chmod +x verify-files.sh
./verify-files.sh
```

**If files missing:** Create them before proceeding.

---

## Phase 2: Build & Runtime Verification

### Test 2.1: Clean Build

```bash
#!/bin/bash
# verify-build.sh

echo "🏗️ Testing clean build..."

# Clean first
rm -rf dist node_modules/.vite

# Build
npm run build > build.log 2>&1

if [ $? -eq 0 ]; then
  echo "✅ Build successful"

  # Check bundle size
  SIZE=$(du -sh dist | cut -f1)
  echo "📦 Bundle size: $SIZE"

  # Check for warnings
  WARNINGS=$(grep -i "warning" build.log | wc -l)
  echo "⚠️  Warnings: $WARNINGS"

  if [ $WARNINGS -gt 10 ]; then
    echo "Too many warnings - review build.log"
  fi
else
  echo "❌ Build failed"
  tail -n 20 build.log
  exit 1
fi
```

**Fix strategy if build fails:**
1. Read last 20 lines of build.log
2. Identify error type (import, syntax, type, etc.)
3. Fix specific file
4. Re-run build
5. Repeat until clean

---

### Test 2.2: Dev Server Starts

```bash
#!/bin/bash
# verify-dev-server.sh

echo "🚀 Testing dev server..."

# Start dev server in background
npm run dev > dev.log 2>&1 &
DEV_PID=$!

# Wait for server to start
sleep 5

# Check if running
if ps -p $DEV_PID > /dev/null; then
  echo "✅ Dev server started (PID: $DEV_PID)"

  # Check port
  PORT=$(lsof -ti:3000 || lsof -ti:5173)
  echo "🌐 Running on port: $PORT"

  # Check for errors in first 5 seconds
  ERRORS=$(grep -i "error" dev.log | wc -l)
  if [ $ERRORS -gt 0 ]; then
    echo "⚠️  Errors in dev.log:"
    grep -i "error" dev.log
  else
    echo "✅ No startup errors"
  fi

  # Kill dev server
  kill $DEV_PID
else
  echo "❌ Dev server failed to start"
  cat dev.log
  exit 1
fi
```

---

### Test 2.3: All Routes Load Without Errors

```bash
#!/bin/bash
# verify-routes.sh

echo "🔍 Testing all routes..."

# Start dev server
npm run dev > /dev/null 2>&1 &
DEV_PID=$!
sleep 5

# Get routes from manifest
ROUTES=$(node -e "
  const m = require('./AUDIT/manifest.json');
  m.routes.forEach(r => console.log(r.path));
")

PORT=3000  # or 5173 for Vite

for route in $ROUTES; do
  echo -n "Testing $route ... "

  # Use curl to check if route loads
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT$route)

  if [ "$STATUS" = "200" ]; then
    echo "✅ $STATUS"
  else
    echo "❌ $STATUS"
  fi
done

kill $DEV_PID
```

**Alternative with Playwright:**
```javascript
// verify-routes.spec.js
import { test, expect } from '@playwright/test';
import manifest from './AUDIT/manifest.json';

for (const route of manifest.routes) {
  test(`route ${route.path} loads`, async ({ page }) => {
    const response = await page.goto(route.path);
    expect(response.status()).toBe(200);

    // No console errors
    const errors = [];
    page.on('pageerror', err => errors.push(err));
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });
}
```

---

## Phase 3: Component-Level Verification

### Test 3.1: Header Specifications

```javascript
// verify-header.spec.js
import { test, expect } from '@playwright/test';

test('AppHeader meets specifications', async ({ page }) => {
  await page.goto('/');

  const header = page.locator('[data-app-header]');
  await expect(header).toBeVisible();

  // Height should be 60px
  const box = await header.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(56);
  expect(box.height).toBeLessThanOrEqual(64);

  // Should be sticky
  const position = await header.evaluate(el =>
    getComputedStyle(el).position
  );
  expect(position).toBe('sticky');

  // All icon buttons >= 44x44
  const iconButtons = await page.locator('[data-app-header] button:has(svg):not(:has-text(/./))').all();

  for (const btn of iconButtons) {
    const btnBox = await btn.boundingBox();
    expect(btnBox.width, 'Icon button width').toBeGreaterThanOrEqual(44);
    expect(btnBox.height, 'Icon button height').toBeGreaterThanOrEqual(44);
  }

  // Should have bottom border
  const borderBottom = await header.evaluate(el =>
    getComputedStyle(el).borderBottomWidth
  );
  expect(borderBottom).not.toBe('0px');
});
```

**If fails:** Document exact failure, fix component, re-test.

---

### Test 3.2: Sidebar Specifications

```javascript
// verify-sidebar.spec.js
import { test, expect } from '@playwright/test';

test.describe('AppSidebar', () => {
  test('desktop expanded width', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');

    const sidebar = page.locator('[data-sidebar]');
    const box = await sidebar.boundingBox();

    // Should be 256px (64 * 4)
    expect(box.width).toBeGreaterThanOrEqual(250);
    expect(box.width).toBeLessThanOrEqual(260);
  });

  test('desktop collapsed width', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');

    // Click collapse button
    await page.click('[data-sidebar-collapse]');
    await page.waitForTimeout(500); // Animation

    const sidebar = page.locator('[data-sidebar]');
    const box = await sidebar.boundingBox();

    // Should be 56px (14 * 4)
    expect(box.width).toBeGreaterThanOrEqual(52);
    expect(box.width).toBeLessThanOrEqual(60);
  });

  test('mobile drawer', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    // Sidebar should not be visible initially
    const sidebar = page.locator('[data-sidebar]');
    await expect(sidebar).not.toBeInViewport();

    // Open drawer
    await page.click('[data-sidebar-toggle]');
    await page.waitForTimeout(300);

    // Should be visible and ~85% width
    await expect(sidebar).toBeInViewport();
    const box = await sidebar.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(390 * 0.8);
  });

  test('state persists', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');

    // Collapse sidebar
    await page.click('[data-sidebar-collapse]');
    await page.waitForTimeout(500);

    // Check localStorage
    const stored = await page.evaluate(() =>
      localStorage.getItem('sidebar-collapsed')
    );
    expect(stored).toBe('true');

    // Reload and verify still collapsed
    await page.reload();
    await page.waitForTimeout(500);

    const sidebar = page.locator('[data-sidebar]');
    const box = await sidebar.boundingBox();
    expect(box.width).toBeLessThan(100); // Still collapsed
  });
});
```

---

### Test 3.3: No Horizontal Overflow (Critical)

```javascript
// verify-no-overflow.spec.js
import { test, expect } from '@playwright/test';
import manifest from './AUDIT/manifest.json';

const viewports = [
  { name: 'iphone-se', width: 375, height: 667 },
  { name: 'iphone-13', width: 390, height: 844 },
  { name: 'ipad', width: 768, height: 1024 }
];

for (const vp of viewports) {
  test.describe(`No overflow @${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const route of manifest.routes) {
      test(`${route.path}`, async ({ page }) => {
        await page.goto(route.path);
        await page.waitForLoadState('networkidle');

        const hasOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth + 1;
        });

        expect(hasOverflow, 'Page has horizontal overflow').toBe(false);

        // If failed, take screenshot for debugging
        if (hasOverflow) {
          await page.screenshot({
            path: `overflow-${vp.name}-${route.path.replace(/\//g, '-')}.png`,
            fullPage: true
          });

          // Find the offending element
          const widest = await page.evaluate(() => {
            const all = Array.from(document.querySelectorAll('*'));
            let max = { width: 0, selector: '' };

            for (const el of all) {
              const rect = el.getBoundingClientRect();
              if (rect.width > max.width) {
                max = {
                  width: rect.width,
                  selector: el.tagName + (el.className ? '.' + el.className : '')
                };
              }
            }

            return max;
          });

          console.log('Widest element:', widest);
        }
      });
    }
  });
}
```

**Fix strategy for overflow:**
1. Run test to identify page and element
2. Check screenshot
3. Add `overflow-x: hidden` or `min-width: 0` to parent
4. Wrap tables/grids in `overflow-x: auto` container
5. Re-test

---

### Test 3.4: Dark Mode Contrast

```javascript
// verify-dark-mode.spec.js
import { test, expect } from '@playwright/test';

test('dark mode has visible borders', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');

  // Header border should be visible
  const headerBorder = await page.locator('[data-app-header]').evaluate(el => {
    const color = getComputedStyle(el).borderBottomColor;
    return color;
  });

  expect(headerBorder).not.toBe('transparent');
  expect(headerBorder).not.toBe('rgba(0, 0, 0, 0)');

  // Should contain white/alpha
  expect(headerBorder).toMatch(/255|white/i);
});

test('text readable in dark mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');

  // Sample some text elements
  const texts = await page.locator('p, h1, h2, h3, button').all();

  for (const text of texts.slice(0, 10)) {
    const color = await text.evaluate(el => getComputedStyle(el).color);

    // Should not be dark gray on dark bg
    expect(color).not.toMatch(/rgb\(50|60|70/);
  }
});
```

---

## Phase 4: Automated Test Suite Verification

### Test 4.1: Run Full Playwright Suite

```bash
#!/bin/bash
# verify-tests.sh

echo "🧪 Running full test suite..."

# Install browsers if needed
npx playwright install --with-deps

# Run tests
npm run test:audit -- --reporter=html

# Check results
if [ $? -eq 0 ]; then
  echo "✅ All tests passed"
else
  echo "❌ Tests failed - opening report..."
  npx playwright show-report
  exit 1
fi
```

### Test 4.2: Test Coverage Check

```bash
#!/bin/bash
# verify-coverage.sh

echo "📊 Checking test coverage..."

# Count test files
TEST_COUNT=$(find tests -name "*.spec.*" | wc -l)
echo "Test files: $TEST_COUNT"

# Count routes
ROUTE_COUNT=$(node -e "console.log(require('./AUDIT/manifest.json').routes.length)")
echo "Routes: $ROUTE_COUNT"

# Count modals
MODAL_COUNT=$(node -e "console.log(require('./AUDIT/manifest.json').modals.length)")
echo "Modals: $MODAL_COUNT"

# Coverage expectations
if [ $TEST_COUNT -lt 3 ]; then
  echo "⚠️  Need at least 3 test files (layout, modals, i18n)"
fi

if [ $ROUTE_COUNT -eq 0 ]; then
  echo "❌ No routes in manifest"
fi

echo "✅ Coverage check complete"
```

---

## Phase 5: Manual Verification Checklist

Use this for things automated tests can't catch:

### 5.1 Visual Inspection Checklist

```markdown
## Visual Verification

Open the app and verify each item:

### Layout (All Viewports)
- [ ] iPhone SE (375px): No horizontal scroll on any page
- [ ] iPhone 13 (390px): No horizontal scroll on any page
- [ ] iPad (768px): Content uses space well
- [ ] Laptop (1366px): Sidebar docked, content centered
- [ ] Desktop (1920px): Max width 1200px, centered

### Header
- [ ] Height looks right (~60px)
- [ ] Sticky when scrolling
- [ ] Blur effect visible
- [ ] Border visible (both modes)
- [ ] Icons appropriate size
- [ ] Buttons feel tappable (not too small)

### Sidebar
- [ ] Desktop: Can expand/collapse smoothly
- [ ] Desktop: Icons visible when collapsed
- [ ] Mobile: Opens as drawer from left
- [ ] Mobile: Overlay dims background
- [ ] Mobile: Can close with backdrop click
- [ ] State remembered after refresh

### Dark Mode
- [ ] Toggle works
- [ ] All text readable
- [ ] Borders/dividers visible
- [ ] No invisible elements
- [ ] Colors feel intentional

### Interactions
- [ ] All buttons respond to hover
- [ ] Focus indicators visible (Tab key)
- [ ] Modals open smoothly
- [ ] Modals close with X or Esc
- [ ] Toasts appear and dismiss
- [ ] Forms feel responsive

### Typography
- [ ] Hierarchy clear (h1 > h2 > h3 > p)
- [ ] Line heights comfortable
- [ ] No text too small
- [ ] No text too large

### Spacing
- [ ] Consistent gaps between elements
- [ ] Page padding feels right
- [ ] No cramped areas
- [ ] No excessive whitespace

### Performance
- [ ] Pages load quickly (<2s)
- [ ] Interactions feel instant
- [ ] Animations smooth (60fps)
- [ ] No lag when typing
```

---

## Phase 6: Issue Repair Workflow

### 6.1 Issue Documentation Format

For each issue found:

```markdown
## Issue #001: Header Too Tall

**Severity:** P1 - High
**Component:** AppHeader
**Location:** src/components/AppHeader.jsx
**Playbook Spec:** Height should be 60px
**Actual:** Height is 80px
**Root Cause:** Extra padding added
**Viewports Affected:** All

**Evidence:**
- Screenshot: issues/001-header-tall.png
- Test Output: Header height: 80px (expected: 56-64)

**Fix Strategy:**
1. Remove extra padding
2. Verify height with test
3. Check all viewports

**Status:** 🔧 IN PROGRESS
```

### 6.2 Prioritized Repair Order

1. **P0 - Blocking:** Build fails, app crashes
2. **P1 - Critical:** Horizontal overflow, broken navigation, dark mode contrast
3. **P2 - Major:** Component spacing, icon sizes, tap targets
4. **P3 - Minor:** Visual polish, missing hover states

### 6.3 Fix-Test-Commit Loop

```bash
#!/bin/bash
# fix-loop.sh

ISSUE_NUM=$1

echo "🔧 Fixing Issue #$ISSUE_NUM"

# 1. Make the fix in code
echo "Edit the file, then press Enter to continue..."
read

# 2. Test the fix
echo "Running affected tests..."
npm run test:audit -- --grep "header"

if [ $? -ne 0 ]; then
  echo "❌ Tests still failing"
  exit 1
fi

# 3. Visual check
echo "Opening dev server for visual check..."
npm run dev &
DEV_PID=$!

echo "Check http://localhost:3000 - Press Enter when done"
read

kill $DEV_PID

# 4. Commit
git add .
git commit -m "AI: fix issue #$ISSUE_NUM [verify-fix]"

echo "✅ Issue #$ISSUE_NUM fixed and committed"
```

---

## Phase 7: Final Verification

### 7.1 Complete System Test

```bash
#!/bin/bash
# final-verification.sh

echo "🎯 Running final verification..."

# 1. Clean install
rm -rf node_modules package-lock.json
npm install

# 2. Build
npm run build || exit 1

# 3. Tests
npm run test:audit || exit 1

# 4. Lint
npm run lint || exit 1

# 5. Manifest check
npm run audit:manifest || exit 1

# 6. Manual checklist
cat << 'EOF'

✅ Automated checks passed!

Now complete manual verification:

1. Open app: npm run dev
2. Test all routes in manifest
3. Test both light and dark mode
4. Test mobile (DevTools device mode)
5. Test keyboard navigation (Tab key)
6. Test sidebar expand/collapse
7. Test modal open/close
8. Check browser console (no errors)

Press Enter when manual verification complete...
EOF

read

echo "✅ Final verification complete!"
echo "Ready to push to remote"
```

### 7.2 Generate Verification Report

```bash
#!/bin/bash
# generate-report.sh

cat > VERIFICATION-REPORT.md << 'EOF'
# Verification Report

**Date:** $(date)
**Branch:** njnewui
**Verifier:** AI Agent

## Summary
- Total Issues Found: X
- Issues Fixed: Y
- Issues Remaining: Z
- Build Status: ✅ PASS
- Tests Status: ✅ PASS
- Manual Checks: ✅ PASS

## Detailed Results

### File Structure: ✅ PASS
All required files present

### Build: ✅ PASS
- Build time: Xs
- Bundle size: XMB
- Warnings: X

### Tests: ✅ PASS
- Layout tests: X/X passing
- Modal tests: X/X passing
- i18n tests: X/X passing
- A11y violations: 0

### Components: ✅ PASS
- AppHeader: ✅ Meets specs
- AppSidebar: ✅ Meets specs
- PageContainer: ✅ Meets specs
- TileCard: ✅ Meets specs
- ResponsiveTable: ✅ Meets specs

### Playbook Compliance: ✅ PASS
- No horizontal overflow: ✅
- Tap targets >= 44px: ✅
- Icon sizes standardized: ✅
- Dark mode contrast: ✅
- Reduced motion: ✅
- Loading skeletons: ✅
- Error boundary: ✅

## Issues Fixed

### Issue #001: [Title]
- Fixed in commit: abc123
- Verification: ✅

[... list all fixed issues ...]

## Recommendations

1. [Any suggestions for improvements]
2. [Any technical debt noted]
3. [Any future considerations]

## Sign-Off

All playbook requirements verified and met.
Ready for:
- [ ] Code review
- [ ] User acceptance testing
- [ ] Production deployment
EOF

echo "✅ Report generated: VERIFICATION-REPORT.md"
```

---

## Success Criteria

Before marking verification complete:

- [ ] ✅ All files from playbook exist
- [ ] ✅ Build passes with <5 warnings
- [ ] ✅ Dev server starts without errors
- [ ] ✅ All routes in manifest load (200 status)
- [ ] ✅ No horizontal overflow on any viewport
- [ ] ✅ All Playwright tests pass
- [ ] ✅ Manifest check passes
- [ ] ✅ Header meets all specifications
- [ ] ✅ Sidebar meets all specifications
- [ ] ✅ Dark mode contrast acceptable
- [ ] ✅ All tap targets >= 44x44px
- [ ] ✅ Icon sizes use tokens
- [ ] ✅ Error boundary catches crashes
- [ ] ✅ Loading skeletons present
- [ ] ✅ Modals mobile full-screen
- [ ] ✅ Tables responsive
- [ ] ✅ Manual checklist complete
- [ ] ✅ No console errors
- [ ] ✅ VERIFICATION-REPORT.md generated

---

## Quick Start: Run Full Verification

```bash
# 1. Setup
cat > run-full-verification.sh << 'EOF'
#!/bin/bash
set -e

echo "Starting full verification..."

# Phase 1: Files
./verify-files.sh

# Phase 2: Build & Runtime
./verify-build.sh
./verify-dev-server.sh
./verify-routes.sh

# Phase 3: Components
npx playwright test verify-header.spec.js
npx playwright test verify-sidebar.spec.js
npx playwright test verify-no-overflow.spec.js
npx playwright test verify-dark-mode.spec.js

# Phase 4: Full Suite
./verify-tests.sh
./verify-coverage.sh

# Phase 7: Final
./final-verification.sh
./generate-report.sh

echo "✅ All verification complete!"
EOF

chmod +x run-full-verification.sh

# 2. Run it
./run-full-verification.sh
```

---

## What to Do When Issues Are Found

1. **Document** in VERIFICATION.md under "Issues Found"
2. **Prioritize** using P0-P3 system
3. **Fix** in order: P0 → P1 → P2 → P3
4. **Test** each fix immediately
5. **Commit** with clear message: `AI: fix [issue] [verify-fix-001]`
6. **Re-run** verification for that component
7. **Continue** until all issues resolved

---

## Final Output

At the end, you should have:

1. ✅ VERIFICATION.md with all checks marked
2. ✅ VERIFICATION-REPORT.md with full results
3. ✅ All tests passing
4. ✅ Clean build
5. ✅ No console errors
6. ✅ All playbook requirements met
7. ✅ Git history showing all fixes

**Then:** Push to remote and create PR! 🚀