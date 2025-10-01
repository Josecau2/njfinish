# Autonomous Runtime Repair Agent — Self-Feeding AI Loop

**Purpose:** Fully autonomous AI agent that discovers, tests, detects, fixes, and verifies ALL runtime errors
**Repository:** `Josecau2/njfinish`
**Branch:** `njnewui`
**Mode:** AUTONOMOUS - No human intervention required

> ## Agent Protocol
> This playbook is designed for AI agents to execute **independently**. The agent MUST:
> 1. Read and understand ALL context from previous playbooks
> 2. Systematically discover every possible interaction
> 3. Test each interaction and detect errors
> 4. Analyze and fix errors using established patterns
> 5. Verify fixes work
> 6. Document everything
> 7. Loop until zero errors remain

---

## 0) Agent Initialization & Context Loading

### 0.1 Load All Previous Context

**The agent MUST review these documents in order:**

1. **UI Execution Playbook** - Understand the app structure:
   - Component architecture (AppHeader, AppSidebar, PageContainer, etc.)
   - Design patterns (Chakra + Tailwind, iOS-like mobile-first)
   - Sizing rules (60px header, 44px tap targets, etc.)
   - Customization scope (brand colors, logos, PDF, auth pages only)

2. **Verification & Repair Playbook** - Understand what was already verified:
   - File structure verification results
   - Build and runtime verification patterns
   - Component-level specifications

3. **Runtime Safety Playbook** - Understand defensive patterns:
   - Safe property access patterns (optional chaining)
   - Safe array operations (.map, [0], .length)
   - API response validation
   - Error boundary patterns

4. **Codebase Structure** - Map the application:
```bash
# Agent must run this to understand the app
find src -type f -name "*.jsx" -o -name "*.js" -o -name "*.tsx" -o -name "*.ts" | head -50

# Understand routing
cat src/App.jsx  # or src/routes/index.jsx or wherever routes are defined

# Understand data flow
grep -r "useState\|useEffect" src --include="*.jsx" | head -20

# Understand API calls
grep -r "fetch\|axios" src --include="*.jsx" | head -20
```

### 0.2 Initialize Agent State

```bash
# Create agent working directory
mkdir -p .agent
cat > .agent/state.json << 'EOF'
{
  "status": "initialized",
  "phase": "discovery",
  "started_at": "",
  "interactions_discovered": 0,
  "interactions_tested": 0,
  "errors_found": 0,
  "errors_fixed": 0,
  "current_iteration": 0,
  "max_iterations": 100,
  "routes": [],
  "components": [],
  "interactions": [],
  "errors": [],
  "fixes": []
}
EOF

# Create error log
cat > .agent/ERROR_LOG.md << 'EOF'
# Runtime Error Log

## Format
- **Error ID**: Unique identifier
- **Location**: File:Line
- **Type**: Error type (TypeError, ReferenceError, etc.)
- **Message**: Full error message
- **Stack**: Stack trace
- **Context**: What interaction caused it
- **Status**: detected | analyzing | fixing | fixed | verified
EOF

# Create fix log
cat > .agent/FIX_LOG.md << 'EOF'
# Fix Application Log

## Format
- **Fix ID**: Links to Error ID
- **Strategy**: What fix pattern was applied
- **Changes**: Files modified
- **Verification**: How we verified it works
- **Result**: Success/Failure
EOF
```

---

## PHASE 1: Systematic Interaction Discovery

**Goal:** Discover EVERY possible way a user can interact with the app

### 1.1 Discover All Routes

