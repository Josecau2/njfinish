import { chromium } from 'playwright';
import fs from 'fs';

async function testWithRealAuth() {
  console.log('\n🔐 REAL AUTH TESTING: Using actual credentials...');

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage();
  const errors = [];

  // Enhanced error capture for PaymentsList specific errors
  page.on('pageerror', error => {
    errors.push({
      id: `error-${errors.length + 1}`,
      type: 'pageerror',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: page.url()
    });
    console.log(`❌ PAGE ERROR: ${error.message}`);
    if (error.message.includes('gateway') || error.message.includes('PaymentsList')) {
      console.log(`🎯 PAYMENTLIST ERROR DETECTED!`);
    }
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      errors.push({
        id: `error-${errors.length + 1}`,
        type: 'console-error',
        message: text,
        timestamp: new Date().toISOString(),
        url: page.url()
      });
      console.log(`❌ CONSOLE ERROR: ${text}`);

      if (text.includes('PaymentsList') || text.includes('gateway') || text.includes('payment')) {
        console.log(`🎯 PAYMENT-RELATED ERROR FOUND!`);
      }
    }
  });

  try {
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });

    console.log('2. Filling login credentials...');
    await page.fill('input[name="email"], input[type="email"]', 'joseca@symmetricalwolf.com');
    await page.fill('input[name="password"], input[type="password"]', 'admin123');

    console.log('3. Submitting login form...');
    await page.click('button[type="submit"], button:has-text("Sign In")');

    // Wait for authentication and redirect
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);

    if (currentUrl.includes('/login')) {
      console.log('❌ Still on login page - authentication may have failed');
      // Try alternative login method
      await page.click('button:has-text("Sign In"), input[type="submit"]');
      await page.waitForTimeout(3000);
    }

    console.log('4. Testing critical routes where PaymentsList errors occur...');

    const criticalRoutes = [
      '/payments',
      '/customers',
      '/orders',
      '/dashboard',
      '/admin/contractors',
      '/quotes'
    ];

    for (const route of criticalRoutes) {
      console.log(`\n📍 Testing route: ${route}`);
      const errorsBefore = errors.length;

      try {
        await page.goto(`http://localhost:3000${route}`, { timeout: 15000 });
        await page.waitForTimeout(3000); // Wait for data loading

        console.log(`  Current URL: ${page.url()}`);

        // Check if ErrorBoundary is visible (indicates a caught error)
        const errorBoundaryVisible = await page.isVisible('.error-boundary, [data-error-boundary]').catch(() => false);
        if (errorBoundaryVisible) {
          console.log(`  🎯 ErrorBoundary is visible - component crashed!`);

          const errorText = await page.textContent('.error-boundary, [data-error-boundary]');
          console.log(`  Error text: ${errorText}`);

          errors.push({
            id: `error-${errors.length + 1}`,
            type: 'error-boundary-triggered',
            message: `ErrorBoundary activated on ${route}: ${errorText}`,
            route,
            timestamp: new Date().toISOString()
          });
        }

        // Look for data tables and try to trigger data loading
        const hasDataElements = await page.evaluate(() => {
          const tables = document.querySelectorAll('table, [role="table"]');
          const dataGrids = document.querySelectorAll('[data-grid], .data-table, .payments-list');
          return { tables: tables.length, grids: dataGrids.length };
        });

        console.log(`  Found tables: ${hasDataElements.tables}, grids: ${hasDataElements.grids}`);

        // Try to trigger data loading by scrolling and interacting
        if (hasDataElements.tables > 0 || hasDataElements.grids > 0) {
          console.log(`  Scrolling to trigger any lazy loading...`);
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          await page.waitForTimeout(2000);

          // Try clicking any filter/load buttons
          const actionButtons = await page.locator('button:has-text("Load"), button:has-text("Filter"), button:has-text("Search"), button:has-text("Refresh")').count();
          if (actionButtons > 0) {
            console.log(`  Clicking action buttons to trigger data loading...`);
            await page.locator('button:has-text("Load"), button:has-text("Filter"), button:has-text("Search"), button:has-text("Refresh")').first().click();
            await page.waitForTimeout(3000);
          }
        }

        const errorsAfter = errors.length;
        if (errorsAfter > errorsBefore) {
          console.log(`  ❌ Route caused ${errorsAfter - errorsBefore} new error(s)`);
          const newErrors = errors.slice(errorsBefore);
          newErrors.forEach(err => err.route = route);
        } else {
          console.log(`  ✅ Route appears clean`);
        }

      } catch (routeError) {
        console.log(`  ❌ Route failed to load: ${routeError.message}`);
        errors.push({
          id: `error-${errors.length + 1}`,
          type: 'route-load-failure',
          message: routeError.message,
          route,
          timestamp: new Date().toISOString()
        });
      }
    }

    console.log('\n5. Specifically testing PaymentsList component...');

    // Go to payments page and wait for potential errors
    try {
      await page.goto('http://localhost:3000/payments', { waitUntil: 'networkidle' });
      await page.waitForTimeout(5000); // Wait for component to fully load and data to populate

      // Check for the specific PaymentsList component
      const hasPaymentsList = await page.evaluate(() => {
        return document.querySelector('[data-testid="payments-list"], .payments-list, .payment-table') !== null;
      });

      console.log(`PaymentsList component present: ${hasPaymentsList}`);

      // If no errors so far, the component might be working correctly with our fixes
      if (errors.length === 0) {
        console.log('✅ PaymentsList appears to be working correctly with null safety fixes!');
      }

    } catch (paymentsError) {
      console.log(`❌ Payments page error: ${paymentsError.message}`);
    }

  } catch (authError) {
    console.error(`Authentication test failed: ${authError.message}`);
  }

  // Keep browser open for a moment to see any delayed errors
  await page.waitForTimeout(3000);
  await browser.close();

  console.log(`\n📊 Real Authentication Test Results:`);
  console.log(`   Total errors found: ${errors.length}`);

  if (errors.length > 0) {
    console.log(`\n❌ Errors discovered:`);
    errors.forEach((error, i) => {
      console.log(`   ${i+1}. [${error.type}] ${error.message.substring(0, 150)}`);
      if (error.route) {
        console.log(`      Route: ${error.route}`);
      }
    });
  } else {
    console.log(`✅ No runtime errors found - PaymentsList fixes appear successful!`);
  }

  return errors;
}

const errors = await testWithRealAuth();
fs.writeFileSync('real-auth-errors.json', JSON.stringify(errors, null, 2));