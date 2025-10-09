#!/usr/bin/env node

/**
 * Verification Script for Authentication System Fixes
 * Tests all 6 critical authentication fixes
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
  console.log('\n' + '='.repeat(80));
  log(message, 'cyan');
  console.log('='.repeat(80));
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function fail(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Test results
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(description, testFn) {
  totalTests++;
  try {
    const result = testFn();
    if (result) {
      passedTests++;
      success(description);
    } else {
      failedTests++;
      fail(description);
    }
  } catch (error) {
    failedTests++;
    fail(`${description} - Error: ${error.message}`);
  }
}

// Helper to read file content
function readFile(relativePath) {
  const fullPath = path.join(__dirname, '..', relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

// Helper to check if file contains pattern
function fileContains(relativePath, pattern, description) {
  const content = readFile(relativePath);
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  return regex.test(content);
}

// Helper to check if file does NOT contain pattern
function fileDoesNotContain(relativePath, pattern, description) {
  return !fileContains(relativePath, pattern, description);
}

// =============================================================================
// ISSUE #1: Centralized Logout Utility
// =============================================================================
header('Issue #1: Centralized Logout Utility');

test('performLogout utility exists', () => {
  return fs.existsSync(path.join(__dirname, '..', 'frontend/src/utils/logout.js'));
});

test('performLogout accepts suppressBroadcast option', () => {
  return fileContains('frontend/src/utils/logout.js', /suppressBroadcast\s*[=:]/);
});

test('performLogout calls backend /api/auth/logout', () => {
  return fileContains('frontend/src/utils/logout.js', /fetch\(['"`]\/api\/auth\/logout['"`]/);
});

test('performLogout sets suppression flag', () => {
  return fileContains('frontend/src/utils/logout.js', /__SUPPRESS_LOGOUT_BROADCAST__/);
});

test('AppHeaderDropdown uses performLogout', () => {
  const content = readFile('frontend/src/components/header/AppHeaderDropdown.js');
  return content.includes('performLogout') && content.includes("reason: 'manual'");
});

test('axiosInstance handleUnauthorized uses performLogout', () => {
  return fileContains('frontend/src/helpers/axiosInstance.js', /performLogout.*reason/);
});

test('ProtectedRoute uses performLogout', () => {
  const content = readFile('frontend/src/components/ProtectedRoute.jsx');
  return content.includes('performLogout') && content.includes('session-invalid');
});

test('index.jsx bootstrap uses performLogout', () => {
  const content = readFile('frontend/src/index.jsx');
  return content.includes('performLogout') && content.includes('token-expired-boot');
});

// =============================================================================
// ISSUE #2: Remove Duplicate User Storage
// =============================================================================
header('Issue #2: Remove Duplicate User Storage');

test('useCurrentUser hook exists', () => {
  return fs.existsSync(path.join(__dirname, '..', 'frontend/src/hooks/useCurrentUser.js'));
});

test('useCurrentUser uses Redux selector', () => {
  return fileContains('frontend/src/hooks/useCurrentUser.js', /useSelector.*state\.auth\?\.user/);
});

test('LoginPage does NOT write user to localStorage', () => {
  return fileDoesNotContain('frontend/src/pages/auth/LoginPage.jsx', /localStorage\.setItem\(['"`]user['"`]/);
});

test('authSlice logout clears user from localStorage', () => {
  const content = readFile('frontend/src/store/slices/authSlice.js');
  return content.includes("'user'") && content.includes('localStorage.removeItem');
});

info('Note: 11 component files still need to be migrated to useCurrentUser hook');

// =============================================================================
// ISSUE #3: Fix Silent Permission Failures
// =============================================================================
header('Issue #3: Fix Silent Permission Failures');

test('attachPermissions returns 500 on error', () => {
  const content = readFile('middleware/permissions.js');
  const attachPermissionsMatch = content.match(/exports\.attachPermissions[\s\S]*?catch[\s\S]*?{[\s\S]*?}/);
  if (!attachPermissionsMatch) return false;
  const catchBlock = attachPermissionsMatch[0];
  return catchBlock.includes('res.status(500)') && catchBlock.includes('CRITICAL');
});

test('injectGroupScoping returns 500 on error', () => {
  const content = readFile('middleware/permissions.js');
  const injectScopingMatch = content.match(/exports\.injectGroupScoping[\s\S]*?catch[\s\S]*?{[\s\S]*?}/);
  if (!injectScopingMatch) return false;
  const catchBlock = injectScopingMatch[0];
  return catchBlock.includes('res.status(500)') && catchBlock.includes('CRITICAL');
});

test('attachPermissions does NOT call next() on error', () => {
  const content = readFile('middleware/permissions.js');
  const attachPermissionsMatch = content.match(/exports\.attachPermissions[\s\S]*?^};$/m);
  if (!attachPermissionsMatch) return false;
  const func = attachPermissionsMatch[0];
  const catchMatch = func.match(/catch\s*\([^)]*\)\s*{([^}]*)}/);
  if (!catchMatch) return false;
  return !catchMatch[1].includes('next()');
});

test('injectGroupScoping does NOT call next() on error', () => {
  const content = readFile('middleware/permissions.js');
  const injectScopingMatch = content.match(/exports\.injectGroupScoping[\s\S]*?^};$/m);
  if (!injectScopingMatch) return false;
  const func = injectScopingMatch[0];
  const catchMatch = func.match(/catch\s*\([^)]*\)\s*{([^}]*)}/);
  if (!catchMatch) return false;
  return !catchMatch[1].includes('next()');
});

// =============================================================================
// ISSUE #4: Remove httpOnly Cookie Clearing
// =============================================================================
header('Issue #4: Remove httpOnly Cookie Clearing');

test('authSlice does NOT attempt to clear authToken cookie', () => {
  return fileDoesNotContain('frontend/src/store/slices/authSlice.js', /document\.cookie.*authToken/);
});

test('authSlice does NOT have cookiesToClear loop', () => {
  return fileDoesNotContain('frontend/src/store/slices/authSlice.js', /cookiesToClear\.forEach/);
});

test('authToken.js only clears authSession cookie', () => {
  const content = readFile('frontend/src/utils/authToken.js');
  const hasAuthSession = /authSession/.test(content);
  const hasAuthTokenCookie = /cookie.*authToken|authToken.*cookie/i.test(content);
  return hasAuthSession && !hasAuthTokenCookie;
});

info('Note: browserCleanup.js still attempts to clear all cookies (not critical)');

// =============================================================================
// ISSUE #5: Fix Cookie SameSite Downgrade
// =============================================================================
header('Issue #5: Fix Cookie SameSite Downgrade');

test('setAuthCookies throws error for SameSite=None without Secure', () => {
  const content = readFile('utils/authCookies.js');
  const setAuthCookiesMatch = content.match(/function setAuthCookies[\s\S]*?(?=\nfunction|\n\/\/|\Z)/);
  if (!setAuthCookiesMatch) return false;
  const func = setAuthCookiesMatch[0];
  return /toLowerCase\(\)\s*===\s*['"`]none['"`]/.test(func) &&
         /throw new Error/.test(func) &&
         /SECURITY ERROR/.test(func);
});

test('clearAuthCookies throws error for SameSite=None without Secure', () => {
  const content = readFile('utils/authCookies.js');
  const clearAuthCookiesMatch = content.match(/function clearAuthCookies[\s\S]*?(?=\nfunction|\n\/\/|\Z)/);
  if (!clearAuthCookiesMatch) return false;
  const func = clearAuthCookiesMatch[0];
  return /toLowerCase\(\)\s*===\s*['"`]none['"`]/.test(func) &&
         /throw new Error/.test(func) &&
         /SECURITY ERROR/.test(func);
});

test('Development warning added for SameSite=None', () => {
  const content = readFile('utils/authCookies.js');
  return content.includes('process.env.NODE_ENV === \'development\'') &&
         content.includes('SameSite=None requires HTTPS');
});

test('.env.example documents COOKIE_SAMESITE options', () => {
  const content = readFile('.env.example');
  return content.includes('AUTH_COOKIE_SAMESITE') &&
         content.includes('strict') &&
         content.includes('requires HTTPS');
});

// =============================================================================
// ISSUE #6: Add JWT Algorithm Specification
// =============================================================================
header('Issue #6: Add JWT Algorithm Specification');

test('middleware/auth.js defines JWT_VERIFY_OPTIONS', () => {
  return fileContains('middleware/auth.js', /JWT_VERIFY_OPTIONS.*algorithms.*HS256/);
});

test('verifyToken uses JWT_VERIFY_OPTIONS', () => {
  const content = readFile('middleware/auth.js');
  const verifyTokenMatch = content.match(/verifyToken[\s\S]*?jwt\.verify[\s\S]*?\)/);
  if (!verifyTokenMatch) return false;
  return verifyTokenMatch[0].includes('JWT_VERIFY_OPTIONS');
});

test('verifyTokenWithGroup uses JWT_VERIFY_OPTIONS', () => {
  const content = readFile('middleware/auth.js');
  const verifyTokenWithGroupMatch = content.match(/verifyTokenWithGroup[\s\S]*?jwt\.verify[\s\S]*?\)/);
  if (!verifyTokenWithGroupMatch) return false;
  return verifyTokenWithGroupMatch[0].includes('JWT_VERIFY_OPTIONS');
});

test('Token refresh in middleware specifies HS256', () => {
  return fileContains('middleware/auth.js', /jwt\.sign\s*\([^)]*[\s\S]*?algorithm\s*:\s*['"`]HS256['"`]/m);
});

test('createSessionToken specifies HS256', () => {
  const content = readFile('controllers/authController.js');
  const createSessionTokenMatch = content.match(/const createSessionToken[\s\S]*?;/);
  if (!createSessionTokenMatch) return false;
  return /algorithm\s*:\s*['"`]HS256['"`]/.test(createSessionTokenMatch[0]);
});

test('createApiToken specifies HS256', () => {
  const content = readFile('controllers/authController.js');
  const createApiTokenMatch = content.match(/const createApiToken[\s\S]*?;/);
  if (!createApiTokenMatch) return false;
  return /algorithm\s*:\s*['"`]HS256['"`]/.test(createApiTokenMatch[0]);
});

test('Auth ping endpoint specifies HS256', () => {
  return fileContains('routes/apiRoutes.js', /jwt\.sign.*algorithm.*HS256/);
});

// =============================================================================
// SUMMARY
// =============================================================================
header('Test Summary');

const percentage = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

console.log(`\nTotal Tests: ${totalTests}`);
log(`Passed: ${passedTests}`, 'green');
if (failedTests > 0) {
  log(`Failed: ${failedTests}`, 'red');
} else {
  log(`Failed: ${failedTests}`, 'green');
}
log(`Success Rate: ${percentage}%`, percentage === 100 ? 'green' : 'yellow');

if (failedTests === 0) {
  console.log('\n');
  log('🎉 ALL TESTS PASSED! Authentication fixes verified successfully.', 'green');
  console.log('\n');
  process.exit(0);
} else {
  console.log('\n');
  log(`⚠️  ${failedTests} test(s) failed. Please review the failures above.`, 'yellow');
  console.log('\n');
  process.exit(1);
}