```javascript
// .agent/discover-routes.mjs
import fs from 'fs';
import { glob } from 'glob';

async function discoverRoutes() {
  console.log('🔍 PHASE 1.1: Discovering all routes...');

  const routes = new Set();

  // Strategy 1: Parse route definitions
  const routeFiles = await glob('src/**/*{Route,route,Router,router}*.{js,jsx,ts,tsx}');

  for (const file of routeFiles) {
    const content = fs.readFileSync(file, 'utf8');

    // Match <Route path="..." patterns
    const routeMatches = content.matchAll(/<Route\s+[^>]*path\s*=\s*["'`]([^"'`]+)["'`]/g);
    for (const match of routeMatches) {
      routes.add(match[1]);
    }

    // Match path: "..." patterns
    const pathMatches = content.matchAll(/path\s*:\s*["'`]([^"'`]+)["'`]/g);
    for (const match of pathMatches) {
      routes.add(match[1]);
    }
  }

  // Strategy 2: Read manifest
  if (fs.existsSync('AUDIT/manifest.json')) {
    const manifest = JSON.parse(fs.readFileSync('AUDIT/manifest.json', 'utf8'));
    manifest.routes?.forEach(r => routes.add(r.path));
  }

  // Strategy 3: Check common patterns
  const commonRoutes = ['/', '/login', '/dashboard', '/settings', '/profile'];
  commonRoutes.forEach(r => routes.add(r));

  const discovered = Array.from(routes).sort();
  console.log(`✓ Discovered ${discovered.length} routes:`, discovered);

  return discovered;
}

const routes = await discoverRoutes();
fs.writeFileSync('.agent/discovered-routes.json', JSON.stringify(routes, null, 2));
```

### 1.2 Discover All Interactive Elements

```javascript
// .agent/discover-interactions.mjs
import { chromium } from 'playwright';
import fs from 'fs';

async function discoverInteractions(routes) {
  console.log('🔍 PHASE 1.2: Discovering all interactions...');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const allInteractions = [];

  for (const route of routes) {
    console.log(`\n📍 Analyzing route: ${route}`);

    try {
      await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      const interactions = await page.evaluate(() => {
        const elements = [];

        // Buttons
        document.querySelectorAll('button, [role="button"]').forEach((btn, i) => {
          const text = btn.textContent?.trim() || btn.getAttribute('aria-label') || `button-${i}`;
          elements.push({
            type: 'button',
            selector: `button:nth-of-type(${i+1})`,
            text: text.substring(0, 50),
            id: btn.id,
            dataTestId: btn.getAttribute('data-testid')
          });
        });

        // Links
        document.querySelectorAll('a[href]').forEach((link, i) => {
          elements.push({
            type: 'link',
            selector: `a:nth-of-type(${i+1})`,
            text: link.textContent?.trim().substring(0, 50),
            href: link.getAttribute('href')
          });
        });

        // Inputs
        document.querySelectorAll('input, textarea, select').forEach((input, i) => {
          elements.push({
            type: input.tagName.toLowerCase(),
            selector: `${input.tagName.toLowerCase()}:nth-of-type(${i+1})`,
            name: input.name,
            id: input.id,
            placeholder: input.placeholder
          });
        });

        // Forms
        document.querySelectorAll('form').forEach((form, i) => {
          elements.push({
            type: 'form',
            selector: `form:nth-of-type(${i+1})`,
            action: form.action,
            id: form.id
          });
        });

        // Clickable elements with onClick
        document.querySelectorAll('[onclick], [data-click]').forEach((el, i) => {
          elements.push({
            type: 'clickable',
            selector: `[onclick]:nth-of-type(${i+1})`,
            text: el.textContent?.trim().substring(0, 50)
          });
        });

        return elements;
      });

      interactions.forEach(interaction => {
        allInteractions.push({
          route,
          ...interaction
        });
      });

      console.log(`  Found ${interactions.length} interactive elements`);

    } catch (error) {
      console.error(`  ❌ Error analyzing ${route}:`, error.message);
    }
  }

  await browser.close();

  console.log(`\n✓ Total interactions discovered: ${allInteractions.length}`);
  return allInteractions;
}

const routes = JSON.parse(fs.readFileSync('.agent/discovered-routes.json', 'utf8'));
const interactions = await discoverInteractions(routes);
fs.writeFileSync('.agent/discovered-interactions.json', JSON.stringify(interactions, null, 2));
```

### 1.3 Discover All Data Dependencies

```javascript
// .agent/discover-data.mjs
import fs from 'fs';
import { glob } from 'glob';

async function discoverDataDependencies() {
  console.log('🔍 PHASE 1.3: Discovering data dependencies...');

  const dependencies = [];
  const files = await glob('src/**/*.{js,jsx,ts,tsx}');

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');

    // Find useState
    const stateMatches = content.matchAll(/useState\s*\(\s*([^)]*)\s*\)/g);
    for (const match of stateMatches) {
      dependencies.push({
        file,
        type: 'state',
        initialValue: match[1]
      });
    }

    // Find API calls
    const apiMatches = content.matchAll(/(?:fetch|axios)\s*\(\s*["'`]([^"'`]+)["'`]/g);
    for (const match of apiMatches) {
      dependencies.push({
        file,
        type: 'api',
        endpoint: match[1]
      });
    }

    // Find props access
    const propsMatches = content.matchAll(/props\.(\w+)/g);
    for (const match of propsMatches) {
      dependencies.push({
        file,
        type: 'prop',
        name: match[1]
      });
    }

    // Find array operations
    const arrayMatches = content.matchAll(/(\w+)\.map\(/g);
    for (const match of arrayMatches) {
      dependencies.push({
        file,
        type: 'array-map',
        variable: match[1]
      });
    }
  }

  console.log(`✓ Discovered ${dependencies.length} data dependencies`);
  return dependencies;
}

const deps = await discoverDataDependencies();
fs.writeFileSync('.agent/discovered-dependencies.json', JSON.stringify(deps, null, 2));
```

---

## PHASE 2: Systematic Interaction Testing

**Goal:** Test EVERY discovered interaction and capture ALL errors

### 2.1 Execute Interaction Tests

```javascript
// .agent/test-interactions.mjs
import { chromium } from 'playwright';
import fs from 'fs';

async function testAllInteractions() {
  console.log('\n🧪 PHASE 2: Testing all interactions...');

  const interactions = JSON.parse(fs.readFileSync('.agent/discovered-interactions.json', 'utf8'));
  const errors = [];

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage();

  // Capture all errors
  page.on('pageerror', error => {
    errors.push({
      id: `error-${errors.length + 1}`,
      type: 'pageerror',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push({
        id: `error-${errors.length + 1}`,
        type: 'console-error',
        message: msg.text(),
        timestamp: new Date().toISOString()
      });
    }
  });

  let tested = 0;
  let failed = 0;

  // Group interactions by route
  const byRoute = {};
  interactions.forEach(int => {
    if (!byRoute[int.route]) byRoute[int.route] = [];
    byRoute[int.route].push(int);
  });

  for (const [route, routeInteractions] of Object.entries(byRoute)) {
    console.log(`\n📍 Testing route: ${route} (${routeInteractions.length} interactions)`);

    try {
      await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      for (const interaction of routeInteractions) {
        tested++;
        const errorsBefore = errors.length;

        try {
          console.log(`  Testing ${interaction.type}: ${interaction.text || interaction.selector}`);

          switch (interaction.type) {
            case 'button':
              await page.locator(interaction.selector).first().click({ timeout: 5000 });
              break;

            case 'link':
              // Don't follow links that navigate away
              await page.locator(interaction.selector).first().click({ timeout: 5000 });
              await page.waitForTimeout(500);
              break;

            case 'input':
            case 'textarea':
              await page.locator(interaction.selector).first().fill('test input');
              await page.locator(interaction.selector).first().blur();
              break;

            case 'select':
              await page.locator(interaction.selector).first().selectOption({ index: 0 });
              break;

            case 'form':
              await page.locator(interaction.selector).evaluate(form => {
                form.dispatchEvent(new Event('submit', { cancelable: true }));
              });
              break;

            case 'clickable':
              await page.locator(interaction.selector).first().click({ timeout: 5000 });
              break;
          }

          await page.waitForTimeout(500);

          const errorsAfter = errors.length;
          if (errorsAfter > errorsBefore) {
            failed++;
            const newErrors = errors.slice(errorsBefore);
            newErrors.forEach(err => {
              err.interaction = interaction;
              err.route = route;
            });
            console.log(`    ❌ Caused ${errorsAfter - errorsBefore} error(s)`);
          } else {
            console.log(`    ✓ OK`);
          }

        } catch (testError) {
          console.log(`    ⚠️  Interaction failed: ${testError.message}`);
          errors.push({
            id: `error-${errors.length + 1}`,
            type: 'test-failure',
            message: testError.message,
            interaction,
            route,
            timestamp: new Date().toISOString()
          });
          failed++;
        }
      }

    } catch (error) {
      console.error(`  ❌ Route failed to load: ${error.message}`);
    }
  }

  await browser.close();

  console.log(`\n📊 Testing Summary:`);
  console.log(`   Total interactions tested: ${tested}`);
  console.log(`   Failed interactions: ${failed}`);
  console.log(`   Total errors captured: ${errors.length}`);

  return errors;
}

const errors = await testAllInteractions();
fs.writeFileSync('.agent/captured-errors.json', JSON.stringify(errors, null, 2));
```

---

## PHASE 3: Intelligent Error Analysis

**Goal:** Analyze each error and determine the fix strategy

### 3.1 Classify Errors

```javascript
// .agent/analyze-errors.mjs
import fs from 'fs';

function analyzeErrors() {
  console.log('\n🔬 PHASE 3: Analyzing errors...');

  const errors = JSON.parse(fs.readFileSync('.agent/captured-errors.json', 'utf8'));

  const analyzed = errors.map(error => {
    const analysis = {
      ...error,
      category: null,
      rootCause: null,
      fixStrategy: null,
      confidence: null
    };

    const msg = error.message || '';

    // Pattern 1: Cannot read properties of undefined
    if (msg.includes('Cannot read properties of undefined')) {
      const match = msg.match(/reading '(\w+)'/);
      analysis.category = 'undefined-property-access';
      analysis.rootCause = `Accessing property '${match?.[1]}' on undefined object`;
      analysis.fixStrategy = 'add-optional-chaining';
      analysis.confidence = 'high';
      analysis.propertyName = match?.[1];
    }

    // Pattern 2: Cannot read properties of null
    else if (msg.includes('Cannot read properties of null')) {
      const match = msg.match(/reading '(\w+)'/);
      analysis.category = 'null-property-access';
      analysis.rootCause = `Accessing property '${match?.[1]}' on null object`;
      analysis.fixStrategy = 'add-null-check';
      analysis.confidence = 'high';
      analysis.propertyName = match?.[1];
    }

    // Pattern 3: X is not a function
    else if (msg.includes('is not a function')) {
      const match = msg.match(/(\w+) is not a function/);
      analysis.category = 'not-a-function';
      analysis.rootCause = `Attempting to call ${match?.[1]} as function`;
      analysis.fixStrategy = 'add-function-check';
      analysis.confidence = 'medium';
      analysis.functionName = match?.[1];
    }

    // Pattern 4: map is not a function
    else if (msg.includes('.map is not a function')) {
      analysis.category = 'array-method-on-non-array';
      analysis.rootCause = 'Calling .map() on non-array value';
      analysis.fixStrategy = 'add-array-check';
      analysis.confidence = 'high';
    }

    // Pattern 5: undefined is not an object
    else if (msg.includes('undefined is not an object')) {
      analysis.category = 'undefined-object';
      analysis.rootCause = 'Expecting object but got undefined';
      analysis.fixStrategy = 'add-object-default';
      analysis.confidence = 'high';
    }

    // Pattern 6: Cannot destructure property
    else if (msg.includes('Cannot destructure property')) {
      analysis.category = 'destructure-undefined';
      analysis.rootCause = 'Destructuring from undefined/null';
      analysis.fixStrategy = 'add-destructure-default';
      analysis.confidence = 'high';
    }

    // Pattern 7: X is not iterable
    else if (msg.includes('is not iterable')) {
      analysis.category = 'not-iterable';
      analysis.rootCause = 'Attempting to iterate non-iterable value';
      analysis.fixStrategy = 'add-iterable-check';
      analysis.confidence = 'medium';
    }

    else {
      analysis.category = 'unknown';
      analysis.rootCause = 'Unclassified error';
      analysis.fixStrategy = 'manual-review';
      analysis.confidence = 'low';
    }

    return analysis;
  });

  // Group by category
  const byCategory = {};
  analyzed.forEach(err => {
    if (!byCategory[err.category]) byCategory[err.category] = [];
    byCategory[err.category].push(err);
  });

  console.log('\n📊 Error Categories:');
  Object.entries(byCategory).forEach(([cat, errs]) => {
    console.log(`   ${cat}: ${errs.length} errors`);
  });

  return analyzed;
}

const analyzed = analyzeErrors();
fs.writeFileSync('.agent/analyzed-errors.json', JSON.stringify(analyzed, null, 2));
```

### 3.2 Extract Error Locations

```javascript
// .agent/locate-errors.mjs
import fs from 'fs';

function locateErrors() {
  console.log('\n📍 PHASE 3.2: Locating error sources in code...');

  const errors = JSON.parse(fs.readFileSync('.agent/analyzed-errors.json', 'utf8'));

  const located = errors.map(error => {
    const location = {
      ...error,
      file: null,
      line: null,
      column: null,
      codeSnippet: null
    };

    // Parse stack trace
    if (error.stack) {
      const stackMatch = error.stack.match(/at\s+([^(]+)\s+\(([^:]+):(\d+):(\d+)\)/);
      if (stackMatch) {
        location.file = stackMatch[2].replace('http://localhost:3000/', '');
        location.line = parseInt(stackMatch[3]);
        location.column = parseInt(stackMatch[4]);
      }
    }

    // Read code snippet if we have file location
    if (location.file && location.line) {
      try {
        const content = fs.readFileSync(location.file, 'utf8');
        const lines = content.split('\n');
        const startLine = Math.max(0, location.line - 3);
        const endLine = Math.min(lines.length, location.line + 2);
        location.codeSnippet = lines.slice(startLine, endLine).join('\n');
        location.problemLine = lines[location.line - 1];
      } catch (e) {
        location.codeSnippet = 'Could not read file';
      }
    }

    return location;
  });

  console.log(`✓ Located ${located.filter(e => e.file).length} errors in source code`);

  return located;
}

const located = locateErrors();
fs.writeFileSync('.agent/located-errors.json', JSON.stringify(located, null, 2));
```

---

## PHASE 4: Automated Fix Application

**Goal:** Apply intelligent fixes based on error patterns

### 4.1 Fix Strategy Implementations

```javascript
// .agent/fix-strategies.mjs
import fs from 'fs';

const fixStrategies = {

  'add-optional-chaining': (error) => {
    if (!error.file || !error.problemLine) return null;

    const content = fs.readFileSync(error.file, 'utf8');
    const lines = content.split('\n');
    const problemLine = lines[error.line - 1];

    // Find the property access pattern
    const propertyPattern = new RegExp(`(\\w+)\\.${error.propertyName}`, 'g');

    // Replace with optional chaining
    const fixed = problemLine.replace(propertyPattern, `$1?.${error.propertyName}`);

    if (fixed !== problemLine) {
      lines[error.line - 1] = fixed;
      fs.writeFileSync(error.file, lines.join('\n'));
      return {
        success: true,
        original: problemLine,
        fixed: fixed,
        strategy: 'add-optional-chaining'
      };
    }

    return null;
  },

  'add-null-check': (error) => {
    if (!error.file || !error.problemLine) return null;

    const content = fs.readFileSync(error.file, 'utf8');
    const lines = content.split('\n');
    const problemLine = lines[error.line - 1];

    // Add null check before the line
    const indent = problemLine.match(/^\s*/)[0];
    const checkLine = `${indent}if (!variable) return null; // Auto-generated null check`;

    // Insert check before problem line
    lines.splice(error.line - 1, 0, checkLine);

    fs.writeFileSync(error.file, lines.join('\n'));
    return {
      success: true,
      original: problemLine,
      fixed: checkLine + '\n' + problemLine,
      strategy: 'add-null-check'
    };
  },

  'add-array-check': (error) => {
    if (!error.file || !error.problemLine) return null;

    const content = fs.readFileSync(error.file, 'utf8');
    const lines = content.split('\n');
    const problemLine = lines[error.line - 1];

    // Find .map pattern
    const mapPattern = /(\w+)\.map\(/g;
    const fixed = problemLine.replace(mapPattern, '(Array.isArray($1) ? $1 : []).map(');

    if (fixed !== problemLine) {
      lines[error.line - 1] = fixed;
      fs.writeFileSync(error.file, lines.join('\n'));
      return {
        success: true,
        original: problemLine,
        fixed: fixed,
        strategy: 'add-array-check'
      };
    }

    return null;
  },

  'add-object-default': (error) => {
    if (!error.file || !error.problemLine) return null;

    const content = fs.readFileSync(error.file, 'utf8');
    const lines = content.split('\n');
    const problemLine = lines[error.line - 1];

    // Find destructuring pattern
    const destructurePattern = /const\s*{\s*([^}]+)\s*}\s*=\s*(\w+)/;
    const match = problemLine.match(destructurePattern);

    if (match) {
      const fixed = problemLine.replace(match[2], `${match[2]} || {}`);
      lines[error.line - 1] = fixed;
      fs.writeFileSync(error.file, lines.join('\n'));
      return {
        success: true,
        original: problemLine,
        fixed: fixed,
        strategy: 'add-object-default'
      };
    }

    return null;
  }
};

export { fixStrategies };
```

### 4.2 Apply All Fixes

```javascript
// .agent/apply-fixes.mjs
import fs from 'fs';
import { fixStrategies } from './fix-strategies.mjs';

async function applyAllFixes() {
  console.log('\n🔧 PHASE 4: Applying fixes...');

  const errors = JSON.parse(fs.readFileSync('.agent/located-errors.json', 'utf8'));
  const fixes = [];

  for (const error of errors) {
    console.log(`\nFixing: ${error.id} (${error.category})`);
    console.log(`  File: ${error.file}:${error.line}`);
    console.log(`  Strategy: ${error.fixStrategy}`);

    if (!fixStrategies[error.fixStrategy]) {
      console.log(`  ⚠️  No automated fix available - needs manual review`);
      fixes.push({
        errorId: error.id,
        success: false,
        reason: 'No automated fix strategy'
      });
      continue;
    }

    try {
      const result = fixStrategies[error.fixStrategy](error);

      if (result) {
        console.log(`  ✓ Applied fix`);
        console.log(`    Before: ${result.original.trim()}`);
        console.log(`    After:  ${result.fixed.trim()}`);

        fixes.push({
          errorId: error.id,
          success: true,
          ...result
        });
      } else {
        console.log(`  ❌ Fix failed - couldn't apply pattern`);
        fixes.push({
          errorId: error.id,
          success: false,
          reason: 'Pattern match failed'
        });
      }

    } catch (fixError) {
      console.log(`  ❌ Fix error: ${fixError.message}`);
      fixes.push({
        errorId: error.id,
        success: false,
        reason: fixError.message
      });
    }
  }

  const successful = fixes.filter(f => f.success).length;
  const failed = fixes.filter(f => !f.success).length;

  console.log(`\n📊 Fix Summary:`);
  console.log(`   Successful: ${successful}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total: ${fixes.length}`);

  return fixes;
}

const fixes = await applyAllFixes();
fs.writeFileSync('.agent/applied-fixes.json', JSON.stringify(fixes, null, 2));
```

---

## PHASE 5: Fix Verification Loop

**Goal:** Verify each fix works and re-test

### 5.1 Verify Fixes

```javascript
// .agent/verify-fixes.mjs
import { chromium } from 'playwright';
import fs from 'fs';

async function verifyFixes() {
  console.log('\n✓ PHASE 5: Verifying fixes...');

  const errors = JSON.parse(fs.readFileSync('.agent/located-errors.json', 'utf8'));
  const fixes = JSON.parse(fs.readFileSync('.agent/applied-fixes.json', 'utf8'));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const verificationResults = [];

  for (const fix of fixes.filter(f => f.success)) {
    const error = errors.find(e => e.id === fix.errorId);
    if (!error || !error.interaction) continue;

    console.log(`\nVerifying fix for: ${fix.errorId}`);
    console.log(`  Interaction: ${error.interaction.type} on ${error.route}`);

    const capturedErrors = [];
    page.on('pageerror', err => capturedErrors.push(err.message));

    try {
      await page.goto(`http://localhost:3000${error.route}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      // Re-execute the interaction that caused the error
      switch (error.interaction.type) {
        case 'button':
          await page.locator(error.interaction.selector).first().click({ timeout: 5000 });
          break;
        case 'link':
          await page.locator(error.interaction.selector).first().click({ timeout: 5000 });
          break;
        // ... other interaction types
      }

      await page.waitForTimeout(1000);

      // Check if the specific error still occurs
      const stillHasError = capturedErrors.some(e =>
        e.includes(error.propertyName || error.message)
      );

      const result = {
        fixId: fix.errorId,
        verified: !stillHasError,
        newErrors: capturedErrors.length,
        status: stillHasError ? 'FAILED' : 'PASSED'
      };

      console.log(`  Status: ${result.status}`);
      if (result.newErrors > 0) {
        console.log(`  New errors: ${result.newErrors}`);
      }

      verificationResults.push(result);

    } catch (verifyError) {
      console.log(`  ⚠️  Verification failed: ${verifyError.message}`);
      verificationResults.push({
        fixId: fix.errorId,
        verified: false,
        error: verifyError.message,
        status: 'ERROR'
      });
    }
  }

  await browser.close();

  const passed = verificationResults.filter(r => r.status === 'PASSED').length;
  const failed = verificationResults.filter(r => r.status === 'FAILED').length;

  console.log(`\n📊 Verification Summary:`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total verified: ${verificationResults.length}`);

  return verificationResults;
}

const results = await verifyFixes();
fs.writeFileSync('.agent/verification-results.json', JSON.stringify(results, null, 2));
```

---

## PHASE 6: Self-Feeding Loop Control

**Goal:** Repeat the process until no errors remain

```javascript
// .agent/master-loop.mjs
import fs from 'fs';
import { execSync } from 'child_process';

async function masterLoop() {
  console.log('\n🤖 AUTONOMOUS RUNTIME REPAIR AGENT - MASTER LOOP');
  console.log('='repeat(60));

  const state = JSON.parse(fs.readFileSync('.agent/state.json', 'utf8'));
  state.started_at = new Date().toISOString();

  let iteration = 0;
  const maxIterations = state.max_iterations || 100;

  while (iteration < maxIterations) {
    iteration++;
    state.current_iteration = iteration;

    console.log(`\n\n${'='.repeat(60)}`);
    console.log(`ITERATION ${iteration}/${maxIterations}`);
    console.log('='.repeat(60));

    // PHASE 1: Discovery
    if (iteration === 1) {
      console.log('\n🔍 Running discovery phase...');
      execSync('node .agent/discover-routes.mjs', { stdio: 'inherit' });
      execSync('node .agent/discover-interactions.mjs', { stdio: 'inherit' });
      execSync('node .agent/discover-data.mjs', { stdio: 'inherit' });
    }

    // PHASE 2: Test all interactions
    console.log('\n🧪 Testing all interactions...');
    execSync('node .agent/test-interactions.mjs', { stdio: 'inherit' });

    const errors = JSON.parse(fs.readFileSync('.agent/captured-errors.json', 'utf8'));
    state.errors_found = errors.length;

    if (errors.length === 0) {
      console.log('\n🎉 SUCCESS! No errors found.');
      console.log('All runtime interactions are working correctly.');
      state.status = 'complete';
      fs.writeFileSync('.agent/state.json', JSON.stringify(state, null, 2));
      break;
    }

    console.log(`\n⚠️  Found ${errors.length} errors to fix`);

    // PHASE 3: Analyze errors
    console.log('\n🔬 Analyzing errors...');
    execSync('node .agent/analyze-errors.mjs', { stdio: 'inherit' });
    execSync('node .agent/locate-errors.mjs', { stdio: 'inherit' });

    // PHASE 4: Apply fixes
    console.log('\n🔧 Applying fixes...');
    execSync('node .agent/apply-fixes.mjs', { stdio: 'inherit' });

    const fixes = JSON.parse(fs.readFileSync('.agent/applied-fixes.json', 'utf8'));
    const successful = fixes.filter(f => f.success).length;
    state.errors_fixed += successful;

    if (successful === 0) {
      console.log('\n❌ No fixes could be applied automatically.');
      console.log('Manual intervention required.');
      state.status = 'needs-manual-review';
      fs.writeFileSync('.agent/state.json', JSON.stringify(state, null, 2));
      break;
    }

    // PHASE 5: Verify fixes
    console.log('\n✓ Verifying fixes...');
    execSync('node .agent/verify-fixes.mjs', { stdio: 'inherit' });

    const verification = JSON.parse(fs.readFileSync('.agent/verification-results.json', 'utf8'));
    const verified = verification.filter(v => v.status === 'PASSED').length;

    console.log(`\n📊 Iteration ${iteration} Summary:`);
    console.log(`   Errors found: ${errors.length}`);
    console.log(`   Fixes applied: ${successful}`);
    console.log(`   Fixes verified: ${verified}`);

    // Commit this iteration's changes
    try {
      execSync(`git add .`, { stdio: 'ignore' });
      execSync(`git commit -m "AI Agent: Fix ${successful} runtime errors [iteration-${iteration}]"`, { stdio: 'ignore' });
      console.log(`\n✓ Committed iteration ${iteration} changes`);
    } catch (e) {
      console.log(`\n⚠️  Nothing to commit`);
    }

    // Update state
    fs.writeFileSync('.agent/state.json', JSON.stringify(state, null, 2));

    // If we verified all fixes, loop again to check for new errors
    if (verified === successful && errors.length > 0) {
      console.log('\n↻ Continuing to next iteration...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      continue;
    }

    // If no progress, stop
    if (verified === 0) {
      console.log('\n⚠️  No progress made. Stopping.');
      state.status = 'stalled';
      fs.writeFileSync('.agent/state.json', JSON.stringify(state, null, 2));
      break;
    }
  }

  // Final report
  console.log('\n\n' + '='.repeat(60));
  console.log('FINAL REPORT');
  console.log('='.repeat(60));
  console.log(`\nIterations: ${iteration}`);
  console.log(`Total errors found: ${state.errors_found}`);
  console.log(`Total errors fixed: ${state.errors_fixed}`);
  console.log(`Status: ${state.status}`);
  console.log(`\nLogs saved to .agent/ directory`);
  console.log(`Review ERROR_LOG.md and FIX_LOG.md for details`);
}

masterLoop().catch(console.error);
```

---

## Complete Execution Command

```bash
#!/bin/bash
# autonomous-repair.sh - Single command to run entire agent

echo "🤖 Starting Autonomous Runtime Repair Agent..."

# 1. Initialize
mkdir -p .agent
npm install -D playwright glob

# 2. Create all agent scripts
# (Copy all the scripts above into .agent/)

# 3. Start dev server in background
npm run dev &
DEV_PID=$!
echo "Started dev server (PID: $DEV_PID)"

# Wait for server to be ready
sleep 10

# 4. Run master loop
node .agent/master-loop.mjs

# 5. Stop dev server
kill $DEV_PID

echo "✅ Agent complete. Check .agent/ for results."
```

---

## Agent Decision Tree (For AI to Follow)

```
START
  ↓
Discover all routes/interactions/data
  ↓
Test all interactions → Capture errors
  ↓
  Are there errors?
    NO → ✅ SUCCESS - Exit
    YES → Continue
  ↓
Analyze errors → Classify by pattern
  ↓
  Can we auto-fix?
    YES → Apply fixes
    NO → Log for manual review → Exit
  ↓
Verify fixes work
  ↓
  Did fixes work?
    YES → Commit changes → Loop back to test
    NO → Try different strategy → Loop back
  ↓
  Made progress?
    YES → Continue loop
    NO → Exit (needs manual review)
  ↓
Repeat until:
  - Zero errors found, OR
  - Max iterations reached, OR
  - No progress possible
  ↓
END - Generate report
```

---

## Success Criteria

Agent continues until:
- ✅ **Zero runtime errors** across all interactions
- ✅ **All fixes verified** working
- ✅ **All changes committed** to git
- ✅ **Complete documentation** generated

Agent stops and flags for review if:
- ❌ No progress after 3 iterations
- ❌ Same errors keep appearing
- ❌ Unable to locate error source
- ❌ Unknown error pattern
- ❌ Max iterations reached

---

## Final Output

After completion, agent generates:

```
.agent/
  ├── state.json              # Final state
  ├── ERROR_LOG.md            # All errors found
  ├── FIX_LOG.md              # All fixes applied
  ├── REPORT.md               # Executive summary
  ├── discovered-routes.json
  ├── discovered-interactions.json
  ├── captured-errors.json
  ├── analyzed-errors.json
  ├── located-errors.json
  ├── applied-fixes.json
  └── verification-results.json
```

**The agent has now completed a full self-feeding loop of: Discover → Test → Detect → Analyze → Fix → Verify → Repeat**