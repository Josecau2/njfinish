import { chromium } from 'playwright';
import fs from 'fs';

async function findPaymentListErrors() {
  console.log('\n🎯 TARGETED SEARCH: Looking for PaymentsList component errors...');

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  const errors = [];

  // Enhanced error capture specifically for React errors
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
    if (error.stack) {
      console.log(`   Stack: ${error.stack.split('\n')[0]}`);
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

      // Check if this is a PaymentsList related error
      if (text.includes('PaymentsList') || text.includes('gateway') || text.includes('payment')) {
        console.log(`🎯 PAYMENT ERROR DETECTED!`);
      }
    }
  });

  try {
    console.log('1. Going to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });

    console.log('2. Trying to trigger PaymentsList component directly...');

    // Instead of authentication, let's try to manually trigger the component with mock data
    await page.evaluate(() => {
      // Inject mock payment data that might trigger the error
      window.mockPaymentData = [
        { id: 1, amount: 100 }, // Missing gateway property!
        { id: 2, amount: 200, gateway: null }, // Null gateway
        { id: 3, amount: 300, gateway: undefined }, // Undefined gateway
        { id: 4, amount: 400, gateway: 'stripe' }, // Valid data
      ];

      // Try to manually trigger the error by simulating what PaymentsList does
      try {
        const payments = window.mockPaymentData;

        // This simulates the map operation in PaymentsList
        payments.map((payment) => {
          // This is line 360 equivalent - accessing gateway directly
          const gateway = payment.gateway; // This should be payment?.gateway
          console.log('Testing payment gateway access:', gateway);

          // This should trigger the error for undefined payments
          const canPayOnline = payment.gateway === 'stripe' && payment.status === 'pending';
          console.log('Can pay online:', canPayOnline);

          return payment;
        });

      } catch (testError) {
        console.error('Manual test error:', testError);
        throw testError;
      }
    });

    console.log('3. Attempting to navigate to payments page...');
    await page.goto('http://localhost:3000/payments', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('4. Looking for React ErrorBoundary messages...');

    // Check for ErrorBoundary activation
    const errorBoundaryActive = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('[data-error-boundary], .error-boundary');
      const errorText = document.body.textContent;
      return {
        hasErrorElements: errorElements.length > 0,
        hasErrorText: errorText.includes('error occurred') || errorText.includes('ErrorBoundary'),
        bodyText: errorText.substring(0, 500)
      };
    });

    if (errorBoundaryActive.hasErrorElements || errorBoundaryActive.hasErrorText) {
      console.log(`🎯 ErrorBoundary activated! Error caught in UI.`);
      console.log(`Body text: ${errorBoundaryActive.bodyText}`);
    }

    console.log('5. Testing direct component interaction...');

    // Try to interact with any payment-related elements
    try {
      const paymentElements = await page.locator('[data-testid*="payment"], [class*="payment"], button:has-text("Pay")').count();
      console.log(`Found ${paymentElements} payment-related elements`);

      if (paymentElements > 0) {
        console.log('Clicking first payment element...');
        await page.locator('[data-testid*="payment"], [class*="payment"], button:has-text("Pay")').first().click();
        await page.waitForTimeout(1000);
      }
    } catch (interactionError) {
      console.log(`Interaction failed: ${interactionError.message}`);
    }

    console.log('6. Checking for React DevTools errors...');

    // Check the browser console for additional errors
    const logs = await page.evaluate(() => {
      return window.__REACT_DEVTOOLS_GLOBAL_HOOK__ ? 'React DevTools detected' : 'No React DevTools';
    });
    console.log(`React status: ${logs}`);

  } catch (testError) {
    console.error(`Test setup failed: ${testError.message}`);
    errors.push({
      id: `error-${errors.length + 1}`,
      type: 'test-setup-error',
      message: testError.message,
      timestamp: new Date().toISOString()
    });
  }

  await page.waitForTimeout(5000); // Give time for any async errors
  await browser.close();

  console.log(`\n📊 Targeted Error Search Results:`);
  console.log(`   Total errors found: ${errors.length}`);

  if (errors.length > 0) {
    console.log(`\n❌ Errors found:`);
    errors.forEach((error, i) => {
      console.log(`   ${i+1}. [${error.type}] ${error.message}`);
      if (error.stack) {
        console.log(`      Stack: ${error.stack.split('\n')[0]}`);
      }
    });
  } else {
    console.log(`✅ No errors found in this test run`);
  }

  return errors;
}

const errors = await findPaymentListErrors();
fs.writeFileSync('payment-errors.json', JSON.stringify(errors, null, 2));