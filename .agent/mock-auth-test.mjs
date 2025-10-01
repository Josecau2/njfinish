import { chromium } from 'playwright';
import fs from 'fs';

async function testWithMockAuth() {
  console.log('\n🔐 MOCK AUTH TESTING: Simulating authenticated state...');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];

  // Capture all errors
  page.on('pageerror', error => {
    errors.push({
      id: `error-${errors.length + 1}`,
      type: 'pageerror',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: page.url()
    });
    console.log(`    ❌ PAGE ERROR: ${error.message}`);
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push({
        id: `error-${errors.length + 1}`,
        type: 'console-error',
        message: msg.text(),
        timestamp: new Date().toISOString(),
        url: page.url()
      });
      console.log(`    ❌ CONSOLE ERROR: ${msg.text()}`);
    }
  });

  try {
    // Go to login page first
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });

    // Mock authentication by setting localStorage tokens and cookies
    await page.evaluate(() => {
      // Common auth patterns
      localStorage.setItem('token', 'mock-jwt-token');
      localStorage.setItem('authToken', 'mock-auth-token');
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'test@example.com',
        role: 'admin',
        name: 'Test User'
      }));
      localStorage.setItem('isAuthenticated', 'true');

      // Redux-like state
      localStorage.setItem('persist:auth', JSON.stringify({
        isAuthenticated: true,
        user: { id: 1, email: 'test@example.com' },
        token: 'mock-token'
      }));
    });

    // Set auth cookies
    await page.context().addCookies([
      {
        name: 'authToken',
        value: 'mock-jwt-token',
        domain: 'localhost',
        path: '/'
      },
      {
        name: 'sessionId',
        value: 'mock-session-123',
        domain: 'localhost',
        path: '/'
      }
    ]);

    console.log('✅ Mock authentication state set');

    // Now test the problematic routes
    const criticalRoutes = [
      '/payments',
      '/customers',
      '/orders',
      '/dashboard',
      '/admin/contractors',
      '/quotes'
    ];

    for (const route of criticalRoutes) {
      console.log(`\n📍 Testing authenticated route: ${route}`);
      const errorsBefore = errors.length;

      try {
        await page.goto(`http://localhost:3000${route}`, {
          waitUntil: 'networkidle',
          timeout: 15000
        });

        // Wait a bit longer for any async data loading
        await page.waitForTimeout(3000);

        console.log(`  Current URL: ${page.url()}`);

        // Check if we're still on the intended route (not redirected to login)
        const currentPath = new URL(page.url()).pathname;
        if (currentPath === route || currentPath === '/login') {
          console.log(`  Route loaded successfully`);

          // Test some interactions that might trigger the PaymentsList error
          try {
            // Look for any data tables or lists that might have the problematic mapping
            const hasDataTables = await page.evaluate(() => {
              const tables = document.querySelectorAll('table, [data-table], .table');
              const lists = document.querySelectorAll('[data-list], .list, .data-grid');
              return tables.length + lists.length;
            });

            console.log(`    Found ${hasDataTables} data tables/lists`);

            // Try to trigger any data loading by interacting with filters, search, etc.
            const filterButtons = await page.locator('button:has-text("Filter"), button:has-text("Search"), button:has-text("Load")').count();
            if (filterButtons > 0) {
              console.log(`    Clicking filter/search buttons...`);
              await page.locator('button:has-text("Filter"), button:has-text("Search"), button:has-text("Load")').first().click();
              await page.waitForTimeout(2000);
            }

          } catch (interactionError) {
            console.log(`    Interaction failed: ${interactionError.message}`);
          }

        } else {
          console.log(`  Route redirected to: ${currentPath}`);
        }

        const errorsAfter = errors.length;
        if (errorsAfter > errorsBefore) {
          console.log(`  ❌ Route caused ${errorsAfter - errorsBefore} error(s)`);
          const newErrors = errors.slice(errorsBefore);
          newErrors.forEach(err => err.route = route);
        } else {
          console.log(`  ✅ Route clean`);
        }

      } catch (routeError) {
        console.log(`  ❌ Route failed: ${routeError.message}`);
        errors.push({
          id: `error-${errors.length + 1}`,
          type: 'route-failure',
          message: routeError.message,
          route,
          timestamp: new Date().toISOString()
        });
      }
    }

  } catch (setupError) {
    console.error(`Setup failed: ${setupError.message}`);
  }

  await browser.close();

  console.log(`\n📊 Mock Auth Testing Summary:`);
  console.log(`   Total errors found: ${errors.length}`);

  if (errors.length > 0) {
    console.log(`\n❌ Errors found:`);
    errors.forEach((error, i) => {
      console.log(`   ${i+1}. ${error.type}: ${error.message.substring(0, 100)}`);
    });
  }

  return errors;
}

const errors = await testWithMockAuth();
fs.writeFileSync('mock-auth-errors.json', JSON.stringify(errors, null, 2));